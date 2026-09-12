# Field journal design system

## Scene

A curious Malaysian student opens a naturalist's beautifully illustrated notebook at a bright library desk, on a 13-inch laptop. They should be drawn into the observations without needing to operate a research dashboard.

## Visual direction

The user explicitly chose warm paper, bird illustrations and specimen-style annotations. This environmental choice overrides generic avoidance of paper palettes. A honey-ochre binding, near-black ink, restrained eucalyptus green and rust red give the journal its identity. No faux SVG bird drawing, heavy texture, chart-card grid or gratuitous animation.

## Palette

CSS colours use OKLCH. Ochre hue 75 anchors the brand seed; green denotes record volume, rust denotes conservation context, and distinct seasonal colours accompany explicit labels. Pale warm paper is the requested material. Chart colours are computed sRGB equivalents for compatibility with Vega's colour scales.

Green means one thing across every figure: more records than the comparison. That covers raw counts, density, above-average recording pace, a larger-than-usual monthly share and a growing share between years. Ochre is the other end of the same idea. No chart uses hue to name a category except the four seasons, which is why the species palette was removed: the bump chart mutes every line and colours only the one the reader selects, and the treemap carries record count on lightness within a single green. The four seasonal hues avoid any red-against-green pair, the combination that collapses under the commonest colour blindness. Brand ochre reaches only 3.67:1 on paper, so text and small marks use a darker step of the same hue at 4.89:1.

## Typography

Literata evokes a carefully typeset field guide. Bricolage Grotesque provides clear labels and navigation. Both are open-source Google Fonts. Display type is large but capped at 96px, and scientific names are italicised; essential notes are never rendered as illegible handwriting.

Four steps carry the hierarchy: 20px figure titles, 16px for anything a reader actually reads, 13px captions, 11px metadata. Nothing on the page sits below 11px. Every block of running prose is capped at 44ch, which lands between 61 and 69 characters depending on the glyphs, against the unit's limit of roughly 60. Where that cap makes a paragraph narrower than its column, the ragged right edge is accepted: the measure wins over the sight line. No multi-line text block is centred.

## Layout

One twelve-column grid runs the whole page at a 24px gutter. Twelve divides by 1, 2, 3, 4 and 6, which is the exact set of splits the layout notes ask for, and every spread uses one of three patterns: full width, 8 + 4 or 4 + 8 for a figure beside a margin note, and 6 + 6 for paired figures. That leaves five vertical sight lines down the whole page. A slim binding edge and a spacious two-column cover give way to those spreads. The story has five chapters and an open sources appendix. Every major chapter remains on the same page. Below 820px the spreads collapse to full width apart from paired figures, and below 600px everything is a single column.

## Interactions

Anchor navigation, accessible selectors, direct hover and focus detail, downloadable CSVs and readable JSON specifications. All major findings are visible by default. Respect reduced motion; avoid delayed visibility. At narrow widths charts are rebuilt at the available width and paired spreads stack.

## Figure conventions

Each figure includes a distinct title, question or takeaway, period, units, reading guidance, source link and a data download. Counts mean database records, never birds or unique volunteers. Missing reporting periods are visually distinct from zero counts. Narrative values are computed from the data snapshot.
