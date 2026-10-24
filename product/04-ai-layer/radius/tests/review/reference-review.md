# Reference review (author-run)

Written by following [review-radius.md](../../prompts/review-radius.md) with the rulebook, the checker output and the audit
output — by the same assistant that wrote the rulebook, so it is a reference answer, not a test score.

| # | Severity | Where | Rule | Problem | Fix |
|---|---|---|---|---|---|
| 1 | Blocker | `.media-card` (line 23) | RR-08 | Rounded by `overflow: hidden`; the flush "Read the setup guide" link's focus ring is cut on the top, start and end | Remove the clipping; give the link the card's radius on its top corners (`border-start-start-radius`, `border-start-end-radius: var(--ds-shape-container)`) |
| 2 | Major | `:root` (line 9) | RR-10 | `--ds-shape-control` redefined to 6px: controls ignore the style and skip the checks | Delete it; choose `radius.style` in the engine config |
| 3 | Major | `.btn:focus-visible` (line 16) | RR-09 | Turns the button into a pill on focus | Remove the rule; the outline ring is the focus cue |
| 4 | Major | `.card` (line 18) | RR-01 | `10px` | `var(--ds-shape-container)` |
| 5 | Major | `.btn-upgrade` (line 17) | RR-01, RR-04 | `999px` on a button whose label wraps at 200% text | `var(--ds-shape-control)` |
| 6 | Major | `.tile` (line 25) | RR-02 | Primitive `--ds-radius-6` | `var(--ds-shape-container)` |
| 7 | Major | `.profile-head` (line 21) | RR-05 | Square flush header pokes 2.9px out of the card's corners | `border-start-start-radius` / `border-start-end-radius: var(--ds-shape-container)` |
| 8 | Major | `.seg` (lines 26–28) | RR-06 | Physical corners (rounded seams right to left) and no lift (the next button covers the ring) | `<div class="ds-join" role="group">` and remove both rules |
| 9 | Major | `.agree input` (line 29) | RR-04 | Checkbox with the control radius — a circle in the round style | `var(--ds-shape-mark)` |
| 10 | Major | `.chip:focus-visible::after` (line 34) | RR-07 | Ring layer 4px out with the element's radius | Drop the layer (outline does it) or `inset: calc(-1 * var(--ds-focus-ring-offset))` with `border-radius: var(--ds-shape-control-focus)` and a box-shadow ring |
| 11 | Major | `.tag` (line 35) | RR-04 | `--ds-shape-tag` doesn't exist | `var(--ds-shape-pill)` (a one-word label) |
| 12 | Minor | `.card .panel` (line 19) | RR-05 | Fills the card inset by `inset.xs` | `max(0px, var(--ds-shape-container) - var(--ds-space-inset-xs))` |
| 13 | Minor | `.dialog` (line 36) | RR-04 | Control radius on a dialog | `var(--ds-shape-surface)` |
| 14 | Minor | `.menu` (line 37) | RR-04 | Surface radius on a menu | `var(--ds-shape-container)`, and the items `max(0px, var(--ds-shape-container) - var(--ds-space-inset-xs))` |
| 15 | Minor | `.toggle` (line 39) | RR-04 | Control radius on a toggle track | `var(--ds-shape-pill)` |

Blockers: 1 · Major: 10 · Minor: 4 — not ready to ship.

Against the key: 16 of 17 rows found (row 4 merged into 5); no false alarms.
