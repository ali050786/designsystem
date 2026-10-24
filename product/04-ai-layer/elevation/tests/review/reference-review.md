# Review elevation — reference review

Written by following [the review prompt](../../prompts/review-elevation.md) with the rulebook, the checker output and the
audit output in hand. Scored against the [answer key](answer-key.md): **17 of 17 found, no false alarms.**

## Tool findings, confirmed

| Where | Rule | What goes wrong, for whom | Fix |
|---|---|---|---|
| `:root { --ds-layer-modal: 50 }` | ER-10 | Dialogs now stack below sticky bars (100) and this header (1000): once the dialog is modal it still sits in the top layer, but anything that isn't — a fallback modal, the toast's layer — loses its place, and the build's order check (E6) no longer describes the page. | Delete the line. If a product needs a place of its own, add it in `elevation.layers`. |
| `.top { z-index: 1000 }` | ER-05 | Races every layer: a menu opened from the header (200) would open under it. | `.top` → `class="top ds-sticky"`; remove `z-index`. |
| `.top { box-shadow: 0 2px 8px var(--ds-color-shadow-2) }` | ER-02 | A shadow from the strengths, by hand: not the sticky level's, and it won't follow the level if it changes. | Comes with `.ds-sticky`. |
| `.top` with no bottom line | ER-04 (warning) | In forced colours the shadow is removed and the header runs into the content scrolling under it. | Comes with `.ds-sticky` (a `border.width.line` line on the side facing the content). |
| Focus hidden under the header (audit) | WCAG 2.4.11 | Keyboard users going back through the page land on links ("Atlas", and at 320px "Beacon", "Compass") hidden under the two-row header: the default scroll padding is one header row. | Measure the header into `scroll-padding-top` when it changes size (a ResizeObserver), as the ds demos do, or keep the header to one row. |
| `.card { box-shadow: 0 1px 4px rgba(0,0,0,.12) }` | ER-01 | A shadow that belongs to no level: no Dark value, no check. | `class="card ds-raised"`; remove the shadow and background lines. |
| `.card:hover { box-shadow: var(--ds-elevation-floating-shadow) }` | ER-08, ER-03 | Hover shows by shadow alone: nothing happens in forced colours, almost nothing in Dark; and the card says "floating" while sitting in the flow (the audit sees a floating thing with no edge). | `.card:has(a:hover) { background: var(--ds-color-bg-surface-hover); box-shadow: var(--ds-elevation-sticky-shadow); }` |
| `[data-theme="dark"] .card { box-shadow: … }` | ER-07 | A darker shadow measures almost nothing on the Dark page (the raised shadow reaches 1.04:1); Dark shows height by the lighter card surface, which the tokens already give. | Delete the rule. |
| `.dropdown { z-index: 9999 }` | ER-05 | Paints over everything — including the dialog, if a menu is left open. | Open the menu as a popover (below); no z-index. |
| `.dropdown` surface and edge | ER-03, ER-04 | The floating shadow on the card's surface, and no border: in forced colours the menu's items run into the card. | `class="dropdown ds-floating"`. |
| `.help` | ER-09, ER-04 | See-through: the text's contrast depends on what scrolls behind it; no edge in forced colours. | `class="help ds-floating"`; remove `background`, `backdrop-filter` and `box-shadow`. |
| `dialog.show()` | ER-06 | Not modal: Tab walks into the page behind (the audit counted 20 stops outside it), no scrim, Escape does nothing. | `dlg.showModal()`; `class="ds-modal"`; close with `<form method="dialog">` buttons. |
| `<dialog>` with no name | ER-06, 4.1.2 | Announced as "dialog" and nothing else. | `aria-labelledby` pointing at its heading. |
| `.toast { z-index: 10 }` | ER-05 | Below the header and every layer; behind a scrim. | `class="toast ds-floating" data-layer="toast" popover="manual"`; `showPopover()` after the dialog closes. |

## Found by judgement

| Where | Rule | What goes wrong, for whom | Fix |
|---|---|---|---|
| The "⋯" menu inside `.card { overflow: hidden }` | Decision guide, "Stacking" (the audit also measures it: cut off 72px) | The menu is cut off at the card's edge — "Delete…" can't be reached with a pointer. No z-index gets it out of the card's overflow. | `<button popovertarget="menu-atlas">` and `<div class="ds-floating" popover id="menu-atlas">`; drop `.more-wrap`, `.open`, the click handler and `aria-expanded`. The card can keep its clip — or lose it, since it clips nothing else (radius checker RR-08: it also cuts focus rings). |
| `.card a:focus-visible { outline: none; box-shadow: … }` | ER-08 (focus is a ring), BR-05 | Focus shown by a shadow: invisible in forced colours and barely there in Dark. | Delete the rule; tokens.css draws the ring. |
| A shadow on every `.activity li` | "Height is a last resort" | Ten lifted rows read as ten separate things and make the page noisy; it is one list. | No shadow: one `.ds-raised` panel with `border.width.line` dividers, or space alone. |
| The toast's **Undo** button | Toasts and dialogs | A toast must need no action: while a dialog is open the page outside it is inert, so Undo can't be reached; and after "Delete project" nothing closes the dialog or moves focus. | Close the dialog on "Delete project" (`value="delete"` in a `method="dialog"` form), return focus to the "⋯" button, then show a toast with no button. Put Undo somewhere that stays (the project list, for a while). |

## What is right

- The dialog's surface, shadow and edge are the modal level's tokens, taken together.
- The cards use the raised surface token; the toast has the floating edge.
- Tokens come from tokens.css; no raw colours outside the shadows and the glass.
