# Review test — answer key

**Input:** [input.html](input.html) (a project settings page with problems planted on purpose), checked against the
`tokens.css` next to it. **Tools:** [checker output](checker-output.txt), [audit output](audit-output.txt).

20 problems. Score an independent review by marking each row found / missed, and count false alarms.

| # | Where | Problem | Rule | Severity | Found by |
|---|---|---|---|---|---|
| 1 | `:root`, line 9 | `--ds-space-stack-md` redefined as 14px: every stack.md on the page changes, off the scale, unchecked | SR-08 | Major | Checker |
| 2 | `main`, line 11 | Page edges use `space.inset.xl` (24px, 32px in comfortable) instead of `layout.margin` (16px on a phone) | SR-02, Layout | Major | Judgement |
| 3 | `.layout`, line 13 | Two fixed columns (15rem + 1fr) on every screen: the page scrolls sideways at 320px in every density | 1.4.10 | Blocker | Audit |
| 4 | `.nav`, line 14 | Gap uses `space.inset.sm` (inset is padding) | SR-02 | Minor | Checker |
| 5 | `.card`, line 16 | `padding: 20px` — off the ladder and the same in every density | SR-01 | Major | Checker, audit (density) |
| 6 | `.card-tight`, line 17 | The Members card is padded with `space.inset.xs`: a card takes `space.inset.lg` — size picked by value, not by job | SR-03 | Minor | Judgement |
| 7 | `.form` / `.field`, lines 18–19 | Inside bigger than between: label → input is `stack.lg` (16px) but field → field is `stack.sm` (8px), so labels read as belonging to the field above | SR-03 | Major | Judgement |
| 8 | `.field label`, line 20 | `margin-bottom` uses `space.inline.xs` (inline is horizontal) — and adds to the gap | SR-02 | Minor | Checker |
| 9 | `.toolbar`, line 23 | `gap: 0.75rem` — rem spacing, off the tokens | SR-01 | Major | Checker |
| 10 | `.btn`, line 24 | `height: 36px`: labels are cut off at 200% text in compact; shorter than `size.control.height` in default (40) and comfortable (48) | SR-06, SR-05 | Blocker | Checker, audit |
| 11 | `.pill-filter`, line 26 | `height: 28px; overflow: hidden`: under the control height in every density and cut off at 200% text | SR-06 | Blocker | Audit (the checker doesn't know the class is a control) |
| 12 | `.close`, line 27 | 16 × 16px clear button: under 24px; passes WCAG only through spacing; cut off at 200% text | SR-05 | Major | Checker, audit |
| 13 | `.help-link`, line 28 | Two 18 × 18px links 4px apart in a label: fail WCAG 2.5.8 in every density (not in a sentence, so no inline exception) | SR-05, 2.5.8 | Blocker | Audit |
| 14 | `.compact .member`, lines 29 and 62 | Density by class name: rows tightened by hand instead of `data-density="compact"` on the list | SR-04 | Major | Checker (warning) |
| 15 | `.panel`, line 31 | `margin-top: var(--ds-space-6)` — a primitive; it doesn't follow density | SR-07 | Minor | Checker (warning) |
| 16 | Options, lines 48–51 | "Notify me about" is a `<p>` and the options are `<div>`s: the spacing shows a group the markup doesn't (needs a fieldset and legend) | SR-03, 1.3.1 | Major | Judgement |
| 17 | Checkboxes, lines 50–51 | Inputs and labels are separate 13px and 20px boxes: no 24px hit area; passes WCAG only through spacing | SR-05 | Minor | Audit (warning) |
| 18 | `.spacer`, line 53 | An empty element used for space | SR-09 | Minor | Checker |
| 19 | Reset button, line 56 | `data-density="compact"` on one button's wrapper: a 32px button beside a 36px one — density chosen per component, not per region | SR-04 | Minor | Judgement |
| 20 | `.form` actions | Fields → buttons use the same `stack.sm` as field → field; the actions don't read as a new group (should be `stack.xl`) | SR-03 | Minor | Judgement |

**Tools alone:** the checker finds 10 of the 20 (rows 1, 4, 5, 8, 9, 10, 12, 14, 15, 18); the audit adds 3, 11, 13 and 17 and
measures 5, 10 and 12. The other 6 (2, 6, 7, 16, 19, 20) need judgement — that is what the review prompt is for, and
what an independent run should be scored on.
