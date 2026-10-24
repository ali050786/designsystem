# Radius prompt tests

How the four radius prompts were tested, what happened, and how to test them with your own AI tool.

## Who ran these

The same assistant that wrote the rulebook and the prompts ran them — following each prompt with only the rulebook in
hand. That is a weak test: the author knows the intent. What makes it worth keeping is that every answer was then judged
by **tools, not by the author**:

| Prompt | Judged by |
|---|---|
| Build with radius | the radius checker (`npm run lint:radius`) and the radius audit (`npm run audit:radius`: every style, 1280 and 320px, 200% text, both text directions, every focus ring on four sides) — plus the colour, type, spacing and layout checkers and the layout audit |
| Review radius | an answer key with 17 rows ([review/answer-key.md](review/answer-key.md)) |
| Add a shape role | the engine: the proposed JSON is built; it refuses unsafe roles and runs R1–R4 |
| Fit the radius to a product | the engine: every number in the answer is copied from its output |

**The real test is yours:** run the same cases with the AI tool you'll actually use, then judge the result with the same tools.

## Results

| Case | Result | Notes |
|---|---|---|
| Build: billing page, HTML + CSS ([page](build/billing.html)) | **Pass** (after two fixes) | All five checkers: 0 ([output](build/checker-output.txt)). Radius audit: nothing in any style, width, text size or direction ([output](build/audit-output.txt)); layout audit clean ([output](build/audit-layout-output.txt)). First try: the plan picker (a joined group of three) wrapped at 320px into rounded seams, and grid items without `min-width: 0` pushed the page to 387px ([first audit](build/audit-output-first-try.txt)). |
| Build: team switcher, React + Tailwind ([TeamSwitcher.jsx](build/TeamSwitcher.jsx)) | **Pass** | All five checkers: 0 ([output](build/checker-output-jsx.txt)). |
| Review ([input](review/input.html), [key](review/answer-key.md)) | Reference answer only | The checker flags 10 of 17 rows, the audit 10 (four only the audit); five need judgement alone. The [reference review](review/reference-review.md) finds 16 of 17 with no false alarms. |
| Add a role: cards at 12px, pill button ([answers](add-a-role/answers.md)) | **Pass** | No new role (container; control). |
| Add a role: thumbnails | **Pass** | `shape.thumbnail` 2 / 6 / 8px builds, ring radius computed. |
| Add a role: "rounded-lg", "full" markers, a radius that shrinks | **Pass** (refused for the right reasons) | Each refusal message names the rule. |
| Fit: trading tool, children's app ([answers](fit/answers.md)) | **Pass** | sharp + compact; round + comfortable. |
| Fit: "24px cards" | **Pass** (explained) | Not on the scale; nearest style given, and how to raise it. |

## What testing changed

Testing found real problems, all fixed before this was published:

- **The joined-group helper scrolled sideways at 200% text** (the demo's view switcher, then the build test's plan picker).
  First fix — letting the group wrap — produced rounded seams the audit flagged. `.ds-join` now lets its parts shrink (their
  labels wrap inside them) and has `data-join="auto"`: stacked until `md`, side by side from there.
- **A sticky bar hid the top of a focused element's ring.** `tokens.css` now adds the ring's reach (offset + width) to the
  scroll padding, and the colour, type and spacing demos add it to their measured bars too.
- **The avatar in the radius demo cut its initials off at 200% text** (a fixed 40px circle): it now grows with its text.
- **The colour and type demos used radius primitives** (15 places) — now roles, segmented-control options and menu items
  with the nested expression.
- **Checker:** `:focus-visible` rules weren't recognised as state rules (the pattern matched `:focus` first); `media-card`
  was excused from the clipping rule because its name contains "media"; a progress bar that clips its fill (nothing
  focusable inside) was flagged; a radio's dot drawn only when checked counted as a state change. All fixed.
- **Audit:** a button near a card's corner was held to the nested rule (now only shapes that fill their parent are); a link
  that wraps was sampled across its bounding box (now per line); a focused iframe counted as a missing ring; elements in a
  region with its own `data-radius` were reported as ignoring the style; a sticky bar covering part of a ring is now a
  2.4.12 warning, not a 2.4.7 failure.

## Run them with your own AI tool

From the `engine` folder:

1. `npm run build && npm run publish`, so the rulebook matches the tokens.
2. Open a new chat in your tool. Attach `04-ai-layer/radius/radius.md` (and the spacing, layout, type and colour rulebooks for
   the build case). Paste a prompt from `../prompts/`, filled in with the request from the case above.
3. Judge it:
   - Build: `npm run lint:radius -- <file>` and `npm run audit:radius -- <page.html>` (copy `tokens.css` next to the page;
     the audit needs `npm i -D playwright` once), plus the other checkers.
   - Review: mark each row in the answer key as found / missed, and count false alarms.
   - Add a role / Fit: put the JSON in a config file and run `node src/cli.js my-config.json out/test`.
4. Note the tool, the date, and the score below.

| Date | Tool | Build | Review (found / 17, false alarms) | Add a role | Fit |
|---|---|---|---|---|---|
| | | | | | |
