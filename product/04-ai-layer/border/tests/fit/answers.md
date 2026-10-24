# Fit borders to a product — answers

Each case was answered with the "Fit borders to a product" prompt and `border.md`; every config was built by the engine and
the numbers below are copied from its output (`*.build.txt`).

| Product | Config | Engine output | Why |
|---|---|---|---|
| A public benefits application, filled in once a year, many older people on phones ([config](benefits-service.config.json)) | `"control": 2` | line 1px · control 2px · state 3px · indicator 3px; B1–B6 and F2 pass ([output](benefits-service.build.txt)) | Fields must be easy to find on a first and only visit; dividers stay light, errors and selections stay one pixel heavier than fields |
| An analytics tool used all day ([config](analytics-tool.config.json)) | `"control": 1` with compact density | line 1px · control 1px · state 2px · indicator 3px; all pass ([output](analytics-tool.build.txt)) | Dense screens need fewer lines, not heavier ones: rows separated by `line` in `color.border.subtle`, panels by surface |
| "Make every border 0.5px for a lighter look" ([config](lighter-lines.config.json)) | refused | Config refused — a hairline ([output](lighter-lines.build.txt)) | BR-03: hairlines look different in every browser; lighter is `color.border.subtle`, or fewer lines |

In all three, component code doesn't change: the widths are jobs, so `"control": 2` reaches every field and secondary
button through `--ds-border-width-control`.
