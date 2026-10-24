# DSS Layout Foundation — teardown, 22 Oct 2026

Source: `surf/Layout Foundation.fig`, opened in FigCraft (variables, the grid style and every text layer read directly,
not from images). Line lengths were measured in Chromium with Inter, Surf's own body font. Page PDFs for reference:
`surf/layout_foundation/`. Reference only — nothing here is copied into `product/`.

## Structure
- Three layout collections, one per tier: `layout-scales` (26 raw numbers: widths, viewport widths, column counts,
  "limits"), `layout-primitives` (32 variables, each a single alias of a scale value) and `layout-semantic` (12 variables,
  modes SM / MD / LG / XL). Plus a copy of the 14 spacing primitives and the same two leftover collections as the other
  files (`Collection 1`, `Measurements`).
- One grid style, "Grid Variable": a stretched column grid whose count, gutter and offset are bound to `page/columns`,
  `page/gutter` and `page/margin`.
- Pages: principles (10), regions (6), grid system (13 elements), breakpoints, pane model (7 pane types), token structure,
  scales, primitives (8 tables), semantic tokens (3 tables), grid style, responsive behaviour (14 rows), content width
  (5 width modes), usage rules.
- Breakpoints 320 / 600 / 1024 / 1440px; columns 4 / 8 / 12 / 12; gutter and margin both 16 / 24 / 32 / 32px.

## What works
- The pane model and the responsive table think about the right questions: which region gives way first, what replaces
  it (an overlay, a move below the content), and that the main task area keeps priority.
- The content-width page separates full, constrained and reading widths — the right idea, even where the tokens behind
  it don't hold up (below).

## Quality problems found (measured)

### The reading width grows with the screen — against the file's own rule
The responsive page says a wider viewport does not mean a wider text measure. The token does the opposite:
`content/reading/max-width` is 480 / 560 / 640 / 640px at SM / MD / LG / XL. Measured with a 16px Inter paragraph
(Surf's `body/md`, the same size at every breakpoint):

| Breakpoint | Reading width | Characters per line (average, range) |
|---|---|---|
| SM | 480px | 61 (54–65) |
| MD | 560px | 69 (60–74) |
| LG, XL | 640px | **82 (79–87)** |
| LG, XL at 200% text | 640px | 39 (31–46) |

- The same paragraph gets 61, 69 and then 82 characters a line as the window widens. From LG up it is past the 80
  characters WCAG 1.4.8 (AAA) allows, and past the 45–75 range the file's own readability principle implies.
- The width is in px, so it ignores the reader's text size: at 200% text the LG line drops to 39 characters (31 at worst).
- `content/constrained/max-width` reaches 720px at LG and XL: 93 characters of the same text.

### Widths that can't apply
- `page/container` is **320px at SM**, but SM runs from 320 to 599px. On a 599px phone the content stops at 320px and
  leaves 247px of the screen empty. The responsive page says the opposite: small screens are fluid and need no container cap.
- At SM, `content/reading/max-width` (480px) and `content/constrained/max-width` (560px) are wider than the container that
  holds them (320px), so neither can ever take effect there.
- `pane/work/base-width` is 400px in every mode, including SM, where the content area is 288–567px wide.

### The panes don't fit the breakpoints they're meant for
The responsive page puts the navigation pane and the supporting pane inline from LG. Adding up the tokens:

| At the start of | Nav + supporting (min) + work (base) | Plus margins and two gutters | Screen |
|---|---|---|---|
| LG | 320 + 320 + 400 = 1040px | 1168px | 1024px |
| XL | 320 + 320 + 400 = 1040px | 1168px | 1440px |

- From 1024 to 1167px the documented three-pane layout doesn't fit: something scrolls sideways or gets squeezed below its
  minimum. Nothing in the file computes or checks this.
- At XL the three maximums (320 + 480 + 640) add up to exactly 1440px — with no room left for margins or gutters.
- The work pane is capped at 640px (`pane/work/max-width`). The regions page calls the main content "flexible, expands to
  available space", and the pane model's flexible pane "absorbs the remaining width"; the tokens instead build the work
  area from the *expanding* pane type, which the pane model reserves for secondary areas. A data table in the work pane
  stops at 640px on a 1920px screen, though the content-width page says data "expands with available width".
- 4 of the 5 pane tokens have the same value in all four modes, so the breakpoint modes carry nothing for them.

### Pages contradict each other and the tokens
- Outer margin at SM: "minimal or zero" on the responsive page; "may reduce on smaller screens, but should not disappear"
  on the grid-system page; 16px in the token.
- The content-width page names five token "drivers"; four of the nine names don't exist (`layout/page/grid/*`,
  `layout/page/margin/default`, `layout/page/container/max-width`, `layout/region/gap/default`).
- The gutter, margin and gap primitives are described by density ("compact gutter … for dense layouts", "wide gutter …
  for spacious layouts") but used by breakpoint: the "dense" gutter is the phone gutter.
- The grid-system page describes grid density (airy, balanced, dense) affecting margins and gutters. No layout token has
  a density mode, and the spacing file calls its densities default, compact and comfortable.
- Seven pane types and six regions are described; tokens exist for three pane types and three regions. The top region
  (the header) has no height token although the regions page warns against its height changing; overlays have no width.

### The pages don't show a single value
- Primitive tables: the value column reads **"400"** in all 32 cells (a 4-column count and a 1440px breakpoint alike).
- Semantic tables: the 48 resolved-value cells read **"#FFFFFF"** (28) or **"—"** (20). Only alias names are filled in.
- The same placeholder pattern as the spacing file. The Variables panel holds the real values (read above).

### The file draws no layouts
- Apart from four empty frames carrying the grid style (one per breakpoint, each at its narrowest width), every page is a
  table. No pane, container, reading width or region is ever drawn.
- 9 of the 12 semantic tokens are used by no layer and no style in the file. Only the grid style uses the other three.
- The grid style can't show the container cap: a stretched grid runs edge to edge, so on a 1920px frame the columns ignore
  `page/container`. The examples never show a frame wider than its breakpoint's minimum.
- Export note, not a Surf error: layout grids are guides, so the PDFs show those four frames empty. In Figma, Ctrl+G shows them.

### Three tiers for constants
- `page/columns` at SM → `columns/sm` → `scale/columns/4` = 4: three hops to reach a number that never changes.
- The 26 scale values hold 18 different numbers (320 appears three times: as a width, a viewport and a "limit"), and 7 are
  used by nothing (`width/240`, `width/1600`, `limit/min/240`, `limit/min/480`, `limit/max/640`, `limit/max/960`,
  `limit/max/1200`). The grid-system page lists 1600px as a common max width; no token uses it.
- The "limit" family is used inconsistently: the supporting pane's minimum comes from `limit/min/320`, its maximum from
  `width/480`.

### Scoping
- `page/columns` — a count of 4, 8 or 12 — is scoped to **Gap**, so it is offered in every gap and padding field.
- The copied spacing primitives are scoped to **all fields** (radius, font size, opacity …). In the Spacing file the same
  14 variables are hidden from pickers.

### Spacing and Layout keep separate copies — and the copy has already drifted
- The Layout file copies all 14 spacing primitives and uses 4 of them (16, 24, 32, 48px).
- The copy differs from the original: scopes (above) and two descriptions (`space/700` truncated to "form field layou",
  `space/1300` changed). The values still match; nothing keeps them matching.
- Two answers again for the same job: the space between page regions is `page/gap` (24 / 32 / 32 / 48px by breakpoint)
  here and the `section` family (16–80px by density) in the spacing file — on top of the page-margin clash noted in the
  spacing teardown.

### Breakpoint modes don't line up with typography
- Layout's breakpoint collection defaults to SM; the typography file's defaults to XL. A frame left on Auto in a product
  using both libraries shows desktop type on a phone grid.
- The small breakpoint starts at 320px. Anything narrower (a 280px folded phone) belongs to no tier.

### No accessibility at all
- No page names a WCAG criterion. Nothing about reflow at 320px (1.4.10), zoom, text size, sticky headers hiding focused
  items (2.4.11), or reading order when panes move (1.3.2). "Readability" appears as a principle without a number.

### Housekeeping
- The same two leftover collections as the other files. Two paint styles share names (`_support/fg/default/primary`,
  `_support/fg/default/secondary` appear twice).
- FigCraft's import notes: 26 layers set modes on collections that aren't in the file, and some layers are bound to library
  variables that aren't in it — the file leans on a Surf library it doesn't ship.

## What we do better (our layout foundation)
1. **The measure follows the text.** `layout.measure.reading` is 34rem: about 68 characters at every breakpoint and every
   text size (measured: 68 at 16px and 68 at 200% text), checked against 45–75 on every build.
2. **Sizes add up, checked.** A pane goes inline only at the breakpoint where the main region still holds a full reading
   line beside it; the build adds the widths and fails if they don't fit. Columns are checked at the narrowest width of
   every breakpoint — and a grid beside an open pane takes the grid of the region's own width, so its columns stay usable.
3. **Every width has one job and applies everywhere.** The container is derived (it stops growing where the widest
   breakpoint begins), the small breakpoint starts at 0, and the header height follows density because it holds controls.
4. **Linked, not copied.** One file, one build: gutters and margins alias the spacing scale; type and layout share one
   breakpoint mode set; the space between sections is spacing's `stack.2xl` — one answer.
5. **Accessibility in the tokens and the tools.** Reflow at 320px in every density, focus not hidden under a sticky
   header (2.4.11), reading order kept when panes move (1.3.2) — in the checks, a layout checker for code and a layout
   audit for rendered pages.
6. **Every value is shown and drawn.** The guide and the Figma file print every value and draw every layout at every
   breakpoint, from the same build.
