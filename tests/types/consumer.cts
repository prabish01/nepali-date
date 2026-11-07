import api = require('@prabish01/nepali-date');
const date: api.BSDate = new api.BSDate(2083,1,1);
const ad: api.CivilDate = date.toAD();
const label: string = api.fiscalYear(date).label;
const interval: api.TithiInterval | null = new api.TithiCalendar().at(date.toInstant());
void [ad,label,interval];
// @ts-expect-error invalid overflow policy
api.addMonths(date,1,'rollover');
