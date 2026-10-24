# Add a pane — test answers

**Prompt:** [Add a pane](../../prompts/add-a-pane.md) · **Attached:** `layout.md`. Every config below was built with the engine;
the build output is next to it. Numbers in the answers are the engine's, not the author's.

## "A 280px filters panel beside the members table"

**Answer: use the existing aside, no new pane.** Filters narrow the task in the main region — supporting content, which is
`layout.pane.aside` (320px, beside the content from `xl`, below it before that). 280px is the mock-up's width, not a
reason for a new pane; if 320px is too wide for every product screen, `layout.aside` can go down to 240px. No config.

## "A right sidebar, 400px, from lg, for details of the selected item"

**Refused by the rules, then by the engine.** "right" names a side, and sides swap in right-to-left languages — the pane
needs a name by its job. Details of the selected item are supporting content, so this is the aside again. The config as
asked ([right-sidebar.config.json](right-sidebar.config.json)) is refused: *name it by its job, not its look or position*
([output](right-sidebar.build.txt)).

## "Recent activity next to the content on phones too"

**Refused.** Nothing fits beside the main region on a phone: at 320px the content has 288px. `from: "sm"` is refused
([output](phone-pane.build.txt)); recent activity can be a section of the main region, or the aside (below the content on
phones).

## "An outline of a long help page, to jump between headings"

**New pane, passes.** An outline is not the help itself (which is in the aside) — it is a list of the page's headings.
Added up at `xl` with the built-in panes: 1440 − 256 − 320 − 192 = 672px for the main region; 672 − 2 × 64 = 544px of
content — exactly one reading line; the main region is 672px wide, so its grid is `md`: (544 − 7 × 24) ÷ 8 = 47px columns.

```json
{ "layout": { "panes": [
  { "name": "layout.pane.outline", "width": 192, "from": "xl", "side": "end", "description": "Headings of a long help page, to jump between them" }
] } }
```

Build: **PASS**, L3 5/5 ([output](outline.build.txt)) — the expected numbers match the build's shell table.

## "An inspector beside a canvas, 320px from lg"

**First try fails L3, as the sums predicted.** At `lg`: 1024 − 256 − 320 − 2 × 40 = 368px for the content, under the
544px reading line ([output](inspector-first-try.build.txt)).

**Second try: from xl, 288px — still fails.** 1440 − 256 − 320 − 288 − 2 × 64 = 448px ([output](inspector-second-try.build.txt)).
With navigation and the supporting pane open at `xl`, a fourth pane can be at most 192px.

**Fix: narrow the supporting pane and the inspector until they add up.** `layout.aside` 240px and the inspector 272px:
1440 − 256 − 240 − 272 = 672px main region, 544px content, `md` grid of 47px columns.

```json
{ "layout": { "aside": 240, "panes": [
  { "name": "layout.pane.inspector", "width": 272, "from": "xl", "side": "end", "description": "Properties of the selected shape beside the canvas" }
] } }
```

Build: **PASS** ([output](inspector.build.txt)). Note for the product: below 1440px the inspector sits under the canvas;
an editor that needs it beside the canvas on a laptop should open it as an overlay there instead.
