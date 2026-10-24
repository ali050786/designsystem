# Border prompt tests

How the four border prompts were tested, what happened, and how to test them with your own AI tool.

## Who ran these

The same assistant that wrote the rulebook and the prompts ran them — following each prompt with only the rulebook in
hand. That is a weak test: the author knows the intent. What makes it worth keeping is that every answer was then judged
by **tools, not by the author**:

| Prompt | Judged by |
|---|---|
| Build with borders | the border checker (`npm run lint:border`) and the border audit (`npm run audit:border`: 1280 and 320px, 200% text, normal and forced colours) — plus the colour, type, spacing, layout and radius checkers and the radius and layout audits |
| Review borders | an answer key with 17 rows ([review/answer-key.md](review/answer-key.md)) |
| Add a border job | the engine: the proposed JSON is built; it refuses unsafe jobs and runs B1–B6 |
| Fit borders to a product | the engine: every number in the answer is copied from its output |

**The real test is yours:** run the same cases with the AI tool you'll actually use, then judge the result with the same tools.

## Results

| Case | Result | Notes |
|---|---|---|
| Build: workspace settings, HTML + CSS ([page](build/settings.html)) | **Pass** | All six checkers: 0 ([output](build/checker-output.txt)). Border audit: nothing at either width, at 200% text or in forced colours — 9 controls keep their edge, 4 states still show, 12 tab stops with a ring in both modes ([output](build/audit-output.txt)); radius and layout audits clean ([output](build/audit-other-output.txt)). |
| Build: invite form, React + Tailwind ([MemberInvite.jsx](build/MemberInvite.jsx)) | **Pass** (after one fix) | All six checkers: 0 ([output](build/checker-output-jsx.txt)). First try: the compensated padding sat inside a template literal with a ternary, which the spacing checker read as one broken class; and `min-w-0` on the input, which `.ds-join` already provides. |
| Review ([input](review/input.html), [key](review/answer-key.md)) | Reference answer only | The checker flags 11 of 17 rows, the audit 8 (three only the audit); three need judgement alone. The [reference review](review/reference-review.md) finds 17 of 17 with no false alarms. |
| Add a job: featured cards, iOS hairlines ([answers](add-a-job/answers.md)) | **Pass** (refused for the right reasons) | Each refusal message names the rule. |
| Add a job: drop zone | **Pass** | `border.width.drop-zone` 2px dashed builds; in `color.border.subtle` it fails B3 and the build blocks it. |
| Fit: benefits service, analytics tool, "0.5px everywhere" ([answers](fit/answers.md)) | **Pass** | control 2; control 1 + compact; refused. |

## What testing changed

Testing found real problems, all fixed before this was published:

- **Our own demos had 30 hand-set border widths** (colour, type and spacing demos: `1px` everywhere), two invalid fields
  shown by colour alone, and a "show targets" overlay drawn with box-shadow. All now use the jobs; invalid fields widen
  with compensated padding.
- **Every demo's settings switches showed the chosen option by a pale fill alone** (the audit's colour-only check), and
  the radius demo's view switcher too: checked options are now bold as well. In forced colours those switches were
  only saved by a new rule — tokens.css now outlines labels around a checked radio in `SelectedItem`.
- **The border demo's own first draft** had a list whose rows poked out of its rounded corners and a nav link whose
  radius changed with its state (radius audit and checker), an error message that pushed a phone sideways at 200% text
  (`name@company.com` can't break: layout audit), and fixed card widths (layout checker).
- **Chromium rounds borders under 1px up to 1px**, at 1× and 2× alike: hairlines can't be measured in a rendered page, so
  they are the checker's job only, and the guide's claim about them was corrected.
- **Audit:** a field tabbed into selects its text, and forced colours recolour a focused field's border by themselves —
  both looked like a focus ring. The audit now clears the selection, hides the caret and ignores the element's own
  border, and found the missing rings on the review page's three fields. Content moving with bold text is no longer
  blamed on the border; only a border that changes width is.
- **Checker:** transparent current-item bars are now named for what they do in forced colours; a filled `<button class="pay">`
  is recognised as a control from the markup; `inset 0 -1px 0` lines and hover rules that widen a border are caught; state
  selectors with attribute values (`[aria-current="step"]`) are matched to their base rule.
- **Engine:** two jobs of the same width are told apart by colour, style *or* side (the current-item bar is one side);
  the "control": 0.5 refusal now explains hairlines instead of the 3px ceiling.

## Run them with your own AI tool

From the `engine` folder:

1. `npm run build && npm run publish`, so the rulebook matches the tokens.
2. Open a new chat in your tool. Attach `04-ai-layer/border/border.md` (and the colour, spacing, layout, radius and type
   rulebooks for the build case). Paste a prompt from `../prompts/`, filled in with the request from the case above.
3. Judge it:
   - Build: `npm run lint:border -- <file>` and `npm run audit:border -- <page.html>` (copy `tokens.css` next to the page;
     the audit needs `npm i -D playwright` once), plus the other checkers.
   - Review: mark each row in the answer key as found / missed, and count false alarms.
   - Add a job / Fit: put the JSON in a config file and run `node src/cli.js my-config.json out/test`.
4. Note the tool, the date, and the score below.

| Date | Tool | Build | Review (found / 17, false alarms) | Add a job | Fit |
|---|---|---|---|---|---|
| | | | | | |
