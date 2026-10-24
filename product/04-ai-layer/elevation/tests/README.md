# Elevation prompt tests

How the four elevation prompts were tested, what happened, and how to test them with your own AI tool.

## Who ran these

The same assistant that wrote the rulebook and the prompts ran them — following each prompt with only the rulebook in
hand. That is a weak test: the author knows the intent. What makes it worth keeping is that every answer was then judged
by **tools, not by the author**:

| Prompt | Judged by |
|---|---|
| Build with elevation | the elevation checker (`npm run lint:elevation`) and the elevation audit (`npm run audit:elevation`: Light, Dark and forced colours at 1280 and 320px, every menu, the dialog and the toast opened) — plus the six other checkers and the page, border, radius, spacing, layout and type audits |
| Review elevation | an answer key with 17 rows ([review/answer-key.md](review/answer-key.md)) |
| Add a layer | the engine: the proposed JSON is built; it refuses numbers, names by position, two layers in one spot and anything that isn't a layer, and runs E6 |
| Fix the stacking | the checker and the audit on the page before and after |

**The real test is yours:** run the same cases with the AI tool you'll actually use, then judge the result with the same tools.

## Results

| Case | Result | Notes |
|---|---|---|
| Build: support inbox, HTML + CSS ([page](build/inbox.html), [answer](build/answer.md)) | **Pass** (after two fixes) | All seven checkers: 0 ([output](build/checker-output.txt)). Elevation audit: no problems with the row menu, the dialog opened from it and the toast after it ([output](build/audit-output.txt)); the other audits clean ([output](build/audit-other-output.txt)). First draft: the list panel clipped its content for no reason (radius checker) and the header's scroll padding wasn't re-measured when text grew (layout audit). |
| Review ([input](review/input.html), [key](review/answer-key.md)) | Reference answer only | The checker finds 13 of 17 rows, the audit 10 (two only the audit: focus hidden under the header, the clipped menu); three need judgement. The [reference review](review/reference-review.md) finds 17 of 17 with no false alarms. |
| Add a layer: chat panel, cookie banner at 99999, `layer.top`, two layers in one spot, stronger shadows ([answers](add-a-layer/answers.md)) | **Pass** | Two layers build where the description puts them (banner 150, help panel 175); every refusal names its rule. |
| Fix the stacking: invoices page ([before](fix-stacking/before.html), [after](fix-stacking/after.html), [answer](fix-stacking/answers.md)) | **Pass** | Checker 5 errors → 0; audit 9 problems → none. |

## What testing changed

Testing found real problems, all fixed before this was published:

- **The audit couldn't reach a toast.** A toast only appears after confirming inside a dialog, and `--open` took one
  selector. `--open "#a then #b"` now clicks a chain, and each `--open` starts from the page as it loaded, so a menu one
  step left open can't break the next.
- **The audit didn't notice a clipped menu** — the most common stacking bug, and named in the rulebook. It now fails any
  floating thing cut off by a parent that clips ("cut off 72px by li.card (overflow: hidden) — open it as a popover").
- **A hand-made toast under a hand-made overlay** was reported only as a faint edge. Fixed boxes with a shadow are now
  checked for what covers them ("div#toast is covered by div#overlay").
- **Audit false alarms:** a table header scrolled out of sight inside its own table was "covered by main" (only the part
  a clipping parent still shows is tested now); focus going back to the menu's button after a dialog opened from the
  menu was a warning (a chain's last click is the opener); findings for a chain were grouped under a broken label.
- **Radius audit false alarm** (found while building the inbox): a list row with only a top divider "poked out" of its
  panel's bottom corner. Only what an element draws at a corner — a fill, a shadow, or a border on one of the two sides
  that meet there — is tested now; the radius fixtures and the radius review page still report the same 3 and 5 corners.
- **The review page's planted "focus under the header"** at first wasn't real (the page was too short to scroll); the
  activity list was made longer so the problem exists and the audit finds it.
- **The guide gave two numbers for one edge** (1.85:1 on the bare page in one table, 1.68:1 beside the menu's own shadow
  in another). The measured mistake now quotes the same lowest values as the Edges table.

## Run them with your own AI tool

From the `engine` folder:

1. `npm run build && npm run publish`, so the rulebook matches the tokens.
2. Open a new chat in your tool. Attach `04-ai-layer/elevation/elevation.md` (and the colour, border, spacing, layout,
   radius and type rulebooks for the build case). Paste a prompt from `../prompts/`, filled in with the request from the
   case above.
3. Judge it:
   - Build and Fix: `npm run lint:elevation -- <file>` and `npm run audit:elevation -- <page.html> --open "#button" --open "#button then #inside"`
     (copy `tokens.css` next to the page; the audit needs `npm i -D playwright` once), plus the other checkers.
   - Review: mark each row in the answer key as found / missed, and count false alarms.
   - Add a layer: put the JSON in a config file and run `node src/cli.js my-config.json out/test`.
4. Note the tool, the date, and the score below.

| Date | Tool | Build | Review (found / 17, false alarms) | Add a layer | Fix |
|---|---|---|---|---|---|
| | | | | | |
