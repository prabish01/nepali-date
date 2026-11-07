# Third-party data

`data/calendar.json` is a filtered and JSON-transformed calendar table from
[amitgaru/nepali-datetime](https://raw.githubusercontent.com/amitgaru/nepali-datetime/83bb3b2ea62359dd0a63cce68553bcebf94e1ebc/nepali_datetime/data/calendar_bs.csv),
revision `83bb3b2ea62359dd0a63cce68553bcebf94e1ebc`. Copyright 2026 Amit Garu. Licensed under Apache-2.0;
the full upstream license and copyright notice are in `licenses/Apache-2.0.txt`.
No upstream implementation code is used. The original CSV is retained in
`data/upstream/calendar_bs.csv`; source and transformed months SHA-256 hashes
are recorded in the calendar JSON.

The library code is MIT licensed. The calendar data retains its Apache-2.0
attribution and license. Keep both licenses in redistributed packages.

Holiday date facts are transcribed from the [Nepal Ministry of Home Affairs 2083 notice](https://www.moha.gov.np/en/page/government-and-public-holidays-in-2083), sections 2–7 (PDF pages 2–6). Each record includes a page-specific source URL. Labels and JSON structure are original. Conditional eligibility and unknown announcement dates remain explicit. The original PDF SHA-256 is recorded in `data/holidays.json`; the PDF is not bundled. This is not a claim about every later/local announcement or every employee's holiday entitlement.

Tithi names are traditional terminology. No ephemeris or third-party tithi dataset is bundled. The 12-degree longitude classification follows the [Positional Astronomy Centre, India Meteorological Department explanation](https://packolkata.imd.gov.in/panchang/en/explanation).
