# Elevation rules for AI tools — ds

Generated from the engine (20 tokens; 6 levels, 5 layers; all checks pass). The same data in machine-readable form: `elevation.contract.json`.

## How to use this file
1. Decide with the **Decision guide** whether it needs height at all, then which level — by what it does to the page, not by how strong a shadow you want.
2. Take the whole level: the class (`.ds-floating` …) or its surface, shadow, edge and layer together.
3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.
4. Before answering, run the **Self-check**.

## Hard rules
| ID | Rule | Why | WCAG |
|---|---|---|---|
| ER-01 | Shadows come from a level: box-shadow is var(--ds-elevation-`<job>`-shadow) or none (Tailwind shadow-raised, shadow-sticky, shadow-floating, shadow-modal, shadow-dragging). No shadow written by hand, none of Tailwind's own (shadow-sm … shadow-2xl, drop-shadow-*), no filter: drop-shadow() on a surface. | A hand-made shadow belongs to no level: it doesn't grow with height, doesn't switch for Dark, and nobody can tell what sits on what. | — |
| ER-02 | Never use the shadow colours or alpha primitives in a shadow (--ds-color-shadow-*, --ds-color-black-alpha-*). Pick the level. | They are the strengths the levels pick from; a shadow made from them by hand skips the order the build checks. | — |
| ER-03 | A level's surface and shadow go together: the shadow of floating goes on the floating surface, never on a card's. Use the class (.ds-raised … .ds-dragging) to take the whole level. | In Dark the surface is what shows height; a floating shadow on a raised surface sits at one height and looks like another. | — |
| ER-04 | Whatever floats has its edge: floating, modal and dragging draw border: var(--ds-border-width-line) solid var(--ds-elevation-`<job>`-border) on every side; a sticky bar draws its line on the side facing the content. | Forced colours remove every shadow, and in Dark a shadow barely shows: without a border a menu has no edge and its items run into the page. | 1.4.11 |
| ER-05 | Stacking uses layers: z-index is var(--ds-layer-`<job>`) (Tailwind z-(--ds-layer-floating)). Raw numbers only -1, 0, 1 and 2, for order inside one component. Never 999 or 9999. | Stray numbers race each other: a dropdown at 9999 paints over an open dialog and its scrim, and a sticky header at 1000 covers the menu opened from it. | 2.4.11 |
| ER-06 | A modal is modal: a `<dialog>` opened with showModal() (not the open attribute), its ::backdrop the scrim (var(--ds-elevation-modal-scrim)). A dialog built without `<dialog>` has role="dialog", aria-modal="true", a .ds-scrim behind it, focus moved in and held, the page behind made inert, Escape to close, and focus returned on close. | Without it, keyboard and screen-reader users walk out of the dialog into a page they can't see past the scrim. | 2.4.3, 4.1.2 |
| ER-07 | Height in Dark comes from the tokens: never override shadows or level surfaces for dark mode ([data-theme="dark"] or prefers-color-scheme rules that set box-shadow or an elevation background). | The tokens already switch: Dark lifts surfaces (lighter as they rise) because a darker shadow on a near-black page measures almost nothing. | — |
| ER-08 | Hover and press never lift alone: a :hover or :active rule that changes box-shadow also changes the fill (color.bg.surface-hover), a border colour or an outline. Press goes back down, never up. | A shadow change is removed in forced colours and barely shows in Dark: for many people nothing happens under the pointer. | 1.4.11 |
| ER-09 | No glass: floating and modal surfaces are opaque — no backdrop-filter, no translucent background, no opacity on the surface. | Text contrast on a see-through surface depends on whatever scrolls behind it, so it can't be measured — and it fails exactly when the page behind is busy. | 1.4.3 |
| ER-10 | Never redefine elevation or layer variables in app code (--ds-elevation-*, --ds-layer-*). Add a product layer in the engine config (elevation.layers) and build. | An overridden level skips the checks that keep edges visible, surfaces rising in Dark and layers in order. | — |

## Decision guide

**Does it need height at all** — What should set it apart?

| When | Use |
|---|---|
| Things that belong together, with room around them | `space` (Spacing: a bigger stack or inline gap) — no level |
| A region of the page (a sidebar, a band, a well) | a surface change (`color.bg.surface-sunken`) or a `border.width.line` edge — no shadow |
| Many cards side by side (a dashboard, a grid of results) | `elevation.raised`, or only a `border.width.line` outline: a page of shadows is noise |
| Something that sits over other content | a level from the next table — the higher it sits, the more it interrupts |

**Which level** — Where does it sit, and what does it do to the page?

| When | Use |
|---|---|
| It is the page, or lies flat in it | `elevation.page` — the page surface, no shadow |
| It groups content in the flow of the page (a card, a panel, a table frame) | `elevation.raised` (`.ds-raised`) |
| It stays while content scrolls under it (the page header, a toolbar, a sticky table header) | `elevation.sticky` (`.ds-sticky`; `data-stick="end"` for a bar along the bottom) |
| It opens over content and the page stays usable (a menu, popover, tooltip, toast, date picker, the navigation drawer) | `elevation.floating` (`.ds-floating`), opened as a `popover` so it sits in the top layer |
| It must be answered or closed before the page can be used (a dialog, a sheet, a modal drawer) | `elevation.modal` (`.ds-modal`) on a ``<dialog>`` opened with `showModal()`: the scrim, the edge and the layer come with it |
| It is being dragged | `elevation.dragging` (`.ds-dragging`) while it is held; back to its own level when dropped |

**Stacking** — What has to be on top?

| When | Use |
|---|---|
| A menu opened from the sticky header | nothing to do: `layer.floating` is above `layer.sticky` |
| A menu, select or tooltip inside a dialog | open it as a `popover` (top layer: it goes above the dialog) — or keep it inside the dialog's own box; never a bigger z-index |
| A menu inside a card or table that clips (overflow: hidden or auto) | a `popover`: the top layer is never clipped by a parent; a z-index can't escape overflow |
| A toast while a dialog is open | `layer.toast` (`.ds-floating` `data-layer="toast"`), opened as `popover="manual"` after the dialog; it must not need an action, because the page outside the dialog is inert |
| Something the system doesn't have a place for (a banner over sticky bars, a help panel) | a product layer in the config (`elevation.layers`, "above": the layer below it) — the number is computed |

**Moving** — Does it change while someone uses it?

| When | Use |
|---|---|
| Hover on something clickable (a card that is a link) | `color.bg.surface-hover` or a border colour — a bigger shadow may come with it, never alone |
| Press | back to its resting level (never higher): it moves toward the page |
| Keyboard focus | the focus ring (tokens.css draws it) — never a shadow |
| Drag | `elevation.dragging` while held, plus a keyboard way to move it (buttons or arrow keys); back to its level on drop |

## Levels
Lowest first. Light shows height mostly by shadow (surfaces are white); Dark by lighter surfaces. "Shadow on the page" is how dark the shadow gets just under the surface's edge.

| Level | Class | Surface (Light · Dark) | Shadow (y / blur / spread) | Shadow on the page (Light · Dark) | Edge | Layer | Use |
|---|---|---|---|---|---|---|---|
| `elevation.page` | — | `color.bg.canvas` #ECEEF0 · #161618 | — | — | — | — | The page itself and what lies flat in it: the page background, bands, wells |
| `elevation.raised` | `.ds-raised` | `color.bg.surface` #FFFFFF · #232427 | 1 / 3 / 0px, `color.shadow.1` | 1.12 · 1.04 | — | — | Cards, panels and table frames in the flow of the page |
| `elevation.sticky` | `.ds-sticky` | `color.bg.surface-raised` #FFFFFF · #2E3033 | 2 / 6 / 0px, `color.shadow.2` | 1.21 · 1.05 | `color.border.subtle`, the side facing the content | `layer.sticky` | Bars that stay while content scrolls under them: the page header, toolbars, sticky table headers, a settings bar |
| `elevation.floating` | `.ds-floating` | `color.bg.surface-overlay` #FFFFFF · #373A3E | 4 / 16 / -2px, `color.shadow.3` | 1.23 · 1.05 | `color.border.floating`, all | `layer.floating` | What opens over content without blocking it: menus, popovers, tooltips, toasts, date pickers, the navigation drawer |
| `elevation.modal` | `.ds-modal` | `color.bg.surface-overlay` #FFFFFF · #373A3E | 8 / 32 / -4px, `color.shadow.4` | 1.30 · 1.06 | `color.border.floating`, all | `layer.modal` | What blocks the page until it is answered or closed: dialogs, sheets, modal drawers — always with the scrim behind |
| `elevation.dragging` | `.ds-dragging` | its own | 12 / 48 / -6px, `color.shadow.4` | 1.30 · 1.06 | `color.border.floating`, all | `layer.dragging` | An item while it is being dragged: it keeps its own surface, lifts above everything, and returns to its level when dropped |

Shadows are computed from each level's height: offsetY = max(1, ceil(height / 2)), blur = max(3, 2 × height), spread = −floor(height / 4); colour = the level's color.shadow step.

## Stacking order
The browser's top layer sits above every z-index: a <dialog> opened with showModal() and an element with the popover attribute go there, in the order they opened. Layer numbers order everything else.

| Layer | z-index | CSS | Tailwind | What sits there |
|---|---|---|---|---|
| `layer.sticky` | 100 | `var(--ds-layer-sticky)` | `z-(--ds-layer-sticky)` | Sticky bars and the page header: above the content that scrolls under them |
| `layer.floating` | 200 | `var(--ds-layer-floating)` | `z-(--ds-layer-floating)` | Menus, popovers, tooltips and the navigation drawer: above sticky bars, so a menu opened from the header is never cut by it |
| `layer.modal` | 300 | `var(--ds-layer-modal)` | `z-(--ds-layer-modal)` | Dialogs and their scrim: above everything the page shows, so nothing outside the dialog can be reached |
| `layer.toast` | 400 | `var(--ds-layer-toast)` | `z-(--ds-layer-toast)` | Toasts and status messages: above dialogs, so a message is never hidden behind a scrim (it must not need an action while a dialog is open) |
| `layer.dragging` | 500 | `var(--ds-layer-dragging)` | `z-(--ds-layer-dragging)` | An item being dragged: above everything while the pointer or keyboard holds it |

Raw z-index numbers only for order inside one component: -1, 0, 1, 2.

- Dialog: `<dialog class="ds-modal" aria-labelledby="…"> … </dialog> opened with dialog.showModal(); its ::backdrop is the scrim; Escape closes it; return focus to the opener`
- Popover: `<div class="ds-floating" popover id="menu"> … </div> with <button popovertarget="menu">: light dismiss, Escape, never clipped by a parent`
- Toast: `<div class="ds-floating" data-layer="toast" popover="manual" role="status"> … </div>, shown after any open dialog`

## Edges
The edge of whatever floats reaches 1.5:1 against every surface it can sit on (page, raised, sticky, another floating surface) and against the scrim, in Light and Dark. Lowest measured: floating 1.68:1 (Light, on page) · 1.58:1 (Dark, on floating); modal 1.59:1 (Light, on page) · 1.58:1 (Dark, on floating); dragging 1.58:1 (Light, on page) · 1.58:1 (Dark, on floating).

## Dark mode
In Dark each rising level is lighter than the one below (≥ 1.1:1); floating and modal share the top surface and the scrim tells a modal apart. Surfaces in Dark: page #161618 (1.00:1 over the page) · raised #232427 (1.16:1 over the page) · sticky #2E3033 (1.37:1 over the page) · floating #373A3E (1.58:1 over the page) · modal #373A3E (1.58:1 over the page).

## Modal dialogs
- open with showModal() (or role="dialog" + aria-modal="true" + .ds-scrim when `<dialog>` can't be used)
- a label: aria-labelledby pointing at the dialog's heading
- focus moves into the dialog when it opens (the first field, or the dialog itself)
- focus stays inside while it is open; the page behind is inert
- Escape closes it (unless closing would lose work: then it asks)
- focus returns to the control that opened it
- Scrim: `.ds-modal::backdrop { background: var(--ds-elevation-modal-scrim); }`

## Forced colours
Forced colours (Windows contrast themes) remove every box-shadow and replace surfaces with the system page colour: every level looks flat. Borders stay, drawn in the system text colour.

**tokens.css already:** .ds-floating, .ds-modal and .ds-dragging draw a border on every side, .ds-sticky on the side facing the content; the drawer pane of .ds-shell draws its edge.

**You:**
- never remove the border of a floating level (ER-04)
- show hover and press with something besides the shadow (ER-08)
- keep focus rings on: a shadow is never a focus indicator

## Classes
| Class | What it is | Tailwind equivalent |
|---|---|---|
| `.ds-raised` | Cards, panels, table frames in the flow of the page: raised surface and shadow | `bg-elevation-raised-surface shadow-raised` |
| `.ds-sticky` | A bar that stays while content scrolls under it: sticky at the top, sticky layer, surface, shadow and a line on its bottom edge (data-stick="end": at the bottom, line on top) | `sticky top-0 z-(--ds-layer-sticky) bg-elevation-sticky-surface shadow-sticky border-b-line border-elevation-sticky-border` |
| `.ds-floating` | Menus, popovers, tooltips, toasts, the navigation drawer: floating layer, surface, shadow and an edge on every side (data-layer="toast": the toast layer) | `z-(--ds-layer-floating) bg-elevation-floating-surface shadow-floating border-line border-elevation-floating-border` |
| `.ds-modal` | Dialogs and sheets: modal layer, surface, shadow, edge; its ::backdrop is the scrim | `z-(--ds-layer-modal) bg-elevation-modal-surface shadow-modal border-line border-elevation-modal-border backdrop:bg-elevation-modal-scrim` |
| `.ds-scrim` | The scrim for a modal that is not a `<dialog>`: fixed over the page, just before the dialog in the same layer | `fixed inset-0 z-(--ds-layer-modal) bg-elevation-modal-scrim` |
| `.ds-dragging` | An item while it is dragged: the dragging layer, shadow and edge; it keeps its own surface | `relative z-(--ds-layer-dragging) shadow-dragging border-line border-elevation-dragging-border` |

## Limits the build enforces
| Limit | Value |
|---|---|
| Edges | whatever floats has a border; ≥ 1.5:1 against every surface it can sit on and the scrim, Light and Dark (E1, E3) |
| Dark | each rising level lighter than the one below, ≥ 1.1:1 (E2) |
| Shadows | a higher level drops further, blurs wider and is at least as dark (E4) |
| Text | every text colour measured on every level surface (E5) |
| Layers | sticky < floating < modal < toast < dragging, 100 apart; product layers computed in between (E6) |

## Common mistakes (measured)
| Mistake | Measured | Use instead |
|---|---|---|
| A menu set apart from the page by its shadow alone | its shadow reaches 1.23:1 against the page in Light and 1.05:1 in Dark; forced colours remove it altogether — the menu's items run into the page | `.ds-floating` — the edge `elevation.floating.border`: at least 1.68:1 (Light) and 1.58:1 (Dark) against anything a menu can sit on, measured beside its own shadow, and kept in forced colours |
| Darker shadows for dark mode | even at 56% black, the modal shadow reaches 1.06:1 on the Dark page — there is almost nothing left to darken | `the level surfaces` — in Dark the floating surface is 1.58:1 lighter than the page; the tokens switch by themselves |
| z-index: 9999 on a dropdown | it is above `layer.modal` (300) and `layer.dragging` (500): left open, it paints over a dialog and its scrim | `var(--ds-layer-floating)` — 200: above sticky bars (100), below dialogs (300); a popover sits in the top layer and is never clipped |
| A dialog on the card surface (color.bg.surface) in Dark | against the scrim over the page it reaches 1.29:1, and it looks like one more card | `.ds-modal` — 1.75:1 for the modal surface, plus its edge (2.77:1) |
| A card that shows hover only by a bigger shadow | in Dark the raised and sticky shadows reach 1.04:1 and 1.05:1 (1/3px against 2/6px) — the change is close to invisible, and gone in forced colours | `color.bg.surface-hover` — 1.36:1 against the card in Light; the shadow may change too, never alone |
| A frosted-glass menu (backdrop-filter: blur, translucent background) | its text contrast depends on whatever scrolls behind it, so no build can measure it — it fails exactly when the page behind is busy | `elevation.floating.surface` — opaque: every text colour measured on it (E5) |
| A `<dialog>` shown with the open attribute | it opens without the top layer, the backdrop or an inert page: Tab walks out of the dialog into the page behind it | `dialog.showModal()` — top layer, ::backdrop scrim, page inert, Escape closes; return focus to the button that opened it |

## Self-check before answering
- [ ] Each thing with height needs it (space, a surface change or a line didn't do the job), and its level says what it does: raised, sticky, floating, modal or dragging.
- [ ] Every `box-shadow` is a `var(--ds-elevation-<job>-shadow)` on the same level's surface (or the class); no hand-made shadows, no Tailwind `shadow-sm`…`shadow-2xl`.
- [ ] Floating, modal and dragging have a `border.width.line` edge in `elevation.<job>.border`; sticky bars a line toward the content.
- [ ] Every `z-index` is a `var(--ds-layer-<job>)` (or −1…2 inside one component); menus that could be clipped are popovers.
- [ ] Dialogs are `<dialog>` opened with `showModal()`, labelled, scrim behind, focus in, held and returned.
- [ ] No dark-mode shadow overrides, no glass, no hover shown by shadow alone.
- [ ] No elevation or layer variables redefined.
