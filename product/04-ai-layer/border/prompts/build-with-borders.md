# Build with borders — prompt

Use this when you want an AI tool to build a screen whose lines follow ds borders.

**Attach:** `border.md` (the border rulebook), and `color.md`, `spacing.md`, `layout.md`, `radius.md`, `typography.md` when the work uses them.
**Works with:** plain HTML + CSS, Tailwind v4, or React + Tailwind.
**Check the result:** `npm run lint:border -- <files>` and `npm run audit:border -- <page.html>` (see the tests folder for how).

```text
You are building UI for a product that uses the ds design system. Every line must come from the attached ds border
rulebook (border.md). Treat the rulebook as the source of truth: if anything in this request conflicts with it,
follow the rulebook and tell me which rule (BR-xx) applied.

What to build: {describe the screen: what people do on it and what is on it}
Code style: {plain HTML + CSS | Tailwind v4 classes | React + Tailwind}

Work in this order.

1. List the boundaries before writing code. One row for every place where one thing ends and another begins.
   Columns: Boundary | Does it need a line? | Job | Colour role | States.
   Use the rulebook's Decision guide: space groups things, a surface change sets a region apart; a line only when
   neither is enough, or when someone needs it to find a control. Jobs: line (dividers, outlines), control (a
   control's edge), state (selected, invalid, warning, passed), indicator (the current tab or page, one side).

2. Work out the states from the table.
   - Every state widens to its job and has a second cue: a check mark, an icon and a message, bold text.
   - The padding gives up the extra width: calc(var(--ds-space-inset-<size>) - (var(--ds-border-width-state)
     - var(--ds-border-width-control))), or minus the indicator width for a bar.
   - The current-item bar is drawn only on the current item (a border there, or a ::after for tabs) — never a
     transparent bar on every item.
   - Selection is in the markup: aria-selected, aria-current, aria-pressed, aria-checked, aria-invalid, or a label
     around a checked radio.
   - Parts that touch (a button group, an input with its button) use .ds-join.

3. Write the code.
   - Widths are always var(--ds-border-width-line | -control | -state | -indicator) (Tailwind border-line,
     border-control, border-state, border-b-indicator …). Never px, rem, em, 0.5px, --ds-border-width-<n>,
     Tailwind's border / border-2 or ring-*.
   - Every control has a border: transparent if the design shows none (a primary button).
   - Colours come from the job's list; decorative greys (color.border.subtle, default) only for line.
   - Focus rings: leave them to tokens.css. Never outline: none; never a box-shadow ring alone. A full-width row
     may draw its ring inside with a negative outline-offset.
   - No lines drawn with box-shadow; hover and press change the fill, not the width.
   - Assume tokens.css (and tailwind.theme.css for Tailwind) is loaded. Colour, spacing, layout, radius and type
     follow their own rulebooks.

4. Self-check. Go through the rulebook's "Self-check before answering" list and report each item as pass or fixed.
   Then list any part of the request you could not do within the rules, and why.

Reply with: the boundary table, the code, then the self-check.
```

## What a good answer looks like

- The boundary table comes first, and some boundaries have **no** line (sections separated by space, a sidebar by its
  surface).
- Field edges are control in `color.border.input`; card outlines are line in a decorative grey; nothing is 1px by hand.
- The error state is 2px with an icon and a message, and its padding is compensated; the selected plan has a check mark.
- The page passes the border audit: no doubled seams, nothing moves when a state changes, and in forced colours every
  control keeps its edge, every state still shows and every focus ring is there.

## Common ways it goes wrong (and what to say back)

| What you see | Reply |
|---|---|
| `border: 1px solid #ddd` | "BR-01 / BR-07: pick the job and its colour — a card is var(--ds-border-width-line) with color.border.default; a field is control with color.border.input." |
| `border-color: red` on the invalid field and nothing else | "BR-08: widen to border.width.state, add an icon and a message, and take the extra pixel off the padding (BR-09)." |
| `outline: none; box-shadow: 0 0 0 3px …` on focus | "BR-05: remove both — tokens.css draws the ring; box-shadow rings vanish in forced colours." |
| `border: none` on the primary button | "BR-06: border: var(--ds-border-width-control) solid transparent, or it has no edge in forced colours." |
| Tabs with `border-bottom: 3px solid transparent` on every tab | "BR-08: draw the bar only on the selected tab (a ::after); transparent bars all show in forced colours." |
| Two bordered buttons side by side | "BR-10: put them in .ds-join — two 1px borders make a 2px seam." |
| `border-width: 0.5px` for a "subtle" divider | "BR-03: no hairlines; use line with color.border.subtle." |
