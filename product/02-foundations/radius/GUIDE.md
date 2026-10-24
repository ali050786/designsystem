# Radius

*ds foundations · radius · the written guide. Generated from the engine — 18 tokens, 6 roles, 3 styles; every radius check passing. Do not edit by hand; change the engine config and build again.*

This guide explains how ds rounds corners: the roles a shape can take, the three styles a product chooses between, how corners behave when shapes sit inside or against each other, and how focus rings and text stay clear of them. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after [Choosing a shape](#choosing-a-shape); developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (`radius.md`, `radius.contract.json`).

**Contents**

- [Five principles](#five-principles)
- [How tokens are built](#how-tokens-are-built)
- [Roles by job](#roles-by-job)
- [Radius styles](#radius-styles)
- [Nested corners](#nested-corners)
- [Joined corners](#joined-corners)
- [Focus rings](#focus-rings)
- [Corners and content](#corners-and-content)
- [Choosing a shape](#choosing-a-shape)
- [Readers' settings and products](#readers-settings-and-products)

---

## Five principles

Five principles shape every corner. Each one is checked by the build, not left to taste.

| Principle | What it means in practice |
|---|---|
| **Shape follows the job** | A shape's radius comes from what it is — a mark, a control, a container, a surface, a pill — never from how big it is or what looks nice next to it. Six roles cover every shape; the same kind of thing has the same corners everywhere. |
| **One style, chosen once** | A product picks sharp, default or round in its config, and every role follows. Roles keep their order in every style (R1: 9/9 pass), so a dialog is never sharper than the card under it. |
| **Inner is outer minus padding** | A shape inside a rounded one takes the parent's radius minus the padding between them — the only rule that keeps the gap even all the way round. It is an expression on the tokens, so it follows density and style by itself. |
| **Corners stay corners** | A radius is limited by the size of what it rounds: a checkbox never turns into a circle that reads as a radio, a control never into a pill, and text never runs out past a rounded edge (R2: 6/6 pass, R3: 54/54 pass). |
| **Nothing cuts the ring** | Focus rings follow the shape they surround (R4: 12/12 pass), and no rounded container clips them. Joined parts use logical corners, so they also work right to left. |

---

## How tokens are built

Radius tokens live in two collections: the scale, and the roles that pick from it per style.

| Collection | Modes | Radius tokens in it | Changes with |
|---|---|---|---|
| **Primitives** | one · hidden from publishing | The scale: `radius/0`, `radius/1`, `radius/2`, `radius/3`, `radius/4`, `radius/6`, `radius/8`, `radius/full` | nothing — raw values |
| **Shape** | sharp, default, round — default first, so frames on Auto use it | The roles (`shape/none`, `shape/mark`, `shape/control`, `shape/container`, `shape/surface`, `shape/pill`) and the focus-ring radii (`shape/mark-focus`, `shape/control-focus`, `shape/container-focus`, `shape/surface-focus`) | the radius style |

**The scale.** 8 steps, named by twos like the spacing scale is by fours (`radius/4` is 8px). Steps are 2px apart up to 8px, where a pixel still shows, then 4px; `radius/full` draws round ends on anything.

| Primitive | Value | Used by |
|---|---|---|
| `radius/0` | 0px | `shape/none` (sharp, default, round) |
| `radius/1` | 2px | `shape/mark` (sharp, default) · `shape/control` (sharp) · `shape/container` (sharp) |
| `radius/2` | 4px | `shape/mark` (round) · `shape/control` (default) · `shape/surface` (sharp) |
| `radius/3` | 6px | — (free for product roles) |
| `radius/4` | 8px | `shape/control` (round) · `shape/container` (default) |
| `radius/6` | 12px | `shape/container` (round) · `shape/surface` (default) |
| `radius/8` | 16px | `shape/surface` (round) |
| `radius/full` | full | `shape/pill` (sharp, default, round) |

**Reading a name.** `shape / container` — category `shape`, role `container`. Roles are named by job, never by size or look: "rounded-lg" stops being true the day the style changes; "container" doesn't.

**One name, three places.**

| Figma variable | CSS variable | Tailwind |
|---|---|---|
| `shape/container` | `--ds-shape-container` | `rounded-container` |

**Primitives are never used directly.** In Figma they are hidden from the radius picker; in code the checker flags `--ds-radius-*`. Only the roles change with the style.

---

## Roles by job

Six roles, from square to round. Pick by what the thing is; the style decides how round that is.

| Role | Use it for | sharp | default (this product) | round |
|---|---|---|---|---|
| `shape/none` | Square corners: tables and their cells, full-bleed images and bands, dividers, and the edges where joined parts meet | 0px | 0px | 0px |
| `shape/mark` | Small square marks about the size of a line of text: checkboxes, colour swatches, keyboard keys, inline code | 2px | 2px | 4px |
| `shape/control` | Things people press, type in or pick from: buttons, inputs, selects, tabs, menu items, chips, segmented controls | 2px | 4px | 8px |
| `shape/container` | Things that hold content in the page or float just above it: cards, panels, table frames, menus, popovers, tooltips, toasts | 2px | 8px | 12px |
| `shape/surface` | The largest shapes, on top of everything: dialogs, sheets, drawers (rounded only on the side that faces the page) | 4px | 12px | 16px |
| `shape/pill` | Fully round ends, for things whose label never wraps: badges, counters, toggle tracks, avatars, status dots | full | full | full |

**Why a mark is its own role.** Checkboxes and radio buttons are told apart by shape: square and round. A 16px checkbox with the control radius of the round style (8px) is a circle. `shape/mark` stays at most 4px — a quarter of the box — in every style (R2).

**Why controls stay below a quarter of their height.** The smallest control is 32px tall (compact density); its radius stays at most 8px, so a button keeps corners and never reads as a badge. A radius of half the height or more draws round ends — that is `shape/pill`'s job.

**Pills are for labels that never wrap.** Round ends grow with the height: a badge stays one line and stays a pill. A button can wrap — a long translation, 200% text on a phone — and a two-line pill cuts its first and last letters off its fill (see [Corners and content](#corners-and-content)). Buttons use `shape/control`.

**Rules**

- **Same thing, same corners.** Every button has the control radius, in every size, state and screen. A primary button is not rounder than a secondary one.
- **Square where it meets.** `shape/none` is for shapes that run edge to edge or meet other shapes: tables, full-bleed images, dividers, the shared edges of joined parts.
- **Radius never changes with state.** Hover, press, focus, selected and open change colour and the ring, never the corners.

---

## Radius styles

A style is the product's feel, chosen once: `sharp`, `default`, `round`. It moves every role together and keeps their order, so screens stay consistent whichever is picked. This product uses **default**.

| Role | sharp | default (this product) | round |
|---|---|---|---|
| `shape/mark` | 2px | 2px | 4px |
| `shape/control` | 2px | 4px | 8px |
| `shape/container` | 2px | 8px | 12px |
| `shape/surface` | 4px | 12px | 16px |

`shape/none` and `shape/pill` are the same in every style.

**Choosing.** `sharp` suits dense tools and data — corners barely soften, containers and controls look alike. `default` separates the roles clearly. `round` is friendlier and roomier; it pairs well with comfortable density. All three pass every check (R1–R4).

**Switching.** In the config: `"radius": { "style": "round" }`, then build. In code, `data-radius="sharp|default|round"` on `<html>` or on any element switches the roles inside it — a preview, a theme picker. In Figma, set the frame's Shape mode: one card, three modes, three styles.

**Rules**

- **One style per product.** Mixing styles on one screen undoes the point of roles. Use data-radius for previews, not for decoration.
- **Change the style, not the roles.** A rounder card is a style change, not a new value for `shape/container` in app code.

---

## Nested corners

When a rounded shape sits inside another with its corners in the other's corners — a panel filling a card, an item in a menu, a segment in a segmented control — the two curves should run side by side with the same gap all the way round. Only one rule does that: **inner radius = outer radius − padding**, never below zero.

| Inner radius | Gap along the sides | Gap at the corner | What you see |
|---|---|---|---|
| 4px (12 − 8) | 8px | 8px | An even band — the inner shape follows the outer one |
| 8px ("one step smaller") | 8px | 9.7px | The band widens at the corner |
| 12px (copied) | 8px | 11.3px | The inner shape bulges away from the corner |

*A 12px container (round style) with 8px padding.*

**Written on the tokens, not as a number.** The padding changes with density and the outer radius with the style, so the inner radius is an expression: `border-radius: max(0px, var(--ds-shape-container) - var(--ds-space-inset-sm));` — in Tailwind `rounded-[max(0px,var(--radius-container)-var(--spacing-inset-sm))]`. In Figma, set the inner frame's radius to the computed value for the frame's modes (the table below).

**Inside `shape/container`** (default style)

| Padding | comfortable | default (default mode) | compact |
|---|---|---|---|
| flush (0) | 8px | 8px | 8px |
| `space/inset/xs` | 2px | 4px | 6px |
| `space/inset/sm` | own role | own role | 2px |
| `space/inset/md` | own role | own role | own role |
| `space/inset/lg` | own role | own role | own role |
| `space/inset/xl` | own role | own role | own role |

**Inside `shape/surface`** (default style)

| Padding | comfortable | default (default mode) | compact |
|---|---|---|---|
| flush (0) | 12px | 12px | 12px |
| `space/inset/xs` | 6px | 8px | 10px |
| `space/inset/sm` | own role | 4px | 6px |
| `space/inset/md` | own role | own role | 4px |
| `space/inset/lg` | own role | own role | own role |
| `space/inset/xl` | own role | own role | own role |

"Own role": the padding is at least the parent's radius, so the child's corners are clear of the curve — it keeps its own role (a card in a padded section, tiles in a grid).

**Flush children.** A header, image or table that touches the container's edge has no padding: it takes the container's radius on the corners it shares and stays square elsewhere. A square header in a 12px card would poke 5px out past each rounded corner. Don't hide that with `overflow: hidden` on the card — clipping cuts off focus rings (see [Focus rings](#focus-rings)).

**Rules**

- **Only near the corners.** The rule is for shapes whose corners sit inside the parent's corner. A button in the middle of a card keeps its own role.
- **Only inside the curve.** The rule applies while the padding is smaller than the parent's radius. Inside an 8px card with `space/inset/lg` padding, a code block is clear of the card's curve and keeps its own role.

---

## Joined corners

Parts that touch — a button group, a segmented control, an input with its button, stacked list items — read as one shape. The outer corners keep the role's radius; the edges where parts meet are square.

| Pattern | Outer corners | Where parts meet | In code |
|---|---|---|---|
| Side by side | the role (control for buttons) | square | `.ds-join` |
| Stacked | the role (container for list items) | square | `.ds-join[data-join="block"]` |
| A drawer or sheet attached to the window edge | `shape/surface` on the side facing the page | square on the side touching the edge | logical corners: `border-start-end-radius`, `border-end-end-radius` |

**Logical corners.** Corners are named by the text direction, not by left and right: `border-start-start-radius` is top-left in English and top-right in Arabic or Hebrew. With physical corners (`border-top-left-radius`, Tailwind `rounded-l-`), a joined group turns inside out in a right-to-left layout: rounded seams, square ends. `.ds-join` uses logical corners.

**The focused part comes forward.** In a group, the next part is painted after the focused one and can cover its ring where they meet. `.ds-join` lifts the focused part above its neighbours.

```html
<div class="ds-join" role="group" aria-label="View">
  <button class="btn" aria-pressed="true">List</button>
  <button class="btn" aria-pressed="false">Board</button>
  <button class="btn" aria-pressed="false">Calendar</button>
</div>
```

**Rules**

- **One shape, one role.** All outer corners of a joined group use the same role. A group of buttons is control on every outer corner.
- **A gap means separate.** If the parts have a gap between them, they are separate shapes and each keeps all four corners.

---

## Focus rings

Every focusable element shows a 2px ring 2px outside it (Border foundation). The ring is part of the shape: it should hug the corners, and nothing should cut it off.

**Outlines follow the radius.** `tokens.css` draws the ring as an outline on `:focus-visible`; browsers draw outlines along `border-radius`, offset included. Nothing to set.

**A ring on its own layer needs the -focus radius.** Some designs draw the ring on a pseudo-element or another layer (a ring around a group, a ring inside a custom control). Offset outwards, it needs a larger radius to stay parallel to the shape: the shape's radius plus the offset (R4).

| Token | For | sharp | default (this product) | round |
|---|---|---|---|---|
| `shape/mark-focus` | `shape/mark` | 4px | 4px | 6px |
| `shape/control-focus` | `shape/control` | 4px | 6px | 10px |
| `shape/container-focus` | `shape/container` | 4px | 10px | 14px |
| `shape/surface-focus` | `shape/surface` | 6px | 14px | 18px |

**Nothing clips the ring.** The ring reaches 4px outside its element. A rounded container with `overflow: hidden` — the usual trick to round a card's image or header — cuts the ring of anything within 4px of its edge. Give flush children the nested radius instead ([Nested corners](#nested-corners)), and if something must be clipped, clip that child. A container that scrolls keeps at least 4px of padding around focusable content.

**Checked in the browser.** The radius audit tabs through a page and samples each focus ring on all four sides, in every style, so a ring that is clipped or covered by a neighbour shows up as a failure with the element that cut it.

**Rules**

- **Outline, not box-shadow.** Outlines follow the radius and survive forced-colours mode; box-shadow rings disappear there (Border foundation).
- **-focus tokens only for rings.** `shape/container-focus` is not a rounder card.

---

## Corners and content

Text's contrast is measured against the fill behind it. A rounded corner removes fill: if text reaches into the corner, its edge sits on whatever is behind the shape instead. The build checks that the corner of every label's and content box sits inside its rounded shape, for every role in every style and density (R3):

| Case (default, default) | Radius and the text box's corner | Inside |
|---|---|---|
| a button label | radius 4px, text corner 12 × 13px in | ✓ |
| a badge label (pill) | radius 12px, text corner 8 × 6px in | ✓ |
| a menu item label | radius 8px, text corner 12 × 17px in | ✓ |
| tooltip text | radius 8px, text corner 8 × 12px in | ✓ |
| card content | radius 8px, text corner 16 × 16px in | ✓ |
| dialog content | radius 12px, text corner 24 × 24px in | ✓ |

The tightest case is the badge: a pill's round ends come closest to its label. The badge's padding (`space/inset/xs` above and below, `space/inset/sm` at the sides) is what keeps the label clear in compact density.

**Pills and wrapping text.** A pill-shaped button whose label wraps (200% text on a phone): two lines make it 88px tall, so its ends are 44px round; the label's first and last letters sit 2.7px outside the shape, off the fill their contrast was measured on. Round ends are for labels that stay on one line; a button that can wrap uses `shape/control`. The radius audit renders pages at 200% text and flags any text that crosses its shape's edge.

**Radius and size.** A radius of 50% of the short side or more draws round ends, and CSS draws anything larger the same — so `radius/full` is a pill on anything. Below that, the same radius looks rounder on a smaller shape: 8px is a soft corner on a 48px button and half a circle on a 16px checkbox. That is why marks and controls have their own roles.

**Rules**

- **Padding before radius.** If text needs to go closer to the edge, the radius gets smaller (a nested radius or a smaller role) — the text doesn't move into the corner.
- **Icons count as content.** An icon in a pill or round button stays inside the shape like text does.

---

## Choosing a shape

Four questions get you to the right corners: *what is it?*, *is it inside something rounded?*, *does it touch another part?* and *how is its focus ring drawn?*

**Which role** — What is it?

| When | Use |
|---|---|
| A checkbox, a colour swatch, a keyboard key, inline code — a mark about the size of a line of text | `shape/mark` |
| Something people press, type in or pick from: a button, an input, a select, a tab, a menu item, a chip | `shape/control` |
| Something that holds content in the page or floats just above it: a card, a panel, a table frame, a menu, a popover, a tooltip, a toast | `shape/container` |
| The largest shape, on top of everything: a dialog, a sheet, a drawer | `shape/surface` (a drawer or sheet attached to an edge: only the side facing the page) |
| A badge, a counter, a toggle track, an avatar, a status dot — a label that never wraps | `shape/pill` |
| A table and its cells, a full-bleed image or band, a divider | `shape/none` |
| A button with a long or translated label, styled as a pill | `shape/control` — a pill whose label wraps cuts its text at the round ends |

**Inside something rounded** — How far is it from the parent's edge?

| When | Use |
|---|---|
| Inset by padding p smaller than the parent's radius (its corners sit in the parent's curve) | max(0px, parent − p): `max(0px, var(--ds-shape-container) - var(--ds-space-inset-sm))` — follows density and style |
| Inset by padding at least the parent's radius (a card in a padded section, tiles in a grid) | its own role — its corners are clear of the parent's curve |
| Flush with the edge (a header, an image, a table at the top of a card) | the parent's radius on the corners it shares (p = 0), square elsewhere — not `overflow: hidden` on the parent |
| A button, a badge or anything that doesn't fill the parent, even near a corner | its own role — the nested rule is for shapes that fill their parent |

**Touching another part** — Do the parts read as one shape?

| When | Use |
|---|---|
| Yes: a button group, a segmented control, an input with its button, stacked list items | `.ds-join` (or `data-join="block"`): outer corners keep the role, shared edges square |
| A drawer or sheet attached to the window edge | `shape/surface` on the corners facing the page only (logical corners: border-start-end-radius …) |
| No: separate things side by side | each keeps its own role and a gap (Spacing) |

**Focus** — How is the ring drawn?

| When | Use |
|---|---|
| With outline (tokens.css does it on :focus-visible) | nothing to set: an outline follows the radius |
| On a pseudo-element or another layer | `shape/<role>-focus` for the ring's radius |
| Inside a container that scrolls or clips | padding ≥ `focus/ring/offset` + `focus/ring/width` between the container's edge and anything focusable, or an inset ring |

**A different feel** — What should change?

| When | Use |
|---|---|
| The whole product: sharper or rounder | `radius.style` in the engine config (sharp, default, round) |
| One region, a preview or a theme picker | `data-radius` on that element (sharp, default or round) |
| A shape the roles don't cover (a thumbnail, a map pin) | `radius.roles` in the engine config — a role named by job with a key per style |

**Worked example — a settings card with a header image and a plan picker.** One question at a time:

| Part | Role or rule | Value here | Why |
|---|---|---|---|
| The card | `shape/container` | 8px | Holds content in the page. |
| The header image, flush with the top | flush child | 8px on the top corners, square below | Shares the card's top corners; no overflow: hidden. |
| The plan picker (three options side by side) | `.ds-join` + `shape/control` | 4px outside, square seams | One control in three parts. |
| A highlighted panel inset by `space/inset/xs` | nested | 4px (8 − 4) | Its corners sit in the card's corners. |
| The "Pro" badge | `shape/pill` | round ends | A one-word label that never wraps. |
| The "I agree" checkbox | `shape/mark` | 2px | A mark — square, so it never reads as a radio. |

**Do and avoid** (measured in this build)

| Avoid | Measured | Do |
|---|---|---|
| An inner radius copied from its parent (a 12px card, 8px padding, the child also 12px) | the gap is 8px along the sides and 11.3px at the corner — the inner shape bulges away from the corner | `max(0px, var(--ds-shape-container) - var(--ds-space-inset-sm))` — 4px in round, 0px in default — an even 8px all the way round |
| "One step smaller" for the inner radius (12px → 8px with 8px padding) | 9.7px at the corner against 8px along the sides; the right answer changes with the padding, which "one step" ignores | `parent − padding` — 4px, and it follows density: comfortable 0px, default 4px, compact 6px |
| A square header flush with the top of a 12px card | its corners poke 5px out past the card's rounded corner | the card's radius on the header's top corners — border-start-start-radius and border-start-end-radius: var(--ds-shape-container) — nothing pokes out, nothing is clipped |
| overflow: hidden on the card to hide those corners | the focus ring sits 2–4px outside an element, so anything within 4px of the card's edge loses its ring on that side | nested radius on the flush child — no clipping: the ring shows on all four sides (the radius audit samples them) |
| The control radius on a checkbox (round style: 8px on a 16px box) | 8px is half of 16px: the checkbox is a circle and reads as a radio button | `shape/mark` — 4px in round (≤ 4px in every style): a square with soft corners |
| A pill-shaped button whose label wraps (200% text on a phone) | two lines make it 88px tall, so its ends are 44px round; the label's first and last letters sit 2.7px outside the shape, off the fill their contrast was measured on | `shape/control` — 4px: the button grows, the corners stay corners |
| border-top-left-radius: 0 on the second button of a group | in a right-to-left layout the second button is on the left: its seam is rounded and its outer corner square | `.ds-join` — logical corners (border-start-start-radius …): the join flips with the text direction |
| border-radius: 6px on a button | doesn't follow the style: in sharp it stays 6px — rounder than sharp's containers (2px) — and nested radii computed from shape/control no longer match | `shape/control` — sharp 2px, default 4px, round 8px |

---

## Readers' settings and products

People enlarge text, switch to forced colours and read right to left; products add shapes of their own. Corners are built so none of that breaks.

**Bigger text (WCAG 1.4.4).** Radii are px: when text doubles, shapes grow around it and corners stay the same size, so more of each shape is straight edge. Pills are the exception — their ends grow with their height, which is why their labels must not wrap.

**Density.** Radii don't change with density; padding does. Nested radii follow automatically, because they are written as parent − padding on the tokens: inside an 8px container with `space/inset/xs`, comfortable 2px, default 4px, compact 6px.

**Forced colours and high contrast.** Windows' contrast themes keep borders and outlines and drop backgrounds and box-shadows. Corners survive; rings drawn as outlines survive. A shape that is visible only by its fill disappears — the Border foundation gives every control an outline.

**Right to left.** Joined groups, drawers and sheets use logical corners, so they flip with the text direction ([Joined corners](#joined-corners)).

**What the config changes**

| Follows the config | Fixed on purpose |
|---|---|
| The style (`radius.style`, now default: sharp, default, round) | The scale and the six roles |
| Roles added for this product (`radius.roles`) | The nested rule, the ring radii and the limits — computed and checked |

**Adding a role.** First check [Choosing a shape](#choosing-a-shape) — most shapes are one of the six. If a product needs another (a thumbnail, a map marker), name it by its job and give a key on the scale for each style; the build refuses names by look or size ("rounded", "lg"), keys off the scale, radii that shrink from sharp to round, and `full` (that is `shape/pill`). A role that passes appears in Figma, CSS, Tailwind, this guide and the AI contract at once, with its focus-ring radius computed:

```json
{
  "radius": {
    "style": "default",
    "roles": [
      {
        "name": "shape.thumbnail",
        "sharp": "1",
        "default": "3",
        "round": "4",
        "description": "Image previews in lists and pickers"
      }
    ]
  }
}
```

---

## Accessibility reference

What the build checks for radius, and the result for this build:

| Check | What it checks | WCAG | Result |
|---|---|---|---|
| R1 | Roles keep their order in every style (none < mark ≤ control ≤ container ≤ surface < pill), and each style is rounder than the one before | — (AA) | pass · 9/9 pass |
| R2 | Shapes keep their corners: a mark's radius ≤ 25% of a 16px checkbox (never mistaken for a radio), a control's ≤ 25% of the smallest control height | — (AA) | pass · 6/6 pass |
| R3 | Text stays inside the corners: in every style and density, the corner of a label's or content's box sits inside its rounded shape, on the fill its contrast is measured against | 1.4.3 (AA) | pass · 54/54 pass |
| R4 | Focus rings follow the shape: a ring on its own layer has the shape's radius plus the ring offset, in every style | 2.4.7 (AA) | pass · 12/12 pass |
| F2 | Focus ring ≥ 2px thick with an offset (colour checked in C3) | 2.4.7, 2.4.13 (AA) | pass · 2/2 pass |

What the checkers look for in your own code and pages: the radius checker (`npm run lint:radius`) reads CSS, HTML and JSX; the radius audit (`npm run audit:radius`) renders a page in every style, at 1280 and 320px and at 200% text, then checks radii that ignore the style, nested corners, text outside its shape, joined groups in both text directions and every focus ring on all four sides. See the [handoff](HANDOFF.md).

**Glossary**

| Term | Meaning |
|---|---|
| Radius | How far a corner's curve reaches along each edge. |
| Role | A radius named by what a shape is (control, container …); it changes with the style. |
| Style | The product's feel — sharp, default or round — chosen once in the config; a mode of the Shape collection. |
| Nested radius | The radius of a shape inside another: the outer radius minus the padding between them. |
| Flush | Touching the parent's edge, with no padding. |
| Joined | Parts that touch and read as one shape; only the outer corners are rounded. |
| Logical corner | A corner named by text direction (start, end) instead of left and right. |
| Round ends | What a radius of half the short side or more draws: a pill or a circle. |
| Mode | A set of values for every variable in a collection; switching it on a frame or element changes them all. |
