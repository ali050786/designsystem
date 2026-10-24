# START HERE — project memory (read this first in every new session)

Last updated: 24 Oct 2026 (motion checked by Ali; housekeeping done; all eight foundations built; next = Phase 2)

## Who does what
- **Ali** (Sikandar Ali, 10+ yrs UX, enterprise design systems at Mphasis, runs Blinkwiser): stakeholder and decision maker
- **Claude**: researches, builds, documents. Brings decisions to Ali as short questions. Owns making it succeed.

## The business (approved direction)
1. **Free library** — our own accessible-by-design design system, **industry-neutral** (WCAG 2.2 AA built in, AI-ready). Proof + audience.
2. **Public teardowns** — analyses of known design systems on LinkedIn. Proof we can audit.
3. **Paid audit service** — design-system-level accessibility audits + fix sprints. Revenue.
Order: build library → build audit service → go live.

## Buyer (proposed, research-backed)
Indian SEBI/RBI-regulated fintech (brokers, AMCs, investment apps, banks, NBFCs) with design teams; secondary: Indian SaaS selling to the EU.
(This is the audit-service buyer. The library itself is industry-neutral since 22 Oct — no finance-specific tokens or examples.)
Trigger: SEBI requires a certified accessibility audit + remediation by 31 Oct 2026, then annual compliance.
We do NOT sell the certified SEBI audit; we sell system-level accessibility (check / full audit / fix sprint: ₹45k / ₹1.75L / from ₹2.5L).

## Hard rules
- **Clean room:** `surf/` = Design Systems Surf downloads, reference ONLY. Their terms forbid redistribution (incl. free) "in whole or in part". Never copy wording, values, structure or prompts into `product/`. Ideas and industry patterns are fine.
- Values computed by code, not by AI. Accessibility checked automatically.
- Validate before building big things (Ali stopped a premature build once — don't repeat).
- **No decorative numbering** (Ali, 22 Oct): no numbered pages, chapters, sections (A/B/C), layers or markers in files and docs. Name things instead; label parts of an example with role tags. Numbers only where they are data (grades, ratios, hex, token names like `shadow/1`) or rule IDs (CR-01…).

## What's left (as of 24 Oct)
All eight foundations are built. Spacing, layout, border and motion are checked by Ali in Figma; radius, elevation and typography wait on his checks.
1. **Ali's checks in Figma** (details in the status lines below): radius (three checks + approve roles and `shape.mark`),
   elevation (four checks + approve levels, `color.border.floating`, layer numbers), typography (per-frame sizes, four
   Responsive modes on his plan, set Tabular on the three `type/numeric/*` styles, is a 40px page title right?).
2. **Phase 1 sign-off:** Ali imports `engine/out/default/figma/*.json` into a blank Figma file (Primitives first) and
   reviews `report.html`; Ali runs the prompts with his own AI tool and scores them with each `tests/README.md`.
3. **Decisions that block Phase 2** (roadmap): name (`ds` is a placeholder), licence (MIT code / CC BY docs?),
   Blinkwiser or standalone, domain + GitHub + Figma Community accounts, own Figma plugin now or later, CPACC start. Logo:
   Ali designs it.
4. **Phase 2:** docs site built from the guides, handoffs and demos; "generate yours" page; 15-question self-check that
   captures emails; changelog and versions. **Phase 3:** five components (button, text field, checkbox/radio/switch,
   dialog, data table). **Phase 4:** launch (Figma Community, GitHub + npm, LinkedIn with the eight teardowns, all written).
5. **Audit service:** not started (offer pages, report template, proposals, three pilots). The SEBI audit + remediation
   deadline is 31 Oct 2026 (checked 24 Oct); after it, the pitch is remediation and annual compliance.
6. **Small open items:** delete `02-foundations/figma/ds-colour-TEST.fig`? (asked 24 Oct); older audit warnings in four
   demos (status line of Motion); the colour checker misses unknown Tailwind colour utilities.

## Where things are
| File | What |
|---|---|
| `product/00-strategy/library-roadmap.md` | **The plan.** Phases 0–4, deliverables, done criteria, open decisions |
| `product/00-strategy/v1-decision.md` | Buyer, positioning, audit tiers and prices, library scope, risks |
| `product/00-strategy/decisions-log.md` | Every decision with date and reason |
| `product/00-strategy/product-brief.md` | Earlier brief (superseded in parts by v1-decision; kept for history) |
| `product/01-research/market-research-2026-10.md` | Survey data, competitor map, why not a generator plugin |
| `product/01-research/ui-ux-economy-map.md` | Where money flows in UI/UX |
| `product/01-research/dss-evaluation.md` | What DSS sells, how it works, guides findings |
| `product/01-research/dss-color-foundation-teardown.md` | Colour teardown with contrast failures |
| `product/01-research/dss-roadmap-teardown.md` | Their 20-step roadmap, strengths, errors |
| `product/01-research/dss-spacing-foundation-teardown.md` | Surf spacing teardown, measured from its variables and every text layer |
| `product/01-research/dss-layout-foundation-teardown.md` | Surf layout teardown, measured from its variables, grid style and every text layer (line lengths measured in Chromium) |
| `product/01-research/dss-radius-foundation-teardown.md` | Surf radius teardown, measured from its variables, variable bindings, every layer's radius and every text layer (corner gaps computed from the drawn geometry) |
| `product/01-research/dss-border-foundation-teardown.md` | Surf border teardown, measured from its variables, every layer's stroke (weight, colour, sides, bindings) and every text layer; hairlines measured in Chromium |
| `product/01-research/dss-elevation-foundation-teardown.md` | Surf elevation teardown, measured from its variables, effect styles and their bindings, every layer's effects and every text layer; shadow visibility measured in Chromium |
| `product/01-research/dss-motion-foundation-teardown.md` | Surf motion teardown, measured from its variables, modes, scopes, every layer's bindings and prototype interactions and every text layer; curves and per-frame movement computed from its values |
| `product/engine/` | The engine (Phase 1). README inside |
| `product/02-foundations/` | Approved spec + WCAG mapping (§9 engine, §11 typography, §12 spacing, §13 layout, §14 radius, §15 border, §16 elevation and §17 motion = build deviations) |
| `product/02-foundations/color/` | Colour package: `GUIDE.md` (11 chapters, generated), `HANDOFF.md` (developers), `demo/` (working page from tokens.css) |
| `product/02-foundations/typography/` | Typography package: `GUIDE.md` (11 chapters, generated), `HANDOFF.md`, `demo/` (with 200% text and WCAG spacing switches) |
| `product/02-foundations/spacing/` | Spacing package: `GUIDE.md` (10 chapters, generated), `HANDOFF.md`, `demo/` (density, 200% text and show-targets switches; values read live) |
| `product/02-foundations/layout/` | Layout package: `GUIDE.md` (9 chapters, generated), `HANDOFF.md`, `demo/` (`index.html`: the screen in a frame of any width with a density switch, grid overlay and live readout; `app.html`: the screen itself; `shots/` from the audit) |
| `product/02-foundations/radius/` | Radius package: `GUIDE.md` (10 chapters, generated), `HANDOFF.md`, `demo/` (radius style, density and text-direction switches; live readout of the radii in use) |
| `product/02-foundations/border/` | Border package: `GUIDE.md` (10 chapters, generated), `HANDOFF.md`, `demo/` (control width 1/2px, density and forced-colours preview switches; live readout; `shots/` in normal, dark and real forced colours) |
| `product/02-foundations/elevation/` | Elevation package: `GUIDE.md` (11 chapters, generated), `HANDOFF.md`, `demo/` (cards with popover menus, a dialog with a menu inside, a toast after it, drag to reorder; theme and forced-colours preview switches; live readout; `shots/` from the audit) |
| `product/02-foundations/motion/` | Motion package: `GUIDE.md` (11 chapters, generated), `HANDOFF.md`, `demo/` (buttons, an accordion, tabs, a task list, a menu, a toast, a dialog with a menu inside, a highlight and a loading export; motion setting (my device / reduced / full) and a-fifth-speed switches; live readout of the jobs and the last animation; `shots/` from the audit) |
| `product/02-foundations/figma/` | One Figma file per foundation: `ds-colour-foundation.fig`, `ds-typography-foundation.fig`, `ds-spacing-foundation.fig`, `ds-layout-foundation.fig`, `ds-radius-foundation.fig`, `ds-border-foundation.fig`, `ds-elevation-foundation.fig`, `ds-motion-foundation.fig` (+ `.figcraft`, page images in `png/`, `png-typography/`, `png-spacing/`, `png-layout/`, `png-radius/`, `png-border/`, `png-elevation/`, `png-motion/`) |
| `product/04-ai-layer/` | AI layer: `color/`, `typography/`, `spacing/`, `layout/`, `radius/`, `border/`, `elevation/`, `motion/` — rulebook + contract (generated), `prompts/` (4 each), `tests/` (how they were tested, answer keys) |
| `product/01-research/dss-typography-foundation-teardown.md` | Surf typography teardown, measured from its variables |
| `surf/` | DSS reference material (8 .fig files, colour PDFs, typography PDFs in `typography_foundation/`, spacing PDFs in `spacing_foundation/`, layout PDFs in `layout_foundation/`, radius PDFs in `radius_foundation/`, border PDFs in `border_foundation/`, elevation PDFs in `elevation_foundation/`, motion PDFs in `motion_foundation/`, goals .jam) |

## Status
- Research: done. Direction: approved. Roadmap: written.
- **Phase 0 (21 Oct):** principles, token architecture spec and WCAG mapping approved 21 Oct (`product/02-foundations/`). Working name `ds` (placeholder).
- **Phase 1 (21 Oct): engine built** in `product/engine/` — `npm run build:all`, `npm test`. Default + 3 sample brands: zero A/AA failures; 616 random brand colours pass. Outputs in `engine/out/<brand>/` (open `report.html`).
- **Engine v3 (21 Oct):** added action roles (primary/secondary/ghost/danger/disabled), icon roles, state tints (low surfaces) + item roles (menus/dialogs), white-alpha primitives; 407 tokens; checks C1/C3/C4 pass for 4 brands + random.
- **Remaining for Phase 1 done:** Ali imports `out/default/figma/*.json` into Figma (Primitives first) and checks the flow; Ali reviews `report.html`.
- **Figma (21 Oct):** connector works (personal account ali050786@gmail.com; work account is blocked by its company). No Figma Pro: we build in **FigCraft** (MCP, driven from the cloud workspace) and export `.fig`; free Figma opens it with modes + aliases. DSS Figma file = reference only.
- **Colour foundation file (22 Oct, v0.4):** `02-foundations/figma/ds-colour-foundation.fig` (+ `.figcraft`, page images in `png/`): Cover + 11 chapters (Five principles → Modes and brands, named, not numbered), one systematic story; each chapter = explain → examples → token table (Light/Dark side by side) → rules; all 100 roles documented exactly once (asserted). Builder: `engine/figcraft/build_v4.py` + `story.py` + `kit.py`. Extending / Handoff / Checks moved to the handoff package (next session).
- **Colour package (22 Oct): done.** Guide, AI rulebook + contract, 4 prompts, developer handoff + demo. Guide, rulebook and contract are *generated* by the engine (`npm run build && npm run publish`), so they can't drift from the tokens. New tools: colour checker `npm run lint:color -- <files|folders>` (no dependencies, CI-ready) and page audit `npm run audit:page -- page.html [--click "#menu"]` (Playwright; Light + Dark, text, input outlines, focus ring, clicked states). Products can add roles in config (`color.roles`); the build measures them. Testing found and fixed: links on message backgrounds, icon-only buttons on hover, Tailwind utilities being overridden by the base layer (now `@layer base`), very light brands sharing a shade with selected rows (report warns). 11 tests pass; 316 pairs × 2 modes, all pass. Figma file rebuilt with the new descriptions and pair count.
- **Typography package (22 Oct): done.** Same five parts as colour. Scale: base × ratio^step; only display and heading styles move with the screen (sm 1.125 · md 1.15 · lg 1.2 · xl 1.2), the other 15 styles keep one size; 21 styles; reading text ≥ 1.5 line height; nothing under 12px; letter-spacing in em by size; tabular numerals for numbers. Engine checks T1–T9 + L1, all pass. New tools: `npm run lint:type` and `npm run audit:type` (renders at 1280/320px, measures line length and tabular figures, applies 200% text and the WCAG spacing override). Products add styles in config (`typography.styles`). Testing found and fixed: the reading width (680px gave ~90 characters → 34rem), an 18px base that couldn't build (grid rounding), the audit missing pre-clipped text, `<strong>` weight, the colour demo scrolling sideways at 320px. 16 engine tests pass. Figma file: 21 text styles bound to a Responsive collection (sm/md/lg/xl), every doc text uses a ds style. Surf typography exported to PDFs + teardown.
- **Spacing package (22 Oct): done.** Same five parts. One scale (16 values, Tailwind numbering × 4px), one ladder (xs 4 · sm 8 · md 12 ·
  lg 16 · xl 24 · 2xl 32) used by inset (padding), stack (vertical) and inline (horizontal) — a size word is the same distance in every
  family. Density is one computed rule: compact one step down the scale, comfortable one step up; controls 48 / 40 / 32px; target floor
  24px in every density. 20 tokens; checks S1–S8 all pass (S3 density rule, S4 ladder, S5 nothing < 2px, S6 controls fit their label,
  S7 grid, S8 px in code). `data-density` works on any element (compact table in a default page). New tools: `npm run lint:space`
  (SR-01…SR-09) and `npm run audit:space` (every target vs WCAG 2.5.8 in all three densities at 1280/320px, control heights, reflow per
  density, spacing that ignores density, labels at 200% text). Products add tokens in config (`spacing.tokens`). Testing found and fixed:
  `inset.2xl` missing for page bands, fixed-size icon buttons clipping at 200%, checkbox 2px from its label in compact (→ `inline.sm`),
  comfortable density pushing the colour demo sideways at 320px, hard-coded 40px controls in the colour demo, 91 primitives in the colour
  and type demos (now semantic), several checker false alarms. Paragraph spacing is now `stack.lg`. 21 engine tests pass. Figma file:
  Primitives + Density collections, every example bound to Density variables, frames set their own mode (one card, three densities);
  36 tokens documented once (asserted). Surf spacing exported to PDFs + teardown (export fix: max-width text wrapped first).
  **Checked by Ali in Figma (22 Oct):** frame Density modes resolve (three different cards), Density variables appear only for padding
  and gaps, Surf's placeholder cells confirmed. **Approved:** the ladder, the one-step density rule and 48 / 40 / 32px controls.
- **Layout package (22 Oct): done.** Same five parts. Breakpoints 0 / 600 / 1024 / 1440 (em in CSS, rem in Tailwind; Tailwind's
  own sm and 2xl removed), columns 4 / 8 / 12 / 12, gutter and margin linked to spacing, page cap computed (1312px = 1440 − 2 × 64),
  reading width 34rem (~71 characters), tiles from 256px, header 64 / 56 / 48px by density, scroll padding linked to it
  (`max(header, rem)` in CSS). Panes are tokens: nav 256px beside the content from lg (a drawer below), aside 320px from xl (below
  the content below); products add panes in config (`layout.panes`, all panes assumed open at once). **Grids follow their region:**
  a grid inside a shell region takes the grid of the region's width (container queries; in Figma the region frame's own mode) —
  beside the nav at 1024px that is md, 8 × 65px, not 12 × 35px. tokens.css ships `.ds-page`, `.ds-grid`, `.ds-span-*`, `.ds-measure`,
  `.ds-tiles`, `.ds-region`, `.ds-shell` (header sticks only in windows ≥ 30em tall). 14 tokens; checks L1–L5 all pass. New tools:
  `npm run lint:layout` (LR-01…LR-10) and `npm run audit:layout` (320 / 600 / 1024 / 1440 / 1920px × three densities, 400% zoom,
  200% text via the browser setting, focus hidden under sticky bars tabbing both ways, reading order, the drawer). Testing found and
  fixed: 35px columns beside the open nav, an empty column when a page leaves a pane out, the guide's own example pane failing L3,
  a focused radio hidden under the header at 200% text, the audit's 200% text not moving em breakpoints, link-buttons growing the
  header past its padding, several checker/audit false alarms. **The colour, type and spacing demos had real 2.4.11 failures**
  (sticky settings bars up to 121px hid focused fields) and two scrolled sideways at 200% text — fixed. `layout.dense.*` removed
  (tile grid + compact density). 26 engine tests pass. Figma file: windows at real width set to their own Responsive / Density
  modes, layout grids bound to the grid tokens (survive the .fig round trip), `layout/page grid` grid style; 14 tokens documented
  once (asserted). Surf layout exported to PDFs + measured teardown.
  **Checked by Ali in Figma (22 Oct):** on "The page grid" the windows show 4 / 8 / 12 / 12 columns and the region grid beside
  the nav shows 8. **Approved:** nav 256px from lg, aside 320px from xl, header 64 / 56 / 48px, and `layout.dense.*` removed
  (dense screens = tile grid + compact density).
- **Radius package (22 Oct): built — waiting for Ali's check in Figma.** Same five parts. Roles by job: `shape.none`, `mark`
  (new: checkboxes, swatches, kbd), `control`, `container`, `surface`, `pill`; three styles (sharp / default / round) are the
  Shape collection's modes — the config's style first and on `:root`, the others as `data-radius` on any element and a frame's
  Shape mode in Figma. default: mark 2 · control 4 · container 8 · surface 12px; round: 4 · 8 · 12 · 16; sharp: 2 · 2 · 2 · 4.
  Nested radius = parent − padding for shapes that fill their parent (padding < parent's radius), written
  `max(0px, var(--ds-shape-x) - var(--ds-space-inset-y))`; flush children share the parent's corners; ring layers take
  `shape.*-focus` (= shape + 2px). Checks R1 (order), R2 (marks and controls keep corners), R3 (text inside the corners,
  every role/style/density), R4 (ring radii) — all pass. tokens.css: `[data-radius]` blocks, `.ds-join` (logical corners,
  focused part lifted, `data-join="block"`/`"auto"`), Tailwind's own radius scale removed. New tools: `npm run lint:radius`
  (RR-01…RR-10) and `npm run audit:radius` (every style at 1280/320px and 200% text, both directions: radii ignoring the style,
  corners poking out, nested radii, text off its fill, rounded seams, every focus ring sampled on four sides). Products add
  roles in config (`radius.roles`). Testing found and fixed: the colour and type demos used radius primitives (15 places);
  a sticky bar hid the top of a focused element's ring (tokens.css scroll padding now adds the ring's reach; demos too);
  a button group's next part painted over the focused one's ring (`.ds-join` lifts it); joined groups scrolled sideways
  at 200% text (parts shrink; `data-join="auto"` stacks until md); the demo avatar cut its initials at 200% text; several
  checker/audit false alarms. 30 engine tests pass. Figma file: every corner bound to Shape variables (per corner for joins
  and flush headers), frames in their own Shape mode (cover: one card, three styles), real clipped/covered ring examples;
  18 tokens documented once (asserted); round trip checked. Surf radius exported to PDFs + measured teardown.
  **Ask Ali:** open `ds-radius-foundation.fig` and check (1) on "Radius styles" the three cards show 2 / 8 / 12px corners;
  (2) the Shape variables appear only in the corner-radius field; (3) approve the roles and values above, the new
  `shape.mark` role, and "nested only for shapes that fill their parent".
- **Border package (23 Oct): done — checked and approved by Ali in Figma (23 Oct).** Same five parts. Widths by job: `border.width.line`
  (structure 1px), `control` (a control's edge; the one choice, `"border": { "control": 1 | 2 }`), `state` (control + 1),
  `indicator` (the current-item bar, ≥ 3px, one side); scale 1 / 2 / 3px — nothing below a pixel, nothing above 3px. Old
  `default` / `input` / `strong` removed. Each job names its colour roles (`color.border.selected` added to Colour); focus ring
  = outline 2px, 2px out, `Highlight` in forced colours. A state widens with a second cue and takes the extra width off the
  padding on the tokens; joined parts overlap by one control border (`.ds-join`, the changing part lifted); forced colours by
  design (controls keep a border, transparent if none shows; ARIA states get a `SelectedItem` outline; disabled `GrayText`).
  Checks B1–B6 (+ F2, C3) all pass. 10 tokens. New tools: `npm run lint:border` (BR-01…BR-11) and `npm run audit:border`
  (1280/320px, 200% text, normal and Chromium's real forced colours, a ring on every tab stop). Products add jobs in config
  (`border.roles`). Testing found and fixed: 30 hand-set widths and two colour-only invalid fields in our demos, settings
  switches whose choice showed by fill alone, spacing-demo menu items with no edge in forced colours, several checker/audit
  false alarms. 34 engine tests pass; all six checkers and all audits clean on every demo. Figma file: every stroke weight
  bound to a job (per side for one-sided lines), colours to the job's roles, corners to Shape, padding to Density, the doc
  kit's own lines too; rings as their own layer; joined parts with real overlap and stacking; 10 tokens documented once
  (asserted); round trip checked (bindings, stroke-weight scope, stacking). Surf border exported to PDFs + measured teardown.
  **Ask Ali:** open `ds-border-foundation.fig` and check (1) select a swatch on "Widths by job": its stroke weight shows a
  `border/width/*` variable, and Border variables appear only in the stroke-weight picker; (2) on "Joined parts" the invalid
  input in the right-hand example shows its whole red border over the button; (3) approve the four jobs and widths, 1px
  controls by default, `color.border.selected`, and joined parts **overlapping** by one border (Claude's call on the open
  question; the alternative was borders on outer parts only). Optional: `02-foundations/border/demo/index.html`, and in
  Chrome DevTools → Rendering → Emulate forced-colors.
- **Elevation package (23 Oct): built — waiting for Ali's check in Figma.** Same five parts. Ali answered the three open
  questions (23 Oct): levels **by job** — `elevation.page`, `raised`, `sticky`, `floating`, `modal`, `dragging`; floating and
  modal **share one surface** (`color.bg.surface-overlay`; the scrim tells a modal apart); **Dark shows height by lighter
  surfaces plus the edge** (page 95 → raised 90 → sticky 85 → floating/modal 80, each ≥ 1.1:1 over the one below).
  Each level = a surface (linked to Colour) + a shadow computed from its height (colour `color.shadow.N`) + an edge (all
  sides for floating/modal/dragging in the new computed `color.border.floating`, ≥ 1.5:1 against everything it can sit on
  and the scrim; sticky: `color.border.subtle` toward the content) + a layer. Classes `.ds-raised` … `.ds-dragging`,
  `.ds-scrim`. Stacking: the browser's top layer for menus, popovers, toasts and dialogs (`popover`, `showModal()`);
  `layer.sticky` 100 < `floating` 200 < `modal` 300 < `toast` 400 < `dragging` 500 for the rest; products add layers by
  name + "above" (`elevation.layers`, number computed). Checks E1–E6 all pass; 20 tokens. Tools: `npm run lint:elevation`
  (ER-01…ER-10) and `npm run audit:elevation` (Light, Dark, real forced colours, 1280/320px; `--open "#a then #b"` chains,
  each from a fresh page; what is on top, clipped menus, modal dialogs, focus under sticky bars). Prompts: build, review,
  add a layer, **fix the stacking** (replaces "fit": layers are the only config choice). Testing found and fixed: no way
  to reach a toast behind a dialog (chains), clipped menus unreported, a covered hand-made toast reported only as a faint
  edge, three audit false alarms (one in the radius audit: a top divider "poking out" of a bottom corner — radius
  fixtures and review page give the same findings as before), two numbers for one edge in the guide, two problems in
  Claude's own build answer (a pointless clip; scroll padding not re-measured at 200% text). 39 engine tests pass; all
  seven checkers and all audits clean on every demo. Figma file: cover + 11 chapters, one effect style per level with
  colour, offset, blur and spread bound to variables (a frame in Dark shows the Dark shadow), every example bound to its
  level, frames in their own Light/Dark mode, overlapping windows (menu over card, dialog over scrim) drawn without auto
  layout; 20 tokens documented once (asserted); round trip checked (bindings, effect-style links, frame modes). The
  approved **border file was rebuilt** only because its "Overlays" section named `elevation/3/border`, which no longer
  exists (now `elevation/floating/border` in `color/border/floating`); its other changes are Colour's new role showing
  (line job description; B3 11/11). Surf elevation exported to PDFs + measured teardown.
  **Ask Ali:** open `ds-elevation-foundation.fig` and check (1) on "Levels by job", the Dark frame's swatches get lighter
  left to right and its shadows are the Dark ones — select a swatch: its effect is the `elevation/<job>` style; (2) in the
  Local styles panel, an `elevation/*` effect style shows its colour bound to `color/shadow/*` and its numbers to
  `elevation/<job>/shadow/*`; (3) the Elevation variables appear only in the fill, stroke and effect pickers; (4) approve
  the levels and classes, `color.border.floating`, the layer numbers, and toasts above dialogs (`layer.toast` 400 > modal).
  Optional: `02-foundations/elevation/demo/index.html` (switch Dark and the forced-colours preview, open a card's menu,
  the dialog and its menu).
- **Motion package (23 Oct): done — checked by Ali in Figma (24 Oct).** Same five parts. Ali answered the three open
  questions (23 Oct): motion **by job** — `motion.feedback`, `change`, `floating`, `modal`, `highlight`, `loading` (products
  add jobs by kind and distance, `motion.jobs`); reduced motion is **fade only** (every distance 0, transitions ≤ 100ms
  linear, the loading indicator pulses every 2000ms down to a computed 0.65 opacity that keeps `color.fg.icon` ≥ 3:1,
  highlights unchanged); **ready transitions** in tokens.css (tokens still exposed). Durations computed from distance:
  ⌊(100 + 37.5·√px) / 50⌋ · 50 — feedback 100ms (0px), floating 150ms (4px, leaves 100), change 200ms (8px), modal 250ms
  (16px, leaves 150), nothing over 32px or 300ms; highlight 1000ms, loading turn 1000ms. Four curves by end speed, none
  faster than 2.5×: enter (0.2, 0.5, 0.4, 1), exit = enter backwards, standard (0.3, 0, 0.3, 1), linear only for the loop
  (the old enter curve jumped 36% of a dialog's move in its first frame). tokens.css: `[data-motion]` on any element;
  `.ds-floating` popovers drop in from above, toasts come up from the bottom, `dialog.ds-modal` rises while its scrim
  fades, the `.ds-shell` drawer slides from its side — all leave with the exit via `@starting-style` + `allow-discrete`;
  `.ds-loading`, `.ds-highlight`; Tailwind's own `ease-*` and `animate-*` removed. Checks M1–M6 all pass (M1 holds 2.3.3,
  AAA, as a blocking rule); 29 tokens. Tools: `npm run lint:motion` (MR-01…MR-10) and `npm run audit:motion` (full and
  reduced at 1280/320px; every animation paused and stepped frame by frame; flashes recorded from a screencast and judged
  by area; hovers, focus rings, scrolling, popovers and `--open` chains). Prompts: build, review, add a job, fix the
  motion. Testing found and fixed: a script-driven flash the first recorder averaged away, several audit false alarms
  (discrete `display` read as a 754px move, reversed transitions, translate read as a turn, layout shifts read as
  parallax), a checker false alarm and blind spot, other audits confused by the new exit transitions (they now wait for
  animations), the scroll padding of **every demo** not following a density switch (ResizeObserver on the content box),
  two problems in the motion demo, and a wrong sentence in the guide's worked example. 44 engine tests pass; all eight
  checkers and all audits clean on every demo (known older warnings: typography demo's scroll table partly under the
  header at phone width, AAA; spacing demo's Filter button corner in round style; layout app's aria-current link
  colour-only; elevation and motion demos' focus return after a chained dialog). Figma file: cover + 11 chapters + a Try
  it page with three flows; Motion collection (full, reduced) with durations as numbers, curves as `cubic-bezier(…)`
  text and distances linked to the spacing scale; duration bars, distances and curve text bound to the variables, so a
  reduced frame shows the reduced values; curves, speeds, frames, fades and turns drawn from computed numbers;
  interactive examples (button, task list, menu, toast, dialog, highlight) as component sets per mode, wired with smart
  animate and the build's duration and curve (Figma can't bind a transition to a variable); 29 tokens documented once
  (asserted); round trip checked (25/25 interactions, flows, bindings, modes). Surf motion exported to PDFs + measured
  teardown.
  **Checked by Ali in Figma (24 Oct):** all working — the bound bars and curve text show the reduced values in a reduced
  frame, the Try it flows move in full and only fade in reduced, the Motion variables stay out of the property pickers.
  The jobs, the duration rule, the four curves, the 0.65 pulse and the toast/menu directions stand.
- **Logo (21 Oct):** Claude explored 3 rounds (focus, aperture, leaf). Parked — Ali will design the logo himself and share it.
- **Next:** **Phase 2** — docs site + generator page + self-check (see NEXT SESSION below). All eight foundations are built.
- Waiting on Ali: name, licence (MIT code / CC BY docs?), Blinkwiser vs standalone, domain/GitHub/Figma accounts, start CPACC, plugin-now vs later.
- Surf reference PDFs: colour (Ali, `surf/color_foundation/`), typography, spacing, layout, radius, border, elevation and motion (Claude, `surf/typography_foundation/`, `surf/spacing_foundation/`, `surf/layout_foundation/`, `surf/radius_foundation/`, `surf/border_foundation/`, `surf/elevation_foundation/`, `surf/motion_foundation/`).

## NEXT SESSION: Phase 2 — docs site, generator page, self-check
**Agreed 24 Oct (Ali):** Phase 2 is a real Next.js app, not a static docs site. v1 = foundation pages + live generator + self-check; components next in the same app. Name stays `ds`; Vercel free tier; self-check emails to a Google Sheet. Plan and site map: `product/00-strategy/app-plan.md`. Ali's machine has Node 22, npm 10 and git.
The foundations are done (see `product/00-strategy/library-roadmap.md`, Phase 2). **Validate before building**: bring
Ali short questions first and wait for the answers — where the site lives (domain, hosting, GitHub), the working name
(`ds` is a placeholder), the licence, Blinkwiser or standalone, and how the self-check captures emails. Then propose the
site's structure from what exists: each foundation's GUIDE.md, HANDOFF.md and demo are generated or checked by the engine,
so the site should be built from them (not rewritten), with the engine's checkers and audits run on every page of it.
**Elevation (built 23 Oct, waiting for Ali):** see the status line above for what to check in Figma.
**Border (approved 23 Oct):** jobs and widths, 1px controls, `color.border.selected`, transparent control borders and overlapping joined parts all approved.
**Radius (built 22 Oct, waiting for Ali):** see the status line above for what to check in Figma; optional extra look:
`02-foundations/radius/demo/index.html` (switch style, density and direction).
**Layout (approved 22 Oct, optional extra look):** the shells on "Regions and panes" and `02-foundations/layout/demo/index.html`.
**Ask Ali (typography, still open):** open `ds-typography-foundation.fig` and check (1) on "Headings and display", the
sm/md/lg/xl columns show different sizes (FigCraft's importer can't confirm Figma resolves text styles per frame mode); (2) the
Responsive collection keeps 4 modes on his plan; (3) set Details → Numbers → Tabular on the 3 `type/numeric/*` styles.
Also: is a 40px desktop page title right? One line in the config (`typography.ratio`).
**Ask Ali (all packages):** run the prompts with his local AI agent and score them with the tests READMEs.
**Open:** the colour checker doesn't flag unknown Tailwind colour utilities (`bg-elevation-2-surface`) — noted in the spacing and
layout tests. Older test answers (colour `settings.html`, `StatCards.jsx`) predate the spacing and radius rules and are kept as
recorded.
Clean-room: never open surf/ prompt files for wording; surf/ PDFs and teardowns are for ideas and gaps only.

## Using FigCraft in a new session (cloud)
Each cloud session starts empty. Do these once at the start:
1. **FigCraft binary:** stage `product/engine/figcraft/bin/figcraft-cli-linux-x86_64.gz` (13 MB, FigCraft commit 74c4a84) from Ali's
   computer, then `mkdir -p /home/claude/fc && gunzip -c <staged .gz> > /home/claude/fc/figcraft-cli-linux-x86_64 && chmod +x` it.
   That path is the default in `mcp.py` (override with `FIGCRAFT_BIN`). If it fails: `git clone --depth 1 https://github.com/storytold/figcraft && cargo build --release -p figcraft-cli` (~9 min).
2. **Engine and builders:** device_bash works in Ali's folder; for FigCraft work, pack `product/engine` (excluding `figcraft/bin`, `out`,
   `node_modules`) into `product/_inbox/` with tar, stage it and unpack in the workspace.
3. **Fonts:** `bash product/engine/figcraft/setup_fonts.sh` — installs JetBrains Mono (ds mono styles) and IBM Plex Mono (every Surf
   file) and prints ok/MISSING for Inter, JetBrains Mono, IBM Plex Mono.
4. **Surf reference export:** `python3 engine/figcraft/export_surf.py "<surf .fig>" <out>/<name>_foundation --dump <scratch>` → PDFs in the
   same layout as `surf/typography_foundation/` plus variables/styles JSON for a measured teardown. Copy the PDFs to `surf/<name>_foundation/`.
5. **Builds:** see `product/engine/figcraft/README.md` (colour: `build_v4.py`; typography: `data_type.mjs` + `build_type.py`; spacing:
   `data_space.mjs` + `build_space.py`; layout: `data_layout.mjs` + `build_layout.py`; radius: `data_radius.mjs` + `build_radius.py`; border: `data_border.mjs` + `build_border.py`; elevation: `data_elevation.mjs` + `build_elevation.py`; motion: `data_motion.mjs` + `build_motion.py`).
6. **Browser checks** (`audit:page`, `audit:type`, `audit:space`, `audit:layout`, `audit:radius`, `audit:border`, `audit:elevation`, `audit:motion`) need Playwright: `npm i playwright` in a scratch folder and run the tools from there
   (Chromium is at /opt/pw-browsers/chromium).
7. **Writing back to Ali's folder:** deleting is blocked there, so unpack archives with `tar --overwrite -xzf` (plain tar fails with
   "File exists"), then verify with an md5 manifest (`md5sum -c`).
Newer FigCraft? Rebuild the binary from source and replace the file.

## Housekeeping
- **Done 24 Oct (Ali's permission):** `product/_inbox/` emptied — every transfer file from the radius, border, elevation and
  motion sessions (102 MB), each unpacked and verified with its md5 manifest first. `product/engine/out/` rebuilt with
  `npm run build:all` (it now clears old outputs itself when deleting is allowed), so the stale `border-elevation.md`,
  `shape-border-elevation.md` and `Shape.Value.tokens.json` are gone and the sample brands are current. Checked: the other
  855 files in the folder unchanged (`md5sum -c`); `out/` matches a clean build file for file.
- Not touched: `02-foundations/figma/ds-colour-TEST.fig` (22 Oct, 14 KB, mentioned in no doc) — asked Ali whether to delete it.
- Recorded prompt-test answers in `04-ai-layer/*/tests/` keep the `tokens.css` they were judged with, so older ones still show
  `--ds-border-width-default` / `-input` / `-strong`; they are kept as recorded, like the colour answers.
- Each session's transfer files can be deleted once unpacked and checked with their md5 manifest; deleting needs Ali's
  permission (the shell on his computer blocks deletes until he approves).
