# Set the density — test answers

**Prompt:** [set-density.md](../../prompts/set-density.md), with `spacing.md` attached. Author-run; every config was built by the
engine and the outputs are saved next to this file. Every number below is copied from those outputs.

## An admin console for support agents on desktops

**Decision.** Agents scan long lists all day on large screens: start the whole product in compact. Nothing needs a region of
its own. → [config](admin-console.config.json)

**Build: Pass** ([output](admin-console.build.txt)). `:root` now uses compact: `inset.md` and `stack.md` point to `space.2`
(8px) and controls to `space.8` (32px). Controls use `label.md` (14/20px) with 6px above and below (S6). A person or a page
region switches with `data-density="default"` or `"comfortable"`; the rulebook marks compact as the default mode.

**Review list.** Run `npm run audit:space` on the busiest screens — compact is where labels are tightest at 200% text; run
`npm run lint:space` to find components with hand-set heights that won't follow; decide whether agents can choose their
density, and store it per person.

## A tablet app for warehouse staff wearing gloves

**Decision.** Gloves and moving hands need bigger targets: start in comfortable. → [config](warehouse-tablet.config.json)

**Build: Pass** ([output](warehouse-tablet.build.txt)). `:root` uses comfortable: controls point to `space.12` (48px), over the
44px of WCAG 2.5.5 (S2 pass), and `inset.md` / `stack.md` to `space.4` (16px). Controls use `label.lg` (16/22px), 13px above
and below.

**Review list.** Check every screen at 320px in comfortable — it is the widest density and the one most likely to push a
page sideways (the spacing audit checks reflow in every density); keep small marks at a 24px hit area or more.

## "Make compact much tighter — about half"

**Decision.** Try `"densityStep": 2`, as asked. → [config](tighter-compact.config.json)

**Build: Fail — S5 and S6** ([output](tighter-compact.build.txt)):
- S5: compact `inset.xs`, `stack.xs` and `inline.xs` would be **0px** — things would touch.
- S6: compact controls would be **24px** tall, leaving **2px** above and below a `label.md` line (the floor is 4px).

**Smallest fix.** Keep `densityStep` at 1. Where a screen really needs more on it, use compact there (`data-density="compact"`
on the region), and tighten a single component (a data grid's row height, say) in the component layer, where its own
checks apply. Halving every space is what Surf's compact does, and it is how its compact `inline/xs` reached 0px.

## What doesn't change

Token names, the scale, the ladder, the 24px target floor and every rule. Designs and code don't need edits — only the
default density (and the Figma collection's first mode) moves.
