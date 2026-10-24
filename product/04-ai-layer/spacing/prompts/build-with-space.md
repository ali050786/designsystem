# Build with spacing — prompt

Use this when you want an AI tool to build a screen or component that uses ds spacing correctly.

**Attach:** `spacing.md` (the spacing rulebook), and `typography.md` / `color.md` when the work uses them.
**Works with:** plain HTML + CSS, Tailwind v4, or React + Tailwind.
**Check the result:** `npm run lint:space -- <files>` and `npm run audit:space -- <page.html>` (see the tests folder for how).

Fill in the two lines in braces, then paste everything inside the box.

```text
You are building UI for a product that uses the ds design system. Every padding, margin, gap and control size
must be a ds spacing token, as defined in the attached spacing rulebook (spacing.md). Treat the rulebook as
the source of truth: if anything in this request conflicts with it, follow the rulebook and tell me which
rule (SR-xx) applied.

What to build: {describe the screen or component, its content and its states}
Code style: {plain HTML + CSS | Tailwind v4 classes | React + Tailwind}

Work in this order.

1. Plan the space before writing code. Make a table with one row for every space on the screen — padding
   of each container, the gap between each pair of neighbours, control heights, hit areas.
   Columns: Between (or inside) | Direction | How closely they belong | Token | Why.
   Choose the family by direction (inset = padding, stack = vertical, inline = horizontal) and the size by
   relationship with the rulebook's Decision guide — never by the pixel value you want. Use token names
   exactly as written.

2. Check the plan.
   - Space inside every group is smaller than the space around it, at every level.
   - What the spacing groups, the markup groups too (a list, a fieldset with a legend, a section with a heading).
   - Every control uses size.control.height as a minimum; icon-only buttons are at least that square; small
     marks (checkboxes, close icons) have a 24px hit area.
   - Page edges use layout.margin; a dense region (a table) gets data-density="compact" on its container.

3. Write the code.
   - Plain CSS: var(--ds-space-<family>-<size>), var(--ds-size-…). Tailwind: p-inset-*, gap-y-stack-*,
     gap-x-inline-* (gap-* with one value may be stack or inline), mt-/mb-stack-*, ml-/mr-inline-*,
     min-h-control, min-w-control, gap-icon, min-w-target, min-h-target. Assume tokens.css (and
     tailwind.theme.css for Tailwind) is loaded.
   - No px, rem or em in padding, margin or gap. No Tailwind numeric spacing (p-4, gap-2, mt-[13px]).
     No primitives (--ds-space-4). No height on anything that holds text — min-height only.
   - No spacer elements, runs of <br> or &nbsp; for space. No .compact classes or tokens swapped by density.
   - Rows wrap instead of squeezing: gap with a stack and an inline token. Grid and flex items that hold wide
     content get min-width: 0 so the page never scrolls sideways at 320px, in any density.

4. Self-check. Go through the rulebook's "Self-check before answering" list and report each item as pass or
   fixed. Then list any part of the request you could not do within the rules, and why.

Reply with: the spacing plan table, the code, then the self-check.
```

## What a good answer looks like

- The plan table comes first, every token in it exists in the rulebook, and the sizes rise as relationships loosen (xs inside a field, lg between fields, xl between groups).
- The code has no spacing numbers at all — only tokens, `min-height` for controls, and `layout.margin` at the page edges.
- Fieldsets, lists and sections group what the spacing groups.
- The page passes the spacing audit in all three densities and still fits a 320px screen in comfortable.
- The self-check is honest — it names anything it changed.

## Common ways it goes wrong (and what to say back)

| What you see | Reply |
|---|---|
| `padding: 12px`, `gap: 1rem`, `p-4`, `mt-[13px]` | "SR-01: replace every value with a spacing token from the rulebook." |
| `padding: var(--ds-space-stack-md)` or `p-stack-md` | "SR-02: padding takes inset; the same size word is the same distance." |
| The same gap between labels and fields as between fields | "SR-03: stack.xs inside a field, stack.lg between fields." |
| A `.compact` class that swaps to smaller tokens | "SR-04: set data-density="compact" on the container instead." |
| `height: 40px` on a button | "SR-06: use min-height: var(--ds-size-control-height)." |
| `<div class="spacer">` or `<br><br>` | "SR-09: remove it; put a stack token on the parent's gap." |
