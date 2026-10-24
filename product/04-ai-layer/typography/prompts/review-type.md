# Review type use — prompt

Use this to have an AI tool review code (or a described design) for typography problems before it ships.

**Attach:** `typography.md`, and the files to review (or screenshots plus a list of the styles used, for a design).
**Run the tools first:** `npm run lint:type -- <files>` catches hand-set sizes, line heights, fonts, unknown styles and
blocked zoom; `npm run audit:type -- <page.html>` renders the page and catches small text, cramped lines, long lines,
sideways scrolling and text cut off at 200% or with the spacing override. Paste both outputs into the prompt — the AI
then spends its effort on what the tools can't judge.

```text
Review the attached work for typography problems against the attached ds typography rulebook (typography.md).
The rulebook is the standard: its Hard rules (TR-01 … TR-14), its Decision guide and its Limits.

Type checker output (may be empty): {paste the output of npm run lint:type, or write "not run"}
Type audit output (may be empty): {paste the output of npm run audit:type, or write "not run"}

How to review:
1. Confirm each tool finding, and add anything they missed. The checker reads one CSS rule or class list at a
   time and the audit measures pixels, so look in particular for problems that need judgement:
   - a style chosen by size instead of by job (a caption used for instructions, a title style for a page title,
     body text used for a button label, display used for an app's page title);
   - text that looks like a heading but isn't one, or a heading tag used only for its size;
   - heading levels that skip, or don't match the visual hierarchy; more than one display style in a view;
   - sizes that come from a parent rule or a component library default rather than a style;
   - numbers people compare without tabular numerals, numeric columns not right-aligned, a hyphen instead of
     a minus sign;
   - text that will be cut off when people enlarge it or increase spacing: fixed heights, nowrap with hidden
     overflow, truncation without a way to see the full text;
   - running text wider than layout.measure.reading, justified text, sentences in capitals, emphasis by
     colour or underline;
   - font families, weights below 400 or letter-spacing set by hand; zoom blocked in the viewport tag.
2. Report only real problems. Don't pad the list, and don't restate the rules for things that are fine.

Report as a table, most serious first:

| # | Severity | Where | Rule | Problem | Fix |

- Severity: Blocker = fails WCAG now (text cut off, zoom blocked, cramped reading text, text too small);
  Major = breaks a ds rule that will fail at another width, text size or language, or misleads screen-reader
  users; Minor = inconsistent but harmless today.
- Where: file and line, selector, or layer name.
- Problem: one sentence; include the measured number when a tool or the rulebook gives one.
- Fix: the exact style or change ("use type.body.sm", "change the h4 to h3").

Finish with one line: "Blockers: n · Major: n · Minor: n — ready to ship" or "— not ready to ship".
If you found nothing, say "No typography problems found" and list what you checked.
```

## What a good answer looks like

- Every finding names a rule ID and an exact fix — a style name, not "make it bigger".
- It catches the problems the tools can't (a style chosen by size, fake headings, levels that skip on purpose).
- It doesn't invent problems in code that follows the rules.
