# Build with layout — prompt

Use this when you want an AI tool to build a screen that uses ds layout correctly.

**Attach:** `layout.md` (the layout rulebook), and `spacing.md`, `typography.md`, `color.md` when the work uses them.
**Works with:** plain HTML + CSS, Tailwind v4, or React + Tailwind.
**Check the result:** `npm run lint:layout -- <files>` and `npm run audit:layout -- <page.html>` (see the tests folder for how).

Fill in the two lines in braces, then paste everything inside the box.

```text
You are building UI for a product that uses the ds design system. Every width, grid, region and breakpoint must
come from the attached ds layout rulebook (layout.md). Treat the rulebook as the source of truth: if anything in
this request conflicts with it, follow the rulebook and tell me which rule (LR-xx) applied.

What to build: {describe the screen: what people do on it, its content, and what helps them do it}
Code style: {plain HTML + CSS | Tailwind v4 classes | React + Tailwind}

Work in this order.

1. Decide the frame before writing code. Make a table with one row for every part of the screen.
   Columns: Part | Job | Region (header, nav, main, aside, overlay) | Width (token or class) | On a phone.
   Choose the region by the part's job and the width by what the content is, with the rulebook's Decision guide —
   never by a pixel value you want. Running text and forms get layout.measure.reading; data gets the region's
   width; cards that wrap get the tile grid; parts that must line up get the page grid with .ds-span-* classes.

2. Check the plan.
   - The main region holds the task. Navigation between sections is the nav pane; supporting content is the
     aside; short tasks on top of the page are overlays, not panes.
   - Regions go in this code order: header, start panes, main, end panes. Nothing is reordered visually.
   - Every layout change happens at a system breakpoint (md, lg, xl), min-width, in em — or not at all,
     because the shell, the tiles and the region grids already adapt.
   - Nothing is wider than a 320px screen: wide tables scroll inside a focusable, named container.

3. Write the code.
   - Use the classes from tokens.css: .ds-shell with data-shell="header|nav|main|aside", .ds-page, .ds-grid with
     .ds-span-*, .ds-measure, .ds-tiles, .ds-region. Tailwind: md:, lg:, xl:, max-w-reading, px-margin,
     gap-x-gutter, min-h-header. Assume tokens.css (and tailwind.theme.css for Tailwind) is loaded.
   - No width or min-width above 320px, no px max-width on text, no 100vw, no hidden overflow on html or body.
   - No media queries other than 37.5em, 64em and 90em with min-width; none to change a grid inside a region.
   - Grid tracks are minmax(0, 1fr) or come from the classes; flex children that hold text get min-width: 0.
   - The header is one row of controls with min-height layout.header.height; don't touch scroll-padding-top.
   - The drawer toggle has aria-expanded and aria-controls; Escape closes the drawer and returns focus.
   - Spacing, type and colour follow their own rulebooks.

4. Self-check. Go through the rulebook's "Self-check before answering" list and report each item as pass or
   fixed. Then list any part of the request you could not do within the rules, and why.

Reply with: the frame table, the code, then the self-check.
```

## What a good answer looks like

- The frame table comes first, every part has a job and a region, and every width is a token or a class.
- The code has no px widths, no breakpoints of its own, and no spans set by window media queries.
- The regions are in code order and the page passes the layout audit at every width and density: nothing scrolls sideways,
  no focus hidden under the header, the drawer opens and closes with the keyboard.
- The self-check is honest — it names anything it changed.

## Common ways it goes wrong (and what to say back)

| What you see | Reply |
|---|---|
| `max-width: 1200px; padding: 0 24px` on the page | "LR-01, LR-02: use .ds-page — it caps at layout.container.max and pads with layout.margin." |
| `p { max-width: 640px }` or `max-w-prose` | "LR-03: running text takes layout.measure.reading (.ds-measure, max-w-reading)." |
| `@media (max-width: 768px)` or `sm:` | "LR-06: mobile first, min-width at 37.5em, 64em or 90em (md:, lg:, xl:)." |
| `grid-template-columns: repeat(3, 1fr)` | "LR-05: minmax(0, 1fr) — or .ds-grid with .ds-span-third." |
| A sidebar built with a 280px grid track and hidden with `display: none` on phones | "LR-09: use the shell's nav or aside — it goes inline at its breakpoint and becomes a drawer or moves below." |
| `order: -1` to put filters first | "LR-07: change the code order instead." |
