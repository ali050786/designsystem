# Review colour use — prompt

Use this to have an AI tool review code (or a described design) for colour problems before it ships.

**Attach:** `color.md`, and the files to review (or screenshots plus a list of the roles used, for a design).
**Run the checker first:** `npm run lint:color -- <files>` catches raw colours, unknown roles and many unlisted pairs
mechanically. Paste its output into the prompt — the AI then spends its effort on what a checker can't see.

```text
Review the attached work for colour problems against the attached ds colour rulebook (color.md).
The rulebook is the standard: its Hard rules (CR-01 … CR-15), its Pair contract and its Not allowed list.

Checker output (may be empty): {paste the output of npm run lint:color, or write "not run"}

How to review:
1. Confirm each checker finding, and add anything it missed. A checker reads one CSS rule at a time, so look
   in particular for problems that only show up in context:
   - text whose background comes from a parent, a sibling layer or a later state (hover, pressed, selected,
     an open menu) — check the pair it really ends up in;
   - colour carrying meaning on its own: status without words or an icon, links without an underline,
     changes without an arrow or sign;
   - fg.positive / fg.negative chosen by direction instead of by good or bad news;
   - translucent hover tints inside menus, popovers, dialogs or raised cards;
   - ghost buttons or brand-coloured text on surface-sunken or a tint over it;
   - more than one primary action in a view;
   - focus rings removed or hidden (outline: none, outline-none, outline: 0, a box-shadow reset);
   - decorative borders (border.subtle, border.default) used to outline an input or control;
   - information that exists only in disabled text;
   - menus, popovers or dialogs without an outline, or modal dialogs without a scrim;
   - chart series out of order or without labels; brand colour used to mean success;
   - Light/Dark handled by swapping role names or writing separate dark colours instead of data-theme.
2. Report only real problems. Don't pad the list, and don't restate the rules for things that are fine.

Report as a table, most serious first:

| # | Severity | Where | Rule | Problem | Fix |

- Severity: Blocker = fails WCAG now; Major = breaks a ds rule that will fail in another mode, state or
  brand, or hides meaning; Minor = inconsistent but harmless today.
- Where: file and line, selector, or layer name.
- Problem: one sentence; include the measured ratio when the rulebook gives one.
- Fix: the exact role or change ("use color.fg.on-brand", "add ▼ before the value").

Finish with one line: "Blockers: n · Major: n · Minor: n — ready to ship" or "— not ready to ship".
If you found nothing, say "No colour problems found" and list what you checked.
```

## What a good answer looks like

- Every finding names a rule ID and an exact fix — a role name, not "use a darker colour".
- It catches context problems the checker can't (inherited backgrounds, colour-only meaning, two primaries).
- It doesn't invent problems in code that follows the rules.
