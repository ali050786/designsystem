# Layout

*ds foundations · layout · the written guide. Generated from the engine — 14 tokens, 4 breakpoints, 2 panes; every layout check passing. Do not edit by hand; change the engine config and build again.*

This guide explains how ds lays out a screen: the breakpoints, the page grid, the widths each kind of content gets, the regions of an app and when its panes sit beside the content, and the header that stays on screen. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after [Choosing a layout](#choosing-a-layout); developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (`layout.md`, `layout.contract.json`).

**Contents**

- [Five principles](#five-principles)
- [Breakpoints](#breakpoints)
- [How tokens are built](#how-tokens-are-built)
- [The page grid](#the-page-grid)
- [Widths named by job](#widths-named-by-job)
- [Regions and panes](#regions-and-panes)
- [The header and scrolling](#the-header-and-scrolling)
- [Choosing a layout](#choosing-a-layout)
- [Readers' settings and products](#readers-settings-and-products)

---

## Five principles

Five principles shape every layout decision. Each one is checked by the build, not left to taste.

| Principle | What it means in practice |
|---|---|
| **The measure follows the text** | Running text stops at `layout/measure/reading`, 34rem — about 71 characters of body text at every breakpoint and every text size. A wider screen gives wider margins, not longer lines (check T9: 2/2 pass). |
| **Sizes add up** | A pane sits beside the content only at a breakpoint where the main region still holds a full reading line and its grid keeps columns of at least 40px. The build adds the widths up at the narrowest width of every breakpoint (L2: 9/9 pass, L3: 5/5 pass). |
| **Grids follow their region** | A grid takes the columns of the space it actually has: the window for a full page, the main region beside an open pane. One rule, so nothing breaks when a pane opens. |
| **Linked, not copied** | Gutters and margins point at the spacing scale; type and layout share one set of breakpoints; the header follows density like the controls it holds; the space between sections is spacing's `stack/2xl`. |
| **Nothing scrolls sideways** | Every page works at 320 × 256px — a 1280 × 1024 window at 400% zoom — in every density, and a sticky header never hides the item that has focus (L1: 2/2 pass, L4: 12/12 pass). |

---

## Breakpoints

A breakpoint is the window width where the layout changes. ds has 4, shared by type and layout, so headings grow and columns appear at the same moments. They are minimum widths: each one lasts until the next begins, and `sm` starts at 0, so every window — a 280px folded phone included — has a layout.

| Token | From | Checked at | Media query | Tailwind | What it is for |
|---|---|---|---|---|---|
| `breakpoint/sm` | 0px | 320px | none — the default | no prefix | Phones, and any window at 400% zoom |
| `breakpoint/md` | 600px | 600px | `(min-width: 37.5em)` | `md:` | Large phones on their side, small tablets |
| `breakpoint/lg` | 1024px | 1024px | `(min-width: 64em)` | `lg:` | Tablets on their side, laptops — the navigation pane opens |
| `breakpoint/xl` | 1440px | 1440px | `(min-width: 90em)` | `xl:` | Desktops — the supporting pane opens; the page reaches its widest |

**Checked at the narrowest width.** A layout that works where its breakpoint begins works across it, because every width inside is wider. So the build checks each one at its first pixel — `sm` at 320px, the width WCAG 1.4.10 tests reflow at.

**In em, not px.** Media queries are written in em (Tailwind uses the same numbers in rem). They follow the reader's default text size: someone who sets 32px text gets the `md` layout up to 2047px, with twice the room per character, instead of a desktop layout with cramped columns. At the default size, 1em is 16px and nothing changes.

**Mobile first.** Write the `sm` layout with no query, then add what changes at `md`, `lg` and `xl`. Tailwind's own `sm:` and `2xl:` are switched off in `tailwind.theme.css` (check L5: 8/8 pass).

**Rules**

- **No breakpoints of your own.** A 768px breakpoint is a fifth layout nobody designed or checked. If content breaks between two breakpoints, fix the content (let it wrap, let the grid follow its region) rather than adding a width.
- **min-width only.** Desktop-first max-width queries leave the smallest screens with the most overrides and the most bugs.

---

## How tokens are built

Layout tokens live in four collections. Each holds one kind of value and changes with one kind of mode.

| Collection | Modes | Layout tokens in it | Changes with |
|---|---|---|---|
| **Primitives** | one · hidden from publishing | The breakpoints, and the spacing scale that gutters and margins point at | nothing — raw values |
| **Responsive** | sm, md, lg, xl | `layout/columns`, `layout/gutter`, `layout/margin` (and every type style) | the breakpoint |
| **Layout** | one | Widths named by job: `layout/container/max`, `layout/measure/reading`, `layout/pane/nav`, `layout/pane/aside`, `layout/tile/min` | nothing — one value each, checked against every breakpoint |
| **Density** | comfortable, default, compact | `layout/header/height`, `layout/scroll-padding/top` (and every spacing token) | the density |

**Reading a name.** `layout / pane / nav` — category `layout`, kind `pane`, job `nav`. Widths are named by what they hold (reading, page, nav), never by size or side: "left" becomes "right" in right-to-left languages, and "wide" stops being true the day the value changes.

**One name, three places.**

| Figma variable | CSS variable | Tailwind |
|---|---|---|
| `layout/measure/reading` | `--ds-layout-measure-reading` | `max-w-reading` |

**Modes on frames.** In Figma, a page frame set to a Responsive mode shows that breakpoint's columns, gutter, margin and type. A region frame — the main region beside an open pane — sets its own mode for its own width, exactly as a grid inside it does in code. In code, `:root` takes the window's breakpoint, and a `.ds-grid` inside a region takes the region's.

---

## The page grid

The page grid divides the content into columns so that things on different parts of a page line up. Three tokens make it, all per breakpoint. Gutters and margins point at the spacing scale, so a change to spacing moves the grid with it.

| Token | Use it for | sm (≥ 0px) | md (≥ 600px) | lg (≥ 1024px) | xl (≥ 1440px) |
|---|---|---|---|---|---|
| `layout/columns` | Columns of the page grid | 4 | 8 | 12 | 12 |
| `layout/gutter` | Gap between the columns of the page grid (linked to Spacing) | 16 (`space/4`) | 24 (`space/6`) | 24 (`space/6`) | 32 (`space/8`) |
| `layout/margin` | Space between the screen edge and the page content; the main region's side padding (linked to Spacing) | 16 (`space/4`) | 32 (`space/8`) | 40 (`space/10`) | 64 (`space/16`) |

**At the narrowest width of each breakpoint** (check L2), columns stay at least 40px wide and gutters take no more than a third of the row:

| Breakpoint | Window | Content | Columns | Column width | Gutters' share |
|---|---|---|---|---|---|
| `sm` | 320px | 288px | 4 | 60px | 17% |
| `md` | 600px | 536px | 8 | 46px | 31% |
| `lg` | 1024px | 944px | 12 | 56.7px | 28% |
| `xl` | 1440px | 1312px | 12 | 80px | 27% |

**Margins are the page's edges.** `layout/margin` is the space between the screen edge and the content — the side padding of a page. It is px and follows the breakpoint, not density: a compact table keeps the same page edges as the rest of the product.

**Grids follow their region.** At 1024px the window has the `lg` grid, but beside the open navigation pane the main region is only 768px wide. Twelve columns there would be 35.3px each. So a grid inside a region takes the grid of the region's own width — 768px is `md`: 8 columns of 65px. In code the shell's regions are size containers and `.ds-grid` reads them; in Figma the region frame sets its own Responsive mode.

**Spans by fraction.** Items say how much of the grid they take — half, a third, two thirds, a quarter, the full row — and the classes turn that into whole columns for the grid they are in, so a third stays a third beside an open pane too. On the smallest grid everything but a quarter takes the full row:

| Grid | `.ds-span-full` | `.ds-span-half` | `.ds-span-third` | `.ds-span-two-thirds` | `.ds-span-quarter` |
|---|---|---|---|---|---|
| `sm` (4 columns) | 4 | 4 | 4 | 4 | 2 |
| `md` (8 columns) | 8 | 4 | 3 | 5 | 2 |
| `lg` (12 columns) | 12 | 6 | 4 | 8 | 3 |
| `xl` (12 columns) | 12 | 6 | 4 | 8 | 3 |

**Rules**

- **Span columns, don't set widths.** A card is `.ds-span-third`; it is never 320px wide. On the next breakpoint it spans what fits.
- **Let items shrink.** Grid tracks are `minmax(0, 1fr)` and items have `min-width: 0`, so one long URL can't push the page sideways. The `.ds-grid` class does both.
- **Full width is still inside the margins.** A band can run edge to edge; its content stays inside the page margins.

---

## Widths named by job

Not everything should be as wide as the page. Each kind of content gets the width that serves it, and each width has a name that says what it is for.

| Token | Use it for | Value |
|---|---|---|
| `layout/container/max` | Widest the page content gets: 1440 − 2 × the xl margin, so it stops growing where xl begins and wider screens get wider margins | 1312px |
| `layout/measure/reading` | Widest running text gets: about 71 characters of type.body.md at any text size (34rem) | 34rem (544px at 16px) |
| `layout/tile/min` | Narrowest a tile gets in a tile grid (cards on a dashboard); the grid fits as many as the row holds, and one full-width tile on the smallest screens | 256px |

**Which width?**

| Content | Width |
|---|---|
| Running text: paragraphs, articles, help, long descriptions | `layout/measure/reading` |
| A form: one column of fields | `layout/measure/reading` |
| The content of a page | `layout/container/max` (with `layout/margin` around it) |
| Data people compare across: tables, boards, timelines | the full width of the region — a table wider than that scrolls inside its own container |
| Cards of the same kind that wrap: a dashboard, a gallery | `layout/tile/min` (a tile grid) |
| An image or video | the full width of its column, never more (`max-width: 100%`) |

**The page stops growing where `xl` begins.** `layout/container/max` is computed: 1440 − 2 × 64 = 1312px. Below 1440px the content fills the window minus its margins; above it, the content stays 1312px and the margins grow. The `.ds-page` class does this.

**The reading width is in rem.** 34rem holds about 71 characters of 16px body text, inside the 45–75 most guidance recommends and under WCAG 1.4.8's 80. Because it is rem, it grows with the reader's text size and keeps the same characters per line:

| Text size | Reading width | Characters per line |
|---|---|---|
| 16px (default) | 544px | about 71 |
| 32px (200%) | 1088px | about 71 |
| 16px, if it were a px width growing to 640px | 640px | about 83 — too long |

**Tiles fit what the row holds.** A tile grid places as many columns of at least 256px as fit, and drops to one full-width tile when even one doesn't (`.ds-tiles`: `repeat(auto-fill, minmax(min(100%, 256px), 1fr))`). No breakpoints needed; the gaps follow density. Tiles per row across a full page, in default density:

| Breakpoint | Page content | Tiles per row |
|---|---|---|
| `sm` | 288px | 1 |
| `md` | 536px | 2 |
| `lg` | 944px | 3 |
| `xl` | 1312px | 4 |

**Rules**

- **Text never takes the page width.** Paragraphs, help and forms stop at the reading width even on a 2560px screen.
- **Data takes the room it needs.** Tables and boards use the region's full width; a table wider than that scrolls inside its own container (focusable, with a name), not the page.
- **Never a fixed width on a container.** `max-width` with a token, never `width` in px: a 1200px box scrolls 880px sideways on a 320px screen.

---

## Regions and panes

An app screen has a few regions with fixed jobs. Knowing the job tells you where something goes and what happens to it on a smaller screen.

| Region | Job | In code | On smaller screens |
|---|---|---|---|
| Header | Product name, search, account, global actions | `data-shell="header"` | Stays at the top (see the next chapter) |
| Navigation pane | Navigation between the product's sections | `data-shell="nav"` | Below lg: a drawer the app opens |
| Supporting pane | Supporting content beside the main region: details, filters, help | `data-shell="aside"` | Below xl: under the main content |
| Main region | The task the screen is for — it always keeps priority | `data-shell="main"` | Never shrinks below one reading line while a pane is open |
| Overlays | A short task on top of the page: a dialog, a sheet, a menu | Elevation foundation | Not a pane: it covers the page and gives focus back when it closes |

| Token | Use it for | Width | Beside the content from | Below that |
|---|---|---|---|---|
| `layout/pane/nav` | Navigation between the product's sections | 256px | `lg` (≥ 1024px) | a drawer |
| `layout/pane/aside` | Supporting content beside the main region: details, filters, help | 320px | `xl` (≥ 1440px) | below the main content |

**When a pane goes inline.** At the narrowest width of each breakpoint the build subtracts the inline panes and the margins, and checks what the main region keeps (L3):

| Breakpoint | Window | Beside the content | Main region | Main content | Grid inside main |
|---|---|---|---|---|---|
| `sm` | 320px | — | 320px | 288px | sm: 4 × 60px |
| `md` | 600px | — | 600px | 536px | md: 8 × 46px |
| `lg` | 1024px | `layout/pane/nav` | 768px | 688px (≥ 544px) | md: 8 × 65px |
| `xl` | 1440px | `layout/pane/nav` + `layout/pane/aside` | 864px | 736px (≥ 544px) | md: 8 × 71px |

That is why the supporting pane waits until `xl`: at 1024px, both panes would leave 368px for the main content — less than one reading line.

**The drawer.** Below its breakpoint the navigation pane is a drawer: hidden, and out of the tab order, until a button opens it. It leaves at least 48px of the page visible on a 320px screen, so people can see where they are. The button has `aria-expanded` and `aria-controls`; Escape closes the drawer and focus returns to the button.

**Order.** In the code the regions come in one order — header, navigation, main, supporting — and the layout never contradicts it. A screen-reader or keyboard user meets them in the same order a sighted user sees them, at every width (WCAG 1.3.2, 2.4.3).

```html
<div class="ds-shell">
  <header data-shell="header">…</header>
  <nav data-shell="nav" id="nav" aria-label="Sections">…</nav>
  <main data-shell="main"><div class="ds-page">…</div></main>
  <aside data-shell="aside" aria-label="Details">…</aside>
</div>
```

**Rules**

- **The main region keeps priority.** When space runs out, panes move — under the content or into a drawer — before the main region gives up its reading line.
- **Panes by job, not by side.** A pane is `nav` or `aside`, not "left" or "right"; start and end flip in right-to-left languages.
- **Never reorder visually.** No `order` or `row-reverse` to move a pane: change the DOM order instead.

---

## The header and scrolling

The header stays at the top while the page scrolls, so search and navigation are always one step away. Because it holds controls, its height follows density like they do — one step along the spacing scale.

| Token | Use it for | comfortable | default (default mode) | compact |
|---|---|---|---|---|
| `layout/header/height` | Minimum height of the app header: a control plus room above and below, in every density | 64 | 56 | 48 |
| `layout/scroll-padding/top` | Space the browser keeps clear at the top when it scrolls to a focused element or an anchor: the sticky header's height, growing with the reader's text size (WCAG 2.4.11). tokens.css sets it on `<html>` | 64 | 56 | 48 |

**It holds its controls and leaves the page room** (check L4):

| Density | Header | Control | Room | Share of a 480px-tall window |
|---|---|---|---|---|
| comfortable | 64px | 48px | 16px (≥ 8) | 13% (≤ 25%) |
| default | 56px | 40px | 16px (≥ 8) | 12% (≤ 25%) |
| compact | 48px | 32px | 16px (≥ 8) | 10% (≤ 25%) |

**It sticks only where there is room.** The header stays at the top in windows at least 30em tall (480px at the default text size). In shorter ones it scrolls away with the page: at 400% zoom the screen is 320 × 256px and a sticky header would take a fifth of it, and at 200% text a header that wraps onto a second line would grow past its scroll padding and cover the item that has focus. Because the limit is in em, at 200% text the header sticks only in windows at least 960px tall.

**Focus is never hidden under it (WCAG 2.4.11).** When someone tabs to a link near the top of the visible page — usually tabbing backwards — the browser scrolls it into view, right to the top edge, where the sticky header covers it. `scroll-padding-top` tells the browser to stop that far below the edge. `tokens.css` sets it on `<html>` from `layout/scroll-padding/top`, which points at the header height, so the two can't drift apart; it adds the focus ring's reach (`focus.ring.offset` + `focus.ring.width`), so the ring above a focused item clears the header too (found by the radius audit). In code it is `max(header height, 3.5rem)`: when a reader enlarges text, the header's labels grow and the padding grows faster, so it always clears the real header (found by the layout audit: at 200% text a 56px padding left a focused radio button under a 75px header).

**More sticky bars, more padding.** A sticky toolbar under the header adds its own height: `scroll-padding-top: calc(var(--ds-layout-scroll-padding-top) + <toolbar height>)`. Sticky footers need `scroll-padding-bottom` the same way.

**Rules**

- **Minimum height, not height.** `min-height`: at 200% text the header grows instead of cutting off its labels.
- **One sticky bar if you can.** Every sticky bar takes height from the page. A second one sticks under the same 30em condition and adds its height to the scroll padding.
- **A header that can wrap.** If a header can wrap even in a tall window, measure it in the browser and set the scroll padding from its real height (the handoff shows how).

---

## Choosing a layout

Four questions get you to the right layout: *how wide should this be?*, *where does it go?*, *how do I divide the space?* and *when does it change?*

**Where something goes** — What job does it do?

| When | Use |
|---|---|
| The task the screen is for | the main region (`data-shell="main"`) |
| Moving between the product's sections | `layout/pane/nav` — inline from its breakpoint, a drawer below it |
| Supporting the task: details, filters, help, a preview | `layout/pane/aside` — inline from its breakpoint, below the main content below it |
| Product name, search, account, global actions | the header (`layout/header/height`, sticky) |
| A short task on top of the page: confirm, edit one thing | an overlay (a dialog or sheet — Elevation), not a pane |

**How to divide space** — What are you lining up?

| When | Use |
|---|---|
| Parts of a page that must line up with each other | `layout/columns` and `layout/gutter` (the page grid): span columns, never set px widths |
| Items of the same kind that should wrap | `layout/tile/min` (a tile grid) |
| A few things side by side that may wrap | flex-wrap with `space/inline/*` and `space/stack/*` gaps (Spacing) |
| Sections of a page, one under another | `space/stack/2xl` between them (Spacing) |

**When the layout changes** — What changes it?

| When | Use |
|---|---|
| The window gets wider | `breakpoint/md`, `breakpoint/lg`, `breakpoint/xl` — min-width media queries in em (Tailwind `md:`, `lg:`, `xl:`); nothing for sm |
| A pane opens beside the content | nothing: a grid inside a region follows the region's width |
| The screen is dense (a table, an admin tool) | `data-density="compact"` on the region (Spacing) |
| The reader enlarges text | nothing: breakpoints are in em, so the layout of a narrower screen takes over |

**Worked example — a project settings screen.** Laid out one question at a time:

| Part | Decision | Token or class | Why |
|---|---|---|---|
| The frame | Header, navigation, main, supporting help | `.ds-shell` | An app screen with sections and help. |
| Section links | Navigation pane | `layout/pane/nav` | Moving between sections: beside the content from lg, a drawer below. |
| The settings form | Main region, one column | `.ds-page` + `layout/measure/reading` | A form reads like text: one column, never wider than a reading line. |
| Usage cards above the form | A tile grid | `layout/tile/min` | Cards of one kind that wrap. |
| Help for the current section | Supporting pane | `layout/pane/aside` | Supports the task: beside the content from xl, below it before that. |
| Between the cards and the form | Spacing | `space/stack/2xl` | Sections of a page. |

**Do and avoid** (measured in this build)

| Avoid | Measured | Do |
|---|---|---|
| Reading width in px that grows with the screen (640px from lg) | about 83 characters a line of 16px text — past 75; at 200% text about 42 | `layout/measure/reading` — 34rem: about 71 characters at every breakpoint and every text size |
| A container with width: 1200px | on a 320px screen (or 400% zoom) the page scrolls 880px sideways | `layout/container/max` — as max-width (.ds-page): 1312px at most, the screen width below that |
| Twelve columns kept beside an open navigation pane | at 1024px the main region keeps 688px: 12 columns of 35.3px, gutters 38% of the row | `layout/columns` — in a region (.ds-grid inside the shell): the region is 768px, so it takes the md grid — 8 columns of 65px |
| Navigation and supporting panes both inline at lg | 1024 − 256 − 320 − 2 × 40 = 368px for the main content, under one reading line (544px) | `layout/pane/aside` — inline from xl (≥ 1440px); below the main content before that |
| A sticky header without scroll padding | tabbing back up the page, each focused item scrolls to the top edge — under the 56px header | `layout/scroll-padding/top` — on `<html>` (tokens.css sets it): the browser stops that far below the top |
| A breakpoint at 768px in px | a fifth layout, between md (600px) and lg (1024px) that no check covers; at 200% text it still switches at 768px | `breakpoint/md` / `breakpoint/lg` — 37.5em / 64em (Tailwind md: / lg:) |
| grid-template-columns: repeat(3, 1fr) with a long URL in one card | a 1fr track never shrinks below its longest word, so that column pushes the page sideways | `minmax(0, 1fr)` — the .ds-grid and .ds-tiles classes do it; flex children get min-width: 0 |

---

## Readers' settings and products

People zoom, enlarge text and pick denser screens; products add panes of their own. The layout is built so none of that breaks a screen.

**Zoom (WCAG 1.4.10).** At 400% zoom a 1280 × 1024 window is 320 × 256px — the `sm` layout. Every page has to work there without scrolling sideways; the margins stay 16px and the content keeps 288px (L1: 2/2 pass).

**Bigger text (WCAG 1.4.4).** Breakpoints are in em and the reading width in rem, so at 200% text a window gets the layout of one half as wide, and lines keep their length. Margins and gutters are px, so the text gets the extra room.

**Density.** Compact, default and comfortable change the header (64 / 56 / 48px) and the gaps in tile grids; columns, margins and widths stay put. Reflow is checked in every density.

**What the config changes**

| Follows the config | Fixed on purpose |
|---|---|
| The navigation pane's width (`layout.nav`, now 256px; 160–272px) | The breakpoints, the columns and the reading width |
| The supporting pane's width (`layout.aside`, now 320px; 240–480px) | The page cap — computed from the xl margin |
| The tile width (`layout.tile`, now 256px; 160–320px) | Every check |
| Panes added for this product (`layout.panes`) | Token names — nothing in designs or code is renamed |

**Adding a pane.** First check [Choosing a layout](#choosing-a-layout) — supporting content usually belongs in `aside`. If a product needs another pane, name it by its job, give a width in px and the breakpoint where it goes inline. The build assumes every pane can be open at once, adds them up at every breakpoint from there, and fails if the main region would lose its reading line or its grid (L3); a pane passes, and it appears in Figma, CSS, Tailwind, this guide and the AI contract at once. With the built-in panes open at `xl`, the main content keeps 736px — room for one more pane of up to 192px beside a 544px reading line. An outline of a long page fits:

```json
{
  "layout": {
    "panes": [
      {
        "name": "layout.pane.outline",
        "width": 192,
        "from": "xl",
        "side": "end",
        "description": "Headings of a long page, to jump between them"
      }
    ]
  }
}
```

A 288px inspector at `xl` would leave 448px and fails L3; narrow the supporting pane (`layout.aside`) or the new pane until they add up. A page that leaves a pane out gets no empty column — the shell sizes each column by the pane in it.

The build refuses widths that aren't px multiples of 8 or fall outside 160–480px, names that say where or how big ("left", "wide"), a pane inline on `sm`, and names that already exist. An end pane sits below the main content on narrower screens; a start pane becomes a drawer.

---

## Accessibility reference

What the build checks for layout, and the result for this build:

| Check | What it checks | WCAG | Result |
|---|---|---|---|
| T9 | Running text width gives 45–75 characters a line at body sizes (estimate; the page audit measures real lines) | 1.4.8 (AAA) | pass · 2/2 pass |
| L1 | Reflow at 320px: content width ≥ 272px and largest heading ≤ 40px | 1.4.10 (AA) | pass · 2/2 pass |
| L2 | The page grid fits every breakpoint: at its narrowest width each column is ≥ 40px and gutters take ≤ a third of the row | 1.4.10 (AA) | pass · 9/9 pass |
| L3 | Panes add up: a pane goes inline only at a breakpoint where the main region still holds a full reading line (layout.measure.reading) and its own grid keeps columns ≥ 40px | 1.4.10 (AA) | pass · 5/5 pass |
| L4 | A sticky header never hides focus: it holds its controls in every density, the scroll padding is its height, and it sticks only in windows ≥ 30em tall, where it takes ≤ 25% of the height | 2.4.11 (AA) | pass · 12/12 pass |
| L5 | One set of breakpoints: rising from 0, shared by type and layout, and the same in tokens.css (em) and Tailwind (rem), so both follow the reader's text size | 1.4.4 (AA) | pass · 8/8 pass |

What the checkers look for in your own code and pages: the layout checker (`npm run lint:layout`) reads CSS, HTML and JSX; the layout audit (`npm run audit:layout`) renders a page at the narrowest width of every breakpoint in every density, then checks sideways scrolling, line length, focus under sticky bars and reading order. See the [handoff](HANDOFF.md).

**Glossary**

| Term | Meaning |
|---|---|
| Breakpoint | The window width where the layout changes; each lasts until the next begins. |
| Column | One of the equal divisions of the page grid. |
| Gutter | The space between two columns. |
| Margin | The space between the screen edge and the content. |
| Measure | The length of a line of text, in characters. |
| Region | A part of the screen with one job: header, navigation, main, supporting. |
| Pane | A region that sits beside the main region when there is room. |
| Drawer | A pane that slides over the page when there is no room for it beside the content. |
| Reflow | Content that rearranges into one column instead of scrolling sideways (WCAG 1.4.10). |
| Mode | A set of values for every variable in a collection; switching it on a frame or container changes them all. |
