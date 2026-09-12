# Field journal design system

## Scene

A curious Malaysian student opens a naturalist's beautifully illustrated notebook at a bright library desk, on a 13-inch laptop. They should be drawn into the observations without needing to operate a research dashboard.

## Visual direction

The user explicitly chose warm paper, bird illustrations and specimen-style annotations. This environmental choice overrides generic avoidance of paper palettes. A honey-ochre binding, near-black ink, restrained eucalyptus green and rust red give the journal its identity. No faux SVG bird drawing, heavy texture, chart-card grid or gratuitous animation.

## Palette

CSS colours use OKLCH. Ochre hue 75 anchors the brand seed; green denotes observations, rust denotes conservation context, and distinct seasonal colours accompany explicit labels. Pale warm paper is the requested material. Chart colours are computed sRGB equivalents for compatibility with Vega's colour scales.

## Typography

Literata evokes a carefully typeset field guide. Bricolage Grotesque provides clear labels and navigation. Both are open-source Google Fonts. Display type is large but capped at 96px, body text stays readable and uses short lines. Scientific names are italicised; essential notes are never rendered as illegible handwriting.

## Layout

A slim binding edge and a spacious two-column cover give way to varied journal spreads. Full-width maps alternate with paired figures, narrow explanatory notes and larger special diagrams. The story has five chapters and an open sources appendix. Every major chapter remains on the same page.

## Interactions

Anchor navigation, accessible selectors, direct hover and focus detail, downloadable CSVs and readable JSON specifications. All major findings are visible by default. Respect reduced motion; avoid delayed visibility. At narrow widths charts are rebuilt at the available width and paired spreads stack.

## Figure conventions

Each figure includes a distinct title, question or takeaway, period, units, reading guidance, source link and a data download. Counts mean database records, never birds or unique volunteers. Missing reporting periods are visually distinct from zero counts. Narrative values are computed from the data snapshot.
