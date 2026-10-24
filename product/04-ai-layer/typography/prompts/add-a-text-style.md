# Add a text style — prompt

Use this when a design seems to need a size or style the system doesn't have. Most of the time the answer is an existing
style; this prompt makes the AI check that first, and only then propose a new style in a form the engine can compute and check.

**Attach:** `typography.md` (or `typography.contract.json`).
**Check the result:** paste the proposed JSON into the engine config under `typography.styles` and run `npm run build`.
The engine computes the sizes, refuses unsafe styles and runs every typography check — the AI's arithmetic is never trusted on its own.

```text
I need a text style for: {what the text is, in plain words}
It appears in: {components or screens}
What's wrong with the existing styles: {why the closest style doesn't work, if you know}

Use the attached ds typography rulebook (typography.md) and follow these steps.

1. Look for an existing style first. Use the Decision guide and the Styles tables. If an existing style does
   this job — even if it's a step bigger or smaller than the design shows — recommend it, explain why in two
   sentences, and stop. Matching a mock-up pixel for pixel is not a reason for a new style.
   If the request is for something the rules forbid (text under 12px, a line height below the reading
   minimum, capitals for sentences), say which rule, give the closest allowed style, and stop.

2. If nothing fits, propose ONE new style:
   - Name it by its job: type.<job>.<sm|md|lg>, lower-case, hyphens. Never a look word (big, small, bold, tiny)
     or a number.
   - Pick a "step" on the scale (whole number, -2 to 9; 0 is the base size) — never px. The Styles tables show
     which step each existing style uses at the sm column; aim between or beyond them.
   - Pick a "kind" — display, heading, title, label or reading — by what the text is; it sets the line height.
   - Pick a "weight": regular, medium, semibold or bold.
   - Optional: "tabular": true for compared numbers; "case": "upper" only for short labels and titles;
     "scales": true only for display and heading kinds (the style then grows on wider screens).

3. Say what you expect the engine to compute (size and line height at sm and lg) and which existing styles it
   sits between — but mark these as expectations to be checked against the build.

4. Give the engine config, exactly in this shape and nothing else in the block:

   { "typography": { "styles": [
     { "name": "type.<job>.<size>", "step": <n>, "kind": "<kind>", "weight": "<weight>",
       "description": "<what it's for, one sentence>" }
   ] } }

5. Say what to check after the build: that it passes, and the new style's row in the typography rulebook.
```

## What a good answer looks like

- For "a smaller caption for chart axis labels, about 10px" it says 12px is the floor (TR-03) and recommends `type.caption.md`.
- For "a bigger number on the metric cards" it recommends the existing `type.numeric.lg`.
- When a style really is new, the name describes a job (`type.overline.sm`), it is on a step, the JSON builds and passes, and the expected sizes match the build.
- No px anywhere.
