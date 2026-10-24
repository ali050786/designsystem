# Review test — reference review

What a good answer to the [review prompt](../../prompts/review-layout.md) looks like for [input.html](input.html), with the
checker and audit outputs pasted in. Author-run.

| # | Severity | Where | Rule | Problem | Fix |
|---|---|---|---|---|---|
| 1 | Blocker | `.wrapper` (line 18) | LR-02, 1.4.10 | `width: 1180px`: the page is 1220px wide at 320px and at 400% zoom, in every density (audit). | Put the content in the shell's main region with `.ds-page`: capped at `layout.container.max`, fluid below it. |
| 2 | Blocker | `body` (line 12) | LR-08 | `overflow-x: hidden` cuts off whatever is too wide instead of reflowing it. | Remove it; fixing rows 1, 9 and 14 removes the overflow. |
| 3 | Blocker | `.filters` (line 20) | LR-07, 1.3.2 | `order: -1` draws the filters before the main content at every width (audit), but they come after it in the code. | Remove `order`; in the shell the filters are the `aside`, after `main` in the code and beside or below it on screen. |
| 4 | Blocker | `.tabs` (line 16) | LR-04, 2.4.11 | A second sticky bar the scroll padding doesn't cover: at 400% zoom "Activity", "Files", "People" and a checkbox end up hidden under the bars (audit). | Don't make the tabs sticky (one sticky bar on small screens); if they must stick, only from `(min-height: 30em)` and add their height: `scroll-padding-top: calc(var(--ds-layout-scroll-padding-top) + <tabs height>)`. |
| 5 | Blocker | `@media (max-width: 600px)` (line 34) | LR-06, 1.4.10 | Hides `.details` on phones — the paragraph is lost at 320px and at 400% zoom. | Remove the query; let the paragraph reflow. |
| 6 | Major | `.topbar` (line 14) | LR-04 | `height: 64px` renders 81px (content-box), taller than the 56px scroll padding; 32% of a zoomed screen; always sticky. | The shell header: `data-shell="header"`, `min-height: var(--ds-layout-header-height)`, one row, sticky only in tall windows (the shell does it). |
| 7 | Major | Header links (lines 41–44) | Region | Section navigation in the header wraps into extra rows on a phone. | Move the links to `<nav data-shell="nav">` (a drawer below `lg`); keep a menu button in the header. |
| 8 | Major | `.layout` (line 19) | LR-09, LR-05 | A hand-made three-column grid with fixed 280px and 300px tracks and a bare `1fr` that grows to the 760px table. | `.ds-shell` with `nav`, `main`, `aside`; no grid of your own for the frame. |
| 9 | Major | `.cards` (line 23) | LR-05, LR-09 | `repeat(4, 1fr)` — four 65px columns on a phone; bare fr tracks. | `.ds-tiles` (one card per row on a phone, as many as fit above). |
| 10 | Major | `@media (max-width: 900px)` (line 33) | LR-06 | Desktop-first at a width of its own. | Not needed with the shell; otherwise `min-width` at 37.5em, 64em or 90em. |
| 11 | Major | `.intro` (line 22) | LR-03 | 720px of text — about 93 characters a line (audit), px. | `.ds-measure` (34rem). |
| 12 | Major | `.notes p` (lines 66–67) | LR-03 | 131–260 characters a line (audit). | `.ds-measure` on the paragraphs (or the section). |
| 13 | Major | `.hero` (line 29) | LR-08 | `width: 100vw` includes the scrollbar. | `width: 100%` or nothing. |
| 14 | Major | `.table-scroll` (line 71) | LR-08, 2.1.1 | The table's scrolling container can't be focused and has no name. | `tabindex="0" role="region" aria-labelledby="files"` on `.table-scroll`. |
| 15 | Major | `:root` (line 11) | LR-10 | `--ds-layout-margin: 24px` overrides the breakpoint margins (272px of content on a phone). | Remove it. |
| 16 | Major | `.wrapper` (line 18) | LR-01 | Page edges `20px`. | `.ds-page` (pads with `layout.margin`). |
| 17 | Minor | "Edit project" (lines 84–89) | Region | A one-field task as a permanent pane takes width from the content everywhere. | An "Edit" button that opens a dialog, or a section at the end of the page. |
| 18 | Minor | `@media (min-width: 1024px)` (line 35) | LR-06 | px breakpoint. | `(min-width: 64em)` — or remove it: the rule inside changes nothing. |
| 19 | Minor | Two `<aside>`s | Region | Two supporting regions with no shell; on a phone both stack with the content. | One `aside` (filters); edit as a dialog. |

Blockers: 5 · Major: 11 · Minor: 3 — not ready to ship.

**Scored against the key:** 19 of 20 rows (rows 7 and 20 of the key are merged here as rows 7 and 19; row 9 of the key is
inside row 8 here). No false alarms.
