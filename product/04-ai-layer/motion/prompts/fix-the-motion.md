# Fix the motion — prompt

Use this on existing code whose motion was written by hand: `transition: all .3s`, keyframes that slide things in from
off the screen, spinners and pulses that never stop, nothing for reduced motion. The AI moves every motion onto a job,
gives everything a reduced path, and changes nothing else.

**Attach:** `motion.md`, the code, and — if you have it — the output of `npm run lint:motion -- <files>` and
`npm run audit:motion -- <page.html> --open "#button"`.
**Check the result:** run the checker and the audit on the code before and after; every motion finding should be gone
and nothing new should appear.

```text
The attached code has motion problems: {what goes wrong, e.g. "everything still moves with reduced motion",
"the dialog flies in from the bottom of the screen"}. Fix them using the attached ds motion rulebook (motion.md) as the
only standard. Change only what motion needs; keep the markup, content and behaviour otherwise as they are.

1. Make a table of every transition, animation, @keyframes, transform on a state, scroll-behavior and script that moves
   things. Columns: Part | Today (the CSS or code that does it) | Job it really is (or "none: delete") | With reduced motion.

2. Fix them, in this order:
   - Delete motion nobody needs (decorative loops, things that animate on load, staggered entrances).
   - Popovers, toasts and dialogs: remove their own transitions and keyframes; use .ds-floating popovers and
     dialog.ds-modal with showModal(), which tokens.css animates.
   - Every remaining duration and curve: the job's tokens. Name the transitioned properties (no all, no outline).
   - Movement: translate by the job's distance on one axis; no scale or rotate, nothing from off the screen, no animated
     height, width or margin.
   - Anything of your own that still moves: inside @media (prefers-reduced-motion: no-preference).
   - Loops: .ds-loading for the loading indicator, shown only while work runs; anything else stops or gets a pause
     control. Flashes and shakes: removed; a changed value gets .ds-highlight once.
   - Smooth scrolling and anything scroll-linked: only inside no-preference, or removed.

3. Give the changed code, then a short list: what was deleted, what moved onto which job, what got a reduced path. Then
   run the rulebook's self-check and report each item.
```

## What a good answer looks like

- No `ms` number, `ease-*` keyword, `transition: all`, `scale`, `rotate` (outside `.ds-loading`) or `100vh` slide is
  left; every keyframes animation of its own moves by a job's distance or sits inside `no-preference`.
- The dialog and the menus have no motion of their own; the spinner is `.ds-loading` and stops when the work ends.
- The checker and the audit find nothing for motion afterwards, and the page still does what it did.
