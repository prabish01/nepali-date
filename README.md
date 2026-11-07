# Nepali Date

Immutable Bikram Sambat dates for JavaScript and TypeScript, with English and
Nepali parsing/formatting, Nepal timezone conversion, fiscal years, holiday
records, and tithi utilities. Zero runtime dependencies. ESM and CommonJS.

**Pre-release 0.1.0.** Prepared for community review; not published to npm yet.
The proposed npm name is `@prabish01/nepali-date`; registry ownership and name
availability must be confirmed before publishing.

## Coverage

| Feature | Included |
| --- | --- |
| BS ↔ AD | BS 1975-01-01 through 2083-12-30; AD 1918-04-13 through 2027-04-13, inclusive |
| Calendar data | Pinned community-maintained month table, provenance and checksums; future projections excluded from conversion |
| Formatting/parsing | English/Nepali names, Latin/Devanagari numerals, strict patterns and weekday validation |
| Arithmetic | Days, months, years, comparison, intervals, month/year boundaries and calendar grids |
| Nepal time | `Asia/Kathmandu` IANA rules, including historical offsets; modern NPT is UTC+05:45 |
| Fiscal years | Shrawan 1 through the last day of Ashadh; labels, quarters and bounds |
| Holidays | 45 dated records from the official MOHA 2083 notice, with national and conditional scopes |
| Tithi | All 30 names, classification from supplied Sun/Moon longitudes, and sourced interval lookup |

**Tithi is not a daily almanac:** no ephemeris or dated tithi dataset is bundled.
Holiday coverage is not exhaustive: unannounced dates, later notices and local
additions are excluded. Missing records do not establish that a day is a working
day. See [data provenance](docs/DATA.md) for evidence and coverage limits.

## Install locally

Requires Node.js 20 or newer for development. Modern browsers work through a
bundler with `Intl.DateTimeFormat` and IANA timezone support.

```sh
npm ci
npm run check
npm pack
```

Install the resulting archive in your application:

```sh
npm install /path/to/prabish01-nepali-date-0.1.0.tgz
```

After the package is published, registry installation will be:

```sh
npm install @prabish01/nepali-date
```

## Quick start

```js
import { BSDate, adToBS, fromInstant } from '@prabish01/nepali-date';

// Months and days are 1-based.
const date = new BSDate(2083, 1, 1);

date.toAD();                                  // { year: 2026, month: 4, day: 14 }
date.format('dddd, D MMMM YYYY');              // 'Tuesday, 1 Baishakh 2083'
date.format('DD MMMM YYYY', { locale: 'ne' });  // '०१ वैशाख २०८३'
BSDate.parse('२०८३-०१-०१').toString();          // '2083-01-01'
adToBS({ year: 2026, month: 4, day: 14 });      // BSDate(2083, 1, 1)

date.addDays(1).toString();                    // '2083-01-02'
date.toString();                              // '2083-01-01' (unchanged)
fromInstant('2026-04-13T18:15:00Z').toString();  // '2083-01-01' in Nepal
```

CommonJS:

```js
const { BSDate } = require('@prabish01/nepali-date');
```

Both module systems include TypeScript declarations. Run
`node examples/basic.mjs` after building for more examples.

## Civil dates and instants

`BSDate` represents a calendar day; it does not store a time or timezone.
`adToBS()`/`bsToAD()` accept civil objects and perform integer day arithmetic.
They never use the host machine's local timezone.

Use `fromInstant()` when starting with an actual timestamp, and `toInstant()`
when resolving a BS day and wall time. Both default to `Asia/Kathmandu`.

```js
import { BSDate, fromInstant, toInstant } from '@prabish01/nepali-date';

fromInstant('2026-04-13T18:14:59Z').toString(); // '2082-12-30'
fromInstant('2026-04-13T18:15:00Z').toString(); // '2083-01-01'

toInstant(new BSDate(2083, 1, 1)).toISOString();
// '2026-04-13T18:15:00.000Z'

new BSDate(2083, 1, 1).toInstant({ hour: 12, minute: 30 });
BSDate.today(); // The current Nepal civil date, within the supported table.
```

String instants must include seconds and an explicit `Z` or `±HH:MM` offset;
up to three fractional-second digits are accepted. Local datetime strings and
leap seconds are rejected. Existing JavaScript `Date` values represent instants;
the library cannot undo a host-local interpretation that happened when you
constructed one.

Timezone conversion uses the runtime's IANA data, including Nepal's earlier
offsets. `toInstant()` rejects missing or repeated local times rather than
silently choosing one. For example, midnight on AD 1986-01-01 in Kathmandu did
not exist; the first valid wall time was 00:15. See [API details](docs/API.md).

## Parsing and formatting

```js
import { BSDate, parseBS } from '@prabish01/nepali-date';

const date = parseBS('1 Baishakh 2083', 'D MMMM YYYY');
date.format('[BS] YYYY/MM/DD'); // 'BS 2083/01/01'

BSDate.parse('०१ वैशाख २०८३', 'DD MMMM YYYY', { locale: 'ne' });
date.format('DD MMMM YYYY', { locale: 'ne', numerals: 'latin' });
// '01 वैशाख 2083'
```

| Token | Meaning | Example |
| --- | --- | --- |
| `YYYY` | Four-digit BS year | `2083` |
| `M`, `MM` | Month number | `1`, `01` |
| `MMM`, `MMMM` | Short/full month name | `Bai`, `Baishakh` |
| `D`, `DD` | Day of month | `1`, `01` |
| `d` | Weekday, Sunday=0 | `2` |
| `ddd`, `dddd` | Short/full weekday | `Tue`, `Tuesday` |
| `[text]` | Literal text, preserved as written | `[BS]` |

Parsing consumes the entire input, requires a year/month/day and rejects
invalid dates, duplicate fields, unknown tokens and mismatched weekdays.
Named parsing is case-sensitive. Both numeral systems are accepted.
`locale: 'ne'` defaults to Nepali numerals; override with `numerals: 'latin'`.
Short Nepali names use the full name. English month abbreviations are
`Bai Jes Asa Shr Bha Asw Kar Man Pou Mag Fal Cha`, so Ashadh and Ashwin remain
unambiguous. Literal text must be wrapped in brackets.

## Arithmetic and fiscal years

```js
import { BSDate, fiscalYear, fiscalYearBounds, monthGrid } from '@prabish01/nepali-date';

new BSDate(2083, 3, 32).addMonths(1).toString(); // '2083-04-31'
new BSDate(2083, 3, 32).addMonths(1, 'reject');  // throws RangeError

fiscalYear(new BSDate(2082, 4, 1));
// { startYear: 2082, endYear: 2083, label: '2082/83', quarter: 1 }

fiscalYearBounds(2082);
// { start: BSDate(2082, 4, 1), end: BSDate(2083, 3, 32) }

monthGrid(2083, 1); // Weeks of seven cells; null padding; Sunday first.
```

Month/year arithmetic constrains the day by default, with an optional `'reject'`
policy. Operations outside the calendar table throw. `differenceInDays(a, b)`
is signed `a - b`. Fiscal labels can describe a year crossing coverage limits;
`fiscalYearBounds()` requires both complete boundaries to be convertible.

## Holidays

```js
import { BSDate, HolidayCalendar, holidayCoverage } from '@prabish01/nepali-date';

const holidays = new HolidayCalendar();
holidays.forDate(new BSDate(2083, 1, 1), 'NP-national');
holidays.forYear(2083, 'NP-region:KathmanduValley');
holidayCoverage(); // Version, source, years, pending observances, complete: false.
```

The default records come from the original Nepal Ministry of Home Affairs
2083 notice, with a page-specific source on each record. `NP-national` denotes
the notice's nationwide government-office/public-body holidays; eligibility
and service-opening exceptions in the notice still apply. Regional, community,
education and employee-specific records have separate explicit scopes.
Omitting `scope` returns **all** matching scopes; pass one to filter eligibility.

Provide your own sourced records for additional years, municipal notices or
company calendars:

```js
const company = new HolidayCalendar([{
  id: 'company-day',
  date: '2083-02-01',
  name: 'Company holiday',
  scope: 'company:example',
  source: 'Example company approved leave policy, revision 1',
}]);
```

This example is illustrative. `isHoliday() === false` means no matching record;
it does not certify a working day. `isWeekend()` checks Saturday independently.

## Tithi

```js
import { tithi, tithiFromLongitudes, TithiCalendar } from '@prabish01/nepali-date';

tithi(15);            // { number: 15, day: 15, paksha: 'shukla', name: 'Purnima' }
tithi(30, 'ne');      // Krishna paksha, अमावस्या

// Illustrative angular inputs, not the ephemeris for a particular date.
tithiFromLongitudes(350, 10).number; // 2 (20° lunar elongation)

const almanac = new TithiCalendar();
almanac.at('2026-04-14T00:00:00+05:45'); // null: no sourced intervals loaded.
```

To look up actual tithi at an instant, supply sourced interval records containing
`start`, `end`, `number` (1–30), and `source`. Intervals must not overlap and are
start-inclusive, end-exclusive. Gaps return `null`. This supports changes during
a civil day without pretending that every date has one tithi. See
[data imports](docs/DATA.md#tithi-imports). Longitude classification requires
both angles in `[0, 360)` from the same reference frame and instant; computing
them and applying location/sunrise festival conventions belongs to your provider.

## Development

```sh
npm ci
npm run check
```

Checks cover every supported civil day, known date references, source hashes,
strict parsing, fiscal boundaries, timezone transitions, browser bundling,
TypeScript ESM/CommonJS consumers and an offline-installed npm tarball.
The CI matrix runs Node.js 20, 22 and 24 in three default timezones.

See [API reference](docs/API.md), [contributing](CONTRIBUTING.md),
[release instructions](docs/RELEASING.md), and [changelog](CHANGELOG.md).

Library code: [MIT](LICENSE). Calendar-table redistribution also retains the
upstream [Apache-2.0 license](licenses/Apache-2.0.txt) and
[third-party attribution](THIRD_PARTY_NOTICES.md).

## Author

**Prabish Dangi** · [LinkedIn](https://www.linkedin.com/in/prabish-dangi-04a649211/) · [GitHub](https://github.com/prabish01)
