# WCAG 2.2 mapping — v0.1
Target: **WCAG 2.2 Level AA**. AAA items marked; we meet them where cheap.
"Auto" = checked by the engine on every build. "Rule" = written into docs + AI rule files; tested in components (Phase 3).

| # | Rule | Foundation | WCAG | Level | Check |
|---|---|---|---|---|---|
| C1 | Normal text ≥ 4.5:1 on every allowed background, every mode | Colour, Type | 1.4.3 Contrast (Minimum) | AA | Auto |
| C2 | Large text (≥ 24px, or ≥ 18.67px bold) ≥ 3:1 | Colour, Type | 1.4.3 | AA | Auto |
| C3 | Input borders, icons, focus rings, chart marks ≥ 3:1 against adjacent colours | Colour, Border | 1.4.11 Non-text Contrast | AA | Auto |
| C4 | Positive/negative change and status always carry a non-colour cue; links underlined by default | Colour | 1.4.1 Use of Color | A | Rule |
| C5 | Chart palette and positive/negative stay distinguishable under colour-blind simulation | Colour | 1.4.1 (supporting) | A | Auto |
| C6 | Body text pairs reported against 7:1 | Colour | 1.4.6 Contrast (Enhanced) | AAA | Auto (report only) |
| T1 | Sizes in rem, line heights unitless, letter-spacing em (checked in the generated CSS); no fixed-height text containers | Type | 1.4.4 Resize Text | AA | Auto (tokens) + type audit (200% text) + Rule |
| T2 | Reading text line height ≥ 1.5 at every breakpoint; layouts survive user text spacing (0.12em letter, 0.16em word, 2× paragraph) | Type, Spacing | 1.4.12 Text Spacing | AA | Auto (tokens) + type audit (spacing override) + Rule |
| T3 | Smallest size 12px | Type | — (our rule) | — | Auto + type checker + type audit |
| T4 | Large / normal text class per style and breakpoint | Type, Colour | 1.4.3 | AA | Auto (report) |
| T5 | Number styles use tabular numerals; tables get them by default | Type | — (our rule) | — | Auto + type audit (font has tabular figures) |
| T6 | Every style's line height ≥ 1.15 | Type | — (our rule) | — | Auto |
| T7 | Hierarchy holds at every breakpoint (no colliding styles) | Type | 1.3.1 (supporting) | AA | Auto |
| T8 | No negative letter-spacing below 24px; never tighter than −0.02em | Type | — (our rule) | — | Auto + type checker |
| T9 | Running text 45–75 characters a line at body sizes | Type, Layout | 1.4.8 Visual Presentation | AAA | Auto (estimate) + type audit (measured) |
| T10 | Zoom never blocked; heading levels follow the outline | Type | 1.4.4, 1.3.1, 2.4.6 | AA | Type checker + type audit |
| L1 | Content reflows at 320 CSS px without horizontal scroll (except data tables, which scroll in their own focusable container) | Layout | 1.4.10 Reflow | AA | Auto (tokens) + layout audit (320 × 256, every breakpoint, every density, 200% text) + layout checker |
| L2 | The page grid fits every breakpoint at its narrowest width: columns ≥ 40px, gutters ≤ a third of the row | Layout | 1.4.10 (supporting) | AA | Auto + layout audit (grids as rendered) |
| L3 | Panes add up: a pane goes inline only where the main region keeps a reading line and its own grid; the grid inside a region follows the region | Layout | 1.4.10 (supporting) | AA | Auto |
| L4 | A sticky header never hides focus: scroll padding = header height (growing with text), it holds its controls in every density, and it sticks only in windows ≥ 30em tall | Layout | 2.4.11 Focus Not Obscured (Minimum) | AA | Auto (tokens) + layout audit (tabs both ways at desktop, phone, 400% zoom, 200% text) + layout checker |
| L5 | One set of breakpoints, in em (Tailwind rem), shared by type and layout | Layout, Type | 1.4.4 Resize Text (supporting) | AA | Auto |
| L6 | Visual order follows the code: shell regions in one order, no visual reordering | Layout | 1.3.2 Meaningful Sequence, 2.4.3 Focus Order | A | Layout checker (LR-07) + layout audit (regions drawn vs code order) |
| F1 | Focus indicator always visible | Border | 2.4.7 Focus Visible | AA | Rule |
| F2 | Focus ring ≥ 2px and ≥ 3:1 against both page and component fill | Border, Colour | 2.4.13 Focus Appearance | AAA | Auto |
| R3 | Text stays on its fill: the corner of every label's and content box sits inside its rounded shape (every role, style and density); pills only for labels that never wrap | Radius, Spacing, Typography | 1.4.3 Contrast (Minimum) | AA | Auto (tokens) + radius audit (text outside its shape at 200% text) |
| R4 | Focus rings follow the shape and are never cut: ring layers take shape + offset; no rounded container clips them; a joined part is lifted above its neighbours | Radius, Border | 2.4.7 Focus Visible, 2.4.13 Focus Appearance | AA (AAA) | Auto (tokens) + radius audit (every ring sampled on four sides) + radius checker |
| S1 | Targets ≥ 24 × 24px, in every density | Spacing | 2.5.8 Target Size (Minimum) | AA | Auto (tokens) + spacing audit (every target, every density, with the spacing and inline exceptions) + spacing checker |
| S2 | Comfortable density controls ≥ 44px (built: 48px) | Spacing | 2.5.5 Target Size (Enhanced) | AAA | Auto |
| S3 | Density is one rule: every token one step along the scale each way; the target floor never moves | Spacing | — (our rule) | — | Auto |
| S4 | One ladder: sizes step up inside each family; a size word is the same distance in every family, in every density | Spacing | — (our rule) | — | Auto |
| S5 | No space below 2px in any density | Spacing | — (our rule) | — | Auto |
| S6 | Controls fit their density's label with ≥ 4px above and below; heights are minimums | Spacing, Type | 1.4.4 (supporting) | AA | Auto + spacing audit (labels at 200% text in compact) + spacing checker |
| S7 | The scale sits on the 2px grid below 8px and the 4px grid from 8px up | Spacing | — (our rule) | — | Auto |
| S8 | Spacing ships in px, so enlarged text gets the room (320px phone at 200% text keeps 288px of content) | Spacing, Layout | 1.4.4, 1.4.10 (supporting) | AA | Auto (generated CSS) + spacing audit (reflow at 320px in every density) |
| S9 | What spacing groups, markup groups (lists, fieldsets, sections with headings) | Spacing | 1.3.1 Info and Relationships | A | Rule (SR-03) + review prompt |
| M1 | Reduced motion is fade only: no job moves, transitions fade in ≤ 100ms, the loading indicator pulses instead of turning | Motion | 2.3.3 Animation from Interactions | AAA (held as a blocking rule) | Auto + motion audit (every animation stepped frame by frame in reduced motion) + motion checker (MR-03, MR-04) |
| M2 | Nothing flashes: a highlight takes ≥ 334ms, no loop changes brightness more than 3 times a second | Motion | 2.3.1 Three Flashes or Below Threshold | A | Auto + motion audit (flashes recorded in real time, measured by area) + checker (MR-07) |
| M3 | Duration follows distance (100ms + 37.5ms × √px, rounded down to 50ms); nothing over 32px or 300ms; leaving takes two thirds; a loop turns at most once a second | Motion | — (our rule; supports 2.3.3) | — | Auto + audit (durations and curves belong to a job, distance measured) |
| M4 | No jumps: every curve stays under 2.5× its average speed; arriving lands at rest, leaving starts from rest | Motion | — (our rule) | — | Auto |
| M5 | The loading indicator never pulses below 3:1; text stays ≥ 4.5:1 on the highlight tint | Motion, Colour | 1.4.11, 1.4.3 | AA | Auto |
| M6 | Menus, popovers, toasts, the drawer and dialogs open and close with their jobs, from tokens only; focus rings never animate | Motion | 2.3.3, 2.4.7 | AA | Auto (generated CSS) + audit (focus rings tabbed through) + checker (MR-02, MR-05) |
| MR-06 | The only loop is the loading indicator, shown while work runs; anything else that keeps moving has a pause or stops within 5s; no autoplay | Motion | 2.2.2 Pause, Stop, Hide | A | Rule + motion checker + audit (loops, autoplay) |
| E1 | Overlays have a border/scrim, not shadow alone | Elevation | 1.4.11 | AA | Auto |

Correction to the roadmap: 2.4.11 is *Focus Not Obscured*, not focus appearance. Focus appearance is 2.4.13 (AAA). We meet 2.4.13 anyway via F2.
