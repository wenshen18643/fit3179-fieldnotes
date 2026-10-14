# Assessment guide and honest readiness check

This is a planning and explanation aid. It does not guarantee a grade, replace the Moodle template or substitute for understanding the work in the interview.

## Why, who, what, how

**Domain:** Birdwatching in Australia, within the assigned Australian wildlife theme.

**Why:** Explain where citizen-science observations concentrate, how recorded bird composition changes seasonally, and why recording coverage and extinction risk need separate interpretation.

**Who:** General readers in Malaysia, without assumed familiarity with Australian seasons, geography or bird taxonomy. The seasons chapter's intro explains the southern-hemisphere calendar; scientific terms are introduced in context.

**What:** Geospatial and temporal aggregated observation counts; species and family categories; national conservation categories and state associations; administrative boundaries and land areas. Sources and filtering are documented in the methodology and query log.

**How:** A scrolling narrative in three chapters: where records are made, how the seasons change them, and what records cannot say about conservation. Maps answer where; cyclic and ranked temporal charts answer when and which; set intersections explain overlapping state responsibilities. Every chart's data (`data/processed/`) and readable specification (`specs/`) are public in the repository.

## Rubric mapping

| Requirement | Evidence / remaining work |
|---|---|
| More than ten charts | Eleven charts, each a different idiom; no small multiples. Eleven is one above the threshold, a deliberate choice: four weaker charts (spike map, treemap, alluvial, lollipop) and the coverage grid were removed rather than kept as padding. |
| At least eight advanced idioms | Square bin map, choropleth, proportional-symbol map, filled contour map, Dorling cartogram, circular heatmap, ridgeline, species heatmap, beeswarm and UpSet: ten outside the basic list. The bump chart is a ranked multi-line chart and is not claimed as advanced. Final classification is the tutor's judgement. |
| Map idioms: at least three (spec); five targeted | Five map figures, five distinct idioms by the Week 8–9 notes: 1° square bin map, state choropleth (rates, not totals), area-proportional circles, filled isoline map of a smoothed field, and Dorling cartogram. Each map's control answers a question its headline asks. |
| Vega / Vega-Lite | All eleven charts use these libraries, with public readable JSON files in `specs/`. |
| Two different data sources combined | ALA-hosted community records join DCCEEW national listings by scientific name. Land-area comparison adds Geoscience Australia. ALA and GBIF are not falsely treated as independent duplicate datasets. |
| Recent reliable data | Latest accessible snapshot retrieved September 2026; conservation list of 28 August 2026. Every chart uses 2024, the latest complete year; Methods states why (no eBird records after August 2025). |
| Public GitHub page | Published and verified loading for a signed-out visitor at the live URL, with all charts drawing. Re-verify after the next push. |
| Storytelling and annotation | Three narrative chapters, headline titles stating each finding, a one-paragraph intro per chapter, and labels and annotations on the charts themselves; no separate notes repeat what a chart shows. This is a qualitative marking judgement, not a box that guarantees HD. |
| Layout, colour, typography | One twelve-column grid at a 24 px gutter: cover 7 + 5; each chapter a title-and-intro band (6 + 6), then rows of equal 6 + 6 figure pairs or full-width figures, with each pair's charts starting on one line and sized to the same height, so no chart sits beside empty space. Body text is 16 px (12 pt, the top of the 11–12 pt digital recommendation); running prose measured in the browser at 60 characters or fewer per line in every column; no multi-line text is centred. Fraunces (display) and Source Sans 3 (text and charts). Green means record volume on every figure; the only categorical hues are the four seasons, which avoid red against green. |
| Interactivity | Share control on the bin map, land/people toggle on the choropleth, season selector and play on the bee-eater map, bird highlight on the bump chart, all-birds/bee-eater toggle on the contour map, and a cartogram–UpSet linked selection; tooltips throughout. Every chart opens on the view its headline describes, so the claim is visible before any control is touched. |
| Authorship and attribution | Author/date, original data references, library/font credits and explicit AI acknowledgement. |
| Hand-drawn sketch | Still required from the student. It must be hand-drawn on A4: a digitally made sketch scores 0 on the sketch criterion, and a missing sketch costs 3%. The spec schedules it for the Week 7 studio; the user reports their lecturer permits drawing it after the website. Draw the actual final layout; the HD band asks for at least four clear sections with varied charts and maps. |
| Moodle description | Adapt the rationale above to the supplied template; include the page URL and hand-drawn sketch PDF URL. |
| Interview | Week 12 studio, on the visualisation and Weeks 1–11 material. Student must explain the choices, transformations, limitations and course concepts in their own words. |

## Interview topics to understand

1. Why observation count is not bird abundance, and how observer effort creates bias.
2. What each map encodes, and how the projection applies. All five maps use one Albers (conic equal-area) projection, the family the Week 7 procedure gives for a landscape area between the equator and a pole. Two caveats: the Dorling cartogram's circle areas encode listed taxa, not land area, because cartograms replace the projection with an algorithm; and the bin map's one-degree cells cover about a quarter less ground at 44°S than at 10°S, while the Week 8 notes assume equal-size bins.
3. How the seasonal clock handles different month lengths; what a relative value of 1 means.
4. Why the bee-eater seasonal pattern is not an inferred flight path.
5. How the exact-name conservation join handles species, subspecies and unmatched taxonomy.
6. How to read an UpSet column and why summing per-state totals would double-count taxa.
7. Why every chart uses 2024: eBird supplies 86.8% of 2024 records and has none after August 2025 in this snapshot, so a newer calendar would distort every seasonal pattern.
8. The tradeoff between unusual visual forms and clarity, particularly the circular heatmap and ridgeline.
9. Why the species heatmap keeps four near-flat rows. They are the control that makes the migrant rows mean something; a chart of only movers would overstate how seasonal Australian birdlife is.
10. Why no chart uses hue to name a species. Seven arbitrary hues would exceed the handful the colour notes allow and would make green mean both a bird and a record count.
11. Why the isolines fall at log2 = −2, −1, 0, 1 and 2. The Week 9 notes require a constant contour interval; an interval of 1 on a log2 ratio means every line is a doubling, the round number of a ratio. The zero line (equal shares) is the index contour, drawn heavier.
12. Why the data does not support a flow map. A flow map needs an origin, a destination and a magnitude on one row, and every table here is a count at one place or in one category. Drawing bee-eater arrows would manufacture the migration inference the captions disclaim.
13. Why the atlas outlines its busiest squares instead of fading the rest. Colour lightness carries the count; fading changes lightness, so a faded busy square would read as a quiet one. Munzner ch. 11 recommends an outline when highlighting must keep the existing colour coding.
14. Why the Dorling cartogram uses two channels: area for listed threatened taxa and lightness for 2024 records, so both halves of its headline (most listed, few records) show without a control. Circles are separated until none overlap and are not pulled back inside the coastline.
15. Why the bee-eater circles use 2° squares, and where they sit. At 1° there were about 250 circles a season plus as many rings, far past the few dozen the Week 8 notes allow. ALA's points are rounded to whole degrees, so each 2° circle sits at its records' weighted mean position, not a grid corner that would put coastal circles at sea.
16. Why four charts and the coverage grid were cut: the spike map repeated the proportional-symbol idiom with about 390 dense spikes; the treemap was a weak part-to-whole with half its area grey; the alluvial's ribbons implied movement and eBird's 87% share made the rest slivers; the lollipop's change-in-share metric was hard to explain and showed 10 of 14 birds moving under 5%; the coverage grid described the dataset rather than the birds.
17. Why coastal squares on the bin map are clipped to the coastline. ALA's points are rounded to whole degrees, so a full 1° box at the coast would paint sea that holds almost no records and suggest records offshore. Colour encodes each square's count, not its density, so trimming its shape to land changes no value; the 94 boxes with no land (0.16% of records) are left out of the drawing but kept in the shares.

## Before submission

Complete the final browser QA; publish on GitHub Pages; draw and upload the hand sketch as a PDF; fill in the Moodle description template; check the public links on another device; prepare for the interview. The brief's deadline is 25 October 2026, 11:55 PM. Late work loses 5% per day, with a cut-off after seven calendar days.
