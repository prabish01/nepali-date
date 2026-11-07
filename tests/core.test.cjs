'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {readFileSync}=require('node:fs');
const {spawnSync}=require('node:child_process');
const api=require('../dist/index.cjs');
const {BSDate,parseBS,formatBS,adToBS,bsToAD,daysInMonth,fromInstant,toInstant}=api;
const table=JSON.parse(readFileSync(new URL('../data/calendar.json',`file://${__filename}`),'utf8'));
const anchors=require('./fixtures/anchors.json');
function civil(s) { const [year,month,day]=s.split('-').map(Number); return {year,month,day}; }
function iso(d) { return `${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`; }
for (const anchor of anchors) test(`independent reference ${anchor.bs} = ${anchor.ad}`,()=>{
  assert.deepEqual(bsToAD(civil(anchor.bs)),civil(anchor.ad));
  assert.equal(adToBS(civil(anchor.ad)).toString(),anchor.bs);
});
test('all 39,813 days are contiguous, round-trip both ways and parse in both numeral systems',()=>{
  let count=0;
  const origin=Date.UTC(1918,3,13);
  for(let y=1975;y<=2083;y++) for(let m=1;m<=12;m++) {
    assert.equal(table.months[y].length,12);
    assert.ok([365,366].includes(table.months[y].reduce((a,b)=>a+b,0)));
    assert.ok(daysInMonth(y,m)>=29 && daysInMonth(y,m)<=32);
    for(let day=1;day<=daysInMonth(y,m);day++) {
      const bs=new BSDate(y,m,day), ad=bs.toAD();
      assert.equal(Date.parse(iso(ad)+'T00:00:00Z'),origin+count*86400000);
      assert.equal(adToBS(ad).toString(),bs.toString());
      assert.equal(bs.weekday,new Date(origin+count*86400000).getUTCDay());
      assert.equal(parseBS(bs.toString()).toString(),bs.toString());
      assert.equal(parseBS(bs.format('YYYY-MM-DD',{locale:'ne'})).toString(),bs.toString());
      count++;
    }
  }
  assert.equal(count,39813);
  assert.equal(count,api.calendarInfo().totalDays);
  assert.equal(iso(new BSDate(2083,12,30).toAD()),table.lastAD);
});
test('data hashes reproduce the pinned CSV and transformed subset',()=>{
  const sha=v=>createHash('sha256').update(v).digest('hex');
  assert.equal(sha(readFileSync(new URL('../data/upstream/calendar_bs.csv',`file://${__filename}`))),table.sourceSha256);
  assert.equal(sha(JSON.stringify(table.months)),table.monthsSha256);
  const lines=readFileSync(new URL('../data/upstream/calendar_bs.csv',`file://${__filename}`),'utf8').trim().split(/\r?\n/).slice(1);
  const expected=Object.fromEntries(lines.map(line=>line.split(',')).filter(r=>+r[0]<=2083).map(([year,...months])=>[year,months.map(Number)]));
  assert.deepEqual(table.months,expected);
});
test('civil date and instant coverage boundaries reject overflow',()=>{
  assert.equal(adToBS({year:1918,month:4,day:13}).toString(),'1975-01-01');
  assert.equal(adToBS({year:2027,month:4,day:13}).toString(),'2083-12-30');
  for(const ad of [{year:1918,month:4,day:12},{year:2027,month:4,day:14}]) assert.throws(()=>adToBS(ad),RangeError);
  assert.throws(()=>new BSDate(1974,12,1),RangeError);
  assert.throws(()=>new BSDate(2084,1,1),RangeError);
  assert.throws(()=>new BSDate(1975,1,1).addDays(-1),RangeError);
  assert.throws(()=>new BSDate(2083,12,30).addDays(1),RangeError);
});
test('invalid Gregorian dates are never normalized by Date',()=>{
  for(const ad of [{year:2025,month:2,day:29},{year:2024,month:2,day:30},{year:2026,month:4,day:31},{year:2026,month:13,day:1},{year:0,month:1,day:1}]) assert.throws(()=>adToBS(ad),RangeError);
  assert.deepEqual(adToBS({year:2024,month:2,day:29}).toAD(),{year:2024,month:2,day:29});
});
test('BS inputs require integers and real month lengths',()=>{
  for(const args of [[2083,0,1],[2083,13,1],[2083,1,0],[2083,1,32],[2083,12,31]]) assert.throws(()=>new BSDate(...args),RangeError);
  for(const args of [['2083',1,1],[2083,1.5,1],[2083,1,NaN],[Infinity,1,1],[2083,1,Number.MAX_SAFE_INTEGER+1]]) assert.throws(()=>new BSDate(...args),TypeError);
  for(const value of [null,undefined,'2083-01-01',{},[],{year:2083,month:1,day:32}]) assert.equal(api.isValidBS(value),false);
  assert.equal(api.isValidBS({year:2083,month:3,day:32}),true);
});
test('dates are immutable and JSON serializes as a BS string',()=>{
  const date=new BSDate(2083,1,1);
  assert.throws(()=>{date.day=2;},TypeError);
  assert.equal(date.addDays(1).day,2);
  assert.equal(date.day,1);
  assert.equal(JSON.stringify({date}),'{'+'"date":"2083-01-01"}');
  assert.equal(Object.isFrozen(date.toAD()),true);
});
test('every month and weekday formats and parses using short/full English and Nepali names',()=>{
  for(let month=1;month<=12;month++) for(let day=1;day<=7;day++) for(const language of ['en','ne']) {
    const date=new BSDate(2083,month,day);
    for(const pattern of ['YYYY-MM-DD','D MMM YYYY','DD MMMM YYYY','dddd, D MMMM YYYY','ddd D MMM YYYY','d D M YYYY','[BS] YYYY/M/D']) {
      const rendered=date.format(pattern,{locale:language});
      assert.equal(parseBS(rendered,pattern,{locale:language}).toString(),date.toString(),rendered);
    }
  }
});
test('formatting numerals and bracket literals are explicit',()=>{
  const date=new BSDate(2083,1,1);
  assert.equal(date.format('dddd, D MMMM YYYY'),'Tuesday, 1 Baishakh 2083');
  assert.equal(date.format('YYYY-MM-DD',{locale:'ne'}),'२०८३-०१-०१');
  assert.equal(date.format('DD MMMM YYYY',{locale:'ne',numerals:'latin'}),'01 वैशाख 2083');
  assert.equal(date.format('[v2] YYYY',{numerals:'ne'}),'v2 २०८३');
  assert.equal(api.toLatinDigits('०१२३४५६७८९'),'0123456789');
  assert.equal(api.toNepaliDigits('0123456789'),'०१२३४५६७८९');
});
test('strict parsing rejects extra text, mismatched weekdays and ambiguous patterns',()=>{
  for(const text of ['2083-1-01','2083-01-1',' 2083-01-01','2083-01-01 ','2083-01-01\n','2083-01-01junk','2083-01-32']) assert.throws(()=>parseBS(text),RangeError);
  assert.throws(()=>parseBS('Monday, 1 Baishakh 2083','dddd, D MMMM YYYY'),RangeError);
  for(const pattern of ['YY-MM-DD','YYYY-MM','YYYY-MM-DD [','YYYY-MM-DD M','YYYY-MM-DD ddd d']) assert.throws(()=>parseBS('anything',pattern),RangeError);
  assert.equal(parseBS('2083.01.01','YYYY.MM.DD').toString(),'2083-01-01');
  assert.throws(()=>parseBS('2083x01x01','YYYY.MM.DD'),RangeError);
  assert.equal(parseBS('2083+01+01','YYYY+MM+DD').toString(),'2083-01-01');
  assert.throws(()=>formatBS(new BSDate(2083,1,1),'YY'),RangeError);
  assert.throws(()=>formatBS(new BSDate(2083,1,1),undefined,{locale:'fr'}),RangeError);
  assert.throws(()=>formatBS(new BSDate(2083,1,1),undefined,{numerals:'arabic'}),RangeError);
});
test('arithmetic crosses month/year boundaries and clamps or rejects overflow',()=>{
  assert.equal(new BSDate(2082,12,30).addDays(1).toString(),'2083-01-01');
  assert.equal(new BSDate(2083,1,1).addDays(-1).toString(),'2082-12-30');
  assert.equal(new BSDate(2083,3,32).addMonths(1).toString(),'2083-04-31');
  assert.throws(()=>new BSDate(2083,3,32).addMonths(1,'reject'),RangeError);
  assert.equal(new BSDate(2083,1,31).addMonths(-1).toString(),'2082-12-30');
  assert.equal(new BSDate(2081,12,31).addYears(1).toString(),'2082-12-30');
  assert.throws(()=>new BSDate(2081,12,31).addYears(1,'reject'),RangeError);
  assert.throws(()=>new BSDate(2083,1,1).addDays(0.5),TypeError);
  assert.throws(()=>new BSDate(2083,1,1).addMonths(0,'rollover'),RangeError);
  assert.throws(()=>new BSDate(2083,1,1).addMonths(Number.MAX_SAFE_INTEGER),TypeError);
  assert.equal(new BSDate(2083,1,2).differenceInDays(new BSDate(2083,1,1)),1);
  assert.equal(new BSDate(2083,1,1).compare(new BSDate(2083,1,2)),-1);
  assert.equal(new BSDate(2083,1,1).compare(new BSDate(2083,1,1)),0);
});
test('month/year bounds and inclusive day intervals',()=>{
  const date=new BSDate(2083,3,12);
  assert.equal(api.startOfMonth(date).toString(),'2083-03-01');
  assert.equal(api.endOfMonth(date).toString(),'2083-03-32');
  assert.equal(api.startOfYear(date).toString(),'2083-01-01');
  assert.equal(api.endOfYear(date).toString(),'2083-12-30');
  const start=new BSDate(2083,1,30),end=new BSDate(2083,2,2);
  assert.deepEqual(api.eachDayOfInterval(start,end).map(String),['2083-01-30','2083-01-31','2083-02-01','2083-02-02']);
  assert.equal(api.isWithinInterval(start,start,end),true);
  assert.equal(api.isWithinInterval(end,start,end),true);
  assert.equal(api.isWithinInterval(start.addDays(-1),start,end),false);
  assert.throws(()=>api.eachDayOfInterval(end,start),RangeError);
  assert.throws(()=>api.isWithinInterval(start,end,start),RangeError);
});
test('Nepal fiscal year begins in Shrawan and all twelve months map to correct quarters',()=>{
  for(let month=1;month<=12;month++) {
    const fy=api.fiscalYear(new BSDate(2082,month,1));
    assert.equal(fy.startYear,month>=4?2082:2081);
    assert.equal(fy.quarter,month<=3?4:month<=6?1:month<=9?2:3);
  }
  const last=new BSDate(2082,3,32),next=last.addDays(1);
  assert.equal(last.fiscalYear().label,'2081/82');
  assert.equal(next.fiscalYear().label,'2082/83');
  const bounds=api.fiscalYearBounds(2082);
  assert.equal(bounds.start.toString(),'2082-04-01');
  assert.equal(bounds.end.toString(),'2083-03-32');
  assert.equal(api.fiscalYear(new BSDate(1975,1,1)).startYear,1974);
  assert.throws(()=>api.fiscalYearBounds(1974),RangeError);
  assert.throws(()=>api.fiscalYearBounds(2083),RangeError);
});
test('calendar grids contain each day exactly once with configurable week starts',()=>{
  for(let month=1;month<=12;month++) for(let start=0;start<=6;start++) {
    const grid=api.monthGrid(2083,month,start),flat=grid.flat();
    assert.ok(grid.every(week=>week.length===7));
    assert.equal(flat.filter(Boolean).length,daysInMonth(2083,month));
    assert.equal(flat.findIndex(Boolean),(new BSDate(2083,month,1).weekday-start+7)%7);
    assert.deepEqual(flat.filter(Boolean).map(d=>d.day),Array.from({length:daysInMonth(2083,month)},(_,i)=>i+1));
  }
  assert.equal(api.isWeekend(new BSDate(2083,1,5)),true);
  assert.equal(api.isWeekend(new BSDate(2083,1,6)),false);
  assert.throws(()=>api.monthGrid(2083,1,7),RangeError);
});
test('Nepal midnight uses the +05:45 boundary independently of the host timezone',()=>{
  assert.equal(fromInstant('2026-04-13T18:14:59.999Z').toString(),'2082-12-30');
  assert.equal(fromInstant('2026-04-13T18:15:00Z').toString(),'2083-01-01');
  assert.equal(fromInstant('2026-04-14T00:00:00+05:45').toString(),'2083-01-01');
  assert.equal(fromInstant('2026-04-13T18:15:00Z','UTC').toString(),'2082-12-30');
  assert.equal(toInstant(new BSDate(2083,1,1)).toISOString(),'2026-04-13T18:15:00.000Z');
  assert.equal(toInstant(new BSDate(2083,1,1),{hour:12,minute:34,second:56,millisecond:789}).toISOString(),'2026-04-14T06:49:56.789Z');
});
test('historical Nepal offsets and the 1986 midnight gap use IANA rules',()=>{
  const old=adToBS({year:1985,month:12,day:31});
  assert.equal(old.toInstant().toISOString(),'1985-12-30T18:30:00.000Z');
  const transition=adToBS({year:1986,month:1,day:1});
  assert.throws(()=>transition.toInstant(),/does not exist/);
  assert.equal(transition.toInstant({minute:15}).toISOString(),'1985-12-31T18:30:00.000Z');
  assert.equal(fromInstant('1985-12-31T18:29:59Z').toString(),old.toString());
  assert.equal(fromInstant('1985-12-31T18:30:00Z').toString(),transition.toString());
  const ancient=adToBS({year:1918,month:4,day:13});
  assert.equal(ancient.toInstant({hour:12}).toISOString(),'1918-04-13T06:18:44.000Z');
});
test('DST gaps, repeated local times and skipped civil days are rejected',()=>{
  assert.throws(()=>toInstant(adToBS({year:2026,month:3,day:8}),{hour:2,minute:30},'America/New_York'),/does not exist/);
  assert.throws(()=>toInstant(adToBS({year:2026,month:11,day:1}),{hour:1,minute:30},'America/New_York'),/Ambiguous/);
  assert.throws(()=>toInstant(adToBS({year:2011,month:12,day:30}),{hour:12},'Pacific/Apia'),/does not exist/);
  const date=adToBS({year:2026,month:3,day:8});
  assert.equal(toInstant(date,{hour:3,minute:30},'America/New_York').toISOString(),'2026-03-08T07:30:00.000Z');
});
test('instant parsing requires an explicit timezone and rejects invalid date/time components',()=>{
  for(const value of ['2026-04-14','2026-04-14T00:00:00','2026-02-30T00:00:00Z','2026-04-14T24:00:00Z','2026-04-14T00:60:00Z','2026-04-14T00:00:60Z','2026-04-14T00:00:00+24:00','2026-04-14T00:00:00+05:60','2026-04-14T00:00:00.1234Z']) assert.throws(()=>fromInstant(value),RangeError);
  assert.throws(()=>fromInstant(new Date(NaN)),RangeError);
  assert.throws(()=>fromInstant(0),TypeError);
  assert.throws(()=>fromInstant('2026-04-14T00:00:00Z','Mars/Olympus'),RangeError);
  assert.throws(()=>toInstant(new BSDate(2083,1,1),{hour:24}),RangeError);
  assert.throws(()=>toInstant(new BSDate(2083,1,1),{hour:null}),TypeError);
  assert.throws(()=>toInstant(new BSDate(2083,1,1),[]),TypeError);
  assert.throws(()=>toInstant(new BSDate(2083,1,1),{millisecond:0.5}),TypeError);
  const value=new Date('2026-04-14T00:00:00Z'); fromInstant(value);
  assert.equal(value.toISOString(),'2026-04-14T00:00:00.000Z');
});
test('all year boundaries round-trip through Nepal local noon',()=>{
  for(let year=1975;year<=2083;year++) {
    const date=new BSDate(year,1,1),resolved=date.toInstant({hour:12});
    assert.equal(fromInstant(resolved).toString(),date.toString());
  }
});
test('results are identical under several process default timezones',()=>{
  const source=`const a=require('./dist/index.cjs'); const d=a.fromInstant('2026-04-13T18:15:00Z'); console.log(JSON.stringify([d.toString(),d.toAD(),d.toInstant().toISOString(),d.fiscalYear()]));`;
  const results=['UTC','America/Los_Angeles','Asia/Kathmandu','Pacific/Auckland'].map(TZ=>{
    const result=spawnSync(process.execPath,['-e',source],{cwd:require('node:path').resolve(__dirname,'..'),env:{...process.env,TZ},encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);return result.stdout;
  });
  assert.equal(new Set(results).size,1);
});
test('ESM and CommonJS expose the same named API',async()=>{
  const esm=await import('../dist/index.mjs');
  assert.deepEqual(Object.keys(esm).sort(),Object.keys(api).sort());
  assert.equal(new esm.BSDate(2083,1,1).toString(),'2083-01-01');
});
test('JSON data imports cannot mutate the private calendar or default holidays',()=>{
  const external=require('../data/calendar.json'),before=external.months['2083'][0];
  external.months['2083'][0]=1;
  try { assert.equal(daysInMonth(2083,1),before); } finally {external.months['2083'][0]=before;}
  const metadata=api.calendarInfo();assert.equal(Object.isFrozen(metadata),true);
  const coverage=api.holidayCoverage();assert.equal(Object.isFrozen(coverage.years),true);
});
