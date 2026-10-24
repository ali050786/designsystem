# DSS Elevation Foundation — teardown, 23 Oct 2026

Source: `surf/Elevation Foundation.fig`, opened in FigCraft (variables, modes, aliases and scopes, the effect styles and
their bindings, every layer's effects and style links, and every text layer read directly, not from images). Shadow
visibility measured in Chromium: each recipe drawn under a 240 × 120px card and the pixels around it read back.
Page PDFs for reference: `surf/elevation_foundation/`. Reference only — nothing here is copied into `product/`.

## Structure
- Four elevation collections: `elevation-depth` (5 numbers, 0–4), `elevation-primitives` (17 shadow parts: 5 y-offsets,
  7 blurs, 5 spreads), `elevation-semantic` (6 "plane" tokens: canvas, section, surface, raised, overlay, elevated, each an
  alias of a depth number) and `effect` (8 shadow colours, two per level, with Light and Dark modes). Plus the two leftover
  collections every Surf file carries (`Collection 1`, `Measurements`).
- 6 effect styles, `elevation/shadow/0`–`4` (two recipes per style: a direct and an ambient shadow).
- Pages: principles (10), surface model, levels, layering rules, interaction, token structure, depth, primitives, semantic
  tokens, pairing rules, decision matrix, usage rules. Every page is a table. 1,647 layers, 660 of them text.

## What works
- Surfaces are named by role (canvas, section, surface, raised, overlay, elevated), and the role is chosen before the look.
- "Restraint" and "Layout-first escalation": use the lowest level that works, and fix grouping and spacing before adding
  height. Few systems say when not to lift something.
- Interaction lift is temporary: hover, press and drag change the look, never the resting role; press moves *down*.
- The scrim (overlay) is treated as a support layer that only exists with a dialog above it, and is removed with it.
- Two-part shadows (a tight direct shadow and a wider ambient one) with negative spread, so larger shadows don't bleed
  sideways.

## Quality problems found (measured)

### Three numbering systems for the same stack
| Role | Depth variable | "Elevation Levels" page | "Layering Rules" page | Shadow style |
|---|---|---|---|---|
| Canvas | 0 | Level 0 | 0 | none (`shadow/0`) |
| Section | 0 | Level 0 | **1** | none (`shadow/0`) |
| Surface | 1 | Level 1 | **2** | `shadow/1` |
| Raised | 2 | Level 2 | **3** | `shadow/2` |
| Overlay | 3 | Level 3 | **4** | none |
| Elevated | 4 | Level 4 | **5** | `shadow/3` **and** `shadow/4` |
| Temporary lift | — | — | **6** | — |

- Every role except canvas has two different numbers depending on the page, and the shadow number matches neither from
  the overlay up. `shadow/3` belongs to no level of its own: the semantic page lists it beside `shadow/4` for Elevated.
- "Temporary lift" is a layer on one page and a state on another, with no token.
- The scrim (overlay) takes a whole level, so the system's "levels" mix surfaces and a backdrop.

### Menus, popovers, tooltips, toasts and sticky bars have no level
- None of these words appears in 660 text layers. "Open, non-blocking → move to Elevated" puts a dropdown menu on the same
  level, surface and shadow as a modal dialog. A menu opened inside a dialog then has nowhere higher to go.
- Nothing covers a sticky header: content scrolls under it, so it needs a stacking rule more than a shadow.

### Depth numbers are stacking order on paper only
- "z-order" appears once ("raw integer values defining the z-order stacking position"); the depth variables are 0–4 with
  canvas and section **tied at 0**, so they can't be used as `z-index` (no gaps, ties, nothing above a dialog for a toast or
  a dragged item). No `z-index` value exists anywhere.
- All 11 depth and plane variables have **empty scopes**: hidden from every Figma picker, bound to no layer. They do nothing.

### The plane tokens hold one number, not a surface
- The token-structure page says each plane is "combined with a background color alias and a composed shadow effect". The
  variables are one FLOAT each (an alias of a depth number). The colour aliases the semantic page prints
  (`color.bg.base.canvas` … `color.bg.base.elevated`) don't exist in this file, and nothing links a plane to its shadow style.

### Dark mode exists in the variables and nowhere else
- The `effect` collection has Light and Dark shadow colours (Dark alphas 0.20–0.60, 3–6× Light). The six effect styles are
  **bound to none of them** (0 bindings): their colours are fixed Light alphas, so switching a frame to Dark changes nothing.
- Measured: even the Dark alphas barely show. On a dark page (#121212, the file defines no dark surfaces) the strongest
  shadow peaks at **1.075:1** against the page and `shadow/1` at **1.057:1**; Light `shadow/4` on white peaks at 1.558:1.
  A black shadow on a near-black page has almost nothing to darken.
- The "Mode consistency" principle asks for "equivalent perceptual weight in both light and dark modes". With shadows that
  can't show on dark backgrounds, height in Dark has to come from the surface (lighter as it rises) or an edge. The file
  says neither; "dark" appears twice in 660 text layers.

### Neighbouring levels can't be told apart — by the file's own rule
"Hierarchy contrast" requires a visible difference between adjacent levels. Measured, white card on white page (how the
file draws them), the darkest shadow pixel against the page:

| Style | Peak contrast with the page | How far it reaches below the card |
|---|---|---|
| `shadow/1` | 1.15:1 | 1px |
| `shadow/2` | 1.23:1 | 3px |
| `shadow/3` | 1.28:1 | 10px |
| `shadow/4` | 1.56:1 | 20px |

- Surface and raised differ by 0.08 of a contrast ratio and 2px of shadow; the card's only edge at level 1 is a 1px line at
  1.15:1. All surfaces are white on white, so the shadow is the only thing separating them.

### The file draws its shadows by hand
- Four layers carry a shadow, all on the semantic page, all pasted values: **none uses an effect style** (every layer's
  effect-style link is empty). No page shows a card, a menu, a dialog over a scrim, a sticky header or a dragged item.
- Two effect styles share the name `elevation/shadow/0` (one with a description, one empty).

### The token pages print placeholders
- Primitive table: `shadow.y-axis.2`, `.4`, `.8` and `.12` all read **"400"** (the variables are 2, 4, 8, 12). Same pattern as the
  spacing, layout, radius and border files.

### Accessibility: not mentioned
- "WCAG" appears **0** times. Nothing on:
  - **Forced colours (Windows High Contrast):** browsers drop `box-shadow` there, so a card, menu or dialog separated by its
    shadow alone loses its edge entirely. No border rule for floating surfaces.
  - **Focus not obscured (2.4.11):** raised and sticky layers can cover a focused element; no rule.
  - **Modal behaviour:** the "blocking" pair says it "blocks background interaction" but nothing about moving focus into the
    dialog, keeping it there, making the background inert, Escape, or returning focus on close.
  - **Hover lift as the only cue:** the interaction page lets hover add shadow; a shadow change is close to invisible in Dark
    (above) and gone in forced colours, so it can't be the only sign that something is interactive.
  - **Scrim strength:** the overlay's colour and opacity are never given, so neither its dimming nor the dialog's edge
    against it can be checked.

### Names
- Pages write tokens with dots (`plane.raised`, `shadow.y-axis.1`), variables use slashes; no code syntax on any variable.
- Primitive names mix numbers and words for negatives (`spread/n4` = −4).

## What we do differently (ideas only, our own design)
- **One stack, one numbering:** levels for surfaces only; the scrim is a part of the dialog's level, not a level. Every
  floating thing (menu, popover, tooltip, toast, sticky bar, dialog, dragged item) has a named place in a stacking scale
  with gaps, shipped as `z-index` tokens, so a menu inside a dialog and a toast over a dialog both have an answer.
- **Height in Dark by surface, not shadow:** surfaces get lighter as they rise (measured, not assumed); shadows stay for
  Light and are checked for visibility in both modes.
- **Floating surfaces keep an edge:** anything that floats over content has a real border, so it survives forced colours
  and a dark page; the audit runs in Chromium's real forced colours.
- **Shadows bound to colour roles:** effect styles bound to the Light/Dark shadow colours, so a frame in Dark mode shows
  Dark shadows; examples use the styles, never pasted values.
- **Modal rules with the scrim:** focus moves in, stays, returns; background inert; the dialog's edge measured against the
  scrim. Focus never hidden under a sticky or raised layer (2.4.11), checked in the browser.
- **Real examples:** cards, a menu, a dialog over its scrim, a sticky header and a dragged item, drawn with the tokens.
