# Add a shape role — prompt

Use this when a design seems to need a radius the six roles don't have. Most of the time the answer is an existing role or
a nested radius; this prompt makes the AI check that first, and only then propose a role the engine can check.

**Attach:** `radius.md` (or `radius.contract.json`).
**Check the result:** paste the proposed JSON into the engine config under `radius.roles` and run `npm run build`.

```text
I need a radius for: {what the shape is and where it appears}
Radius in the design: {the value in the mock-up, if there is one}

Use the attached ds radius rulebook (radius.md) and follow these steps.

1. Look for an existing answer first, with the Decision guide:
   - is it a mark, a control, a container, a surface, a pill or square? Then that role, whatever the mock-up says;
   - does it fill a rounded parent? Then the nested radius (parent − padding), not a role;
   - does it touch another part? Then joined corners.
   If an existing answer fits, recommend it, explain why in two sentences, and stop. A mock-up value is not a reason
   for a new role. If the request breaks a rule (a name by look or size, a px value, a radius that changes with
   state), say which rule, give the closest allowed answer, and stop.

2. If nothing fits, propose ONE role:
   - Name: shape.<job> — what it is for (thumbnail, marker), never how it looks (rounded, soft, lg).
   - A key on the radius scale for each style: "sharp", "default", "round" (0, 1, 2, 3, 4, 6, 8 = 0–16px), never
     shrinking from sharp to round, never "full" (that is shape.pill).
   - Check it against the roles around it: how it sits next to the others in each style.

3. Give the engine config, exactly in this shape and nothing else in the block:

   { "radius": { "style": "<the product's style>", "roles": [
     { "name": "shape.<job>", "sharp": "<key>", "default": "<key>", "round": "<key>", "description": "<what it's for, one sentence>" }
   ] } }

4. Say what to check after the build: that it passes, and the role's row (and its -focus radius) in the rulebook.
```

## What a good answer looks like

- "12px for our cards" → shape.container: no new role.
- "A pill-shaped Upgrade button" → shape.control, and why (RR-04).
- "Rounded-lg for thumbnails" → refuses the name, proposes `shape.thumbnail` with keys per style.
- No px, no "full", nothing named by look.
