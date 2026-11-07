'use strict';
const calendar = JSON.parse(JSON.stringify(require('../data/calendar.json')));
const locale = require('../data/locale.json');
const bundledHolidays = JSON.parse(JSON.stringify(require('../data/holidays.json')));
const DAY = 86400000;
const NEPAL_TIMEZONE = 'Asia/Kathmandu';
const DIGITS = '०१२३४५६७८९';
const tokens = ['YYYY','MMMM','MMM','dddd','ddd','MM','DD','M','D','d'];
const starts = []; let totalDays = 0;
for (let year = calendar.minYear; year <= calendar.maxYear; year++) {
  for (let month = 1; month <= 12; month++) {
    starts.push({ year, month, start: totalDays, length: calendar.months[year][month - 1] });
    totalDays += calendar.months[year][month - 1];
  }
}
const anchor = Date.parse(calendar.anchorAD + 'T00:00:00Z');
function integer(value, name) {
  if (!Number.isSafeInteger(value)) throw new TypeError(`${name} must be a safe integer`);
  return value;
}
function lang(value = 'en') {
  if (value !== 'en' && value !== 'ne') throw new RangeError('Locale must be en or ne');
  return value;
}
function toLatinDigits(text) { return String(text).replace(/[०-९]/g, c => String(DIGITS.indexOf(c))); }
function toNepaliDigits(text) { return String(text).replace(/[0-9]/g, c => DIGITS[Number(c)]); }
function pad(value, width = 2) { return String(value).padStart(width, '0'); }
function key(d) { return `${pad(d.year, 4)}-${pad(d.month)}-${pad(d.day)}`; }
function daysInMonth(year, month) {
  integer(year, 'year'); integer(month, 'month');
  if (year < calendar.minYear || year > calendar.maxYear || month < 1 || month > 12) {
    throw new RangeError(`BS year must be ${calendar.minYear}..${calendar.maxYear} and month 1..12`);
  }
  return calendar.months[year][month - 1];
}
function validateBS(d) {
  if (!d || typeof d !== 'object') throw new TypeError('A BS date object is required');
  const max = daysInMonth(d.year, d.month); integer(d.day, 'day');
  if (d.day < 1 || d.day > max) throw new RangeError('Invalid BS day');
  return d;
}
function ordinal(d) {
  validateBS(d);
  return starts[(d.year - calendar.minYear) * 12 + d.month - 1].start + d.day - 1;
}
function atOrdinal(n) {
  integer(n, 'day offset');
  if (n < 0 || n >= totalDays) throw new RangeError('Date is outside calendar coverage');
  let low = 0, high = starts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (starts[mid].start <= n) low = mid; else high = mid - 1;
  }
  const m = starts[low];
  return new BSDate(m.year, m.month, n - m.start + 1);
}
function gregorian(d) {
  if (!d || typeof d !== 'object') throw new TypeError('A Gregorian date object is required');
  integer(d.year, 'year'); integer(d.month, 'month'); integer(d.day, 'day');
  if (d.year < 1 || d.year > 9999 || d.month < 1 || d.month > 12 || d.day < 1 || d.day > 31) throw new RangeError('Invalid Gregorian date');
  const value = Date.parse(key(d) + 'T00:00:00Z'), date = new Date(value);
  if (!Number.isFinite(value) || date.getUTCFullYear() !== d.year || date.getUTCMonth() + 1 !== d.month || date.getUTCDate() !== d.day) throw new RangeError('Invalid Gregorian date');
  return value;
}
function bsToAD(d) {
  const date = new Date(anchor + ordinal(d) * DAY);
  return Object.freeze({year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate()});
}
function adToBS(d) { return atOrdinal((gregorian(d) - anchor) / DAY); }
// Explicit offsets avoid interpreting strings in the host machine's timezone.
function instant(value) {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) throw new RangeError('Invalid Date');
    return new Date(value.getTime());
  }
  if (typeof value !== 'string') throw new TypeError('Expected Date or an explicit-offset RFC 3339 string');
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.([0-9]{1,3}))?(Z|[+-]([0-9]{2}):([0-9]{2}))$/.exec(value);
  if (!m) throw new RangeError('Instant must include seconds and Z or a numeric offset');
  gregorian({year: +m[1], month: +m[2], day: +m[3]});
  if (+m[4] > 23 || +m[5] > 59 || +m[6] > 59 || +(m[9] || 0) > 23 || +(m[10] || 0) > 59) throw new RangeError('Invalid instant time or offset');
  const result = new Date(value);
  if (!Number.isFinite(result.getTime())) throw new RangeError('Invalid instant');
  return result;
}
function zonedParts(value, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
    timeZone, year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'
  }).formatToParts(value);
  const fields = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return {year:+fields.year,month:+fields.month,day:+fields.day,hour:+fields.hour,minute:+fields.minute,second:+fields.second};
}
function fromInstant(value, timeZone = NEPAL_TIMEZONE) { return adToBS(zonedParts(instant(value),timeZone)); }
/** Resolve an IANA wall time. Gaps and ambiguous times throw instead of silently shifting. */
function toInstant(date, time = {}, timeZone = NEPAL_TIMEZONE) {
  if (!time || typeof time !== 'object' || Array.isArray(time)) throw new TypeError('Time fields must be an object');
  const ad = bsToAD(date), hour=time.hour===undefined?0:time.hour, minute=time.minute===undefined?0:time.minute, second=time.second===undefined?0:time.second, millisecond=time.millisecond===undefined?0:time.millisecond;
  for (const [name,value,max] of [['hour',hour,23],['minute',minute,59],['second',second,59],['millisecond',millisecond,999]]) {
    integer(value,name); if (value<0 || value>max) throw new RangeError(`Invalid ${name}`);
  }
  const wall = gregorian(ad) + hour*3600000 + minute*60000 + second*1000;
  const offsets = new Set();
  // Sample either side of transitions; IANA offsets include historical seconds.
  for (const delta of [-2*DAY,-DAY,0,DAY,2*DAY]) {
    const probe = wall + delta, p=zonedParts(new Date(probe),timeZone);
    offsets.add(gregorian(p)+p.hour*3600000+p.minute*60000+p.second*1000-probe);
  }
  const matches = [...offsets].map(offset=>new Date(wall-offset)).filter(value=>{
    const p=zonedParts(value,timeZone);
    return p.year===ad.year&&p.month===ad.month&&p.day===ad.day&&p.hour===hour&&p.minute===minute&&p.second===second;
  });
  if (matches.length !== 1) throw new RangeError(matches.length ? 'Ambiguous local time; pass an explicit-offset instant instead' : 'Local time does not exist in this timezone');
  return new Date(matches[0].getTime()+millisecond);
}
function tokenize(pattern) {
  if (typeof pattern !== 'string' || pattern.length === 0) throw new RangeError('A nonempty pattern is required');
  const out = []; let i = 0;
  while (i < pattern.length) {
    if (pattern[i] === '[') {
      const end = pattern.indexOf(']', i + 1);
      if (end < 0) throw new RangeError('Unclosed pattern literal');
      out.push({literal:pattern.slice(i + 1,end)}); i = end + 1; continue;
    }
    const token = tokens.find(t => pattern.startsWith(t,i));
    if (token) { out.push({token}); i += token.length; }
    else {
      if (/[A-Za-z\]]/.test(pattern[i])) throw new RangeError('Unknown pattern token; wrap literal text in [brackets]');
      out.push({literal:pattern[i++]});
    }
  }
  return out;
}
function formatBS(d, pattern = 'YYYY-MM-DD', options = {}) {
  validateBS(d); const language = lang(options.locale), weekday = new Date(anchor + ordinal(d) * DAY).getUTCDay();
  const month = locale.months[language][d.month - 1], week = locale.weekdays[language][weekday];
  const values = {
    YYYY:pad(d.year,4), M:String(d.month), MM:pad(d.month), MMM:locale.monthsShort[language][d.month-1], MMMM:month,
    D:String(d.day), DD:pad(d.day), d:String(weekday), ddd:language==='en'?week.slice(0,3):week, dddd:week
  };
  const numerals = options.numerals ?? (language === 'ne' ? 'ne' : 'latin');
  if (numerals !== 'ne' && numerals !== 'latin') throw new RangeError('Numerals must be ne or latin');
  return tokenize(pattern).map(p => p.literal !== undefined ? p.literal : (numerals === 'ne' ? toNepaliDigits(values[p.token]) : values[p.token])).join('');
}
function escapeRE(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function parseBS(text, pattern = 'YYYY-MM-DD', options = {}) {
  if (typeof text !== 'string') throw new TypeError('Date text must be a string');
  const language = lang(options.locale), fields = [], seen = new Set();
  const parts = tokenize(pattern); let regex = '^';
  for (const p of parts) {
    if (p.literal !== undefined) { regex += escapeRE(toLatinDigits(p.literal)); continue; }
    const field = p.token === 'YYYY' ? 'year' : p.token.startsWith('M') ? 'month' : p.token.startsWith('D') ? 'day' : 'weekday';
    if (seen.has(field)) throw new RangeError('Duplicate parse field');
    seen.add(field); fields.push({token:p.token, field});
    if (p.token === 'YYYY') regex += '([0-9]{4})';
    else if (['MM','DD'].includes(p.token)) regex += '([0-9]{2})';
    else if (['M','D'].includes(p.token)) regex += '([0-9]{1,2})';
    else if (p.token === 'd') regex += '([0-6])';
    else {
      const names = p.token.startsWith('M') ? (p.token==='MMM'?locale.monthsShort[language]:locale.months[language]) : locale.weekdays[language];
      const short = p.token === 'ddd';
      regex += '(' + names.map(n => escapeRE(language === 'en' && short ? n.slice(0,3) : n)).join('|') + ')';
    }
  }
  if (!['year','month','day'].every(f => seen.has(f))) throw new RangeError('Parse pattern must include year, month and day');
  // Negative lookahead also rejects a trailing newline (unlike JS's $ anchor).
  const match = new RegExp(regex + '(?![\\s\\S])','u').exec(toLatinDigits(text));
  if (!match) throw new RangeError('Date does not match pattern');
  const result = {}; let expectedWeekday;
  fields.forEach((f,i) => {
    let value = match[i+1];
    if (['MMM','MMMM','ddd','dddd'].includes(f.token)) {
      const names = f.field === 'month' ? (f.token==='MMM'?locale.monthsShort[language]:locale.months[language]) : locale.weekdays[language];
      value = names.findIndex(n => (language === 'en' && f.token === 'ddd' ? n.slice(0,3) : n) === value) + (f.field === 'month' ? 1 : 0);
    } else value = Number(value);
    if (f.field === 'weekday') expectedWeekday = value; else result[f.field] = value;
  });
  const date = new BSDate(result.year,result.month,result.day);
  if (expectedWeekday !== undefined && date.weekday !== expectedWeekday) throw new RangeError('Weekday does not match date');
  return date;
}
function addDays(d, amount) { integer(amount,'days'); return atOrdinal(ordinal(d) + amount); }
function addMonths(d, amount, overflow = 'constrain') {
  validateBS(d); integer(amount,'months');
  if (!['constrain','reject'].includes(overflow)) throw new RangeError('Overflow must be constrain or reject');
  const n = d.year * 12 + d.month - 1 + amount; integer(n,'resulting month');
  const year = Math.floor(n/12), month = ((n % 12) + 12) % 12 + 1, max = daysInMonth(year,month);
  if (overflow === 'reject' && d.day > max) throw new RangeError('Day does not exist in target month');
  return new BSDate(year,month,Math.min(d.day,max));
}
function addYears(d, amount, overflow = 'constrain') { integer(amount,'years'); return addMonths(d, amount * 12, overflow); }
function differenceInDays(left, right) { return ordinal(left) - ordinal(right); }
function compare(left,right) { return Math.sign(differenceInDays(left,right)); }
function startOfMonth(d) { validateBS(d); return new BSDate(d.year,d.month,1); }
function endOfMonth(d) { validateBS(d); return new BSDate(d.year,d.month,daysInMonth(d.year,d.month)); }
function startOfYear(d) { validateBS(d); return new BSDate(d.year,1,1); }
function endOfYear(d) { validateBS(d); return new BSDate(d.year,12,daysInMonth(d.year,12)); }
function fiscalYear(d) {
  validateBS(d); const startYear = d.month >= 4 ? d.year : d.year - 1, endYear = startYear + 1;
  return Object.freeze({startYear,endYear,label:`${startYear}/${pad(endYear % 100)}`,quarter:Math.floor(((d.month + 8) % 12)/3)+1});
}
function fiscalYearBounds(startYear) {
  integer(startYear,'startYear');
  return Object.freeze({start:new BSDate(startYear,4,1),end:endOfMonth(new BSDate(startYear+1,3,1))});
}
function monthGrid(year, month, weekStartsOn = 0) {
  integer(weekStartsOn,'weekStartsOn');
  if (weekStartsOn < 0 || weekStartsOn > 6) throw new RangeError('Week starts on 0..6');
  const first = new BSDate(year,month,1), cells = Array((first.weekday - weekStartsOn + 7) % 7).fill(null);
  for (let d=1;d<=daysInMonth(year,month);d++) cells.push(new BSDate(year,month,d));
  while (cells.length % 7) cells.push(null);
  return Array.from({length:cells.length/7},(_,i) => cells.slice(i*7,i*7+7));
}
function eachDayOfInterval(start,end) {
  const first=ordinal(start), last=ordinal(end);
  if (first>last) throw new RangeError('Interval start must not follow end');
  return Array.from({length:last-first+1},(_,i)=>atOrdinal(first+i));
}
function isWithinInterval(date,start,end) {
  const first=ordinal(start), last=ordinal(end);
  if (first>last) throw new RangeError('Interval start must not follow end');
  const n=ordinal(date); return n>=first && n<=last;
}
function isValidBS(value) { try { validateBS(value); return true; } catch { return false; } }
function isWeekend(d) { return Number(formatBS(d,'d')) === 6; }
class BSDate {
  constructor(year,month,day) {
    validateBS({year,month,day}); this.year=year; this.month=month; this.day=day;
    Object.freeze(this);
  }
  static parse(text,pattern,options) { return parseBS(text,pattern,options); }
  static fromAD(date) { return adToBS(date); }
  static fromInstant(value,timeZone) { return fromInstant(value,timeZone); }
  static today(timeZone = NEPAL_TIMEZONE) { return fromInstant(new Date(),timeZone); }
  get weekday() { return new Date(anchor + ordinal(this)*DAY).getUTCDay(); }
  toAD() { return bsToAD(this); }
  toInstant(time,timeZone) { return toInstant(this,time,timeZone); }
  toString() { return key(this); }
  toJSON() { return this.toString(); }
  format(pattern,options) { return formatBS(this,pattern,options); }
  addDays(amount) { return addDays(this,amount); }
  addMonths(amount,overflow) { return addMonths(this,amount,overflow); }
  addYears(amount,overflow) { return addYears(this,amount,overflow); }
  differenceInDays(other) { return differenceInDays(this,other); }
  compare(other) { return compare(this,other); }
  fiscalYear() { return fiscalYear(this); }
}
function tithi(number, language = 'en') {
  integer(number,'tithi'); lang(language);
  if (number < 1 || number > 30) throw new RangeError('Tithi must be 1..30');
  return Object.freeze({number,day:((number-1)%15)+1,paksha:number<=15?'shukla':'krishna',name:locale.tithis[language][number-1]});
}
function tithiFromLongitudes(sun,moon,language = 'en') {
  if (typeof sun !== 'number' || typeof moon !== 'number' || !Number.isFinite(sun) || !Number.isFinite(moon) || sun < 0 || sun >= 360 || moon < 0 || moon >= 360) throw new RangeError('Longitudes must be finite degrees in [0,360) in the same reference frame');
  // Branching prevents rounding a tiny negative elongation up to exactly 360.
  const elongation = moon>=sun ? moon-sun : 360-(sun-moon);
  return tithi(Math.min(29,Math.floor(elongation/12))+1,language);
}
class TithiCalendar {
  #records;
  constructor(records = []) {
    if (!Array.isArray(records)) throw new TypeError('Tithi records must be an array');
    this.#records = records.map(r => {
      if (!r || typeof r.source !== 'string' || !r.source.trim()) throw new RangeError('Tithi records require source attribution');
      tithi(r.number);
      const start=instant(r.start).getTime(), end=instant(r.end).getTime();
      if (start >= end) throw new RangeError('Tithi interval must have positive duration');
      return Object.freeze({start,end,number:r.number,source:r.source});
    }).sort((a,b)=>a.start-b.start);
    for (let i=1;i<this.#records.length;i++) if (this.#records[i].start < this.#records[i-1].end) throw new RangeError('Tithi intervals must not overlap');
  }
  at(value,language = 'en') {
    lang(language); const time=instant(value).getTime();
    let low=0, high=this.#records.length-1, record;
    while (low<=high) {
      const mid=Math.floor((low+high)/2), candidate=this.#records[mid];
      if (time<candidate.start) high=mid-1;
      else if (time>=candidate.end) low=mid+1;
      else { record=candidate; break; }
    }
    return record ? Object.freeze({...tithi(record.number,language),start:new Date(record.start).toISOString(),end:new Date(record.end).toISOString(),source:record.source}) : null;
  }
}
class HolidayCalendar {
  #records;
  constructor(records = bundledHolidays.records) {
    if (!Array.isArray(records)) throw new TypeError('Holiday records must be an array');
    this.#records = records.map(r => {
      if (!r || ['id','name','scope','source'].some(k => typeof r[k] !== 'string' || !r[k].trim()) || (r.nameNe !== undefined && typeof r.nameNe !== 'string')) throw new RangeError('Holiday requires id, name, scope and source');
      const date = parseBS(r.date).toString();
      return Object.freeze({id:r.id,date,name:r.name,...(r.nameNe===undefined?{}:{nameNe:r.nameNe}),scope:r.scope,source:r.source});
    });
  }
  forDate(date,scope) {
    const k=key(validateBS(date));
    return this.#records.filter(r=>r.date===k&&(scope===undefined||r.scope===scope));
  }
  forYear(year,scope) {
    daysInMonth(year,1);
    return this.#records.filter(r=>r.date.startsWith(`${year}-`)&&(scope===undefined||r.scope===scope));
  }
  isHoliday(date,scope) { return this.forDate(date,scope).length>0; }
}
function calendarInfo() { const {months,...metadata}=calendar; return Object.freeze({...metadata}); }
function holidayCoverage() {
  return Object.freeze({...bundledHolidays.coverage,version:bundledHolidays.version,years:Object.freeze([...bundledHolidays.coverage.years]),pendingObservances:Object.freeze([...bundledHolidays.coverage.pendingObservances])});
}
module.exports = {
  BSDate,NEPAL_TIMEZONE,bsToAD,adToBS,fromInstant,toInstant,parseBS,formatBS,daysInMonth,isValidBS,
  addDays,addMonths,addYears,differenceInDays,compare,startOfMonth,endOfMonth,startOfYear,endOfYear,
  fiscalYear,fiscalYearBounds,monthGrid,eachDayOfInterval,isWithinInterval,isWeekend,toLatinDigits,toNepaliDigits,
  tithi,tithiFromLongitudes,TithiCalendar,HolidayCalendar,calendarInfo,holidayCoverage
};
