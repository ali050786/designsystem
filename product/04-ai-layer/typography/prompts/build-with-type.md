# Build with type — prompt

Use this when you want an AI tool to build a screen or component that uses ds typography correctly.

**Attach:** `typography.md` (the typography rulebook), and `color.md` if the work uses colour.
**Works with:** plain HTML + CSS, Tailwind v4, or React + Tailwind.
**Check the result:** `npm run lint:type -- <files>` and `npm run audit:type -- <page.html>` (see the tests folder for how).

Fill in the two lines in braces, then paste everything inside the box.

```text
You are building UI for a product that uses the ds design system. All text must use ds text styles, as defined
in the attached typography rulebook (typography.md). Treat the rulebook as the source of truth: if anything in
this request conflicts with it, follow the rulebook and tell me which rule (TR-xx) applied.

What to build: {describe the screen or component, its content and its states}
Code style: {plain HTML + CSS | Tailwind v4 classes | React + Tailwind}

Work in this order.

1. Plan the type before writing code. Make a table with one row for every kind of text — titles, headings,
   paragraphs, labels, help and error text, numbers, code, badges. Columns: Text | What it is | Style | Tag | Why.
   Choose each style with the rulebook's Decision guide, by what the text is, never by the size you want.
   Use style names exactly as written. Choose heading tags (h1–h6) from the page outline, with no skipped
   levels; a component title can be a heading tag with a title style, or no heading at all.

2. Check the plan.
   - At most one display style in the view; an app page title is type.heading.lg.
   - Paragraphs, help text and instructions use reading styles (body, caption, code); caption only for a line
     or two. Nothing under 12px.
   - Numbers people compare (table columns, totals, metrics, timers, live values) use tabular numerals.
   - Running text stays within layout.measure.reading.

3. Write the code.
   - Plain CSS: use the style classes (.ds-type-<role>-<size>). If a rule must hold the values, use all five
     variables of one style together. Tailwind: use text-<role>-<size>, plus font-mono for code styles and
     tabular-nums for number styles. Assume tokens.css (and tailwind.theme.css for Tailwind) is loaded; it
     already styles body, h1–h6, code, strong, form controls and table numbers.
   - No font-size, line-height, letter-spacing or font-family values anywhere. No Tailwind text-sm / text-lg …,
     leading-*, tracking-*, font-light or arbitrary sizes (text-[13px]).
   - No fixed heights on anything that holds text; let titles and labels wrap. If something must be truncated,
     keep the full text available (title plus an expand control or a details view).
   - Right-align numeric columns; use a real minus sign (−); keep emphasis to <strong> and <em>.
   - Never block zoom in the viewport meta tag. Never justify text or put sentences in capitals.

4. Self-check. Go through the rulebook's "Self-check before answering" list and report each item as pass or
   fixed. Then list any part of the request you could not do within the rules, and why.

Reply with: the type plan table, the code, then the self-check.
```

## What a good answer looks like

- The plan table comes first and every style in it exists in the rulebook; heading tags go h1 → h2 → h3.
- The code has no type values at all — only style classes, `text-<style>` utilities, or all five variables of one style.
- Paragraphs are `body.*`, help under fields `caption.md`, field labels and buttons `label.*`, table numbers tabular and right-aligned.
- Card titles wrap; nothing has a fixed height; the page still fits at 320px wide.
- The self-check is honest — it names anything it changed.

## Common ways it goes wrong (and what to say back)

| What you see | Reply |
|---|---|
| `font-size: 15px`, `text-sm`, `text-[13px]` | "TR-01: replace every size with a text style from the rulebook." |
| `line-height: 1.3` or `leading-tight` on a paragraph | "TR-03: reading text needs a reading style; remove the line height." |
| An h4 under an h2 "because it looks right" | "TR-05: use h3 and give it the style you want." |
| `height: 40px; overflow: hidden` on a title | "TR-07: let the box grow with its text." |
| A column of amounts without tabular numerals | "TR-04: use type.numeric.* or tabular-nums." |
| `font-family: …` in a component | "TR-13: remove it; fonts come from the family tokens." |
