# Fit the layout to a product — test answers

**Prompt:** [Fit the layout to a product](../../prompts/fit-the-layout.md) · **Attached:** `layout.md`. Every config was built;
the build output (checks, the shell at each breakpoint and tiles per row) is next to it. The final numbers below are
copied from those outputs.

## Docs site — "navigation labels are long; the help pane is just an outline"

Navigation to its maximum, 272px (the drawer still leaves 48px of a 320px screen); the aside narrowed to 240px, enough for
an outline. Sums before building: `lg` 1024 − 272 − 80 = 672px of content; `xl` 1440 − 272 − 240 − 128 = 800px.

```json
{ "name": "docs-site", "layout": { "nav": 272, "aside": 240 } }
```

From the build ([output](docs-site.build.txt)): **PASS**. Main content 672px at `lg` (md grid, 63px columns) and 800px at
`xl` (79px columns); articles still stop at the 544px reading width, so the extra room becomes margin, not longer lines.

## Admin console — "filters don't fit; people scan big tables all day"

Compact density by default (Spacing) and the aside at 400px for the filters. Sums: `xl` 1440 − 256 − 400 − 128 = 656px.

```json
{ "name": "admin-console", "density": { "default": "compact" }, "layout": { "aside": 400 } }
```

From the build ([output](admin-console.build.txt)): **PASS**. Main content 656px at `xl`, md grid of 61px columns. Tables
use the region's full width and scroll inside their container below that.

## Wall dashboard — "cards are too small to read across the room"

Tiles from 320px (the maximum). Nothing else changes.

```json
{ "name": "wall-dashboard", "layout": { "tile": 320 } }
```

From the build ([output](wall-dashboard.build.txt)): **PASS**. Tiles per row across a full page: 1 · 1 · 2 · 3 (sm · md ·
lg · xl). A tile grid never needs a breakpoint; on a phone a tile is the full width.

## "Make the navigation 320px so long labels never wrap"

**Refused by the engine** ([output](wide-nav.build.txt)): as a drawer on a 320px screen, a 320px pane leaves nothing of the
page visible; the limit is 272px. The answer keeps 272px and lets the longest labels wrap onto two lines — the nav links are
minimum-height, so they grow.
