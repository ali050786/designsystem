# Review borders — prompt

Use this to have an AI tool review code (or a described design) for border problems before it ships.

**Attach:** `border.md`, and the files to review (or screenshots plus the tokens used, for a design).
**Run the tools first:** `npm run lint:border -- <files>` catches hard-coded, rem and sub-pixel widths, primitives,
Tailwind's own widths and rings, removed focus rings, box-shadow lines, filled controls without a border, control lines in
decorative colours, states shown by colour alone or that move content, hand-made overlaps and redefined variables;
`npm run audit:border -- <page.html>` renders the page normally and in forced colours and catches widths that don't follow
the control width or grow with text, control edges under 3:1, doubled seams, content that moves with a state, and controls,
states and focus rings that disappear in forced colours. Paste both outputs into the prompt.

```text
Review the attached work for border problems against the attached ds border rulebook (border.md).
The rulebook is the standard: its Hard rules (BR-01 … BR-11), its Decision guide and its Limits.

Border checker output (may be empty): {paste the output of npm run lint:border, or write "not run"}
Border audit output (may be empty): {paste the output of npm run audit:border, or write "not run"}

How to review:
1. Confirm each tool finding, and add anything they missed. Look in particular for what needs judgement:
   - a line that space or a surface change already does (a border around every section, a divider under a heading
     that already has space);
   - a job chosen by look: a 2px "strong" card outline that reads as selected, a control width on a decorative frame;
   - a state shown by a fill or a class the system can't see (no aria attribute, no real border) — it disappears in
     forced colours;
   - a selected or invalid state with no second cue (no icon, message, check mark or bold text);
   - parts that touch but aren't joined, or table cells with double borders;
   - a focus ring hidden by clipping or drawn inside where it collides with a state outline.
2. Report only real problems. Don't pad the list.

Report as a table, most serious first:

| # | Severity | Where | Rule | Problem | Fix |

- Severity: Blocker = fails WCAG now (a field edge under 3:1, no focus ring, a state shown by colour alone);
  Major = breaks a ds rule that shows in forced colours, at 200% text or with heavier controls; Minor = inconsistent
  but harmless today.
- Fix: the exact job, colour role, expression or class.

Finish with one line: "Blockers: n · Major: n · Minor: n — ready to ship" or "— not ready to ship".
```

## What a good answer looks like

- Every finding names a rule ID and an exact fix.
- It catches what the tools can't (a line that space would do, a fill-only selection on a class, a 2px decorative frame).
- It doesn't invent problems in code that follows the rules.
