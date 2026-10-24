# Theme a new brand — test answers

Two brands chosen to stress the engine: a very light one and a deep one. Both were run through the engine; every number
below is copied from its output, not estimated.

## Sunbeam · #FFD400 (bright yellow)

**Config:** [sun.config.json](sun.config.json) · **Build:** [sun.build.txt](sun.build.txt) — PASS (T4 is information only).

From the report:
- Brand sits at grade 11.8; the solid brand fill uses **grade 10 (#FFDB50) with black labels**.
- The fill differs from the brand hex because the engine snaps it to a grade that carries readable text; yellow at grade 10 does that with black.
- Label on fill: **15.50** default · **13.29** hover · **11.43** pressed : 1. Hover and pressed step *darker* (grades 15, 20).
- Engine note: the fill shares grade 10 with `bg.selected` and `bg.brand-subtle` in Light mode; links (#685500) and the focus ring (#745F00) are much darker than the brand.

Review list for the team:
1. Primary buttons on selected rows or subtle backgrounds — they share a shade in Light; check the button still reads as a button (its shape and label do the work).
2. Links and the focus ring look dark olive, not yellow. That is required for 4.5 : 1 on white; decide whether you're happy with it before launch.
3. Logo and illustrations next to the new fill, in Light and Dark.
4. Anything that used brand colour to mean success (CR-14).

Unchanged: status colours, positive/negative, the chart palette, every rule.

## Orchid · #7B2CBF (deep purple)

**Config:** [orc.config.json](orc.config.json) · **Build:** [orc.build.txt](orc.build.txt) — PASS.

From the report:
- Brand sits at grade 64.4; the solid fill uses **grade 65 (#7A2BBD) with white labels** — almost exactly the brand.
- Label on fill: **7.22** default · **9.81** hover · **13.28** pressed : 1 (hover and pressed step darker, grades 75 and 85).
- Links use the fill's shade in Light (#7A2BBD) and a light purple in Dark (#C08CFF); selection is #E7D6FF / #521C81.

Review list: primary buttons, links, selection and focus ring; logo next to the fill in both modes; brand-as-success.

## What this test found

- The very light brand case surfaced a real design risk (fill = selected = subtle in Light). The engine now adds that
  warning to the report, so the person running the theme sees it without an AI.
- Prompt step 3 asks for numbers "from the build's report"; the label-on-fill ratios are in the colour checks, which is
  the one place an AI has to dig. If this proves awkward with other tools, the CLI could print a one-line brand summary.
