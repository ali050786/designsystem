# ds-engine

One config in → 8 linked, accessible foundations out. Values are computed by code; every build runs the accessibility checks and **fails if any WCAG A/AA check fails**.

```
npm run build:all     # default + 3 sample brands → out/
npm test              # 44 tests incl. 200 random brand colours, the eight checkers, the eight guides, config refusals
node src/cli.js my-brand.json out/my-brand
npm run publish       # copy the colour, typography, spacing, layout, radius, border, elevation and motion guides, AI rulebooks, contracts and demo tokens into ../02-foundations and ../04-ai-layer
npm run lint:color -- <files or folders>          # colour checker for CSS, HTML, JSX/TSX (no dependencies)
npm run lint:type -- <files or folders>           # type checker for CSS, HTML, JSX/TSX (no dependencies)
npm run audit:page -- page.html [--click "#menu"] # renders in Light and Dark and measures text, outlines, focus (needs Playwright)
npm run audit:type -- page.html [--shots dir]     # renders at 1280 and 320px, measures size, line height, line length,
                                                  # tabular figures; applies 200% text and the WCAG spacing override (needs Playwright)
npm run lint:space -- <files or folders>          # spacing checker for CSS, HTML, JSX/TSX (no dependencies)
npm run audit:space -- page.html [--shots dir]    # renders in all three densities at 1280 and 320px: targets (WCAG 2.5.8),
                                                  # control heights, spacing that ignores density, labels at 200% text (needs Playwright)
npm run lint:layout -- <files or folders>         # layout checker for CSS, HTML, JSX/TSX (no dependencies)
npm run audit:layout -- page.html [--shots dir]   # renders at 320, 600, 1024, 1440 and 1920px in all three densities, at 400% zoom
                                                  # and 200% text (browser setting): sideways scrolling, grid columns, reading
                                                  # order, line length, focus under sticky bars both ways, the drawer (needs Playwright)
npm run lint:radius -- <files or folders>         # radius checker for CSS, HTML, JSX/TSX (no dependencies)
npm run audit:radius -- page.html [--shots dir]   # renders in every radius style at 1280 and 320px, at 200% text and right to
                                                  # left: radii that ignore the style, nested corners, text outside its shape,
                                                  # rounded seams, every focus ring sampled on four sides (needs Playwright)
npm run lint:border -- <files or folders>         # border checker for CSS, HTML, JSX/TSX (no dependencies)
npm run audit:border -- page.html [--shots dir]   # renders at 1280 and 320px and 200% text, normally and in forced colours:
                                                  # widths, seams, states, control edges, a ring on every tab stop (needs Playwright)
npm run lint:elevation -- <files or folders>      # elevation checker for CSS, HTML, JSX/TSX (no dependencies)
npm run audit:elevation -- page.html [--open "#btn" | --open "#a then #b"] [--shots dir]
                                                  # renders in Light, Dark and forced colours at 1280 and 320px: shadows, surface
                                                  # steps and edges measured against what is behind them; opens popovers and each
                                                  # --open (a chain, from a fresh page); what is on top, clipped menus, modal
                                                  # dialogs, focus under sticky bars (needs Playwright)
npm run lint:motion -- <files or folders>         # motion checker for CSS, HTML, JSX/TSX (no dependencies)
npm run audit:motion -- page.html [--open "#btn" | --open "#a then #b"] [--shots dir]
                                                  # renders with full and reduced motion at 1280 and 320px: pauses every
                                                  # animation and steps it frame by frame (how far it moves, whether it turns,
                                                  # which job its duration and curve belong to), records flashes in real time,
                                                  # hovers, tabs, scrolls, opens popovers and each --open (needs Playwright)
```
Zero dependencies for the engine and the checker. Node 22+. The page audit needs `npm i -D playwright` once.

## Config
Only choices go in the config; everything else is derived. Minimal example:
```json
{ "name": "acme", "color": { "brand": "#00A86B" }, "radius": { "style": "round" }, "density": { "default": "compact" } }
```
Full defaults: `config/default.json` (status hues, data and chart colours, fonts, type scale ratio per breakpoint).

**Product colour roles.** A product can add roles without touching code. Name them by job, give shades as `hue.grade`, and
list what they pair with; the build measures every pair and refuses unsafe names or values:
```json
{ "color": { "roles": [
  { "name": "color.bg.highlight", "light": "warning.5", "dark": "warning.90", "description": "New or changed row", "carries": ["color.fg.default", "color.fg.muted"] },
  { "name": "color.border.drop-target", "light": "brand.55", "dark": "brand.40", "description": "Upload area while dragging", "on": ["color.bg.surface", "color.bg.canvas"] }
] } }
```

**Product text styles.** Same idea for type: name by job, a step on the scale, a kind (sets the line height) and a weight.
The engine computes sizes per breakpoint and refuses px, sizes under 12px, copies of existing styles and capitals in reading text:
```json
{ "typography": { "styles": [
  { "name": "type.overline.sm", "step": -2, "kind": "label", "weight": "semibold", "case": "upper", "description": "Label above a section title" }
] } }
```
Type choices: `typography.sans` / `mono` (font stacks), `baseSize` (even px), `ratio` per breakpoint, `charWidth` (the sans font's
average character width in em, for the line-length check). Config mistakes print `✕ Config refused — …` and exit with code 2.

**Product spacing tokens.** Name by family (inset = padding, stack = vertical gap, inline = horizontal gap) and a size from
2xs to 4xl; give a `base` key on the scale. The engine computes compact and comfortable and checks the token sits in the ladder:
```json
{ "spacing": { "tokens": [ { "name": "space.stack.3xl", "base": "12", "description": "Sections of a long landing page" } ] } }
```
Spacing choices: `density.default` (the mode `:root` uses) and `spacing.densityStep` (1 or 2 steps along the scale for compact
and comfortable; 2 fails S5/S6 with the default ladder, on purpose).

**Layout choices and product panes.** `layout.nav` (160–272px), `layout.aside` (240–480px) and `layout.tile` (160–320px),
multiples of 8. Products add panes by job, with a px width and the breakpoint where they go beside the content; the build
adds every pane up at every breakpoint (L3) and refuses rem widths, names by side or size, panes on phones and existing names:
```json
{ "layout": { "panes": [ { "name": "layout.pane.outline", "width": 192, "from": "xl", "side": "end", "description": "Headings of a long page" } ] } }
```
Breakpoints, columns, margins, the reading width (34rem) and the page cap (computed: 1440 − 2 × the xl margin) are fixed.

**Radius style and product shape roles.** `radius.style` is `sharp`, `default` or `round` (it becomes the Shape collection's
first mode and `:root`'s values; the other styles stay available as `data-radius`). Products add roles by job with a key on
the radius scale per style; the build refuses px, names by look or size, `full` (that is `shape.pill`), radii that shrink
from sharp to round and existing names, and computes the role's focus-ring radius:
```json
{ "radius": { "style": "round", "roles": [ { "name": "shape.thumbnail", "sharp": "1", "default": "3", "round": "4", "description": "Image previews in lists and pickers" } ] } }
```

**Border jobs.** `border.control` is 1 or 2 (px): the width of a control's edge; states are one wider. Products add jobs
with `border.roles` (see the border handoff).

**Elevation layers.** The only elevation choice: product places in the stacking order, named by what sits there and placed
just above an existing layer; the build computes the number and refuses numbers, names by position and two layers in one
spot. Levels, surfaces, shadows and edges are computed:
```json
{ "elevation": { "layers": [ { "name": "layer.banner", "above": "sticky", "description": "A site-wide banner that stays above sticky bars" } ] } }
```

**Motion jobs.** The only motion choice: product jobs named by what moves, with a kind (`in-place`: changes where it is;
`in-out`: arrives and leaves) and a distance on the spacing scale. The build computes the durations (100ms + 37.5ms × √px,
rounded down to 50ms; leaving two thirds), the curves and the reduced mode, and refuses durations, curves, names by look or
speed (`fast`, `bounce`, `200ms`), loops and anything further than 32px:
```json
{ "motion": { "jobs": [ { "name": "motion.carousel", "kind": "in-place", "distance": "space.6", "description": "Slides of a carousel the reader steps through" } ] } }
```

## Outputs (per brand, in `out/<brand>/`)
| File | What |
|---|---|
| `tokens.json` | W3C DTCG 2025.10, all tokens, aliases kept, other modes in `$extensions.org.ds.modes` |
| `figma/<Collection>.<Mode>.tokens.json` | One DTCG file per Figma collection and mode (18 files). Import **Primitives first**, then Color, then the rest |
| `tokens.css` | CSS variables, linked with `var()`; theme/density/breakpoint (em)/reduced-motion blocks; focus ring, scroll padding and link rules in the `base` layer (Tailwind utilities still win); text-style classes; layout classes (`.ds-page`, `.ds-grid`, `.ds-span-*`, `.ds-measure`, `.ds-tiles`, `.ds-region`, `.ds-shell`); `[data-radius]` blocks and `.ds-join`; `[data-motion]` blocks on any element and the ready transitions (`.ds-floating` popovers, toasts, `dialog.ds-modal`, `.ds-scrim`, the drawer), `.ds-loading`, `.ds-highlight` |
| `tailwind.theme.css` | Tailwind v4 `@theme` mapping onto the CSS variables; breakpoints md/lg/xl in rem, Tailwind's own sm and 2xl removed; `ease-<job>`, plain `transition` on the feedback job, Tailwind's own `ease-*` and `animate-*` removed |
| `ai/DESIGN_SYSTEM.md` + `ai/rules/*.md` | AI rulebooks written from the generated values |
| `ai/color.contract.json` | Colour contract: roles, rules, decision guide, every allowed pair measured, not-allowed pairs. Used by AI tools and the colour checker |
| `ai/typography.contract.json` | Typography contract: every style per breakpoint, rules, decision guide, limits, measured mistakes. Used by AI tools and the type checker |
| `ai/spacing.contract.json` | Spacing contract: every token per density, the scale, families, rules, decision guide, limits, measured mistakes, layout links. Used by AI tools and the spacing checker |
| `docs/color/GUIDE.md` | The written colour guide, same chapters as the Figma file; every table computed from the build |
| `docs/typography/GUIDE.md` | The written typography guide, same chapters as the Figma file; every number computed from the build |
| `docs/spacing/GUIDE.md` | The written spacing guide, same chapters as the Figma file; every value computed from the build |
| `ai/layout.contract.json` | Layout contract: breakpoints, every token, classes, the shell at every breakpoint, spans, panes, rules, decision guide, limits, measured mistakes. Used by AI tools and the layout checker |
| `ai/radius.contract.json` | Radius contract: the scale, every role per style, ring radii, the nested-radius table per style and density, joined parts, rules, decision guide, limits, measured mistakes. Used by AI tools and the radius checker |
| `docs/radius/GUIDE.md` | The written radius guide, same chapters as the Figma file; every number computed from the build |
| `docs/layout/GUIDE.md` | The written layout guide, same chapters as the Figma file; every number computed from the build |
| `ai/border.contract.json`, `docs/border/GUIDE.md` | Border contract (jobs, colours per job, focus ring, state padding per density, joined parts, forced colours, rules, limits, measured mistakes) and the written border guide |
| `ai/motion.contract.json`, `docs/motion/GUIDE.md` | Motion contract (jobs with full and reduced values and their frames, curves with their speeds, the duration rule, reduced motion, ready transitions, loading and highlight, classes, rules, limits, measured mistakes) and the written motion guide |
| `ai/elevation.contract.json`, `docs/elevation/GUIDE.md` | Elevation contract (levels with surfaces, shadows and their measured visibility, edges, Dark steps, layers, the top layer, modal rules, forced colours, classes, rules, limits, measured mistakes) and the written elevation guide |
| `report.html` / `report.json` | Every check, every pair, ratio, pass/fail |

Modes in code: put `data-theme` and `data-motion` on `<html>`; `data-density` and `data-radius` on `<html>` or on any container (a dense table in a default page, a preview in another style).

## Source map
| Path | Role |
|---|---|
| `src/color-math.js` | OKLCH ↔ sRGB, WCAG luminance/contrast, gamut mapping |
| `src/grades.js` | Contrast-grade scale: contrast = 21^(gap/100) |
| `src/cvd.js` | Colour-blindness simulation (Machado 2009) + OKLab distance |
| `src/system.js` | Token model: collections, modes, aliases, resolver |
| `src/foundations/*.js` | Colour, typography, spacing, layout, shape (radius and border), elevation (levels, shadows from height, layers), motion (jobs, durations from distance, curves by end speed, reduced mode) |
| `src/checks/index.js` | All automated checks (mapped to `02-foundations/01-wcag-mapping.md`) |
| `src/export/*.js` | DTCG, Figma (`figma-rest.js` also exports type, spacing, layout, radius, border, elevation and motion variables for FigCraft), CSS, Tailwind, AI (`ai-color.js`, `ai-type.js`, `ai-space.js`, `ai-layout.js`, `ai-radius.js`, `ai-border.js`, `ai-elevation.js`, `ai-motion.js`: contracts + rulebooks), guides (`guide-color.js` … `guide-elevation.js`, `guide-motion.js`), HTML report |
| `src/lint/color-lint.js` | Colour checker: raw colours, shades, unknown roles, unlisted pairs, removed focus rings, decorative input borders, colour-only change |
| `src/lint/type-lint.js` | Type checker: hand-set sizes, line heights, letter-spacing and fonts, sizes under 12px, cramped reading text, unknown styles, blocked zoom, skipped heading levels, fixed-height text, truncation, compared numbers without tabular numerals. `ds-lint-ignore: TR-xx` in a file switches a rule off |
| `src/lint/space-lint.js` | Spacing checker: raw px/rem and Tailwind's numeric scale, a family on the wrong property, unknown tokens, primitives in components, density by class name or swapped names, targets under 24px, fixed control heights, redefined tokens, spacer elements |
| `src/lint/layout-lint.js` | Layout checker: page edges, fixed widths, text without a measure, sticky bars and scroll padding, bare fr tracks, breakpoints of their own (CSS, Tailwind, matchMedia), visual reordering, hidden overflow and unfocusable scrollers, fixed tracks and tile widths, shell regions out of order, redefined layout tokens |
| `src/lint/radius-lint.js` | Radius checker: hard-coded radii, primitives, Tailwind's own scale, unknown roles (and checkboxes or buttons with the wrong one), copied radii in padded parents, physical corners, ring layers with the wrong radius, rounded containers that clip focusable content, radius changes with state, redefined variables |
| `src/lint/border-lint.js` | Border checker (BR-01…BR-11): hard-coded, rem and sub-pixel widths, primitives, Tailwind's own widths and `ring-*`, removed focus rings, box-shadow lines and rings, filled controls without a border, control and state lines in decorative colours, states shown by colour alone or that move content, transparent current-item bars, hand-made overlaps, redefined variables |
| `src/lint/elevation-lint.js` | Elevation checker (ER-01…ER-10): hand-made shadows and Tailwind's own, shadows from the shadow colours, a level's shadow on another level's surface, floating things with no edge, sticky bars with no line, stray z-indexes, dialogs not modal or unlabelled, dark-mode overrides, hover by shadow alone, glass, redefined variables |
| `src/lint/motion-lint.js` | Motion checker (MR-01…MR-10): durations and curves written by hand (CSS, inline styles, Tailwind, `element.animate`), `transition: all` and focus rings in a transition list, movement that isn't a job's distance (scale, rotate, skew, `vh` slides, animated layout), animations with no reduced path or a reduced path that still moves, motion of its own on popovers and dialogs, focus waiting for an animation, loops, flashes, shakes and repeated highlights, smooth scrolling for everyone, parallax, autoplay, redefined variables, a forced `data-motion="full"` |
| `tools/audit-motion.mjs` | Motion audit in a real browser: full and reduced motion at 1280 and 320px — every animation paused and stepped frame by frame (distance, turns, which job its duration and curve belong to), flashes recorded in real time (screencast, measured by area against WCAG 2.3.1), hovers, focus rings while tabbing, movement with the scroll, smooth scrolling in reduced motion, autoplay, popovers and `--open` chains opened and closed |
| `tools/audit-elevation.mjs` | Elevation audit in a real browser: Light, Dark and Chromium's real forced colours at 1280 and 320px — shadows by level, edges and Dark surface steps measured against what is really behind them, popovers and `--open` chains opened, what is on top, menus clipped by a parent, dialogs (modal, labelled, focus held, Escape, focus returned), focus hidden under sticky bars both ways |
| `tools/audit-border.mjs` | Border audit in a real browser: 1280 and 320px and 200% text, normally and in Chromium's real forced colours — widths that don't follow the control width or grow with text, control edges under 3:1, doubled seams, box-shadow lines, states that move content or show by colour alone, controls that lose their edge and states that vanish in forced colours, a focus ring on every tab stop in both modes |
| `tools/audit-radius.mjs` | Radius audit in a real browser: every style at 1280 and 320px and at 200% text — radii that ignore the style, corners that poke out, nested radii, text outside its shape; joined groups in both text directions; every focus ring sampled on four sides (clipped or covered), ring layers, radius on focus |
| `tools/audit-page.mjs` | Page audit in a real browser (Playwright), Light and Dark, optional clicked states |
| `tools/audit-type.mjs` | Type audit in a real browser: desktop and 320px, text size, line height, characters per line, tabular figures in the loaded font, heading order, then 200% text and the WCAG text-spacing override |
| `tools/audit-space.mjs` | Spacing audit in a real browser: each density at 1280 and 320px — every target against WCAG 2.5.8 (with the spacing and in-a-sentence exceptions), control heights, sideways scrolling, spacing that ignores density, labels at 200% text in compact |
| `tools/audit-layout.mjs` | Layout audit in a real browser: every breakpoint's narrowest width and 1920px in each density, 400% zoom, 200% text (browser setting), sideways scrolling, grid columns, regions drawn vs code order, characters per line, sticky bars vs scroll padding, focus hidden under bars while tabbing both ways, the drawer |
| `figcraft/` | FigCraft builders for the colour, typography, spacing, layout, radius, border, elevation and motion Figma files (see its README) |
| `scripts/publish.mjs` | Copies generated docs and AI files into the product folders (incl. radius, border, elevation and motion) |
