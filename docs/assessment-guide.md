# Assessment guide and honest readiness check

This is a planning and explanation aid. It does not guarantee a grade, replace the Moodle template or substitute for understanding the work in the interview.

## Why, who, what, how

**Domain:** Birdwatching in Australia, within the assigned Australian wildlife theme.

**Why:** Explain where citizen-science observations concentrate, how recorded bird composition changes seasonally, and why recording coverage and extinction risk need separate interpretation.

**Who:** General readers in Malaysia, without assumed familiarity with Australian seasons, geography or bird taxonomy. The introductory note explains the southern-hemisphere calendar; scientific terms are introduced in context.

**What:** Geospatial and temporal aggregated observation counts; species and family categories; national conservation categories and state associations; administrative boundaries and land areas. Sources and filtering are documented in the methodology and query log.

**How:** A scrolling narrative progresses from geographic coverage to seasonal patterns, conservation context and the completeness of recent records. Maps answer where; cyclic and ranked temporal charts answer when and which; set intersections explain overlapping state responsibilities. Every figure offers a data table, CSV and readable JSON specification.

## Rubric mapping

| Requirement | Evidence / remaining work |
|---|---|
| More than ten charts | Thirteen separately numbered figures; no repeated small multiples are counted as extra charts. |
| At least eight advanced idioms | Gridded map, choropleth, proportional-symbol map, treemap, alluvial diagram, circular heatmap, bump chart, ridgeline, species heatmap, beeswarm and UpSet. The coverage calendar is now a categorical status matrix rather than a second continuous heatmap, so it no longer duplicates the species heatmap. The closing chart is a diverging lollipop and is not claimed as advanced. Final classification is the tutor's judgement. |
| Three distinct map idioms | One-degree gridded count map, state record-density choropleth and seasonal proportional-symbol map. |
| Vega / Vega-Lite | All thirteen diagrams use these libraries, with public readable JSON files prepared. |
| Two different data sources combined | ALA-hosted community records join DCCEEW national listings by scientific name. Land-area comparison adds Geoscience Australia. ALA and GBIF are not falsely treated as independent duplicate datasets. |
| Recent reliable data | Latest accessible snapshot retrieved September 2026, August 2026 conservation list, recent platform comparison. The 2024 seasonal baseline is explicitly justified by missing recent eBird coverage. |
| Public GitHub page | Published and verified loading for a signed-out visitor at the live URL, with all thirteen charts drawing. Re-verify after the next push. |
| Storytelling and annotation | Four narrative chapters, interpretive titles, margin findings, chart labels and reading guidance. This is a qualitative marking judgement, not a box that guarantees HD. |
| Layout, colour, typography | One twelve-column grid at a 24px gutter, three span patterns and five vertical sight lines down the page. Four type steps from 20px to 11px with every prose block capped near 60 characters and no centred multi-line text. Green means record volume on every figure; the only categorical hues left are the four seasons, which avoid red against green. |
| Interactivity | Season selector, species highlighting, tooltips and accessible data tables. The bump chart opens on the Welcome Swallow, the bird its headline is about, so the claim is visible before any control is touched. |
| Authorship and attribution | Author/date, original data references, library/font credits and explicit AI acknowledgement. |
| Hand-drawn sketch | Still required from the student. The user reports their lecturer permits drawing it after the website. Draw the actual final layout by hand; include at least four clear sections and varied maps/diagrams. |
| Moodle description | Adapt the rationale above to the supplied template; include the page URL and hand-drawn sketch PDF URL. |
| Interview | Student must explain the choices, transformations, limitations and course concepts in their own words. |

## Interview topics to understand

1. Why observation count is not bird abundance, and how observer effort creates bias.
2. Why the three map idioms encode different quantities and use an equal-area projection.
3. How the seasonal clock handles different month lengths; what a relative value of 1 means.
4. Why the bee-eater seasonal pattern is not an inferred flight path.
5. How the exact-name conservation join handles species, subspecies and unmatched taxonomy.
6. How to read an UpSet column and why summing per-state totals would double-count taxa.
7. Why the recent eBird coverage requires separating the 2024 baseline from the recent view.
8. The tradeoff between unusual visual forms and clarity, particularly the circular heatmap and ridgeline.
9. Why the coverage calendar encodes only whether a month has records, rather than how many. A ramp normalised per row made 719,000 and 22,400 the same green, so colour meant something different in every row.
10. Why the closing chart shows percentage change rather than change per 10,000. On the absolute scale the most-recorded birds top the ranking on base rate alone: the Kookaburra's fall of 5.1 is 2.6% of its share while the Silvereye's 6.2 is 10.7%.
11. Why the species heatmap keeps four near-flat rows. They are the control that makes the migrant rows mean something; a chart of only movers would overstate how seasonal Australian birdlife is.
12. Why no chart uses hue to name a species. Seven arbitrary hues would exceed the handful the colour notes allow and would make green mean both a bird and a record count.
13. Why the data does not support a flow map. A flow map needs an origin, a destination and a magnitude on one row, and every table here is a count at one place or in one category. Drawing bee-eater arrows would manufacture the migration inference the captions disclaim.

## Before submission

Complete the final browser QA; publish on GitHub Pages; draw and upload the hand sketch as a PDF; fill in the Moodle description template; check the public links on another device; prepare for the interview. The brief's deadline is 25 October 2026, 11:55 PM.
