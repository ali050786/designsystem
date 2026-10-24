# Brief for an AI agent: compare two colour foundation files

You are evaluating two colour foundation files for a design system. Be specific, cite pages, and say where each one is stronger.

## The files
| | Ours (ds) — v0.4 | DSS (Design Systems Surf) — reference only |
|---|---|---|
| FigCraft file | `product/02-foundations/figma/ds-colour-foundation.figcraft` | `surf/converted/color/DSS-Color-Foundation.figcraft` |
| Page images | `product/02-foundations/figma/png/` (cover + 11 chapters) | `surf/converted/color/png/` (12 pages) |
| Original | `product/02-foundations/figma/ds-colour-foundation.fig` | `surf/Color Foundation.fig` |

Ours is organised as 11 chapters: 01 Five principles · 02 Contrast grades · 03 How tokens are built · 04 Shade scales · 05 Surfaces and depth ·
06 Text, icons and outlines · 07 Actions and states · 08 Status and data · 09 What goes on what · 10 Choosing and using colour · 11 Modes and brands.
Each chapter: explanation → examples → token table (Light and Dark side by side) → rules. All 100 colour roles appear in exactly one token table.

DSS was converted 22 Oct 2026 with FigCraft (commit 74c4a84): 14 pages, 12,076 layers, 195 variables, 21 components; 70 bindings to an external
Figma library were skipped (layers keep their colours, lose the link) and a few vector stroke styles were approximated. Do not count those as DSS faults.

## How to read a .figcraft file
It is a zip: `unzip -p <file> document.json > doc.json`. `document.json` holds pages → layer tree (type, name, fills, text, auto layout,
`boundVariables`, explicit variable modes), variable collections with modes and values (including aliases), and components.
The PNGs show each page as rendered.

## What to evaluate (score each 1–5, with evidence)
1. **Teaching** — does a designer learn *how to choose and manage colour*, not just what exists? Decision guidance, examples, "why".
2. **Structure** — is there a clear, systematic path from principles to usage? Any duplication or gaps?
3. **Coverage** — backgrounds, text, icons, outlines, actions, states, status, data/charts, Light and Dark, layering, invalid pairs.
4. **Accessibility** — are contrast ratios shown? Do the default pairs pass WCAG 2.2 AA (4.5 : 1 text, 3 : 1 non-text)? Spot-check at least 10 pairs per file from the variable values.
5. **Token architecture** — tiers, naming clarity, aliases, scopes, ease of extending or rebranding.
6. **Visual polish and clarity** — layout, hierarchy, consistency, scannability.
7. **Fit for real products** — data-heavy screens, good/bad change, charts, industry-neutral examples, regulatory accessibility.
8. **Handoff** — can a developer map design to code from the file alone?

## Output
A table of scores per criterion for both files, the 5 biggest gaps in *ours* (most important first, each with a concrete fix), and the 3 things ours does better.

## Rule
DSS material is licensed reference only. Use it to judge and find gaps; do not copy its wording, structure or values into anything under `product/`.
