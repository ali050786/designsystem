# Build with radius — prompt

Use this when you want an AI tool to build a screen whose corners follow ds radius.

**Attach:** `radius.md` (the radius rulebook), and `spacing.md`, `layout.md`, `typography.md`, `color.md` when the work uses them.
**Works with:** plain HTML + CSS, Tailwind v4, or React + Tailwind.
**Check the result:** `npm run lint:radius -- <files>` and `npm run audit:radius -- <page.html>` (see the tests folder for how).

```text
You are building UI for a product that uses the ds design system. Every corner must come from the attached ds
radius rulebook (radius.md). Treat the rulebook as the source of truth: if anything in this request conflicts with
it, follow the rulebook and tell me which rule (RR-xx) applied.

What to build: {describe the screen: what people do on it and what is on it}
Code style: {plain HTML + CSS | Tailwind v4 classes | React + Tailwind}

Work in this order.

1. Give every shape a role before writing code. Make a table with one row for every shape on the screen.
   Columns: Shape | What it is | Role | Inside or against | Corners.
   Choose the role by what the thing is, with the rulebook's Decision guide — never by how round you want it:
   marks (checkboxes, swatches, kbd) → shape.mark; things people press or type in → shape.control; content
   holders and menus → shape.container; dialogs, sheets, drawers → shape.surface; labels that never wrap →
   shape.pill; tables, full-bleed media → shape.none.
   In "Inside or against", note when a shape fills a rounded parent (and the padding), is flush with its edge,
   or touches another part.

2. Work out the corners from the table.
   - A shape that fills a rounded parent with padding smaller than the parent's radius:
     max(0px, var(--ds-shape-<parent>) - var(--ds-space-inset-<size>)). A flush child: the parent's radius on the
     corners it shares (logical corners). Anything else keeps its own role.
   - Parts that touch (a button group, an input with its button): .ds-join, or logical corners.
   - No overflow: hidden to round a container that holds anything focusable.
   - No pill on a button or anything whose label can wrap; no control radius on a checkbox.

3. Write the code.
   - border-radius is always var(--ds-shape-<role>) or a nested expression on the roles (Tailwind rounded-<role>
     or rounded-[max(0px,var(--radius-<parent>)-var(--spacing-inset-<size>))]). Never px, rem, %, Tailwind's own
     rounded-sm … rounded-full, or --ds-radius-*.
   - Corners by side are logical (border-start-start-radius …, rounded-s-, rounded-ss-), never top-left or l-.
   - Focus rings: leave them to tokens.css (an outline that follows the radius). If you draw one on a pseudo-
     element, its radius is var(--ds-shape-<role>-focus).
   - No radius changes in hover, focus, active, checked or selected states.
   - Assume tokens.css (and tailwind.theme.css for Tailwind) is loaded. Spacing, layout, type and colour follow
     their own rulebooks.

4. Self-check. Go through the rulebook's "Self-check before answering" list and report each item as pass or fixed.
   Then list any part of the request you could not do within the rules, and why.

Reply with: the shape table, the code, then the self-check.
```

## What a good answer looks like

- The shape table comes first and every role is chosen by job: the checkbox is a mark, the "Upgrade" button is a control
  even if the mock-up shows a pill.
- Children that fill a rounded parent use the nested expression; a flush header shares the card's top corners; nothing is
  rounded by clipping.
- Joined parts use `.ds-join`; nothing names a physical corner.
- The page passes the radius audit in all three styles: nothing pokes out, no text off its fill at 200% text, every focus
  ring visible on all four sides, the button group correct right to left.

## Common ways it goes wrong (and what to say back)

| What you see | Reply |
|---|---|
| `border-radius: 12px` or `rounded-xl` | "RR-01 / RR-03: pick the role by job — a card is var(--ds-shape-container) (rounded-container)." |
| `rounded-full` on an "Upgrade" button | "RR-04: buttons can wrap; use shape.control. The pill is for labels that never wrap." |
| A panel inside a padded card with the card's own radius | "RR-05: max(0px, var(--ds-shape-container) - var(--ds-space-inset-<size>))." |
| `overflow: hidden` on the card to round its image | "RR-08: give the image the card's radius on its top corners; clipping cuts focus rings." |
| `border-top-left-radius: 0` in a button group | "RR-06: use .ds-join (logical corners); top-left doesn't flip right to left." |
| `:hover { border-radius: … }` | "RR-09: corners don't change with state." |
