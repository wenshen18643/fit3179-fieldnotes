# Field journal design system

## Scene

A curious Malaysian student opens a naturalist's beautifully illustrated notebook at a bright library desk, on a 13-inch laptop. They should be drawn into the observations without needing to operate a research dashboard.

## Visual direction

The user explicitly chose warm paper and specimen-style annotations; the page carries no decorative imagery, so every picture on it is data. This environmental choice overrides generic avoidance of paper palettes. A honey-ochre binding, near-black ink, restrained eucalyptus green and rust red give the journal its identity. No faux SVG bird drawing, heavy texture, chart-card grid or gratuitous animation.

## Palette

CSS colours use OKLCH. Ochre hue 75 anchors the brand seed; green denotes record volume, rust denotes conservation context, and distinct seasonal colours accompany explicit labels. Pale warm paper is the requested material. Chart ramps are ColorBrewer schemes, as the unit's colour notes direct: Greens for record volume, OrRd for rising extinction risk, and two diverging schemes that never share a meaning: BrBG only for summer (brown) against winter (teal) in the seasonal contours, and PiYG for quieter (pink) against busier (green) than usual in the seasonal clock and species heatmap.

Green means one thing across every figure: more records than the comparison. That covers raw counts, density, above-average recording pace, a larger-than-usual monthly share and a growing share between years. Ochre is the other end of the same idea. Hue names a category in two places only: the four seasons, and the seven birds of the bump chart. The bump chart uses ColorBrewer Dark2 without its yellow (which fails contrast on paper) and with Set1's blue in place of its green (green means record volume elsewhere), and each bird's name is printed at its line's end in a darker step of the same hue, so the labels are the legend and identity never depends on hue alone; following a bird thickens its line and fades the rest. The cartogram carries record count on lightness within a single green. Every chart that encodes a value in colour or size has a legend: the choropleth's legend redraws in the chosen unit, and the cartogram has a nested-circle size key on its own area scale. The four seasonal hues avoid any red-against-green pair, the combination that collapses under the commonest colour blindness. Brand ochre reaches only 3.67:1 on paper, so text and small marks use a darker step of the same hue at 4.89:1.

## Typography

Fraunces, a soft old-style display serif, evokes a field guide's plates and carries headings, notes and large numbers. Source Sans 3 carries reading text, labels and every chart. Both are open-source Google Fonts. The cover title is capped at 112px; display type is used only for headings and short leads.

The hierarchy: 22px figure titles, 16px for everything a reader reads (body, figure decks, chapter intros, sources), 14px byline, 12px metadata; chart labels are 10–12px. Running prose is capped at 23em, measured in the browser at 60 characters or fewer per line in every column. No multi-line text is centred.

## Layout

One twelve-column grid runs the whole page at a 24px gutter, up to 1720px wide. The cover is 7 + 5: title and deck on the left, the four key numbers on the right with the 2024 record total largest. The state abbreviation key sits directly under the cover, and the first chapter starts close beneath it. Each chapter opens with a band under a rule: its title in columns 1–6 and a one-paragraph intro in 7–12. Below it every row is either two figures as equal 6 + 6 halves or one figure across all twelve columns (whose title takes the left half and its description and control the right, so the heading band is never half empty); there are no margin notes, so no chart sits beside empty space. In a pair each figure is a two-row subgrid (text, then chart), so both charts start on the same line, and paired charts are sized to the same height: the heatmap's rows follow the seasonal clock, the UpSet's rows and bars follow the cartogram, and the bin map carries its running headline in the sea so it matches the choropleth. The story has three chapters and a sources appendix on one page. Below 1000px pairs stack; below 760px everything is one column.

## Interactions

Anchor navigation, accessible selectors, direct hover and focus detail, downloadable CSVs and readable JSON specifications. All major findings are visible by default. Respect reduced motion; avoid delayed visibility. At narrow widths charts are rebuilt at the available width and paired spreads stack.

## Figure conventions

Each figure has a headline title stating its finding, a one- or two-sentence reading guide, a period line only when the figure's date differs from the page's 2024, units in its legend, and tooltips. Chart data and readable specifications are in the repository. Counts mean database records, never birds or unique volunteers. Missing reporting periods are visually distinct from zero counts. Narrative values are computed from the data snapshot.
