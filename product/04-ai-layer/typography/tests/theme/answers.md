# Theme the type — test answers

Three requests chosen to stress the engine: a brand font, bigger desktop headings, and a larger base size. Every number
below is copied from the engine's output or from a measurement in Chromium, not estimated.

## IBM Plex Sans and IBM Plex Mono

**Config:** [plex.config.json](plex.config.json) · **Build:** [plex.build.txt](plex.build.txt) — PASS, with one AAA warning.

- Sizes, line heights and every style are unchanged — fonts don't change the scale.
- **Character width.** Measured in Chromium with English text: Plex Sans averages 0.45 em a character (Inter: 0.48), so
  `typography.charWidth` is set to 0.45. With it, check T9 estimates **~76 characters** a line of `body.md` at the reading
  width — just over the 75 the check aims for (WCAG 1.4.8's limit is 80). `body.lg` is ~67. The team decides: accept it,
  or narrow `layout.measure.reading` for this product.
- **Tabular figures.** The type audit, run on the billing test page built with these tokens ([plex.audit.txt](plex.audit.txt)), reports
  `"IBM Plex Sans" ok, "IBM Plex Mono" ok`. (Plex Sans draws all digits at the same width even without tabular-nums.)
- Same page: smallest text 12px, reading line height 1.5, fits 320px, nothing cut off at 200% or with the spacing override.
  Screenshot: [plex-billing-desktop.png](plex-billing-desktop.png).

Review list for the team: 1, l and I and 0 and O at 12–14px; the 76-character lines; load the font files with
`font-display: swap` and preload regular and semibold.

## Bigger headings on desktop

**Config:** [wide.config.json](wide.config.json) (lg and xl ratio 1.25) · **Build:** [wide.build.txt](wide.build.txt) — PASS.

From the rulebook: page title (`heading.lg`) 28 sm → 48 lg; section (`heading.md`) 26 → 40; largest display 40 → 96.
Reading and interface styles are unchanged (`body.md` 16/24 everywhere). Phones are unchanged because only lg and xl moved.

## Larger base text for a reading-heavy product

**First config:** [reading-18.config.json](reading-18.config.json) (`baseSize` 18) · **Build:** [reading-18.build.txt](reading-18.build.txt) — **FAIL (L1)**.
The report: `type.display.lg at sm` = 48px, over the 40px that fits a 320px screen.

**Smallest fix:** lower only the small-screen ratio. [reading-18-fixed.config.json](reading-18-fixed.config.json) (`sm` 1.11) ·
[reading-18-fixed.build.txt](reading-18-fixed.build.txt) — PASS.

From the rulebook: `body.md` 18/28 and `caption.md` 14/22 everywhere; page title 30 sm → 44 lg; largest display 40 sm → 76 lg.

## What this test found

- **An 18px base could not be built at all.** Sizes from 24px up were rounded to the 4px grid, which is too coarse between 24
  and 32px: two neighbouring steps rounded to the same 28px, so every small-screen ratio either broke L1 (display too big
  for a phone) or T7 (styles collide). The engine now uses the 4px grid from 32px up and whole even pixels below. With
  that, base 18 builds (ratio 1.1 or 1.11), and the default scale changed in one place only: `heading.md` on phones is 26px
  instead of 24px.
- The line-length check needs the font's character width, which the engine can't measure. `typography.charWidth` is now
  in the config and in the guide; the type audit measures the real lines on a page.
