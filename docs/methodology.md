# Methods and source attribution

## Observation snapshot

The main view contains 9,575,922 records for 2024, retrieved through the Atlas of Living Australia (ALA) on 10 September 2026. Sources are eBird Australia (`dr2009`), BirdLife Australia Birdata (`dr359`) and iNaturalist Australia (`dr1411`). These are aggregated database records, not estimated individuals or unique observers.

Exact request URLs and SHA-256 checksums are stored in [the query log](../data/provenance.json). Each query uses `pageSize=0` and a sufficiently large facet limit to obtain exhaustive counts, not a first-page occurrence sample. The preparation script checks that state, monthly, grid, family and source totals reconcile.

Filters: `class:Aves`; country Australia; human observation; occurrence status present; spatially valid; month 1–12; longitude 112–154°E; latitude 44–10°S; one of the eight main states/territories; and the selected source and year. The spatial window focuses on mainland Australia, Tasmania and nearby islands/waters. It is not every external Australian territory. ALA quality flags are useful but do not guarantee every observation is correct. Sources are combined without cross-platform deduplication.

There are 760 named species in the retained 2024 records and 217,108 records without a species-level assignment. These unassigned records remain in denominators for overall monthly totals, but cannot enter named-species ranks. This is not an inventory of native Australian species.

## Transformations

- Map grid: ALA `point-1` facets, whose coordinates are rounded to whole degrees. The displayed cells have equal angular dimensions, not equal physical area.
- Record density: counts divided by the published total land area of each state, multiplied by 1,000. Coastal records can be included in counts; this is a broad administrative-area comparison.
- Alluvial diagram: source-to-state aggregates; ribbon thickness is linear in record count. Ribbons do not encode movement.
- Treemap: fifteen leading families plus a remainder category. Rectangle area encodes record count.
- Seasonal clock: `(monthly count / days in month) / (state annual count / 366)`. The neutral value is 1. Values beyond the displayed colour domain are clamped, but tooltips retain actual values.
- Bump chart: ranks among all named species within each month; seven displayed species are selected by annual totals. Ties sort by scientific name.
- Bee-eater map and ridgelines: records for `Merops ornatus`. Summer is December, January and February within calendar 2024; other seasons follow the standard calendar groups. Latitude distributions are normalised independently within each month and use rounded one-degree bins. At-or-south-of-30°S comparisons therefore have an approximate spatial threshold.
- Species heatmap: `(species monthly records / all monthly records) / (species annual records / all annual records)`. This controls overall record volume, not observation effort, checklist completeness or species detectability.
- Conservation beeswarm: exact two-part scientific-name matches between the DCCEEW species-level listings and ALA named species, with positive counts. Listed subspecies are not assigned to their parent species. There are 65 matches. Ten in-scope species-level names do not match; this can reflect taxonomy, geographic scope or no observations and is not converted to zero.
- UpSet: exact combinations of positive state associations in the DCCEEW list. Extinct entries and taxa associated only with external jurisdictions are excluded. The remaining 150 extant threatened taxa include species and subspecies. The twelve most common combinations contain 104 taxa; 42 combinations exist.
- Coverage calendar: 2024, 2025 and January–August 2026. September 2026 is incomplete. A cross denotes no records in the archived filtered source snapshot, not zero birds. Colour intensity is normalised separately within each source-year row.
- Recent paired comparison: per-10,000-record shares within iNaturalist for 2024 and 2025. The six greatest absolute differences among the journal's featured set are shown. This is a selected comparison, not a ranking of population changes across all Australian birds.

## Why both time views?

The accessible ALA eBird snapshot contains January–August 2025 but no September–December 2025 records or 2026 records under these filters. Combining that with other sources as a complete recent calendar would distort seasonal patterns. The main analysis therefore uses 2024. The site also shows recent coverage and a 2024–2025 comparison within iNaturalist, which has records in all months of both years. Even a year with twelve reported months need not contain every observation ever made.

## Source credits and licences

- [ALA](https://www.ala.org.au/) and its participating observers and data providers. [eBird Australia](https://collections.ala.org.au/public/show/dr2009), Cornell Lab of Ornithology and the eBird community; archived metadata reports CC0 1.0. [Birdata](https://collections.ala.org.au/public/show/dr359), BirdLife Australia and contributors; CC BY-NC 3.0. [iNaturalist Australia](https://collections.ala.org.au/public/show/dr1411), iNaturalist and contributors; research-grade observation dataset DOI [10.15468/ab3s5x](https://doi.org/10.15468/ab3s5x). Its records have mixed Creative Commons licences, preserved in the archived licence facets. Only statistical aggregates are published here; no contributor photographs are reused.
- [DCCEEW Threatened Species State Lists](https://data.gov.au/data/dataset/threatened-species-state-lists), Commonwealth of Australia, 28 August 2026 release. Portal metadata identifies CC BY 3.0 Australia. Original CSV and resource metadata are preserved locally. National listing categories are used, not global IUCN categories.
- [Geoscience Australia: Area of Australia—States and Territories](https://www.ga.gov.au/scientific-topics/national-location-information/dimensions/area-of-australia-states-and-territories), published land-area table updated 27 June 2014. Values are transcribed in `data/processed/areas.csv`; the source HTML is archived.
- [Natural Earth](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-1-states-provinces/), public-domain 1:50m state boundaries. Coordinates are rounded to four decimals for payload size. The maps use an Albers/conic equal-area projection with standard parallels 18°S and 36°S.
- [BirdLife Australia rainbow bee-eater profile](https://birdlife.org.au/bird-profiles/rainbow-bee-eater/) supplies the natural-history context. The observed seasonal pattern is consistent with its account of northern wintering and summer breeding movements, but occurrence records do not prove individual migration paths.

## Technical and artistic credits

Original chart specifications use Vega 5.33.0, Vega-Lite 5.23.0 and Vega-Embed 6.29.0; their licences are in `vendor/`. Literata, Bricolage Grotesque and Kalam are self-hosted with their SIL OFL files. The cover illustration is AI-generated and separately acknowledged in [artwork.md](artwork.md). OpenAI Codex assisted with research, processing, writing and implementation.
