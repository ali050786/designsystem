# Add a spacing token — prompt

Use this when a design seems to need a space the system doesn't have. Most of the time the answer is an existing token;
this prompt makes the AI check that first, and only then propose a new token in a form the engine can compute and check.

**Attach:** `spacing.md` (or `spacing.contract.json`).
**Check the result:** paste the proposed JSON into the engine config under `spacing.tokens` and run `npm run build`.
The engine computes every density, refuses unsafe tokens and runs every spacing check — the AI's arithmetic is never trusted on its own.

```text
I need a spacing token for: {what the space is, in plain words — between what and what, or inside what}
It appears in: {components or screens}
What's wrong with the existing tokens: {why the closest token doesn't work, if you know}

Use the attached ds spacing rulebook (spacing.md) and follow these steps.

1. Look for an existing token first. Ask the Decision guide's two questions: which way does the space run
   (inset, stack or inline), and how closely do the two things belong together (the size). If an existing
   token does this job — even if it's a few pixels off the mock-up — recommend it, explain why in two
   sentences, and stop. Matching a mock-up pixel for pixel is not a reason for a new token.
   If the request is something the rules forbid (a value off the scale, a space that collapses to 0, a
   density made by hand, space for one component only), say which rule, give the closest allowed token or
   approach, and stop.

2. If nothing fits, propose ONE new token:
   - Name: space.<inset|stack|inline>.<size>, with a size from 2xs to 4xl that the family doesn't have yet.
     Never a component name (space.gutter.table) or a look word (space.stack.big).
   - "base": a key on the spacing scale (see "The scale" in the rulebook: "8" is 32px, "12" is 48px) — never px.
   - It must sit in the ladder: bigger than the size below it in the family and smaller than the size above,
     in every density, and the same distance as that size word in the other families.

3. Say what you expect the engine to compute (comfortable / default / compact, one step along the scale each
   way) — but mark these as expectations to be checked against the build.

4. Give the engine config, exactly in this shape and nothing else in the block:

   { "spacing": { "tokens": [
     { "name": "space.<family>.<size>", "base": "<key>", "description": "<what it's for, one sentence>" }
   ] } }

5. Say what to check after the build: that it passes (S3, S4 and S5 in particular), and the new token's row in
   the spacing rulebook.
```

## What a good answer looks like

- For "18px card padding to match the mock-up" it says 18px isn't on the scale (SR-01) and recommends `space.inset.lg`.
- For "a gutter between table columns" it says space for one component belongs with the component and recommends the cell padding (`space.inset.md`) or `space.inline.lg`.
- When a token really is new, the name is a family and a size, the base is a key on the scale, the JSON builds and passes, and the expected values match the build.
- No px anywhere.
