# DSS Radius Foundation — teardown, 22 Oct 2026

Source: `surf/Radius Foundations.fig`, opened in FigCraft (variables, variable bindings, every layer's corner radius and
every text layer read directly, not from images). Corner gaps in nested shapes computed from the drawn geometry. Page PDFs
for reference: `surf/radius_foundation/`. Reference only — nothing here is copied into `product/`.

## Structure
- Three radius collections, one per tier, each with a single mode: `radius-scales` (9 raw numbers: 0, 2, 4, 8, 12, 16, 24,
  32, 999), `radius-primitives` (9 t-shirt names, none → full, each a single alias of a scale value) and `radius-semantic`
  (13 tokens in five groups: edge 2, control 3, surface 5, overlay 2, rounded 1). Plus the two leftover collections every
  Surf file carries (`Collection 1`, `Measurements`).
- Pages: principles (8), token structure, scales, primitives, semantic tokens (five tables), shape categories, connected
  corners (3 patterns), nested corners (3 patterns), usage rules. Every page is a table; the two corner pages add a 64px
  thumbnail per row.
- Scopes are right this time: scales and primitives are hidden from pickers, the 13 semantic tokens are scoped to corner
  radius only.

## What works
- Connected corners are named as a pattern (outer corners keep the radius, shared seams go to none). Most systems leave
  button groups and attached panels to each component.
- The inset rule is stated as a formula: inner radius = parent radius − inset. That is the rule that keeps corner gaps even.
- Radius is described by function first (what the shape does), size second.

## Quality problems found (measured)

### Two rules for the same nested shape, and the examples follow the wrong one
The principles page gives both "Hierarchy" (reduce the inner radius by one semantic level) and "Inset" (inner = parent −
inset). The nested-corners page draws them as two separate patterns, though both describe a child inside a padded parent.
Measured on the page's own thumbnails (64px parent, child inset 8px):

| Pattern | Parent | Child drawn | Inset | Inset rule gives | Gap at the corner vs the sides |
|---|---|---|---|---|---|
| Standard nested surface | 12px | 8px ("one level down") | 8px | 4px | **9.7px vs 8px** |
| Inset-following surface | 12px | 4px | 8px | 4px | 8px vs 8px (even) |
| Deep nested, level 1 | 16px | 12px | 8px | 8px | **9.7px vs 8px** |
| Deep nested, level 2 | 12px | 8px | 11px | 0px (1px) | **13.9px vs 11px** |

- Only the one pattern that uses the formula has an even gap. "One semantic level down" gives a different answer for every
  padding, and there is no padding at which it is guaranteed to be right.
- "One level" is undefined across groups: the surface group has 5 steps, the control group 3, and several values repeat
  between groups (below), so a step down can land on the same number.

### The file doesn't follow its own completeness rule
"Completeness" says every corner of one standalone shape uses the same token. The thumbnails are bound to variables, and:

- The outer parent on both nested patterns has its left corners bound to `shape/surface/base` and its right corners to
  `shape/control/soft` — a surface and a control token on one shape (both 12px, so the mix is invisible in the picture).
- All three connected-corner examples do the same: the left part's outer corners are `surface/base`, the right part's are
  `control/soft`. The rule printed beside them says outer corners inherit "the source semantic token".
- The parts of the "attached" and "stacked" examples are drawn 2px apart, so the seam the page is about is a gap, not a join.

### The token pages never draw a radius
- Every token row has the same 32px icon (three dots) in place of a swatch: 22 rows across the primitive and semantic
  pages, and none shows its corner.
- Primitive tables: the value column reads **"400"** in all 9 cells (0px and 999px alike).
- Semantic tables: the value column reads **"#FFFFFF"** in all 13 cells. The Variables panel holds the real values.
- The same placeholder pattern as the spacing and layout files.

### 8 of 13 semantic tokens are used by nothing
- Only 14 layers in the file are bound to a radius variable, all on the two corner pages, using 5 tokens
  (`edge/hard`, `control/soft`, `surface/subtle`, `surface/base`, `surface/raised`).
- `edge/soft`, `control/compact`, `control/base`, `surface/soft`, `surface/expressive`, `overlay/base`, `overlay/soft` and
  `rounded` are applied to no layer.
- The file's own frames don't use the system: 195 layers have rounded corners and 181 of them are hand-set (8px × 112,
  12px × 38, 24px × 13, 999px × 12, plus the 4px inset child). The "Parts" page uses 5px (3 layers) and 100px (2 layers) —
  values the scale principle forbids ("intermediate values outside the scale").

### Different names, same value — overlays can't be told from surfaces
The 13 tokens hold 7 values. Pairs across groups are identical:

| Value | Tokens |
|---|---|
| 8px | `control/base`, `surface/subtle` |
| 12px | `control/soft`, `surface/base` |
| 16px | `surface/raised`, `overlay/base` |
| 24px | `surface/soft`, `overlay/soft` |

- The shape-categories page says surfaces "must remain visually subordinate to detached layers" and overlays "must feel
  visually separated". `overlay/base` is the same 16px as `surface/raised`; `overlay/soft` is the same 24px as
  `surface/soft`, and `surface/expressive` (32px) is rounder than any overlay.
- Variants (`subtle/base/raised/soft/expressive`, `compact/base/soft`) are picked per element, so one product can use five
  surface radii at once — while the "Economy" principle asks for "no more than two or three shape categories" per screen.
- `control/compact` is named by density, but the file has no density mode and doesn't link to the spacing file's densities.

### A stray radius variable that disagrees with the scale
- `Measurements/Radius/MD` = **12px**, scoped to corner radius, so it appears in the radius picker next to the real tokens.
  The scale's `radius/md` is **8px**. Nothing uses it.

### Names don't line up across pages
- The shape-categories page calls the fifth category "Cornerless"; the token group, the usage rules and the semantic page
  call it "Rounded".
- Pages write tokens with dots (`shape.edge.hard`), the variables use slashes; no code syntax is set on any variable, so
  nothing says what a developer types.

### Radius isn't linked to size
- Tokens are fixed px with no link to the element's height. `control/soft` (12px) on a 24px control is already a pill; on a
  48px control it is a soft rectangle — the same token gives two different shapes. No page says when a radius stops being a
  corner (half the short side).
- `full` is 999px. On text that wraps (a tag or button at 200% text), a 999px radius turns a two-line label into a lozenge
  whose round ends cut into the text. Not mentioned.

### No accessibility at all
- No page names a WCAG criterion. "Focus" appears once in 377 text layers, only to say radius must not change on focus.
- Nothing about the focus ring: whether it follows the shape, what radius a ring drawn on a separate layer takes, or what
  happens when a rounded container clips its content (`overflow: hidden` is the usual way to round a card with a full-bleed
  header, and it cuts off the focus ring of anything at the edge).
- Nothing about content near the corners: a large radius with small padding puts text corners outside the shape's fill,
  where its contrast is no longer measured against the fill.
- Nothing about right-to-left layouts, where connected corners must flip sides (logical corner properties).

### Three tiers for constants
- `shape/control/base` → `radius/md` → `scale/300` = 8: three hops to reach a number that never changes. The scale's step
  names (`scale/300`) and the primitive names (`radius/md`) are two naming systems for the same 9 values.

## What we do differently (ideas only, our own design)
- **Five roles, one value each per style:** `shape.none`, `shape.control`, `shape.container`, `shape.surface`,
  `shape.pill`. The product chooses a style once (sharp, default, round) instead of picking variants per element; the
  engine checks the roles stay in order in every style.
- **One nested rule, computed:** inner = outer − padding, never below 0, written as a CSS expression on the tokens so it
  follows density and style; the guide and contract carry the computed table. A flush child (padding 0) takes the outer
  radius, so a card doesn't need `overflow: hidden` to round its header.
- **Radius linked to size:** a control's radius stays at most a quarter of the smallest control height (checked against
  Spacing's compact density), so a control never turns into a pill by accident.
- **Focus ring follows the shape:** rings are outlines (which follow the radius), a ring on a separate layer uses
  `shape.*-focus` (= shape + ring offset, computed), and the audit checks in a browser that every focus ring is visible on
  all four sides — not clipped by a rounded container or covered by a neighbour in a joined group.
- **Content stays inside the corners:** checked from the tokens (label and padding vs radius, every density and style) and
  measured in the browser, including pills whose text wraps at 200% text.
- **Connected corners in code:** a `join` helper with logical corner properties (right-to-left safe), and the focused part
  lifted above its neighbours.
- **Real swatches, real values:** every token drawn at its radius, values read from the variables.
