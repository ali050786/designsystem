# Set the density — prompt

Use this when a product adopts ds and needs to decide how dense it is: an admin tool that should start compact, a field app
that needs bigger targets, or a team that wants compact to be tighter. The engine does the work; the AI's job is to set it up,
run it (if it can), and tell people what to review. It must not hand-edit tokens or guess values.

**Attach:** `spacing.md`. Give the AI access to the engine folder if your tool can run commands.

```text
Set up ds density for a product.

Product name: {name}
What the product is and who uses it: {e.g. "an admin console for support agents on desktops",
  "a tablet app for warehouse staff wearing gloves"}
Change wanted: {e.g. "start in compact", "bigger targets", "make compact tighter", or "none"}

Rules for this task:
- Never edit tokens.css, the Figma variables or any value by hand. Choices go into the engine config; the
  engine computes every density and runs the checks.
- Never state a value or check result you did not get from the engine's output. If you can't run the engine,
  say so and leave those numbers for the person who runs it.

Steps:
1. Decide, with the rulebook's "How dense the screen is" guide:
   - density.default — the density the product starts in (comfortable, default or compact);
   - whether some regions should use another density (data-density on their container) instead of changing
     the whole product;
   - spacing.densityStep only if asked for a bigger difference between densities (1 or 2). Expect 2 to fail
     the build with the default ladder, and explain why from the output.
2. Write the config file (only what changes), e.g.
   { "name": "{name}", "density": { "default": "compact" } }
3. Build it: node src/cli.js <config.json> out/<name>
   If you can run commands, run it and read the output. The build must end in PASS — or, if it fails, name
   the failing check (S5 = a space collapsed below 2px; S6 = a control no longer fits its label; S1 = a
   target under 24px) and give the smallest change that would fix it.
4. From the build output and out/<name>/ai/rules/spacing.md, tell me:
   - the control height and the md spacing in each density, copied from the rulebook;
   - which density :root now uses, and how a person or a region switches;
   - which label style controls use in that density (Typography).
5. List what the team must check that the engine can't:
   - their screens in the new density with npm run audit:space (targets, sideways scrolling at 320px in
     comfortable, labels at 200% text in compact);
   - components that hard-code heights or paddings (npm run lint:space finds them);
   - whether people should be able to choose density, and where that choice is stored.
   Remind them what does NOT change: token names, the scale, the 24px target floor, every rule.

Reply with: the decision and why, the config, the build result (or "not run"), the values from step 4, and the review list.
```

## What a good answer looks like

- The density is chosen for the people and the screens, and regions get their own density where that is enough.
- The config has only the lines that change.
- Every number comes from the build output, quoted, not estimated.
- A failing build is explained with its check and fixed with the smallest change — for example, "make compact tighter"
  with `densityStep: 2` fails S5 and S6, and the answer recommends keeping step 1 and using compact regions instead.
