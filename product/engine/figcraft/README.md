# FigCraft builders — foundation files

One Figma file per foundation, built from engine data so every number in the file comes from the build. All copy is original (clean-room).

| Foundation | Builder | Data | Output |
|---|---|---|---|
| Colour (v0.4, 11 chapters) | `build_v4.py` + `story.py` | `data.mjs` → `data.json`, `vars.json` | `ds-colour-foundation.fig` / `.figcraft` |
| Typography (v0.1, 11 chapters) | `build_type.py` + `story_type.py` | `data_type.mjs` → `data_type.json`, `vars_type.json` | `ds-typography-foundation.fig` / `.figcraft` |
| Spacing (v0.1, 10 chapters) | `build_space.py` + `story_space.py` | `data_space.mjs` → `data_space.json`, `vars_space.json` | `ds-spacing-foundation.fig` / `.figcraft` |
| Layout (v0.1, 9 chapters) | `build_layout.py` + `story_layout.py` | `data_layout.mjs` → `data_layout.json`, `vars_layout.json` | `ds-layout-foundation.fig` / `.figcraft` |
| Radius (v0.1, 10 chapters) | `build_radius.py` + `story_radius.py` | `data_radius.mjs` → `data_radius.json`, `vars_radius.json` | `ds-radius-foundation.fig` / `.figcraft` |
| Border (v0.1, 10 chapters) | `build_border.py` + `story_border.py` | `data_border.mjs` → `data_border.json`, `vars_border.json` | `ds-border-foundation.fig` / `.figcraft` |
| Elevation (v0.1, 11 chapters) | `build_elevation.py` + `story_elevation.py` | `data_elevation.mjs` → `data_elevation.json`, `vars_elevation.json` | `ds-elevation-foundation.fig` / `.figcraft` |
| Motion (v0.1, 11 chapters + Try it) | `build_motion.py` + `story_motion.py` | `data_motion.mjs` → `data_motion.json`, `vars_motion.json` | `ds-motion-foundation.fig` / `.figcraft` |

Shared: `kit.py` (doc type scale, layout helpers, 8 doc components), `mcp.py` (FigCraft MCP client), `render_pages.py`
(PNG per page of any .figcraft/.fig), `setup_fonts.sh` (fonts for a fresh session), `export_surf.py` (Surf reference .fig → PDFs
+ variables, styles and the full layer tree as JSON for teardowns; output goes to `surf/`, never `product/`; it wraps max-width
text in a scratch copy first, because FigCraft's PDF export draws it on one line). Older colour builders (`build_colour.py`, `v2.py`, `build_v3.py`, `learn.py`, `reference.py`) are superseded.

## Setup (each cloud session)

1. FigCraft CLI: gunzip `bin/figcraft-cli-linux-x86_64.gz` to `/home/claude/fc/figcraft-cli-linux-x86_64`, chmod +x. Every builder
   uses that path through `mcp.py` (override with `FIGCRAFT_BIN`).
2. Fonts: `bash setup_fonts.sh` (JetBrains Mono, IBM Plex Mono; Inter ships with the image). Without them, mono text falls back.

## Typography

From the engine folder:

```
node figcraft/data_type.mjs <dir>        # variables (colour + type) and computed numbers
python3 figcraft/build_type.py <dir>     # → <dir>/ds-typography-foundation.fig, .figcraft, png/<Chapter>.png
```

The file has the Primitives, Color and Responsive (sm, md, lg, xl) variable collections and 21 text styles, each bound to its
Responsive variables. Every doc text uses a ds text style, and every style is documented on exactly one chapter (asserted).
Notes:
- The `.fig` keeps frame modes and style bindings. FigCraft's own `.fig` importer shows text styles at the default (sm)
  mode when it re-opens the file; Figma resolves them per frame mode. Check one page in Figma after each rebuild.
- OpenType features (tabular numerals) don't survive the `.fig` export: set Details → Numbers → Tabular in the three
  `type/numeric/*` styles once in Figma. The proportional-vs-tabular demos are drawn as shapes for that reason.

## Spacing

From the engine folder:

```
node figcraft/data_space.mjs <dir>        # variables (colour, type and spacing) and computed numbers
python3 figcraft/build_space.py <dir>     # → <dir>/ds-spacing-foundation.fig, .figcraft, png/<Chapter>.png
```

The file has the Primitives (incl. the spacing scale), Color, Responsive and Density (default, comfortable, compact — the
config's default density first, so frames on Auto use it) collections, and the 21 type styles for the doc text. Every
example's padding, gaps, control heights and hit areas are bound to Density variables, and frames set their own Density
mode — so "one card, three densities" is one card and three modes, not three drawings. Every spacing token (16 primitives
and 20 semantic) is documented on exactly one chapter (asserted). Notes:
- Bindings and frame modes survive the `.fig` round trip (checked: the three cover cards reopen at 20 / 16 / 12px padding), and
  Figma resolves them per frame (checked by Ali, 22 Oct); the Gap scope keeps spacing variables to padding and gap pickers.
- The `.fig` drops the `FONT_WEIGHT` scope on the type weight variables (21 variables); spacing scopes (Gap, Width and height) survive.

## Layout

From the engine folder:

```
node figcraft/data_layout.mjs <dir>        # variables (colour, type, spacing and layout) and computed numbers
python3 figcraft/build_layout.py <dir>     # → <dir>/ds-layout-foundation.fig, .figcraft, png/<Chapter>.png
```

The file has the Primitives (breakpoints and the spacing scale), Color, Responsive (sm, md, lg, xl: the type styles and
`layout/columns`, `layout/gutter`, `layout/margin`), Layout (widths named by job) and Density (spacing, control sizes and the
header) collections, the 21 type styles for the doc text and a `layout/page grid` grid style bound to the three grid tokens.
Windows and shells are drawn at their real widths, each set to its breakpoint mode; a main region beside an open pane holds a
grid frame set to the mode of the region's own width (the container-query rule in code). Every frame that shows a grid
carries a layout grid whose count, gutter and offset are bound to the variables (Ctrl+G in Figma); the visible column bars
are drawn for the frame's breakpoint. Every layout token (14) is documented on exactly one chapter (asserted). Notes:
- Bound layout grids, frame modes and the header heights survive the `.fig` round trip (checked: page grids reopen at
  4 / 8 / 12 / 12 columns, region grids beside the panes at 8, headers at 64 / 56 / 48px).
- Layout grids are guides: PNG and PDF exports don't draw them, so each grid frame also has column bars.
- FigCraft can't size a hug-height row around children that fill its height: shell bodies have a fixed height.

## Radius

From the engine folder:

```
node figcraft/data_radius.mjs <dir>        # variables (colour, type, spacing and radius) and computed numbers
python3 figcraft/build_radius.py <dir>     # → <dir>/ds-radius-foundation.fig, .figcraft, png/<Chapter>.png
```

The file has the Primitives (the radius scale, hidden), Shape (sharp, default, round — the product's style first), Color,
Responsive and Density collections and the 21 type styles. Every example's corners are bound to `shape/*` variables (per
corner where parts join or a header is flush) and frames set their own Shape mode: the cover's "one card, three styles" is
one card in three modes. The doc kit itself uses the roles (cards and callouts container, verdicts pill, tags mark). Focus
rings are drawn as their own layer — a frame offset by the ring offset with its stroke outside, radius `shape/<role>-focus`;
the "clipped" and "covered" examples are real clipping and overlap, not drawn sides. Nested radii are raw numbers (Figma has
no expressions). Every radius token (18) is documented on exactly one chapter (asserted). Notes:
- Shape modes, per-corner bindings and the corner-radius scope survive the `.fig` round trip (checked: the cover cards reopen
  at 2 / 8 / 12px, all bound to `shape/container`).
- A ring's stroke sits outside its frame: `ring()` turns off clipping on the parent, or auto-layout parents cut it.

## Border

From the engine folder:

```
node figcraft/data_border.mjs <dir>        # variables (colour, type, spacing, radius and border) and computed numbers
python3 figcraft/build_border.py <dir>     # → <dir>/ds-border-foundation.fig, .figcraft, png/<Chapter>.png
```

The file has the Primitives (the border scale, hidden), Border (the four jobs and the focus ring, scoped to stroke weight and
stroke colour), Color, Responsive, Density and Shape collections and the 21 type styles. Every example's stroke weight is
bound to a border job — per side (`strokeTopWeight` …) for dividers, tab bars and navigation bars — and its stroke colour to
one of that job's colour roles; the doc kit's own lines (tables, cards) are `border/width/line`. Focus rings are their own
layer (a frame padded by `focus/ring/offset`, stroke outside, weight `focus/ring/width`). Joined parts overlap by the control
width, and the part that changes is drawn on top (`reverseZ`). Paddings that a state border gives up are raw computed numbers
(Figma has no expressions). The forced-colour pictures use fixed system-like colours and say they are a preview. Every border
token (10) is documented on exactly one chapter (asserted). Notes:
- Bindings (incl. per-side weights), the stroke-weight scope and `reverseZ` survive the `.fig` round trip (checked: same
  binding counts and the lifted invalid input renders on top after reopening). Code syntax does not (as in every file).
- FigCraft draws a one-sided stroke on a rounded frame as a full box: one-sided lines go on square frames.

## Elevation

From the engine folder:

```
node figcraft/data_elevation.mjs <dir>        # variables (colour, type, spacing, radius, border and elevation) and computed numbers
python3 figcraft/build_elevation.py <dir>     # → <dir>/ds-elevation-foundation.fig, .figcraft, png/<Chapter>.png
```

The file has the Primitives, Color, Responsive, Density, Shape, Border and Elevation collections (Elevation: each level's
surface, scoped to fills; its edge, scoped to strokes; its shadow's offset-y, blur and spread; the modal scrim), the 21 type
styles, and one effect style per level (`elevation/raised` … `elevation/dragging`) whose colour is bound to the level's
`color/shadow/*` strength and whose offset, blur and spread are bound to the Elevation numbers — so a frame set to Dark shows
the Dark shadow. Every example takes the whole level: fill bound to its surface, the effect style, the edge at
`border/width/line` (sticky bars on the bottom side only), corners to Shape roles, padding to Density. "One row, two modes" is
one drawing in a Light and a Dark frame. Windows where levels overlap (a menu over a card, a dialog over the scrim) are frames
without auto layout, children placed by position. The forced-colour pictures use fixed system-like colours and say they are
a preview. The stacking order (`layer.*`) is code only: Figma has no z-index, so it is documented as a table. Every elevation
token (20) is documented on exactly one chapter, and on the chapter the contract names (asserted). Notes:
- Effect-style bindings (all four fields), effect-style links, fill and stroke bindings and frame modes survive the `.fig`
  round trip (checked: same binding counts after reopening; a Dark window reopens at its Dark colours).
- Hover pictures borrow the next level's shadow (`level(..., shadow_of=...)`) but keep their own shape and surface.

## Motion

From the engine folder:

```
node figcraft/data_motion.mjs <dir>        # variables (colour, type, spacing, radius, border, elevation and motion) and computed numbers
python3 figcraft/build_motion.py <dir>     # → <dir>/ds-motion-foundation.fig, .figcraft, png/<Chapter>.png
```

The file has the Primitives (durations as numbers, the four curves as `cubic-bezier(…)` text, the spacing scale), Motion
(full, reduced — every job's duration, curve and distance, linked to Primitives and the spacing scale; scopes empty, so
the variables don't appear in property pickers), Color, Responsive, Density, Shape, Border and Elevation collections, the
21 type styles and the elevation effect styles (the examples are menus, toasts and dialogs at their levels). Frames set
their own Motion mode: in a reduced frame every bound distance is 0 and every bound curve text reads
`cubic-bezier(0, 0, 1, 1)`. What is bound: duration bars (width = `motion/<job>/duration`, 1px = 1ms), distance bars and
the offsets of the menu, toast and dialog (padding = `motion/<job>/distance`), curve text (characters =
`motion/<job>/easing`). Pictures of time are drawn from computed numbers: each curve is the CSS cubic-bezier as an SVG
path, its speed sampled against the 2.5× limit, frames at 60Hz as dots along the distance, fades and pulses as opacity
steps, the loading turn as arcs. Interactive examples (button, task list, menu, toast, dialog, highlight) are component
sets on the Doc kit page, one per Motion mode, wired with smart animate and the build's duration and custom bezier for
that mode; the Try it page has three flows. Every motion token (29) is documented on exactly one chapter, the one the
contract names (asserted). Notes — what FigCraft keeps in the `.fig` for motion (probed and checked on this file):
- Kept: number and string variables with full/reduced modes, frame modes and explicit modes on component sets (the
  reduced sets reopen at 0px), bindings to width, padding and text characters (string variables), prototype interactions
  (on click, hover, press, mouse enter with a delay, after a delay), change to / navigate / open and close overlay, smart
  animate, dissolve, move in, push and slide in with direction, durations, named easings, custom beziers (as float32),
  flow starting points, ellipse arcs. Round trip on this file: 25 of 25 interactions with the same transitions, 3 flows,
  21 arcs, 26 styles; padding pairs come back as `paddingHorizontal` / `paddingVertical` (same variables).
- Lost: a number variable bound to text characters (the number stays, the binding goes — durations are written as text
  per frame instead), the "set variable mode" and conditional prototype actions, springs other than Gentle (written as ease out), the
  transition on "close overlay" (comes back instant), code syntax (as in every file).
- Figma can't bind a prototype transition's duration or curve to a variable, so the numbers in each interaction are the
  build's, written by the builder; a rebuilt product rebuilds the file.

## Colour

1. From the engine: write `vars.json` (figma-rest export) and run `node data.mjs` (paths at the top) → `data.json`.
2. `python3 build_v4.py` → `out4/` (.fig, .figcraft and a PNG per chapter).
