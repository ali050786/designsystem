# DSS Typography Foundation — teardown, 22 Oct 2026

Source: `surf/Typography Foundation.fig`, opened in FigCraft (variables and text styles read directly, not from images).
Page PDFs for reference: `surf/typography_foundation/`. Reference only — nothing here is copied into `product/`.

## Structure
- 5 variable collections: `type-scales` (14 size steps 100–1400, modes XL / LG / MD / SM), `type-primitives` (3 families,
  3 weights, size and line-height aliases into the scale, 5 letter-spacings), `type-semantic` (210 variables, one mode),
  plus two leftovers (`Collection 1` with 2 colours, `Measurements` with one radius).
- 7 roles × 3 sizes × base/strong = 42 text styles (+ 9 `_support` styles), each bound to its semantic variables.
- Pages: principles (10), text roles, token structure, breakpoints, scales, primitives, semantic tokens per role, text styles,
  pairing matrix (which roles go together), usage rules (do / avoid / why).
- Families: Inter Display (display, headline, title), Inter (body, label, caption), IBM Plex Mono (mono).

## Quality problems found (measured from the variables)

### Line height comes from the next size step, so it shrinks with the screen
Every line height is "the size one step up". That gives tight ratios everywhere, and tighter still on small screens:

| Style | XL / LG | MD | SM |
|---|---|---|---|
| body/md (default paragraphs) | 16/20 = 1.25 | 16/20 = 1.25 | 16/18 = **1.12** |
| body/lg | 18/24 = 1.33 | 18/22 = 1.22 | 16/20 = 1.25 |
| body/sm | 14/18 = 1.29 | 14/18 = 1.29 | 14/16 = **1.14** |
| caption/md | 14/18 = 1.29 | 14/18 = 1.29 | 14/16 = 1.14 |
| headline/md | 36/40 = 1.11 | 34/36 = **1.06** | 30/32 = 1.07 |

- No body or caption style reaches 1.5 at any breakpoint (WCAG 1.4.8 asks 1.5 for AAA; 1.4.12 requires layouts to
  survive a 1.5 override — fixed px line heights in tight boxes are where that breaks).
- Their own "Readability" principle asks for comfortable sustained reading; the tokens deliver 1.12 on phones.
- A two-line headline at 1.06 will clip ascenders and descenders in most fonts.

### Letter-spacing is fixed px, so it gets tighter as text gets smaller
`tight` = −1.2px and `slight` = −0.6px for every size of a role:
- display/lg at XL: −1.2 / 64 = −1.9 % (reasonable); headline/sm at SM: −1.2 / 28 = **−4.3 %**.
- label/lg (buttons, form labels) at SM: −0.6 / 16 = **−3.75 %** — negative tracking on small UI text hurts legibility.
- `loose` = +0.1px and `wide` = +0.2px are below one pixel at every size: they do nothing visible.

### "Bold" is 600
`weight/bold` = 600. WCAG's large-text exception (3 : 1 instead of 4.5 : 1) applies to 18.66px **bold**; teams
reading "bold" in the token name may apply 3 : 1 to 600-weight titles at 20–23px (title/sm, title/md at SM).
No style says whether it is large or normal text, so the contrast it needs is left to guesswork.

### No tabular numerals
No text style sets a numeral feature. Mono is recommended for "data values", which makes tables and metrics change
font instead of just aligning digits. Inter has tabular figures built in.

### Housekeeping
- Two unrelated collections left in the file (`Collection 1`, `Measurements`).
- Semantic collection has one mode; all responsiveness lives in the raw scale, so a role can't keep its size while
  the scale changes (body/md happens to stay 16 because steps 100–300 never change).
- Inter Display (a cut drawn for large sizes) is used down to 18–20px for title/sm.

## What we do better (our typography foundation)
1. Line height comes from a minimum ratio per kind of text, never from the next size step; reading text stays ≥ 1.5 at every breakpoint (checked on every build).
2. Letter-spacing in em, so it scales with the size; no negative letter-spacing below 24px, never tighter than −2 %.
3. Every style is tagged **large** or **normal** text per breakpoint, so the contrast it needs is never guesswork.
4. Tabular numerals are a style property (`type.numeric.*`, table styles), not a font swap.
5. A type checker for code (raw px, line height under 1.5 on reading text, numbers without tabular numerals) and a page audit that applies the WCAG text-spacing override and 200% text.
