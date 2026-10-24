# Review spacing — prompt

Use this to have an AI tool review code (or a described design) for spacing problems before it ships.

**Attach:** `spacing.md`, and the files to review (or screenshots in each density plus the tokens used, for a design).
**Run the tools first:** `npm run lint:space -- <files>` catches hand-set values, Tailwind numeric spacing, the wrong family,
primitives, density by class name, fixed control heights, small targets in CSS and spacer elements;
`npm run audit:space -- <page.html>` renders the page in all three densities and catches small targets, short controls,
sideways scrolling, spacing that ignores density and labels that don't fit at 200% text. Paste both outputs into the
prompt — the AI then spends its effort on what the tools can't judge.

```text
Review the attached work for spacing problems against the attached ds spacing rulebook (spacing.md).
The rulebook is the standard: its Hard rules (SR-01 … SR-09), its Decision guide and its Limits.

Spacing checker output (may be empty): {paste the output of npm run lint:space, or write "not run"}
Spacing audit output (may be empty): {paste the output of npm run audit:space, or write "not run"}

How to review:
1. Confirm each tool finding, and add anything they missed. The checker reads one CSS rule or class list at a
   time and the audit measures boxes, so look in particular for problems that need judgement:
   - a size chosen by value instead of by relationship (stack.lg between a label and its own field;
     inset.xs for a card);
   - space inside a group that is as big as, or bigger than, the space around it — groups that don't read;
   - spacing that shows a group the markup doesn't (no fieldset, list or section with a heading);
   - density changed by hand for one component instead of with data-density on a region, or a dense region
     (a table) that should have its own density;
   - controls whose height comes from padding rather than size.control.height, icon-only buttons that are
     not square, small marks without a 24px hit area;
   - page edges that use inset tokens or rem instead of layout.margin; wide content that will push a 320px
     page sideways in comfortable density;
   - space made with empty elements, <br> runs, &nbsp; or negative margins that undo a token.
2. Report only real problems. Don't pad the list, and don't restate the rules for things that are fine.

Report as a table, most serious first:

| # | Severity | Where | Rule | Problem | Fix |

- Severity: Blocker = fails WCAG now (a target under 24px with no spacing exception, a label cut off at 200%
  text, sideways scrolling at 320px); Major = breaks a ds rule that will fail in another density, text size
  or screen, or hides structure from screen-reader users; Minor = inconsistent but harmless today.
- Where: file and line, selector, or layer name.
- Problem: one sentence; include the measured number when a tool or the rulebook gives one.
- Fix: the exact token or change ("use space.stack.xs", "min-height instead of height").

Finish with one line: "Blockers: n · Major: n · Minor: n — ready to ship" or "— not ready to ship".
If you found nothing, say "No spacing problems found" and list what you checked.
```

## What a good answer looks like

- Every finding names a rule ID and an exact fix — a token name, not "add more space".
- It catches the problems the tools can't (a size chosen by value, groups that don't read, markup that doesn't group).
- It doesn't invent problems in code that follows the rules.
