# Review test — reference review

What a good answer to the [review prompt](../../prompts/review-space.md) looks like for [input.html](input.html), with the
checker and audit outputs pasted in. Author-run.

| # | Severity | Where | Rule | Problem | Fix |
|---|---|---|---|---|---|
| 1 | Blocker | `.layout` (line 13) | 1.4.10 | Two fixed columns on every screen: the page is 588–628px wide at 320px, in every density (audit). | One column below `lg`; `grid-template-columns: minmax(0, 1fr)`, two columns from 1024px. |
| 2 | Blocker | `.help-link` (line 28) | SR-05, 2.5.8 | Two 18 × 18px links 4px apart fail 2.5.8 in every density (audit). | `min-width` and `min-height: var(--ds-size-target-min)`, `margin-inline-start: var(--ds-space-inline-sm)` between them. |
| 3 | Blocker | `.btn` (line 24) | SR-06 | `height: 36px` cuts "Save changes" and "Reset" off at 200% text (line 40px); shorter than the control height in default and comfortable. | `min-height: var(--ds-size-control-height)`. |
| 4 | Blocker | `.pill-filter` (line 26) | SR-06 | `height: 28px; overflow: hidden` cuts "Admins only" off at 200% text; under the control height in every density. | `min-height: var(--ds-size-control-height)`, no overflow clipping. |
| 5 | Major | `:root` (line 9) | SR-08 | `--ds-space-stack-md: 14px` silently changes every stack.md to a value off the scale. | Remove it; if 14px is really needed, it isn't — pick a token by relationship. |
| 6 | Major | `.form` / `.field` (lines 18–19) | SR-03 | Label → input is 16px but field → field is 8px, so each label reads as belonging to the field above it. | `.field { gap: var(--ds-space-stack-xs) }`, `.form { gap: var(--ds-space-stack-lg) }`. |
| 7 | Major | Options (lines 48–51) | SR-03, 1.3.1 | The options look grouped but the markup has no group; screen-reader users don't hear "Notify me about". | `<fieldset>` with `<legend>Notify me about</legend>`. |
| 8 | Major | `main` (line 11) | SR-02 | Page edges use `inset.xl` (24px, 32px in comfortable), not the layout margin; with the grid this pushes content off a phone. | `padding: var(--ds-space-inset-2xl) var(--ds-layout-margin)`. |
| 9 | Major | `.card` (line 16) | SR-01 | `padding: 20px` is off the ladder and ignores density (audit lists it). | `var(--ds-space-inset-lg)`. |
| 10 | Major | `.toolbar` (line 23) | SR-01 | `gap: 0.75rem` — rem spacing grows with text and ignores density. | `gap: var(--ds-space-stack-sm) var(--ds-space-inline-md)` and `flex-wrap: wrap`. |
| 11 | Major | `.close` (line 27) | SR-05 | 16 × 16px; passes WCAG only on spacing and is cut off at 200% text. | `min-width` / `min-height: var(--ds-size-target-min)`. |
| 12 | Major | `.compact .member` (lines 29, 62) | SR-04 | Rows tightened by a class. | `data-density="compact"` on the list; one `.member` rule with `space.inset.md`. |
| 13 | Minor | `.card-tight` (line 17) | SR-03 | A card padded with `inset.xs` (4px): cards take `inset.lg`. | `var(--ds-space-inset-lg)`. |
| 14 | Minor | Reset button (line 56) | SR-04 | One compact button beside a default one. | Remove the wrapper's `data-density`. |
| 15 | Minor | Form actions | SR-03 | Buttons sit as close to the last field as fields to each other. | `margin-top: var(--ds-space-stack-xl)` on the actions (or group them). |
| 16 | Minor | `.nav` (line 14) | SR-02 | Gap uses `inset.sm`. | `var(--ds-space-stack-sm)`. |
| 17 | Minor | `.field label` (line 20) | SR-02 | Vertical margin with an inline token, on top of the gap. | Remove it; the field's gap does the job. |
| 18 | Minor | Checkboxes (lines 50–51) | SR-05 | No 24px hit area: label and input are separate boxes. | Wrap the input in its label with `min-height: var(--ds-size-target-min)` and `gap: var(--ds-space-inline-sm)`. |
| 19 | Minor | `.panel` (line 31) | SR-07 | A primitive (`--ds-space-6`). | `var(--ds-space-stack-xl)`. |
| 20 | Minor | `.spacer` (line 53) | SR-09 | An empty element for space. | Remove; use the gap (row 15). |

Blockers: 4 · Major: 8 · Minor: 8 — not ready to ship.
