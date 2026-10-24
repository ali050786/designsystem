# Add a border job — answers

Each case was answered with the "Add a border job" prompt and `border.md`; every JSON was then built by the engine
(`*.build.txt` next to each config).

| Request | Answer | Engine |
|---|---|---|
| "A 2px border for our featured cards" | No new job. A featured card isn't in a state, so 2px would read as selected (BR-07). Outline it with `border.width.line` in `color.border.default`, or set it apart with a surface (`color.bg.brand-subtle`). Asked anyway as `border.width.thick-card` ([config](thick-card.config.json)) | Refused: named by look ([output](thick-card.build.txt)) |
| "Hairline 0.5px dividers like iOS" | No (BR-03): `border.width.line` with `color.border.subtle` — quieter by colour, not by width. Asked anyway ([config](hairline.config.json)) | Refused: a hairline ([output](hairline.build.txt)) |
| "A dashed outline where files can be dropped" | A new job: it shows where to drop, so it identifies something (3:1), and it must differ from a 2px state — dashed does that ([config](drop-zone.config.json)) | Builds, B1–B6 pass ([output](drop-zone.build.txt)) |
| The same drop zone in `color.border.subtle` ("lighter, please") | The colour must reach 3:1 because people need the edge to find the target ([config](faint-drop-zone.config.json)) | Builds and fails B3 — the build blocks it ([output](faint-drop-zone.build.txt)) |
| "A thicker border on a field while typing" | No new job: focus is the ring tokens.css draws, never a border change (BR-05, BR-09) | — |
| "A red border for required fields" | No new job and no border: required is a label word ("required") and `aria-required`; red edges mean an error (`border.width.state` + `color.border.danger`) | — |
