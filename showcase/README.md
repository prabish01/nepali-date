# Nepali Date showcase

A static, interactive showcase for `@prabish01/nepali-date@0.1.1`. It uses the
published package directly; conversion logic and calendar data are not duplicated.

## Run locally

From this folder:

```sh
npm ci
npm run dev
```

Open http://localhost:4173. Edits to HTML, CSS and JavaScript rebuild the local
files; refresh the browser to see them. Stop with Ctrl+C.

## Deploy on Vercel

Import `prabish01/nepali-date`, then set:

- Root Directory: `showcase`
- Framework Preset: Other
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`

`vercel.json` supplies the build settings. No API keys, environment variables or
server functions are required. The build bundles the library, icons and fonts,
so the deployed page does not load code from a third-party CDN.

## What is interactive

- Calendar navigation and day selection.
- BS/AD conversion with actual date validation.
- English/Nepali formatting and strict parsing.
- Day/month/year arithmetic and day differences.
- Nepal fiscal-year labels, quarters and supported boundaries.
- Explicit-instant conversion across timezones.
- Holiday filtering by year, month and eligibility scope.
- Tithi classification from supplied angles and JSON interval imports.
- Theme switching, keyboard navigation and code/installation copying.

Tithi angles are examples, not a current ephemeris. No daily almanac is bundled.
Holiday coverage remains the package's partial MOHA 2083 notice. The page labels
these limits and does not estimate missing data.

## Build

```sh
npm run build
npm run preview
```

`dist/`, `node_modules/` and local QA captures are ignored by Git. The parent
library's npm publishing allowlist excludes this showcase.

Author: [Prabish Dangi](https://www.linkedin.com/in/prabish-dangi-04a649211/).

## Social preview and SEO

The committed `public/nepali-date-bs-ad-converter-og.png` is a 1200×630 PNG
rendered entirely from the actual hero HTML/CSS, self-hosted fonts and live
calendar output. It uses the fixed reference 2083-01-01 BS = 2026-04-14 AD;
it contains no generated artwork or external stock assets.

Regenerate it after changing the hero:

```sh
npm run render:og
npm run check:seo
```

The export script uses system Google Chrome on macOS when available. Elsewhere,
run `npx playwright install chromium` first, or set `CHROME_PATH` to a Chrome
executable. Browser installation is only needed for exporting the image, not
for Vercel builds. The static image is committed and copied during each build.

The initial HTML includes a descriptive search title, meta description,
canonical URL, Open Graph and Twitter image tags, and JSON-LD for the website,
source library, image and author. `robots.txt` points to the single-page sitemap.
After deployment, LinkedIn's Post Inspector can refresh a previously cached
preview; an already saved Featured item may need to be added again.
