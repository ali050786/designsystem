# Motion prompt tests

How the four motion prompts were tested, what happened, and how to test them with your own AI tool.

## Who ran these

The same assistant that wrote the rulebook and the prompts ran them — following each prompt with only the rulebook in
hand. That is a weak test: the author knows the intent. What makes it worth keeping is that every answer was then judged
by **tools, not by the author**:

| Prompt | Judged by |
|---|---|
| Build with motion | the motion checker (`npm run lint:motion`) and the motion audit (`npm run audit:motion`: full and reduced motion at 1280 and 320px, every control hovered, the page tabbed through, the menu, the dialog, the toast and the sync opened) — plus the seven other checkers and the page, type, spacing, layout, radius, border and elevation audits |
| Review motion | an answer key with 16 rows ([review/answer-key.md](review/answer-key.md)) |
| Add a job | the engine: the proposed JSON is built; it refuses durations, curves, names by look or speed, loops and anything further than 32px, and runs M1–M6 |
| Fix the motion | the checker and the audit on the page before and after |

**The real test is yours:** run the same cases with the AI tool you'll actually use, then judge the result with the same tools.

## Results

| Case | Result | Notes |
|---|---|---|
| Build: orders page, HTML + CSS ([page](build/orders.html), [answer](build/answer.md)) | **Pass** (after two fixes) | All eight checkers: 0 ([output](build/checker-output.txt)). Motion audit: no problems with the filter menu, an order opened, the dialog from inside it, the toast after it and the sync ([output](build/audit-output.txt)); the other audits clean ([output](build/audit-other-output.txt)). First draft: the order headers had no edge in forced colours (border audit) and the header's scroll padding missed its own padding when density changed (layout audit). |
| Review ([input](review/input.html), [key](review/answer-key.md)) | Reference answer only | The checker finds 14 of 16 rows, the audit 10 (it adds what only a browser shows: the spinner turning from page load, the size of the flash, the ring animating on real elements); two need judgement. The [reference review](review/reference-review.md) finds 16 of 16 with no false alarms. |
| Add a job: bounce, off-screen sheet, 500ms snackbar, pulsing dot, carousel, two jobs ([answers](add-a-job/answers.md)) | **Pass** | Two configs build with the durations the rule gives (250ms for 24px; 300ms in and 200ms out for 32px); every refusal names its rule. |
| Fix the motion: reports page ([before](fix-motion/before.html), [after](fix-motion/after.html), [answer](fix-motion/answers.md)) | **Pass** | Checker 32 errors → 0; audit 53 problems → none. One part only the rulebook catches: digits rolled by a script. |

## What testing changed

Testing found real problems, all fixed before this was published:

- **The audit missed a flash written in script.** A panel whose fill a timer toggles every 125ms never shows up as an
  animation, and sampling the page's average brightness smoothed it away. The audit now records the page in real time
  (the browser's own screencast), compares small tiles frame by frame and fails a flash only when the flashing area is
  bigger than WCAG's limit — so a blinking caret or a small icon doesn't count, a 77,824px² panel does.
- **The audit counted things that don't move.** Opening a popover transitions `display`, which it first read as a
  754px jump; a closing transition played backwards was "13ms, belongs to no job"; a `translate` was read as a turn
  because it shows up as a matrix; a rotating spinner's growing bounding box and a layout shift after a click looked like
  movement with the scroll. It now skips discrete properties, measures only what is drawn, reads the declared duration
  and curve, checks a matrix for rotation or scale before calling it a turn, and compares the page at the top, scrolled
  down and back at the top. One finding per element and property, not one per interaction.
- **The checker had a false alarm and a blind spot.** A static `rotate(45deg)` on a checkmark was reported as movement
  (it now looks only at what transitions or animates); `.menu button` was "motion of its own on a popover" (only the
  selector's subject counts now); and `.btn { transition: all }` with `.btn-primary:hover { transform: … }` in another
  rule was missed (a state rule with a transform is now checked against the transitions in the same file).
- **Other audits got confused by the exit transitions.** Once menus and drawers fade out, an audit that pressed Escape
  and looked at once still saw the drawer: "Escape doesn't close the nav drawer". The page, layout, elevation and border
  audits now wait for finite animations to end (at most two seconds) after each click.
- **Every demo's scroll padding** was measured on the header's content box, so a density switch (which changes the
  header's padding, not its content) left it short by a few pixels — focus could land partly under the header. All seven
  demos and the orders page now observe the border box.
- **The motion demo** had two problems of its own: hovering a filled row poked out of its card's corner (radius audit;
  the rows now have flush corners inside the card) and the current tab was told apart by its border's colour alone
  (border checker, BR-08; the current tab now gets the indicator bar, drawn by `::after`).
- **The guide described a removed card wrongly** ("the cards after it close the gap in 200ms"): that would animate
  layout, which the rulebook forbids. The worked example now says what the build does — the card fades and moves 8px, the
  gap closes at once.

## Run them with your own AI tool

From the `engine` folder:

1. `npm run build && npm run publish`, so the rulebook matches the tokens.
2. Open a new chat in your tool. Attach `04-ai-layer/motion/motion.md` (and the colour, type, spacing, layout, radius,
   border and elevation rulebooks for the build case). Paste a prompt from `../prompts/`, filled in with the request
   from the case above.
3. Judge it:
   - Build and Fix: `npm run lint:motion -- <file>` and `npm run audit:motion -- <page.html> --open "#button" --open "#button then #inside"`
     (copy `tokens.css` next to the page; the audit needs `npm i -D playwright` once), plus the other checkers.
   - Review: mark each row in the answer key as found / missed, and count false alarms.
   - Add a job: put the JSON in a config file and run `node src/cli.js my-config.json out/test`.
4. Note the tool, the date, and the score below.

| Date | Tool | Build | Review (found / 16, false alarms) | Add a job | Fix |
|---|---|---|---|---|---|
| | | | | | |
