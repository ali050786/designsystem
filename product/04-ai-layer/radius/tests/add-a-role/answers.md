# Add a shape role — answers (author-run)

Each request was answered by following [add-a-role.md](../../prompts/add-a-role.md) with the rulebook only; every proposed
config was then built by the engine (`node src/cli.js <config> out/test`) and the build output saved next to it.

| Request | Answer | Engine |
|---|---|---|
| "Our cards are 12px in the mock-up — add a card radius" | No new role: a card holds content, so `shape.container`. 12px is what round gives it; the product picks the style, not the card. | — (nothing to build) |
| "A pill-shaped Upgrade button" | No new role, and not the pill: a button's label can wrap (RR-04), so `shape.control`. | — |
| "Image previews in lists and the file picker" | Nothing fits (a preview isn't a container, and in round 12px looks heavy on 40px thumbnails): `shape.thumbnail` with sharp `"1"`, default `"3"`, round `"4"` (2 / 6 / 8px) | **PASS** ([config](thumbnail.config.json), [build](thumbnail.build.txt)): `--ds-shape-thumbnail`, `rounded-thumbnail`, and `shape.thumbnail-focus` 4 / 8 / 10px computed |
| "rounded-lg for images" | Refused the name (RR-04: by job, not look); offered `shape.thumbnail` instead. Built the request as asked to show the refusal | **Refused** ([config](rounded-image.config.json), [build](rounded-image.build.txt)): "name the role by its job…" |
| "Map markers, fully round" | `shape.pill` — no new role | **Refused** as written ([config](marker-full.config.json), [build](marker-full.build.txt)): "fully round ends are shape.pill — use it" |
| "Thumbnails: 4px sharp, 6px default, 4px round (the round style looked too soft)" | Refused: a role can't get sharper as the style gets rounder (the styles would no longer mean anything); offered 2 / 6 / 8px | **Refused** ([config](shrinking.config.json), [build](shrinking.build.txt)): "the radius must not shrink…" |
