# Spacing prompt tests

How the four spacing prompts were tested, what happened, and how to test them with your own AI tool.

## Who ran these

The same assistant that wrote the rulebook and the prompts ran them — following each prompt with only the rulebook in
hand. That is a weak test: the author knows the intent. What makes it worth keeping is that every answer was then judged
by **tools, not by the author**:

| Prompt | Judged by |
|---|---|
| Build with spacing | the spacing checker (`npm run lint:space`) and the spacing audit (`npm run audit:space`), which renders the page in all three densities at 1280px and 320px, measures every target against WCAG 2.5.8, flags controls shorter than the density's control height and spacing that ignores density, checks sideways scrolling and labels at 200% text — plus the type and colour checkers and audits |
| Review spacing | an answer key with 20 problems ([review/answer-key.md](review/answer-key.md)) |
| Add a spacing token | the engine: the proposed JSON is built; the engine computes every density, refuses unsafe tokens and runs every check |
| Set the density | the engine: every number in the answer is copied from its output |

**The real test is yours:** run the same cases with the AI tool you'll actually use, then judge the result with the same tools.
The steps are at the end of this page.

## Results

| Case | Result | Notes |
|---|---|---|
| Build: team members page, HTML + CSS ([answer](build/answer.md), [page](build/members.html)) | **Pass** | Spacing, type and colour checkers: 0. Spacing audit: 14 targets, smallest 32px in every density, fits 320px in all three densities, nothing ignores density, nothing cut off at 200% text ([output](build/audit-output.txt), [screenshots](build/shots/)). Type audit clean; colour 41/41 pairs in Light and Dark. |
| Build: invite dialog, React + Tailwind ([InviteDialog.jsx](build/InviteDialog.jsx)) | **Pass** | All three checkers: 0. |
| Review ([input](review/input.html), [key](review/answer-key.md)) | Reference answer only | The checker finds 10 of the 20 problems ([output](review/checker-output.txt)); the audit adds 4 and measures 3 more ([output](review/audit-output.txt)). Six need judgement — that is what the prompt is for, and what an independent run should be scored on. |
| Add a token: landing-page sections ([answers](add-a-token/answers.md)) | **Pass** | `space.stack.3xl` built: 56 / 48 / 40px. |
| Add a token: 18px card padding | **Pass** | Refused (off the scale); `space.inset.lg` recommended. |
| Add a token: a table gutter | **Pass** | Refused (space for one component); cell padding or `space.inline.lg`. |
| Add a token: hero-band padding | **Pass** (after a fix) | First try failed S4: 3xl meant 64px as inset and 48px as stack. Fixed with the same base. |
| Density: admin console ([answers](density/answers.md)) | **Pass** | Compact by default: controls 32px, md spacing 8px. |
| Density: warehouse tablet | **Pass** | Comfortable by default: controls 48px (meets 44px AAA). |
| Density: "make compact much tighter" | **Pass** (fails for the right reason) | `densityStep: 2` fails S5 (xs spaces reach 0px) and S6 (24px controls leave 2px around the label); answer keeps step 1 and uses compact regions. |

## What testing changed

Testing found real problems, all fixed before this was published:

- **Pages needed a 32px vertical padding that inset didn't have.** The checker, run on its own clean fixture, flagged
  `padding: var(--ds-space-stack-2xl)` on a page — rightly, by its own rule. Added `space.inset.2xl` with a real job (bands
  across a page; the space above and below a page's content).
- **Icon buttons drawn with a character were cut off at 200% text.** The spacing audit found a fixed 32px "⋯" button clipping
  its glyph. Icon-only buttons now use `min-width` and `min-height` everywhere (rulebook, guide, Figma, checker).
- **A checkbox sat 2px from its label in compact** (`inline.xs`). Seen in the demo: native checkboxes have no space of their
  own. A checkbox or radio and its label now take `inline.sm`.
- **Badges contradicted "the same inset on every side".** Short labels look squeezed at `inset.xs` all round; the guide now
  documents the exception (`inset.xs` above and below, `inset.sm` at the sides) instead of hiding it.
- **Comfortable density can push a phone page sideways.** Converting the colour demo to density-following tokens made it
  scroll sideways at 320px in comfortable and default (a header that didn't wrap, page edges padded with inset instead of
  `layout.margin`, inputs at their intrinsic width). Fixed; the spacing audit checks reflow in every density.
- **The colour demo hard-coded 40px control heights**, so its buttons and inputs never followed density. Now
  `size.control.height`; the checker warns about hand-set `min-height` on controls.
- **Both earlier demos used spacing primitives** (91 places). They now use semantic tokens chosen by job, and pass the
  spacing checker and audit along with their own checks.
- **Checker false alarms:** an 18px checkbox inside a 24px label was an error (now a warning — the audit measures the hit
  area); `data-density={…}` values were read as class names; `gap-y-*` was read as `gap` + `y-…`; screen-reader-only text
  tripped the type checker's clipping rule (TR-07). All fixed.
- **Audit noise:** browser-drawn padding on `<option>` and `<legend>` was reported as spacing that ignores density, and every
  finding repeated six times (three densities, two widths). Both fixed: findings now print once with where they happened.
- **S4 printed "56 = 80"** for two sizes that weren't equal. It now prints "≠".

**Open:** the colour checker didn't notice an unknown Tailwind colour utility (`hover:bg-state-hover`, which should be
`hover:bg-bg-state-hover`). Fixed in the test file by hand; the colour checker doesn't check utility names yet.
**Left as records:** the colour package's own test pages hand-set 20 spacing values. They predate the spacing foundation and
are kept as they were tested.

## Run them with your own AI tool

From the `engine` folder:

1. Build and publish, so the rulebook matches the tokens: `npm run build && npm run publish`.
2. Open a new chat in your tool. Attach `04-ai-layer/spacing/spacing.md` (and the type and colour rulebooks for the build case).
   Paste a prompt from `../prompts/`, filled in with the request from the case above (the requests are at the top of each answer file).
3. Save what it produces next to the reference answer (e.g. `build/mine.html`), then judge it:
   - Build: `npm run lint:space -- ../04-ai-layer/spacing/tests/build/mine.html` and `npm run audit:space -- ../04-ai-layer/spacing/tests/build/mine.html` (copy `tokens.css` next to the page first; the audit needs `npm i -D playwright` once).
   - Review: mark each of the 20 rows in the answer key as found / missed, and count false alarms.
   - Add a token / Density: put the JSON in a config file and run `node src/cli.js my-config.json out/test`. It must end in PASS (or be refused, or fail, for the right reason), and any number the AI quoted must match the output.
4. Note the tool, the date, and the score in the table below.

| Date | Tool | Build | Review (found / 20, false alarms) | Add a token | Density |
|---|---|---|---|---|---|
| | | | | | |
