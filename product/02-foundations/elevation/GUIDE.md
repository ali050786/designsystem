# Elevation

*ds foundations · elevation · the written guide. Generated from the engine — 20 tokens, 6 levels, 5 layers; every elevation check passing. Do not edit by hand; change the engine config and build again.*

This guide explains how ds shows what sits on top of what: when something needs height at all, the six levels named by what they do, how shadows are computed, how Dark mode shows height without them, the edge everything that floats keeps, the stacking order, and how dialogs, menus and dragged items behave. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after [Choosing a level](#choosing-a-level); developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (`elevation.md`, `elevation.contract.json`).

**Contents**

- [Five principles](#five-principles)
- [How tokens are built](#how-tokens-are-built)
- [Levels by job](#levels-by-job)
- [Shadows](#shadows)
- [Height in Dark](#height-in-dark)
- [Edges](#edges)
- [The stacking order](#the-stacking-order)
- [Dialogs and the scrim](#dialogs-and-the-scrim)
- [Lifting and dragging](#lifting-and-dragging)
- [Choosing a level](#choosing-a-level)
- [Readers' settings and products](#readers-settings-and-products)

---

## Five principles

Five principles shape every level. Each one is checked by the build or the elevation audit, not left to taste.

| Principle | What it means in practice |
|---|---|
| **Height is a last resort** | Space groups things, a surface change sets a region apart, a line separates. A level is for something that really sits over something else — the higher it sits, the more it interrupts. |
| **A level says what it does** | Six levels named by job — page, raised, sticky, floating, modal, dragging — not by number. "Floating" tells you a menu goes there; "level 3" tells you nothing, and a number changes meaning the day a level is added. |
| **Whatever floats keeps an edge** | Floating, modal and dragging draw a border on every side, sticky bars a line toward the content. Forced colours remove shadows and Dark barely shows them, so the edge is what's left (E1: 9/9 pass; E3: 28/28 pass). |
| **Dark shows height by surface** | A black shadow on a near-black page has almost nothing to darken. In Dark each level is lighter than the one below (E2: 8/8 pass). |
| **One stacking order** | sticky < floating < modal < toast < dragging, as layer tokens with room between them; dialogs and menus use the browser's top layer. No z-index races (E6: 7/7 pass). |

---

## How tokens are built

Elevation tokens live in one collection and point into Colour for everything you see.

| Collection | Modes | Elevation tokens in it | Changes with |
|---|---|---|---|
| **Elevation** | one | Per level: a surface (`elevation/<job>/surface`), a shadow (`elevation/<job>/shadow`, an effect style in Figma), an edge (`elevation/<job>/border`) and, for modal, the scrim; the stacking order (`layer/*`, code only) | Colour's Light and Dark modes (every surface, edge and shadow colour is a link), and the product's own layers (`elevation.layers`) |
| **Color** (Colour foundation) | Light, Dark | What the levels link to: `color/bg/canvas`, `surface`, `surface-raised`, `surface-overlay`, `color/border/floating`, `color/border/subtle`, `color/bg/scrim` and the shadow strengths `color/shadow/1`…`4` | the theme |

**Reading a name.** `elevation / floating / border` — category `elevation`, level `floating`, part `border`. Levels are named by what they do. The shadow strengths in Colour stay numbered (`color/shadow/1`…`4`): they are a scale the levels pick from, like the border widths, not places people choose.

**One name, three places.**

| Figma | CSS variable | Tailwind |
|---|---|---|
| `elevation/floating/border` | `--ds-elevation-floating-border` | `border-elevation-floating-border` |
| `elevation/floating (effect style)` | `--ds-elevation-floating-shadow` | `shadow-floating` |
| — (code only) | `--ds-layer-floating` | `z-(--ds-layer-floating)` |

**Take the whole level.** Each level is a class in tokens.css — `.ds-raised`, `.ds-sticky`, `.ds-floating`, `.ds-modal`, `.ds-dragging` — carrying surface, shadow, edge and layer together, so a component can't take the shadow and forget the edge. In Figma, surfaces are scoped to fills, edges to strokes, and the shadow is an effect style whose colour is bound to the Colour variable, so a frame in Dark mode shows the Dark shadow.

---

## Levels by job

Six levels, lowest first. Pick by what the thing does to the page; the surface, shadow, edge and layer come with the level.

| Level | Use it for | Surface (Light · Dark) | Shadow | Edge | Layer |
|---|---|---|---|---|---|
| `elevation/page` | The page itself and what lies flat in it: the page background, bands, wells | `elevation/page/surface` = `color/bg/canvas`<br>#ECEEF0 · #161618 | none | — | in the flow |
| `elevation/raised` | Cards, panels and table frames in the flow of the page | `elevation/raised/surface` = `color/bg/surface`<br>#FFFFFF · #232427 | 1px up | — | in the flow |
| `elevation/sticky` | Bars that stay while content scrolls under them: the page header, toolbars, sticky table headers, a settings bar | `elevation/sticky/surface` = `color/bg/surface-raised`<br>#FFFFFF · #2E3033 | 3px up | toward the content | `layer/sticky` |
| `elevation/floating` | What opens over content without blocking it: menus, popovers, tooltips, toasts, date pickers, the navigation drawer | `elevation/floating/surface` = `color/bg/surface-overlay`<br>#FFFFFF · #373A3E | 8px up | every side | `layer/floating` |
| `elevation/modal` | What blocks the page until it is answered or closed: dialogs, sheets, modal drawers — always with the scrim behind | `elevation/modal/surface` = `color/bg/surface-overlay`<br>#FFFFFF · #373A3E | 16px up | every side | `layer/modal` |
| `elevation/dragging` | An item while it is being dragged: it keeps its own surface, lifts above everything, and returns to its level when dropped | keeps its own | 24px up | every side | `layer/dragging` |

**Floating and modal share a surface.** Both are `color/bg/surface-overlay`. What makes a dialog a dialog is the scrim behind it and the page going still, not a different grey; a menu opened inside a dialog still reads, because of its edge ([Edges](#edges)).

**Dragging is a state, not a place.** An item takes `elevation/dragging` while it is held and goes back to its own level when it is dropped. It keeps its own surface.

**Rules**

- **Lowest level that works.** A card that is a link is still raised; a settings panel is a card, not a dialog. Every step up interrupts more.
- **Not for emphasis.** A level says where something sits, not how important it is: emphasis is type, colour and position. Raising every sibling flattens them all.
- **Layout first.** If a page feels muddled, fix the grouping and spacing before adding height; height on a weak layout makes it louder, not clearer.

---

## Shadows

Each level's shadow is computed from its height: offsetY = max(1, ceil(height / 2)), blur = max(3, 2 × height), spread = −floor(height / 4); colour = the level's color.shadow step. A higher level drops further, blurs wider and is at least as dark (E4: 9/9 pass).

| Shadow | Height | Offset / blur / spread | Colour (alpha Light · Dark) | Just under the edge, on the page (Light · Dark) |
|---|---|---|---|---|
| `elevation/raised/shadow` | 1px | 0 1px 3px 0px | `color/shadow/1` (0.08 · 0.32) | 1.12 · 1.04 |
| `elevation/sticky/shadow` | 3px | 0 2px 6px 0px | `color/shadow/2` (0.12 · 0.4) | 1.21 · 1.05 |
| `elevation/floating/shadow` | 8px | 0 4px 16px -2px | `color/shadow/3` (0.16 · 0.48) | 1.23 · 1.05 |
| `elevation/modal/shadow` | 16px | 0 8px 32px -4px | `color/shadow/4` (0.2 · 0.56) | 1.30 · 1.06 |
| `elevation/dragging/shadow` | 24px | 0 12px 48px -6px | `color/shadow/4` (0.2 · 0.56) | 1.30 · 1.06 |

*"Just under the edge": the contrast between the page and the darkest pixel of the shadow, in the middle of the surface's bottom edge — computed here and measured in Chromium by the elevation audit.*

**Why one shadow, pulled in.** The negative spread keeps a large shadow from spreading sideways past the surface, so it reads as height, not as a smudge around the box. One shadow per level keeps a single, checkable number for each.

**What a shadow can't do.** Look at the last column: even the strongest shadow is a faint change against the page. That is fine for showing height in Light — and it is why a shadow is never the only thing that separates a surface from what is under it.

**Rules**

- **Shadow and surface together.** The floating shadow goes on the floating surface. On a raised card it would say one height and show another (ER-03).
- **No shadows by hand.** Every `box-shadow` is a level's shadow or none; Tailwind's own `shadow-sm`…`shadow-2xl` are removed from the theme (ER-01).

---

## Height in Dark

In Light, surfaces are white and the shadow shows height. In Dark that stops working: a black shadow on a near-black page reaches 1.06:1 at most. So in Dark each level is a lighter surface than the one below it — the page is darkest, and things get lighter as they come toward you.

| Level | Dark surface | Against the page | Against the level below |
|---|---|---|---|
| `elevation/page` | `color/bg/canvas` #161618 | — | — |
| `elevation/raised` | `color/bg/surface` #232427 | 1.16:1 | 1.16:1 |
| `elevation/sticky` | `color/bg/surface-raised` #2E3033 | 1.37:1 | 1.17:1 |
| `elevation/floating` | `color/bg/surface-overlay` #373A3E | 1.58:1 | 1.16:1 |
| `elevation/modal` | `color/bg/surface-overlay` #373A3E | 1.58:1 | same surface (the scrim tells it apart) |

*Each step is at least 1.1:1 lighter than the level below it (E2). The shadows still draw in Dark; they just don't carry the meaning.*

**The common slip.** Darker shadows for dark mode: even at 56% black, the modal shadow reaches 1.06:1 on the Dark page — there is almost nothing left to darken. Instead: in Dark the floating surface is 1.58:1 lighter than the page; the tokens switch by themselves.

**Rules**

- **No dark-mode overrides.** The tokens switch by themselves. A `[data-theme="dark"]` rule that sets a shadow or a surface skips the check that keeps surfaces rising (ER-07).
- **Text is measured on every level.** Each level surface is a background every text colour is measured on, in both modes (E5: 5/5 pass).

---

## Edges

Whatever floats over content draws a `border/width/line` edge on every side; a sticky bar draws one line, on the side that faces the content scrolling under it. The edge does the work the shadow can't: it is there in Dark, in forced colours, and over a busy page.

| Edge | Colour | Light · Dark | Sides | Lowest against what it sits on (Light · Dark) |
|---|---|---|---|---|
| `elevation/sticky/border` | `color/border/subtle` | #CBCED2 · #414449 | the side facing the content | decorative |
| `elevation/floating/border` | `color/border/floating` | #AEB1B8 · #54575E | all | 1.68:1 on page · 1.58:1 on floating |
| `elevation/modal/border` | `color/border/floating` | #AEB1B8 · #54575E | all | 1.59:1 on page · 1.58:1 on floating |
| `elevation/dragging/border` | `color/border/floating` | #AEB1B8 · #54575E | all | 1.58:1 on page · 1.58:1 on floating |

**`color/border/floating` is computed.** It sits far enough from every surface a floating thing can land on — the page, a card, a sticky bar, another floating surface (a menu over a menu, a select in a dialog) and the scrim — to reach 1.5:1 against all of them, in both modes (E3). Darker than the page in Light; lighter than the top surface in Dark. It is decorative (the menu's items identify themselves), so it doesn't need 3:1 — but it is never too faint to see.

**The common slip.** A menu set apart from the page by its shadow alone: its shadow reaches 1.23:1 against the page in Light and 1.05:1 in Dark; forced colours remove it altogether — the menu's items run into the page. With `.ds-floating`: the edge `elevation.floating.border`: at least 1.68:1 (Light) and 1.58:1 (Dark) against anything a menu can sit on, measured beside its own shadow, and kept in forced colours.

**Rules**

- **Never remove the edge.** Not for a "cleaner" look: the edge is the only thing that survives forced colours (ER-04).
- **Cards don't need one.** A raised card sits in the flow; its content identifies it. Give it a `border/width/line` outline in `color/border/default` when many cards sit together (Border foundation).

---

## The stacking order

Two mechanisms decide what is drawn on top. The browser's **top layer** is above everything: a `<dialog>` opened with `showModal()` and an element with the `popover` attribute go there, the most recently opened on top, and nothing can clip them. For everything else — sticky bars, a drawer, a dragged item, a modal that can't be a `<dialog>` — the **layer tokens** set the z-index.

| Layer | z-index | What sits there | Tailwind |
|---|---|---|---|
| `layer/sticky` | 100 | Sticky bars and the page header: above the content that scrolls under them | `z-(--ds-layer-sticky)` |
| `layer/floating` | 200 | Menus, popovers, tooltips and the navigation drawer: above sticky bars, so a menu opened from the header is never cut by it | `z-(--ds-layer-floating)` |
| `layer/modal` | 300 | Dialogs and their scrim: above everything the page shows, so nothing outside the dialog can be reached | `z-(--ds-layer-modal)` |
| `layer/toast` | 400 | Toasts and status messages: above dialogs, so a message is never hidden behind a scrim (it must not need an action while a dialog is open) | `z-(--ds-layer-toast)` |
| `layer/dragging` | 500 | An item being dragged: above everything while the pointer or keyboard holds it | `z-(--ds-layer-dragging)` |

**Why 100 apart.** So a product can put a layer between two of them without renumbering anything; the build computes its number ([Readers' settings and products](#readers-settings-and-products)). Inside one component, raw -1, 0, 1, 2 are fine for local order (a lifted part of a joined group); anything else is a layer.

**The common slip.** z-index: 9999 on a dropdown: it is above `layer.modal` (300) and `layer.dragging` (500): left open, it paints over a dialog and its scrim. Use `var(--ds-layer-floating)` — 200: above sticky bars (100), below dialogs (300); a popover sits in the top layer and is never clipped.

**Menus that get clipped.** A menu inside a card or a table with `overflow: hidden` or `auto` is cut off at the parent's edge whatever its z-index. Open it as a popover: the top layer is never clipped.

**Rules**

- **A menu above its header.** `layer/floating` is above `layer/sticky`, so a menu opened from the header is never cut by it.
- **Focus is never hidden under a bar.** Sticky bars sit above the content, so a focused field scrolled under one would be hidden (WCAG 2.4.11): tokens.css adds the header and the focus ring to the scroll padding (Layout foundation), and the elevation audit tabs through each page to check.

---

## Dialogs and the scrim

A modal stops the page until it is answered or closed. The scrim dims the page to say so; the page behind must also stop working for the keyboard and screen readers.

| Token | Light · Dark | What it does |
|---|---|---|
| `elevation/modal/scrim` | #0000007A · #000000A3 | Linked to `color/bg/scrim`. The dialog surface measures 4.18:1 (Light) and 1.75:1 (Dark) against the dimmed page |

**Use `<dialog>` with `showModal()`.** The browser then puts the dialog in the top layer, draws the scrim as its `::backdrop`, makes the rest of the page inert and closes it on Escape. `.ds-modal` supplies the surface, shadow, edge and scrim.

```html
<button id="open-delete">Delete project</button>
<dialog class="ds-modal" aria-labelledby="delete-title">
  <h2 id="delete-title">Delete this project?</h2>
  …
  <button value="cancel" formmethod="dialog">Cancel</button>
</dialog>
<script>
  const d = document.querySelector('dialog'), opener = document.getElementById('open-delete');
  opener.addEventListener('click', () => d.showModal());
  d.addEventListener('close', () => opener.focus());
</script>
```

**Every modal must:**

- open with showModal() (or role="dialog" + aria-modal="true" + .ds-scrim when `<dialog>` can't be used)
- a label: aria-labelledby pointing at the dialog's heading
- focus moves into the dialog when it opens (the first field, or the dialog itself)
- focus stays inside while it is open; the page behind is inert
- Escape closes it (unless closing would lose work: then it asks)
- focus returns to the control that opened it

**The common slip.** A `<dialog>` shown with the open attribute: it opens without the top layer, the backdrop or an inert page: Tab walks out of the dialog into the page behind it.

**Not the card surface.** A dialog on the card surface (color.bg.surface) in Dark: against the scrim over the page it reaches 1.29:1, and it looks like one more card. With `.ds-modal`: 1.75:1 for the modal surface, plus its edge (2.77:1).

**Rules**

- **No scrim without a dialog.** The scrim goes with the dialog and leaves with it; it is never a background for content.
- **Toasts and dialogs.** A toast shown while a dialog is open sits in `layer/toast` (opened as `popover="manual"` after the dialog) so it is never behind the scrim — and it must not need an action, because everything outside the dialog is inert.

---

## Lifting and dragging

Things can change height while someone uses them. The change is always temporary, and never the only sign that something happened.

| Interaction | What changes | Never |
|---|---|---|
| Hover on something clickable | the fill (`color/bg/surface-hover`) or a border colour; the shadow may grow one level with it | a shadow alone (ER-08) |
| Press | back to the resting shadow | higher than at rest |
| Keyboard focus | the focus ring | a shadow as the focus indicator |
| Drag | `.ds-dragging` while held; a live-region message; back on drop | dragging as the only way to move it (WCAG 2.5.7) |
| Open a menu or dialog | the floating or modal level appears; with reduced motion it only fades | a card that turns into a dialog in place |

**The common slip.** A card that shows hover only by a bigger shadow: in Dark the raised and sticky shadows reach 1.04:1 and 1.05:1 (1/3px against 2/6px) — the change is close to invisible, and gone in forced colours. Use `color/bg/surface-hover` — 1.36:1 against the card in Light; the shadow may change too, never alone.

**Dragging needs a second way.** Dragging is a pointer gesture; WCAG 2.5.7 asks for a way to do the same with a single click or the keyboard (move-up and move-down buttons, or arrow keys on the focused item). While it is held, the item takes `.ds-dragging`; `aria-grabbed` is obsolete, so say what happened in a live region ("Moved to position 3 of 8").

**Rules**

- **Press goes down.** A pressed card moves toward the page (back to its resting shadow), never further up.
- **Focus is a ring.** Keyboard focus is the focus ring tokens.css draws (Border foundation) — never a shadow.

---

## Choosing a level

Four questions: *does it need height at all?*, *which level?*, *what has to be on top?* and *does it change while someone uses it?*

**Does it need height at all** — What should set it apart?

| When | Use |
|---|---|
| Things that belong together, with room around them | space (Spacing: a bigger stack or inline gap) — no level |
| A region of the page (a sidebar, a band, a well) | a surface change (`color/bg/surface-sunken`) or a `border/width/line` edge — no shadow |
| Many cards side by side (a dashboard, a grid of results) | `elevation/raised`, or only a `border/width/line` outline: a page of shadows is noise |
| Something that sits over other content | a level from the next table — the higher it sits, the more it interrupts |

**Which level** — Where does it sit, and what does it do to the page?

| When | Use |
|---|---|
| It is the page, or lies flat in it | `elevation/page` — the page surface, no shadow |
| It groups content in the flow of the page (a card, a panel, a table frame) | `elevation/raised` (`.ds-raised`) |
| It stays while content scrolls under it (the page header, a toolbar, a sticky table header) | `elevation/sticky` (`.ds-sticky`; `data-stick="end"` for a bar along the bottom) |
| It opens over content and the page stays usable (a menu, popover, tooltip, toast, date picker, the navigation drawer) | `elevation/floating` (`.ds-floating`), opened as a popover so it sits in the top layer |
| It must be answered or closed before the page can be used (a dialog, a sheet, a modal drawer) | `elevation/modal` (`.ds-modal`) on a `<dialog>` opened with `showModal()`: the scrim, the edge and the layer come with it |
| It is being dragged | `elevation/dragging` (`.ds-dragging`) while it is held; back to its own level when dropped |

**Stacking** — What has to be on top?

| When | Use |
|---|---|
| A menu opened from the sticky header | nothing to do: `layer/floating` is above `layer/sticky` |
| A menu, select or tooltip inside a dialog | open it as a popover (top layer: it goes above the dialog) — or keep it inside the dialog's own box; never a bigger z-index |
| A menu inside a card or table that clips (overflow: hidden or auto) | a popover: the top layer is never clipped by a parent; a z-index can't escape overflow |
| A toast while a dialog is open | `layer/toast` (`.ds-floating` `data-layer="toast"`), opened as `popover="manual"` after the dialog; it must not need an action, because the page outside the dialog is inert |
| Something the system doesn't have a place for (a banner over sticky bars, a help panel) | a product layer in the config (`elevation.layers`, "above": the layer below it) — the number is computed |

**Moving** — Does it change while someone uses it?

| When | Use |
|---|---|
| Hover on something clickable (a card that is a link) | `color/bg/surface-hover` or a border colour — a bigger shadow may come with it, never alone |
| Press | back to its resting level (never higher): it moves toward the page |
| Keyboard focus | the focus ring (tokens.css draws it) — never a shadow |
| Drag | `elevation/dragging` while held, plus a keyboard way to move it (buttons or arrow keys); back to its level on drop |

**Worked example — a project page.** One part at a time:

| Part | Level | Why |
|---|---|---|
| The page | `elevation/page` | The ground everything sits on. |
| The page header | `elevation/sticky` · `.ds-sticky` | Stays while the list scrolls under it; a line on its bottom edge. |
| Project cards | `elevation/raised` · `.ds-raised` | Group each project in the flow of the page. |
| The card's "more" menu | `elevation/floating` · a popover | Opens over the cards without blocking the page; never clipped by the card. |
| "Delete project?" | `elevation/modal` · `<dialog>` + `showModal()` | Must be answered: scrim, focus held, Escape closes. |
| "Project deleted" toast | `elevation/floating` · `layer/toast` | Shows above anything; needs no action. |
| Reordering cards | `elevation/dragging` while held | Back to raised on drop; move buttons for the keyboard. |

**Do and avoid** (measured in this build)

| Avoid | Measured | Do |
|---|---|---|
| A menu set apart from the page by its shadow alone | its shadow reaches 1.23:1 against the page in Light and 1.05:1 in Dark; forced colours remove it altogether — the menu's items run into the page | `.ds-floating` — the edge `elevation/floating/border`: at least 1.68:1 (Light) and 1.58:1 (Dark) against anything a menu can sit on, measured beside its own shadow, and kept in forced colours |
| Darker shadows for dark mode | even at 56% black, the modal shadow reaches 1.06:1 on the Dark page — there is almost nothing left to darken | the level surfaces — in Dark the floating surface is 1.58:1 lighter than the page; the tokens switch by themselves |
| z-index: 9999 on a dropdown | it is above `layer/modal` (300) and `layer/dragging` (500): left open, it paints over a dialog and its scrim | `var(--ds-layer-floating)` — 200: above sticky bars (100), below dialogs (300); a popover sits in the top layer and is never clipped |
| A dialog on the card surface (color/bg/surface) in Dark | against the scrim over the page it reaches 1.29:1, and it looks like one more card | `.ds-modal` — 1.75:1 for the modal surface, plus its edge (2.77:1) |
| A card that shows hover only by a bigger shadow | in Dark the raised and sticky shadows reach 1.04:1 and 1.05:1 (1/3px against 2/6px) — the change is close to invisible, and gone in forced colours | `color/bg/surface-hover` — 1.36:1 against the card in Light; the shadow may change too, never alone |
| A frosted-glass menu (backdrop-filter: blur, translucent background) | its text contrast depends on whatever scrolls behind it, so no build can measure it — it fails exactly when the page behind is busy | `elevation/floating/surface` — opaque: every text colour measured on it (E5) |
| A `<dialog>` shown with the open attribute | it opens without the top layer, the backdrop or an inert page: Tab walks out of the dialog into the page behind it | `dialog.showModal()` — top layer, ::backdrop scrim, page inert, Escape closes; return focus to the button that opened it |

---

## Readers' settings and products

People switch to dark mode or forced colours, zoom and enlarge text; products add places of their own to the stacking order. Levels are built so none of that breaks.

**Dark mode.** Height comes from lighter surfaces and the edge ([Height in Dark](#height-in-dark)).

**Forced colours.** Forced colours (Windows contrast themes) remove every box-shadow and replace surfaces with the system page colour: every level looks flat. Borders stay, drawn in the system text colour. tokens.css: .ds-floating, .ds-modal and .ds-dragging draw a border on every side, .ds-sticky on the side facing the content; the drawer pane of .ds-shell draws its edge. The elevation audit renders every page in Chromium's real forced colours and checks that every floating thing keeps its edge.

**Zoom and bigger text (WCAG 1.4.4, 1.4.10).** Shadows and edges are px and scale with zoom like everything else. A sticky bar that grows with bigger text eats the screen: in short windows the shell header stops sticking (Layout foundation), and a dialog scrolls inside itself rather than running off the screen.

**Reduced motion.** Menus, popovers, toasts and dialogs open and close with the Motion foundation's floating and modal jobs, ready in tokens.css; with reduced motion they only fade.

**Adding a layer.** Most things fit one of the 5. If a product needs another place (a banner that sits over sticky bars, a help panel), name it by what sits there and say which layer it sits just above; the build computes its number, keeps the order, and refuses numbers, names by position ("top", "z-50") and two layers claiming the same spot:

```json
{
  "elevation": {
    "layers": [
      {
        "name": "layer.banner",
        "above": "sticky",
        "description": "A site-wide banner that stays above sticky bars"
      }
    ]
  }
}
```

Levels, surfaces, shadows and edges are not config choices: they are computed, so every product gets the same checked order.

---

## Accessibility reference

What the build checks for elevation, and the result for this build:

| Check | What it checks | WCAG | Result |
|---|---|---|---|
| E1 | Whatever floats keeps an edge — never shadow alone (forced colours remove shadows) — and a modal has its scrim | 1.4.11 (AA) | pass · 9/9 pass |
| E2 | Height shows by surface where shadows can't: in Dark each level is lighter than the one below (≥ 1.1:1); in Light no level is darker than the page | — (AA) | pass · 8/8 pass |
| E3 | Edges are seen: the edge of whatever floats reaches 1.5:1 against every surface it can sit on and against the scrim, in Light and Dark | — (AA) | pass · 28/28 pass |
| E4 | Shadows grow with height: a higher level drops further, blurs wider and is at least as dark, in Light and Dark | — (AA) | pass · 9/9 pass |
| E5 | Text reads on every level: each surface is measured with every text colour (C1), in Light and Dark | 1.4.3 (AA) | pass · 5/5 pass |
| E6 | The stacking order holds: sticky < floating < modal < toast < dragging, product layers in between, and tokens.css stacks only with layer tokens | 2.4.11 (AA) | pass · 7/7 pass |

What the checkers look for in your own code and pages: the elevation checker (`npm run lint:elevation`) reads CSS, HTML and JSX; the elevation audit (`npm run audit:elevation`) renders a page in Light, Dark and forced colours at 1280 and 320px, measures every shadow, surface step and edge against what is really behind it, opens menus and dialogs, checks what is on top, tabs through dialogs and checks that focus is never hidden under a sticky bar. See the [handoff](HANDOFF.md).

**Glossary**

| Term | Meaning |
|---|---|
| Level | Where something sits and what it does to the page (page, raised, sticky, floating, modal, dragging); it decides surface, shadow, edge and layer. |
| Edge | The border a floating level keeps on every side, so it shows without its shadow. |
| Scrim | The dimming behind a modal dialog. |
| Top layer | A browser layer above every z-index, for dialogs opened with showModal() and popovers. |
| Layer | A place in the stacking order (z-index), named by what sits there. |
| Inert | Part of the page that can't be focused, clicked or read by a screen reader while a dialog is open. |
| Forced colours | A browser mode (Windows contrast themes) that replaces the page's colours and removes shadows; borders survive. |
