# DSS Spacing Foundation — teardown, 22 Oct 2026

Source: `surf/Spacing Foundations.fig`, opened in FigCraft (variables and every text layer read directly, not from images).
The variables and the page placeholders were also checked in Figma by Ali (Variables panel screenshots, 22 Oct).
Page PDFs for reference: `surf/spacing_foundation/`. Reference only — nothing here is copied into `product/`.

## Structure
- 2 spacing collections: `spacing-primitives` (14 values, 0–128px, one mode, hidden from pickers) and `spacing-semantic`
  (30 variables = 6 families × xs–xl, modes Default / Compact / Comfortable, every one scoped to Gap), plus the same two
  leftovers as the typography file (`Collection 1` with two colours, `Measurements` with one radius).
- Families: stack, inline, inset, gap, section, container.
- No size tokens at all: no control height, no minimum target, nothing for icon-to-label gaps.
- Pages: principles (10), token structure (two tiers), primitives, one page per family, density model, usage rules (do / avoid / why per family).
- Primitives are named by position: `space/100` = 2px, `space/300` = 8px, `space/400` = 12px, `space/1000` = 64px, `space/1300` = 128px.

## Quality problems found (measured from the variables)

### Thirty tokens, fourteen distinct spacings
Compared as (default, compact, comfortable) triples, the 30 semantic tokens hold only 14 different sets of values:

| Same values in every mode | Default / compact / comfortable |
|---|---|
| `stack/xs` · `inline/sm` · `gap/xs` | 4 / 2 / 8 |
| `stack/sm` · `inline/md` · `gap/sm` | 8 / 4 / 16 |
| `stack/md` · `inline/lg` · `gap/md` | 16 / 8 / 32 |
| `stack/lg` · `inline/xl` · `inset/lg` · `gap/lg` | 32 / 16 / 48 |
| `stack/xl` · `inset/xl` · `gap/xl` | 48 / 32 / 64 |
| `section/xs` · `container/sm` | 16 / 12 / 24 |
| `section/sm` · `container/md` | 32 / 24 / 40 |
| `section/md` · `container/lg` | 48 / 40 / 64 |
| `section/lg` · `container/xl` | 80 / 64 / 96 |
| `inset/xs` · `container/xs` | 8 / 4 / 12 |

- **`gap` is a second name for `stack`**: all 15 values match in every mode. The usage page justifies keeping families
  apart because they "remap differently across density modes" — measured, these two remap identically.
- **A size word means different distances in different families.** `md` is 8px as inline, 16px as stack and gap, 16px as
  inset, 48px as section and 32px as container. Inline is stack shifted one size; section is container shifted one size.
  A designer can't carry "md" from one family to the next.

### Density doesn't follow its own rule
The density page says compact remaps tokens down one step and comfortable up one step. Measured on the primitive scale:

- Compact: 20 tokens move one step, **10 move two**. It keeps anywhere from 0% to 83% of the default value
  (`stack/md` 16 → 8, half; `section/md` 48 → 40, five-sixths).
- Comfortable: 19 tokens move one step, **11 move two**. It adds from 20% to 100% (`stack/md` 16 → 32, double; `section/lg` 80 → 96).

So the same screen changes by very different amounts depending on which tokens it happens to use, and nobody can
predict a compact layout without looking up every token.

### Compact collapses small spaces, against their own touch rule
- Compact `inline/xs` is **0px**: two items side by side touch.
- Their "touch clearance" principle asks for at least 8px between adjacent interactive elements. In compact, 9 of the 30
  tokens are below 8px (`inline/xs` 0, `inline/sm` 2, `stack/xs` 2, `gap/xs` 2, `inline/md` 4, `stack/sm` 4, `gap/sm` 4,
  `inset/xs` 4, `container/xs` 4); in default, 4 are. Nothing says which tokens are safe between targets.
- The same principle asks for a 44 × 44px target area. That is WCAG 2.5.5 (AAA); the AA requirement is 2.5.8, 24 × 24px.
  The file names neither criterion and has no token for a target or a control height, so neither number reaches a design.

### The pages don't show a single value
- On the primitives page, the value column reads **"400"** for all 14 primitives (0px and 128px alike).
- On the six family pages, the resolved-value column reads **"#FFFFFF"** in all 90 cells (30 tokens × 3 modes) — a colour
  placeholder in a spacing table. Only the alias names are filled in.
- Confirmed in Figma (Ali, 22 Oct): the pages show these placeholders, while the Variables panel holds the right values
  (0–128px, and the aliases measured below). The numbers exist in the file; its documentation just never shows them.

### The principles contradict the token structure
- The scale-adherence principle tells component authors to use primitive tokens, giving a range that stops at `space/1200`
  (the scale goes to `space/1300`). The token-structure page says primitives carry no meaning and semantic tokens are
  what designs use.

### Primitives are named by position, not by value
`space/400` is 12px and `space/500` is 16px; the name records a place in the list, so every value has to be looked up,
and adding a value between two neighbours (20px, say) means an awkward name or renumbering the scale.

### Spacing and Layout keep separate copies
- Surf's Layout file carries its own copy of the 14 spacing primitives, and its gutters, margins and gaps alias that copy.
  The values match today; nothing keeps them matching when one file changes.
- Both files define page-edge padding: spacing's `container` family (4–96px, by density) and layout's `page/margin`
  (16–32px, by breakpoint). Padding a page wrapper has two answers that don't agree.

### Housekeeping
- The same two leftover collections as the typography file (`Collection 1`, `Measurements`).
- PDF note, not a Surf error: FigCraft's PDF export drew one max-width paragraph on a single line (the primitives page
  intro). The exporter now wraps such text before exporting; the PDFs in `surf/spacing_foundation/` are the fixed export.

## What we do better (our spacing foundation)
1. **One ladder.** A size word means the same distance in every family (`inset.md` = `stack.md` = `inline.md`, in every
   density — checked). The three families say only which way the space runs: padding, vertical gap, horizontal gap.
2. **Density is one computed rule.** Compact is one step down the scale and comfortable one step up, for every token,
   checked on every build; no token reaches 0.
3. **Targets are tokens and checks.** `size.control.height`, `size.target.min` and `size.control.icon-gap`; targets
   ≥ 24px in every density (2.5.8, AA), comfortable controls 48px (meets 44px, 2.5.5 AAA), and every control is checked to
   fit its label in every density. A page audit measures real targets at all three densities.
4. **Every value is shown.** The guide and the Figma file print the computed px for every token in every density; both are
   generated, so they can't go stale.
5. **One source.** Layout's gutters and margins alias the same spacing primitives in the same build.
6. **A spacing checker** for code (raw px and rem, Tailwind's numeric scale, a family used on the wrong property, density
   by class name, spacer elements) and a spacing audit for rendered pages.
