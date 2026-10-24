# Theme the type — prompt

Use this when a product adopts ds with its own font, or wants a different scale. The engine does the work; the AI's job
is to set it up, run it (if it can), and tell people what to review. It must not hand-edit tokens or guess sizes.

**Attach:** `typography.md`. Give the AI access to the engine folder if your tool can run commands.

```text
Set up ds typography for a product.

Font for interface and reading text: {family name, e.g. "IBM Plex Sans", or "keep Inter"}
Font for code: {family name, or "keep JetBrains Mono"}
Scale change, if any: {e.g. "bigger headings on desktop", "larger base text", or "none"}
Product name: {name}

Rules for this task:
- Never edit tokens.css, the Figma variables or any size by hand. Choices go into the engine config; the engine
  computes every size, line height and letter-spacing and runs the checks.
- Never state a size, line height or check result you did not get from the engine's output. If you can't run
  the engine, say so and leave those numbers for the person who runs it.

Steps:
1. Write the config file (only what changes):
   { "name": "{name}", "typography": { "sans": "<font>, <close fallback>, system-ui, sans-serif",
     "mono": "<font>, ui-monospace, monospace" } }
   - Each family is a stack: the chosen font, one or two fonts that look close, then the generic family.
   - For a scale change, set "baseSize" (an even number of px) and/or "ratio": { "sm", "md", "lg", "xl" }.
     The ratios must not shrink from sm to xl. Change as little as possible.
2. Build it: node src/cli.js <config.json> out/<name>
   If you can run commands, run it and read the output. The build must end in PASS.
3. From the build output and out/<name>/ai/rules/typography.md, tell me:
   - whether it passed, and if not, which check failed (L1 = the largest display no longer fits a phone;
     T7 = neighbouring styles collide) and the smallest config change that would fix it;
   - the page title, section heading and largest display sizes at sm and lg, copied from the rulebook;
   - anything that changed compared with the default build.
4. List what the team must check that the engine can't:
   - the font has tabular figures (npm run audit:type on a page with a table reports it);
   - 1, l, I and 0, O are easy to tell apart at 12–14px;
   - its average character width: set typography.charWidth so the line-length check stays honest;
   - font files are loaded with font-display: swap and the regular and semibold files are preloaded.
   Remind them what does NOT change: style names, the minimum sizes, the reading line height, every rule.
5. Hand-off: ship out/<name>/tokens.css (and tailwind.theme.css), rebuild the Figma file or import its
   variables, and regenerate the AI rulebook from the same build.

Reply with: the config, the build result (or "not run"), the findings from step 3, and the review list.
```

## What a good answer looks like

- The config has only the lines that change, and every family is a stack ending in a generic family.
- Every number comes from the build output, quoted, not estimated.
- A failing build is explained with its check and fixed with the smallest change — for example, a larger base size
  that makes the largest display too big for a phone is fixed by lowering the small-screen ratio, then built again.
