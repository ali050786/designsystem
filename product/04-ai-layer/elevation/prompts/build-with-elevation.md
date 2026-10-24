# Build with elevation — prompt

Use this when you want an AI tool to build a screen whose cards, bars, menus and dialogs follow ds elevation.

**Attach:** `elevation.md` (the elevation rulebook), and `color.md`, `border.md`, `spacing.md`, `layout.md`, `radius.md`, `typography.md` when the work uses them.
**Works with:** plain HTML + CSS, Tailwind v4, or React + Tailwind.
**Check the result:** `npm run lint:elevation -- <files>` and `npm run audit:elevation -- <page.html> --open "#button"` (see the tests folder for how).

```text
You are building UI for a product that uses the ds design system. Everything that sits above the page — cards, sticky
bars, menus, popovers, toasts, dialogs, dragged items — must come from the attached ds elevation rulebook (elevation.md).
Treat the rulebook as the source of truth: if anything in this request conflicts with it, follow the rulebook and tell
me which rule (ER-xx) applied.

What to build: {describe the screen: what people do on it and what is on it}
Code style: {plain HTML + CSS | Tailwind v4 classes | React + Tailwind}

Work in this order.

1. List every part that might have height, before writing code. One row each.
   Columns: Part | Needs height? | Level | How it opens | What it must sit above.
   Use the rulebook's Decision guide: space groups things, a surface change sets a region apart, a line separates —
   height only for something that really sits over something else. Levels: page, raised (cards and panels in the
   flow), sticky (bars content scrolls under), floating (menus, popovers, tooltips, toasts, the nav drawer), modal
   (must be answered: dialogs, sheets), dragging (only while held). Pick the lowest level that works.

2. Decide how each floating or modal part opens.
   - Menus, popovers and tooltips are elements with the popover attribute, opened by a button with popovertarget, so
     they sit in the browser's top layer and no parent can clip them.
   - Dialogs are <dialog class="ds-modal" aria-labelledby="…"> opened with showModal(); focus goes back to the
     button that opened it when it closes.
   - A toast is .ds-floating data-layer="toast" popover="manual" role="status", shown after any open dialog, and
     needs no action.
   - Dragging needs a second way (buttons or arrow keys), and says what happened in a live region.

3. Write the code.
   - Take the whole level: the class (.ds-raised, .ds-sticky, .ds-floating, .ds-modal, .ds-dragging) or, in
     Tailwind, the class list the rulebook gives for it. Never a shadow on its own.
   - box-shadow is only ever var(--ds-elevation-<job>-shadow) or none; no shadow by hand, no Tailwind shadow-sm …
     shadow-2xl, no drop-shadow filters.
   - z-index is only ever var(--ds-layer-<job>), or -1 … 2 for order inside one component. Never 999 or 9999.
   - Floating, modal and dragging keep their edge; sticky bars their line toward the content. Never remove them.
   - Surfaces are opaque: no backdrop-filter, no translucent backgrounds.
   - Hover changes the fill (color.bg.surface-hover) or a border colour, never only the shadow; press goes back down.
   - No dark-mode rules for shadows or surfaces: the tokens switch by themselves.
   - Assume tokens.css (and tailwind.theme.css for Tailwind) is loaded. Colour, border, spacing, layout, radius and
     type follow their own rulebooks.

4. Self-check. Go through the rulebook's "Self-check before answering" list and report each item as pass or fixed.
   Then list any part of the request you could not do within the rules, and why.

Reply with: the parts table, the code, then the self-check.
```

## What a good answer looks like

- The parts table comes first, and some parts have **no** height (a section set apart by space, a sidebar by its surface).
- Cards are `.ds-raised`; the header `.ds-sticky`; menus are popovers with `.ds-floating`; the confirmation is a
  `<dialog class="ds-modal">` opened with `showModal()`; there is no `z-index` number anywhere.
- The page passes the elevation audit in Light, Dark and forced colours: every menu and dialog is on top when open,
  keeps its edge, holds focus, and nothing focused hides under the header.

## Common ways it goes wrong (and what to say back)

| What you see | Reply |
|---|---|
| `box-shadow: 0 4px 12px rgba(0,0,0,.15)` on a menu | "ER-01: take the level — `.ds-floating` (or `box-shadow: var(--ds-elevation-floating-shadow)` with its surface and edge)." |
| A menu with a shadow and no border | "ER-04: floating keeps its edge — forced colours remove the shadow and in Dark it barely shows." |
| `z-index: 9999` on a dropdown | "ER-05: open it as a popover, or `var(--ds-layer-floating)`; 9999 paints over an open dialog." |
| `dialog.setAttribute('open', '')` or `dialog.show()` | "ER-06: `showModal()` — top layer, scrim, inert page, Escape." |
| `[data-theme="dark"] .card { box-shadow: … }` | "ER-07: remove it; Dark shows height by lighter surfaces, and the tokens switch by themselves." |
| `.card:hover { box-shadow: var(--ds-elevation-floating-shadow) }` and nothing else | "ER-08: change the fill too (`color.bg.surface-hover`); a shadow alone is invisible in forced colours." |
| `backdrop-filter: blur(12px)` on a menu | "ER-09: opaque surfaces only — text on glass can't be measured." |
| A menu inside a card with `overflow: hidden` that gets cut off | "Open it as a popover: the top layer is never clipped; no z-index gets out of overflow." |
