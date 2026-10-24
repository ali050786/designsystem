# Add a colour role — prompt

Use this when a design needs a colour the system doesn't seem to have. Most of the time the answer is an existing
role; this prompt makes the AI check that first, and only then propose a new role in a form the engine can test.

**Attach:** `color.md` (or `color.contract.json`).
**Check the result:** paste the proposed JSON into the engine config under `color.roles` and run `npm run build`.
The build measures every pair the new role takes part in and stops if one fails — the AI's arithmetic is never trusted on its own.

```text
I need a colour for: {what it's for, in plain words}
It appears in: {components or screens}
It sits on / carries: {which backgrounds it sits on, or which text and icons sit on it}

Use the attached ds colour rulebook (color.md) and follow these steps.

1. Look for an existing role first. Use the Decision guide and the Roles tables. If an existing role does
   this job — even with a slightly different look — recommend it, explain why in two sentences, and stop.
   Inventing a role for a one-off look is the wrong answer.

2. If nothing fits, propose ONE new role (or a background and its outline, if both are truly needed):
   - Name it by its job: color.<group>.<job>, where group is bg, fg, border or data. Lower-case, hyphens.
     Never a colour word (no "yellow", "blue-light").
   - Pick shades as hue.grade from the scales (brand, neutral, success, warning, danger, info; grades 5–95
     in steps of 5), or white / black. Never hex — the engine solves the colour.
   - Use the grade gap rule (white = grade 0, black = grade 100). Text needs a gap of 50 or more from every
     background it sits on; icons, outlines and chart marks need 40 or more. Work it out for Light AND Dark,
     using the grades the rulebook lists for the existing roles involved (e.g. in Light fg.default is neutral 90,
     bg.surface is white; in Dark fg.default is neutral 5, bg.surface is neutral 90).
   - A background lists the foreground roles that will sit on it ("carries"). A foreground, outline or data
     colour lists the backgrounds it sits on ("on"). Include every pairing the design needs — hover and
     selected backgrounds too.

3. Show your arithmetic as a small table: Pair | Light grades → gap | Dark grades → gap | Needs.

4. Give the engine config, exactly in this shape and nothing else in the block:

   { "color": { "roles": [
     { "name": "color.bg.<job>", "light": "<hue>.<grade>", "dark": "<hue>.<grade>",
       "description": "<what it's for, one sentence>", "carries": ["color.fg.default", "…"] }
   ] } }

   (For a foreground, outline or data colour use "on": ["color.bg.surface", "…"] instead of "carries".)

5. Say what to check after the build: that it passes, and which pairs to look at in the report.
```

## What a good answer looks like

- For "a tinted background for a callout about a new feature", it recommends `bg.info-subtle` (or `bg.brand-subtle`) and stops.
- When a role really is new, the name describes a job (`bg.highlight`, `border.highlight`), the grades come with a gap table, and the JSON builds and passes.
- No hex anywhere.
