# Colour

*ds foundations · colour · the written guide. Generated from the engine — brand `#2D5BD7`, 102 roles, 324 pairs each measured in Light and Dark, none failing. Do not edit by hand; change the engine config and build again.*

This guide explains how colour works in ds and how to use it: what the shades are, how roles are named, what may sit on what, and how Light, Dark and your brand fit in. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after [Choosing and using colour](#choosing-and-using-colour); developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (`rules/color.md`, `color.contract.json`).

**Contents**

- [Five principles](#five-principles)
- [Contrast grades](#contrast-grades)
- [How tokens are built](#how-tokens-are-built)
- [Shade scales](#shade-scales)
- [Surfaces and depth](#surfaces-and-depth)
- [Text, icons and outlines](#text-icons-and-outlines)
- [Actions and states](#actions-and-states)
- [Status and data](#status-and-data)
- [What goes on what](#what-goes-on-what)
- [Choosing and using colour](#choosing-and-using-colour)
- [Modes and brands](#modes-and-brands)

---

## Five principles

Five principles shape every colour decision. Each one is something you can check, not just a belief.

| Principle | What it means in practice |
|---|---|
| **Accessible by construction** | Every shade is solved so its contrast is known before anyone uses it. A pair that would fail is never generated. |
| **Roles, not shades** | Designs and code use named roles like `bg/surface`. A role carries its Light and Dark values and a promise about what it may sit on. A raw shade carries neither. |
| **Never colour alone** | Anything colour says is also said by words, an icon, an underline or an arrow, so it reaches people who see colour differently. |
| **Remapped, not inverted** | Dark mode points each role at a different shade chosen for the same contrast. Nothing is flipped by formula. |
| **Measured, not assumed** | 324 allowed pairs are measured in both modes on every build. If one fails, the build stops — nobody has to remember to check. |

---

## Contrast grades

Every shade has a **grade** from 0 (white) to 100 (black). A grade is measured darkness — how much contrast the shade has against white — not hue or saturation. The engine solves each shade so its brightness lands exactly on its grade, in every hue.

**Subtract to check a pair.** Take the darker grade minus the lighter one. The gap tells you the contrast, whatever the hues:

| Gap | Contrast | Good enough for |
|---|---|---|
| 40 or more | ≥ 3 : 1 | Icons, input outlines, focus rings, chart marks, large text (24px+, or 18.7px bold) |
| 50 or more | ≥ 4.5 : 1 | All text, at any size |
| 70 or more | ≥ 7 : 1 | Enhanced contrast (AAA). Body text on the main surfaces already reaches it. |

Why it works: grade *g* is defined as the brightness that gives a contrast of 21^(g/100) against white, so any two grades *a* and *b* have a contrast of 21^((b − a)/100). A gap of 50 gives 21^0.5 = 4.58 : 1.

| Pair | Grades | Gap | Measured | Result |
|---|---|---|---|---|
| Body text on a white card | neutral.90 on white | 90 | 15.52 : 1 | passes 4.5 : 1 |
| Brand text on a sunken well | brand.60 on neutral.10 | 50 | 4.57 : 1 | passes 4.5 : 1 |
| Input outline on white | neutral.55 on white | 55 | 5.34 : 1 | passes 3 : 1 |
| Brand 40 on brand 10 | brand.40 on brand.10 | 30 | 2.49 : 1 | **fails** 4.5 : 1 — gap too small |

**The same gap in every hue.** Grade 10 against grade 60 in all six scales:

| Brand | Neutral | Success | Warning | Danger | Info |
|---|---|---|---|---|---|
| 4.58 : 1 | 4.58 : 1 | 4.62 : 1 | 4.58 : 1 | 4.56 : 1 | 4.57 : 1 |

The numbers barely move because every hue is solved to the same grades. That is what lets you reason about contrast without a checker.

---

## How tokens are built

Colour comes in three tiers. Each tier only points to the one below it, so a change at the bottom flows all the way up.

| Tier | In Figma | What it holds | Who touches it |
|---|---|---|---|
| **Shades** (primitives) | Primitives collection · one mode · hidden from publishing | Raw values from the engine. No meaning, no modes. | Nobody — the engine writes them |
| **Roles** | Color collection · Light and Dark | Named by job. Each role points to a shade, per mode. | Everyone: designs and code use only this tier |
| **Component colours** | Added with components | Point to roles, e.g. a button's fill. | Component authors (later phase) |

This build has 152 shade variables and 102 roles.

**Reading a name.** General to specific: category, group, role, and sometimes a state.

`color / fg / muted` — category `color`, group `fg`, role `muted`.  
`color / action / primary / bg-hover` — group `action`, role `primary / bg`, state `hover`.

Role names say what something *does* (surface, muted, primary), never what colour it is. A role called "blue" would be wrong the day the brand changes.

| Group | Paints | Shows in the Figma picker for | Explained in |
|---|---|---|---|
| `bg` | Pages, containers, fills | Frame and shape fills | Surfaces · Actions · Status |
| `fg` | Text and icons | Text fills, icon shapes | Text · Actions · Status |
| `border` | Outlines, dividers, focus | Strokes | Text · Actions · Status |
| `action` | Buttons and their states | Fills, text, strokes | Actions and states |
| `data` | Charts, trends, good and bad change | Shape fills, strokes | Status and data |
| `shadow` | Shadow strengths the elevation levels pick from | Effects | Surfaces and depth |

**One name, three places.** Designers and developers say the same word for the same colour:

| Figma variable | CSS | Tailwind |
|---|---|---|
| `color/fg/muted` | `var(--ds-color-fg-muted)` | `text-fg-muted` |

---

## Shade scales

The raw shades every role is built from: six hues, 19 grades each. They are hidden from publishing — you meet them through roles, never directly.

- **Brand** — built around your brand's hue. Saturation peaks mid-scale and tapers towards white and black.
- **Neutral** — your brand hue at very low saturation, so greys feel related to the brand without looking tinted.
- **Status** — success, warning, danger and info keep fixed hues, so their meaning never shifts with a rebrand.
- **Extras** — chart shades tuned for colour-blind readers, and see-through blacks and whites for shadows and hover tints.

| Grade | brand | neutral | success | warning | danger | info | vs white | vs black |
|---|---|---|---|---|---|---|---|---|
| 5 | `#E6EEFF` | `#ECEEF0` | `#D8F5DD` | `#FFEBD0` | `#FFE9E6` | `#DFF0FF` | 1.16 | 18.05 |
| 10 | `#CDDEFF` | `#DCDDE1` | `#BAE9C3` | `#FAD8AB` | `#FFD3CE` | `#C0E1FF` | 1.36 | 15.47 |
| 15 | `#B7CEFF` | `#CBCED2` | `#9FDCAB` | `#F2C78A` | `#FFBEB6` | `#A1D3FF` | 1.58 | 13.30 |
| 20 | `#A1BFFF` | `#BDBFC5` | `#86CF96` | `#EAB66C` | `#FFA99E` | `#81C6FF` | 1.84 | 11.42 |
| 25 | `#8CB1FF` | `#AEB1B8` | `#6EC382` | `#E1A74E` | `#FC958A` | `#66B8FB` | 2.15 | 9.78 |
| 30 | `#79A2FF` | `#A1A4AB` | `#58B770` | `#D8982D` | `#F48479` | `#4DABF3` | 2.50 | 8.41 |
| 35 | `#6594FF` | `#94989F` | `#41AB60` | `#CD8A00` | `#EA756A` | `#349EEB` | 2.90 | 7.25 |
| 40 | `#5386FF` | `#888C93` | `#29A051` | `#BD7F00` | `#E0665B` | `#1592E1` | 3.38 | 6.22 |
| 45 | `#4579F9` | `#7D8088` | `#099444` | `#AE7500` | `#D5584F` | `#0086D2` | 3.95 | 5.32 |
| 50 | `#3B6DED` | `#72767D` | `#00883D` | `#9F6B00` | `#C84C44` | `#007BC1` | 4.56 | 4.60 |
| 55 | `#3261E0` | `#686B72` | `#007C37` | `#926100` | `#BB413A` | `#0070B1` | 5.34 | 3.93 |
| 60 | `#2A57D1` | `#5D6168` | `#007031` | `#845800` | `#AD3831` | `#0065A2` | 6.22 | 3.38 |
| 65 | `#244DC0` | `#54575E` | `#00652C` | `#774F00` | `#9E302A` | `#005B91` | 7.24 | 2.90 |
| 70 | `#1E44AE` | `#4B4D53` | `#005A26` | `#6A4600` | `#8E2924` | `#005182` | 8.45 | 2.49 |
| 75 | `#1A3C99` | `#414449` | `#004F21` | `#5E3D00` | `#7E231F` | `#004772` | 9.78 | 2.15 |
| 80 | `#163383` | `#373A3E` | `#00441B` | `#513400` | `#6C1E1B` | `#003D63` | 11.43 | 1.84 |
| 85 | `#122B6B` | `#2E3033` | `#003815` | `#432B00` | `#581A17` | `#003252` | 13.23 | 1.59 |
| 90 | `#0F2150` | `#232427` | `#002B0F` | `#352000` | `#421612` | `#002642` | 15.52 | 1.35 |
| 95 | `#0A1530` | `#161618` | `#051B0A` | `#221300` | `#280F0C` | `#031828` | 18.07 | 1.16 |

Contrast columns are measured on the neutral scale; other hues sit within a few hundredths of the same values.

**Rules**

- **Never use a shade in a design.** `brand/60` has no Light/Dark pair and no list of safe backgrounds. Pick the role that points to it.
- **Never edit a shade by hand.** Shades are solved for contrast. Change the brand in the engine config and every shade is solved again.

---

## Surfaces and depth

Surfaces say what belongs together and what sits on top. Use the lowest surface that does the job, and let elevation — not extra colours — show that something floats.

| Surface | What goes on it |
|---|---|
| `bg/canvas` | The page. Everything else sits on it. |
| `bg/surface` | Cards, panels, tables — the default home for content. |
| `bg/surface-sunken` | Set back inside a surface: table heads, wells, code blocks. |
| `bg/surface-raised` | Stays above scrolling content: sticky headers, toolbars. |
| `bg/surface-overlay` | Opens on top: menus, popovers, dialogs. |
| `bg/selected` | The chosen item, together with a check or bold label. |

**Elevation is surface + shadow + outline** (the levels are named by job in the Elevation foundation). In Light the upper surfaces are white, so shadow and outline separate them; in Dark, higher surfaces are also lighter. Using all three means depth still reads when one fails — shadows are hard to see on dark backgrounds, and a slight change of surface is hard to see for some people.

| Level | Surface | Shadow | Outline |
|---|---|---|---|
| Page | `bg/canvas` | — | — |
| Raised: cards | `bg/surface` | `shadow/1` | optional |
| Sticky: headers, toolbars | `bg/surface-raised` | `shadow/2` | `border/subtle`, toward the content |
| Floating: menus, popovers, toasts | `bg/surface-overlay` | `shadow/3` | `border/floating` |
| Modal: dialogs | `bg/surface-overlay` | `shadow/4` | `border/floating` + `bg/scrim` behind |

**Surfaces**

| Role | Use it for | Light | Dark |
|---|---|---|---|
| `bg/canvas` | Page background | `#ECEEF0` · neutral 5 | `#161618` · neutral 95 |
| `bg/surface` | Cards, panels, tables | `#FFFFFF` · white | `#232427` · neutral 90 |
| `bg/surface-sunken` | Wells, table headers, code blocks | `#DCDDE1` · neutral 10 | `#161618` · neutral 95 |
| `bg/surface-raised` | Sticky bars: headers, toolbars, sticky table headers (elevation.sticky) | `#FFFFFF` · white | `#2E3033` · neutral 85 |
| `bg/surface-overlay` | Menus, popovers, toasts, dialogs (elevation.floating and elevation.modal) | `#FFFFFF` · white | `#373A3E` · neutral 80 |
| `bg/selected` | Selected row or item | `#CDDEFF` · brand 10 | `#163383` · brand 80 |
| `bg/scrim` | Behind modal dialogs | `#0000007A` · black-alpha 48 | `#000000A3` · black-alpha 64 |

**Shadows**

| Role | Use it for | Light | Dark |
|---|---|---|---|
| `shadow/1` | Shadow strength 1 of 4 (Light: the shadow itself; Dark: a weak extra cue — height there comes from lighter surfaces) | `#00000014` · black-alpha 8 | `#00000052` · black-alpha 32 |
| `shadow/2` | Shadow strength 2 of 4 (Light: the shadow itself; Dark: a weak extra cue — height there comes from lighter surfaces) | `#0000001F` · black-alpha 12 | `#00000066` · black-alpha 40 |
| `shadow/3` | Shadow strength 3 of 4 (Light: the shadow itself; Dark: a weak extra cue — height there comes from lighter surfaces) | `#00000029` · black-alpha 16 | `#0000007A` · black-alpha 48 |
| `shadow/4` | Shadow strength 4 of 4 (Light: the shadow itself; Dark: a weak extra cue — height there comes from lighter surfaces) | `#00000033` · black-alpha 20 | `#0000008F` · black-alpha 56 |

**Rules**

- **Use the lowest surface that works.** Most content belongs on `bg/surface`. Raised and overlay are for things that truly sit above the page.
- **Overlays always get an outline.** Menus, popovers and dialogs use `bg/surface-overlay` with `border/floating` — never a shadow alone. The levels themselves are in the Elevation foundation.
- **Dim the page behind modal dialogs.** `bg/scrim` sits between the page and the dialog so attention stays on the dialog.

---

## Text, icons and outlines

Three text levels are enough for almost any screen. Icons get the weight of the text beside them. Outlines come in two kinds: the ones that only separate, and the ones that show where a control is.

| Role | Use it for | On bg/surface (Light · Dark) |
|---|---|---|
| `fg/default` | Main content and headings. If in doubt, use this. | 15.52 · 13.34 |
| `fg/muted` | Supporting details people read after the main line. | 9.78 · 8.44 |
| `fg/subtle` | Timestamps, captions, placeholders — still 4.5 : 1. | 7.24 · 6.22 |
| `fg/link` | Links — always underlined. | 7.25 · 6.23 |

**Icons** need 3 : 1 against their background. Use `fg/icon` beside a label, `fg/icon-subtle` for chevrons and decoration, the intent colour (`fg/success` …) for status icons, and the button's own `action/…/fg` inside a button.

**Two kinds of outline.** Ask one question: *would someone miss the control if this line disappeared?*

- **No — it only separates content** (dividers, card edges): `border/subtle` or `border/default`. Decorative, so exempt from contrast.
- **Yes — it shows where a control is** (inputs, checkboxes, secondary buttons): `border/input` or `border/strong`. These must reach 3 : 1 — `border/input` on `bg/surface` measures 5.34 : 1 in Light and 4.60 : 1 in Dark.

**Text and icons**

| Role | Use it for | Light | Dark |
|---|---|---|---|
| `fg/default` | Body text, headings | `#232427` · neutral 90 | `#ECEEF0` · neutral 5 |
| `fg/muted` | Secondary text | `#414449` · neutral 75 | `#BDBFC5` · neutral 20 |
| `fg/subtle` | Meta text, placeholders, captions | `#54575E` · neutral 65 | `#A1A4AB` · neutral 30 |
| `fg/brand` | Brand-coloured text | `#244DC0` · brand 65 | `#79A2FF` · brand 30 |
| `fg/link` | Links (underlined by default — WCAG 1.4.1) | `#244DC0` · brand 65 | `#79A2FF` · brand 30 |
| `fg/link-hover` | Hovered links | `#163383` · brand 80 | `#B7CEFF` · brand 15 |
| `fg/disabled` | Disabled text (exempt from contrast, WCAG 1.4.3 exception) | `#888C93` · neutral 40 | `#5D6168` · neutral 60 |
| `fg/icon` | Default icons — same weight as muted text | `#414449` · neutral 75 | `#BDBFC5` · neutral 20 |
| `fg/icon-subtle` | Secondary icons (chevrons, decorative glyphs next to a label) — 3:1 | `#686B72` · neutral 55 | `#888C93` · neutral 40 |

**Outlines**

| Role | Use it for | Light | Dark |
|---|---|---|---|
| `border/subtle` | Decorative dividers (not needed to identify a control) *Exempt from contrast.* | `#CBCED2` · neutral 15 | `#414449` · neutral 75 |
| `border/default` | Card and table outlines (decorative) *Exempt from contrast.* | `#BDBFC5` · neutral 20 | `#4B4D53` · neutral 70 |
| `border/floating` | The edge of anything that floats over content: menus, popovers, toasts, dialogs, a dragged item — seen against every surface below it, kept in forced colours | `#AEB1B8` · neutral 25 | `#54575E` · neutral 65 |
| `border/strong` | Boundaries that identify a control | `#686B72` · neutral 55 | `#888C93` · neutral 40 |
| `border/input` | Text field, checkbox, radio borders | `#686B72` · neutral 55 | `#888C93` · neutral 40 |

**Rules**

- **No custom greys.** A lighter grey for "less important" is unchecked and often fails on hover or selected rows. Use `fg/muted` or `fg/subtle`.
- **Placeholders are not labels.** They vanish when people type. Keep a visible label in `fg/default`.
- **Brand text is for short emphasis.** Long passages in `fg/brand` tire the eye and look like links.

---

## Actions and states

Buttons are named by importance, not colour. Every interactive state has its own role, and states move in the direction that keeps the label readable.

| Kind | Use for | Label on fill (Light · Dark) |
|---|---|---|
| `action/primary` | The main action — one per view | 6.21 · 6.21 |
| `action/secondary` | An alternative to the main action | 15.52 · 13.34 |
| `action/ghost` | Quiet actions, toolbars, actions inside cards | 7.25 · 6.23 (on surface) |
| `action/danger` | Deleting, or anything that can't be undone | 6.20 · 6.20 |

**How states are made.** A fill at grade 50 or darker takes white labels; a lighter fill takes black labels. Hover and pressed step the fill along its scale — usually darker, or lighter when the fill is already near the end of its range — and the label keeps a gap of 50 or more at every step. The four sample brands:

| Brand | Hex | Brand grade | Fill grade | Label | Default · Hover · Pressed |
|---|---|---|---|---|---|
| Blue | `#2D5BD7` | 58.0 | 60 | white | 6.21 · 8.42 · 11.44 |
| Green | `#00A86B` | 37.0 | 35 | black | 7.26 · 6.22 · 5.33 |
| Navy | `#0B2E6B` | 84.2 | 85 | white | 13.25 · 9.85 · 7.23 |
| Orange | `#FF6B00` | 34.5 | 35 | black | 7.24 · 6.21 · 5.35 |

**Hover on any surface.** Low surfaces (`bg/canvas`, `bg/surface`, `bg/surface-sunken`) take the translucent tints `bg/state-hover` and `bg/state-pressed`. Inside menus, popovers, dialogs and raised cards use the solid `bg/item-hover` and `bg/item-pressed` instead. Why: in Dark, lifting a menu or dialog surface even slightly closes the gap to the text on it — brand text measured 2.8 : 1 when we tried a tint there. Rows on a plain surface can also use the solid `bg/surface-hover` and `bg/surface-pressed`.

**Three states people confuse.**

- **Selected** — the chosen one, until changed: `bg/selected` plus a check or bold label; a selected option or card also gets a `border/selected` outline, one pixel wider than a control's (Border foundation).
- **Focused** — where the keyboard is: a 2px `border/focus` ring with a 2px gap. Never removed.
- **Disabled** — exempt from contrast, so explain nearby why it's disabled; never hide information in disabled text.

**Actions**

| Role | Use it for | Light | Dark |
|---|---|---|---|
| `action/primary/bg` | Primary button fill — one per view | `#2A57D1` · brand 60 | `#2A57D1` · brand 60 |
| `action/primary/bg-hover` | Primary button, hovered | `#1E44AE` · brand 70 | `#1E44AE` · brand 70 |
| `action/primary/bg-pressed` | Primary button, pressed | `#163383` · brand 80 | `#163383` · brand 80 |
| `action/primary/fg` | Label and icon on a primary button | `#FFFFFF` · white | `#FFFFFF` · white |
| `action/secondary/bg` | Secondary button fill (matches the surface) | `#FFFFFF` · white | `#232427` · neutral 90 |
| `action/secondary/bg-hover` | Secondary button, hovered | `#DCDDE1` · neutral 10 | `#2E3033` · neutral 85 |
| `action/secondary/bg-pressed` | Secondary button, pressed | `#CBCED2` · neutral 15 | `#373A3E` · neutral 80 |
| `action/secondary/fg` | Label and icon on a secondary button | `#232427` · neutral 90 | `#ECEEF0` · neutral 5 |
| `action/secondary/border` | Secondary button outline — 3:1, it is what shows the button | `#686B72` · neutral 55 | `#888C93` · neutral 40 |
| `action/ghost/bg` | Ghost button: no fill until hovered | `#FFFFFF00` · transparent | `#FFFFFF00` · transparent |
| `action/ghost/bg-hover` | Ghost button, hovered (state layer; inside menus and dialogs use bg/item-hover) | `#0000000F` · black-alpha 6 | `#FFFFFF0A` · white-alpha 4 |
| `action/ghost/bg-pressed` | Ghost button, pressed (state layer; inside menus and dialogs use bg/item-pressed) | `#00000014` · black-alpha 8 | `#FFFFFF14` · white-alpha 8 |
| `action/ghost/fg` | Ghost button label — brand text | `#244DC0` · brand 65 | `#79A2FF` · brand 30 |
| `action/danger/bg` | Destructive button fill | `#AD3831` · danger 60 | `#AD3831` · danger 60 |
| `action/danger/bg-hover` | Destructive button, hovered | `#8E2924` · danger 70 | `#8E2924` · danger 70 |
| `action/danger/bg-pressed` | Destructive button, pressed | `#6C1E1B` · danger 80 | `#6C1E1B` · danger 80 |
| `action/danger/fg` | Label and icon on a destructive button | `#FFFFFF` · white | `#FFFFFF` · white |
| `action/disabled/bg` | Any disabled button (exempt from contrast) | `#DCDDE1` · neutral 10 | `#2E3033` · neutral 85 |
| `action/disabled/fg` | Disabled label (exempt from contrast) | `#888C93` · neutral 40 | `#5D6168` · neutral 60 |
| `action/disabled/border` | Disabled outline (exempt from contrast) | `#CBCED2` · neutral 15 | `#414449` · neutral 75 |

**States**

| Role | Use it for | Light | Dark |
|---|---|---|---|
| `bg/surface-hover` | Hovered row or item | `#DCDDE1` · neutral 10 | `#2E3033` · neutral 85 |
| `bg/surface-pressed` | Pressed row or item | `#CBCED2` · neutral 15 | `#373A3E` · neutral 80 |
| `bg/state-hover` | Hover tint over canvas, surface or sunken | `#0000000F` · black-alpha 6 | `#FFFFFF0A` · white-alpha 4 |
| `bg/state-pressed` | Pressed tint over canvas, surface or sunken | `#00000014` · black-alpha 8 | `#FFFFFF14` · white-alpha 8 |
| `bg/item-hover` | Hovered item inside a menu, popover, dialog or raised card | `#DCDDE1` · neutral 10 | `#2E3033` · neutral 85 |
| `bg/item-pressed` | Pressed item inside a menu, popover, dialog or raised card | `#CBCED2` · neutral 15 | `#232427` · neutral 90 |
| `bg/disabled` | Disabled control fill (exempt from contrast, WCAG 1.4.3 exception) | `#DCDDE1` · neutral 10 | `#2E3033` · neutral 85 |
| `border/focus` | Focus ring | `#2A57D1` · brand 60 | `#6594FF` · brand 35 |
| `border/selected` | Selected or current item: the border of a selected option or card, the bar under the current tab — with a second cue (a check mark, bold text) | `#244DC0` · brand 65 | `#79A2FF` · brand 30 |

**Brand fills**

| Role | Use it for | Light | Dark |
|---|---|---|---|
| `bg/brand` | Solid brand fill (grade 60) — text on it uses color.fg.on-brand | `#2A57D1` · brand 60 | `#2A57D1` · brand 60 |
| `bg/brand-hover` | Hovered solid brand fill | `#1E44AE` · brand 70 | `#1E44AE` · brand 70 |
| `bg/brand-pressed` | Pressed solid brand fill | `#163383` · brand 80 | `#163383` · brand 80 |
| `bg/brand-subtle` | Tinted brand background (alerts, badges) | `#CDDEFF` · brand 10 | `#122B6B` · brand 85 |
| `fg/on-brand` | Text and icons on color.bg.brand | `#FFFFFF` · white | `#FFFFFF` · white |

**Rules**

- **One primary per view.** Two primary buttons make people choose between equals. Make the second one secondary.
- **Ghost buttons don't go in sunken wells.** Brand text on a tinted well lands right on 4.5 : 1 — move the button or use secondary.
- **Never remove the focus ring.** Keyboard users lose their place. Restyle it only through `border/focus`.

---

## Status and data

Four intents say what happened. Data has its own roles for good and bad change and for chart series, tuned so they read for everyone — including people with colour-blindness.

| Intent | Means | Typical words |
|---|---|---|
| `success` | Something finished as expected. | Saved · Sent · Verified |
| `warning` | Needs attention soon; nothing is broken yet. | Expires soon · Almost full · Pending |
| `danger` | Something failed, or can't be undone. | Failed · Rejected · Delete |
| `info` | Neutral news people may want. | New · Updated · Tip |

**Messages** use the tinted background (`bg/success-subtle` …), an icon in the intent colour (`fg/success` …) and normal text (`fg/default`, `fg/muted`). **Badges** use the solid fill (`bg/success` …) with its partner `fg/on-success` … and a word, not just a dot.

**Good and bad change.** Colour says whether a change is good or bad; the arrow says which way it went. They are separate questions: a falling error rate is good news, so it is `fg/positive` with ▼. Decide good or bad per metric, then add the arrow or sign.

The engine keeps positive and negative far enough apart for every common type of colour vision (OKLab distance, minimum 0.10):

| Mode | normal | protanopia | deuteranopia | tritanopia |
|---|---|---|---|---|
| Light | 0.285 | 0.249 | 0.139 | 0.297 |
| Dark | 0.269 | 0.234 | 0.128 | 0.308 |

**Chart series.** Use the eight series in order (`data/chart-1`, `data/chart-2` …). Every pair stays at least 0.07 apart for the three common colour-vision types — the worst pair measures 0.094 in Light and 0.115 in Dark (for comparison, the widely used Okabe-Ito palette scores 0.076) — and every mark keeps 3 : 1 on the surface. Still label series directly or with a legend.

**Status**

| Role | Use it for | Light | Dark |
|---|---|---|---|
| `bg/success` | Solid success fill (grade 60) — text on it uses color.fg.on-success | `#007031` · success 60 | `#007031` · success 60 |
| `bg/success-hover` | Hovered solid success fill | `#005A26` · success 70 | `#005A26` · success 70 |
| `bg/success-pressed` | Pressed solid success fill | `#00441B` · success 80 | `#00441B` · success 80 |
| `bg/success-subtle` | Tinted success background (alerts, badges) | `#BAE9C3` · success 10 | `#003815` · success 85 |
| `fg/success` | Success text and icons — with words or an icon, never colour alone | `#00652C` · success 65 | `#58B770` · success 30 |
| `fg/on-success` | Text and icons on color.bg.success | `#FFFFFF` · white | `#FFFFFF` · white |
| `border/success` | Success outline — a field that passed validation | `#007C37` · success 55 | `#29A051` · success 40 |
| `bg/warning` | Solid warning fill (grade 25) — text on it uses color.fg.on-warning | `#E1A74E` · warning 25 | `#E1A74E` · warning 25 |
| `bg/warning-hover` | Hovered solid warning fill | `#D8982D` · warning 30 | `#D8982D` · warning 30 |
| `bg/warning-pressed` | Pressed solid warning fill | `#CD8A00` · warning 35 | `#CD8A00` · warning 35 |
| `bg/warning-subtle` | Tinted warning background (alerts, badges) | `#FAD8AB` · warning 10 | `#432B00` · warning 85 |
| `fg/warning` | Warning text and icons — with words or an icon, never colour alone | `#774F00` · warning 65 | `#D8982D` · warning 30 |
| `fg/on-warning` | Text and icons on color.bg.warning | `#000000` · black | `#000000` · black |
| `border/warning` | Warning outline — a field that needs attention | `#926100` · warning 55 | `#BD7F00` · warning 40 |
| `bg/danger` | Solid danger fill (grade 60) — text on it uses color.fg.on-danger | `#AD3831` · danger 60 | `#AD3831` · danger 60 |
| `bg/danger-hover` | Hovered solid danger fill | `#8E2924` · danger 70 | `#8E2924` · danger 70 |
| `bg/danger-pressed` | Pressed solid danger fill | `#6C1E1B` · danger 80 | `#6C1E1B` · danger 80 |
| `bg/danger-subtle` | Tinted danger background (alerts, badges) | `#FFD3CE` · danger 10 | `#581A17` · danger 85 |
| `fg/danger` | Danger text and icons — with words or an icon, never colour alone | `#9E302A` · danger 65 | `#F48479` · danger 30 |
| `fg/on-danger` | Text and icons on color.bg.danger | `#FFFFFF` · white | `#FFFFFF` · white |
| `border/danger` | Danger outline — a field in error | `#BB413A` · danger 55 | `#E0665B` · danger 40 |
| `bg/info` | Solid info fill (grade 60) — text on it uses color.fg.on-info | `#0065A2` · info 60 | `#0065A2` · info 60 |
| `bg/info-hover` | Hovered solid info fill | `#005182` · info 70 | `#005182` · info 70 |
| `bg/info-pressed` | Pressed solid info fill | `#003D63` · info 80 | `#003D63` · info 80 |
| `bg/info-subtle` | Tinted info background (alerts, badges) | `#C0E1FF` · info 10 | `#003252` · info 85 |
| `fg/info` | Info text and icons — with words or an icon, never colour alone | `#005B91` · info 65 | `#4DABF3` · info 30 |
| `fg/on-info` | Text and icons on color.bg.info | `#FFFFFF` · white | `#FFFFFF` · white |
| `border/info` | Info outline — a highlighted field or callout | `#0070B1` · info 55 | `#1592E1` · info 40 |

**Data**

| Role | Use it for | Light | Dark |
|---|---|---|---|
| `fg/positive` | A good change, as text — always with an arrow or sign; colour shows good, the arrow shows direction (WCAG 1.4.1) | `#00652C` · success 65 | `#58B770` · success 30 |
| `fg/negative` | A bad change, as text — always with an arrow or sign; colour shows bad, the arrow shows direction (WCAG 1.4.1) | `#9E302A` · danger 65 | `#F48479` · danger 30 |
| `data/positive` | Marks for good changes: bars, sparklines, deltas | `#00883D` · success 50 | `#86CF96` · success 20 |
| `data/negative` | Marks for bad changes: bars, sparklines, deltas | `#7E231F` · danger 75 | `#E0665B` · danger 40 |
| `data/neutral` | Unchanged values | `#686B72` · neutral 55 | `#888C93` · neutral 40 |
| `data/axis` | Chart axes and ticks | `#686B72` · neutral 55 | `#888C93` · neutral 40 |
| `data/gridline` | Chart gridlines (decorative) *Exempt from contrast.* | `#CBCED2` · neutral 15 | `#414449` · neutral 75 |
| `data/chart-1` | Categorical chart series 1 | `#0B54B0` · chart-1.light | `#82A3F0` · chart-1.dark |
| `data/chart-2` | Categorical chart series 2 | `#8C5400` · chart-2.light | `#F1C69A` · chart-2.dark |
| `data/chart-3` | Categorical chart series 3 | `#008BB2` · chart-3.light | `#92D8F2` · chart-3.dark |
| `data/chart-4` | Categorical chart series 4 | `#6A2772` · chart-4.light | `#B465A1` · chart-4.dark |
| `data/chart-5` | Categorical chart series 5 | `#928100` · chart-5.light | `#B0B927` · chart-5.dark |
| `data/chart-6` | Categorical chart series 6 | `#7F5EDF` · chart-6.light | `#9465EE` · chart-6.dark |
| `data/chart-7` | Categorical chart series 7 | `#2D4A34` · chart-7.light | `#00953A` · chart-7.dark |
| `data/chart-8` | Categorical chart series 8 | `#D94E7B` · chart-8.light | `#E6899D` · chart-8.dark |

**Rules**

- **Words first, colour second.** Write the status in words, then add colour and an icon. Never the other way round.
- **Changes always carry an arrow or sign.** Red and green look alike to about 1 in 12 men. The arrow makes the change readable — and it shows direction, which colour doesn't.
- **Decide good or bad per metric.** Fewer errors, lower cost and faster load are good news: `fg/positive` with ▼. Pick the role by meaning, not by direction.
- **Brand is not an intent.** Brand colour means "this is us", not "this worked".

---

## What goes on what

Every text, icon and outline role lists the backgrounds it may sit on, and every listed pair is measured in both modes. **If a pair isn't listed, it isn't supported.** Each cell shows Light · Dark; — means not allowed.

**Text** (needs 4.5 : 1)

|  | `bg/canvas` | `bg/surface` | `bg/surface-raised` | `bg/surface-overlay` | `bg/surface-sunken` | `bg/surface-hover` | `bg/surface-pressed` | `bg/selected` |
|---|---|---|---|---|---|---|---|---|
| `fg/default` | 13.34 · 15.54 | 15.52 · 13.34 | 15.52 · 11.38 | 15.52 · 9.83 | 11.44 · 15.54 | 11.44 · 11.38 | 9.83 · 9.83 | 11.45 · 9.84 |
| `fg/muted` | 8.41 · 9.83 | 9.78 · 8.44 | 9.78 · 7.20 | 9.78 · 6.22 | 7.20 · 9.83 | 7.20 · 7.20 | 6.19 · 6.22 | 7.21 · 6.22 |
| `fg/subtle` | 6.22 · 7.24 | 7.24 · 6.22 | 7.24 · 5.30 | 7.24 · 4.58 | 5.33 · 7.24 | 5.33 · 5.30 | 4.58 · 4.58 | 5.34 · 4.58 |
| `fg/brand` | 6.23 · 7.25 | 7.25 · 6.23 | 7.25 · 5.31 | 7.25 · 4.59 | 5.34 · 7.25 | 5.34 · 5.31 | 4.59 · 4.59 | 5.35 · 4.59 |
| `fg/link` | 6.23 · 7.25 | 7.25 · 6.23 | 7.25 · 5.31 | 7.25 · 4.59 | 5.34 · 7.25 | 5.34 · 5.31 | 4.59 · 4.59 | 5.35 · 4.59 |
| `fg/success` | 6.23 · 7.25 | 7.25 · 6.22 | 7.25 · 5.31 | 7.25 · 4.58 | 5.34 · 7.25 | 5.34 · 5.31 | 4.59 · 4.58 | 5.34 · 4.59 |
| `fg/warning` | 6.22 · 7.27 | 7.23 · 6.24 | 7.23 · 5.32 | 7.23 · 4.60 | 5.33 · 7.27 | 5.33 · 5.32 | 4.58 · 4.60 | 5.34 · 4.60 |
| `fg/danger` | 6.20 · 7.25 | 7.22 · 6.23 | 7.22 · 5.31 | 7.22 · 4.58 | 5.32 · 7.25 | 5.32 · 5.31 | 4.57 · 4.58 | 5.32 · 4.59 |
| `fg/info` | 6.21 · 7.26 | 7.23 · 6.23 | 7.23 · 5.32 | 7.23 · 4.59 | 5.33 · 7.26 | 5.33 · 5.32 | 4.58 · 4.59 | 5.33 · 4.60 |
| `fg/positive` | 6.23 · 7.25 | 7.25 · 6.22 | 7.25 · 5.31 | 7.25 · 4.58 | 5.34 · 7.25 | 5.34 · 5.31 | 4.59 · 4.58 | 5.34 · 4.59 |
| `fg/negative` | 6.20 · 7.25 | 7.22 · 6.23 | 7.22 · 5.31 | 7.22 · 4.58 | 5.32 · 7.25 | 5.32 · 5.31 | 4.57 · 4.58 | 5.32 · 4.59 |

**Icons** (needs 3 : 1)

|  | `bg/canvas` | `bg/surface` | `bg/surface-raised` | `bg/surface-overlay` | `bg/surface-sunken` | `bg/surface-hover` | `bg/surface-pressed` | `bg/selected` |
|---|---|---|---|---|---|---|---|---|
| `fg/icon` | 8.41 · 9.83 | 9.78 · 8.44 | 9.78 · 7.20 | 9.78 · 6.22 | 7.20 · 9.83 | 7.20 · 7.20 | 6.19 · 6.22 | 7.21 · 6.22 |
| `fg/icon-subtle` | 4.59 · 5.35 | 5.34 · 4.60 | 5.34 · 3.92 | 5.34 · 3.39 | 3.93 · 5.35 | 3.93 · 3.92 | 3.38 · 3.39 | 3.94 · 3.39 |

**Outlines that show a control** (needs 3 : 1)

|  | `bg/canvas` | `bg/surface` | `bg/surface-raised` | `bg/surface-overlay` | `bg/surface-sunken` | `bg/surface-hover` | `bg/surface-pressed` | `bg/selected` |
|---|---|---|---|---|---|---|---|---|
| `border/input` | 4.59 · 5.35 | 5.34 · 4.60 | 5.34 · 3.92 | 5.34 · 3.39 | 3.93 · 5.35 | 3.93 · 3.92 | 3.38 · 3.39 | 3.94 · 3.39 |
| `border/strong` | 4.59 · 5.35 | 5.34 · 4.60 | 5.34 · 3.92 | 5.34 · 3.39 | 3.93 · 5.35 | 3.93 · 3.92 | 3.38 · 3.39 | 3.94 · 3.39 |
| `border/focus` | 5.34 · 6.22 | 6.21 · 5.35 | 6.21 · 4.56 | 6.21 · 3.94 | 4.57 · 6.22 | 4.57 · 4.56 | 3.93 · 3.94 | 4.58 · 3.94 |
| `border/selected` | 6.23 · 7.25 | 7.25 · 6.23 | 7.25 · 5.31 | 7.25 · 4.59 | 5.34 · 7.25 | 5.34 · 5.31 | 4.59 · 4.59 | 5.35 · 4.59 |
| `border/danger` | 4.59 · 5.35 | 5.34 · 4.60 | 5.34 · 3.92 | 5.34 · 3.39 | 3.94 · 5.35 | 3.94 · 3.92 | 3.38 · 3.39 | 3.94 · 3.39 |

**Solid fills** take their partner on- colour and nothing else:

| Fill | Text on it | Light · Dark |
|---|---|---|
| `bg/brand` | `fg/on-brand` | 6.21 · 6.21 |
| `bg/success` | `fg/on-success` | 6.25 · 6.25 |
| `bg/warning` | `fg/on-warning` | 9.84 · 9.84 |
| `bg/danger` | `fg/on-danger` | 6.20 · 6.20 |
| `bg/info` | `fg/on-info` | 6.21 · 6.21 |
| `action/primary/bg` | `action/primary/fg` | 6.21 · 6.21 |
| `action/danger/bg` | `action/danger/fg` | 6.20 · 6.20 |

**Tints over surfaces.** Hover and pressed tints are measured on top of each surface they're allowed on:

| Tint | Over | fg/default | fg/muted | fg/brand |
|---|---|---|---|---|
| `bg/state-hover` | `bg/canvas` | 11.73 · 14.15 | 7.39 · 8.95 | 5.48 · 6.60 |
| `bg/state-hover` | `bg/surface` | 13.62 · 11.85 | 8.58 · 7.50 | 6.36 · 5.53 |
| `bg/state-hover` | `bg/surface-sunken` | 10.07 · 14.15 | 6.34 · 8.95 | — |
| `bg/state-pressed` | `bg/canvas` | 11.18 · 12.65 | 7.04 · 8.00 | 5.22 · 5.90 |
| `bg/state-pressed` | `bg/surface` | 13.02 · 10.54 | 8.20 · 6.67 | 6.08 · 4.92 |
| `bg/state-pressed` | `bg/surface-sunken` | 9.66 · 12.65 | 6.09 · 8.00 | — |

The lowest text ratio anywhere in the contract is 4.57 : 1.

**Not allowed** — pairs outside the contract, measured. Each fails in at least one mode, and each has a role that fixes it:

| Mistake | Pair | Light | Dark | Use instead |
|---|---|---|---|---|
| Meta text on a solid brand fill | `fg/subtle` on `bg/brand` | 1.17 : 1 | 2.49 : 1 | `fg/on-brand` |
| Brand text on the brand fill | `fg/brand` on `bg/brand` | 1.17 : 1 | 2.49 : 1 | `fg/on-brand` |
| White text on the warning fill | `fg/on-brand` on `bg/warning` | 2.13 : 1 | 2.13 : 1 | `fg/on-warning` |
| Positive text on a solid success fill | `fg/positive` on `bg/success` | 1.16 : 1 | 2.51 : 1 | `fg/on-success` |
| Muted text on a solid danger fill | `fg/muted` on `bg/danger` | 1.58 : 1 | 3.37 : 1 | `fg/on-danger` |
| Decorative border used as an input outline | `border/subtle` on `bg/surface` | 1.58 : 1 | 1.59 : 1 | `border/input` |

**Rules**

- **Solid fills take their on- colour.** On `bg/brand`, `bg/danger` and the other solids, text is always the matching `fg/on-*`.
- **Unlisted means unsupported.** If you need a pair that isn't here, it's a new role or a new pair — see [Modes and brands](#modes-and-brands).

---

## Choosing and using colour

Two questions get you to the right role almost every time: *what are you colouring?* and *what is its job?* Then check your choice against [What goes on what](#what-goes-on-what).

**A background** — Where does it sit?

| When | Use |
|---|---|
| The page itself | `bg/canvas` |
| A card, panel or table | `bg/surface` |
| Set back inside a card (table head, well, code) | `bg/surface-sunken` |
| Stays above scrolling content (sticky header, toolbar) | `bg/surface-raised` |
| Opens on top (menu, popover, dialog) | `bg/surface-overlay` |
| The selected item | `bg/selected` |
| A message or highlight tint | `bg/{intent}-subtle` |
| Behind a modal dialog | `bg/scrim` |

**Text** — How important is it?

| When | Use |
|---|---|
| Main content and headings | `fg/default` |
| Supporting details | `fg/muted` |
| Meta text, timestamps, placeholders | `fg/subtle` |
| A link (always underlined) | `fg/link` |
| Status words | `fg/{intent}` |
| On a solid fill | `fg/on-{fill}` |
| A good / bad change (with an arrow) | `fg/positive` or `fg/negative` |

**An icon** — Does it carry meaning?

| When | Use |
|---|---|
| Beside a label | `fg/icon` |
| Chevron or decoration | `fg/icon-subtle` |
| Status icon | `fg/{intent}` |
| Inside a button with a label | `action/{kind}/fg` |
| An icon-only button (toolbar, row actions): ghost button with a neutral icon | `fg/icon` |

**An outline** — Would someone miss the control if this line disappeared?

| When | Use |
|---|---|
| Yes — input, checkbox, radio | `border/input` |
| Yes — button, toggle, chip | `border/strong` |
| No — divider, card edge | `border/subtle` or `border/default` |
| Keyboard focus | `border/focus` |
| Field in error | `border/danger` |

**A button** — How important is the action?

| When | Use |
|---|---|
| The main action (one per view) | `action/primary/*` |
| An alternative | `action/secondary/*` |
| Quiet actions, toolbars | `action/ghost/*` |
| Deletes or can't be undone | `action/danger/*` |
| Not available right now | `action/disabled/*` |

**Hover or pressed** — What is underneath?

| When | Use |
|---|---|
| canvas, surface or sunken | `bg/state-hover` or `bg/state-pressed` (translucent tint) |
| Inside a menu, popover, dialog or raised card | `bg/item-hover` or `bg/item-pressed` (solid) |
| A row on a surface (solid) | `bg/surface-hover` or `bg/surface-pressed` |

**Data and charts** — What does it show?

| When | Use |
|---|---|
| A good change (arrow shows direction) | `fg/positive` (text) or `data/positive` (marks) |
| A bad change | `fg/negative` (text) or `data/negative` (marks) |
| No change | `data/neutral` |
| Several series, in order | `data/chart-1` … chart-8 |
| Axes and ticks | `data/axis` |
| Gridlines (decorative) | `data/gridline` |

**Worked example — a project row.** Coloured one decision at a time:

| Part | Role | Why |
|---|---|---|
| The row | `bg/surface` | It sits on a card. |
| Project name | `fg/default` | It is the main content. |
| Team and size | `fg/muted` | They support the name. |
| "▲ 8 done this week" | `fg/positive` + ▲ | A good change — colour plus arrow. |
| Divider | `border/subtle` | It only separates rows. |
| "+ New" | `action/ghost` | A quiet action inside a card. |

**Do and avoid**

| Do | Avoid | Why it matters |
|---|---|---|
| Show change with an arrow: ▲ +2.4% | Colour alone: +2.4% in green | Red and green look alike to many people. The arrow carries the meaning. |
| Underline links | Links shown by colour only | Without an underline, a link is just blue text to anyone who can't tell blue from black. |
| `action/primary/fg` on the primary fill | `fg/brand` on the brand fill | Brand text on the brand fill is 1.17 : 1 — the label disappears. |
| Inputs use `border/input` | Inputs with `border/subtle` | If people can't see a field's edge, they can't find where to type. |

---

## Modes and brands

Dark mode is remapped, not inverted, and your brand is one input to the engine. Design once with roles; the mode and the brand do the rest.

**How roles move between modes.** In Light, text points to dark shades (high grades) and backgrounds to light ones; in Dark it's the other way round. The gap between them stays 50 or more either way.

| Role | Light points to | Dark points to |
|---|---|---|
| `bg/canvas` | neutral 5 | neutral 95 |
| `bg/surface` | white | neutral 90 |
| `bg/surface-raised` | white | neutral 85 |
| `bg/surface-overlay` | white | neutral 80 |
| `fg/default` | neutral 90 | neutral 5 |
| `fg/muted` | neutral 75 | neutral 20 |
| `fg/subtle` | neutral 65 | neutral 30 |
| `fg/brand` | brand 65 | brand 30 |
| `border/input` | neutral 55 | neutral 40 |
| `border/focus` | brand 60 | brand 35 |

**Switching modes.** In Figma, set the frame's Color mode in the right panel. In code, set `data-theme="dark"` (or `"light"`) on `<html>`; without it the page follows the system setting.

**Checking a design in Dark** — four checks before handoff:

- **Switch the frame, not the colours.** Change the mode; don't swap role names.
- **Look for anything that didn't change.** It's a raw hex or a shade — replace it with a role.
- **Check images.** White backgrounds inside images glow in Dark. Use transparent images or put a surface behind them.
- **Don't trust shadows.** Shadows fade on dark surfaces; floating things also need their lighter surface and an outline.

**What a brand change touches**

| Follows your brand | Fixed on purpose |
|---|---|
| The brand scale and every brand role | Success, warning, danger and info hues |
| Primary buttons, links, selection, focus | Positive and negative change |
| Neutral greys, tinted slightly towards your hue | The chart palette |
| The label colour on the brand fill | Every contrast rule and check |

**Changing the brand.** Set `color.brand` in the engine config, build, read the report, then import the new variables into Figma and ship the new `tokens.css`. Nothing in designs or code needs renaming.

**Adding a role.** First check [Choosing and using colour](#choosing-and-using-colour) — most needs already have a role. If none fits, name the new role by its job, not its colour, pick its Light and Dark grades with the gap rule against everything it will touch, and add it to the engine config. The build measures every pair and stops if one fails; when it passes, the role is in Figma, CSS, Tailwind, this guide and the AI contract at once. Wanting a one-off colour is the signal to add a role — never to use a shade.

```json
{
  "color": {
    "roles": [
      {
        "name": "color.bg.highlight",
        "light": "warning.5",
        "dark": "warning.90",
        "description": "Highlights a new or changed row for a few seconds",
        "carries": [
          "color.fg.default",
          "color.fg.muted",
          "color.fg.link"
        ]
      },
      {
        "name": "color.border.highlight",
        "light": "warning.45",
        "dark": "warning.40",
        "description": "Outline of a highlighted row",
        "on": [
          "color.bg.surface",
          "color.bg.canvas"
        ]
      }
    ]
  }
}
```

A background lists the roles it `carries`; a text, icon, outline or data colour lists the backgrounds it sits `on`. Shades are written as `hue.grade` (or `white` / `black`) — never hex; the engine solves the colour.

---

## Accessibility reference

What the build checks for colour, and the result for this build:

| Check | What it checks | WCAG | Result |
|---|---|---|---|
| C1 | Text contrast ≥ 4.5:1 on every allowed background | 1.4.3 (AA) | pass · 374/374 pass |
| C3 | Borders, focus rings and chart marks ≥ 3:1 against their backgrounds | 1.4.11 (AA) | pass · 210/210 pass |
| C4 | Icons ≥ 3:1 against every background they are allowed on | 1.4.11 (AA) | pass · 176/176 pass |
| C6 | Body text against AAA 7:1 (report only) | 1.4.6 (AAA) | pass · 12/12 pass |
| C5 | Positive/negative change (≥ 0.1) and chart colours (≥ 0.07) stay distinct for protanopia, deuteranopia, tritanopia (OKLab distance) | 1.4.1 (A) | pass · 58/58 pass |
| F2 | Focus ring ≥ 2px thick with an offset (colour checked in C3) | 2.4.7, 2.4.13 (AA) | pass · 2/2 pass |
| E1 | Whatever floats keeps an edge — never shadow alone (forced colours remove shadows) — and a modal has its scrim | 1.4.11 (AA) | pass · 9/9 pass |
| X1 | Every alias resolves; foundations are linked, not copied | — | pass · 20/20 pass |

**Glossary**

| Term | Meaning |
|---|---|
| Grade | A shade's darkness from 0 (white) to 100 (black), defined by its contrast with white. |
| Shade / primitive | A raw colour value such as brand 60. Hidden; never used directly. |
| Role | A named job such as bg/surface that points to a shade per mode. |
| Pair | A foreground role and a background role that are allowed together, with a minimum ratio. |
| On- colour | The text role made for a solid fill, such as fg/on-brand on bg/brand. |
| Tint | A see-through layer (hover, pressed, scrim) measured over the surface below it. |
| Mode | Light or Dark. Switching mode changes which shade each role points to. |
| Exempt | A role WCAG doesn't require contrast for: disabled colours and purely decorative lines. |
