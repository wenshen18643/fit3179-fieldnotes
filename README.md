# Fieldnotes: Australia, through a birdwatcher's eyes

A static, single-page FIT3179 visual field journal for Malaysian readers. Eleven original Vega/Vega-Lite charts, five of them maps, use real observation, conservation and population data. No API keys, account login or build server are required to view the site.

## Local preview

```sh
npm install
npm start
```

Open http://127.0.0.1:4179. The web page cannot be opened directly with `file://` because browsers restrict fetching local JSON files.

## Reproduce

The repository includes archived source responses, processed data, a query log and human-readable chart specifications. The browser downloads only `data/story.json` (approximately 600 KB), two Google Fonts families (Fraunces and Source Sans 3) and vendored chart libraries. Raw archives are not fetched by the page.

```sh
npm run build
npm run check
```

## Files

- `index.html`: the whole page: text, styles, chart builders and interactions.
- `specs/*.json`: readable exported chart specifications.
- `data/provenance.json`: exact data queries and response checksums.
- `data/raw/`: source snapshots and provider metadata.
- `data/processed/`: chart tables in JSON.

## GitHub Pages — final stage

The live static site is published at https://wenshen18643.github.io/fit3179-fieldnotes/. The site uses relative URLs and is published from the repository root with `index.html`, `assets/`, `vendor/`, `data/`, and `specs/` available.

Source data retain their own licences, including non-commercial conditions. This is an educational visualisation, not a relicensed dataset. See the archived provider metadata in `data/raw/`.
