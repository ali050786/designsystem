# Review elevation — answer key

The problems planted in [input.html](input.html), and which tool finds each. "Checker" is `npm run lint:elevation`
([output](checker-output.txt)); "audit" is `npm run audit:elevation -- input.html --open "#more-atlas" --open "#more-atlas then #delete-atlas" --open "#more-atlas then #delete-atlas then #yes"`
([output](audit-output.txt)). A good review finds all 17 and confirms or explains every tool finding.

| # | Where | Problem | Rule | Checker | Audit |
|---|---|---|---|---|---|
| 1 | `:root` (line 10) | `--ds-layer-modal: 50` redefines a layer: dialogs now sit **below** the sticky header's own 1000 and below sticky bars (100) | ER-10 | ✓ | — (shows "modal 50" in its layer list) |
| 2 | `.top` (12) | `z-index: 1000` on the header | ER-05 | ✓ | ✓ |
| 3 | `.top` (13) | Header shadow built from `--ds-color-shadow-2` by hand | ER-02 | ✓ | ✓ (as a hand-made shadow) |
| 4 | `.top` (12) | Sticky header with no line toward the content (forced colours: the header runs into the page) | ER-04 | ✓ (warning) | — |
| 5 | `.top` + page | A two-row sticky header and no scroll padding for it: links tabbed to going back land under it | WCAG 2.4.11 | — | ✓ |
| 6 | `.card` (28) | Hand-made card shadow | ER-01 | ✓ | ✓ |
| 7 | `.card:hover` (29) | Hover shown by a shadow alone — and the floating shadow on a raised card | ER-08, ER-03 | ✓ (ER-08) | ✓ (the card shows as "floating with no edge" while hovered) |
| 8 | `[data-theme="dark"] .card` (30) | A dark-mode shadow override | ER-07 | ✓ | ✓ (as a hand-made shadow in Dark) |
| 9 | `.card a:focus-visible` (32) | Focus shown by a shadow, ring removed | ER-08 / BR-05 | — (border checker ✓) | — |
| 10 | `.dropdown` (34) | `z-index: 9999` | ER-05 | ✓ | — (hidden at load) |
| 11 | `.dropdown` (34) | The floating shadow on the raised surface, and no edge | ER-03, ER-04 | ✓ | ✓ (no edge) |
| 12 | `.card` + `.dropdown` | The menu is inside a card with `overflow: hidden`: it is cut off. It should be a popover | judgement (the rulebook's "Stacking" table) | — (radius checker warns about the clip) | ✓ (cut off 72px) |
| 13 | `.activity li` (38) | A shadow on every activity row: height nobody needs — the list is one group | judgement ("Height is a last resort") | — | — |
| 14 | `.help` (42–43) | Glass: see-through background and `backdrop-filter`; no edge | ER-09, ER-04 | ✓ | — |
| 15 | `dialog` + script (95, 107) | Opened with `show()`: no top layer, no scrim, page not inert, Tab walks out, Escape does nothing | ER-06 | ✓ (warning) | ✓ |
| 16 | `dialog` (95) | No accessible name | ER-06, WCAG 4.1.2 | ✓ (warning) | ✓ |
| 17 | `.toast` (49) + markup | `z-index: 10`, and an **Undo** button in a toast shown while a dialog is open — a toast must need no action, because the page outside a dialog is inert; and nothing moves focus back after "Delete project" | ER-05 + judgement | ✓ (z-index) | — |

**Tools alone:** the checker finds 13 of 17 rows, the audit 10 (two only the audit: the focus hidden under the header and
the clipped menu). Rows 9 (another foundation's checker), 13 and the toast's Undo in row 17 need judgement.
