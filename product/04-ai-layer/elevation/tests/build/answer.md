# Build with elevation — answer

**Request:** "A support inbox: a header with a filter and the account menu, a list of conversations each with a 'more'
menu (assign, archive), a confirmation before archiving, a message when it's done, and saved replies people can reorder."
**Code style:** plain HTML + CSS. **Page:** [inbox.html](inbox.html) (with `tokens.css` next to it).

## Parts

| Part | Needs height? | Level | How it opens | What it must sit above |
|---|---|---|---|---|
| The page | — | `elevation.page` | — | — |
| Header with filter and account | yes: the list scrolls under it | `elevation.sticky` (`.ds-sticky`) | — | the conversation list |
| Conversation list | yes, once: it is one panel in the flow | `elevation.raised` (`.ds-raised`) | — | the page |
| Each conversation row | **no**: rows are grouped by the panel and separated by a `border.width.line` divider | — | — | — |
| Filter menu, account menu, each row's "more" menu | yes: opens over content, page stays usable | `elevation.floating` (`.ds-floating`) | `popover` + `popovertarget` | the header and the list (top layer) |
| "Archive the conversation?" | yes: must be answered | `elevation.modal` (`.ds-modal`) | `<dialog>` + `showModal()`; focus back to the row's "more" button | everything (top layer, scrim, page inert) |
| "Conversation archived." | yes: a message that needs no action | `elevation.floating`, `layer.toast` | `popover="manual"`, shown after the dialog closes | the dialog's place (opened last, so on top) |
| Saved replies | **no** at rest: a `border.width.line` outline on each | — | — | — |
| A reply while dragged | yes, only while held | `elevation.dragging` (`.ds-dragging`) | pointer on the grip; move buttons for everyone; a live region says where it went | everything |

## Self-check

- [x] Each thing with height needs it; rows and saved replies are not lifted.
- [x] Every `box-shadow` comes with its level's class; no hand-made shadows.
- [x] Floating, modal and dragging keep their edge (the classes draw it); the header its line.
- [x] No `z-index` anywhere; every menu is a popover.
- [x] The dialog is a `<dialog>` with `showModal()`, labelled, the scrim behind, focus in, held and returned.
- [x] No dark-mode overrides, no glass, no hover shown by shadow alone (rows and menu items change their fill).
- [x] No elevation or layer variables redefined.

Not possible within the rules: nothing.

## How it was judged

- All seven checkers (colour, type, spacing, layout, radius, border, elevation): 0 errors, 0 warnings
  ([output](checker-output.txt)). The first draft had one radius warning — the panel clipped its content
  (`overflow: hidden`), which can cut a focus ring near its edge; the clip did nothing useful and was removed.
- Elevation audit, opening each row's menu, the dialog from inside the menu and the toast after it
  (`--open "#more-1 then [data-archive='Meera Iyer']"` and `… then #confirm`): **no problems** in Light, Dark and forced
  colours at 1280 and 320px ([output](audit-output.txt), [shots](shots/)).
- Page, border, radius, spacing, layout and type audits: no problems ([output](audit-other-output.txt)). The first draft
  had one layout warning: at 200% text the header grew to 141px but the scroll padding was measured only on window
  resize (117px); it now measures the header whenever it changes size.
