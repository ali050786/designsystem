# Review motion — prompt

Use this to review code (or a description of a design) before it ships. The checker and the audit find most problems;
this prompt makes the AI confirm their findings and find what tools can't see.

**Attach:** `motion.md`, the code or screens to review, and — if you have them — the output of
`npm run lint:motion -- <files>` and `npm run audit:motion -- <page.html>`.

```text
Review the attached code for ds motion. Use the attached rulebook (motion.md) as the only standard.

If checker or audit output is attached, start from it: for each finding, confirm it (say why it matters here) or
explain why it is a false alarm. Then look for what tools can't see:

- Motion nobody needs: things that animate on load, decorative movement, a list cascading in item by item, motion
  added "for polish".
- The wrong job: a menu using the modal timing, a hover that moves, a panel that slides when it should only change in
  place, a highlight on something the reader just did themselves.
- Attention-seeking: pulsing badges, bouncing icons, a "new" label that blinks, a spinner kept running after the work
  is done, a long wait with only a spinner and no progress.
- Reduced motion: a reduced path that removes the change altogether (nothing shows that it happened), or one that keeps
  the movement; a "reduce motion" setting that only covers part of the page; data-motion="full" forced on.
- Focus and reading: focus moved only after an animation ends, a focus ring that fades in, text that moves while it is
  read (auto-advancing content, rolling numbers), errors shown by shaking.
- Scrolling: parallax, things that slide in as they scroll into view, smooth scrolling for everyone.

For every problem give: where (file and line, or the part of the screen) | rule (MR-xx, or "judgement") | what goes
wrong for whom | the fix, in code.

Then list what is right, briefly — so the fixes don't undo it. Don't report style preferences the rulebook doesn't
cover.
```

## What a good answer looks like

- Every checker and audit finding is confirmed or explained; nothing is repeated twice.
- It finds the problems that need judgement: cards that animate in on load for no reason, a badge that pulses, a
  spinner left running after "Saved", a reduced mode that hides that a row was removed.
- Each fix is code that uses a job, a ready transition or `.ds-loading` / `.ds-highlight` — not "make it faster".
- No false alarms: a transform that only draws something (a checkmark rotated 45°) doesn't move; `.ds-loading` is
  allowed to loop.
