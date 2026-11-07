# API reference

Every date object uses `{ year, month, day }` with **1-based** months/days.
`BSDate` is an immutable BS civil date. Gregorian objects use the same shape
but are accepted only by explicitly Gregorian functions. The shape does not
carry a calendar discriminator; keep your application variables explicit.

No function mutates supplied dates, arrays or JavaScript `Date` values.
`BSDate.toJSON()` returns a Latin-digit BS ISO-style string. Avoid treating that
string as Gregorian input to the built-in `Date` constructor.

## Conversion

| API | Result |
| --- | --- |
| `new BSDate(year, month, day)` | Validated, frozen BS date |
| `BSDate.fromAD(civil)` / `adToBS(civil)` | Gregorian civil date → BSDate |
| `date.toAD()` / `bsToAD(date)` | BS → frozen Gregorian civil object |
| `BSDate.fromInstant(value, timeZone?)` / `fromInstant(...)` | Instant → BSDate in zone; default Asia/Kathmandu |
| `date.toInstant(time?, timeZone?)` / `toInstant(date, ...)` | BS wall date/time → new JavaScript Date |
| `BSDate.today(timeZone?)` | Current civil date in zone; default Asia/Kathmandu |
| `calendarInfo()` | Frozen source/range/checksum metadata |

`value` is a valid `Date` or an explicit-offset RFC 3339 subset:
`YYYY-MM-DDTHH:mm:ss[.SSS](Z|±HH:MM)`. Fractions accept 1–3 digits. Leap
seconds, invalid Gregorian dates, local strings and date-only strings throw.
Timezone arguments are IANA identifiers accepted by the runtime's `Intl`.

`time` has optional integer `hour` (0–23), `minute`/`second` (0–59),
`millisecond` (0–999), all defaulting to zero. Nonexistent or ambiguous wall
times throw; use an explicit-offset instant for an intended side of a repeated
time. IANA data comes from the runtime and may differ if hosts use different
tzdata releases. Wall-time resolution samples offsets within two days of the
requested date and validates the candidate against the exact wall fields.

## Parse and format

- `date.format(pattern?, options?)` / `formatBS(date, pattern?, options?)`:
  default `YYYY-MM-DD`; options `{ locale: 'en' | 'ne', numerals: 'latin' | 'ne' }`.
- `BSDate.parse(text, pattern?, options?)` / `parseBS(...)`:
  default `YYYY-MM-DD`; options `{ locale: 'en' | 'ne' }`.
- `toLatinDigits(text)` / `toNepaliDigits(text)`: converts only decimal digits;
  accepts a string or number and returns a string.

Tokens: `YYYY`, `M`, `MM`, `MMM`, `MMMM`, `D`, `DD`, `d`, `ddd`, `dddd`.
Bracket literals are preserved, including their digits. Parsing accepts Latin
and Devanagari digits, consumes the whole input, is case-sensitive for names,
and requires year, month, day exactly once. A supplied weekday must agree.
`MM`/`DD` require two digits; `M`/`D` accept one or two. Weekday is Sunday=0.
English short names use explicit month abbreviations; Nepali short names are
full names. See the README token table.

## Date operations

| API | Semantics |
| --- | --- |
| `daysInMonth(year, month)` | Actual table value; not a recurring formula |
| `isValidBS(unknown)` | Boolean/type guard; does not throw for invalid dates |
| `addDays(date, integer)` / `date.addDays(integer)` | Signed civil-day arithmetic |
| `addMonths(date, integer, overflow?)` / method | Overflow `constrain` (default) or `reject` |
| `addYears(date, integer, overflow?)` / method | Same overflow policy, via month arithmetic |
| `differenceInDays(left, right)` / `date.differenceInDays(other)` | Signed left minus right |
| `compare(left, right)` / `date.compare(other)` | -1, 0 or 1 |
| `startOfMonth(date)` / `endOfMonth(date)` | BSDate at first/last day of month |
| `startOfYear(date)` / `endOfYear(date)` | BSDate at first/last day of year |
| `eachDayOfInterval(start, end)` | Inclusive array; reversed bounds throw |
| `isWithinInterval(date, start, end)` | Inclusive check; reversed bounds throw |
| `monthGrid(year, month, weekStartsOn?)` | Array of seven-cell weeks; padding is null; start 0=Sunday by default |
| `isWeekend(date)` | True for Saturday |
| `date.weekday` | Integer 0=Sunday through 6=Saturday |
| `date.toString()` / `date.toJSON()` | `YYYY-MM-DD` using Latin digits |

Numbers must be safe integers. Dates and operation results must stay inside the
supported table. Unsupported years throw rather than extrapolate. Each operation
is independent: repeated month clamping can lose the original day number.

## Fiscal years

`fiscalYear(date)` and `date.fiscalYear()` return a frozen object:
`{ startYear, endYear, label, quarter }`. Shrawan (month 4) begins Q1;
Kartik begins Q2; Magh begins Q3; Baishakh begins Q4.

`fiscalYearBounds(startYear)` returns frozen `{ start, end }` BSDate boundaries:
Shrawan 1 through the next year's final Ashadh day. Both dates must be supported;
1974 and 2083 start years therefore throw with the current data. Label lookup
still works at the calendar edges because it does not convert missing boundaries.

## Holidays

`new HolidayCalendar(records?)` loads the bundled 2083 notice by default, or
copies/validates the supplied array. Each record has `id`, `date` (strict BS
`YYYY-MM-DD`), `name`, optional `nameNe`, `scope` and `source`.

- `calendar.forDate(date, scope?)`: new array of frozen matching records.
- `calendar.forYear(year, scope?)`: new array of frozen matching records.
- `calendar.isHoliday(date, scope?)`: whether there is a matching record.
- `holidayCoverage()`: frozen metadata, version, years, pending observances,
  notice URL/PDF checksum, and `complete: false`.

An omitted scope returns every matching category; it does not apply an employee
eligibility policy. Examples: `NP-national`, `NP-region:KathmanduValley`,
`NP-region:hills-himalaya`, `NP-region:terai`, `NP-community:Newar`,
`NP-employees:women`, `NP-education`. Inspect the dataset for all exact values.

The Terai Holi scope means the districts listed in the source notice, not every
location someone informally calls Terai. No holiday entitlement, business-day
schedule, automatic recurrence or substitute-day policy is inferred. Custom
records replace the bundled list; combine arrays yourself when you want both.

## Tithi

- `tithi(number, locale?)`: frozen `{ number, day, paksha, name }`. Numbers 1–15
  are shukla, 16–30 krishna; `day` is 1–15 within the fortnight.
- `tithiFromLongitudes(sun, moon, locale?)`: applies 12-degree angular segments;
  finite numeric angles must be `[0, 360)` in the same frame and instant.
- `new TithiCalendar(records?)`: copies, sorts and validates sourced intervals;
  default is empty. Record: `{ start, end, number, source }`.
- `calendar.at(instant, locale?)`: frozen tithi plus normalized UTC `start`, `end`
  and `source`, or null when no interval covers the instant. Lookup is binary.

Intervals are start-inclusive/end-exclusive, positive in duration, and cannot
overlap. They may have gaps. Tithi boundaries are instants; a sunrise tithi or
festival assignment additionally requires the location and almanac convention.
At exact angular boundaries the new segment begins (180° is krishna pratipada).
No astronomical positions or festival dates are estimated by this library.

## Errors

`TypeError` indicates incompatible input types or noninteger date/amount fields.
`RangeError` indicates invalid dates, unsupported coverage, unknown patterns,
invalid locales, timezone errors, ambiguous wall times, or invalid data records.
`isValidBS()` converts date-validation errors to false. No conversion silently
normalizes an impossible date.

## Data exports

```js
// CommonJS; modern ESM JSON imports use the runtime's JSON import attributes.
const calendar = require('@prabish01/nepali-date/data/calendar.json');
const holidays = require('@prabish01/nepali-date/data/holidays.json');
```

The core snapshots its own input data, so mutating an imported JSON object does
not change conversion results. Data versions are separate from package versions.
