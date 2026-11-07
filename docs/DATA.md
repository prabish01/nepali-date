# Data provenance and maintenance

## Calendar

Bikram Sambat month lengths vary by year. Conversion uses a finite month-length
table, not a Gregorian offset or a guessed recurring cycle.

The initial table is the 1975–2083 subset of
[amitgaru/nepali-datetime calendar_bs.csv at revision 83bb3b2](https://raw.githubusercontent.com/amitgaru/nepali-datetime/83bb3b2ea62359dd0a63cce68553bcebf94e1ebc/nepali_datetime/data/calendar_bs.csv).
The upstream reference is [1975-01-01 BS = 1918-04-13 AD](https://raw.githubusercontent.com/amitgaru/nepali-datetime/83bb3b2ea62359dd0a63cce68553bcebf94e1ebc/nepali_datetime/config.py).
`data/upstream/calendar_bs.csv` retains the exact original snapshot for offline
checksum verification. That snapshot also contains future rows which are
**excluded** from the active conversion table.

The active dataset has 109 years / 1,308 months / 39,813 days, ending on
2083-12-30 BS = 2027-04-13 AD. It is community-sourced and has not been
independently certified against every historical official almanac. Do not
interpret the automated checks as an official endorsement.

`calendarInfo()` returns the source revision and SHA-256 of the original CSV,
plus SHA-256 of the transformed `months` object encoded with `JSON.stringify()`.
Rows are kept in ascending numeric year order. Date references are recorded in
`tests/fixtures/anchors.json`; the modern references include published Nepal
embassy dates. Round-trip tests establish algorithmic consistency; published
reference checks add external evidence but do not verify every month separately.

Calendar data retains its upstream Apache-2.0 license and attribution. Original
implementation code is MIT licensed. See `THIRD_PARTY_NOTICES.md`.

## Timezones

Civil conversion operates on UTC day ordinals; timezones do not shift those
civil objects. Instant conversion delegates to the runtime's IANA timezone data.
The [IANA Asia/Kathmandu entry](https://github.com/eggert/tz/blob/main/asia)
records historical UTC+05:41:16, UTC+05:30, then modern UTC+05:45. Hardcoding
+05:45 for all historical dates would be incorrect.

The regression suite checks the 1986 skipped midnight, historical local mean
time, DST gaps/overlaps in another zone, and a skipped day in Pacific/Apia.

## Fiscal-year basis

The [Financial Procedures and Fiscal Responsibility Act, 2076](https://lawcommission.gov.np/content/13412/economic-procedures-and-financial-affairs-act--2076/)
defines Nepal's fiscal year from the first day of Shrawan to the last day of
Ashadh in the following BS year. Quarter numbering here uses successive blocks
of three BS months; it is a calendar helper, not a tax filing/deadline engine.

## Holiday notice

Initial holiday data was manually transcribed from the original
[MOHA government/public holiday notice for BS 2083](https://www.moha.gov.np/en/page/government-and-public-holidays-in-2083),
Nepal Gazette dated 2082/11/18, sections 2–7, PDF pages 2–6. The dataset records
the PDF URL, SHA-256 and a page link on each record. The 8 MB PDF is not bundled.

45 dated entries include national government-office/public-body holidays and
explicit regional, community, educational and employee categories. Multi-day
Dashain and Tihar holidays are expanded into individual BS dates. Two distinct
observances on one date remain separate records. Saturday weekends are supplied
by `isWeekend()` rather than enumerated.

`complete` is false. Eid, Siruwa Pawani, Bhoto Jatra, Mohammad Jayanti and Guru
Nanak Jayanti lack fixed dates in the source and are listed in
`pendingObservances`; they are not guessed. Later announcements and municipality
or employer policies are not bundled. Section 10 of the original notice also
requires some services to remain available on holidays. A national record does
not mean every service closes.

The `NP-region:terai` Holi entry applies to the notice's named districts:
Jhapa, Morang, Sunsari, Saptari, Siraha, Dhanusha, Mahottari, Sarlahi, Rautahat,
Bara, Parsa, Nawalparasi (Bardaghat Susta East), Nawalparasi (Bardaghat Susta West),
Rupandehi, Kapilvastu, Dang, Banke, Bardiya, Kailali and Kanchanpur. The original
notice is the authority if an English label or regional shorthand is ambiguous.

## Tithi imports

The [Positional Astronomy Centre explanation](https://packolkata.imd.gov.in/panchang/en/explanation)
defines tithi by successive 12-degree gains of lunar longitude over solar
longitude. `tithiFromLongitudes()` classifies supplied positions; it does not
produce them. Its floating-point result inherits the precision of your provider.

For actual dated lookups, pass an array with this structure:

```ts
interface TithiRecord {
  start: string; // Explicit-offset timestamp, inclusive.
  end: string;   // Explicit-offset timestamp, exclusive.
  number: number; // 1–30; 15=Purnima, 30=Amavasya.
  source: string; // Published almanac/provider and revision.
}
```

```js
import { TithiCalendar } from '@prabish01/nepali-date';

// Your own licensed, sourced interval file; not included with this package.
const calendar = new TithiCalendar(recordsFromYourProvider);
const result = calendar.at('2026-04-14T06:00:00+05:45');
```

Do not infer a day-long tithi interval from a date-only festival listing. Keep
location and sunrise conventions with your source documentation. The library
returns `null` outside imported intervals. Synthetic test fixtures are clearly
marked and never included as production almanac data.

## Updating datasets

1. Obtain a dated primary notice/almanac and retain a stable source link, revision,
   retrieval date and licensing terms. For calendar extensions, compare month
   lengths against an independent reference rather than another copy of the same
   table. Do not add projected years as verified official dates.
2. Update JSON, its data version, source metadata and hashes. Do not overwrite
   historical evidence silently. Record every corrected date and affected range.
3. Add published reference pairs, boundary cases, scope/eligibility tests and any
   regression example. Adjust the range and exhaustive day-count test explicitly.
4. Run `npm run check`, update docs and the changelog, then review the packaged
   data and source notices. Calendar corrections can change historical outputs;
   clearly explain them in release notes.
