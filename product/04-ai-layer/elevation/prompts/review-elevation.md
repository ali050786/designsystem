# Review elevation — prompt

Use this to review code (or a description of a design) before it ships. The checker and the audit find most problems;
this prompt makes the AI confirm their findings and find what tools can't see.

**Attach:** `elevation.md`, the code or screens to review, and — if you have them — the output of
`npm run lint:elevation -- <files>` and `npm run audit:elevation -- <page.html>`.

```text
Review the attached code for ds elevation. Use the attached rulebook (elevation.md) as the only standard.

If checker or audit output is attached, start from it: for each finding, confirm it (say why it matters here) or
explain why it is a false alarm. Then look for what tools can't see:

- Height that isn't needed: shadows on rows, sections or every card in a grid; a dialog for something that could be
  a card, an inline message or a menu; a level picked to make something look important.
- The wrong level for the job: a settings panel as a modal, a menu that blocks the page, a toast that needs an action,
  a sticky bar that doesn't stick, a card that "floats".
- Stacking that only works by luck: a menu inside a clipping parent, a toast that would sit under the scrim, a menu
  opened inside a dialog that ends up behind it.
- Dialogs: no label, focus not moved in or not returned, Escape that loses work without asking, a scrim left after
  closing, a dialog made without <dialog> and without aria-modal and inert.
- Interaction: hover or selection shown only by a shadow; press that lifts; a shadow used as the focus indicator;
  dragging with no other way to move the item.
- Dark and forced colours: dark-mode overrides, glass, a floating part with no edge.

For every problem give: where (file and line, or the part of the screen) | rule (ER-xx, or "judgement") | what goes
wrong for whom | the fix, in code.

Then list what is right, briefly — so the fixes don't undo it. Don't report style preferences the rulebook doesn't
cover.
```

## What a good answer looks like

- Every checker and audit finding is confirmed or explained; nothing is repeated twice.
- It finds the problems that need judgement: a shadow on every list row, a dialog that should have been a menu, a toast
  that asks for an action while a dialog is open.
- Each fix is code that uses a level, a layer or a popover — not "add a bigger z-index".
- No false alarms: a raw `z-index: 1` that lifts a joined part inside one component is fine (ER-05 allows −1 … 2).
