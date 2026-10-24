# Add a layer — answers

Each request was answered by following [the prompt](../../prompts/add-a-layer.md) with only the rulebook in hand. Every
config was then built by the engine (`node src/cli.js <case>.config.json out/test`); its output is next to it.

| Request | Answer | Engine |
|---|---|---|
| "A support chat panel that has to be on top of everything" | **No new layer.** It opens over content and the page stays usable: `elevation.floating` (`.ds-floating`), opened as a popover. The top layer is above every z-index, so it is above the header and every card; a dialog opened later goes above it, which is right — the dialog has to be answered first. | — (nothing to build) |
| "z-index: 99999 for the cookie banner" | **Refused (ER-05):** no numbers. What it must sit above is the sticky header; menus, dialogs and toasts must stay above it. That is a product layer above `sticky`. | `number.config.json` refused: `"z" is not allowed: say which layer it sits just above` · `banner.config.json` builds: `layer.banner` = 150, E6 8/8 |
| "A `layer.top` for the what's-new panel" | **Refused:** named by position. A what's-new panel opens over the page and can be dismissed: floating, as a popover — no layer needed. | `top.config.json` refused: `name the layer by what sits there, not by where it is` |
| "A banner and a help panel, both above the header" | Two product layers can't claim one spot: the order between them must be written down. The help panel slides over the page, so it goes above the banner. | `same-spot.config.json` refused: `two product layers sit just above layer.sticky` · `two-layers.config.json` builds: banner 150, help panel 175, E6 9/9 |
| "Make our menus' shadows stronger, it looks flat" | **Not a config choice:** shadows are computed from each level's height, and in Dark they barely show anyway. If menus look flat, check that they are `.ds-floating` (edge and surface come with it). | `shadow-choice.config.json` refused: `"shadows" is not an elevation choice` |

**Result: pass.** Every refusal names the rule, and the two layers that built sit where the description says
(`--ds-layer-banner: 150`, `--ds-layer-help-panel: 175` in tokens.css).
