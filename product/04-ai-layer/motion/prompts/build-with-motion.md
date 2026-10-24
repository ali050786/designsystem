# Build with motion — prompt

Use this when you want an AI tool to build a screen whose hovers, panels, menus, dialogs, toasts, highlights and loading
states follow ds motion.

**Attach:** `motion.md` (the motion rulebook), and `elevation.md`, `color.md`, `border.md`, `spacing.md`, `layout.md`, `radius.md`, `typography.md` when the work uses them.
**Works with:** plain HTML + CSS, Tailwind v4, or React + Tailwind.
**Check the result:** `npm run lint:motion -- <files>` and `npm run audit:motion -- <page.html> --open "#button"` (see the tests folder for how).

```text
You are building UI for a product that uses the ds design system. Everything that moves or changes over time — hovers,
panels opening, tabs, menus, toasts, dialogs, highlights, loading indicators — must come from the attached ds motion
rulebook (motion.md). Treat the rulebook as the source of truth: if anything in this request conflicts with it, follow
the rulebook and tell me which rule (MR-xx) applied.

What to build: {describe the screen: what people do on it and what is on it}
Code style: {plain HTML + CSS | Tailwind v4 classes | React + Tailwind}

Work in this order.

1. List every part that might move, before writing code. One row each.
   Columns: Part | Needs motion? (what would people miss without it) | Job | Comes from | With reduced motion.
   Use the rulebook's Decision guide. Jobs: feedback (hover, press, toggles — colour only), change (content changing
   where it is), floating (menus, popovers, tooltips, toasts, the drawer), modal (dialogs), highlight (a value that
   changed on its own, once), loading (work in progress). Most parts need no motion at all.

2. Decide how each floating or modal part opens — the elevation rulebook's way, so tokens.css animates it:
   - Menus, popovers and tooltips: .ds-floating with the popover attribute, opened by a popovertarget button.
   - Toasts: .ds-floating data-layer="toast" popover="manual" role="status", needing no action.
   - Dialogs: <dialog class="ds-modal" aria-labelledby="…"> opened with showModal(); focus back to the opener.
   Add no transitions or animations of your own to them.

3. Write the code.
   - Durations and curves only from a job: var(--ds-motion-<job>-duration), var(--ds-motion-<job>-easing) (and the
     -exit- pair for leaving); in Tailwind ease-<job> and duration-(--ds-motion-<job>-duration). No ms, no ease-in-out,
     no cubic-bezier() of your own.
   - Name the properties that transition; never transition: all, never outline.
   - Move only by a job's distance (translate by var(--ds-motion-<job>-distance)), on one axis. No scale, rotate, skew,
     no slides from off the screen, no animated height, width or margin: change the size at once, let the content arrive.
   - Every animation of your own either moves by a job's distance or runs inside
     @media (prefers-reduced-motion: no-preference).
   - The only loop is .ds-loading, shown only while work runs; anything that can take longer than 5 seconds also shows
     progress in words or a bar.
   - A value that changes on its own gets .ds-highlight, once. Never blink, shake, bounce or pulse anything.
   - Nothing moves with scrolling; smooth scrolling only inside no-preference; no autoplay.
   - Assume tokens.css (and tailwind.theme.css for Tailwind) is loaded. Colour, border, spacing, layout, radius,
     elevation and type follow their own rulebooks.

4. Self-check. Go through the rulebook's "Self-check before answering" list and report each item as pass or fixed.
   Then list any part of the request you could not do within the rules, and why.

Reply with: the parts table, the code, then the self-check.
```

## What a good answer looks like

- The parts table comes first, and most parts have **no** motion (a page title, a static list, a sidebar).
- Buttons and rows answer a hover with colour in the feedback job; a panel's content arrives by the change distance;
  menus, the toast and the dialog have no motion of their own (tokens.css does it); a saved value gets `.ds-highlight`
  once; saving shows `.ds-loading` and then words.
- There is no `ms` number, no `ease-in-out` and no `transition: all` anywhere.
- The page passes the motion audit: nothing moves with reduced motion, nothing travels more than 32px, every duration
  and curve is a job's, nothing loops but the indicator, nothing flashes, focus rings appear at once.

## Common ways it goes wrong (and what to say back)

| What you see | Reply |
|---|---|
| `transition: all .2s ease-in-out` on buttons | "MR-01, MR-02: name the properties and take the feedback job — `transition: background-color var(--ds-motion-feedback-duration) var(--ds-motion-feedback-easing)`." |
| A dialog with `@keyframes slideUp { from { transform: translateY(100%) } }` | "MR-05: dialog.ds-modal already rises 16px and fades with the scrim; delete the keyframes. A 100% slide also breaks MR-03." |
| `hover:scale-105` on cards | "MR-03: nothing grows to make a point — change the fill (feedback)." |
| `animate-pulse` on a skeleton, `animate-spin` on a spinner | "MR-06: the only loop is `.ds-loading`; a skeleton stays still." |
| `max-height` transition for an accordion | "MR-03: change the size at once; let the content arrive by `--ds-motion-change-distance`." |
| A shaking field on error | "MR-08: an error message and the state border; nothing shakes." |
| `scroll-behavior: smooth` on `html` | "MR-09: only inside `@media (prefers-reduced-motion: no-preference)`." |
