# Token architecture spec — v0.1 (draft for Ali's approval)
Working name: `ds` (placeholder; rename with one find-and-replace once the name is chosen)
Written 21 Oct 2026 · Clean-room: written from scratch, nothing taken from `surf/`.

---

## 1. Principles
1. **Accessible by construction.** A value that would fail WCAG 2.2 AA cannot be generated. Checks run on every build; a failure stops the build.
2. **Linked, not copied.** A value lives in one place. Gutters reference spacing, shadow colours reference colour, focus rings reference border and radius. Changing a source updates everything.
3. **Explicit over implicit.** Every foreground token says which backgrounds it may sit on. Every rule says which WCAG criterion it protects. Nothing is "use your judgement".
4. **Dense-data ready.** Built for data-heavy screens — tables, dashboards, admin tools: tabular numerals, a compact density that still meets target size, data colours that never rely on colour alone.
5. **Readable by people and machines.** One source → Figma, code and AI rule files, all generated from the same values, so they cannot drift.

---

## 2. Tiers
| Tier | Holds | Example | Who uses it |
|---|---|---|---|
| 1. Primitive | Raw computed values. No meaning. | `color.blue.60`, `space.4`, `radius.2` | Only tier 2. Never used directly in designs or code. |
| 2. Semantic | Meaning + mode. Aliases a primitive. | `color.fg.default`, `space.inset.md`, `shape.control` | Designers, developers, AI. |
| 3. Component | Per-component decisions. Aliases semantic. | `button.primary.bg` | Phase 3 only. |

Rule: aliases only point **down one tier** (component → semantic → primitive). No skipping, no sideways links inside a tier, except the cross-foundation links listed in §5.

---

## 3. Naming convention
`{category}.{role}.{variant}.{state}` · lowercase · dot-separated in tokens, hyphen-separated in CSS (`--ds-color-fg-muted`), slash-separated in Figma (`color/fg/muted`).
- Size steps: `xs sm md lg xl 2xl` for semantic tiers; numbers for primitives.
- States, always in this order: `hover`, `pressed`, `selected`, `disabled`.
- No colour names in semantic tokens (`color.bg.danger`, never `color.bg.red`).

---

## 4. Foundations

### 4.1 Colour
**Primitive scale: contrast grades.** Each hue gets shades on a grade scale 0–100 (0 = white, 100 = black). The engine solves each shade's OKLCH lightness so its luminance hits a target. The target is chosen so that **contrast depends only on the grade difference**:
`contrast(a, b) ≈ 21^(|a−b| / 100)`
| Grade gap | Contrast (worst measured across 21 hue/chroma tests) | Passes |
|---|---|---|
| ≥ 40 | ≥ 3.34 | AA large text, UI components (1.4.3, 1.4.11) |
| ≥ 50 | ≥ 4.53 | AA normal text (1.4.3) |
| ≥ 70 | ≥ 8.33 | AAA normal text (1.4.6) |
This works across hues: `blue.10` on `red.60` passes just like `blue.10` on `blue.60`. Designers can check contrast with subtraction.
Published grades: `5 10 15 20 30 40 50 60 70 80 85 90 95` + `white`, `black`.

**Hues:** `brand`, `neutral` (brand hue, very low chroma), `success`, `warning`, `danger`, `info`, plus `data.*` (below). Chroma peaks mid-scale and is gamut-mapped to sRGB.

**Semantic groups** (Light and Dark modes):
| Group | Tokens |
|---|---|
| `color.bg.*` | `canvas`, `surface`, `surface-raised`, `surface-sunken`, `overlay-scrim`, `brand`, `brand-subtle`, `{status}`, `{status}-subtle` + states |
| `color.fg.*` | `default`, `muted`, `subtle` (placeholder/meta, large text only — see check), `on-brand`, `on-{status}`, `brand`, `{status}`, `link`, `disabled` |
| `color.border.*` | `subtle` (decorative), `default`, `strong`, `input`, `focus`, `{status}` |
| `color.data.*` | `positive`, `negative`, `neutral`, `chart.1–8`, `gridline`, `axis` |

**Pair contract:** each `fg` / `border` token lists the `bg` tokens it is allowed on and its required ratio (4.5, 3, or "decorative — exempt"). The engine checks every listed pair in every mode. Pairs not listed are not supported and the AI rule file says so.

**Data colours:** positive/negative change (good/bad — colour shows sentiment, the arrow shows direction) checked ≥ 3:1 against surfaces and tested for colour-blind distinguishability (simulated deuteranopia/protanopia/tritanopia). Rule: changes **always** ship with a non-colour cue (▲▼ or +/−). Chart palette: 8 colours, ordered so neighbours stay distinguishable under the same simulations.

### 4.2 Typography
- Primitives: `font.family.sans|mono`, `font.weight.regular|medium|semibold|bold`, `font.size.{px}`, `font.line-height.{ratio}`, `font.letter-spacing.*`.
- Semantic roles: `type.display`, `type.heading`, `type.title`, `type.body`, `type.label`, `type.caption`, `type.code`, `type.numeric`, each `sm|md|lg` — composite tokens (family, size, weight, line height, spacing, numeric variant).
- Responsive: sizes change per breakpoint mode (`sm md lg xl`, shared with Layout — §5).
- Rules: smallest size 12px; body line height ≥ 1.5; sizes in `rem` in code; each role tagged per breakpoint as **large** (≥ 24px, or ≥ 18.67px bold) or **normal** text, which sets its contrast requirement; `type.numeric` and table roles use `tabular-nums`.

### 4.3 Spacing
- Primitives: `space.{n}` = n × 4px for n in `0 0.5 1 1.5 2 3 4 5 6 8 10 12 16 20 24`.
- Semantic: `space.inset.*` (padding), `space.stack.*` (vertical gap), `space.inline.*` (horizontal gap), `xs–2xl`.
- Density modes: `comfortable`, `default`, `compact` remap semantic → primitive.
- Target size: `size.target.min` = 24px (2.5.8 floor, all densities), `size.target.default` = 32px, `size.target.comfortable` = 44px. Check: compact controls + their spacing still clear 24px.

### 4.4 Layout
- `breakpoint.sm|md|lg|xl` (min widths: 0 / 600 / 1024 / 1440px); reflow tested at 320px.
- Per breakpoint: columns (4 / 8 / 12 / 12), `layout.gutter`, `layout.margin` → **alias spacing**; `layout.container.max`; `layout.measure.reading` (≈ 70 characters).
- Dashboard grid: `layout.dense.*` for data-heavy screens (12 columns, smaller gutters, from `lg`).
- `layout.scroll-padding.top` = sticky header height, so focused elements are not hidden under sticky bars (2.4.11).

### 4.5 Radius
- Primitives: `radius.0 1 2 3 4 6 8 full` (× 2px, `full` = 9999).
- Semantic shapes: `shape.control` (buttons, inputs), `shape.container` (cards, menus), `shape.surface` (dialogs, sheets), `shape.pill`, `shape.none`. Config style `sharp | default | round` remaps them.
- Rules: nested radius = outer − padding (engine computes, min 0); focus ring radius = element radius + ring offset.

### 4.6 Border
- Primitives: `border.width.1 2 3` (px). *(Built 23 Oct: see §15.)*
- Semantic, by job: `border.width.line` (1), `border.width.control` (1, or 2 by config), `border.width.state` (control + 1), `border.width.indicator` (≥ 3), `focus.ring.width` (2), `focus.ring.offset` (2), `focus.ring.color`.
- Checks: focus ring colour ≥ 3:1 against **both** the page background and the component's own fill; input borders ≥ 3:1 against their background (1.4.11); focus ring ≥ 2px (2.4.7, 2.4.13).

### 4.7 Elevation
- Levels by job *(built 23 Oct: see §16)*: `elevation.page`, `raised`, `sticky`, `floating`, `modal`, `dragging`; each is a surface (`color.bg.*`, linked) + a shadow computed from the level's height (colour `color.shadow.*`, linked), an edge where it floats, and a place in the stacking order (`layer.*`).
- Dark mode: height shows by lighter surfaces; shadows stay as a weak extra cue.
- Rule: no boundary by shadow alone — whatever floats (menus, popovers, toasts, dialogs, a dragged item) has an edge in `color.border.floating`; sticky bars a line on the side facing the content; dialogs get the scrim.

### 4.8 Motion
- Jobs *(built 23 Oct: see §17)*: `motion.feedback`, `change`, `floating`, `modal`, `highlight`, `loading`; each is a duration + a curve, a distance where it moves (linked to `space.*`) and, for what opens and closes, a leaving duration and curve. Durations are computed from the distance; nothing travels more than 32px.
- Primitives: the durations the jobs use and four curves (`motion.easing.enter|exit|standard|linear`), never used directly.
- Modes: `full` and `reduced`. Reduced is fade only: every distance 0, transitions ≤ 100ms, the loading indicator pulses instead of turning (2.3.3, held as a blocking rule).
- Rules: nothing flashes more than 3 times a second (2.3.1); the only loop is the loading indicator, and anything that runs past 5s has a pause (2.2.2); focus rings never animate.

---

## 5. Cross-foundation links (the "linked, not copied" list)
| From | Links to |
|---|---|
| `layout.gutter`, `layout.margin` | `space.*` |
| `layout.header.height` | `space.*` per density (moves with the controls it holds) |
| `layout.scroll-padding.top` | `layout.header.height` |
| Typography and Layout breakpoint modes | one shared mode set |
| Elevation surfaces | `color.bg.*` |
| Motion distances | `space.*` |
| Motion floating / modal | `elevation.floating` / `elevation.modal` (the jobs that open and close them) |
| Shadow colours | colour primitives |
| Focus ring colour / width / radius | `color.border.focus` / `focus.ring.width` / `shape.*` + offset |
| Target sizes | `space.*` |
| Type contrast class (large/normal) | colour pair checks |

---

## 6. Modes and where they live
| Figma collection | Modes | Code |
|---|---|---|
| Primitives | 1 | `:root` |
| Color | Light, Dark | `[data-theme]` + `prefers-color-scheme` |
| Responsive (type + layout) | sm, md, lg, xl | media queries |
| Density | Comfortable, Default, Compact | `[data-density]` |
| Motion | full, reduced | `prefers-reduced-motion` + `[data-motion]` on any element |
| Shape | sharp, default, round (the product's style first) | `:root` + `[data-radius]` on any element |
| Border, Elevation | 1 | `:root` |
*To verify in Ali's Figma: mode limits per plan (the Responsive collection needs 4 modes).*

---

## 7. Engine
One config → everything. The config holds only choices (brand colour, fonts, base size, scale ratio, radius style, density default). Every value is computed.
```
config.json → engine (compute) → checks (must pass) → exporters
                                                       ├─ tokens.json      (W3C DTCG, aliases kept)
                                                       ├─ tokens.css       (theme/density/breakpoint/motion blocks)
                                                       ├─ tailwind.preset.js
                                                       ├─ figma-variables.json (for an existing free import plugin)
                                                       ├─ DESIGN_SYSTEM.md + one rule file per foundation (AI)
                                                       └─ report.html/json (every check, ratio, pass/fail)
```
Folder: `engine/src/{config,foundations,checks,export}` · tests with `node --test` · zero runtime dependencies.

## 8. Phase 1 done when
Default config + 3 sample brands (green, navy, orange) build with **zero AA failures**, and the Figma import flow works in Ali's Figma.

---

## 9. Changes made during the Phase 1 build (21 Oct 2026)
| Spec said | Built | Why |
|---|---|---|
| 13 published grades | All 19 grades (5–95, every 5) | Needed finer steps for hover/pressed and dark-mode surfaces |
| `fg.subtle` large text only | `fg.subtle` passes 4.5:1 → usable for normal text | Grades made it free; placeholders and captions stay readable |
| Comfortable target 44px | 48px (meets 44px AAA) | Stays on the 4px grid |
| Focus ring vs page **and** component fill | Ring checked vs every background it can sit on; offset (2px) keeps it off the fill | With an offset the ring never touches the fill; inset rings (offset 0) are a component rule in Phase 3 |
| Chart palette from brand | Fixed 8-colour palette per mode, searched by code for colour-blind separation (≥ 0.07 OKLab under all 3 CVD types — Okabe-Ito scores 0.076) | Brand-derived palettes failed colour-blind separation |
| Positive/negative "colour-blind safe" | Positive/negative ≥ 0.10 apart under all CVD types, by lightness difference (Light 50/75, Dark 20/40) | Red/green alone collapses for deuteranopia |
| Shade = luminance solve | Solve + pick the 8-bit hex closest to target | Hex rounding broke the 50-grade rule for ~9% of random brands; now 0 of 616 fail |
| Figma via import plugin | One DTCG file per collection+mode (Figma's native import format; free importers read it too) | Figma text styles and effect styles cannot be variables → composites are split into per-property variables; real text/effect styles need a plugin (open decision #6) |


## 10. Industry-neutral (22 Oct 2026)
The library serves any product. Finance-specific names were removed: `gain/loss` → `positive/negative` (good/bad change; the arrow shows direction, so a falling error rate is positive). Sample brands: green, navy, orange. Examples use a neutral workspace (projects, users, storage, reports).


## 11. Changes made during the typography build (22 Oct 2026)
| Spec said | Built | Why |
|---|---|---|
| Every role has `sm|md|lg` | 21 styles: display, heading, title, body, label (sm/md/lg); caption (md); code (md, sm); numeric (sm, md, lg) | A caption below 12px or a third code size has no job; variants exist only where they do one |
| Sizes change per breakpoint | Only display and heading styles move with the screen; every other style keeps its small-screen size | Forms, tables and buttons look the same on every device; only the hierarchy needs room to grow |
| Scale ratio per breakpoint | Defaults sm 1.125 · md 1.15 · lg 1.2 · xl 1.2 (was 1.167 / 1.25 for md / xl) | xl matching lg: wider screens get more room, not bigger headings; 1.25 made display 96px |
| — | Rounding: whole even px below 32px, 4px grid from 32px | Found by testing: a 4px grid from 24px made neighbouring steps collide and an 18px base impossible |
| `font.line-height.{ratio}` primitives | No line-height primitives; each kind of text has a minimum ratio and the line height is computed per size (even px, rounded up) | A shared ratio primitive would not be the real line height after rounding |
| `font.letter-spacing.*` | `normal 0 · tight −0.01em · tighter −0.02em · caps +0.06em`, chosen by size (none below 24px) | Spacing follows the size, so it is never tighter on small text |
| — | Base-layer defaults in tokens.css: body = body.md, h1–h6 mapped to heading/title styles, strong = semibold, form controls inherit the font, `td/th/output/data` tabular | Plain HTML reads well before any class is added; utilities still win |
| `layout.measure.reading` ≈ 70 characters (680px) | 34rem (544px) | Measured in Chromium: 680px gave 86–96 characters of Inter; 544px gives ~70. In rem so it grows with the text size |
| Checks T2–T5 | Added T1 (rem / unitless / em in the shipped CSS), T6 (line height ≥ 1.15), T7 (hierarchy at every breakpoint), T8 (letter-spacing by size), T9 (characters per line, AAA estimate) | Each principle is checked, not assumed |
| — | Products add styles in config (`typography.styles`: name by job, step, kind, weight); the engine refuses px, sizes under 12px, copies of existing styles, look-words and capitals in reading text | "Add a style" needs a path that doesn't require editing engine code |
| Figma via import plugin | Typography Figma file built in FigCraft: Responsive collection (sm, md, lg, xl) and 21 text styles bound to it | Text styles can't be imported from DTCG; the .fig carries them with their bindings |


## 12. Changes made during the spacing build (22 Oct 2026)
| Spec said | Built | Why |
|---|---|---|
| `space.{n}` for n in `0 0.5 1 1.5 2 3 4 5 6 8 10 12 16 20 24` | The same 16-value scale (adds 56px, `space.14`); names kept as Tailwind's numbers (× 4px) | Readers of Tailwind read `space.4` as 16px at once; steps widen with the value so neighbours stay visibly different |
| Density modes "remap semantic → primitive" (hand-picked) | One computed rule: compact one step down the scale, comfortable one step up, for every spacing token and control size (`spacing.densityStep`, default 1); the target floor never moves | Hand-picked triples were inconsistent (some tokens moved two steps); Surf's "one step" claim is broken by 10 of its 30 tokens. A rule can be checked (S3) and explained in one sentence |
| `inset`, `stack`, `inline` sizes `xs–2xl` | One ladder — xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 px in default density — the same distance in every family; inset xs–2xl, stack xs–2xl, inline xs–xl | A size word that means one distance can be carried between families; the family records only the direction, which the checker can verify against the CSS property |
| `size.target.min` 24 · `size.target.default` 32 · `size.target.comfortable` 44 | `size.target.min` (24px in every density), `size.control.height` (48 / 40 / 32), `size.control.icon-gap` (12 / 8 / 6) | One floor plus a control height that follows density says the same thing with fewer names; comfortable 48px meets the 44px AAA size |
| Checks S1 (targets ≥ 24px), S2 (comfortable 44px) | Added S3 (density rule), S4 (ladder: order in every family, one distance per size word), S5 (nothing below 2px), S6 (controls fit their density's label with ≥ 4px above and below), S7 (scale on the 2px / 4px grid), S8 (spacing ships in px) | Each principle is checked, not assumed. S6 links Spacing to Typography |
| Density as `[data-density]` on `<html>` | `[data-density]` works on any element; the Figma Density collection lists the default density first | A dense table can sit in a default page; frames left on Auto use the product's default |
| — | Spacing in px, controls as `min-height` | At 200% text on a 320px phone, px margins keep 288px for text; rem margins would leave 256px (S8). Heights as minimums let controls grow with their labels |
| — | Products add tokens in config (`spacing.tokens`: family, size 2xs–4xl, `base` key on the scale); the engine refuses px, other families, existing names and off-scale bases; S4 fails tokens that break the ladder | Same pattern as colour roles and text styles |
| — | Spacing checker (`lint:space`, SR-01…SR-09) and spacing audit (`audit:space`: every target against 2.5.8 in all three densities at 1280 and 320px, control heights, reflow per density, spacing that ignores density, labels at 200% text) | Comfortable density can push a phone page sideways when compact doesn't — reflow has to be checked per density |
| Paragraph spacing `stack.md` (type guide) | `stack.lg` — one line of `body.md` | 12px between 16px paragraphs read as one block |

## 13. Changes made during the layout build (22 Oct 2026)
| Spec said | Built | Why |
|---|---|---|
| `layout.container.max` 1280 | Computed: `breakpoint.xl` − 2 × the xl margin = 1312px | The page stops growing exactly where xl begins; a hand-picked cap left a gap or overlapped the margins |
| `layout.measure.reading` ≈ 70 characters | 34rem: about 71 characters of body text (estimate), 68 measured in Chromium; checked by T9 | In rem so it keeps the same characters per line at 200% text; Surf's px reading width grows to 82 characters |
| Dashboard grid `layout.dense.*` (12 columns, smaller gutters) | Removed. Dense screens use the tile grid (`layout.tile.min`, gaps follow density) and `data-density="compact"` | One answer for density (Spacing); a second grid gave two gutters for the same job |
| `layout.header.height` per breakpoint (48 / 64) | Per density, one step along the spacing scale like controls: 64 / 56 / 48px | The header holds controls, so it follows them; L4 checks it holds them with room |
| `layout.scroll-padding.top` = header height | The same link, and in CSS `max(header, the same in rem)`; the shell header sticks only in windows ≥ 30em tall | Found by the layout audit: at 200% text a 64px padding left a focused radio button under a 75px header |
| — | Panes as tokens: `layout.pane.nav` (256px, inline from lg, a drawer below) and `layout.pane.aside` (320px, inline from xl, below the content below); products add panes in config (`layout.panes`) | L3 adds them up at the narrowest width of every breakpoint; at lg both panes would leave 368px, under a reading line |
| Columns per breakpoint | The same, and a grid inside a region takes the grid of the region's width (container queries in code, the frame's own mode in Figma); spans by fraction (`.ds-span-*`) follow too | Beside the open navigation at 1024px a 12-column grid gave 35px columns and 38% gutters |
| Breakpoints in px | `@media` in em; Tailwind's breakpoints in rem at the same numbers, its own `sm` and `2xl` removed | Readers with bigger default text get the layout of a narrower window (L5) |
| — | Layout helpers in tokens.css: `.ds-page`, `.ds-grid`, `.ds-span-*`, `.ds-measure`, `.ds-tiles`, `.ds-region`, `.ds-shell` (header, panes, drawer, region containers) | The parts people forget (shrinkable tracks, tiles that fit 320px, panes that move) built in once |
| Checks L1 (reflow), L2 (sticky header, rule only) | L1 reflow, L2 grid at every breakpoint, L3 panes add up, L4 sticky header (computed), L5 one set of breakpoints | Each principle checked, not assumed |
| — | Layout checker (`lint:layout`, LR-01…LR-10) and layout audit (`audit:layout`: every breakpoint's narrowest width and 1920px in every density, 400% zoom, 200% text via the browser setting, focus both ways, reading order, the drawer) | Reflow, focus under sticky bars and reading order have to be checked in a browser |

## 14. Changes made during the radius build (22 Oct 2026)
| Spec said | Built | Why |
|---|---|---|
| Roles `shape.none`, `control`, `container`, `surface`, `pill` | The same, plus `shape.mark` (checkboxes, swatches, kbd, inline code): 2 / 2 / 4px | In round, the control radius (8px) makes a 16px checkbox a circle — a radio button. R2 keeps a mark ≤ a quarter of 16px |
| `radius.style` remaps the roles at build time | The Shape collection has three modes (the product's style first); tokens.css puts the product's style on `:root` and a `[data-radius]` block per style, usable on any element; Figma frames set their own Shape mode | "One card, three styles" in Figma and code; a preview or theme picker needs no rebuild |
| Nested radius = outer − padding | The same, for a shape that fills its parent with padding smaller than the parent's radius; written as `max(0px, var(--ds-shape-x) - var(--ds-space-inset-y))` so it follows density and style; flush children take the parent's radius on shared corners; the contract and guide carry the computed table | Only parent − padding keeps the gap even (a copied radius always widens it by √2); with more padding the child is clear of the curve |
| Focus ring radius = shape + offset | The same (`shape.*-focus`, R4), for rings drawn on their own layer; outlines follow the radius by themselves. tokens.css adds the ring's reach to `scroll-padding-top` | Found by the radius audit: a focused item scrolled to the header's edge had the top of its ring under the header |
| — | Checks R1 (order in every style), R2 (corners stay corners: marks and controls), R3 (text inside the corners, every role, style and density), R4 (ring radii) | Each principle checked, not assumed |
| — | `.ds-join` (logical corners, the focused part lifted, parts that shrink; `data-join="block"` and `"auto"`); Tailwind's own radius scale removed (`--radius-*: initial`) | Joined groups flip in right-to-left; the next part painted over the focus ring (found by the audit); three parts can't sit side by side on a phone at 200% text |
| — | Products add roles in config (`radius.roles`: a name by job, a key per style); radius checker (`lint:radius`, RR-01…RR-10) and radius audit (`audit:radius`: every style, 1280 / 320px, 200% text, both directions, every focus ring sampled on four sides) | Same pattern as the other foundations; clipping, covering and text off its fill only show in a browser |

## 15. Changes made during the border build (23 Oct 2026)
| Spec said | Built | Why |
|---|---|---|
| Primitives 1, 2, 3, 4px | 1, 2, 3px; nothing below a pixel (B1), nothing above 3px | A 4px line reads as a bar; below a pixel a line looks different in every browser (Chromium rounds it up to 1px at 1× and 2×; Safari and Firefox can draw one device pixel) |
| `border.width.default`, `input`, `strong` | Four jobs named by what the line does: `line` (structure, 1px), `control` (a control's edge: 1px, or 2px with `"border": { "control": 2 }`), `state` (control + 1), `indicator` (the current-item bar, at least 3px, one side); each job lists the colour roles that may draw it | "strong" stops meaning anything when controls get heavier; Surf's eight tokens share three widths, so its structural and state borders look the same. B2 proves jobs stay apart: by width, or by colour, style or side |
| Input borders and focus ring ≥ 3:1 (C3) | B3: every colour a control, state or indicator job may use reaches 3:1 on every background, in Light and Dark; `color.border.selected` added to Colour (and to C3) | A line people need to find something is non-text contrast (1.4.11); decorative lines (`line`) may stay quiet |
| — | B4: a state that widens a border takes the extra width off the padding, written on the tokens (`calc(var(--ds-space-inset-md) - (var(--ds-border-width-state) - var(--ds-border-width-control)))`), with at least 2px left in every density | A wider border otherwise moves the label each time it is selected |
| `.ds-join` (radius) | B5: joined parts overlap by one control border, so every seam is one line; the hovered, pressed, selected, checked and invalid part is lifted, the focused one above it | Two 1px borders make a 2px seam — the width of a state. The open question from the radius session (overlap, or borders only on outer parts) is settled as overlap: it keeps every part a whole control |
| — | B6 and tokens.css `@media (forced-colors: active)`: the ring takes `Highlight`; `aria-selected`, `aria-current`, `aria-pressed`, `aria-checked` and labels around a checked radio get an inside `SelectedItem` outline at state width; disabled controls turn `GrayText`; overlays keep a border | Contrast themes replace fills and remove shadows: a selection or a control shown by its fill disappears |
| — | Checks B1–B6 (with F2 and C3); border checker (`lint:border`, BR-01…BR-11) and border audit (`audit:border`: 1280 / 320px, 200% text, normal and real forced colours, every tab stop); products add jobs in config (`border.roles`: a name by job, a width on the scale, one border colour role, `identifies`, a style) | Same pattern as the other foundations; forced colours and moving content only show in a browser |


## 16. Changes made during the elevation build (23 Oct 2026)
| Spec said | Built | Why |
|---|---|---|
| Levels `elevation.0–4` | Six levels named by job: `elevation.page`, `raised`, `sticky`, `floating`, `modal`, `dragging` (Ali, 23 Oct); the shadow strengths in Colour stay numbered (`color.shadow.1`…`4`) | A number says nothing about where a menu or a sticky bar goes; Surf's numbers drift into three systems across its pages. Dragging is a state: the item keeps its own surface |
| A surface + a shadow per level | A surface (linked to `color.bg.*`), a shadow computed from the level's height (offsetY = max(1, ⌈h/2⌉), blur = max(3, 2h), spread = −⌊h/4⌋; colour `color.shadow.N`), an edge, and a place in the stacking order; classes `.ds-raised` … `.ds-dragging` carry all four; `.ds-scrim` for a modal that can't be a `<dialog>` | Taking the whole level makes it impossible to take the shadow and forget the edge (ER-03, ER-04) |
| Levels 3–4 share `color.bg.surface-overlay` | Kept: floating and modal share one surface (Ali, 23 Oct) | The scrim tells a modal apart; a menu inside a dialog keeps its own edge (E3) |
| Dark: higher levels lighter, shadows weaken | Dark shows height by lighter surfaces plus the edge (Ali, 23 Oct): page 95 → raised 90 → sticky 85 → floating/modal 80, each ≥ 1.1:1 over the level below (E2); shadows stay but aren't relied on (measured 1.04–1.06:1 on the Dark page) | A black shadow on a near-black page has almost nothing to darken |
| Overlays get `color.border.subtle` | Floating, modal and dragging draw `color.border.floating` on every side (new Colour role, computed to reach ≥ 1.5:1 against every surface a floating thing can sit on and the scrim, E3); sticky bars draw `color.border.subtle` on the side facing the content | `color.border.subtle` measures 1.36:1 on the Light page and 1.17:1 on another floating surface in Dark |
| — | Stacking: the browser's top layer for menus, popovers, toasts and dialogs; layer tokens `layer.sticky` 100 < `floating` 200 < `modal` 300 < `toast` 400 < `dragging` 500 for everything else (code only: Figma has no z-index); products add layers by name and "above" (`elevation.layers`), the number computed; raw z-index only −1…2 inside one component (E6) | Stray numbers race each other; the top layer can't be clipped and needs no number |
| — | Checks E1–E6; elevation checker (`lint:elevation`, ER-01…ER-10) and audit (`audit:elevation`: Light, Dark and real forced colours at 1280/320px, popovers and `--open` chains opened, what is on top, clipped menus, modal dialogs, focus under sticky bars); Figma effect styles per level with colour, offset, blur and spread bound to variables | Same pattern as the other foundations; stacking, clipping and modal behaviour only show in a browser |

## 17. Changes made during the motion build (23 Oct 2026)
| Spec said | Built | Why |
|---|---|---|
| Intents `motion.feedback`, `transition`, `overlay`, `data-update` | Six jobs named by what changes (Ali, 23 Oct: by job, not a duration scale): `motion.feedback`, `change`, `floating`, `modal`, `highlight`, `loading`; floating and modal share their names with the elevation levels they open and close | "transition" and "overlay" say how, not what; a menu and a dialog need different distances; a highlight and a loop are jobs of their own |
| Primitives `motion.duration.0 100 150 200 300 500` | Durations computed from distance: ⌊(100 + 37.5·√px) / 50⌋ · 50 — 0px 100ms, 4px 150, 8px 200, 16px 250, 32px 300; leaving takes two thirds (never under 100ms); the primitives are the durations the jobs use, plus 1000ms (highlight, loading turn) and 2000ms (reduced pulse) | A picked scale drifts; a rule keeps every product's motion checkable (M3). Nothing over 32px, so nothing over 300ms |
| Curves standard / enter / exit / linear | Four curves defined by their end speeds: enter cubic-bezier(0.2, 0.5, 0.4, 1) (starts at the 2.5× limit, lands at rest), exit (0.6, 0, 0.8, 0.5) = enter played backwards, standard (0.3, 0, 0.3, 1), linear only for the loading turn | The old enter curve started at unlimited speed: its first frame covered 36% of a 16px dialog move (M4 now limits every curve to 2.5× its average speed) |
| Reduced: opacity only, ≤ 100ms | Fade only (Ali, 23 Oct): every distance 0, transitions ≤ 100ms linear, the loading indicator pulses every 2000ms down to a computed opacity (0.65, the lowest that keeps `color.fg.icon` ≥ 3:1), highlights unchanged; M1 blocks the build though 2.3.3 is AAA | Removing the change hides it; a fade is not movement |
| `[data-motion]` on `:root` | `data-motion="reduced"` / `"full"` on any element (a reader's own setting on `<html>`, a preview on a container) | Same as density and radius styles |
| Tokens only | Ready transitions in tokens.css (Ali, 23 Oct): `.ds-floating` popovers, toasts, `dialog.ds-modal` and its scrim, `.ds-scrim`, the `.ds-shell` drawer (flipped right to left, off from the breakpoint where it goes inline) open and close with `@starting-style` and `allow-discrete`; `.ds-loading`, `.ds-highlight`; Tailwind's `ease-*` and `animate-*` removed, plain `transition` defaults to the feedback job | What opens and closes is the most common motion and the easiest to get wrong (off-screen slides, focus waiting for an animation) |
| Checks M1 reduced, M2 flashes | M1–M6 (reduced fade only, no flashes, duration follows distance, no jumps, loops and highlights readable, ready transitions from tokens with focus never animated); motion checker (`lint:motion`, MR-01…MR-10) and audit (`audit:motion`: full and reduced at 1280/320px, every animation paused and stepped frame by frame, flashes recorded in real time, hovers, focus, scrolling, popovers and `--open` chains); products add jobs by kind and distance (`motion.jobs`) | Same pattern as the other foundations; movement, flashes and loops only show in a browser |
| — | Figma: the Motion collection (full, reduced) with durations as numbers, curves as text and distances linked to the spacing scale; interactive examples per mode with the build's transitions (Figma can't bind a transition to a variable) | Designers see the same values, and a reduced frame shows the reduced ones |

