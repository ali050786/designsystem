# Colour rules for AI tools — ds

Generated from the engine (brand #2D5BD7; 324 pairs, each measured in Light and Dark, all passing). The same data in machine-readable form: `color.contract.json`.

## How to use this file
1. Pick colours with the **Decision guide**, using role names exactly as written.
2. Check every text, icon and outline against the **Pair contract** for the background it sits on.
3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.
4. Before answering, run the **Self-check**.

## Hard rules
| ID | Rule | Why | WCAG |
|---|---|---|---|
| CR-01 | Use roles, never shades or hex. | Roles carry the Light and Dark values and the contrast promise; `color.<hue>.<grade>` and hex codes carry neither. | — |
| CR-02 | Put text, icons and outlines only on backgrounds listed for them in the pair contract. | Only listed pairs are measured. Anything else is unsupported. | 1.4.3, 1.4.11 |
| CR-03 | On a solid fill (bg.brand, bg.danger, action.primary.bg …) use its partner on- colour. | Any other text on a solid fill falls far below 4.5 : 1. | 1.4.3 |
| CR-04 | Never use colour alone to carry meaning. | Status needs words or an icon, links need an underline, changes need an arrow or sign. | 1.4.1 |
| CR-05 | Positive and negative mean good and bad, not up and down. | A falling error rate is positive (green with ▼). Choose by meaning; the arrow shows direction. | 1.4.1 |
| CR-06 | Hover with translucent tints only on canvas, surface or sunken; inside menus, popovers, dialogs and raised cards use the solid item roles. | In Dark, lightening a high surface closes the gap to its text (brand text measured at 2.8 : 1). | 1.4.3 |
| CR-07 | Never place ghost buttons or brand-coloured text on a tinted sunken well. | Brand text there lands on the 4.5 : 1 line — too close to rely on. | 1.4.3 |
| CR-08 | One primary action per view. | Two primaries force people to choose between equals. | — |
| CR-09 | Every focusable element shows a 2px border.focus ring with a 2px gap on :focus-visible. Never remove it. | Keyboard users lose their place without it. | 2.4.7, 2.4.13 |
| CR-10 | Outlines that identify a control use border.input or border.strong; border.subtle and border.default are decorative only. | People need to see a field's edge to find it (3 : 1). | 1.4.11 |
| CR-11 | Disabled colours are exempt from contrast, so never put information in disabled text; explain nearby why something is disabled. | Low-contrast text is hard to read for many people. | 1.4.3 (exception) |
| CR-12 | Overlays (menus, popovers, dialogs) take their whole elevation level — bg.surface-overlay, border.floating at border.width.line and the level's shadow; modal dialogs also get bg.scrim (Elevation rulebook). | Depth must not rely on shadow alone. | 1.4.11 |
| CR-13 | Use chart series in order (chart-1, chart-2 …) and label series directly or with a legend. | The order is tuned so neighbours stay distinct for colour-blind readers. | 1.4.1 |
| CR-14 | Brand colour is identity, not an intent. Never use it to mean success. | Intent colours must keep one meaning everywhere. | — |
| CR-15 | Design once with roles; switch Light and Dark by mode (data-theme on <html>), never by swapping names. | Roles are remapped per mode; swapping names breaks the pair contract. | — |

## Decision guide

**A background** — Where does it sit?

| When | Use |
|---|---|
| The page itself | `color.bg.canvas` |
| A card, panel or table | `color.bg.surface` |
| Set back inside a card (table head, well, code) | `color.bg.surface-sunken` |
| Stays above scrolling content (sticky header, toolbar) | `color.bg.surface-raised` |
| Opens on top (menu, popover, dialog) | `color.bg.surface-overlay` |
| The selected item | `color.bg.selected` |
| A message or highlight tint | `color.bg.{intent}-subtle` |
| Behind a modal dialog | `color.bg.scrim` |

**Text** — How important is it?

| When | Use |
|---|---|
| Main content and headings | `color.fg.default` |
| Supporting details | `color.fg.muted` |
| Meta text, timestamps, placeholders | `color.fg.subtle` |
| A link (always underlined) | `color.fg.link` |
| Status words | `color.fg.{intent}` |
| On a solid fill | `color.fg.on-{fill}` |
| A good / bad change (with an arrow) | `color.fg.positive / color.fg.negative` |

**An icon** — Does it carry meaning?

| When | Use |
|---|---|
| Beside a label | `color.fg.icon` |
| Chevron or decoration | `color.fg.icon-subtle` |
| Status icon | `color.fg.{intent}` |
| Inside a button with a label | `color.action.{kind}.fg` |
| An icon-only button (toolbar, row actions): ghost button with a neutral icon | `color.fg.icon` |

**An outline** — Would someone miss the control if this line disappeared?

| When | Use |
|---|---|
| Yes — input, checkbox, radio | `color.border.input` |
| Yes — button, toggle, chip | `color.border.strong` |
| No — divider, card edge | `color.border.subtle / color.border.default` |
| Keyboard focus | `color.border.focus` |
| Field in error | `color.border.danger` |

**A button** — How important is the action?

| When | Use |
|---|---|
| The main action (one per view) | `color.action.primary.*` |
| An alternative | `color.action.secondary.*` |
| Quiet actions, toolbars | `color.action.ghost.*` |
| Deletes or can't be undone | `color.action.danger.*` |
| Not available right now | `color.action.disabled.*` |

**Hover or pressed** — What is underneath?

| When | Use |
|---|---|
| canvas, surface or sunken | `color.bg.state-hover / color.bg.state-pressed (translucent tint)` |
| Inside a menu, popover, dialog or raised card | `color.bg.item-hover / color.bg.item-pressed (solid)` |
| A row on a surface (solid) | `color.bg.surface-hover / color.bg.surface-pressed` |

**Data and charts** — What does it show?

| When | Use |
|---|---|
| A good change (arrow shows direction) | `color.fg.positive (text) / color.data.positive (marks)` |
| A bad change | `color.fg.negative (text) / color.data.negative (marks)` |
| No change | `color.data.neutral` |
| Several series, in order | `color.data.chart-1 … chart-8` |
| Axes and ticks | `color.data.axis` |
| Gridlines (decorative) | `color.data.gridline` |

## Roles
In code use the CSS variable; in Figma the variable of the same name. Light and Dark show each role's value and, in brackets, the shade it points to as hue.grade — white is grade 0, black is grade 100. A gap of 50 grades between two shades gives at least 4.5 : 1, a gap of 40 at least 3 : 1.

### Surfaces and depth
| Role | CSS | Light | Dark | Use |
|---|---|---|---|---|
| `color.bg.canvas` | `var(--ds-color-bg-canvas)` | #ECEEF0 (neutral.5) | #161618 (neutral.95) | Page background |
| `color.bg.surface` | `var(--ds-color-bg-surface)` | #FFFFFF (white) | #232427 (neutral.90) | Cards, panels, tables |
| `color.bg.surface-raised` | `var(--ds-color-bg-surface-raised)` | #FFFFFF (white) | #2E3033 (neutral.85) | Sticky bars: headers, toolbars, sticky table headers (elevation.sticky) |
| `color.bg.surface-overlay` | `var(--ds-color-bg-surface-overlay)` | #FFFFFF (white) | #373A3E (neutral.80) | Menus, popovers, toasts, dialogs (elevation.floating and elevation.modal) |
| `color.bg.surface-sunken` | `var(--ds-color-bg-surface-sunken)` | #DCDDE1 (neutral.10) | #161618 (neutral.95) | Wells, table headers, code blocks |
| `color.bg.selected` | `var(--ds-color-bg-selected)` | #CDDEFF (brand.10) | #163383 (brand.80) | Selected row or item |
| `color.bg.scrim` | `var(--ds-color-bg-scrim)` | #0000007A (black-alpha.48) | #000000A3 (black-alpha.64) | Behind modal dialogs |
| `color.shadow.1` | `var(--ds-color-shadow-1)` | #00000014 (black-alpha.8) | #00000052 (black-alpha.32) | Shadow strength 1 of 4 (Light: the shadow itself; Dark: a weak extra cue — height there comes from lighter surfaces) |
| `color.shadow.2` | `var(--ds-color-shadow-2)` | #0000001F (black-alpha.12) | #00000066 (black-alpha.40) | Shadow strength 2 of 4 (Light: the shadow itself; Dark: a weak extra cue — height there comes from lighter surfaces) |
| `color.shadow.3` | `var(--ds-color-shadow-3)` | #00000029 (black-alpha.16) | #0000007A (black-alpha.48) | Shadow strength 3 of 4 (Light: the shadow itself; Dark: a weak extra cue — height there comes from lighter surfaces) |
| `color.shadow.4` | `var(--ds-color-shadow-4)` | #00000033 (black-alpha.20) | #0000008F (black-alpha.56) | Shadow strength 4 of 4 (Light: the shadow itself; Dark: a weak extra cue — height there comes from lighter surfaces) |

### Text, icons and outlines
| Role | CSS | Light | Dark | Use |
|---|---|---|---|---|
| `color.fg.default` | `var(--ds-color-fg-default)` | #232427 (neutral.90) | #ECEEF0 (neutral.5) | Body text, headings |
| `color.fg.muted` | `var(--ds-color-fg-muted)` | #414449 (neutral.75) | #BDBFC5 (neutral.20) | Secondary text |
| `color.fg.subtle` | `var(--ds-color-fg-subtle)` | #54575E (neutral.65) | #A1A4AB (neutral.30) | Meta text, placeholders, captions |
| `color.fg.brand` | `var(--ds-color-fg-brand)` | #244DC0 (brand.65) | #79A2FF (brand.30) | Brand-coloured text |
| `color.fg.link` | `var(--ds-color-fg-link)` | #244DC0 (brand.65) | #79A2FF (brand.30) | Links (underlined by default — WCAG 1.4.1) |
| `color.fg.link-hover` | `var(--ds-color-fg-link-hover)` | #163383 (brand.80) | #B7CEFF (brand.15) | Hovered links |
| `color.fg.disabled` | `var(--ds-color-fg-disabled)` | #888C93 (neutral.40) | #5D6168 (neutral.60) | Disabled text (exempt from contrast, WCAG 1.4.3 exception) |
| `color.border.subtle` | `var(--ds-color-border-subtle)` | #CBCED2 (neutral.15) | #414449 (neutral.75) | Decorative dividers (not needed to identify a control) *(exempt)* |
| `color.border.default` | `var(--ds-color-border-default)` | #BDBFC5 (neutral.20) | #4B4D53 (neutral.70) | Card and table outlines (decorative) *(exempt)* |
| `color.border.strong` | `var(--ds-color-border-strong)` | #686B72 (neutral.55) | #888C93 (neutral.40) | Boundaries that identify a control |
| `color.border.input` | `var(--ds-color-border-input)` | #686B72 (neutral.55) | #888C93 (neutral.40) | Text field, checkbox, radio borders |
| `color.fg.icon` | `var(--ds-color-fg-icon)` | #414449 (neutral.75) | #BDBFC5 (neutral.20) | Default icons — same weight as muted text |
| `color.fg.icon-subtle` | `var(--ds-color-fg-icon-subtle)` | #686B72 (neutral.55) | #888C93 (neutral.40) | Secondary icons (chevrons, decorative glyphs next to a label) — 3:1 |

### Actions and states
| Role | CSS | Light | Dark | Use |
|---|---|---|---|---|
| `color.bg.surface-hover` | `var(--ds-color-bg-surface-hover)` | #DCDDE1 (neutral.10) | #2E3033 (neutral.85) | Hovered row or item |
| `color.bg.surface-pressed` | `var(--ds-color-bg-surface-pressed)` | #CBCED2 (neutral.15) | #373A3E (neutral.80) | Pressed row or item |
| `color.bg.disabled` | `var(--ds-color-bg-disabled)` | #DCDDE1 (neutral.10) | #2E3033 (neutral.85) | Disabled control fill (exempt from contrast, WCAG 1.4.3 exception) |
| `color.bg.brand` | `var(--ds-color-bg-brand)` | #2A57D1 (brand.60) | #2A57D1 (brand.60) | Solid brand fill (grade 60) — text on it uses color.fg.on-brand |
| `color.bg.brand-hover` | `var(--ds-color-bg-brand-hover)` | #1E44AE (brand.70) | #1E44AE (brand.70) | Hovered solid brand fill |
| `color.bg.brand-pressed` | `var(--ds-color-bg-brand-pressed)` | #163383 (brand.80) | #163383 (brand.80) | Pressed solid brand fill |
| `color.bg.brand-subtle` | `var(--ds-color-bg-brand-subtle)` | #CDDEFF (brand.10) | #122B6B (brand.85) | Tinted brand background (alerts, badges) |
| `color.fg.on-brand` | `var(--ds-color-fg-on-brand)` | #FFFFFF (white) | #FFFFFF (white) | Text and icons on color.bg.brand |
| `color.border.focus` | `var(--ds-color-border-focus)` | #2A57D1 (brand.60) | #6594FF (brand.35) | Focus ring |
| `color.bg.state-hover` | `var(--ds-color-bg-state-hover)` | #0000000F (black-alpha.6) | #FFFFFF0A (white-alpha.4) | Hover tint over canvas, surface or sunken |
| `color.bg.state-pressed` | `var(--ds-color-bg-state-pressed)` | #00000014 (black-alpha.8) | #FFFFFF14 (white-alpha.8) | Pressed tint over canvas, surface or sunken |
| `color.bg.item-hover` | `var(--ds-color-bg-item-hover)` | #DCDDE1 (neutral.10) | #2E3033 (neutral.85) | Hovered item inside a menu, popover, dialog or raised card |
| `color.bg.item-pressed` | `var(--ds-color-bg-item-pressed)` | #CBCED2 (neutral.15) | #232427 (neutral.90) | Pressed item inside a menu, popover, dialog or raised card |
| `color.action.primary.bg` | `var(--ds-color-action-primary-bg)` | #2A57D1 (brand.60) | #2A57D1 (brand.60) | Primary button fill — one per view |
| `color.action.primary.bg-hover` | `var(--ds-color-action-primary-bg-hover)` | #1E44AE (brand.70) | #1E44AE (brand.70) | Primary button, hovered |
| `color.action.primary.bg-pressed` | `var(--ds-color-action-primary-bg-pressed)` | #163383 (brand.80) | #163383 (brand.80) | Primary button, pressed |
| `color.action.primary.fg` | `var(--ds-color-action-primary-fg)` | #FFFFFF (white) | #FFFFFF (white) | Label and icon on a primary button |
| `color.action.secondary.bg` | `var(--ds-color-action-secondary-bg)` | #FFFFFF (white) | #232427 (neutral.90) | Secondary button fill (matches the surface) |
| `color.action.secondary.bg-hover` | `var(--ds-color-action-secondary-bg-hover)` | #DCDDE1 (neutral.10) | #2E3033 (neutral.85) | Secondary button, hovered |
| `color.action.secondary.bg-pressed` | `var(--ds-color-action-secondary-bg-pressed)` | #CBCED2 (neutral.15) | #373A3E (neutral.80) | Secondary button, pressed |
| `color.action.secondary.fg` | `var(--ds-color-action-secondary-fg)` | #232427 (neutral.90) | #ECEEF0 (neutral.5) | Label and icon on a secondary button |
| `color.action.secondary.border` | `var(--ds-color-action-secondary-border)` | #686B72 (neutral.55) | #888C93 (neutral.40) | Secondary button outline — 3:1, it is what shows the button |
| `color.action.ghost.bg` | `var(--ds-color-action-ghost-bg)` | #FFFFFF00 (transparent) | #FFFFFF00 (transparent) | Ghost button: no fill until hovered |
| `color.action.ghost.bg-hover` | `var(--ds-color-action-ghost-bg-hover)` | #0000000F (black-alpha.6) | #FFFFFF0A (white-alpha.4) | Ghost button, hovered (state layer; inside menus and dialogs use bg/item-hover) |
| `color.action.ghost.bg-pressed` | `var(--ds-color-action-ghost-bg-pressed)` | #00000014 (black-alpha.8) | #FFFFFF14 (white-alpha.8) | Ghost button, pressed (state layer; inside menus and dialogs use bg/item-pressed) |
| `color.action.ghost.fg` | `var(--ds-color-action-ghost-fg)` | #244DC0 (brand.65) | #79A2FF (brand.30) | Ghost button label — brand text |
| `color.action.danger.bg` | `var(--ds-color-action-danger-bg)` | #AD3831 (danger.60) | #AD3831 (danger.60) | Destructive button fill |
| `color.action.danger.bg-hover` | `var(--ds-color-action-danger-bg-hover)` | #8E2924 (danger.70) | #8E2924 (danger.70) | Destructive button, hovered |
| `color.action.danger.bg-pressed` | `var(--ds-color-action-danger-bg-pressed)` | #6C1E1B (danger.80) | #6C1E1B (danger.80) | Destructive button, pressed |
| `color.action.danger.fg` | `var(--ds-color-action-danger-fg)` | #FFFFFF (white) | #FFFFFF (white) | Label and icon on a destructive button |
| `color.action.disabled.bg` | `var(--ds-color-action-disabled-bg)` | #DCDDE1 (neutral.10) | #2E3033 (neutral.85) | Any disabled button (exempt from contrast) |
| `color.action.disabled.fg` | `var(--ds-color-action-disabled-fg)` | #888C93 (neutral.40) | #5D6168 (neutral.60) | Disabled label (exempt from contrast) |
| `color.action.disabled.border` | `var(--ds-color-action-disabled-border)` | #CBCED2 (neutral.15) | #414449 (neutral.75) | Disabled outline (exempt from contrast) |

### Status and data
| Role | CSS | Light | Dark | Use |
|---|---|---|---|---|
| `color.bg.success` | `var(--ds-color-bg-success)` | #007031 (success.60) | #007031 (success.60) | Solid success fill (grade 60) — text on it uses color.fg.on-success |
| `color.bg.success-hover` | `var(--ds-color-bg-success-hover)` | #005A26 (success.70) | #005A26 (success.70) | Hovered solid success fill |
| `color.bg.success-pressed` | `var(--ds-color-bg-success-pressed)` | #00441B (success.80) | #00441B (success.80) | Pressed solid success fill |
| `color.bg.success-subtle` | `var(--ds-color-bg-success-subtle)` | #BAE9C3 (success.10) | #003815 (success.85) | Tinted success background (alerts, badges) |
| `color.fg.on-success` | `var(--ds-color-fg-on-success)` | #FFFFFF (white) | #FFFFFF (white) | Text and icons on color.bg.success |
| `color.bg.warning` | `var(--ds-color-bg-warning)` | #E1A74E (warning.25) | #E1A74E (warning.25) | Solid warning fill (grade 25) — text on it uses color.fg.on-warning |
| `color.bg.warning-hover` | `var(--ds-color-bg-warning-hover)` | #D8982D (warning.30) | #D8982D (warning.30) | Hovered solid warning fill |
| `color.bg.warning-pressed` | `var(--ds-color-bg-warning-pressed)` | #CD8A00 (warning.35) | #CD8A00 (warning.35) | Pressed solid warning fill |
| `color.bg.warning-subtle` | `var(--ds-color-bg-warning-subtle)` | #FAD8AB (warning.10) | #432B00 (warning.85) | Tinted warning background (alerts, badges) |
| `color.fg.on-warning` | `var(--ds-color-fg-on-warning)` | #000000 (black) | #000000 (black) | Text and icons on color.bg.warning |
| `color.bg.danger` | `var(--ds-color-bg-danger)` | #AD3831 (danger.60) | #AD3831 (danger.60) | Solid danger fill (grade 60) — text on it uses color.fg.on-danger |
| `color.bg.danger-hover` | `var(--ds-color-bg-danger-hover)` | #8E2924 (danger.70) | #8E2924 (danger.70) | Hovered solid danger fill |
| `color.bg.danger-pressed` | `var(--ds-color-bg-danger-pressed)` | #6C1E1B (danger.80) | #6C1E1B (danger.80) | Pressed solid danger fill |
| `color.bg.danger-subtle` | `var(--ds-color-bg-danger-subtle)` | #FFD3CE (danger.10) | #581A17 (danger.85) | Tinted danger background (alerts, badges) |
| `color.fg.on-danger` | `var(--ds-color-fg-on-danger)` | #FFFFFF (white) | #FFFFFF (white) | Text and icons on color.bg.danger |
| `color.bg.info` | `var(--ds-color-bg-info)` | #0065A2 (info.60) | #0065A2 (info.60) | Solid info fill (grade 60) — text on it uses color.fg.on-info |
| `color.bg.info-hover` | `var(--ds-color-bg-info-hover)` | #005182 (info.70) | #005182 (info.70) | Hovered solid info fill |
| `color.bg.info-pressed` | `var(--ds-color-bg-info-pressed)` | #003D63 (info.80) | #003D63 (info.80) | Pressed solid info fill |
| `color.bg.info-subtle` | `var(--ds-color-bg-info-subtle)` | #C0E1FF (info.10) | #003252 (info.85) | Tinted info background (alerts, badges) |
| `color.fg.on-info` | `var(--ds-color-fg-on-info)` | #FFFFFF (white) | #FFFFFF (white) | Text and icons on color.bg.info |
| `color.fg.success` | `var(--ds-color-fg-success)` | #00652C (success.65) | #58B770 (success.30) | Success text and icons — with words or an icon, never colour alone |
| `color.fg.warning` | `var(--ds-color-fg-warning)` | #774F00 (warning.65) | #D8982D (warning.30) | Warning text and icons — with words or an icon, never colour alone |
| `color.fg.danger` | `var(--ds-color-fg-danger)` | #9E302A (danger.65) | #F48479 (danger.30) | Danger text and icons — with words or an icon, never colour alone |
| `color.fg.info` | `var(--ds-color-fg-info)` | #005B91 (info.65) | #4DABF3 (info.30) | Info text and icons — with words or an icon, never colour alone |
| `color.border.floating` | `var(--ds-color-border-floating)` | #AEB1B8 (neutral.25) | #54575E (neutral.65) | The edge of anything that floats over content: menus, popovers, toasts, dialogs, a dragged item — seen against every surface below it, kept in forced colours |
| `color.border.selected` | `var(--ds-color-border-selected)` | #244DC0 (brand.65) | #79A2FF (brand.30) | Selected or current item: the border of a selected option or card, the bar under the current tab — with a second cue (a check mark, bold text) |
| `color.border.success` | `var(--ds-color-border-success)` | #007C37 (success.55) | #29A051 (success.40) | Success outline — a field that passed validation |
| `color.border.warning` | `var(--ds-color-border-warning)` | #926100 (warning.55) | #BD7F00 (warning.40) | Warning outline — a field that needs attention |
| `color.border.danger` | `var(--ds-color-border-danger)` | #BB413A (danger.55) | #E0665B (danger.40) | Danger outline — a field in error |
| `color.border.info` | `var(--ds-color-border-info)` | #0070B1 (info.55) | #1592E1 (info.40) | Info outline — a highlighted field or callout |
| `color.fg.positive` | `var(--ds-color-fg-positive)` | #00652C (success.65) | #58B770 (success.30) | A good change, as text — always with an arrow or sign; colour shows good, the arrow shows direction (WCAG 1.4.1) |
| `color.fg.negative` | `var(--ds-color-fg-negative)` | #9E302A (danger.65) | #F48479 (danger.30) | A bad change, as text — always with an arrow or sign; colour shows bad, the arrow shows direction (WCAG 1.4.1) |
| `color.data.positive` | `var(--ds-color-data-positive)` | #00883D (success.50) | #86CF96 (success.20) | Marks for good changes: bars, sparklines, deltas |
| `color.data.negative` | `var(--ds-color-data-negative)` | #7E231F (danger.75) | #E0665B (danger.40) | Marks for bad changes: bars, sparklines, deltas |
| `color.data.neutral` | `var(--ds-color-data-neutral)` | #686B72 (neutral.55) | #888C93 (neutral.40) | Unchanged values |
| `color.data.gridline` | `var(--ds-color-data-gridline)` | #CBCED2 (neutral.15) | #414449 (neutral.75) | Chart gridlines (decorative) *(exempt)* |
| `color.data.axis` | `var(--ds-color-data-axis)` | #686B72 (neutral.55) | #888C93 (neutral.40) | Chart axes and ticks |
| `color.data.chart-1` | `var(--ds-color-data-chart-1)` | #0B54B0 (chart-1.light) | #82A3F0 (chart-1.dark) | Categorical chart series 1 |
| `color.data.chart-2` | `var(--ds-color-data-chart-2)` | #8C5400 (chart-2.light) | #F1C69A (chart-2.dark) | Categorical chart series 2 |
| `color.data.chart-3` | `var(--ds-color-data-chart-3)` | #008BB2 (chart-3.light) | #92D8F2 (chart-3.dark) | Categorical chart series 3 |
| `color.data.chart-4` | `var(--ds-color-data-chart-4)` | #6A2772 (chart-4.light) | #B465A1 (chart-4.dark) | Categorical chart series 4 |
| `color.data.chart-5` | `var(--ds-color-data-chart-5)` | #928100 (chart-5.light) | #B0B927 (chart-5.dark) | Categorical chart series 5 |
| `color.data.chart-6` | `var(--ds-color-data-chart-6)` | #7F5EDF (chart-6.light) | #9465EE (chart-6.dark) | Categorical chart series 6 |
| `color.data.chart-7` | `var(--ds-color-data-chart-7)` | #2D4A34 (chart-7.light) | #00953A (chart-7.dark) | Categorical chart series 7 |
| `color.data.chart-8` | `var(--ds-color-data-chart-8)` | #D94E7B (chart-8.light) | #E6899D (chart-8.dark) | Categorical chart series 8 |

## Pair contract
Foreground role → the backgrounds it may sit on (minimum ratio). A tint pair names the surface underneath. Anything not listed is unsupported.

| Foreground | Min | Allowed on |
|---|---|---|
| `color.fg.on-brand` | 4.5 : 1 | bg.brand, bg.brand-hover, bg.brand-pressed |
| `color.fg.on-success` | 4.5 : 1 | bg.success, bg.success-hover, bg.success-pressed |
| `color.fg.on-warning` | 4.5 : 1 | bg.warning, bg.warning-hover, bg.warning-pressed |
| `color.fg.on-danger` | 4.5 : 1 | bg.danger, bg.danger-hover, bg.danger-pressed |
| `color.fg.on-info` | 4.5 : 1 | bg.info, bg.info-hover, bg.info-pressed |
| `color.fg.default` | 4.5 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected, bg.success-subtle, bg.warning-subtle, bg.danger-subtle, bg.info-subtle, bg.brand-subtle, bg.state-hover over canvas, bg.state-hover over surface, bg.state-hover over surface-sunken, bg.state-pressed over canvas, bg.state-pressed over surface, bg.state-pressed over surface-sunken, bg.item-hover, bg.item-pressed |
| `color.fg.muted` | 4.5 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected, bg.success-subtle, bg.warning-subtle, bg.danger-subtle, bg.info-subtle, bg.brand-subtle, bg.state-hover over canvas, bg.state-hover over surface, bg.state-hover over surface-sunken, bg.state-pressed over canvas, bg.state-pressed over surface, bg.state-pressed over surface-sunken, bg.item-hover, bg.item-pressed |
| `color.fg.subtle` | 4.5 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected, bg.item-hover, bg.item-pressed |
| `color.fg.brand` | 4.5 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected, bg.brand-subtle, bg.state-hover over canvas, bg.state-hover over surface, bg.state-pressed over canvas, bg.state-pressed over surface, bg.item-hover, bg.item-pressed |
| `color.fg.link` | 4.5 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected, bg.success-subtle, bg.warning-subtle, bg.danger-subtle, bg.info-subtle, bg.brand-subtle, bg.item-hover, bg.item-pressed |
| `color.fg.link-hover` | 4.5 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected |
| `color.fg.success` | 4.5 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected, bg.success-subtle, bg.item-hover, bg.item-pressed |
| `color.fg.warning` | 4.5 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected, bg.warning-subtle, bg.item-hover, bg.item-pressed |
| `color.fg.danger` | 4.5 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected, bg.danger-subtle, bg.item-hover, bg.item-pressed |
| `color.fg.info` | 4.5 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected, bg.info-subtle, bg.item-hover, bg.item-pressed |
| `color.border.strong` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected |
| `color.border.input` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected |
| `color.border.focus` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected |
| `color.border.selected` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected |
| `color.border.success` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected |
| `color.border.warning` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected |
| `color.border.danger` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected |
| `color.border.info` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected |
| `color.fg.positive` | 4.5 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected, bg.success-subtle |
| `color.fg.negative` | 4.5 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected, bg.danger-subtle |
| `color.data.positive` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised |
| `color.data.negative` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised |
| `color.data.neutral` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised |
| `color.data.axis` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised |
| `color.data.chart-1` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised |
| `color.data.chart-2` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised |
| `color.data.chart-3` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised |
| `color.data.chart-4` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised |
| `color.data.chart-5` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised |
| `color.data.chart-6` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised |
| `color.data.chart-7` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised |
| `color.data.chart-8` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised |
| `color.fg.icon` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected, bg.state-hover over canvas, bg.state-hover over surface, bg.state-hover over surface-sunken, bg.state-pressed over canvas, bg.state-pressed over surface, bg.state-pressed over surface-sunken, bg.item-hover, bg.item-pressed |
| `color.fg.icon-subtle` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, bg.surface-hover, bg.surface-pressed, bg.selected, bg.state-hover over canvas, bg.state-hover over surface, bg.state-hover over surface-sunken, bg.state-pressed over canvas, bg.state-pressed over surface, bg.state-pressed over surface-sunken, bg.item-hover, bg.item-pressed |
| `color.action.primary.fg` | 4.5 : 1 | action.primary.bg, action.primary.bg-hover, action.primary.bg-pressed |
| `color.action.danger.fg` | 4.5 : 1 | action.danger.bg, action.danger.bg-hover, action.danger.bg-pressed |
| `color.action.secondary.fg` | 4.5 : 1 | action.secondary.bg, action.secondary.bg-hover, action.secondary.bg-pressed |
| `color.action.secondary.border` | 3 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken |
| `color.action.ghost.fg` | 4.5 : 1 | bg.canvas, bg.surface, bg.surface-raised, bg.surface-overlay, bg.surface-sunken, action.ghost.bg-hover over canvas, action.ghost.bg-pressed over canvas, action.ghost.bg-hover over surface, action.ghost.bg-pressed over surface, bg.item-hover, bg.item-pressed |

## Not allowed (measured)
| Pair | Light | Dark | Use instead |
|---|---|---|---|
| `color.fg.subtle` on `color.bg.brand` — Meta text on a solid brand fill | 1.17 : 1 | 2.49 : 1 | `color.fg.on-brand` |
| `color.fg.brand` on `color.bg.brand` — Brand text on the brand fill | 1.17 : 1 | 2.49 : 1 | `color.fg.on-brand` |
| `color.fg.on-brand` on `color.bg.warning` — White text on the warning fill | 2.13 : 1 | 2.13 : 1 | `color.fg.on-warning` |
| `color.fg.positive` on `color.bg.success` — Positive text on a solid success fill | 1.16 : 1 | 2.51 : 1 | `color.fg.on-success` |
| `color.fg.muted` on `color.bg.danger` — Muted text on a solid danger fill | 1.58 : 1 | 3.37 : 1 | `color.fg.on-danger` |
| `color.border.subtle` on `color.bg.surface` — Decorative border used as an input outline | 1.58 : 1 | 1.59 : 1 | `color.border.input` |

## Self-check before answering
- [ ] No hex codes, no rgb(), no `color.<hue>.<grade>` primitives in the output.
- [ ] Every role name exists in the Roles tables.
- [ ] Every text/icon/outline sits on a background listed for it.
- [ ] Solid fills use their on- colour.
- [ ] Status, links and changes carry words, an underline or an arrow.
- [ ] At most one primary action per view; focus ring kept.
- [ ] Hover inside menus/dialogs uses item roles.
