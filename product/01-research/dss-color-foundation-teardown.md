# DSS Color Foundation — teardown (from Figma page PDFs), 21 Oct 2026

Source: `surf/color_foundation/` (17 frame PDFs). Contrast computed with WCAG 2.x formula on their default hex values.

## Structure
- 2 layers: primitives (Brand, Red, Green, Yellow, Purple: 11 steps 50–1000; Neutral: 12 steps 0–1000; Alpha black/white 3–80%) and semantic (bg 57, fg 22, border 21, focus 3)
- Semantic groups: base / intent (accent, positive, warning, negative, info) / action (primary, secondary, ghost × hover, pressed) / state (hover, pressed, selected)
- Docs pages: Token Structure, Color Roles, Intent Roles, Layering (6 depth levels), Usage Rules (do / avoid / why), Invalid Pairings, Pairing Matrix (every bg × fg/icon/border/focus, light + dark)
- Visual style: clean, monochrome, tabular, Inter + mono labels

## Quality problems found
### Palette
- Palettes look mechanically generated (straight lightness steps in RGB/HSL), not perceptually even. Neutral is pure linear grey (#808080 at 500). Steps don't feel equally spaced and hues shift in saturation.
- "Info" is purple, unusual; fine but undocumented why.

### Contrast failures in the DEFAULT mapping
| Mode | Pair | Ratio | Need |
|---|---|---|---|
| Dark | white on positive primary button (green.600) | 2.88 | 4.5 |
| Dark | white on accent primary PRESSED (brand.300) | 2.36 | 4.5 |
| Dark | white on accent primary HOVER (brand.400) | 3.19 | 4.5 |
| Dark | white on negative primary button (red.500) | 3.92 | 4.5 |
| Dark | white on accent primary button (brand.500) | 4.25 | 4.5 |
| Light | fg.base.tertiary (placeholder) on canvas | 3.95 | 4.5 |
| Light | warning text on warning subtle bg | 4.45 | 4.5 |
| Light | border.base.medium ("default container border", used on inputs) | 2.10 | 3.0 |
| Light | intent / secondary-button borders (x.300) | 2.36–2.40 | 3.0 |

- Their own Pairing Matrix endorses several of these (e.g. on-color on dark positive.strong) and shows no contrast ratios at all.
- Dark hover/pressed get LIGHTER (500 → 400 → 300) while text stays white, so contrast drops on every interaction.

### Layering
- Light: canvas = surface = raised = elevated = #FFFFFF. Depth relies entirely on shadow/border, contradicting the "depth through background surfaces" claim.
- Dark: section = raised = elevated = neutral.800.

### Naming
- Template typo `deafault` shipped in Figma variable names (acknowledged in their handoff file).

## What we do better (our color foundation)
1. Perceptual palettes (OKLCH) with even lightness steps across hues, so the same step number = same contrast behaviour in every hue
2. Contrast is a property of the system: every matrix cell shows its ratio and pass/fail; mappings are chosen to pass by construction
3. Dark-mode interaction states that keep contrast (or switch on-color to dark text automatically)
4. Light-mode surfaces that actually differ, or explicit "depth = elevation token" rule linked to the Elevation foundation
5. Contrast checks run by a script, not only by an AI prompt
