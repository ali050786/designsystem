# Reference review — `input.html`

The "Review borders" prompt, run with `border.md`, the checker output and the audit output pasted in.

| # | Severity | Where | Rule | Problem | Fix |
|---|---|---|---|---|---|
| 1 | Blocker | `.field input:focus` | BR-05 | `outline: none` with a box-shadow ring: the audit finds no focus ring on the three fields in forced colours (2.4.7) | Remove both declarations; tokens.css draws the outline on `:focus-visible` |
| 2 | Blocker | `.ship .opt` | 2.4.7 | The radios are hidden and the label shows no ring: focus is invisible in both modes | `.ship .opt:has(input:focus-visible) { outline: var(--ds-focus-ring-width) solid var(--ds-focus-ring-color); outline-offset: var(--ds-focus-ring-offset); }` |
| 3 | Blocker | `.field input.coupon` | BR-07 | `color.border.default` on a field: 1.58:1 (1.4.11) | `color.border.input` |
| 4 | Blocker | `.field input.is-error`, `#em` | BR-08 | The error is a red border at the same width, set by a class, with no message: colour alone (1.4.1), and nothing for screen readers | `aria-invalid="true"`, `aria-describedby` to a message with an icon; `border.width.state` + `color.border.danger`; `padding-inline: calc(var(--ds-space-inset-md) - (var(--ds-border-width-state) - var(--ds-border-width-control)))` |
| 5 | Major | `.ship .opt.active` | BR-08 | Selection is a class and a fill: no state width, no check mark, not tied to `:checked` | `.opt:has(input:checked)` with `border.width.state` + `color.border.selected`, padding compensated, a check mark |
| 6 | Major | `.steps` | BR-08 | A transparent indicator on every step: every step shows a bar in forced colours; the current one differs by colour only | Bar only on `[aria-current="step"]` with `padding-block-end` reduced by the indicator width; bold text |
| 7 | Major | `.pay` | BR-06 | A filled button with no border: no edge in forced colours | `border: var(--ds-border-width-control) solid transparent` |
| 8 | Major | `.qty` | BR-10 | Three parts with their own borders: 2px seams | `<div class="ds-join" role="group" aria-label="Quantity">` |
| 9 | Major | `.summary-row` | BR-06 | A divider drawn with box-shadow: gone in forced colours | `border-block-end: var(--ds-border-width-line) solid var(--ds-color-border-subtle)` |
| 10 | Major | `:root` | BR-11 | `--ds-border-width-line: 2px` — every divider now looks like a selected state | Remove; set it in the engine config if it must change |
| 11 | Major | `.field input` | BR-01 | 1px hard-coded: heavier controls (`border.control: 2`) wouldn't reach the fields | `var(--ds-border-width-control)` |
| 12 | Major | `.featured` | BR-07 | A 2px state width on a section that isn't selected: it reads as a selected option | `border.width.line`, or set it apart with a surface |
| 13 | Minor | `.remove:hover` | BR-09 | Hover widens the border: the label moves | Change the fill on hover |
| 14 | Minor | `.hint` | BR-03 | A 0.5px hairline — and a line between a field and its hint that space already does | Remove the line |
| 15 | Minor | `.card-num` | BR-03 | A rem width (also dead code: `.field input` wins) | Remove the rule |

Blockers: 4 · Major: 8 · Minor: 3 — not ready to ship.

**Against the key:** 17 of 17 rows (row 7 and row 6 of the key are both in finding 14; rows 3 and 4 in finding 4), no false
alarms.
