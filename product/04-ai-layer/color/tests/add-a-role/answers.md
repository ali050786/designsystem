# Add a colour role — test answers

Three requests: two where an existing role should win, one that genuinely needs a new role. The engine is the judge
for the drop-target case — the JSON was pasted into a config and built.

## "A tinted background for a callout announcing a new feature, with a heading, a line of text and a 'Learn more' link"

**Answer: use existing roles; no new role.**
`bg.info-subtle` is the tinted background for neutral news, and the Pair contract lists `fg.default` (heading),
`fg.muted` (text), `fg.info` (icon) and `fg.link` (link) on it. Add an "i" icon or the word "New" so the callout
doesn't rely on its tint.

*Found while testing:* the first run of this case failed — links were not listed on any `*-subtle` background, so a
"Learn more" link in a message had no supported colour. The engine now lists `fg.link` on every subtle background
(measured 5.32–5.36 : 1 in both modes).

## "A background and text colour for a small 'Beta' label next to feature names"

**Answer: use existing roles; no new role.**
`bg.brand-subtle` with `fg.brand` is a listed pair (a tinted brand badge). If "beta" is meant as a caution rather
than an identity marker, use `bg.warning-subtle` with `fg.warning` instead — and keep the word "Beta" either way.

## "An outline for an upload area while a file is being dragged over it"

**Step 1 — existing roles?** `border.focus` is reserved for keyboard focus; reusing it would make a drag look like
focus. `border.strong` is neutral and doesn't signal "drop here". The fill can reuse `bg.brand-subtle`. So: one new
outline role.

**Step 2 — the role:** `color.border.drop-target` — Light `brand.55`, Dark `brand.40`, on canvas, surface,
surface-sunken and brand-subtle (the area's own tint while dragging).

**Step 3 — arithmetic** (outlines need a gap of 40 or more):

| Pair | Light grades → gap | Dark grades → gap | Needs |
|---|---|---|---|
| on `bg.canvas` | 55 − 5 = 50 | 95 − 40 = 55 | 40 |
| on `bg.surface` | 55 − 0 = 55 | 90 − 40 = 50 | 40 |
| on `bg.surface-sunken` | 55 − 10 = 45 | 95 − 40 = 55 | 40 |
| on `bg.brand-subtle` | 55 − 10 = 45 | 85 − 40 = 45 | 40 |

**Step 4 — config:** [drop-target.config.json](drop-target.config.json)

**Step 5 — check:** build passes; look at the four `border.drop-target` pairs in the report.

**Engine result** ([drop-target.build.txt](drop-target.build.txt)): PASS. Measured 4.60 / 5.35 / 3.95 / 3.95 : 1 in Light and
5.35 / 4.60 / 5.35 / 3.93 : 1 in Dark — all above 3 : 1, and in line with the gap estimate.
