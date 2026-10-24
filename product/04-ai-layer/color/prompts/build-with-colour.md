# Build with colour — prompt

Use this when you want an AI tool to build a screen or component that uses ds colour correctly.

**Attach:** `color.md` (the colour rulebook). If your tool reads JSON well, attach `color.contract.json` as well.
**Works with:** plain HTML + CSS variables, Tailwind v4, or React + Tailwind.
**Check the result:** `npm run lint:color -- <files>` and `npm run audit:page -- <page.html>` (see the tests folder for how).

Fill in the two lines in braces, then paste everything inside the box.

```text
You are building UI for a product that uses the ds design system. All colour must come from ds colour roles,
as defined in the attached colour rulebook (color.md). Treat the rulebook as the source of truth: if anything
in this request conflicts with it, follow the rulebook and tell me which rule (CR-xx) applied.

What to build: {describe the screen or component, its content and its states}
Code style: {plain HTML + CSS variables | Tailwind v4 classes | React + Tailwind}

Work in this order.

1. Plan the colours before writing code. Make a table with one row for every part that gets a colour —
   page and container backgrounds, text, icons, outlines, buttons, hover/pressed/selected/disabled states,
   status messages, and any data or chart marks. Columns: Part | Sits on | Role | Why.
   Choose each role with the rulebook's Decision guide. Use role names exactly as written there.

2. Check every pair. For each text, icon and outline, find the background it actually sits on — including
   the hover, pressed and selected backgrounds it will sit on later — and confirm the pair is listed in the
   Pair contract. If it is not listed, change the role. Never invent a role or a pair.
   Pay special attention to:
   - solid fills (bg.brand, bg.success …, action.primary.bg …): text on them uses the matching on- colour;
   - hover: translucent state tints only on canvas, surface or surface-sunken; inside menus, popovers,
     dialogs and raised cards use bg.item-hover / bg.item-pressed;
   - inputs, checkboxes and other controls: their outline is border.input (or border.strong for buttons).

3. Write the code.
   - CSS: use var(--ds-color-…) role variables only. Tailwind: use the role classes (bg-bg-surface,
     text-fg-muted, border-border-input …). Assume tokens.css (and tailwind.theme.css for Tailwind) is loaded.
   - No hex, rgb(), hsl(), named colours, Tailwind palette classes (bg-white, text-gray-900, bg-blue-600),
     arbitrary values (bg-[#…]) or shade variables (--ds-color-brand-60, --ds-color-neutral-90).
   - Do not write focus styles and never remove outlines: tokens.css draws the 2px focus ring on :focus-visible.
   - Say every status in words or with an icon as well as colour. Underline links. Give every change
     (up/down, more/less) an arrow or sign; colour it fg.positive or fg.negative by whether it is good or
     bad news, not by its direction.
   - One primary action per view. Light and Dark come from data-theme on <html>; don't write separate dark styles.

4. Self-check. Go through the rulebook's "Self-check before answering" list and report each item as
   pass or fixed. Then list any part of the request you could not do within the rules, and why.

Reply with: the colour plan table, the code, then the self-check.
```

## What a good answer looks like

- The plan table comes first and every role in it exists in the rulebook.
- The code has no colour values at all — only role variables or role classes.
- Hover inside a menu uses `bg.item-hover`; hover on a card row uses a state tint or `bg.surface-hover`.
- A badge on a solid fill uses its `fg.on-…` partner; an input uses `border.input`.
- Changes read like "▲ +2.4%" or "▼ −0.9%", with colour chosen by good/bad.
- The self-check is honest — it names anything it changed.

## Common ways it goes wrong (and what to say back)

| What you see | Reply |
|---|---|
| `#2A57D1`, `bg-blue-600` or `--ds-color-brand-60` in the code | "CR-01: replace every colour value with a role from the rulebook." |
| Muted or brand text on a solid brand/status fill | "CR-03: use the fill's on- colour." |
| A hover tint inside a menu or dialog | "CR-06: inside overlays use bg.item-hover / bg.item-pressed." |
| `outline: none` or `outline-none` | "CR-09: keep the focus ring; remove that line." |
| Green "+2.4%" with no arrow | "CR-04: add ▲/▼ or +/−." |
