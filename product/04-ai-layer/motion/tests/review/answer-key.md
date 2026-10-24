# Review motion — answer key

The problems planted in [input.html](input.html), and which tool finds each. "Checker" is `npm run lint:motion`
([output](checker-output.txt)); "audit" is `npm run audit:motion -- input.html --open "#more" --open "#more then #invite" --open "#more then #invite then #send" --open "#save"`
([output](audit-output.txt)). A good review finds all 16 and confirms or explains every tool finding.

| # | Where | Problem | Rule | Checker | Audit |
|---|---|---|---|---|---|
| 1 | `:root` (line 9) | `--ds-motion-floating-duration: 400ms` redefines a job: every menu now takes 400ms in, and reduced motion still fades in 100ms only because the reduced block happens to win | MR-10 | ✓ | — (lists 400ms among the jobs' durations) |
| 2 | `html` (10) | Smooth scrolling for everyone, reduced motion too | MR-09 | ✓ | ✓ |
| 3 | `.btn` (16) | `transition: all .25s ease`: a number and a keyword curve, and `all` takes the focus ring with it — the ring's width and offset grow in over 250ms | MR-01, MR-02 | ✓ | ✓ (curve, duration, and the ring animating in) |
| 4 | `.badge` (20) | A badge that pulses forever to get attention | MR-06, MR-08 | ✓ | ✓ (loop) |
| 5 | `.card` (23–27) | Cards rise 24px on load, one after another (80ms, 160ms delays), with no reduced path — and nobody needs it: the cards are there when the page opens | MR-04, MR-01 + judgement | ✓ (MR-04, delays as warnings) | ✓ (24px in reduced motion) |
| 6 | `.card:hover` (25, 28) | An overshooting spring curve, a 6px lift and `scale(1.02)` on hover — and it never shows, because the card's `animation … both` holds its transform: dead code that would move if the load animation went | MR-01, MR-03 | ✓ | — (the animation's fill wins the cascade) |
| 7 | `.live` + script (29–30, 87) | The live panel's fill is toggled every 125ms: 4 flashes a second over 77,824px² at 1280px — a real WCAG flash. The queue number changes every 2 seconds; that change is what needs showing, once | MR-07, WCAG 2.3.1 | ✓ (the 125ms toggle) | ✓ (recorded in real time) |
| 8 | `.spinner` (31–32) + script | A hand-made spinner at 0.7s a turn that keeps turning in reduced motion; its `display: inline-block` beats `hidden`, so it turns from page load — and nothing ever stops it after "Saved" | MR-06, MR-04, MR-01 + judgement | ✓ | ✓ (turns from load, in reduced too) |
| 9 | `.menu` (33–34) | Motion of its own on a popover: a number, and an 8px transform that isn't a job's distance | MR-05, MR-03, MR-01 | ✓ | — (tokens.css wins the cascade, so it never runs: delete it) |
| 10 | `dialog` (35–36) | The dialog slides up from off the screen (800px at 1280 × 800) in 400ms, in reduced motion too | MR-05, MR-03, MR-04 | ✓ | ✓ (800px; moves in reduced) |
| 11 | `dialog` (74) | Not `dialog.ds-modal`, so it gets neither the modal level nor its ready transition and scrim; and it has no label | judgement + ER-06 | — (elevation checker: no label) | — |
| 12 | `.field input:focus-visible` (39) | The focus ring's offset (and a box-shadow) transition in over 200ms | MR-02 | ✓ | ✓ |
| 13 | `.field input[aria-invalid]` (40–41) + script | A shake to show an error (12px, in reduced motion too) — and no message says what is wrong | MR-08, MR-04 + judgement | ✓ | ✓ (moves 12px in reduced) |
| 14 | script (89) | Parallax: the hero's text moves against the scroll | MR-09 | ✓ | ✓ (50px) |
| 15 | `@media (prefers-reduced-motion: reduce)` (45) | Reduced motion hides the toast altogether: people who asked for less motion never learn the invite was sent | judgement ("Keep one clear signal") | — | — |
| 16 | script (82) | Focus moves into the dialog only when its animation ends — keyboard users wait 400ms (in reduced motion the animation may never run, and focus never moves) | MR-05 | ✓ (warning) | — |

**Tools alone:** the checker finds 14 of 16 rows, the audit 10 (it adds what only a browser shows: the spinner turning
from page load, the size of the flash, the ring animating on real elements). Rows 11 (another foundation's checker) and
15 need judgement, as do parts of 5, 7, 8 and 13 (motion nobody needs, the missing highlight, the spinner never stopping,
the missing error message).
