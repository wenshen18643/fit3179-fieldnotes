# Fieldnotes: Australia, through a birdwatcher's eyes

A static, single-page FIT3179 visual field journal for Malaysian readers. Thirteen original Vega/Vega-Lite charts use real observation and conservation data. No API keys, account login or build server are required to view the site.

## Local preview

```sh
npm install
npm start
```

Open http://127.0.0.1:4179. The web page cannot be opened directly with `file://` because browsers restrict fetching local JSON files.

## Reproduce

The repository includes archived source responses, processed data, a query log and human-readable chart specifications. The browser downloads only `data/story.json` (approximately 335 KB), local fonts, a compressed illustration and vendored chart libraries. Raw archives are not fetched by the page.

```sh
python -m pip install pyshp
python scripts/fetch_data.py
python scripts/fetch_context.py
python scripts/prepare_data.py
npm run build
npm run check
```

Downloads use a local cache to preserve the snapshot and avoid unnecessary API requests. Refresh intentionally by moving the archived files to a dated directory first; a newer snapshot may change the findings and must be reviewed. `scripts/fetch_fonts.py` reconstructs the self-hosted font assets.

## Files

- `index.html`, `styles.css`, `src/app.js`: narrative and interactions.
- `src/chart-specs.js`: original chart builders; `specs/*.json`: readable exported specifications.
- `data/provenance.json`: exact data queries and response checksums.
- `data/raw/`: source snapshots and provider metadata.
- `data/processed/`: chart tables in JSON and CSV.
- `docs/methodology.md`: definitions, attribution and limitations.
- `docs/assessment-guide.md`: rationale, rubric mapping and remaining submission work.
- `docs/artwork.md`: image-generation acknowledgement and prompt.

## GitHub Pages — final stage

The live static site is published at https://wenshen18643.github.io/fit3179-fieldnotes/. The site uses relative URLs and is published from the repository root with `index.html`, `assets/`, `vendor/`, `src/`, `data/`, `specs/`, and `docs/` available.

Source data retain their own licences, including non-commercial conditions. This is an educational visualisation, not a relicensed dataset. See the methodology and archived provider metadata.
