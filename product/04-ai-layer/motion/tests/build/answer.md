# Build with motion — answer

**Request:** "An orders page for a shop's back office: a count of today's orders that goes up when a new order comes in,
a status filter, a sync button that takes a few seconds, orders that open to show what's in them, and cancelling an order
with a confirmation and a message when it's done."
**Code style:** plain HTML + CSS. **Page:** [orders.html](orders.html) (with `tokens.css` next to it).

## Parts

| Part | Needs motion? | Job | Comes from | With reduced motion |
|---|---|---|---|---|
| Page title, header, section heading | no: they are there when the page opens | — | — | — |
| Buttons (filter, sync, cancel, the dialog's two) | yes: the press needs an answer | feedback | `transition` of `background-color`, `border-color`, `color` | the same colours, 100ms |
| An order's row header | yes: hover says it opens | feedback | `background-color` only | the same |
| An order's details | yes: people see what opened, and where | change | `hidden` + `arrive` keyframes by `--ds-motion-change-distance` | fades in place |
| A cancelled order leaving the list | yes: people see which one went | change | `leave` keyframes with `forwards`, removed on `animationend`; focus moves to the next order first; the list closes the gap at once | fades in place |
| Status filter menu | yes | floating | `.ds-floating` popover (tokens.css) | fades |
| "Cancel order #…?" | yes | modal | `dialog.ds-modal` with `showModal()` (tokens.css) | fades with the scrim |
| "Order #… cancelled." | yes | floating, toast | `.ds-floating` `data-layer="toast"` `popover="manual"` (tokens.css) | fades |
| The count of today's orders going up by itself | yes: it changed while nobody touched it | highlight | `.ds-highlight`, once per change | the same fade |
| Syncing with the warehouse | yes: work in progress | loading | `.ds-loading`, shown only while it runs; after five seconds the status says how far it got | pulses |
| "Synced just now" | yes: it changed after the work ended | highlight | `.ds-highlight` once | the same fade |
| Filtering the list | no: the list changes at once | — | — | — |
| Focus rings | never | — | — | — |

## Self-check

- [x] Each thing that moves needs to; its job says what it does. Most parts have no motion.
- [x] Every duration and curve is a `var(--ds-motion-<job>-…)`; no ms, no `ease-in-out`, no `cubic-bezier()`, no `transition: all`.
- [x] Movement only by the change distance, on one axis; nothing scales, rotates or animates its height.
- [x] The menu and the toast are `.ds-floating` popovers and the dialog `dialog.ds-modal` with `showModal()`; none has motion of its own; focus moves at once.
- [x] Nothing moves with reduced motion (every animation goes through the tokens); nothing flashes; the only loop is `.ds-loading`, and it stops when the sync ends.
- [x] Focus rings, text and scrolling never move.
- [x] No motion variables redefined; no `data-motion`.

Not possible within the rules: nothing.

## How it was judged

- All eight checkers (colour, type, spacing, layout, radius, border, elevation, motion): 0 errors, 0 warnings
  ([output](checker-output.txt)).
- Motion audit, opening the filter menu, the sync, an order, the dialog from inside the order and the toast after it
  (`--open "#o-1042 then [data-cancel='1042']"` and `… then #confirm`): **no problems** with full and reduced motion at
  1280 and 320px ([output](audit-output.txt), [shots](shots/)).
- Page, type, spacing, layout, radius, border and elevation audits: no problems ([output](audit-other-output.txt)). The
  first draft had two warnings, both fixed: the order headers had no edge of their own, so they disappeared in forced
  colours (border audit) — they now carry a transparent `border.width.control` border; and the scroll padding was
  measured on the header's content box, so it missed the header's padding when density changed (layout audit) — it now
  observes the border box.
