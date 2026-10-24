# Review test — answer key

**Input:** [input.html](input.html) (a project activity page with problems planted on purpose), checked against the
`tokens.css` next to it. **Tools:** [checker output](checker-output.txt), [audit output](audit-output.txt).

20 problems. Score an independent review by marking each row found / missed, and count false alarms.

| # | Where | Problem | Rule | Severity | Found by |
|---|---|---|---|---|---|
| 1 | `.wrapper`, line 18 | `width: 1180px`: the page is 1220px wide at 320px (and at 400% zoom), and stays 1180px on a 1920px screen | LR-02, 1.4.10 | Blocker | Checker, audit |
| 2 | `body`, line 12 | `overflow-x: hidden` hides the overflow instead of fixing it: everything past the right edge is cut off and can't be scrolled to | LR-08, 1.4.10 | Blocker | Checker |
| 3 | `.filters`, line 20 | `order: -1` draws the filters before (desktop) or above (phone) the main content, which comes first in the code: keyboard order contradicts the picture | LR-07, 1.3.2 | Blocker | Checker (warning), audit |
| 4 | `.tabs`, line 16 | A second sticky bar (top 64px) the scroll padding doesn't cover: at 400% zoom tabbing hides links and inputs under the bars | LR-04, 2.4.11 | Blocker | Audit |
| 5 | `@media (max-width: 600px)`, line 34 | `.details { display: none }`: a paragraph disappears on phones and at 400% zoom — content hidden instead of reflowed | LR-06, 1.4.10 | Blocker | Checker (the query), judgement (the hiding) |
| 6 | `.topbar`, line 14 | `height: 64px` (content-box: 81px with padding) — taller than the 56px scroll padding, 32% of a 320 × 256 screen, and sticky in short windows too | LR-04 | Major | Checker (warning), audit |
| 7 | Header links, lines 41–44 | Section navigation (Projects, Members, Storage, Settings) as links in the header: they wrap into extra rows on a phone; this is the job of the nav pane (a drawer below lg) | LR-09, region | Major | Judgement |
| 8 | `.layout`, line 19 | A three-column layout of its own (280px · 1fr · 300px) instead of the shell: no drawer, no checked breakpoints, fixed pane widths | LR-09 | Major | Checker (tracks), judgement (use the shell) |
| 9 | `.layout`, line 19 | The `1fr` main column can't shrink below its widest content (the 760px table), so the grid grows past the wrapper | LR-05 | Major | Checker |
| 10 | `.cards`, line 23 | `repeat(4, 1fr)`: bare fr tracks, and four columns on a phone (about 65px each) — a tile grid's job | LR-05, LR-09 | Major | Checker (fr), judgement (tiles) |
| 11 | `@media (max-width: 900px)`, line 33 | Desktop-first query at a width of its own; the single column it switches to is a bare `1fr` | LR-06, LR-05 | Major | Checker |
| 12 | `.intro`, line 22 | `max-width: 720px` on text: about 93 characters a line, and px — it shrinks the line at 200% text | LR-03, 1.4.8 | Major | Checker, audit |
| 13 | `.notes` paragraphs, lines 66–67 | No measure at all: lines of 131–260 characters depending on the screen | LR-03, 1.4.8 | Major | Audit (the checker can't tell a section of paragraphs is text) |
| 14 | `.hero`, line 29 | `width: 100vw` — includes the scrollbar; sideways scroll on desktops with one | LR-08 | Major | Checker |
| 15 | Files table, lines 71–76 | Once the page reflows, the 760px table scrolls inside `.table-scroll`, which has no `tabindex` and no name: keyboard users can't scroll it, screen readers don't announce it | LR-08, 2.1.1 | Major | Judgement (the checker only sees the table's min-width) |
| 16 | `:root`, line 11 | `--ds-layout-margin` redefined as 24px: phone content drops to 272px and the grid's margin stops following the breakpoint | LR-10 | Major | Checker |
| 17 | `.wrapper`, line 18 | Page edges `padding: 0 20px` instead of `layout.margin` | LR-01 | Major | Checker |
| 18 | "Edit project" pane, lines 84–89 | A short task built as a permanent third column: it takes width from the content on every screen; it belongs in an overlay (a dialog) or a section of the page | Region | Minor | Judgement |
| 19 | `@media (min-width: 1024px)`, line 35 | The right width in px: it doesn't move at 200% text like the system's em breakpoints | LR-06 | Minor | Checker |
| 20 | Two `<aside>`s, lines 79–89 | Filters and Edit both as `aside` with no shell: on a phone both stack above or below the content with no way to tell which supports the task | Region | Minor | Judgement |

**Tool coverage:** the checker flags 14 of the 20 (some as warnings, or only part of the problem), the audit 6 — two of
them (4 and 13) only the audit — and 4 need judgement alone (7, 15, 18, 20), with judgement completing 3 more (5, 8, 10).
The judgement rows are what an independent run should be scored on.
