# Fit the radius to a product — answers (author-run)

Each request was answered by following [fit-the-radius.md](../../prompts/fit-the-radius.md) with the rulebook only; the
config was then built, and every number below was copied from the build's rulebook.

| Product | Answer | Engine |
|---|---|---|
| A trading tool for professionals: dense tables, many panels, "corners feel too soft" | `sharp`, with compact density (a Spacing choice, named as such): controls 2px, containers 2px, dialogs 4px; checkboxes 2px | **PASS** ([config](trading-tool.config.json), [build](trading-tool.build.txt)) — R2 holds in compact: 2px ≤ 8px on 32px controls |
| A reading app for children: "friendly, big touch areas" | `round`, with comfortable density: controls 8px, cards 12px, dialogs 16px, checkboxes still 4px (square, not radio-like) | **PASS** ([config](kids-app.config.json), [build](kids-app.build.txt)) |
| "We want 24px cards, like our marketing site" | Not available: the roles' values are fixed so the checks hold (order, corners, text inside). Nearest is `round` (cards 12px, dialogs 16px). If marketing pages need a 24px hero card, that is a product role named by job (e.g. `shape.feature`), and the scale stops at 16px — raise it as a design-system change | **PASS** for `round` ([config](soft-cards.config.json), [build](soft-cards.build.txt)); 24px isn't on the scale, so a role with it can't be built |
