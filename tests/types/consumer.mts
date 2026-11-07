import {BSDate, adToBS, formatBS, tithiFromLongitudes, TithiCalendar, HolidayCalendar, calendarInfo, eachDayOfInterval, type CivilDate, type TithiRecord, type Holiday, type FiscalYear} from '@prabish01/nepali-date';
const date: BSDate = adToBS({year:2026,month:4,day:14});
const ad: CivilDate = date.toAD();
const text: string = formatBS(date,'DD MMMM YYYY',{locale:'ne',numerals:'ne'});
const instant: Date = date.toInstant({hour:12},'Asia/Kathmandu');
const fy: FiscalYear = date.fiscalYear();
const records: readonly TithiRecord[] = [];
const result = new TithiCalendar(records).at(instant);
if (result) { const number: number = result.number; void number; }
const holidays: readonly Holiday[] = [];
const holiday: Holiday | undefined = new HolidayCalendar(holidays).forDate(date)[0];
const dates: BSDate[] = eachDayOfInterval(date,date.addDays(1));
const info: number = calendarInfo().maxYear;
const name: string = tithiFromLongitudes(10,22).name;
void [ad,text,fy,holiday,dates,info,name];
// @ts-expect-error dates are readonly
 date.year = 2082;
// @ts-expect-error constructors use integer numbers, not strings
new BSDate('2083',1,1);
// @ts-expect-error locale is a closed union
formatBS(date,'YYYY',{locale:'fr'});
// @ts-expect-error tithi result may be null without a dataset
const number: number = new TithiCalendar().at(instant).number;
