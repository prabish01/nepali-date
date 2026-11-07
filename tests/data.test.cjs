'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {BSDate,HolidayCalendar,holidayCoverage,TithiCalendar,tithi,tithiFromLongitudes}=require('../dist/index.cjs');
test('bundled holidays disclose partial coverage, year and official national/conditional scopes',()=>{
  assert.equal(holidayCoverage().complete,false);
  assert.deepEqual(holidayCoverage().years,[2083]);
  const calendar=new HolidayCalendar();
  assert.equal(calendar.forYear(2083).length,45);
  assert.equal(calendar.forDate(new BSDate(2083,1,1))[0].name,'Nepali New Year');
  assert.equal(calendar.isHoliday(new BSDate(2083,1,1),'NP-national'),true);
  assert.equal(calendar.isHoliday(new BSDate(2083,1,1),'NP-region:KathmanduValley'),false);
  assert.equal(calendar.forDate(new BSDate(2082,1,1)).length,0);
  assert.equal(calendar.forYear(2083,'NP-national').filter(r=>r.id==='dashain').length,7);
  assert.equal(calendar.forYear(2083,'NP-national').filter(r=>r.id==='tihar').length,5);
  assert.equal(calendar.isHoliday(new BSDate(2083,7,22),'NP-national'),true);
  assert.equal(calendar.isHoliday(new BSDate(2083,5,13),'NP-national'),false);
  assert.equal(calendar.isHoliday(new BSDate(2083,5,13),'NP-region:KathmanduValley'),true);
  assert.equal(calendar.isHoliday(new BSDate(2083,5,29),'NP-employees:women'),true);
  assert.ok(holidayCoverage().pendingObservances.includes('Eid al-Fitr'));
  assert.ok(calendar.forYear(2083).every(r=>r.source.startsWith('https://www.moha.gov.np/')));
});
test('custom holiday records copy their input and can carry national/regional/community scopes',()=>{
  const record={id:'fixture',date:'2083-01-02',name:'Synthetic test day',scope:'test-region',source:'synthetic fixture; not an actual holiday'};
  const calendar=new HolidayCalendar([record]);record.name='changed';
  const found=calendar.forDate(new BSDate(2083,1,2));
  assert.equal(found[0].name,'Synthetic test day');
  assert.equal(Object.isFrozen(found[0]),true);
  found.pop();assert.equal(calendar.forYear(2083).length,1);
  for(const bad of [{...record,source:''},{...record,date:'2083-01-32'},{...record,scope:''},{...record,nameNe:1}]) assert.throws(()=>new HolidayCalendar([bad]));
});
test('all thirty tithi names and fortnight positions are defined in both languages',()=>{
  for(let number=1;number<=30;number++) for(const language of ['en','ne']) {
    const value=tithi(number,language);
    assert.equal(value.number,number);
    assert.equal(value.day,(number-1)%15+1);
    assert.equal(value.paksha,number<=15?'shukla':'krishna');
    assert.ok(value.name.length>0);
  }
  assert.equal(tithi(15).name,'Purnima');assert.equal(tithi(30).name,'Amavasya');
  for(const number of [0,31]) assert.throws(()=>tithi(number),RangeError);
  assert.throws(()=>tithi(1.5),TypeError);
  assert.throws(()=>tithi(1,'fr'),RangeError);
});
test('tithi classification uses supplied longitudes with correct 12-degree boundaries and wraparound',()=>{
  assert.equal(tithiFromLongitudes(0,0).number,1);
  assert.equal(tithiFromLongitudes(0,11.999).number,1);
  assert.equal(tithiFromLongitudes(0,12).number,2);
  assert.equal(tithiFromLongitudes(0,180).number,16);
  assert.equal(tithiFromLongitudes(350,10).number,2);
  assert.equal(tithiFromLongitudes(0,359.999).number,30);
  assert.equal(tithiFromLongitudes(Number.EPSILON,0).number,30);
  for(let number=1;number<=30;number++) assert.equal(tithiFromLongitudes(0,(number-1)*12).number,number);
  for(const pair of [[NaN,0],[0,Infinity],[-1,0],[0,360],['0',0]]) assert.throws(()=>tithiFromLongitudes(...pair),RangeError);
});
// Deliberately synthetic intervals: these are NOT a published almanac.
const record={start:'2026-04-14T00:00:00+05:45',end:'2026-04-14T12:00:00+05:45',number:1,source:'synthetic fixture; not astronomical data'};
test('tithi lookup uses start-inclusive/end-exclusive instants, handles transitions within a day and gaps',()=>{
  const calendar=new TithiCalendar([{...record,start:record.end,end:'2026-04-15T00:00:00+05:45',number:2},record]);
  assert.equal(calendar.at(record.start).number,1);
  assert.equal(calendar.at(record.end).number,2);
  assert.equal(calendar.at('2026-04-15T00:00:00+05:45'),null);
  assert.equal(calendar.at('2026-04-13T23:59:59+05:45'),null);
  assert.equal(calendar.at(record.start,'ne').name,'प्रतिपदा');
  assert.equal(calendar.at(record.start).source,record.source);
  assert.equal(new TithiCalendar().at(record.start),null);
  const gap=new TithiCalendar([record,{...record,start:'2026-04-14T14:00:00+05:45',end:'2026-04-14T16:00:00+05:45'}]);
  assert.equal(gap.at('2026-04-14T13:00:00+05:45'),null);
});
test('tithi records require valid, nonoverlapping sourced intervals and defensive copies',()=>{
  for(const bad of [{...record,source:''},{...record,number:0},{...record,end:record.start},{...record,start:'2026-04-14T00:00:00'}]) assert.throws(()=>new TithiCalendar([bad]));
  assert.throws(()=>new TithiCalendar([record,record]),RangeError);
  const input={...record},calendar=new TithiCalendar([input]);input.number=4;
  assert.equal(calendar.at(record.start).number,1);
  assert.equal(Object.isFrozen(calendar.at(record.start)),true);
});
