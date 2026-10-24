# Theme a new brand — prompt

Use this when a product adopts ds with its own brand colour. The engine does the work; the AI's job is to set it up,
run it (if it can), and tell people what to review. It must not hand-edit tokens or guess contrast numbers.

**Attach:** `color.md`. Give the AI access to the engine folder if your tool can run commands.

```text
Set up the ds colour system for a new brand.

Brand colour: {hex, e.g. #7B2CBF}
Product name: {name}    CSS prefix: {short prefix, or "keep ds"}

Rules for this task:
- Never edit tokens.css, the Figma variables or any shade by hand. The brand goes into the engine config;
  the engine solves every shade and measures every pair.
- Never state a contrast ratio, grade or hex value you did not get from the engine's output. If you can't
  run the engine, say so and leave those numbers for the person who runs it.

Steps:
1. Write the config file (only what changes):
   { "name": "{name}", "prefix": "{prefix}", "color": { "brand": "{hex}" } }
2. Build it: node src/cli.js <config.json> out/<name>
   If you can run commands, run it and read the output. The build must end in PASS.
3. From the build's report (report.json → notes, and the colour checks), tell me:
   - the brand's grade, the grade used for the solid brand fill, and whether labels on it are white or black;
   - whether the solid fill is a different shade from the brand hex, and why (the fill must carry
     readable text — it is moved to the nearest grade that does);
   - the contrast of the label on the fill in its default, hover and pressed states;
   - any check that is not "pass".
4. List what the team should review, and nothing else:
   - primary buttons, links, selection and the focus ring (they follow the brand);
   - the logo and brand illustrations next to the new fills, in Light and Dark;
   - screens that used brand colour to mean success (not allowed — CR-14).
   Remind them what does NOT change: status colours, positive/negative, the chart palette, every rule.
5. Hand-off: import out/<name>/figma variables into Figma, ship out/<name>/tokens.css (and
   tailwind.theme.css), and regenerate the AI rulebook from the same build.

Reply with: the config, the build result (or "not run"), the findings from step 3, and the review list.
```

## What a good answer looks like

- The config has only the lines that change.
- Every number comes from the build output, quoted, not estimated.
- It explains a very light or very dark brand: for example, a bright yellow brand gets a solid fill with black labels,
  and a very dark navy brand keeps white labels but its hover goes lighter, not darker.
