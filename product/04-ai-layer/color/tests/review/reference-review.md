# Review colour use — reference review of input.html

*Written by the same assistant that seeded the problems, so it shows the expected format — it is not evidence that the
prompt works. Score real tools against [answer-key.md](answer-key.md).*

Checker output: 6 errors (lines 11, 13, 14, 15, 31, 32) and 1 warning (line 9) — all confirmed below.

| # | Severity | Where | Rule | Problem | Fix |
|---|---|---|---|---|---|
| 1 | Blocker | `.badge-error` (line 15) | CR-03 | Muted text on the solid danger fill: 1.58 : 1 Light, 3.37 : 1 Dark | `color.fg.on-danger` |
| 2 | Blocker | `.toast` + `.toast p` (lines 16–17) | CR-03 | The paragraph's `fg.default` lands on `bg.brand` — 2.5 : 1 in Light. The checker misses it because the colours are in two rules | `color.fg.on-brand` for the text, or a `bg.info-subtle` toast with `fg.default` |
| 3 | Blocker | `button:focus { outline: 0 }` (line 31) | CR-09 | Removes the keyboard focus ring from every button | Delete the rule; tokens.css draws the ring on `:focus-visible` |
| 4 | Blocker | `.field input` (line 32) | CR-10 | Inputs outlined with decorative `border.default`: 1.84 : 1 Light, 1.36 : 1 Dark | `color.border.input` |
| 5 | Blocker | `.price` (line 13) | CR-01 | Raw `#0a7d32`; it never changes with the mode and is 2.95 : 1 in Dark | `color.fg.default` — a price is content, not good news |
| 6 | Blocker | `.tag` (line 14) | CR-01 | Shade `--ds-color-brand-10` as a background; it stays light in Dark, where `fg.brand` on it is 1.84 : 1 | `color.bg.brand-subtle` |
| 7 | Blocker | `a { text-decoration: none }` (line 9) | CR-04 | Links become blue text, told apart by colour only | Delete the rule |
| 8 | Blocker | `.presence .dot` (lines 18–20) | CR-04 | Online/away shown only by a green or red dot | Add the words "Online" / "Away" (or an icon with a text alternative) |
| 9 | Major | `.presence .dot.ok/.away` | CR-05 | `data.positive/negative` mean a good or bad *change*; presence is a status | Status roles (`fg.success` …) with words |
| 10 | Major | `.trend-down` on "▼ −2 h" (line 21) | CR-05 | Shorter reply time is good news but is coloured `fg.negative` because it went down | `color.fg.positive`, keep ▼ |
| 11 | Major | `.menu li:hover` (line 26) | CR-06 | Translucent `bg.state-hover` inside a menu — in Dark it closes the gap to the text | `color.bg.item-hover` |
| 12 | Major | `.well .btn-ghost` | CR-07 | Ghost button inside a sunken well: fine at rest, but on hover its brand label sits on a tint over the well, which lands near the 4.5 : 1 line and isn't a supported pair | Move it out of the well or make it secondary |
| 13 | Major | `#renew` (disabled input) | CR-11 | The renewal date and its consequence exist only as disabled text, which is exempt from contrast | Show it as normal text (`fg.muted`) beside the field |
| 14 | Major | `.dialog` (line 34) | CR-12 | Modal dialog with a shadow only: no outline, no scrim | Add `border.subtle` (the elevation-4 border) and a `bg.scrim` backdrop |
| 15 | Major | `.upload-ok` (line 35) | CR-14 | Brand colours used to say an upload worked | `bg.success-subtle`, `fg.success` for the ✓, `fg.default` for the text |
| 16 | Minor | Dialog buttons | CR-08 | Two primary buttons ("Archive", "Archive and notify members") | Keep one primary; make the other secondary or turn "notify" into a checkbox |
| 17 | Minor | `[data-theme="dark"] .card` (line 11) | CR-15, CR-01 | A separate dark colour, using a shade; `bg.surface` already switches | Delete the rule |

Not reported: `.card`, `.meta`, the secondary button and the dialog's text colours are fine. "▲ +5 open requests" in `fg.positive` is
debatable (more open requests is usually bad news) — worth a product decision, not a contrast problem.

**Blockers: 8 · Major: 7 · Minor: 2 — not ready to ship.**
