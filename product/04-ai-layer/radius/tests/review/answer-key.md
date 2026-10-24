# Review test — answer key

**Input:** [input.html](input.html) (a workspace settings page with problems planted on purpose), checked against the
`tokens.css` next to it. **Tools:** [checker output](checker-output.txt), [audit output](audit-output.txt).

16 problems. Score an independent review by marking each row found / missed, and count false alarms.

| # | Where | Problem | Rule | Severity | Found by |
|---|---|---|---|---|---|
| 1 | `:root`, line 9 | `--ds-shape-control: 6px` redefined: every control is 6px in every style, and the checks never saw it | RR-10 | Major | Checker; audit (6px in every style on every control) |
| 2 | `.btn:focus-visible`, line 16 | The radius turns to a pill on focus — the shape jumps when tabbing, and the ring moves with it | RR-09 | Major | Checker, audit |
| 3 | `.btn-upgrade`, line 17 | `999px` hard-coded | RR-01 | Major | Checker |
| 4 | `.btn-upgrade`, line 17 | A pill on a button with a long label: at 200% text on a phone it wraps to two lines. Here the label is centred and stays inside (the audit measures 0 text outside), but a start-aligned or longer label would not — buttons take `shape.control` | RR-04 | Minor | Judgement |
| 5 | `.card`, line 18 | `10px` hard-coded | RR-01 | Major | Checker, audit |
| 6 | `.card .panel`, line 19 | The panel fills the card inset by `inset.xs` but copies a role instead of `max(0px, parent − padding)` | RR-05 | Minor | Audit (the checker can't see nesting in CSS) |
| 7 | `.profile-head`, line 21 | A square header flush with a rounded card: its corners poke 2.9px out (default style) | RR-05 | Major | Audit |
| 8 | `.media-card`, line 23 | Rounded by `overflow: hidden`; the flush "Read the setup guide" link loses its focus ring on three sides | RR-08, 2.4.7 / 2.4.13 | Blocker | Checker (warning), audit |
| 9 | `.tile`, line 25 | `--ds-radius-6`: a primitive, doesn't follow the style | RR-02 | Major | Checker, audit |
| 10 | `.seg`, lines 27–28 | Physical corners: right to left, the seams are rounded and the ends square | RR-06 | Major | Checker, audit (rtl) |
| 11 | `.seg` | The next button paints over the focused one's ring where they meet (no lift) — `.ds-join` does both | RR-06, 2.4.13 | Major | Audit |
| 12 | `.agree input`, line 29 | A checkbox with the control radius: in the round style it is a circle next to radios | RR-04 | Major | Judgement (the selector doesn't say "checkbox") |
| 13 | `.chip:focus-visible::after`, line 34 | A ring on its own layer 4px out with the element's radius — corners pinch; it needs `shape.control-focus` and its offset | RR-07 | Major | Checker, audit |
| 14 | `.tag`, line 35 | `--ds-shape-tag` is not a role | RR-04 | Major | Checker |
| 15 | `.dialog`, line 36 | A dialog with the control radius — the role was chosen by look, not job: `shape.surface` | RR-04 | Minor | Judgement |
| 16 | `.menu`, line 37 | A menu with the surface radius: menus are `shape.container` (its items' nested radius is right) | RR-04 | Minor | Judgement |
| 17 | `.toggle`, line 39 | A toggle track with the control radius: round ends are `shape.pill` | RR-04 | Minor | Judgement |

(17 rows: problem 3 and 4 are the same line, counted once for the score of 16 if a review merges them.)

**Tool coverage:** the checker flags 10 of the 17 rows, the audit 10 — four only the audit (6, 7, 11, and the state change
it confirms); five need judgement alone (4, 12, 15, 16, 17). The judgement rows are what an independent run should be
scored on.
