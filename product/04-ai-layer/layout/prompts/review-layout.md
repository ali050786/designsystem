# Review layout — prompt

Use this to have an AI tool review code (or a described design) for layout problems before it ships.

**Attach:** `layout.md`, and the files to review (or screenshots at 320, 1024 and 1440px plus the tokens used, for a design).
**Run the tools first:** `npm run lint:layout -- <files>` catches fixed widths, page edges, breakpoints of their own, text
without a measure, bare fr tracks, reordering, hidden overflow, scroll padding and regions out of order;
`npm run audit:layout -- <page.html>` renders the page at every breakpoint and density and catches sideways scrolling, thin
grid columns, regions drawn out of order, long lines, focus hidden under sticky bars and a broken drawer. Paste both outputs
into the prompt — the AI then spends its effort on what the tools can't judge.

```text
Review the attached work for layout problems against the attached ds layout rulebook (layout.md).
The rulebook is the standard: its Hard rules (LR-01 … LR-10), its Decision guide and its Limits.

Layout checker output (may be empty): {paste the output of npm run lint:layout, or write "not run"}
Layout audit output (may be empty): {paste the output of npm run audit:layout, or write "not run"}

How to review:
1. Confirm each tool finding, and add anything they missed. The checker reads one CSS rule or class list at a
   time and the audit measures boxes, so look in particular for problems that need judgement:
   - a part in the wrong region: navigation inside the main region, a short task built as a pane instead of an
     overlay, supporting content that pushes the task down on a phone;
   - text the checker can't recognise as text (a div of paragraphs, a description in a card) running wider than
     layout.measure.reading;
   - widths chosen by value, not by job: the page width on a form, the reading width on a table;
   - visual order that contradicts the code: absolute positioning, grid placement by line numbers;
   - a breakpoint added to fix one component that should wrap or follow its region instead;
   - sticky bars beyond the header, and what they do to a 320 × 256 screen;
   - content hidden on small screens instead of reflowed.
2. Report only real problems. Don't pad the list, and don't restate the rules for things that are fine.

Report as a table, most serious first:

| # | Severity | Where | Rule | Problem | Fix |

- Severity: Blocker = fails WCAG now (sideways scrolling at 320px, focus hidden under a bar, content out of
  reach, reading order that contradicts the code); Major = breaks a ds rule that will fail at another width,
  density or text size; Minor = inconsistent but harmless today.
- Where: file and line, selector, or layer name.
- Problem: one sentence; include the measured number when a tool or the rulebook gives one.
- Fix: the exact token, class or change ("use .ds-measure", "move the aside after main in the code").

Finish with one line: "Blockers: n · Major: n · Minor: n — ready to ship" or "— not ready to ship".
If you found nothing, say "No layout problems found" and list what you checked.
```

## What a good answer looks like

- Every finding names a rule ID and an exact fix — a token or class, not "make it responsive".
- It catches the problems the tools can't (a region doing the wrong job, text the checker can't see, order by placement).
- It doesn't invent problems in code that follows the rules.
- The verdict line matches the table.
