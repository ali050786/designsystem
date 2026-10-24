# Review type use — answer key for input.html

Nineteen problems: eighteen seeded, and one the type audit found that wasn't planted (the table at 320px). Use this to
score any AI tool's review: a finding counts if it names the right place and the right problem (the rule ID helps but
isn't required). Also count false alarms — things flagged that are fine.

| # | Where | Rule | Problem | Expected fix | Checker | Audit |
|---|---|---|---|---|---|---|
| 1 | `<meta name="viewport">` (line 5) | TR-09 | `maximum-scale=1` blocks zoom | `width=device-width, initial-scale=1` | yes | yes |
| 2 | `.page-title` (line 11) | TR-01 | h1 hand-set to 26px (px, doesn't follow text size); h1 already gets heading.lg | Remove the rule | yes | yes (doesn't grow) |
| 3 | `.desc` (line 12) | TR-03 | Paragraph at 13px with line height 1.25 | `ds-type-body-md` (or body.sm), no hand-set values | yes | yes |
| 4 | `.meta` (line 13) | TR-03 | 11px — under the 12px floor | `ds-type-caption-md` | yes | yes |
| 5 | `p.ds-type-display-lg` "Welcome back, Priya" (line 27) | TR-06 | Display used for a greeting on an app screen, competing with the page title | Drop it, or a body.lg line under the h1 | partly (counts 2 displays) | no |
| 6 | `p.ds-type-display-sm` "Invite your team" (line 54) | TR-06, TR-05 | A second display style, used as a card heading and not a heading tag | `<h2 class="ds-type-title-md">` | partly (same warning) | no |
| 7 | `div.ds-type-heading-md` "Team members" (line 33) | TR-05 | Looks like a heading but isn't one — screen readers can't jump to it | `<h2>` (heading.md is its default) | no | no |
| 8 | `<h4>` after `<h1>` (line 45) | TR-05 | Skips two levels to get a smaller size | `<h2 class="ds-type-title-md">` | yes | yes |
| 9 | `.card-title` (line 15) | TR-07 | 22px-high box with hidden overflow and nowrap: the 24px line is already cut off, and the long title is cut at the side | Remove height, overflow and nowrap; let it wrap | yes (warning) | yes (cut off) |
| 10 | `.notice` (line 16) | TR-11 | A whole sentence in capitals | Normal case; show it as a warning message (icon + words, see colour rules) | no | no |
| 11 | `.quote` (line 17) | TR-12 | Justified text | `text-align: start` | yes | no |
| 12 | `.quote` (line 17) | TR-13 | Font family set in a component (Georgia) | Remove it; if quotes need a look, add a style in config | yes | no |
| 13 | `.highlight` (line 18, used line 56) | TR-10 | Emphasis by colour alone | `<strong>` | no | no |
| 14 | `.member-name` (line 19, used lines 38–39) | TR-07 | Names cut off with an ellipsis and no way to read them | Let names wrap in the cell, or add `title` plus a details view | yes (warning) | yes (warning) |
| 15 | `span.total.ds-type-title-lg` (lines 47–48) | TR-04, TR-02 | Compared totals in a title style, without tabular numerals | `ds-type-numeric-lg` | yes (warning) | no |
| 16 | Balance column (lines 36–39) | TR-04 | Numeric column left-aligned; "-40.00" uses a hyphen | Right-align the column; write `−40.00` | no | no |
| 17 | `p.ds-type-caption-md` "To move hours…" (line 50) | TR-03, decision guide | Four steps of instructions in 12px caption | `ds-type-body-sm` | no | no |
| 18 | `main { max-width: 960px }` (line 10) | TR-08 | Running text far wider than the reading width (~120 characters a line for `.desc`) | `max-width: var(--ds-layout-measure-reading)` on text | no | no |
| 19 | `<table>` in the first card | 1.4.10 | At 320px the table makes the whole page scroll sideways (435px wide) | Wrap it in a container with `overflow-x: auto` | no | yes |

**Not problems** (flagging these is a false alarm): the card styles, `th` in label.sm, `tbody` in body.sm, team names in
label.md, the body.md paragraph on line 56 (apart from #13), and the table cells' tabular numerals (tokens.css adds them).

**What the tools catch:** the checker finds 11 of the 19 (6 errors, 7 warnings — #5 and #6 share one warning); the audit
adds #19 and measures #2, #3, #4, #9 and #14. Eight need judgement: #5–#7, #10, #13, #16–#18. That is what the review
prompt is for, and what an independent run should be scored on.
