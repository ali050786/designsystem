# Fit the radius to a product — prompt

Use this to choose the radius style for a product (and any product roles). The AI sets up the config; the engine computes
and checks everything; the answer quotes only the engine's numbers.

**Attach:** `radius.md`.
**Check the result:** build the proposed config with `node src/cli.js <config.json> out/<name>` and compare the answer's
numbers with `out/<name>/ai/rules/radius.md` and the report.

```text
Our product: {what it is, who uses it, its brand feel}
What feels wrong with the default corners: {e.g. "too soft for a trading tool", "too stiff for a kids' app"}

Use the attached ds radius rulebook (radius.md). Follow these steps.

1. Decide what to change. Only these are choices in the config:
   - "style": sharp, default or round;
   - "roles": roles added for this product (a name by job and a key per style).
   The scale, the six roles' values per style and the limits are fixed: if the product seems to need a change
   there, say so and explain why the request is better met another way. Density is a separate choice
   (density.default, Spacing) — say if it should change with the style.

2. Give the engine config and nothing else in one block:  { "radius": { "style": "…" } }  (plus "roles" if needed).

3. List what the product's roles will be, but mark every number "to be checked against the build" — the engine's
   rulebook is the only source of values.
```

## What a good answer looks like

- A trading or admin tool → `sharp` (often with compact density); a consumer or children's product → `round`.
- It doesn't invent a fourth style or new values for the roles; it explains why.
- Every number it quotes matches the build.
