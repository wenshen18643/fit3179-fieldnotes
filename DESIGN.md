# Field journal design system

## Scene

A curious Malaysian student opens a naturalist's beautifully illustrated notebook at a bright library desk, on a 13-inch laptop. They should be drawn into the observations without needing to operate a research dashboard.

## Visual direction

The user explicitly chose warm paper, bird illustrations and specimen-style annotations. This environmental choice overrides generic avoidance of paper palettes. A honey-ochre binding, near-black ink, restrained eucalyptus green and rust red give the journal its identity. No faux SVG bird drawing, heavy texture, chart-card grid or gratuitous animation.

## Palette

CSS colours use OKLCH. Ochre hue 75 anchors the brand seed; green denotes record volume, rust denotes conservation context, and distinct seasonal colours accompany explicit labels. Pale warm paper is the requested material. Chart ramps are ColorBrewer schemes, as the unit's colour notes direct: Greens for record volume, BrBG for above or below a midpoint (the seasonal clock, species heatmap and seasonal contours), OrRd for rising extinction risk.

Green means one thing across every figure: more records than the comparison. That covers raw counts, density, above-average recording pace, a larger-than-usual monthly share and a growing share between years. Ochre is the other end of the same idea. No chart uses hue to name a category except the four seasons, which is why the species palette was removed: the bump chart mutes every line and colours only the one the reader selects, and the cartogram carries record count on lightness within a single green. The four seasonal hues avoid any red-against-green pair, the combination that collapses under the commonest colour blindness. Brand ochre reaches only 3.67:1 on paper, so text and small marks use a darker step of the same hue at 4.89:1.

## Typography

Fraunces, a soft old-style display serif, evokes a field guide's plates and carries headings, notes and large numbers. Source Sans 3 carries reading text, labels and every chart. Both are open-source Google Fonts. The cover title is capped at 112px; display type is used only for headings and short leads.

The hierarchy: 22px figure titles, 16px for everything a reader reads (body, figure decks, notes, sources), 14px byline, 12px metadata; chart labels are 10–12px. Running prose is capped at 23em, measured in the browser at 60 characters or fewer per line in every column. No multi-line text is centred.

## Layout

One twelve-column grid runs the whole page at a 24px gutter, up to 1720px wide. The cover is 7 + 5: title, deck and four key numbers beside the illustration. Each chapter has a sticky rail in the first three columns holding its question, so the chapter stays named while its figures scroll in the other nine. Inside those nine, a figure with its note is 6 + 3 (3 + 6 when the note leads), two figures are equal halves, and a single figure runs the full nine. The story has three chapters and a sources appendix on one page. Below 1180px the rail sits above its chapter and figures take the full width; below 760px everything is one column.

## Interactions

Anchor navigation, accessible selectors, direct hover and focus detail, downloadable CSVs and readable JSON specifications. All major findings are visible by default. Respect reduced motion; avoid delayed visibility. At narrow widths charts are rebuilt at the available width and paired spreads stack.

## Figure conventions

Each figure has a headline title stating its finding, a one- or two-sentence reading guide, a period line only when the figure's date differs from the page's 2024, units in its legend, and tooltips. Chart data and readable specifications are in the repository. Counts mean database records, never birds or unique volunteers. Missing reporting periods are visually distinct from zero counts. Narrative values are computed from the data snapshot.
