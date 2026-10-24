# Review colour use — answer key for input.html

Sixteen seeded problems. Use this to score any AI tool's review: a finding counts if it names the right place and the
right problem (the rule ID helps but isn't required). Also count false alarms — things flagged that are fine.

| # | Where | Rule | Problem | Expected fix | Checker finds it? |
|---|---|---|---|---|---|
| 1 | `.price` | CR-01 | Raw hex `#0a7d32` | A role — `fg.default` (a price is content, not good news) | yes |
| 2 | `.tag` | CR-01 | Shade variable `--ds-color-brand-10` as a background | `bg.brand-subtle` (its pair with `fg.brand` is listed) | yes |
| 3 | `.badge-error` | CR-03 | `fg.muted` on solid `bg.danger` — 1.58 : 1 Light | `fg.on-danger` | yes |
| 4 | `.toast` + `.toast p` | CR-03 | Text inherits onto `bg.brand` from a separate rule: `fg.default` on the brand fill | `fg.on-brand` (or use `bg.info-subtle` with `fg.default`) | no — two rules |
| 5 | `a { text-decoration: none }` | CR-04 | Links shown by colour only | Remove it; links stay underlined | yes (warning) |
| 6 | `.presence .dot` | CR-04, CR-05 | Online/away shown only by a green/red dot; and data.positive/negative mean good/bad change, not presence | Add the word ("Online", "Away") or an icon; use status roles (`fg.success` …) for status | no |
| 7 | `.trend-down` on "▼ −2 h" reply time | CR-05 | Faster replies are good news but coloured `fg.negative` because the value went down | `fg.positive`, keep ▼ | no |
| 8 | `.menu li:hover` | CR-06 | Translucent `bg.state-hover` inside a menu | `bg.item-hover` | no — tints aren't pair-checked |
| 9 | `.well .btn-ghost` | CR-07 | Ghost button (brand text) inside a sunken well | Move it out or use a secondary button | no |
| 10 | Dialog buttons | CR-08 | Two primary actions in one view | Make "Archive and notify members" secondary (or a checkbox) | no |
| 11 | `button:focus { outline: 0 }` | CR-09 | Focus ring removed | Delete the rule | yes |
| 12 | `.field input` | CR-10 | `border.default` (decorative) on inputs — 1.84 : 1 | `border.input` | yes |
| 13 | `#renew` (disabled) | CR-11 | Information only in disabled text | Show the renewal date as normal text outside the field | no |
| 14 | `.dialog` | CR-12 | Modal dialog without an outline or a scrim | Add `border.subtle` (elevation-4 border) and a `bg.scrim` backdrop | no |
| 15 | `.upload-ok` | CR-14 | Brand colours used to say something worked | `bg.success-subtle`, icon `fg.success`, text `fg.default` | no |
| 16 | `[data-theme="dark"] .card` | CR-15, CR-01 | Separate dark colour, using a shade | Delete it; `bg.surface` already switches with the mode | yes (CR-01 part) |

**Not problems** (flagging these is a false alarm): `.card` and `.meta` colours, the secondary button, `.trend-up` (more open
requests is arguably bad news — accept either "fine" or a CR-05 note, but it must not be called a contrast failure),
`fg.brand` on the tag *after* fix 2, and the dialog's own text colours.
