# Review answer key — `input.html` (checkout)

17 problems planted in [input.html](input.html). "Found by" says which tool reports it on its own; rows marked
*judgement* need a reviewer. Score a review by rows found, and count false alarms separately.

| # | Where | Rule | Problem | Fix | Found by |
|---|---|---|---|---|---|
| 1 | `.field input` | BR-01 | `1px` hard-coded on every field — doesn't follow `border.control` | `var(--ds-border-width-control)` | checker, audit |
| 2 | `.field input.coupon` | BR-07 | A control edge in `color.border.default`: 1.58:1 against the page (1.4.11) | `color.border.input` | checker, audit |
| 3 | `.field input.is-error` | BR-08 | The error is a border colour only — same width, no icon, no message | `border.width.state` + `color.border.danger`, an icon and a message | checker |
| 4 | `#em` markup | BR-08 | The error is a class: no `aria-invalid`, no `aria-describedby` to a message — invisible to screen readers and to the forced-colours rules | `aria-invalid="true"` + `aria-describedby` | *judgement* |
| 5 | `.field input:focus` | BR-05 | `outline: none` + a box-shadow ring: no ring in forced colours (2.4.7) | Remove both; tokens.css draws the ring | checker, audit (forced colours) |
| 6 | `.hint` | BR-03 | A 0.5px hairline | `border.width.line` (and see 7) | checker |
| 7 | `.hint` | — | A line between a field and its hint separates nothing that space doesn't already | Remove the line; `space.stack.xs` does it | *judgement* |
| 8 | `.steps li[aria-current]` | BR-08 | A transparent indicator bar on every step: in forced colours every step shows a bar; the current step differs by colour only | The bar only on the current step (padding compensated), plus bold text | checker, audit (colour only) |
| 9 | `.pay` | BR-06 | A filled button with `border: none`: no edge in forced colours | `border: var(--ds-border-width-control) solid transparent` | checker (audit misses it: Chromium's emulated palette keeps a button colour) |
| 10 | `.card-num` | BR-03 | A width in rem (and dead: `.field input` wins on specificity) | Remove it; the field rule already sets the control width | checker |
| 11 | `.summary-row` | BR-06 | A divider drawn with `inset` box-shadow — gone in forced colours | `border-block-end: var(--ds-border-width-line) solid var(--ds-color-border-subtle)` | checker, audit |
| 12 | `.remove:hover` | BR-09 | Hover widens the border: the label moves, and it looks selected | Change the fill (`color.action.secondary.bg-hover`) | checker |
| 13 | `:root` | BR-11 | `--ds-border-width-line` redefined to 2px: every divider is the width of a state | Remove; change the engine config | checker |
| 14 | `.qty` | BR-10 | Three bordered parts side by side: two 2px seams | `.ds-join` | audit |
| 15 | `.ship .opt input` | 2.4.7 | Hidden radios with no ring on their label: keyboard focus is invisible | `.opt:has(input:focus-visible) { outline: … }` | audit |
| 16 | `.ship .opt.active` | BR-08 | Selection is a class with a fill: it doesn't follow `:checked`, has no second cue and no state width | `.opt:has(input:checked)`: `border.width.state` + `color.border.selected`, padding compensated, a check mark | audit (colour only), *judgement* (the class) |
| 17 | `.featured` | BR-07 | A state width on a section that isn't in any state: it reads as selected | `border.width.line`, or a surface change | *judgement* |

Tools alone: the checker reports 11 of the 17 rows, the audit 8 (rows 14, 15 and 16 only the audit); three need judgement
alone (4, 7, 17), and row 16's cause — a class instead of `:checked` — needs a reviewer to name it.
