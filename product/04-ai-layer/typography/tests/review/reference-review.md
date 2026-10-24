# Review type use — reference review of input.html

*Written by the same assistant that seeded the problems, so it shows the expected format — it is not evidence that the
prompt works. Score real tools against [answer-key.md](answer-key.md).*

Type checker: 6 errors, 7 warnings ([output](checker-output.txt)). Type audit: 11 failures, 3 warnings ([output](audit-output.txt)). All confirmed below.

| # | Severity | Where | Rule | Problem | Fix |
|---|---|---|---|---|---|
| 1 | Blocker | viewport meta (line 5) | TR-09 | `maximum-scale=1` stops people zooming in | `content="width=device-width, initial-scale=1"` |
| 2 | Blocker | `.desc` (line 12) | TR-03 | The page intro is 13px at line height 1.25 (16.25px) — cramped reading text that also ignores the reader's text size | `ds-type-body-md`; remove the rule |
| 3 | Blocker | `.meta` (line 13) | TR-03 | 11px, under the 12px floor | `ds-type-caption-md` |
| 4 | Blocker | `.card-title` (line 15) | TR-07 | The 24px line sits in a 22px-high box with hidden overflow, so it is already cut off; on a phone the title is cut at the side too | Remove `height`, `overflow` and `white-space`; let it wrap |
| 5 | Blocker | first `<table>` | 1.4.10 | At 320px the table pushes the page to 435px wide — the whole page scrolls sideways | Wrap the table in `overflow-x: auto` |
| 6 | Major | `.page-title` (line 11) | TR-01 | h1 hand-set to 26px; it won't follow the reader's text size or the breakpoints | Delete the rule — h1 is heading.lg by default |
| 7 | Major | `<h4>` (line 45) | TR-05 | Skips from h1 to h4 to get a smaller size | `<h2 class="ds-type-title-md">` |
| 8 | Major | `div.ds-type-heading-md` (line 33) | TR-05 | "Team members" looks like a section heading but isn't one; screen-reader users can't reach it by heading | `<h2>Team members</h2>` |
| 9 | Major | `p.ds-type-display-lg` (line 27) and `p.ds-type-display-sm` (line 54) | TR-06 | Two display styles on an app screen: a greeting that out-shouts the page title, and a card heading set as display | Drop the greeting (or body.lg under the h1); `<h2 class="ds-type-title-md">Invite your team</h2>` |
| 10 | Major | `.member-name` (line 19) | TR-07 | Long names end in an ellipsis with no way to read them | Let names wrap, or add `title` and a details view |
| 11 | Major | `p.ds-type-caption-md` (line 50) | TR-03 | Four steps of instructions in 12px caption | `ds-type-body-sm` |
| 12 | Major | `.notice` (line 16) | TR-11 | A full sentence in capitals | Normal case, shown as a warning message (icon + words) |
| 13 | Major | `span.total` (lines 47–48) | TR-04 | Totals people compare are in a title style with proportional digits | `ds-type-numeric-lg` |
| 14 | Minor | `.quote` (line 17) | TR-12, TR-13 | Justified, and sets its own font family (Georgia) | `text-align: start`; remove the family |
| 15 | Minor | `.highlight` (line 18) | TR-10 | Emphasis by brand colour only | `<strong>` |
| 16 | Minor | Balance column | TR-04 | Numbers left-aligned; "-40.00" uses a hyphen | Right-align; `−40.00` |
| 17 | Minor | `main` (line 10) | TR-08 | Text runs to 960px — about 120 characters a line for the intro | Cap text at `var(--ds-layout-measure-reading)` |

Blockers: 5 · Major: 8 · Minor: 4 — not ready to ship
