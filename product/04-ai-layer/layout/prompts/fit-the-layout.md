# Fit the layout to a product — prompt

Use this when a product needs different pane widths or tile sizes from the defaults: a docs site with a wider navigation,
an admin tool with wide filters, a dashboard with bigger cards. The AI sets up the config; the engine computes and checks
everything; the answer quotes only the engine's numbers.

**Attach:** `layout.md`.
**Check the result:** build the proposed config with `node src/cli.js <config.json> out/<name>` and compare the answer's
numbers with the build's rulebook (`out/<name>/ai/rules/layout.md`) and report.

```text
Our product: {what it is, who uses it, on which screens and devices}
What feels wrong with the default layout: {e.g. "navigation labels are long", "filters don't fit", "cards are too small"}

Use the attached ds layout rulebook (layout.md). Follow these steps.

1. Decide what to change. Only these are choices in the config:
   - "nav": the navigation pane's width (px, multiple of 8, 160–272);
   - "aside": the supporting pane's width (px, multiple of 8, 240–480);
   - "tile": the narrowest a tile gets (px, multiple of 8, 160–320);
   - "panes": panes added for this product.
   Breakpoints, columns, margins, the reading width and the page cap are fixed: if the product seems to need a
   change there, say so and explain why the request is better met another way.

2. Before giving the config, add it up at the narrowest width of every breakpoint where a pane is inline:
   window − inline panes − 2 × layout.margin ≥ layout.measure.reading, and the main region's own grid keeps
   columns ≥ 40px. Show the sums. If something doesn't fit, change the plan and say what you changed.

3. Give the engine config in exactly this shape and nothing else in the block:

   { "name": "<product>", "layout": { "nav": <px>, "aside": <px>, "tile": <px> } }

   (Leave out any key you don't change.)

4. After the build, report from its output only: the shell at each breakpoint (main region, main content, the
   grid inside main) and the tiles per row. Don't compute these yourself in the final answer — quote the build.
```

## What a good answer looks like

- It changes as little as possible and says why each change helps the product's people.
- Its sums match the build; when the build refuses a width (a 320px navigation leaves 0px of the page beside the drawer
  on a phone), it explains the refusal instead of working around it.
- It quotes the build's shell table rather than its own arithmetic.
