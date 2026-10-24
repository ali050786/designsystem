# Colour prompt tests

How the four colour prompts were tested, what happened, and how to test them with your own AI tool.

## Who ran these

The same assistant that wrote the rulebook and the prompts ran them — following each prompt with only the rulebook in
hand. That is a weak test: the author knows the intent. What makes it worth keeping is that every answer was then judged
by **tools, not by the author**:

| Prompt | Judged by |
|---|---|
| Build with colour | the colour checker (`npm run lint:color`) and the page audit (`npm run audit:page`), which renders the page in a real browser in Light and Dark and measures every piece of text, every input outline and the keyboard focus ring |
| Review colour use | an answer key with 16 seeded problems ([review/answer-key.md](review/answer-key.md)) |
| Add a colour role | the engine: the proposed JSON is built, and the build measures every new pair |
| Theme a new brand | the engine: the brand is built and every number in the answer is copied from its output |

**The real test is yours:** run the same cases with the AI tool you'll actually use, then judge the result with the same tools.
The steps are at the end of this page.

## Results

| Case | Result | Notes |
|---|---|---|
| Build: settings page, HTML + CSS ([answer](build/answer.md), [page](build/settings.html)) | **Pass** | Checker: 0 errors. Page audit: 43/43 text, 2/2 input outlines, 10/10 focus rings, in both modes. Lowest text contrast 5.33 : 1 Light, 4.58 : 1 Dark. Screenshots in `build/shots/`. |
| Build: metric cards, React + Tailwind ([StatCards.jsx](build/StatCards.jsx)) | **Pass** | Checker: 0 errors (class strings inside expressions are checked too). |
| Review ([input](review/input.html), [key](review/answer-key.md)) | Reference answer only | The checker alone finds 7 of the 16 problems (6 errors, 1 warning) ([output](review/checker-output.txt)); the page audit confirms the contrast ones as real failures ([output](review/audit-output.txt)). The other 10 need judgement — that is what the prompt is for, and what an independent run should be scored on. |
| Add a role: callout for a new feature | **Pass** (after a fix) | Correctly reuses `bg.info-subtle`. First run exposed a gap: links had no listed pair on message backgrounds. Fixed in the engine. |
| Add a role: "Beta" label | **Pass** | Reuses `bg.brand-subtle` + `fg.brand`. |
| Add a role: drop-target outline ([answers](add-a-role/answers.md)) | **Pass** | New role `border.drop-target`; the engine built it and measured all 8 pairs ≥ 3.93 : 1. |
| Theme: Sunbeam #FFD400 and Orchid #7B2CBF ([answers](theme-a-brand/answers.md)) | **Pass** | Both build and pass. The yellow brand exposed a design risk (button fill = selected row in Light); the engine now warns about it in the report. |

## What testing changed

Testing found real problems, all fixed before this was published:

- **Links in messages had no supported colour.** `fg.link` is now listed on every `*-subtle` background (5.32–5.36 : 1).
- **Icon-only ghost buttons had no supported icon colour on hover.** `fg.icon` and `fg.icon-subtle` are now listed over the hover/pressed tints on canvas, surface and sunken; the decision guide says to use `fg.icon` for icon-only buttons.
- **The checker flagged an outline against its own fill** (e.g. a secondary button's border against the button). WCAG measures an outline against what surrounds it, so the checker no longer does this; the page audit checks real outlines in the browser.
- **The checker missed class lists built in JSX expressions** (`className={a ? '…' : '…'}`). It now reads every class-like string in component files.
- **The checker didn't know elevation tokens** (`--ds-elevation-3-surface`) are colour roles. The contract now lists these aliases.
- **Very light brands** share a shade between the button fill and selected rows. The engine report now says so.

## Run them with your own AI tool

From the `engine` folder:

1. Build and publish, so the rulebook matches the tokens: `npm run build && npm run publish`.
2. Open a new chat in your tool. Attach `04-ai-layer/color/color.md`. Paste a prompt from `../prompts/`, filled in with the request from the case above (the requests are at the top of each answer file).
3. Save what it produces next to the reference answer (e.g. `build/mine.html`), then judge it:
   - Build: `npm run lint:color -- ../04-ai-layer/color/tests/build/mine.html` and `npm run audit:page -- ../04-ai-layer/color/tests/build/mine.html` (copy `tokens.css` next to the page first; the audit needs `npm i -D playwright` once).
   - Review: mark each of the 16 rows in the answer key as found / missed, and count false alarms.
   - Add a role / Theme a brand: put the JSON in a config file and run `node src/cli.js my-config.json out/test`. It must end in PASS, and any number the AI quoted must match the output.
4. Note the tool, the date, and the score in the table below.

| Date | Tool | Build | Review (found / 16, false alarms) | Add a role | Theme |
|---|---|---|---|---|---|
| | | | | | |
