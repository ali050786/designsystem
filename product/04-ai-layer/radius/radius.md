# Radius rules for AI tools — ds

Generated from the engine (18 tokens; roles checked in all 3 styles and every density; all checks pass). The same data in machine-readable form: `radius.contract.json`.

## How to use this file
1. Pick each shape's role with the **Decision guide**, using token and class names exactly as written.
2. Use the token itself — never copy its number into your own CSS. Nested radii are expressions on the tokens, never numbers.
3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.
4. Before answering, run the **Self-check**.

## Hard rules
| ID | Rule | Why | WCAG |
|---|---|---|---|
| RR-01 | Corners come from a shape role: border-radius is var(--ds-shape-*) (Tailwind rounded-none, -mark, -control, -container, -surface, -pill). No px, rem, em or % values; 0 only for the edges where joined parts meet. | A hard-coded radius doesn't follow the product's style: in sharp it stays round, in round it looks pinched, and nested radii computed from the role no longer match it. | — |
| RR-02 | Never use radius primitives (--ds-radius-*) in components. Pick the role by job. | Primitives don't change with the style; a role does. | — |
| RR-03 | In Tailwind use only the ds rounded utilities (rounded-none, -mark, -control, -container, -surface, -pill and their side and corner forms). Tailwind's own rounded, rounded-xs … rounded-4xl are removed in tailwind.theme.css; rounded-full is not a ds role (use rounded-pill). | Tailwind's scale is a second set of radii that no check covers. | — |
| RR-04 | Pick the role by what the thing is, not by its size: marks (checkboxes, swatches) → shape.mark; things people press or type in → shape.control; content holders and menus → shape.container; dialogs, sheets, drawers → shape.surface; labels that never wrap → shape.pill. A checkbox never takes the control radius; a button that can wrap never takes the pill. | A checkbox with a round radius reads as a radio button; a pill whose label wraps at 200% text puts the first and last letters outside the shape, off the fill their contrast was measured on. | 1.4.3 |
| RR-05 | Nested corners: a shape that fills a rounded parent (edge to edge inside its padding: a panel, a header, a menu item, a segment) with padding p smaller than the parent's radius takes max(0px, parent − p), written with the tokens: max(0px, var(--ds-shape-container) - var(--ds-space-inset-sm)), so it follows density and style. A flush child (p = 0) takes the parent's radius on the corners it shares. Never copy the parent's radius, never "one step smaller". With padding of at least the parent's radius the child is clear of the curve and keeps its own role. | Only parent − padding keeps the gap even all the way round the corner; a copied radius bulges at the corner (always 41% wider than the sides), and a square flush child pokes out of the rounded corner. | — |
| RR-06 | Joined parts keep their outer corners and square the edges where they meet: use .ds-join, or logical corner properties (border-start-start-radius …; Tailwind rounded-s-, -e-, -ss-, -se-, -es-, -ee-). Never physical corners (border-top-left-radius, rounded-l-, rounded-tl-): they don't flip in right-to-left layouts. | In right-to-left the first part is on the right: with physical corners the seams come out rounded and the outer corners square. | — |
| RR-07 | Focus rings are outlines (tokens.css draws them on :focus-visible), which follow the element's radius. A ring drawn on a pseudo-element or another layer takes --ds-shape-`<role>`-focus. The -focus tokens are for rings only. | A ring with the element's own radius, offset outwards, has corners tighter than the shape — the gap pinches at every corner. | 2.4.13 |
| RR-08 | Don't round a container's content by clipping it: no overflow: hidden or clip on a rounded container that holds anything focusable. Give the flush child the container's radius instead (RR-05); clip an image itself, not its card. A container that scrolls keeps padding ≥ focus.ring.offset + focus.ring.width around focusable content. | Clipping cuts off the focus ring of anything within the ring's reach of the edge — the ring sits outside the element. | 2.4.7, 2.4.13 |
| RR-09 | Radius never changes with state: no border-radius change on hover, focus, active, checked, selected or open. Show state with colour, the focus ring and text. | A shape that changes with state is a cue only some people notice, and it moves the focus ring and the nested corners with it. | — |
| RR-10 | Never redefine shape or radius variables in app code (--ds-shape-*, --ds-radius-*). Change radius.style or radius.roles in the engine config and build; switch one region with data-radius. | An overridden radius skips the checks that keep roles in order, text inside the corners and rings hugging the shape. | — |

## Decision guide

**Which role** — What is it?

| When | Use |
|---|---|
| A checkbox, a colour swatch, a keyboard key, inline code — a mark about the size of a line of text | `shape.mark` |
| Something people press, type in or pick from: a button, an input, a select, a tab, a menu item, a chip | `shape.control` |
| Something that holds content in the page or floats just above it: a card, a panel, a table frame, a menu, a popover, a tooltip, a toast | `shape.container` |
| The largest shape, on top of everything: a dialog, a sheet, a drawer | `shape.surface` (a drawer or sheet attached to an edge: only the side facing the page) |
| A badge, a counter, a toggle track, an avatar, a status dot — a label that never wraps | `shape.pill` |
| A table and its cells, a full-bleed image or band, a divider | `shape.none` |
| A button with a long or translated label, styled as a pill | `shape.control` — a pill whose label wraps cuts its text at the round ends |

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
| A drawer or sheet attached to the window edge | `shape.surface` on the corners facing the page only (logical corners: `border-start-end-radius` …) |
| No: separate things side by side | each keeps its own role and a gap (Spacing) |

**Focus** — How is the ring drawn?

| When | Use |
|---|---|
| With outline (tokens.css does it on :focus-visible) | nothing to set: an outline follows the radius |
| On a pseudo-element or another layer | `shape.<role>-focus` for the ring's radius |
| Inside a container that scrolls or clips | padding ≥ `focus.ring.offset` + `focus.ring.width` between the container's edge and anything focusable, or an inset ring |

**A different feel** — What should change?

| When | Use |
|---|---|
| The whole product: sharper or rounder | `radius.style` in the engine config (sharp, default, round) |
| One region, a preview or a theme picker | `data-radius` on that element (sharp, default or round) |
| A shape the roles don't cover (a thumbnail, a map pin) | `radius.roles` in the engine config — a role named by job with a key per style |

## Roles
The product's style is **default** (on `:root`). In code use the CSS variable or the Tailwind utility; in Figma the variable of the same name.

| Role | CSS variable | Tailwind | sharp | default (this product) | round | Use |
|---|---|---|---|---|---|---|
| `shape.none` | `--ds-shape-none` | `rounded-none` | 0px | 0px | 0px | Square corners: tables and their cells, full-bleed images and bands, dividers, and the edges where joined parts meet |
| `shape.mark` | `--ds-shape-mark` | `rounded-mark` | 2px | 2px | 4px | Small square marks about the size of a line of text: checkboxes, colour swatches, keyboard keys, inline code |
| `shape.control` | `--ds-shape-control` | `rounded-control` | 2px | 4px | 8px | Things people press, type in or pick from: buttons, inputs, selects, tabs, menu items, chips, segmented controls |
| `shape.container` | `--ds-shape-container` | `rounded-container` | 2px | 8px | 12px | Things that hold content in the page or float just above it: cards, panels, table frames, menus, popovers, tooltips, toasts |
| `shape.surface` | `--ds-shape-surface` | `rounded-surface` | 4px | 12px | 16px | The largest shapes, on top of everything: dialogs, sheets, drawers (rounded only on the side that faces the page) |
| `shape.pill` | `--ds-shape-pill` | `rounded-pill` | full | full | full | Fully round ends, for things whose label never wraps: badges, counters, toggle tracks, avatars, status dots |

**Switching style.** The product's style (default) is on :root. data-radius="sharp|default|round" on <html> or any element switches the roles inside it.

## Nested corners
inner radius = max(0, parent radius − padding), for a shape that fills its parent edge to edge inside the padding (a panel, a header, a menu item, a segment) when the padding is smaller than the parent's radius; a flush child (padding 0) takes the parent's radius on the corners it shares; with padding of at least the parent's radius the child is clear of the curve and keeps its own role.

- CSS: `border-radius: max(0px, var(--ds-shape-container) - var(--ds-space-inset-sm));`
- Tailwind: `rounded-[max(0px,var(--radius-container)-var(--spacing-inset-sm))]`

Computed for the product's style (default), per density:


**Inside `shape.container`**

| Padding | comfortable | default | compact | CSS |
|---|---|---|---|---|
| flush (0) | 8px | 8px | 8px | `var(--ds-shape-container)` |
| `space.inset.xs` | 2px | 4px | 6px | `max(0px, var(--ds-shape-container) - var(--ds-space-inset-xs))` |
| `space.inset.sm` | own role (clear) | own role (clear) | 2px | `max(0px, var(--ds-shape-container) - var(--ds-space-inset-sm))` |
| `space.inset.md` | own role (clear) | own role (clear) | own role (clear) | `max(0px, var(--ds-shape-container) - var(--ds-space-inset-md))` |
| `space.inset.lg` | own role (clear) | own role (clear) | own role (clear) | `max(0px, var(--ds-shape-container) - var(--ds-space-inset-lg))` |
| `space.inset.xl` | own role (clear) | own role (clear) | own role (clear) | `max(0px, var(--ds-shape-container) - var(--ds-space-inset-xl))` |

**Inside `shape.surface`**

| Padding | comfortable | default | compact | CSS |
|---|---|---|---|---|
| flush (0) | 12px | 12px | 12px | `var(--ds-shape-surface)` |
| `space.inset.xs` | 6px | 8px | 10px | `max(0px, var(--ds-shape-surface) - var(--ds-space-inset-xs))` |
| `space.inset.sm` | own role (clear) | 4px | 6px | `max(0px, var(--ds-shape-surface) - var(--ds-space-inset-sm))` |
| `space.inset.md` | own role (clear) | own role (clear) | 4px | `max(0px, var(--ds-shape-surface) - var(--ds-space-inset-md))` |
| `space.inset.lg` | own role (clear) | own role (clear) | own role (clear) | `max(0px, var(--ds-shape-surface) - var(--ds-space-inset-lg))` |
| `space.inset.xl` | own role (clear) | own role (clear) | own role (clear) | `max(0px, var(--ds-shape-surface) - var(--ds-space-inset-xl))` |

"own role (clear)": the padding is at least the parent's radius, so the child's corners are clear of the curve.

## Joined parts and focus rings
- `.ds-join`: Joined parts side by side (a button group, a segmented control, an input with its button): outer corners keep their role's radius, the edges where parts meet are square; logical corners, so it flips in right-to-left; a focused part is lifted above its neighbours. Markup: `<div class="ds-join" role="group" aria-label="…"> <button>…</button> <button>…</button> </div> (data-join="block" for stacked parts)`.
- Corners by side are logical: border-start-start-radius, border-start-end-radius, border-end-start-radius, border-end-end-radius (Tailwind rounded-ss-, -se-, -es-, -ee-, rounded-s-, -e-).
- Focus: a 2px ring, 2px outside the element, drawn as an outline (it follows the radius). A ring on its own layer: `shape.<role>-focus`.

| Ring token | CSS variable | sharp | default | round | For |
|---|---|---|---|---|---|
| `shape.mark-focus` | `--ds-shape-mark-focus` | 4px | 4px | 6px | `shape.mark` |
| `shape.control-focus` | `--ds-shape-control-focus` | 4px | 6px | 10px | `shape.control` |
| `shape.container-focus` | `--ds-shape-container-focus` | 4px | 10px | 14px | `shape.container` |
| `shape.surface-focus` | `--ds-shape-surface-focus` | 6px | 14px | 18px | `shape.surface` |

## Limits the build enforces
| Limit | Value |
|---|---|
| Order | none < mark ≤ control ≤ container ≤ surface < pill in every style; each style rounder than the one before |
| Corners stay corners | a mark ≤ 25% of a 16px checkbox (never a circle); a control ≤ 25% of the smallest control (32px) |
| Round ends | a radius ≥ 50% of the short side makes round ends; anything larger draws the same |
| Text inside the corners | the corner of every label's and content box sits inside its rounded shape, in every style and density |
| Focus rings | a ring reaches 4px outside its element: nothing clips it, and a ring on its own layer takes shape + 2px |

## Common mistakes (measured)
| Mistake | Measured | Use instead |
|---|---|---|
| An inner radius copied from its parent (a 12px card, 8px padding, the child also 12px) | the gap is 8px along the sides and 11.3px at the corner — the inner shape bulges away from the corner | `max(0px, var(--ds-shape-container) - var(--ds-space-inset-sm))` — 4px in round, 0px in default — an even 8px all the way round |
| "One step smaller" for the inner radius (12px → 8px with 8px padding) | 9.7px at the corner against 8px along the sides; the right answer changes with the padding, which "one step" ignores | `parent − padding` — 4px, and it follows density: comfortable 0px, default 4px, compact 6px |
| A square header flush with the top of a 12px card | its corners poke 5px out past the card's rounded corner | `the card's radius on the header's top corners` — border-start-start-radius and border-start-end-radius: var(--ds-shape-container) — nothing pokes out, nothing is clipped |
| overflow: hidden on the card to hide those corners | the focus ring sits 2–4px outside an element, so anything within 4px of the card's edge loses its ring on that side | `nested radius on the flush child` — no clipping: the ring shows on all four sides (the radius audit samples them) |
| The control radius on a checkbox (round style: 8px on a 16px box) | 8px is half of 16px: the checkbox is a circle and reads as a radio button | `shape.mark` — 4px in round (≤ 4px in every style): a square with soft corners |
| A pill-shaped button whose label wraps (200% text on a phone) | two lines make it 88px tall, so its ends are 44px round; the label's first and last letters sit 2.7px outside the shape, off the fill their contrast was measured on | `shape.control` — 4px: the button grows, the corners stay corners |
| border-top-left-radius: 0 on the second button of a group | in a right-to-left layout the second button is on the left: its seam is rounded and its outer corner square | `.ds-join` — logical corners (border-start-start-radius …): the join flips with the text direction |
| border-radius: 6px on a button | doesn't follow the style: in sharp it stays 6px — rounder than sharp's containers (2px) — and nested radii computed from shape.control no longer match | `shape.control` — sharp 2px, default 4px, round 8px |

## Self-check before answering
- [ ] Every `border-radius` is a `var(--ds-shape-*)` role or a nested expression on one (Tailwind `rounded-<role>`); no px, rem or %; no `--ds-radius-*`.
- [ ] Each role matches what the thing is (checkbox → mark, button → control, card or menu → container, dialog → surface, a label that never wraps → pill).
- [ ] Every shape that fills a rounded parent (padding smaller than the parent's radius) uses `max(0px, parent − padding)`; flush children take the parent's radius on the shared corners.
- [ ] Joined parts use `.ds-join` or logical corners — no `border-top-left-radius`, `rounded-l-` or `rounded-tl-`.
- [ ] No `overflow: hidden` on a rounded container that holds focusable content.
- [ ] Focus rings are outlines; a ring on its own layer uses `shape.<role>-focus`.
- [ ] No radius changes on hover, focus, active or selected.
- [ ] No shape or radius variables redefined.
