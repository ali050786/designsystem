# Border rules for AI tools — ds

Generated from the engine (10 tokens; control boundaries 1px; all checks pass). The same data in machine-readable form: `border.contract.json`.

## How to use this file
1. Decide with the **Decision guide** whether the boundary needs a line at all, then which job it is.
2. Use the width token and its colour role together — never copy a number into your own CSS.
3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.
4. Before answering, run the **Self-check**.

## Hard rules
| ID | Rule | Why | WCAG |
|---|---|---|---|
| BR-01 | Border widths come from a job: border-width is var(--ds-border-width-line), -control, -state or -indicator (Tailwind border-line, border-control, border-state, border-indicator and their side forms: border-b-line, border-s-indicator, divide-y-line). No px, rem or em numbers; 0 only to remove a side. | A hard-coded width doesn't follow the product's control width, and a 2px border in the wrong place reads as a selected state. | — |
| BR-02 | Never use border width primitives (--ds-border-width-1, -2, -3) in components. Pick the job. | Primitives don't say what a line is for, and don't move when the product changes its control width. | — |
| BR-03 | No hairlines and no text-relative widths: nothing below 1px (0.5px, thin, a 1px line scaled down with transform), and never rem or em widths. | Below a pixel a line looks different in every browser (Chrome and Edge round it up to 1px; Safari and Firefox can draw a single device pixel on high-density screens); rem widths double at 200% text, so every 1px line becomes 2px — the width of a state. | 1.4.11 |
| BR-04 | In Tailwind use the ds widths (border-line … border-indicator), not border, border-2, border-[3px] or ring-* for boundaries. | Tailwind's numbers are a second set of widths no check covers, and ring-* draws with box-shadow, which forced colours remove. | — |
| BR-05 | Never remove the focus ring: no outline: none or outline: 0 (Tailwind outline-none) on :focus or :focus-visible unless an outline replaces it. A box-shadow ring keeps a transparent outline beside it. | Keyboard users lose their place; a box-shadow ring is removed in forced colours, so the element has no ring there at all. | 2.4.7, 2.4.13 |
| BR-06 | Boundaries that carry meaning are borders or outlines, never box-shadow or a background alone: a control without a visible border gets border: var(--ds-border-width-control) solid transparent. | Forced colours (Windows contrast themes) replace every fill with one system colour and remove shadows: a button or field shown only by its fill or a box-shadow disappears. A transparent border is drawn there in the system's text colour. | 1.4.11 |
| BR-07 | The colour fits the job: control, state and indicator widths take a colour that reaches 3:1 (color.border.input, color.border.strong, color.action.secondary.border, color.border.selected, color.border.danger / warning / success). color.border.subtle and color.border.default are for lines that only separate or outline. | A decorative grey on a field's edge measures under 3:1: people with low vision can't find the field. | 1.4.11 |
| BR-08 | A state never shows by border colour alone: a selected, invalid or current border also widens to its job (state, indicator) and comes with a check mark, an icon or a message. | A red 1px border next to a grey one differs mostly in hue; for many people with red-green colour blindness the two look alike. | 1.4.1 |
| BR-09 | A state that widens a border takes the extra width off the padding, written on the tokens: calc(var(--ds-space-inset-md) - (var(--ds-border-width-state) - var(--ds-border-width-control))). The content must not move. | A wider border pushes the label sideways on every selection; in a list, every row's text jumps as the selection moves. | — |
| BR-10 | Parts that touch use .ds-join (it overlaps their borders by one control width and lifts the part that changes); never two borders side by side, and never a hand-made negative margin. | Two 1px borders make a 2px seam — the width of a selected state — between parts that are meant to read as one. | — |
| BR-11 | Never redefine border or focus variables in app code (--ds-border-width-*, --ds-focus-ring-*). Change border.control or border.roles in the engine config and build. | An overridden width skips the checks that keep jobs apart, colours at 3:1 and states from moving content. | — |

## Decision guide

**Does it need a line at all** — What should the boundary do?

| When | Use |
|---|---|
| Group things that belong together, with room to spare | space (Spacing: a bigger stack or inline gap) — no line |
| Set a region apart from the page (a sidebar, a header band, a well) | a surface change (`color.bg.surface-sunken`, an elevation level) — no line; in forced colours both surfaces become the page colour, so a region that holds controls or must be found keeps a `border.width.line` edge |
| Separate items that sit close together (list rows, table rows, menu groups) | `border.width.line` with `color.border.subtle` |
| Outline a card, a panel, a table frame or a menu | `border.width.line` with `color.border.default` (things that float: their level's edge, `elevation.floating.border`) |
| Show where a control is (a field, a checkbox, a secondary button) | `border.width.control` with `color.border.input` (fields, checkboxes, radios) or `color.action.secondary.border` (buttons) |

**Showing a state** — What changed?

| When | Use |
|---|---|
| It is selected (an option, a card, a segment) | `border.width.state` with `color.border.selected`, plus a check mark or bold label |
| It is in error, needs attention or passed | `border.width.state` with `color.border.danger` / warning / success, plus an icon and a message |
| It is the current one (the tab, the page in the navigation, a row being edited) | `border.width.indicator` on one side (block-end for tabs, inline-start for navigation) with `color.border.selected`, and `aria-current` or `aria-selected` |
| It has keyboard focus | nothing to set: tokens.css draws the focus ring on `:focus-visible` |
| It is hovered or pressed | a fill (`color.bg.state-hover`, `color.bg.item-hover`) — not a border; the width stays the same |
| It is disabled | `color.action.disabled.border` at the same width; tokens.css turns it GrayText in forced colours |

**A state that widens the border** — How do you keep the content still?

| When | Use |
|---|---|
| A control that turns selected or invalid | `padding-inline: calc(var(--ds-space-inset-md) - (var(--ds-border-width-state) - var(--ds-border-width-control)))` |
| A card that turns selected | `padding: calc(var(--ds-space-inset-lg) - (var(--ds-border-width-state) - var(--ds-border-width-line)))` |
| The current navigation item | `padding-inline-start: calc(var(--ds-space-inset-md) - var(--ds-border-width-indicator))` |
| A tab | nothing: its bar is a ::after on the selected tab only (position: absolute along the block-end edge), so nothing moves |

**Parts that touch** — Do they read as one thing?

| When | Use |
|---|---|
| Yes: a button group, a segmented control, an input with its button, stacked list items | `.ds-join` (or `data-join="block"`): parts overlap by one control border, so each seam is one line |
| No: separate things side by side | a gap (Spacing), each with its own border |
| Table cells | `border-collapse: collapse`, or lines on one side only (`border-block-end` on rows) |

**Focus** — How is the ring drawn?

| When | Use |
|---|---|
| On anything focusable | tokens.css draws it: an outline, `focus.ring.width` wide, `focus.ring.offset` away, `focus.ring.color` |
| You need a different look (an inset ring on a full-width row) | keep the outline and change `outline-offset` (a negative offset draws it inside) — never box-shadow alone |
| Removing the default ring | never without a replacement outline; box-shadow rings vanish in forced colours |

## Jobs
In code use the CSS variable or the Tailwind utility (sides: `border-b-line`, `border-s-indicator`, `divide-y-line`); in Figma the variable of the same name in the stroke-weight field. Each job lists the colours it may be drawn in.

| Job | Width | CSS variable | Tailwind | Colours (lowest contrast, Light · Dark) | Use |
|---|---|---|---|---|---|
| `border.width.line` | 1px | `--ds-border-width-line` | `border-line` | `color.border.subtle` (decorative)<br>`color.border.default` (decorative)<br>`color.border.floating` (decorative) | Lines that show structure: dividers between items, rows and sections; the outline of cards, panels and table frames; the edge of whatever floats (menus, dialogs: color.border.floating) |
| `border.width.control` | 1px | `--ds-border-width-control` | `border-control` | `color.border.input` 3.38 · 3.39<br>`color.border.strong` 3.38 · 3.39<br>`color.action.secondary.border` 3.93 · 3.39 | The boundary that shows where a control is: text fields, selects, checkboxes, radios, secondary buttons, toggles, segmented controls |
| `border.width.state` | 2px | `--ds-border-width-state` | `border-state` | `color.border.selected` 4.59 · 4.59<br>`color.border.danger` 3.38 · 3.39<br>`color.border.warning` 3.38 · 3.37<br>`color.border.success` 3.38 · 3.4 | A border that shows a state on its own element: a selected option or card, a field in error, warning or passed — always with a second cue (a check mark, an icon, a message) |
| `border.width.indicator` | 3px | `--ds-border-width-indicator` | `border-indicator` | `color.border.selected` 4.59 · 4.59 | The bar that marks the current item: the current tab, the current navigation link, the leading edge of a selected row |

## Focus ring
outline on :focus-visible (tokens.css): 2px, 2px away; in forced colours outline-color Highlight. It reaches 4px outside the element: nothing may clip it, and sticky bars leave that much room (tokens.css adds it to the scroll padding). On `bg/surface` it measures 6.21:1 in Light and 5.35:1 in Dark.

## State borders don't move content
A state that widens a border takes the extra width off the padding on the same side, so the content stays where it was. Computed per density (padding left after the border grows):

| Case | CSS | comfortable | default | compact |
|---|---|---|---|---|
| A control that turns selected or invalid | `padding-inline: calc(var(--ds-space-inset-md) - (var(--ds-border-width-state) - var(--ds-border-width-control)))` | 15px | 11px | 7px |
| A card that turns selected (its outline goes from line to state) | `padding: calc(var(--ds-space-inset-lg) - (var(--ds-border-width-state) - var(--ds-border-width-line)))` | 19px | 15px | 11px |
| The current navigation item (a bar on its start edge) | `padding-inline-start: calc(var(--ds-space-inset-md) - var(--ds-border-width-indicator))` | 13px | 9px | 5px |

## Joined parts
- `.ds-join`: Parts that touch (a button group, a segmented control, an input with its button): borders overlap by one control width so each seam is one line; outer corners keep their radius; the hovered, selected and focused part is lifted. Markup: `<div class="ds-join" role="group" aria-label="…"> <button>…</button> <button>…</button> </div> (data-join="block" for stacked parts)`.
- Overlap: `calc(-1 * var(--ds-border-width-control))`. Lifted: :hover, [aria-pressed="true"], [aria-selected="true"], [aria-current], :checked, [aria-invalid="true"] (z-index 1); :focus-visible, :focus-within (z-index 2).

## Forced colours
Windows contrast themes (and other forced-colour modes) replace every colour with a few system colours, remove box-shadows and background images, and keep borders and outlines (drawn in the system text colour — transparent ones too).

**tokens.css already:** the focus ring takes Highlight; ARIA states (aria-selected, aria-current, aria-pressed, aria-checked) and labels around a checked radio (segmented controls, choice cards) get an inside outline in SelectedItem, as wide as a state border; disabled controls and their borders turn GrayText.

**You:**
- give every control a border, transparent if the design shows none (BR-06)
- never draw a ring or a boundary with box-shadow alone (BR-05, BR-06)
- show selection with an attribute tokens.css knows (aria-selected, aria-current, aria-pressed, aria-checked), a label around a checked radio, or a real border — not a fill alone
- don't set forced-color-adjust: none except on colour swatches and charts, where the colours are the content

## Limits the build enforces
| Limit | Value |
|---|---|
| Widths | whole pixels, 1–3px, px in code |
| Jobs stay apart | a state is wider than the control it marks; jobs of the same width use different colours; the focus ring stands off the element |
| Lines people need | control, state and indicator colours ≥ 3:1 on every background they are paired with, Light and Dark |
| Content stays still | a widened border comes off the padding, leaving ≥ 2px in every density |
| Forced colours | the ring is an outline in Highlight; ARIA states get a SelectedItem outline; disabled is GrayText; overlays keep a border |

## Common mistakes (measured)
| Mistake | Measured | Use instead |
|---|---|---|
| A 0.5px "hairline" divider | Chromium (Chrome, Edge) rounds it up and draws a full 1px on every screen (measured: computed 1px at 1× and 2×); Safari and Firefox can draw a single device pixel on high-density screens — one token, two looks, and never thinner than 1px on a 1× screen | `border.width.line + color.border.subtle` — 1px everywhere; quieter by colour (1.58:1 on bg/surface), not by width |
| A card-outline grey on a text field (color.border.default) | 1.84:1 against bg/surface — under the 3:1 a field's edge needs | `border.width.control + color.border.input` — 5.34:1 in Light, 4.60:1 in Dark |
| An error shown only by turning the field's border red | the red and the normal grey have the same lightness (1.00:1 between them); with protanopia their difference drops from 0.166 to 0.088 (OKLab) — the two borders look nearly the same | `border.width.state + color.border.danger` — 2px against 1px, so the change shows without colour; with an icon and a message |
| Widening a selected control's border from 1px to 2px without touching its padding | the label moves 1px sideways each time it is selected | `calc(var(--ds-space-inset-md) - (var(--ds-border-width-state) - var(--ds-border-width-control)))` — 11px of padding instead of 12px: the border grows inward, the label stays still |
| Two bordered buttons placed side by side | their two 1px borders make a 2px seam — the width of a selected state | `.ds-join` — parts overlap by 1px: every seam is one 1px line |
| A focus ring drawn with box-shadow and outline: none | forced colours remove every box-shadow: the element has no ring at all there | `the outline tokens.css draws` — 2px outline, 2px away; in forced colours it takes the system's Highlight |
| A primary button with border: none (its fill is its only edge) | forced colours replace its fill with the page colour: only the label is left, with nothing to show it is a button | `border: var(--ds-border-width-control) solid transparent` — invisible in normal colours; drawn in the system text colour in forced colours |
| border-width: 0.0625rem (1px written in rem) | at 200% text it becomes 2px — the width of a selected state — on every line in the product | `border.width.line` — 1px at any text size |

## Self-check before answering
- [ ] Each boundary needs a line (space or a surface change didn't do the job), and each line has a job: line, control, state or indicator.
- [ ] Every `border-width` is a `var(--ds-border-width-<job>)` (Tailwind `border-<job>`); no px, rem, em, 0.5px or `--ds-border-width-<n>`.
- [ ] Control, state and indicator lines use a 3:1 colour; subtle and default only separate or outline.
- [ ] States widen the border and add a check mark, icon or message; the padding shrinks by the same amount.
- [ ] Every control has a border (transparent if none shows); no boundary or ring is box-shadow alone; no `outline: none` without a replacement.
- [ ] Parts that touch use `.ds-join`.
- [ ] No border or focus variables redefined.
