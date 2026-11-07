# Contributing

Bug reports, clearer examples, Nepali language review and properly sourced data
corrections are welcome. Please keep each pull request focused on one change.

## Setup

Use Node.js 20+ and npm:

```sh
npm ci
npm run check
```

The runtime has no dependencies. TypeScript and esbuild are development tools.
Source is in `src/index.cjs`; `src/index.mjs` provides explicit ESM exports.
The deterministic build copies source and produces matching `.d.ts`, `.d.mts`
and `.d.cts` declarations in `dist/`.

## Reporting bugs

Include the package/data version, minimal runnable input, expected and actual
outputs, runtime version, timezone, and source supporting the expected date.
Remove private personal dates and unrelated application data from reports.
For date corrections, provide a published calendar reference and explain whether
other dates after the changed month are affected.

## Changes

Update implementation, named ESM exports, TypeScript declarations, documentation
and focused behavioral tests together. Keep dates immutable, months 1-based,
parsing strict, runtime dependencies at zero and unknown data explicit. Do not
silently expand supported years or compute festival dates by Gregorian recurrence.

Follow [data maintenance requirements](docs/DATA.md) for calendar, holiday and
tithi changes. Preserve upstream notices and licenses. Round trips alone do not
prove that calendar data is historically correct.

Run `npm run check` before submission. Commit attribution must identify the
actual author; do not add automated assistant co-author trailers.
