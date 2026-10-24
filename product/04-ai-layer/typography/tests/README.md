# Typography prompt tests

How the four typography prompts were tested, what happened, and how to test them with your own AI tool.

## Who ran these

The same assistant that wrote the rulebook and the prompts ran them — following each prompt with only the rulebook in
hand. That is a weak test: the author knows the intent. What makes it worth keeping is that every answer was then judged
by **tools, not by the author**:

| Prompt | Judged by |
|---|---|
| Build with type | the type checker (`npm run lint:type`) and the type audit (`npm run audit:type`), which renders the page at 1280px and 320px, measures text size, line height and line length, checks that tabular figures exist in the loaded font, and applies the WCAG text-spacing override and 200% text — plus the colour checker and page audit |
| Review type use | an answer key with 19 problems ([review/answer-key.md](review/answer-key.md)) |
| Add a text style | the engine: the proposed JSON is built; the engine computes the sizes, refuses unsafe styles and runs every check |
| Theme the type | the engine and the type audit: every number in the answer is copied from their output or from a measurement |

**The real test is yours:** run the same cases with the AI tool you'll actually use, then judge the result with the same tools.
The steps are at the end of this page.

## Results

| Case | Result | Notes |
|---|---|---|
| Build: billing page, HTML + CSS ([answer](build/answer.md), [page](build/billing.html)) | **Pass** | Type checker: 0. Type audit: smallest 12px, reading line height 1.5, fits 320px, tabular figures present, nothing cut off with the spacing override or at 200% ([output](build/audit-output.txt)). Colour: 59/59 text pairs in Light and Dark. Screenshots in `build/shots/`. |
| Build: usage cards, React + Tailwind ([UsageCards.jsx](build/UsageCards.jsx)) | **Pass** | Type and colour checkers: 0. |
| Review ([input](review/input.html), [key](review/answer-key.md)) | Reference answer only | The checker finds 11 of the 19 problems ([output](review/checker-output.txt)); the audit adds one more and measures five ([output](review/audit-output.txt)). Eight need judgement — that is what the prompt is for, and what an independent run should be scored on. |
| Add a style: 10px axis labels | **Pass** | Refused by the rules (TR-03) and by the engine; `caption.md` recommended. |
| Add a style: bigger card numbers | **Pass** | Reuses `numeric.lg`. |
| Add a style: upper-case overline ([answers](add-a-style/answers.md)) | **Pass** | `type.overline.sm` built: 12/16, +0.06em, as expected. |
| Add a style: hero figure | **Pass** | `type.figure.lg` built: 36 → 56px, tabular, grows with the screen. |
| Theme: IBM Plex ([answers](theme/answers.md)) | **Pass** (AAA warning) | Builds; Plex's narrower letters give ~76 characters a line at the default width. Audit confirms tabular figures. |
| Theme: bigger desktop headings | **Pass** | Page title 48px, display 96px at lg. |
| Theme: 18px base | **Pass** (after a fix) | First run exposed that an 18px base could never build; fixed in the engine. |

## What testing changed

Testing found real problems, all fixed before this was published:

- **An 18px base size could not be built.** The 4px grid started at 24px, where it is too coarse; neighbouring steps rounded to the same size. It now starts at 32px. Default change: `heading.md` on phones 24 → 26px.
- **The reading width was wrong.** `layout.measure.reading` (680px, described as ~70 characters) measured 86–96 characters of Inter in Chromium. It is now 34rem (544px, ~70 characters), in rem so it grows with the text size, and check T9 estimates it per font.
- **The type audit missed text that was cut off as designed** (it only reported clipping caused by the readers' settings) and called wrapped display text "reading text". Both fixed; ellipsis truncation is reported as a warning.
- **The type audit found a real bug in the demo:** at 320px a table widened the whole page (grid blow-out). Fixed with `min-width: 0` on grid items.
- **`<strong>` was bold (700), not the system's emphasis weight.** tokens.css now sets `strong, b` to semibold.
- **Refused configs printed a stack trace.** The CLI now prints one line and exits with code 2.
- **A judgement the tools can't make:** the billing page's questions used the default `h3` style (28px), nearly as big as the section heading. Fixed with `title.lg` — the kind of problem the review prompt asks for.

## Run them with your own AI tool

From the `engine` folder:

1. Build and publish, so the rulebook matches the tokens: `npm run build && npm run publish`.
2. Open a new chat in your tool. Attach `04-ai-layer/typography/typography.md`. Paste a prompt from `../prompts/`, filled in with the request from the case above (the requests are at the top of each answer file).
3. Save what it produces next to the reference answer (e.g. `build/mine.html`), then judge it:
   - Build: `npm run lint:type -- ../04-ai-layer/typography/tests/build/mine.html` and `npm run audit:type -- ../04-ai-layer/typography/tests/build/mine.html` (copy `tokens.css` next to the page first; the audit needs `npm i -D playwright` once).
   - Review: mark each of the 19 rows in the answer key as found / missed, and count false alarms.
   - Add a style / Theme: put the JSON in a config file and run `node src/cli.js my-config.json out/test`. It must end in PASS (or be refused for the right reason), and any number the AI quoted must match the output.
4. Note the tool, the date, and the score in the table below.

| Date | Tool | Build | Review (found / 19, false alarms) | Add a style | Theme |
|---|---|---|---|---|---|
| | | | | | |
