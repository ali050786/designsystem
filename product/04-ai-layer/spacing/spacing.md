# Spacing rules for AI tools — ds

Generated from the engine (20 tokens, every one checked in all 3 densities; all checks pass). The same data in machine-readable form: `spacing.contract.json`.

## How to use this file
1. Pick a token for every padding, margin and gap with the **Decision guide**, using token names exactly as written.
2. Use the token itself — its CSS variable, Tailwind utility or Figma variable. Never copy its number into your own CSS.
3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.
4. Before answering, run the **Self-check**.

## Hard rules
| ID | Rule | Why | WCAG |
|---|---|---|---|
| SR-01 | Use a spacing token for every padding, margin and gap. Never px, rem or em values, and never Tailwind's own numeric scale (p-4, gap-2, mt-[13px]). | Tokens follow the density and stay on the scale; a hand-set 12px does neither and is never checked. | — |
| SR-02 | Pick the family by direction: space.inset.* for padding, space.stack.* for vertical gaps (row-gap, margin-top and -bottom), space.inline.* for horizontal gaps (column-gap, margin-left and -right). | A size word is the same distance in every family, so the family only records which way the space runs. That is what reviews and the checker read. | — |
| SR-03 | Pick the size by relationship: the more closely two things belong together, the smaller the space between them; space inside a group is always smaller than the space around it. When spacing shows a group, the markup groups it too (a list, a fieldset, a section with a heading). | People read grouping from distance before they read borders or headings. Screen-reader users get the same grouping only from the markup. | 1.3.1 |
| SR-04 | Density is a mode: set data-density on `<html>` or on a container (a dense table inside a default page). Never swap token names or write a .compact class to make something tighter. | The mode moves every token together and keeps targets and labels safe; a swapped name moves one value and breaks the ladder. | — |
| SR-05 | Every pointer target is at least 24×24px in every density. Controls use size.control.height; icon-only buttons are at least that square (min-width and min-height); small marks (a checkbox, a close icon, a drag handle) get a hit area of at least size.target.min. | People with tremors, on a moving bus or using a thumb miss small targets. 24px is the WCAG minimum. | 2.5.8 |
| SR-06 | Heights are minimums. Anything that holds text uses min-height (min-height: var(--…-size-control-height), Tailwind min-h-control), never height. | At 200% text a label needs twice its line height; a fixed 32px box cuts it off. | 1.4.4, 1.4.12 |
| SR-07 | Never use a primitive (space.4, --…-space-4) in a component. Use the semantic token for the job. | Primitives don't change with density, so that one space stays put when the rest of the screen tightens. | — |
| SR-08 | Never redefine a spacing token in app code (--…-space-inset-md: 10px). Change the engine config and build, so the change is checked. | An overridden variable skips every check and silently changes every component that uses it. | — |
| SR-09 | Never make space with empty elements: spacer divs, runs of `<br>` or `&nbsp;`. | They don't follow density, and screen readers may announce empty lines as "blank". | — |

## Decision guide

**Space inside something (padding)** — What is the container?

| When | Use |
|---|---|
| A badge, tag or small chip — above and below its label (the sides take space.inset.sm) | `space.inset.xs` |
| A menu item, list row, tooltip, or a cell in a dense table | `space.inset.sm` |
| The sides of a button or input; a table cell, popover or toast | `space.inset.md` |
| A card or panel | `space.inset.lg` |
| A dialog, sheet, large card or empty state | `space.inset.xl` |
| A band across the page; the space above and below a page's content | `space.inset.2xl` |

**Space between things above and below each other** — How closely do they belong together?

| When | Use |
|---|---|
| Parts of one thing: a label and its field, a field and its help text, a title and its subtitle | `space.stack.xs` |
| Items of one group: options in a checkbox group, rows of a simple list, menu items | `space.stack.sm` |
| A heading and the content under it; items inside a card | `space.stack.md` |
| Paragraphs, fields in a form, cards in a list | `space.stack.lg` |
| Groups in a form or panel; blocks inside a large card | `space.stack.xl` |
| Sections of a page or panel | `space.stack.2xl` |

**Space between things side by side** — How closely do they belong together?

| When | Use |
|---|---|
| An icon and its text in content; a value and its unit | `space.inline.xs` |
| Items of one group: buttons in a button group, chips, tags | `space.inline.sm` |
| A checkbox or radio and its label (a native box has no space of its own) | `space.inline.sm` |
| Fields side by side; a title and its actions in a header | `space.inline.md` |
| Columns of content in a card or panel; filters next to a search box | `space.inline.lg` |
| Groups in a toolbar or action bar | `space.inline.xl` |

**Something people press** — What is it?

| When | Use |
|---|---|
| A button, input, select or tab | `size.control.height` (as min-height) |
| An icon-only button | `size.control.height` (min-width and min-height) |
| An icon next to the label inside a control | `size.control.icon-gap` |
| A small mark people click: a checkbox, a close icon, a drag handle | `size.target.min` (its hit area) |

**How dense the screen is** — What kind of screen is it?

| When | Use |
|---|---|
| Tables, dashboards, admin tools — people scan a lot at once | `data-density="compact"` |
| Most product screens | `data-density="default"` |
| Touch-first screens, onboarding, people who need bigger targets | `data-density="comfortable"` |
| One dense part of a page, such as a table in a default page | `data-density="compact"` on that container |

## Density
Compact is one step down the scale from default and comfortable one step up, for every token; size.target.min never moves. Set it with `data-density` on `<html>`, or on any container — everything inside follows. In Figma, set the frame's **Density** mode.

## Tokens
px in each density. In code use the CSS variable (or the Tailwind utility); in Figma the variable of the same name.

### inset — padding inside a container (padding)
| Token | CSS variable | Tailwind | comfortable | default (default mode) | compact | Use |
|---|---|---|---|---|---|---|
| `space.inset.xs` | `--ds-space-inset-xs` | `p-inset-xs` `px-inset-xs` `py-inset-xs` | 6 | 4 | 2 | Badges, tags and small chips, above and below the label (their sides take inset.sm) |
| `space.inset.sm` | `--ds-space-inset-sm` | `p-inset-sm` `px-inset-sm` `py-inset-sm` | 12 | 8 | 6 | Menu items, list rows, tooltips, cells in dense tables |
| `space.inset.md` | `--ds-space-inset-md` | `p-inset-md` `px-inset-md` `py-inset-md` | 16 | 12 | 8 | The sides of buttons and inputs; table cells, popovers, toasts |
| `space.inset.lg` | `--ds-space-inset-lg` | `p-inset-lg` `px-inset-lg` `py-inset-lg` | 20 | 16 | 12 | Cards and panels |
| `space.inset.xl` | `--ds-space-inset-xl` | `p-inset-xl` `px-inset-xl` `py-inset-xl` | 32 | 24 | 20 | Dialogs, sheets, large cards and empty states |
| `space.inset.2xl` | `--ds-space-inset-2xl` | `p-inset-2xl` `px-inset-2xl` `py-inset-2xl` | 40 | 32 | 24 | Bands that run across a page; the space above and below a page's content |

### stack — vertical gap between things stacked in a column (row-gap, margin-block (margin-top, margin-bottom))
| Token | CSS variable | Tailwind | comfortable | default (default mode) | compact | Use |
|---|---|---|---|---|---|---|
| `space.stack.xs` | `--ds-space-stack-xs` | `gap-y-stack-xs` `space-y-stack-xs` `mt-stack-xs` | 6 | 4 | 2 | Parts of one thing: a label and its field, a field and its help text, a title and its subtitle |
| `space.stack.sm` | `--ds-space-stack-sm` | `gap-y-stack-sm` `space-y-stack-sm` `mt-stack-sm` | 12 | 8 | 6 | Items of one group: options in a checkbox group, rows of a simple list, menu items |
| `space.stack.md` | `--ds-space-stack-md` | `gap-y-stack-md` `space-y-stack-md` `mt-stack-md` | 16 | 12 | 8 | A heading and the content under it; items inside a card |
| `space.stack.lg` | `--ds-space-stack-lg` | `gap-y-stack-lg` `space-y-stack-lg` `mt-stack-lg` | 20 | 16 | 12 | Paragraphs, fields in a form, cards in a list |
| `space.stack.xl` | `--ds-space-stack-xl` | `gap-y-stack-xl` `space-y-stack-xl` `mt-stack-xl` | 32 | 24 | 20 | Groups in a form or panel; blocks inside a large card |
| `space.stack.2xl` | `--ds-space-stack-2xl` | `gap-y-stack-2xl` `space-y-stack-2xl` `mt-stack-2xl` | 40 | 32 | 24 | Sections of a page or panel |

### inline — horizontal gap between things side by side in a row (column-gap, margin-inline (margin-left, margin-right))
| Token | CSS variable | Tailwind | comfortable | default (default mode) | compact | Use |
|---|---|---|---|---|---|---|
| `space.inline.xs` | `--ds-space-inline-xs` | `gap-x-inline-xs` `space-x-inline-xs` `ml-inline-xs` | 6 | 4 | 2 | An icon and its text in content; a value and its unit |
| `space.inline.sm` | `--ds-space-inline-sm` | `gap-x-inline-sm` `space-x-inline-sm` `ml-inline-sm` | 12 | 8 | 6 | Items of one group: buttons in a button group, chips, tags; a checkbox or radio and its label |
| `space.inline.md` | `--ds-space-inline-md` | `gap-x-inline-md` `space-x-inline-md` `ml-inline-md` | 16 | 12 | 8 | Fields side by side; a title and its actions in a header |
| `space.inline.lg` | `--ds-space-inline-lg` | `gap-x-inline-lg` `space-x-inline-lg` `ml-inline-lg` | 20 | 16 | 12 | Columns of content inside a card or panel; filters next to a search box |
| `space.inline.xl` | `--ds-space-inline-xl` | `gap-x-inline-xl` `space-x-inline-xl` `ml-inline-xl` | 32 | 24 | 20 | Groups in a toolbar or action bar |

### Sizes of things people press
| Token | CSS variable | Tailwind | comfortable | default (default mode) | compact | Use |
|---|---|---|---|---|---|---|
| `size.control.height` | `--ds-size-control-height` | `min-h-control` `min-w-control` | 48 | 40 | 32 | Minimum height of buttons, inputs, selects and tabs; the minimum width and height of an icon-only button |
| `size.control.icon-gap` | `--ds-size-control-icon-gap` | `gap-icon` | 12 | 8 | 6 | Gap between an icon and the label inside a control |
| `size.target.min` | `--ds-size-target-min` | `min-w-target` `min-h-target` | 24 | 24 | 24 | Smallest pointer target in every density (WCAG 2.5.8: 24×24px): the hit area of a checkbox, a close icon, a drag handle · the same in every density |

## The scale (primitives — never in components)
`space.0` 0 · `space.0-5` 2 · `space.1` 4 · `space.1-5` 6 · `space.2` 8 · `space.3` 12 · `space.4` 16 · `space.5` 20 · `space.6` 24 · `space.8` 32 · `space.10` 40 · `space.12` 48 · `space.14` 56 · `space.16` 64 · `space.20` 80 · `space.24` 96 (px). The number is the Tailwind number: × 4px. Semantic tokens point at these; designs and code use the semantic tokens.

## Linked to layout
Page gutters and margins point at the same scale, per breakpoint (not density):

| Token | sm | md | lg | xl |
|---|---|---|---|---|
| `layout.gutter` | 16 | 24 | 24 | 32 |
| `layout.margin` | 16 | 32 | 40 | 64 |

## Limits the build enforces
| Limit | Value |
|---|---|
| Smallest pointer target | 24 × 24px in every density (comfortable controls 48px, over the 44px AAA size) |
| Smallest space | 2px in every density — nothing collapses to 0 |
| Room around a control's label | at least 4px above and below, in every density |
| Ladder | xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 px in default density, the same in every family |
| Units in code | px — when readers enlarge text, the text gets the room, not the margins |

## Common mistakes (measured)
| Mistake | Measured | Use instead |
|---|---|---|
| Padding written as 12px | stays 12px in every density; `space.inset.md` is 16 / 12 / 8px (comfortable / default / compact) | `space.inset.md` — follows the density |
| Compact made by swapping names (inset.md → inset.sm in a .compact class) | inside a compact screen that gives 6px — two steps from default while everything else moves one | `data-density="compact"` — on the container: `space.inset.md` becomes 8px and every other token moves with it |
| Icon-only button drawn 20 × 20px | 20px is below the 24px minimum (WCAG 2.5.8) | `size.control.height` — as min-width and min-height: 48 / 40 / 32px square |
| Button with height: 32px | at 200% text a `label.md` line is 40px, so a fixed 32px box cuts the label off | `size.control.height` — as min-height — the button grows with its label |
| Page margins in rem (1rem) | at 200% text on a 320px phone each margin becomes 32px: 256px of content, under 272px | `layout.margin` — 16px (px, linked to spacing): 288px of content |
| The same space between everything (stack.md everywhere) | a label is 12px from its own field and 12px from the next field's label, so pairs don't read as pairs | `space.stack.xs / space.stack.lg` — xs inside a field (4px), lg between fields (16px) |

## Self-check before answering
- [ ] No px, rem or em values in padding, margin or gap — only spacing tokens (CSS variables, Tailwind `p-inset-*` / `gap-y-stack-*` / `gap-x-inline-*` utilities, Figma variables).
- [ ] Every token name exists in the Tokens tables; no primitives (`space.4`) in components.
- [ ] Padding uses inset, vertical gaps stack, horizontal gaps inline.
- [ ] Space inside a group is smaller than the space around it, and the markup groups what the spacing groups.
- [ ] Density is set with `data-density`, never by swapping token names or a .compact class.
- [ ] Every target is at least 24px; controls use min-height, never height.
- [ ] No spacer elements, `<br>` runs or `&nbsp;` for space; no spacing variables redefined.
