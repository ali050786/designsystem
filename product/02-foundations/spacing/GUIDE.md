# Spacing

*ds foundations · spacing · the written guide. Generated from the engine — 20 tokens, 3 densities, density moves one step along the scale; every spacing check passing. Do not edit by hand; change the engine config and build again.*

This guide explains how space works in ds and how to use it: the scale every value comes from, the three directions space runs in, how density changes a whole screen at once, and how targets stay big enough to hit. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after [Choosing and using space](#choosing-and-using-space); developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (`spacing.md`, `spacing.contract.json`).

**Contents**

- [Five principles](#five-principles)
- [The spacing scale](#the-spacing-scale)
- [How tokens are built](#how-tokens-are-built)
- [Inset: padding](#inset-padding)
- [Stack: vertical gaps](#stack-vertical-gaps)
- [Inline: horizontal gaps](#inline-horizontal-gaps)
- [Controls and targets](#controls-and-targets)
- [Density](#density)
- [Choosing and using space](#choosing-and-using-space)
- [Readers' settings and products](#readers-settings-and-products)

---

## Five principles

Five principles shape every spacing decision. Each one is checked by the build, not left to taste.

| Principle | What it means in practice |
|---|---|
| **Closer means related** | The more closely two things belong together, the smaller the space between them. Every family steps up from its smallest size to its largest, in every density (check S4). |
| **One ladder, three directions** | A size word means the same distance everywhere: `inset/md`, `stack/md` and `inline/md` are all 12px in default density. The family only says which way the space runs. |
| **Density is one rule** | Compact is one step down the scale and comfortable one step up, for every token (S3). Nothing ever collapses below 2px (S5). |
| **Targets stay big enough** | Every pointer target is at least 24 × 24px in every density (WCAG 2.5.8), and every control fits its label with room above and below (S1, S6). |
| **The reader's text gets the room** | Spacing is px and heights are minimums. When people enlarge text, the text gets the extra room and boxes grow with it (S8). |

---

## The spacing scale

Every value comes from one scale of 16 values, from 0 to 96px. The steps grow with the space: 2px apart up to 8px, 4px apart up to 24px, 8px apart up to 64px, then 16px. A 2px difference is easy to see between 4 and 6px and invisible between 60 and 62px, so the steps widen to stay visible. Every value from 8px up sits on the 4px grid, the same grid large type sizes use (check S7: 16/16 pass).

**Reading a primitive.** The number counts 4px units: `space/4` is 16px and `space/0-5` is 2px. These are the numbers Tailwind uses for its spacing scale, so they read the same in both.

Where each value is used. Sizes are the ladder (the same in every family); notice how they slide one step along the scale from one density to the next:

| Token | px | comfortable | default (default mode) | compact | Also linked from |
|---|---|---|---|---|---|
| `space/0` | 0 | — | — | — | — |
| `space/0-5` | 2 | — | — | xs | `focus/ring/offset` |
| `space/1` | 4 | — | xs | — | — |
| `space/1-5` | 6 | xs | — | sm, `control/icon-gap` | — |
| `space/2` | 8 | — | sm, `control/icon-gap` | md | — |
| `space/3` | 12 | sm, `control/icon-gap` | md | lg | — |
| `space/4` | 16 | md | lg | — | `layout/gutter`, `layout/margin` |
| `space/5` | 20 | lg | — | xl | — |
| `space/6` | 24 | `target/min` | xl, `target/min` | 2xl, `target/min` | `layout/gutter` |
| `space/8` | 32 | xl | 2xl | `control/height` | `layout/gutter`, `layout/margin` |
| `space/10` | 40 | 2xl | `control/height` | — | `layout/margin` |
| `space/12` | 48 | `control/height` | — | `layout/header/height` | — |
| `space/14` | 56 | — | `layout/header/height` | — | — |
| `space/16` | 64 | `layout/header/height` | — | — | `layout/margin` |
| `space/20` | 80 | — | — | — | — |
| `space/24` | 96 | — | — | — | — |

**Rules**

- **Never use a primitive in a design.** `space/4` doesn't change with density, so it stays put when the rest of the screen tightens. Use the semantic token for the job.
- **Never add a value between steps.** A 14px or 18px space isn't on the scale and isn't checked. If no token fits, add a token on a step (see the last chapter).

---

## How tokens are built

Spacing comes in tiers, like colour and type. Each tier only points to the one below it.

| Tier | In Figma | What it holds | Who touches it |
|---|---|---|---|
| **Primitives** | Primitives collection · one mode · hidden from publishing | The scale: 16 values. No meaning. | Nobody — the engine writes them |
| **Semantic** | Density collection · comfortable, default, compact | 20 tokens named by job: spacing in three families and the sizes of things people press. Each points to a primitive per density. | Everyone: designs and code use only this tier |
| **Component** | Added with components | Points to semantic tokens, e.g. a button's padding. | Component authors (later phase) |

**Reading a name.** `space / stack / md` — category `space`, family `stack` (which way the space runs), size `md` (how much). Sizes come from one ladder, xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 px in default density, and mean the same distance in every family. Density is a mode, never part of a name.

| Family | The space runs | CSS | Figma | Tailwind |
|---|---|---|---|---|
| `inset` | Padding inside a container | padding | Padding | `p-inset-*` `px-inset-*` `py-inset-*` `pt-inset-*` |
| `stack` | Vertical gap between things stacked in a column | row-gap, margin-block (margin-top, margin-bottom) | Gap in a vertical auto layout | `gap-y-stack-*` `space-y-stack-*` `mt-stack-*` `mb-stack-*` |
| `inline` | Horizontal gap between things side by side in a row | column-gap, margin-inline (margin-left, margin-right) | Gap in a horizontal auto layout | `gap-x-inline-*` `space-x-inline-*` `ml-inline-*` `mr-inline-*` |

**One name, three places.** Designers and developers say the same word for the same space:

| Figma variable | CSS variable | Tailwind |
|---|---|---|
| `space/inset/md` | `--ds-space-inset-md` | `p-inset-md`, `px-inset-md` |

In Figma, a frame's **Density** mode decides which values every variable inside it shows. In code, `data-density` on `<html>` or on any container does the same, and without it the page uses `default`.

---

## Inset: padding

Inset is the padding between a container's edge and its content. Pick it by the size of the container: small things wrap tightly, big surfaces breathe.

- **The same on every side** by default. A card is `inset/lg` all round.
- **Short labels are the exception.** A badge or chip takes `inset/xs` above and below and `inset/sm` at the sides, so the label doesn't look squeezed.
- **Controls are the exception.** A button's or input's height comes from `size/control/height` as a minimum; its sides take `inset/md` and a small `inset/xs` above and below keeps a label that wraps off the edge. The label stays centred at every density and every text size.
- **Inner is smaller than outer.** A panel inside a card gets a smaller inset than the card. Corners follow too: an inner radius is the outer radius minus the padding (Shape foundation).

**Inset tokens**

| Token | Use it for | comfortable | default (default mode) | compact |
|---|---|---|---|---|
| `space/inset/xs` | Badges, tags and small chips, above and below the label (their sides take inset.sm) | 6 | 4 | 2 |
| `space/inset/sm` | Menu items, list rows, tooltips, cells in dense tables | 12 | 8 | 6 |
| `space/inset/md` | The sides of buttons and inputs; table cells, popovers, toasts | 16 | 12 | 8 |
| `space/inset/lg` | Cards and panels | 20 | 16 | 12 |
| `space/inset/xl` | Dialogs, sheets, large cards and empty states | 32 | 24 | 20 |
| `space/inset/2xl` | Bands that run across a page; the space above and below a page's content | 40 | 32 | 24 |

**Rules**

- **Pad the container, not the child.** Space between a container's edge and its content is the container's inset, not a margin on the first child.
- **Inside is smaller than outside.** A container's inset is smaller than the space around the container.

---

## Stack: vertical gaps

Stack is the space between things in a column. Pick it by how closely they belong together: parts of one thing get `stack/xs`, sections of a page `stack/2xl`.

A form field shows the whole ladder at work, in default density:

| Between | Token | px |
|---|---|---|
| A label and its field | `stack/xs` | 4 |
| A field and its help text | `stack/xs` | 4 |
| One field and the next | `stack/lg` | 16 |
| One group of fields and the next | `stack/xl` | 24 |
| The form and the next section | `stack/2xl` | 32 |

Because each pair sits closer to itself than to its neighbours, people see four fields in two groups without reading a word. Paragraphs are separated by `stack/lg` (16px in default density), never by empty lines.

**Stack tokens**

| Token | Use it for | comfortable | default (default mode) | compact |
|---|---|---|---|---|
| `space/stack/xs` | Parts of one thing: a label and its field, a field and its help text, a title and its subtitle | 6 | 4 | 2 |
| `space/stack/sm` | Items of one group: options in a checkbox group, rows of a simple list, menu items | 12 | 8 | 6 |
| `space/stack/md` | A heading and the content under it; items inside a card | 16 | 12 | 8 |
| `space/stack/lg` | Paragraphs, fields in a form, cards in a list | 20 | 16 | 12 |
| `space/stack/xl` | Groups in a form or panel; blocks inside a large card | 32 | 24 | 20 |
| `space/stack/2xl` | Sections of a page or panel | 40 | 32 | 24 |

**Rules**

- **Inside a group is smaller than between groups.** Equal spacing everywhere makes every element look unrelated.
- **Put the gap on the parent.** A column with row-gap (or an auto-layout gap in Figma) has one place to change; margins on every child have many.
- **Group in the markup too.** If spacing shows a group, wrap it in a list, a fieldset or a section with a heading, so screen-reader users get the same grouping.

---

## Inline: horizontal gaps

Inline is the space between things side by side in a row: an icon and its text, buttons in a group, groups in a toolbar. The same ladder applies — the more closely two things belong together, the smaller the gap.

**Rows that wrap** take two tokens: stack for the space between lines, inline for the space between items. In CSS that is one declaration: `gap: var(--ds-space-stack-sm) var(--ds-space-inline-sm)` (row gap first).

**Right-to-left languages.** Use column-gap and the logical margins (margin-inline-start and -end) so the space flips with the text direction.

**Inline tokens**

| Token | Use it for | comfortable | default (default mode) | compact |
|---|---|---|---|---|
| `space/inline/xs` | An icon and its text in content; a value and its unit | 6 | 4 | 2 |
| `space/inline/sm` | Items of one group: buttons in a button group, chips, tags; a checkbox or radio and its label | 12 | 8 | 6 |
| `space/inline/md` | Fields side by side; a title and its actions in a header | 16 | 12 | 8 |
| `space/inline/lg` | Columns of content inside a card or panel; filters next to a search box | 20 | 16 | 12 |
| `space/inline/xl` | Groups in a toolbar or action bar | 32 | 24 | 20 |

**Rules**

- **Let rows wrap.** When a row runs out of room, it wraps; never shrink the gap to make it fit.
- **One gap per group.** Buttons in one group share one gap; a bigger gap separates the next group.

---

## Controls and targets

Things people press need room for a finger, a shaking hand or a mouse that lands a little off. WCAG 2.5.8 asks for at least 24 × 24px. ds meets it in every density (check S1: 6/6 pass), and comfortable controls reach 48px, over the 44px of the stricter AAA criterion (S2: pass).

**Size tokens**

| Token | Use it for | comfortable | default (default mode) | compact |
|---|---|---|---|---|
| `size/control/height` | Minimum height of buttons, inputs, selects and tabs; the minimum width and height of an icon-only button | 48 | 40 | 32 |
| `size/control/icon-gap` | Gap between an icon and the label inside a control | 12 | 8 | 6 |
| `size/target/min` | Smallest pointer target in every density (WCAG 2.5.8: 24×24px): the hit area of a checkbox, a close icon, a drag handle · the same in every density | 24 | 24 | 24 |

**Controls fit their label.** Each density's controls use a label style (Typography foundation), and the build checks the label has room above and below (S6):

| Density | Control height | Label | Room above and below |
|---|---|---|---|
| comfortable | 48px | `label/lg` 16/22px | 13px |
| default | 40px | `label/md` 14/20px | 10px |
| compact | 32px | `label/md` 14/20px | 6px |

**Small marks get a hit area.** A checkbox can be drawn at 16px as long as the area that reacts to a click is at least `size/target/min` (24px): add padding around it or make its label part of the target. The same goes for close icons and drag handles. Links inside a sentence are the one exception WCAG allows — their size comes from the line of text.

**Rules**

- **Heights are minimums.** Use `size/control/height` as a minimum height. At 200% text a label line is twice as tall; a fixed height cuts it off.
- **Icon-only buttons are square.** Minimum width and height both `size/control/height`: 48 / 40 / 32px (comfortable / default / compact). Minimums, not fixed sizes: an icon drawn as a character grows with the text.
- **Don't rely on gaps between small targets.** WCAG accepts small targets with enough space around them; in ds every target is big enough on its own, so nothing depends on the gap.

---

## Density

Density changes how much fits on a screen. It is a mode with three values and one rule: **compact is one step down the scale, comfortable one step up**, for every spacing token and control size. The target floor never moves. Check S3: 22/22 pass.

The rule applied to the ladder:

| Size | comfortable | default (default mode) | compact |
|---|---|---|---|
| xs | 6 | 4 | 2 |
| sm | 12 | 8 | 6 |
| md | 16 | 12 | 8 |
| lg | 20 | 16 | 12 |
| xl | 32 | 24 | 20 |
| 2xl | 40 | 32 | 24 |

The same rule moves control heights (48 / 40 / 32px) and the icon gap (12 / 8 / 6px). Because every token moves together, the ladder holds in every density: the space inside a group is still smaller than the space around it.

**Which density?**

| Screen | Density |
|---|---|
| Tables, dashboards, admin tools — people scan a lot at once | `data-density="compact"` |
| Most product screens | `data-density="default"` |
| Touch-first screens, onboarding, people who need bigger targets | `data-density="comfortable"` |
| One dense part of a page, such as a table in a default page | `data-density="compact"` on that container |

**One part of a page.** A dense table inside a default page gets `data-density="compact"` on its container; everything inside it follows, and the rest of the page doesn't change. In Figma, set that frame's Density mode.

**Labels follow the density.** Comfortable controls use `label/lg`, default and compact `label/md` (Typography foundation).

**Rules**

- **Choose density per screen or region.** Not per component: a compact button next to a default one looks like a mistake.
- **Never make compact by renaming tokens.** `inset/sm` "for compact" moves one value one step further than the rest of the screen and skips the checks. Set the mode.

---

## Choosing and using space

Two questions get you to the right token almost every time: *which way does the space run?* (that's the family) and *how closely do these two things belong together?* (that's the size).

**Space inside something (padding)** — What is the container?

| When | Use |
|---|---|
| A badge, tag or small chip — above and below its label (the sides take space.inset.sm) | `space/inset/xs` |
| A menu item, list row, tooltip, or a cell in a dense table | `space/inset/sm` |
| The sides of a button or input; a table cell, popover or toast | `space/inset/md` |
| A card or panel | `space/inset/lg` |
| A dialog, sheet, large card or empty state | `space/inset/xl` |
| A band across the page; the space above and below a page's content | `space/inset/2xl` |

**Space between things above and below each other** — How closely do they belong together?

| When | Use |
|---|---|
| Parts of one thing: a label and its field, a field and its help text, a title and its subtitle | `space/stack/xs` |
| Items of one group: options in a checkbox group, rows of a simple list, menu items | `space/stack/sm` |
| A heading and the content under it; items inside a card | `space/stack/md` |
| Paragraphs, fields in a form, cards in a list | `space/stack/lg` |
| Groups in a form or panel; blocks inside a large card | `space/stack/xl` |
| Sections of a page or panel | `space/stack/2xl` |

**Space between things side by side** — How closely do they belong together?

| When | Use |
|---|---|
| An icon and its text in content; a value and its unit | `space/inline/xs` |
| Items of one group: buttons in a button group, chips, tags | `space/inline/sm` |
| A checkbox or radio and its label (a native box has no space of its own) | `space/inline/sm` |
| Fields side by side; a title and its actions in a header | `space/inline/md` |
| Columns of content in a card or panel; filters next to a search box | `space/inline/lg` |
| Groups in a toolbar or action bar | `space/inline/xl` |

**Something people press** — What is it?

| When | Use |
|---|---|
| A button, input, select or tab | `size/control/height` (as min-height) |
| An icon-only button | `size/control/height` (min-width and min-height) |
| An icon next to the label inside a control | `size/control/icon-gap` |
| A small mark people click: a checkbox, a close icon, a drag handle | `size/target/min` (its hit area) |

**Worked example — a settings card.** Spaced one question at a time, in default density:

| Part | Token | px | Why |
|---|---|---|---|
| Card padding | `inset/lg` | 16 | A card. |
| Title → its description | `stack/xs` | 4 | Parts of one thing. |
| Description → first field | `stack/md` | 12 | A heading and its content. |
| Label → input, input → help | `stack/xs` | 4 | Parts of one field. |
| Field → next field | `stack/lg` | 16 | Fields in a form. |
| Fields → buttons | `stack/xl` | 24 | A new group. |
| Button → button | `inline/sm` | 8 | Items of one group. |
| Button height · sides | `size/control/height` · `inset/md` | 40 · 12 | A control. |
| Card → next card | `stack/lg` | 16 | Cards in a list. |

**Do and avoid** (measured in this build)

| Avoid | Measured | Do |
|---|---|---|
| Padding written as 12px | stays 12px in every density; `space/inset/md` is 16 / 12 / 8px (comfortable / default / compact) | `space/inset/md` — follows the density |
| Compact made by swapping names (inset.md → inset.sm in a .compact class) | inside a compact screen that gives 6px — two steps from default while everything else moves one | `data-density="compact"` — on the container: `space/inset/md` becomes 8px and every other token moves with it |
| Icon-only button drawn 20 × 20px | 20px is below the 24px minimum (WCAG 2.5.8) | `size/control/height` — as min-width and min-height: 48 / 40 / 32px square |
| Button with height: 32px | at 200% text a `label.md` line is 40px, so a fixed 32px box cuts the label off | `size/control/height` — as min-height — the button grows with its label |
| Page margins in rem (1rem) | at 200% text on a 320px phone each margin becomes 32px: 256px of content, under 272px | `layout/margin` — 16px (px, linked to spacing): 288px of content |
| The same space between everything (stack.md everywhere) | a label is 12px from its own field and 12px from the next field's label, so pairs don't read as pairs | `space/stack/xs` / `space/stack/lg` — xs inside a field (4px), lg between fields (16px) |

---

## Readers' settings and products

People change how text looks, and products change how dense their screens are. The system is built so neither breaks a screen.

**Bigger text (WCAG 1.4.4).** Spacing is px, so when someone sets a larger text size, the text gets the room. On a 320px phone at 200% text the page margins stay 16px and the content keeps 288px; margins in rem would double to 32px each and leave 256px. Check S8: 17/17 pass.

**More spacing (WCAG 1.4.12).** Some readers add space after paragraphs (2 × the font size) and between lines. Boxes with a minimum height grow; boxes with a fixed height cut the text off. The type audit applies this override to a real page.

**Bigger targets.** Products whose people need bigger targets — touch screens, field work, people with tremors — can default to comfortable, or offer it as a setting: controls are then 48px.

**What the config changes**

| Follows the config | Fixed on purpose |
|---|---|
| The default density (`density.default`, now `default`) | The scale and the ladder |
| How far density moves (`spacing.densityStep`, now 1) | The 24px target floor and every check |
| Tokens added for this product (`spacing.tokens`) | Token names — nothing in designs or code is renamed |

**A bigger density step.** `"densityStep": 2` moves every token two steps. The checks show why it isn't the default: compact `inset/xs` would be 0px (S5) and compact controls 24px tall, leaving 2px around the label (S6). The build stops and says so.

**Adding a token.** First check [Choosing and using space](#choosing-and-using-space) — most needs already have a token. If none fits, add one to a family with a size from 2xs to 4xl and a base on the scale; the build works out compact and comfortable, checks that it sits in the ladder (bigger than the size below it, smaller than the size above, the same as that size in other families) and puts it in Figma, CSS, Tailwind, this guide and the AI contract at once.

```json
{
  "spacing": {
    "tokens": [
      {
        "name": "space.stack.3xl",
        "base": "12",
        "description": "Sections of a long landing page"
      }
    ]
  }
}
```

The build refuses px values, families other than inset, stack and inline (space for one component belongs with that component), names that already exist and bases that aren't on the scale.

**Linked to layout.** Page gutters and margins point at the same scale, per breakpoint rather than density — change the scale and the grid follows:

| Token | sm | md | lg | xl |
|---|---|---|---|---|
| `layout/gutter` | 16 (`space/4`) | 24 (`space/6`) | 24 (`space/6`) | 32 (`space/8`) |
| `layout/margin` | 16 (`space/4`) | 32 (`space/8`) | 40 (`space/10`) | 64 (`space/16`) |

---

## Accessibility reference

What the build checks for spacing, and the result for this build:

| Check | What it checks | WCAG | Result |
|---|---|---|---|
| S1 | Pointer targets ≥ 24×24px in every density | 2.5.8 (AA) | pass · 6/6 pass |
| S2 | Comfortable density controls ≥ 44px | 2.5.5 (AAA) | pass · 1/1 pass |
| S3 | Density is one rule: every token moves the same number of steps along the scale (compact down, comfortable up); the target floor never moves | — (our rule) | pass · 22/22 pass |
| S4 | One ladder: sizes step up inside each family, and a size word is the same distance in every family, in every density | — (our rule) | pass · 60/60 pass |
| S5 | Nothing collapses: every space is at least 2px in every density | — (our rule) | pass · 60/60 pass |
| S6 | Controls fit their label in every density, with at least 4px above and below | — (our rule) | pass · 3/3 pass |
| S7 | The scale sits on a grid: 2px steps below 8px, the 4px grid from 8px up, always increasing | — (our rule) | pass · 16/16 pass |
| S8 | In code, spacing is px: when readers enlarge text, the text gets the room, not the margins | 1.4.4, 1.4.10 (AA) | pass · 17/17 pass |

What the checkers look for in your own code and pages: the spacing checker (`npm run lint:space`) reads CSS, HTML and JSX; the spacing audit (`npm run audit:space`) renders a page in all three densities and measures every target, then checks controls at 200% text. See the [handoff](HANDOFF.md).

**Glossary**

| Term | Meaning |
|---|---|
| Inset | Padding between a container's edge and its content. |
| Stack | The vertical gap between things in a column. |
| Inline | The horizontal gap between things in a row. |
| Ladder | The sizes xs to 2xl, the same distance in every family. |
| Step | One move along the scale: from 12px, one step down is 8px and one step up is 16px. |
| Density | comfortable, default or compact — a mode that moves every token along the scale. |
| Target | The area that reacts to a click or tap. |
| Hit area | A target made bigger than what is drawn, with padding or an invisible layer. |
| Primitive | A raw value on the scale, with no meaning; semantic tokens point at it. |
| Mode | A set of values for every variable in a collection; switching it on a frame or container changes them all. |
