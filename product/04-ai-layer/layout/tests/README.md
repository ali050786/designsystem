# Layout prompt tests

How the four layout prompts were tested, what happened, and how to test them with your own AI tool.

## Who ran these

The same assistant that wrote the rulebook and the prompts ran them — following each prompt with only the rulebook in
hand. That is a weak test: the author knows the intent. What makes it worth keeping is that every answer was then judged
by **tools, not by the author**:

| Prompt | Judged by |
|---|---|
| Build with layout | the layout checker (`npm run lint:layout`) and the layout audit (`npm run audit:layout`), which renders the page at 320, 600, 1024, 1440 and 1920px in all three densities, at 400% zoom and at 200% text (the browser setting), tabs through it both ways, and opens the drawer — plus the spacing, type and colour checkers and audits |
| Review layout | an answer key with 20 problems ([review/answer-key.md](review/answer-key.md)) |
| Add a pane | the engine: the proposed JSON is built; the engine adds every pane up at every breakpoint, refuses unsafe panes and runs every check |
| Fit the layout to a product | the engine: every number in the answer is copied from its output |

**The real test is yours:** run the same cases with the AI tool you'll actually use, then judge the result with the same tools.
The steps are at the end of this page.

## Results

| Case | Result | Notes |
|---|---|---|
| Build: members page, HTML + CSS ([answer](build/answer.md), [page](build/members.html)) | **Pass** (after a fix) | All four checkers: 0 ([output](build/checker-output.txt)). Layout audit: fits every width in every density, at 400% zoom and 200% text; 160 tab stops each way at 1280, 320, 400% zoom and 200% text with nothing hidden; the drawer opens, leaves 64px of the page, takes focus and closes with Escape ([output](build/audit-output.txt), [screenshots](build/shots/)). First version: the header was 59px against a 56px scroll padding ([first audit](build/audit-output-first-try.txt)) — fixed. Spacing, type and colour audits clean. |
| Build: reports dashboard, React + Tailwind ([ReportsDashboard.jsx](build/ReportsDashboard.jsx)) | **Pass** | All four checkers: 0 ([output](build/checker-output-jsx.txt)). |
| Review ([input](review/input.html), [key](review/answer-key.md)) | Reference answer only | The checker flags 14 of the 20 problems ([output](review/checker-output.txt)); the audit measures 6, two of them only the audit can find ([output](review/audit-output.txt)). Four need judgement alone. The [reference review](review/reference-review.md) finds 19 of 20 with no false alarms. |
| Add a pane: filters panel ([answers](add-a-pane/answers.md)) | **Pass** | No new pane: filters are the aside's job. |
| Add a pane: "a right sidebar" | **Pass** | Refused (named by position); the job is the aside's. |
| Add a pane: on phones too | **Pass** | Refused (`from: sm`): nothing fits beside a 288px content area. |
| Add a pane: outline of a help page | **Pass** | `layout.pane.outline` 192px from xl: the main content keeps exactly 544px. |
| Add a pane: inspector beside a canvas | **Pass** (after two fixes) | 320px from lg fails L3 (368px left); 288px from xl fails (448px); aside 240 + inspector 272 passes — each failure as the sums predicted. |
| Fit: docs site ([answers](fit/answers.md)) | **Pass** | nav 272, aside 240: 672px of content at lg, 800px at xl. |
| Fit: admin console | **Pass** | Compact by default, aside 400: 656px of content at xl. |
| Fit: wall dashboard | **Pass** | Tiles from 320px: 1 · 1 · 2 · 3 per row. |
| Fit: "a 320px navigation" | **Pass** (refused for the right reason) | A 320px drawer leaves nothing of a 320px screen; the limit is 272px. |

## What testing changed

Testing found real problems, all fixed before this was published:

- **Twelve columns beside an open pane were 35px wide.** Adding the panes up showed that at 1024px the main region keeps
  768px; the window's 12-column grid there gives 35px columns and gutters 38% of the row. Grids now follow the region they
  sit in (container queries in code, the frame's own Responsive mode in Figma), and L3 checks the grid inside the main region.
- **Spans set with window media queries break inside a region** for the same reason. `.ds-span-half`, `-third`,
  `-two-thirds`, `-quarter` and `-full` are computed from each grid's columns and follow the region too.
- **A page without a supporting pane kept an empty 320px column.** The shell's pane columns are now sized by the pane in
  them, so a pane left out takes no room.
- **The guide's own example pane failed.** A 288px inspector at xl leaves 448px for the content (L3). The example is now a
  192px outline, and the guide says how much room the built-in panes leave.
- **At 200% text a focused radio button ended up completely under the header.** The audit, tabbing at 200% text in a tall
  window, found the header's labels had grown it to 75px while the scroll padding stayed 64px. The scroll padding is now
  `max(header height, the same in rem)`, and the shell header sticks only in windows at least 30em tall (at 400% zoom it
  scrolls with the page). L4 checks both.
- **The audit's 200% text didn't move the breakpoints.** It set `font-size: 200%` on the page, which changes rem but not em
  media queries; readers change the browser's text size, which changes both. The audit now sets the browser's text size.
- **Link-buttons grew the header past its scroll padding.** In the build test an `<a class="btn">` kept `content-box` and came
  out 50px tall, making the header 59px against 56px of padding — too little for the focus check to catch. The audit now
  compares every sticky bar with the scroll padding.
- **Checker false alarms:** the region-order rule read `[data-shell="…"]` in CSS selectors and scripts as markup; the
  spacing checker didn't know `px-margin` and `gap-x-gutter`. Both fixed.
- **Audit false alarms and noise:** the skip link counted as hidden under the header (it is painted on top — the focus check
  now asks the browser what is painted at points across the element); two-line paragraphs, the longest-line ones, weren't
  measured; the same finding at five widths printed five times. All fixed.
- **The drawer's button stayed visible next to the inline navigation** when a page's own `.btn` rule came after tokens.css.
  The hide rule now wins.
- **Tailwind's own `sm:` (640px) and `2xl:` stayed active** next to ds's breakpoints. They are removed in
  `tailwind.theme.css`, and L5 checks it.
- **The demo's help link was 20px tall** (spacing audit). It now sits inside a sentence — WCAG's inline exception.

**Open:** the colour checker still doesn't notice unknown Tailwind colour utilities (the React test first used
`bg-elevation-2-surface`, which doesn't exist; fixed by hand to `bg-bg-surface-raised`). Same gap as noted in the spacing tests.

## Run them with your own AI tool

From the `engine` folder:

1. Build and publish, so the rulebook matches the tokens: `npm run build && npm run publish`.
2. Open a new chat in your tool. Attach `04-ai-layer/layout/layout.md` (and the spacing, type and colour rulebooks for the
   build case). Paste a prompt from `../prompts/`, filled in with the request from the case above (the requests are at the
   top of each answer file).
3. Save what it produces next to the reference answer (e.g. `build/mine.html`), then judge it:
   - Build: `npm run lint:layout -- ../04-ai-layer/layout/tests/build/mine.html` and `npm run audit:layout -- ../04-ai-layer/layout/tests/build/mine.html`
     (copy `tokens.css` next to the page first; the audit needs `npm i -D playwright` once).
   - Review: mark each of the 20 rows in the answer key as found / missed, and count false alarms.
   - Add a pane / Fit: put the JSON in a config file and run `node src/cli.js my-config.json out/test`. It must end in PASS
     (or be refused, or fail, for the right reason), and any number the AI quoted must match the output.
4. Note the tool, the date, and the score in the table below.

| Date | Tool | Build | Review (found / 20, false alarms) | Add a pane | Fit |
|---|---|---|---|---|---|
| | | | | | |
