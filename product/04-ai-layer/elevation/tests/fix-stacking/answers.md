# Fix the stacking — answer

**Request:** "On the invoices page the row menu gets cut off by the table, and after voiding an invoice the 'voided'
message is hidden behind the dark overlay." **Before:** [before.html](before.html) · **after:** [after.html](after.html).

## Parts

| Part | Today | Level it really is | How it should open |
|---|---|---|---|
| Header | `position: sticky; z-index: 1000`, the sticky tokens by hand | `elevation.sticky` | `.ds-sticky` (sticky only in windows tall enough; scroll padding measured from it) |
| Table header row | `position: sticky; z-index: 5` | inside one component | `z-index: 1` (order inside the table's own scroll box) |
| Row "⋯" menu | `position: absolute; z-index: 9999` inside a table that scrolls (`overflow: auto`) | `elevation.floating` | a popover (`popovertarget`), `.ds-floating` |
| "Void INV-1042?" | a `div.overlay` (`fixed; z-index: 5000`) with `role="dialog"`, no `aria-modal`, no inert page, no Escape | `elevation.modal` | `<dialog class="ds-modal">` + `showModal()`; `<form method="dialog">` buttons |
| "INV-1042 voided." | `position: fixed; z-index: 100`, shown while the overlay is still up | `elevation.floating`, `layer.toast` | `.ds-floating data-layer="toast" popover="manual"`, shown after the dialog closes |

## What changed

- **Moved to the top layer:** the row menu (popover) and the dialog (`showModal()`); the toast too, opened after the dialog.
- **Layer tokens:** the header takes `layer.sticky` from `.ds-sticky`.
- **Numbers removed:** 1000, 9999, 5000, 100; 5 became 1 (local order inside the table).
- **Removed code:** the overlay div, the menu's `.open` toggle and `aria-expanded`, the manual focus moves the browser
  now does; kept: focus back to the "⋯" button when the dialog closes.

Self-check: all seven items pass.

## How it was judged

| | Elevation checker | Elevation audit (Light, Dark, forced colours, 1280 and 320px; menu, dialog, toast opened) |
|---|---|---|
| Before | 5 errors, 1 warning ([output](before-checker.txt)) | 9 problems ([output](before-audit.txt)): five stray z-indexes, the menu cut off 48px by the table, its edge lost where it is cut, the toast covered by the overlay and its edge under 1.5:1 there |
| After | 0, and all six other checkers 0 ([output](after-checker.txt)) | **no problems** ([output](after-audit.txt)); page, border, radius, spacing and type audits clean |

**Result: pass.** One layout warning is left in both versions on purpose — the table's scroll box has no accessible
name (LR-08). It isn't elevation, and the prompt says to change only what elevation needs.
