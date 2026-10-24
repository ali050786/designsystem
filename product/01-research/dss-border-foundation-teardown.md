# DSS Border Foundation — teardown, 23 Oct 2026

Source: `surf/Border Foundation.fig`, opened in FigCraft (variables, aliases and scopes, every layer's stroke weight, colour,
alignment, dashes and variable bindings, and every text layer read directly, not from images). Contrast computed from the
stroke colours. Page PDFs for reference: `surf/border_foundation/`. Reference only — nothing here is copied into `product/`.

## Structure
- Three border collections, one per tier, each with a single mode: `border-scales` (5 raw numbers: 0, 0.5, 1, 2, 4),
  `border-primitives` (5 t-shirt names, `none` → `lg`, each a single alias of a scale value) and `border-semantic`
  (8 tokens: `subtle`, `base`, `divider`, `container`, `strong`, `section`, `selected`, `focus`). Plus the two leftover
  collections every Surf file carries (`Collection 1` with two colours scoped to everything, `Measurements` with a
  12px corner radius).
- Pages: principles (10), token structure, scales, primitives, semantic tokens, density patterns, decision matrix,
  hierarchy rules, border functions, usage rules. Every page is a table. 1,383 layers, 471 of them text.
- Scopes are right: scales and primitives are hidden from pickers, the 8 semantic tokens are scoped to stroke weight only.
- The file holds **widths only**. Border colour lives in the colour file; nothing here links to it.

## What works
- Borders are chosen by job first (separate, contain, emphasise, show state), weight second.
- "Tooling" names the three ways to show a boundary — a line, space, a change of surface — and asks which one a boundary
  needs before reaching for a line. Most systems never say when *not* to draw a border.
- Container and divider are kept apart by meaning ("these belong together" vs "these are distinct").
- State borders (selected, focus) are reserved for state and kept out of decoration.

## Quality problems found (measured)

### Eight jobs, three widths — the hierarchy the pages describe doesn't exist in the values
The hierarchy page ranks the eight tokens on six levels. The variables give them three widths:

| Level on the page | Token | Width |
|---|---|---|
| 1 | `subtle` | 0.5px |
| 2 | `base` | 1px |
| 3 | `divider` | 1px |
| 3 | `container` | 1px |
| 4 | `strong` | 2px |
| 5 | `section` | 2px |
| 6 | `selected` | 2px |
| 6 | `focus` | 2px |

- Levels 2 and 3 are the same 1px; levels 4, 5 and 6 are the same 2px. "Heavier borders communicate higher structural
  importance" can't be true between tokens of one width.
- The "State" principle says "same weight for structural and state borders creates ambiguity about interactivity".
  `strong` and `section` (structural) are the same 2px as `selected` and `focus` (state). A selected row and a section
  edge are drawn identically by the system's own tokens.
- `border/lg` (4px) is aliased by no semantic token. A fifth of the scale is reachable from nothing.

### The file never draws a border it defines
- 145 layers have a stroke. **None is bound to a border variable**, and every one is 0.5px (55, all table rules) or 1px
  (89, all icon boxes and pills), plus one 4px line on the Parts page.
- No page draws a 2px or 4px border, a focus ring, a selected row, a divider between real items or a container around
  real content. The only pictures are a 32px icon with three dots — the same icon on all 13 token rows, with the same
  1px outline whether the row is the 0.5px hairline or the 2px focus token.
- All 135 strokes outside the Parts page are black at 10% on white: **1.25:1**. The doc's own structure is drawn with a hairline the
  usage rules say not to use "for structural boundaries that need to be clearly readable".

### The token pages print placeholders
- Primitive table: the value column reads **"400"** in all 5 cells (0px and 4px alike).
- Semantic table: the value column reads **"#FFFFFF"** — a colour — in all 8 cells of a width table.
- Token structure: the scales example shows `scale.200` and **`scale.400`; there is no scale/400** (the scale stops at
  scale/300).
- The same placeholder pattern as the spacing, layout and radius files.

### Step names that stop meaning anything at the top
`scale/50` = 0.5, `scale/100` = 1, `scale/200` = 2 — the name is the value × 100 — and then `scale/300` = **4**. One of
five steps breaks the pattern the other four teach. With a 3px step missing, nothing sits between the 2px state tokens and
the 4px step no token uses.

### Sub-pixel by default for the lightest border
- `subtle` = 0.5px. The hairline principle itself says it is "nearly invisible on low-DPI screens" and, in the same row,
  that it "renders as 1px on standard displays" — the two statements contradict each other.
- What happens in browsers (measured in Chromium): Chrome and Edge round a 0.5px border up to a full 1px at 1× and at
  2× (computed width 1px both times), so `subtle` and `base` are drawn identically there. Safari and Firefox can draw a
  single device pixel on high-density screens, half as wide as `base`. The token's look depends on the browser, which is
  the one thing a token is meant to fix.
- Width can't make a line visible anyway: visibility is the line's contrast against what is behind it, which this file
  doesn't cover.

### Accessibility is one row, and it is about colour
- "WCAG" appears once in 471 text layers ("meet WCAG AA contrast on every background"). No criterion is named:
  not 1.4.11 (input boundaries and focus indicators ≥ 3:1), 2.4.7 (focus visible), 2.4.11 (focus not hidden) or
  2.4.13 (focus appearance).
- **Focus is a border width.** `focus` is a 2px stroke weight with no offset, no colour pairing and no rule for what
  happens to the element's own border. Drawn as a border, a focus indicator either changes the element's size (layout
  shift on every tab) or replaces the border that was there, and on a filled button it sits on the button's own edge,
  where contrast is measured against the fill, not the page. "Offset" appears nowhere in the file.
- **Nothing about forced colours (Windows High Contrast).** Its "Tooling" and decision matrix send boundaries to
  "background" when surface contrast is enough — in forced colours every background is replaced by one system colour, so a
  control or a selected row shown only by its fill disappears. The decision matrix even lists "selection can be shown
  clearly through fill only" as a case for not using a border. Borders drawn with `box-shadow` (the usual way to avoid a
  layout shift) vanish the same way. Not mentioned.
- Nothing about zoom or text size: a border in rem grows at 200% text and pushes layout; a 0.5px hairline at 400% zoom is
  2 CSS px. Not mentioned.
- Nothing about error or invalid states. A field in error changes its border, and that change must not be colour alone
  (1.4.1). No token, no rule.
- Nothing about disabled controls, which are exempt from 1.4.11 but still need a boundary to be found.

### The decision matrix puts answers in the wrong columns
Columns: Use Border When · Use Whitespace When · Use Background When. Measured rows:

| Context | Preferred method | Token it recommends |
|---|---|---|
| Secondary section separation | Background + Whitespace | `border.container` |
| Major layout regions | Background + Whitespace | `border.section` |

- Two rows say "don't use a border" and recommend a border token anyway.
- "Selected item or row" and "Focused interactive element" answer the whitespace column with "selection can be shown
  through fill only" and "focus is communicated through another strong cue" — neither is whitespace.
- "Grouped controls or settings" recommends `container`; the density page and border-functions page recommend it for
  cards and widgets as well, so the matrix and the functions table don't separate grouping from containing.

### Density without densities
- The density page names five "densities": Light, Standard, Dense, Data-Heavy and **Emphasis** — the fifth is not a
  density. None maps to a mode (all collections have one mode) or to the spacing file's density modes.
- The guidance changes *how many* borders appear, never their width, so "border usage scales with density" has no token
  behind it.

### Joined parts and doubled lines
- Button groups, segmented controls, table cells and stacked list items put two borders side by side. A 1px border on
  each part becomes a 2px seam — the system's `strong` width — between parts that are meant to read as one. Not covered.

### Names don't line up across pages
- Pages write tokens with dots (`border.subtle`), the variables use slashes; no code syntax is set on any variable.
- The primitive and semantic pages both have the title "Border".
- The "Containment" principle is in a row named `row-container`, and so are the five principles after it; the layer names
  don't follow the content, so the structure can't be read from the layers panel.

### Three tiers for five constants
`border/focus` → `border/md` → `scale/200` = 2: three hops to a number that never changes, with two naming systems
(`scale/200`, `border/md`) for the same five values.

## What we do differently (ideas only, our own design)
- **Widths tied to jobs that look different:** one hairline-free scale (1, 2, 3px; nothing below a pixel, nothing above 3px), and roles
  whose widths say what they do — structure 1px, emphasis and selected 2px, focus ring on its own layer. Where two jobs share
  a width they must differ in something else (colour role, side, offset), and the engine checks it.
- **Focus is a ring, not a border:** an outline with its own width, offset and colour, outside the element so it never
  moves layout and is measured against the page, not the fill (1.4.11, 2.4.7, 2.4.13 checked); already in the colour and
  radius packages, now documented in one place.
- **Width + colour as one decision:** each border role names its colour role from the colour package and the engine checks
  the pair (input and control boundaries ≥ 3:1, decorative dividers allowed lower and labelled as such).
- **Forced colours by design:** every boundary that carries meaning is a real border or outline (transparent where the
  design shows none), never `box-shadow` or background alone, so Windows High Contrast keeps it; selected and error states
  change something other than colour. A browser audit runs the demos in forced colours.
- **Joins without doubled lines:** joined parts overlap by one border width, so a seam is one line; the focused part is
  lifted so its ring shows.
- **Widths in px, never rem:** a border stays a line at 200% text; the checker flags rem and em widths.
- **Real examples, real values:** every token drawn at its width, bound to its variable, values read from the variables.
