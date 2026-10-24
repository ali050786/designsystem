# Border

*ds foundations · border · the written guide. Generated from the engine — 10 tokens, 4 jobs, control boundaries 1px; every border check passing. Do not edit by hand; change the engine config and build again.*

This guide explains how ds draws lines: when a boundary needs one at all, the four jobs a line can do and the width each one gets, which colours may draw them, how states and focus rings show, how parts that touch share a line, and what survives when people switch on forced colours. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after [Choosing a boundary](#choosing-a-boundary); developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (`border.md`, `border.contract.json`).

**Contents**

- [Five principles](#five-principles)
- [How tokens are built](#how-tokens-are-built)
- [Widths by job](#widths-by-job)
- [Lines and colour](#lines-and-colour)
- [State borders](#state-borders)
- [Focus rings](#focus-rings)
- [Joined parts](#joined-parts)
- [Forced colours](#forced-colours)
- [Choosing a boundary](#choosing-a-boundary)
- [Readers' settings and products](#readers-settings-and-products)

---

## Five principles

Five principles shape every line. Each one is checked by the build or the border audit, not left to taste.

| Principle | What it means in practice |
|---|---|
| **A line needs a reason** | Space groups things and a change of surface sets a region apart; a line is for when neither is enough, or when someone needs it to find a control. Fewer lines make the ones that matter easier to see. |
| **Width says the job** | Four jobs, four widths: structure 1px, a control's edge 1px, a state 2px, the current item 3px. Jobs that share a width are told apart by colour, and the focus ring stands off the element (B2: 5/5 pass). |
| **The lines people need are seen** | A control's edge, a state and the current-item bar reach 3:1 against every background they sit on, in Light and Dark (B3: 11/11 pass). Lines that only separate may be quieter. |
| **A state changes shape, not just colour** | Selected, invalid and current borders get wider, with a check mark, an icon or a message beside them — and the padding gives up the extra width, so nothing moves (B4: 9/9 pass). |
| **Every cue survives forced colours** | Boundaries and focus rings are borders and outlines, never box-shadow or a fill alone; tokens.css adds system-colour outlines for states (B6: 5/5 pass). |

---

## How tokens are built

Border tokens live in two collections: the scale, and the jobs that pick from it.

| Collection | Modes | Border tokens in it | Changes with |
|---|---|---|---|
| **Primitives** | one · hidden from publishing | The scale: `border/width/1`, `border/width/2`, `border/width/3` | nothing — raw values |
| **Border** | one | The jobs (`border/width/line`, `border/width/control`, `border/width/state`, `border/width/indicator`) and the focus ring (`focus/ring/width`, `focus/ring/offset`, `focus/ring/color`) | the product's control width (`border.control`, now 1px) |

**The scale.** 3 whole pixels, 1 to 3px. Nothing below a pixel: Chrome and Edge round a 0.5px "hairline" up to a full 1px on every screen, while Safari and Firefox can draw a single device pixel on high-density screens — the same token would look different from browser to browser, and on a 1× screen it is never thinner than 1px anyway. A quieter line is a quieter colour, not a thinner one. Nothing above 3px: a thicker line reads as a bar or a block.

| Primitive | Value | Used by |
|---|---|---|
| `border/width/1` | 1px | `border/width/line` · `border/width/control` |
| `border/width/2` | 2px | `border/width/state` · `focus/ring/width` |
| `border/width/3` | 3px | `border/width/indicator` |

**Reading a name.** `border / width / control` — category `border`, property `width`, job `control`. Jobs are named by what the line is for, never by how heavy it looks: "thin" and "strong" stop being true the day the product picks heavier controls; "control" doesn't.

**One name, three places.**

| Figma variable | CSS variable | Tailwind |
|---|---|---|
| `border/width/control` | `--ds-border-width-control` | `border-control` (and `border-b-control`, `border-s-control` …) |

**Primitives are never used directly.** In Figma they are hidden from the stroke-weight picker; in code the checker flags `--ds-border-width-1`…`-3`. The jobs are scoped to stroke weight, so they appear only there.

---

## Widths by job

Four jobs. Pick by what the line does; the width comes with the job.

| Job | Width | Use it for | Drawn in |
|---|---|---|---|
| `border/width/line` | 1px | Lines that show structure: dividers between items, rows and sections; the outline of cards, panels and table frames; the edge of whatever floats (menus, dialogs: color.border.floating) | `color/border/subtle`, `color/border/default`, `color/border/floating` |
| `border/width/control` | 1px | The boundary that shows where a control is: text fields, selects, checkboxes, radios, secondary buttons, toggles, segmented controls | `color/border/input`, `color/border/strong`, `color/action/secondary/border` |
| `border/width/state` | 2px | A border that shows a state on its own element: a selected option or card, a field in error, warning or passed — always with a second cue (a check mark, an icon, a message) | `color/border/selected`, `color/border/danger`, `color/border/warning`, `color/border/success` |
| `border/width/indicator` | 3px | The bar that marks the current item: the current tab, the current navigation link, the leading edge of a selected row | `color/border/selected` |

**Why a state is wider than a control.** A field in error and a field at rest differ in more than colour: 2px against 1px. Many people can't tell a red line from a grey one ([State borders](#state-borders)); everyone can tell a thicker line from a thinner one.

**Why the current-item bar is its own job.** The current tab or page is marked on one side only, so it needs more weight than a state outline to read at a glance: 3px, on the block-end edge of a tab or the inline-start edge of a navigation link.

**Why structure and controls are separate jobs.** Both are 1px here, but a product can make its controls heavier (`"border": { "control": 2 }`) without making every divider heavier. States follow: always one pixel wider than a control.

**Rules**

- **One job per line.** A card outline is `border/width/line` even when it's selected: selection makes it `border/width/state`, it doesn't make the card a control.
- **Hover and press don't change width.** They change the fill (`color/bg/state-hover` …). A border that thickens under the pointer moves things and looks like a selection.
- **Width never changes with density.** Density changes the space around lines, not the lines.

---

## Lines and colour

A width is half a line; its colour is the other half. Each job names the colour roles that may draw it, and the build measures every pair. Ask one question: *would someone miss something if this line disappeared?*

- **No — it only separates or outlines** (dividers, card and table frames, menus): `border/width/line` in `color/border/subtle` or `color/border/default`. The content identifies itself, so these are decorative and may stay quiet.
- **Yes — it shows where a control is, or what state something is in**: control, state and indicator lines, in colours that reach 3:1 (WCAG 1.4.11).

| Job | Colour role | On bg/surface (Light · Dark) | Lowest of its pairs (Light · Dark) | Needs |
|---|---|---|---|---|
| `border/width/line` | `color/border/subtle` | 1.58 · 1.59 | — | decorative |
| `border/width/line` | `color/border/default` | 1.84 · 1.84 | — | decorative |
| `border/width/line` | `color/border/floating` | 2.15 · 2.14 | — | decorative |
| `border/width/control` | `color/border/input` | 5.34 · 4.60 | 3.38 · 3.39 | 3:1 |
| `border/width/control` | `color/border/strong` | 5.34 · 4.60 | 3.38 · 3.39 | 3:1 |
| `border/width/control` | `color/action/secondary/border` | 5.34 · 4.60 | 3.93 · 3.39 | 3:1 |
| `border/width/state` | `color/border/selected` | 7.25 · 6.23 | 4.59 · 4.59 | 3:1 |
| `border/width/state` | `color/border/danger` | 5.34 · 4.60 | 3.38 · 3.39 | 3:1 |
| `border/width/state` | `color/border/warning` | 5.34 · 4.58 | 3.38 · 3.37 | 3:1 |
| `border/width/state` | `color/border/success` | 5.33 · 4.61 | 3.38 · 3.4 | 3:1 |
| `border/width/indicator` | `color/border/selected` | 7.25 · 6.23 | 4.59 · 4.59 | 3:1 |

*"Lowest of its pairs": the worst background the colour is checked on, among canvas, surfaces, hover and pressed rows and selected rows (C3).*

**The common slip.** A card-outline grey on a text field (color.border.default): 1.84:1 against bg/surface — under the 3:1 a field's edge needs. Use `color/border/input` — 5.34:1 in Light, 4.60:1 in Dark.

**Overlays.** Menus, popovers and dialogs keep a `border/width/line` outline in `elevation/floating/border` even though they have a shadow: shadows are removed in forced colours, and in dark mode they barely show.

**Rules**

- **Colour and width travel together.** Pick the job, then one of its colours. `color/border/subtle` on a field's edge, or a 2px line in a card grey, is a mismatch the checker flags (BR-07).
- **No custom greys for lines.** A grey picked by eye is unchecked: it may pass on white and fail on a hovered row.

---

## State borders

A state border shows that something changed: an option is selected, a field is in error, a tab is current. Three rules make it work for everyone.

**More than colour (WCAG 1.4.1).** The border widens to its job and something else comes with it: a check mark on a selected card, an icon and a message under a field in error, bold text on the current tab.

- An error shown only by turning the field's border red: the red and the normal grey have the same lightness (1.00:1 between them); with protanopia their difference drops from 0.166 to 0.088 (OKLab) — the two borders look nearly the same.
- With the state width: 2px against 1px, so the change shows without colour; with an icon and a message.

**The content stays still.** A border that grows by a pixel pushes the label a pixel; in a list, every row jumps as the selection moves. The padding gives up what the border takes, written on the tokens so it follows density:

| Case | Padding | comfortable | default (this product) | compact |
|---|---|---|---|---|
| A control that turns selected or invalid | `padding-inline: calc(var(--ds-space-inset-md) - (var(--ds-border-width-state) - var(--ds-border-width-control)))` | 15px | 11px | 7px |
| A card that turns selected (its outline goes from line to state) | `padding: calc(var(--ds-space-inset-lg) - (var(--ds-border-width-state) - var(--ds-border-width-line)))` | 19px | 15px | 11px |
| The current navigation item (a bar on its start edge) | `padding-inline-start: calc(var(--ds-space-inset-md) - var(--ds-border-width-indicator))` | 13px | 9px | 5px |

*Padding left after the border grows; at least 2px in every density (B4).*

**The current-item bar.** Draw it only on the current item — a border there with the padding reduced by its width (navigation), or a `::after` along the block-end edge (tabs). Don't give every item a transparent bar and colour the current one: forced colours draw transparent borders, so every item would show a bar there.

```css
.tab[aria-selected="true"]::after {
  content: ""; position: absolute; inset-inline: 0; inset-block-end: 0;
  border-block-end: var(--ds-border-width-indicator) solid var(--ds-color-border-selected);
}
.nav a[aria-current="page"] {
  border-inline-start: var(--ds-border-width-indicator) solid var(--ds-color-border-selected);
  padding-inline-start: calc(var(--ds-space-inset-md) - var(--ds-border-width-indicator));
}
```

**Say it in the markup.** `aria-selected`, `aria-current`, `aria-pressed`, `aria-checked` and `aria-invalid` tell assistive technology what the border shows — and tokens.css uses the first four to draw the state in forced colours ([Forced colours](#forced-colours)).

**Rules**

- **Disabled keeps its outline.** `color/action/disabled/border` at the control width — exempt from contrast, but the control is still there to be found. Forced colours turn it GrayText.
- **Validation is a state.** Success, warning and danger outlines are `border/width/state` with an icon and words. Colour alone says nothing to a screen reader either.

---

## Focus rings

The focus ring shows where the keyboard is. It is not a border: it is an outline drawn outside the element, so it never moves layout, never replaces the element's own border, and is measured against the page rather than the element's fill.

| Token | Value | What it does |
|---|---|---|
| `focus/ring/width` | 2px | The ring's thickness (WCAG 2.4.13 asks for at least 2px) |
| `focus/ring/offset` | 2px | The gap between the element and the ring: the ring stands off the element, so it never looks like a state border |
| `focus/ring/color` | #2A57D1 / #6594FF | Linked to `color/border/focus`: 6.21 · 5.35 on bg/surface, 5.34 · 6.22 on the canvas |

**Drawn for you.** tokens.css puts the ring on `:focus-visible` — keyboard focus, not mouse clicks — as `outline: var(--ds-focus-ring-width) solid var(--ds-focus-ring-color); outline-offset: var(--ds-focus-ring-offset)`. Nothing to add in components; never remove it (F2: 2/2 pass).

**It reaches 4px out.** Offset plus width. Nothing may clip that band (no `overflow: hidden` on a container with focusable things at its edge), and a sticky header leaves that much room: tokens.css adds it to the scroll padding, so a focused element never sits with its ring under the header (WCAG 2.4.11).

**Inside, when there's no room outside.** A full-width list row or a table cell has no space around it; keep the outline and give it a negative offset (`outline-offset: calc(-1 * var(--ds-focus-ring-width))`) so it is drawn inside. Still an outline, so it survives forced colours.

**Never box-shadow alone.** A focus ring drawn with box-shadow and outline: none: forced colours remove every box-shadow: the element has no ring at all there. If a design really needs a shadow ring, keep `outline: var(--ds-focus-ring-width) solid transparent` beside it — invisible normally, drawn in forced colours.

**Rules**

- **Restyle through the tokens.** A different ring is a change to `color/border/focus` or `focus/ring/*` in the engine, where contrast is checked — not `outline: none` and a custom shadow.
- **Rings follow corners.** Outlines follow border-radius by themselves; a ring drawn on its own layer takes the -focus radius (Radius foundation).

---

## Joined parts

Parts that touch — a button group, a segmented control, an input with its button, stacked list items — read as one thing. Two bordered parts side by side would put two borders at the seam.

|  | Seam | What you see |
|---|---|---|
| Two parts with their own borders | 2px | A double line — exactly the width of a selected state |
| In `.ds-join` | 1px | One line, like the outer edges |

`.ds-join` overlaps each part with the one before by one control border (`calc(-1 * var(--ds-border-width-control))`), squares the corners where parts meet (Radius foundation) and lifts the part that changes — hovered, pressed, selected, invalid — so its whole border shows over the overlap; the focused part goes on top of that, so its ring is never covered. Parts overlap by 1px: every seam is one 1px line.

```html
<div class="ds-join" role="group" aria-label="View">
  <button class="btn" aria-pressed="true">List</button>
  <button class="btn" aria-pressed="false">Board</button>
</div>
```

**Tables.** Cells use `border-collapse: collapse`, or lines on one side only (`border-block-end` on rows): the same "one line per seam" rule.

**Rules**

- **No hand-made overlaps.** A `margin-inline-start: -1px` written by hand doesn't follow the control width and doesn't lift the selected part (BR-10).
- **A gap means separate.** Parts with space between them keep all four borders.

---

## Forced colours

People with low vision, migraines or light sensitivity switch on a contrast theme in Windows (and other forced-colour modes). The browser then replaces every colour the page chose with a handful of system colours. What it keeps and what it drops decides what people can still see:

| What the page drew | In forced colours |
|---|---|
| Text colour | the system text colour |
| Background colours and images | replaced by the page colour (or the system's button colour) |
| Borders and outlines — transparent ones too | kept, in the system text colour |
| box-shadow | removed |
| A state shown only by a fill (a selected row, a pressed toggle) | gone — every row looks the same |

**What tokens.css does.** The focus ring takes Highlight. ARIA states (aria-selected, aria-current, aria-pressed, aria-checked) and labels around a checked radio (segmented controls, choice cards) get an inside outline in SelectedItem, as wide as a state border. Disabled controls and their borders turn GrayText.

**What you do.**

- Give every control a border, transparent if the design shows none (BR-06).
- Never draw a ring or a boundary with box-shadow alone (BR-05, BR-06).
- Show selection with an attribute tokens.css knows (aria-selected, aria-current, aria-pressed, aria-checked), a label around a checked radio, or a real border — not a fill alone.
- Don't set forced-color-adjust: none except on colour swatches and charts, where the colours are the content.

**The filled button.** A primary button with border: none (its fill is its only edge): forced colours replace its fill with the page colour: only the label is left, with nothing to show it is a button. Give it `border: var(--ds-border-width-control) solid transparent` — invisible in normal colours; drawn in the system text colour in forced colours.

**Test it.** On Windows: Settings → Accessibility → Contrast themes. In Chrome or Edge DevTools: Rendering → Emulate CSS media feature forced-colors. The border audit renders every page in forced colours and checks that controls keep a visible edge, focus rings show and states still differ (`npm run audit:border`).

**Rules**

- **Don't opt out.** `forced-color-adjust: none` is for colour swatches and charts, where the colours are the content — never for controls.
- **Real attributes, real borders.** A state the system can't see (a class that only changes a fill) can't be shown in forced colours.

---

## Choosing a boundary

Four questions get you to the right line — or to no line: *does it need a line at all?*, *what state is it showing?*, *does the state widen the border?* and *does it touch another part?* Then check focus.

**Does it need a line at all** — What should the boundary do?

| When | Use |
|---|---|
| Group things that belong together, with room to spare | space (Spacing: a bigger stack or inline gap) — no line |
| Set a region apart from the page (a sidebar, a header band, a well) | a surface change (`color/bg/surface-sunken`, an elevation level) — no line; in forced colours both surfaces become the page colour, so a region that holds controls or must be found keeps a `border/width/line` edge |
| Separate items that sit close together (list rows, table rows, menu groups) | `border/width/line` with `color/border/subtle` |
| Outline a card, a panel, a table frame or a menu | `border/width/line` with `color/border/default` (things that float: their level's edge, `elevation/floating/border`) |
| Show where a control is (a field, a checkbox, a secondary button) | `border/width/control` with `color/border/input` (fields, checkboxes, radios) or `color/action/secondary/border` (buttons) |

**Showing a state** — What changed?

| When | Use |
|---|---|
| It is selected (an option, a card, a segment) | `border/width/state` with `color/border/selected`, plus a check mark or bold label |
| It is in error, needs attention or passed | `border/width/state` with `color/border/danger` / warning / success, plus an icon and a message |
| It is the current one (the tab, the page in the navigation, a row being edited) | `border/width/indicator` on one side (block-end for tabs, inline-start for navigation) with `color/border/selected`, and `aria-current` or `aria-selected` |
| It has keyboard focus | nothing to set: tokens.css draws the focus ring on `:focus-visible` |
| It is hovered or pressed | a fill (`color/bg/state-hover`, `color/bg/item-hover`) — not a border; the width stays the same |
| It is disabled | `color/action/disabled/border` at the same width; tokens.css turns it GrayText in forced colours |

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
| On anything focusable | tokens.css draws it: an outline, `focus/ring/width` wide, `focus/ring/offset` away, `focus/ring/color` |
| You need a different look (an inset ring on a full-width row) | keep the outline and change `outline-offset` (a negative offset draws it inside) — never box-shadow alone |
| Removing the default ring | never without a replacement outline; box-shadow rings vanish in forced colours |

**Worked example — a settings page with a plan picker.** One line at a time:

| Part | Job and colour | Width | Why |
|---|---|---|---|
| The page sections | none — space | — | A stack gap separates them; a line would add nothing. |
| The settings card | `border/width/line` · `color/border/default` | 1px | Outlines a group; decorative. |
| Rows inside the card | `border/width/line` · `color/border/subtle` | 1px | Separates items that sit close. |
| The email field | `border/width/control` · `color/border/input` | 1px | Shows where to type; 3:1. |
| The field in error | `border/width/state` · `color/border/danger` | 2px | Plus an icon and a message; padding gives up the extra. |
| The plan picker | `.ds-join` · `border/width/control` | 1px seams | One control in three parts. |
| The selected plan | `border/width/state` · `color/border/selected` | 2px | With aria-pressed and a check mark. |
| Keyboard focus anywhere | `focus/ring/*` | 2px, 2px out | Drawn by tokens.css. |

**Do and avoid** (measured in this build)

| Avoid | Measured | Do |
|---|---|---|
| A 0.5px "hairline" divider | Chromium (Chrome, Edge) rounds it up and draws a full 1px on every screen (measured: computed 1px at 1× and 2×); Safari and Firefox can draw a single device pixel on high-density screens — one token, two looks, and never thinner than 1px on a 1× screen | `border/width/line + color/border/subtle` — 1px everywhere; quieter by colour (1.58:1 on bg/surface), not by width |
| A card-outline grey on a text field (color/border/default) | 1.84:1 against bg/surface — under the 3:1 a field's edge needs | `border/width/control + color/border/input` — 5.34:1 in Light, 4.60:1 in Dark |
| An error shown only by turning the field's border red | the red and the normal grey have the same lightness (1.00:1 between them); with protanopia their difference drops from 0.166 to 0.088 (OKLab) — the two borders look nearly the same | `border/width/state + color/border/danger` — 2px against 1px, so the change shows without colour; with an icon and a message |
| Widening a selected control's border from 1px to 2px without touching its padding | the label moves 1px sideways each time it is selected | `calc(var(--ds-space-inset-md) - (var(--ds-border-width-state) - var(--ds-border-width-control)))` — 11px of padding instead of 12px: the border grows inward, the label stays still |
| Two bordered buttons placed side by side | their two 1px borders make a 2px seam — the width of a selected state | `.ds-join` — parts overlap by 1px: every seam is one 1px line |
| A focus ring drawn with box-shadow and outline: none | forced colours remove every box-shadow: the element has no ring at all there | the outline tokens.css draws — 2px outline, 2px away; in forced colours it takes the system's Highlight |
| A primary button with border: none (its fill is its only edge) | forced colours replace its fill with the page colour: only the label is left, with nothing to show it is a button | `border: var(--ds-border-width-control) solid transparent` — invisible in normal colours; drawn in the system text colour in forced colours |
| border-width: 0.0625rem (1px written in rem) | at 200% text it becomes 2px — the width of a selected state — on every line in the product | `border/width/line` — 1px at any text size |

---

## Readers' settings and products

People enlarge text, zoom, switch to dark mode or forced colours; products choose heavier controls or add lines of their own. Borders are built so none of that breaks.

**Bigger text (WCAG 1.4.4).** Widths are px: when text doubles, lines stay lines. Written in rem they would double too — 0.0625rem (1px written in rem): at 200% text it becomes 2px — the width of a selected state — on every line in the product.

**Zoom (WCAG 1.4.10).** Zoom scales everything, lines included: at 400% a 1px line is drawn 4 screen pixels wide, in proportion with everything around it.

**Dark mode.** Widths stay; colours change, and every pair is measured in both modes ([Lines and colour](#lines-and-colour)).

**Density.** Widths don't change with density; padding does, and the padding that gives way to a state border follows it ([State borders](#state-borders)).

**Forced colours.** Contrast themes keep borders and outlines and drop fills and shadows; the whole of [Forced colours](#forced-colours) is about them.

**What the config changes**

|  | line | control | state | indicator |
|---|---|---|---|---|
| `"border": { "control": 1 }` (this product) | 1px | 1px | 2px | 3px |
| `"border": { "control": 2 }` | 1px | 2px | 3px | 3px |

`"control": 2` suits products whose people need fields to stand out (public services, forms filled in once a year). Structure lines stay at 1px; states stay one pixel wider than controls.

**Adding a job.** First check [Choosing a boundary](#choosing-a-boundary) — most lines are one of the four. If a product needs another (a drop zone, a placeholder slot), name it by its job, give a width on the scale, one colour role, whether people need it to find something, and a style; the build refuses names by look ("thick", "hairline"), widths off the scale or below a pixel, colours that aren't border roles, and a job that identifies something in a colour under 3:1:

```json
{
  "border": {
    "control": 1,
    "roles": [
      {
        "name": "border.width.drop-zone",
        "width": 2,
        "color": "color.border.strong",
        "identifies": true,
        "style": "dashed",
        "description": "The edge of an area files can be dropped on"
      }
    ]
  }
}
```

---

## Accessibility reference

What the build checks for borders, and the result for this build:

| Check | What it checks | WCAG | Result |
|---|---|---|---|
| F2 | Focus ring ≥ 2px thick with an offset (colour checked in C3) | 2.4.7, 2.4.13 (AA) | pass · 2/2 pass |
| B1 | Widths are whole pixels from 1 to 3px on the scale — no hairlines below a pixel — and px in code, so a line stays a line at 200% text | 1.4.11 (AA) | pass · 13/13 pass |
| B2 | Jobs stay apart: a state is wider than the control it marks, jobs that share a width use different colours, and the focus ring stands off the element | 1.4.1 (AA) | pass · 5/5 pass |
| B3 | Lines people need — control boundaries, states, the current-item bar — reach 3:1 against every background, in Light and Dark | 1.4.11 (AA) | pass · 11/11 pass |
| B4 | States don't move content: a wider border takes its extra width off the padding, and at least 2px of padding is left in every density | — (AA) | pass · 9/9 pass |
| B5 | Joined parts share one line: parts overlap by the control width and the part that changes is lifted above its neighbours | — (AA) | pass · 2/2 pass |
| B6 | Forced colours (Windows contrast themes) keep every cue: the focus ring is an outline, states get a system-colour outline, disabled controls turn GrayText, overlays keep a border | 1.4.11, 2.4.7 (AA) | pass · 5/5 pass |

Colour pairs for every border colour are in C3 (colour guide). What the checkers look for in your own code and pages: the border checker (`npm run lint:border`) reads CSS, HTML and JSX; the border audit (`npm run audit:border`) renders a page normally and in forced colours, at 1280 and 320px and at 200% text, then checks widths, control edges and their contrast, doubled seams, content that moves when a state changes, and that every focus ring and every state still shows in forced colours. See the [handoff](HANDOFF.md).

**Glossary**

| Term | Meaning |
|---|---|
| Job | What a line is for (line, control, state, indicator); it decides the width and the colours allowed. |
| Decorative line | A line that only separates or outlines; the content identifies itself, so it may be under 3:1. |
| Hairline | A line thinner than a pixel; drawn differently on every screen, so ds has none. |
| Focus ring | The outline that shows keyboard focus, drawn outside the element. |
| Offset | The gap between an element and its focus ring. |
| Seam | Where two joined parts meet. |
| Forced colours | A browser mode (Windows contrast themes) that replaces the page's colours with system colours; borders and outlines survive, shadows and fills don't. |
| Compensation | Taking a widened border's extra width off the padding, so the content doesn't move. |
