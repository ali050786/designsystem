# Add a text style — test answers

Four requests: two where an existing style should win, one the rules forbid, and two that need a new style. The engine is
the judge for every config — each was built, and the numbers below are copied from its output.

## "A smaller caption for chart axis labels, about 10px"

**Answer: not allowed; use `type.caption.md`.**
TR-03 sets 12px as the smallest text. `type.caption.md` (12/18) is made for chart labels — the decision guide lists them.
If the labels don't fit, show fewer ticks or rotate them; don't shrink the text.

*Checked:* a config asking for step −3 ([axis-10px.config.json](axis-10px.config.json)) is refused by the engine before it builds anything
([axis-10px.build.txt](axis-10px.build.txt)): `"step" must be a whole number from -2 to 9 … -2 is the smallest, 12px by default`.

## "A bigger number on the usage cards"

**Answer: use the existing `type.numeric.lg`; no new style.**
It is the headline figure on a metric card: 28/36, semibold, tabular numerals, at every breakpoint.

## "A label above section titles, in capitals — like 'BILLING' over 'Current plan'"

**Step 1 — existing styles?** `type.label.sm` is the closest (12px medium), but capitals need extra letter-spacing, and TR-11
says capitals come only through a style made for them. So: one new style.

**Step 2 — the style:** `type.overline.sm` — step −2 (the 12px step), kind `label`, weight `semibold`, `"case": "upper"`.

**Step 3 — expected:** 12/16 at every breakpoint (label line height 1.33), letter-spacing +0.06em (the caps spacing); sits
beside `label.sm` (same size, heavier, in capitals) — different enough that the engine won't refuse it as a copy.

**Step 4 — config:** [overline.config.json](overline.config.json)

**Engine result** ([overline.build.txt](overline.build.txt)): PASS. The rulebook lists `type.overline.sm` at 12/16 at sm, md, lg and xl,
semibold 600, class `.ds-type-overline-sm`, Tailwind `text-overline-sm` + `uppercase` — as expected.

## "One big number on the dashboard's home banner — bigger than the metric cards, and bigger on wide screens"

**Step 1 — existing styles?** `type.numeric.lg` is fixed at 28px; display styles have the size but not tabular numerals and
are bold. A headline figure that should grow with the screen is a new style.

**Step 2 — the style:** `type.figure.lg` — step 7, kind `display`, weight `semibold`, `"tabular": true`, `"scales": true`.

**Step 3 — expected:** the step-7 sizes of `display.md` (36 at sm up to 56 at lg), line height from the display kind, tabular.

**Step 4 — config:** [hero-figure.config.json](hero-figure.config.json)

**Engine result** ([hero-figure.build.txt](hero-figure.build.txt)): PASS. `type.figure.lg`: 36/42 sm · 44/52 md · 56/66 lg · 56/66 xl,
semibold 600, large text at every breakpoint, tabular. T5 now counts 4 number styles.

## What this test found

- The engine printed a stack trace around a refused config, which reads like a crash. The CLI now prints one line —
  `✕ Config refused — …` — and exits with code 2.
