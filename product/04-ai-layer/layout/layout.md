# Layout rules for AI tools — ds

Generated from the engine (14 tokens; every grid and pane checked at the narrowest width of every breakpoint; all checks pass). The same data in machine-readable form: `layout.contract.json`.

## How to use this file
1. Decide each width, region and breakpoint with the **Decision guide**, using token and class names exactly as written.
2. Use the token or class itself — never copy its number into your own CSS.
3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.
4. Before answering, run the **Self-check**.

## Hard rules
| ID | Rule | Why | WCAG |
|---|---|---|---|
| LR-01 | Page edges are layout.margin: the side padding of the page content (or the main region's page) uses layout.margin — the .ds-page class or px-margin. Never a spacing inset token, px, rem or vw. | The margin follows the breakpoint and is linked to the spacing scale; the reflow check counts on it (288px of content at 320px). | 1.4.10 |
| LR-02 | No fixed widths on containers. Containers take max-width with a layout token (layout.container.max, layout.measure.reading, a pane width) or a fluid value; never width in px, rem or vw above the smallest screen, and never min-width that forces a wide layout. | A 1200px box on a 320px screen scrolls 880px sideways; at 400% zoom every desktop becomes that screen. | 1.4.10 |
| LR-03 | Running text stays within layout.measure.reading (the .ds-measure class, max-w-reading). Never a px max-width on text, and never a width that grows with the screen. | Past about 75 characters readers lose the next line; a px width shrinks the line at 200% text and grows it on wide screens. | 1.4.8 |
| LR-04 | A sticky or fixed header is layout.header.height tall (as min-height), sticks only in windows at least 30em tall (the .ds-shell header does both), and the page keeps scroll-padding-top: layout.scroll-padding.top (tokens.css sets it on `<html>`). Every other sticky bar adds its own height to the scroll padding. Never set scroll-padding-top to anything else. | When the browser scrolls to a focused item or an anchor, it stops at the scroll padding — without it the item lands under the header. In short windows (400% zoom, 200% text on a laptop) a header that wraps would outgrow its padding, so there it scrolls away. | 2.4.11 |
| LR-05 | Grid and flex items that hold content can shrink: grid tracks are minmax(0, 1fr) (never a bare 1fr or auto for content columns) and flex children that hold text or tables get min-width: 0. | A 1fr track never gets narrower than its longest word, URL or table, so one long value pushes the whole page sideways. | 1.4.10 |
| LR-06 | Layouts change only at the system breakpoints: min-width media queries at breakpoint.md, .lg and .xl in em (37.5em, 64em, 90em), or Tailwind md:, lg:, xl:. No other widths, no max-width (desktop-first) queries, no px breakpoints, no Tailwind sm: or 2xl:. | Every breakpoint is designed and checked at its narrowest width; a 768px breakpoint creates a layout nobody checked, and px breakpoints don't move when readers enlarge text. | 1.4.4, 1.4.10 |
| LR-07 | Visual order follows DOM order. Don't reorder content people read or tab through with order, row-reverse, column-reverse or grid placement; the shell keeps header, start panes, main, end panes. | Keyboard and screen-reader users follow the DOM: a sidebar moved before the content visually but after it in the code sends focus somewhere they can't see. | 1.3.2, 2.4.3 |
| LR-08 | The page never scrolls sideways. Use width: 100%, not 100vw (it includes the scrollbar); never hide overflow on `<html>` or `<body>` to mask it. A wide table scrolls inside its own container, which is focusable and named (tabindex="0" and an accessible name). | Hiding overflow cuts content off instead of reflowing it; a scrolling region keyboard users can't focus can't be scrolled. | 1.4.10, 2.1.1 |
| LR-09 | Page columns come from layout.columns and layout.gutter (.ds-grid): span columns with the .ds-span-* classes, never fixed px tracks or spans set by window media queries. Cards that wrap use the tile grid (layout.tile.min); a pane uses its pane token. Inside a pane or region the grid follows the region — never add breakpoints for it. | Fixed tracks don't fit the next breakpoint; a grid that keeps 12 columns next to an open pane gets columns too thin for content. | 1.4.10 |
| LR-10 | Never redefine a layout token in app code (--ds-layout-*, --ds-breakpoint-*). Change the engine config (layout.nav, layout.aside, layout.tile, layout.panes) and build, so the change is checked. | An overridden width skips the checks that prove panes and grids fit. | — |

## Decision guide

**How wide content gets** — What is it?

| When | Use |
|---|---|
| Running text: paragraphs, articles, help, long descriptions | `layout.measure.reading` |
| A form: one column of fields | `layout.measure.reading` |
| The content of a page | `layout.container.max` (with `layout.margin` around it) |
| Data people compare across: tables, boards, timelines | the full width of the region — a table wider than that scrolls inside its own container |
| Cards of the same kind that wrap: a dashboard, a gallery | `layout.tile.min` (a tile grid) |
| An image or video | the full width of its column, never more (`max-width: 100%`) |

**Where something goes** — What job does it do?

| When | Use |
|---|---|
| The task the screen is for | the main region (`data-shell="main"`) |
| Moving between the product's sections | `layout.pane.nav` — inline from its breakpoint, a drawer below it |
| Supporting the task: details, filters, help, a preview | `layout.pane.aside` — inline from its breakpoint, below the main content below it |
| Product name, search, account, global actions | the header (`layout.header.height`, sticky) |
| A short task on top of the page: confirm, edit one thing | an overlay (a dialog or sheet — Elevation), not a pane |

**How to divide space** — What are you lining up?

| When | Use |
|---|---|
| Parts of a page that must line up with each other | `layout.columns` and `layout.gutter` (the page grid): span columns, never set px widths |
| Items of the same kind that should wrap | `layout.tile.min` (a tile grid) |
| A few things side by side that may wrap | flex-wrap with `space.inline.*` and `space.stack.*` gaps (Spacing) |
| Sections of a page, one under another | `space.stack.2xl` between them (Spacing) |

**When the layout changes** — What changes it?

| When | Use |
|---|---|
| The window gets wider | `breakpoint.md`, `breakpoint.lg`, `breakpoint.xl` — min-width media queries in em (Tailwind `md:`, `lg:`, `xl:`); nothing for sm |
| A pane opens beside the content | nothing: a grid inside a region follows the region's width |
| The screen is dense (a table, an admin tool) | `data-density="compact"` on the region (Spacing) |
| The reader enlarges text | nothing: breakpoints are in em, so the layout of a narrower screen takes over |

## Breakpoints
Mobile first: write the sm layout with no query, then add `min-width` queries in em. Each breakpoint is checked at its narrowest width (sm at 320px, the WCAG reflow width).

| Breakpoint | From | Media query | Tailwind | Columns | Gutter | Margin |
|---|---|---|---|---|---|---|
| `sm` | 0px | none — the default | no prefix | 4 | 16px | 16px |
| `md` | 600px | `@media (min-width: 37.5em)` | `md:` | 8 | 24px | 32px |
| `lg` | 1024px | `@media (min-width: 64em)` | `lg:` | 12 | 24px | 40px |
| `xl` | 1440px | `@media (min-width: 90em)` | `xl:` | 12 | 32px | 64px |

## Tokens
In code use the CSS variable, Tailwind utility or class; in Figma the variable of the same name.

### Breakpoints
| Token | CSS variable | Tailwind | Value | Use |
|---|---|---|---|---|
| `breakpoint.sm` | `--ds-breakpoint-sm` | `(no prefix)` | 0px · 0em | Narrowest window width of sm (0em in media queries) |
| `breakpoint.md` | `--ds-breakpoint-md` | `md:` | 600px · 37.5em | Narrowest window width of md (37.5em in media queries) |
| `breakpoint.lg` | `--ds-breakpoint-lg` | `lg:` | 1024px · 64em | Narrowest window width of lg (64em in media queries) |
| `breakpoint.xl` | `--ds-breakpoint-xl` | `xl:` | 1440px · 90em | Narrowest window width of xl (90em in media queries) |

### The page grid — per breakpoint
| Token | CSS variable | Tailwind | sm (≥ 0px) | md (≥ 600px) | lg (≥ 1024px) | xl (≥ 1440px) | Use |
|---|---|---|---|---|---|---|---|
| `layout.columns` | `--ds-layout-columns` | — | 4 | 8 | 12 | 12 | Columns of the page grid |
| `layout.gutter` | `--ds-layout-gutter` | `gap-x-gutter` | 16 | 24 | 24 | 32 | Gap between the columns of the page grid (linked to Spacing) |
| `layout.margin` | `--ds-layout-margin` | `px-margin` `mx-margin` | 16 | 32 | 40 | 64 | Space between the screen edge and the page content; the main region's side padding (linked to Spacing) |

### Widths named by job
| Token | CSS variable | Tailwind | Value | Use |
|---|---|---|---|---|
| `layout.container.max` | `--ds-layout-container-max` | `max-w-page` | 1312px | Widest the page content gets: 1440 − 2 × the xl margin, so it stops growing where xl begins and wider screens get wider margins |
| `layout.measure.reading` | `--ds-layout-measure-reading` | `max-w-reading` | 34rem (544px at the default text size) | Widest running text gets: about 71 characters of type.body.md at any text size (34rem) |
| `layout.tile.min` | `--ds-layout-tile-min` | — | 256px | Narrowest a tile gets in a tile grid (cards on a dashboard); the grid fits as many as the row holds, and one full-width tile on the smallest screens |

### Panes
| Token | CSS variable | Tailwind | px | Inline from | Below that | data-shell | Use |
|---|---|---|---|---|---|---|---|
| `layout.pane.nav` | `--ds-layout-pane-nav` | `w-nav` | 256 | lg (≥ 1024px) | a drawer | `nav` | Navigation between the product's sections; a drawer below its breakpoint |
| `layout.pane.aside` | `--ds-layout-pane-aside` | `w-aside` | 320 | xl (≥ 1440px) | below the main content | `aside` | Supporting content beside the main region: details, filters, help; below the main content on narrower screens |

### The header — per density
| Token | CSS variable | Tailwind | comfortable | default | compact | Use |
|---|---|---|---|---|---|---|
| `layout.header.height` | `--ds-layout-header-height` | `min-h-header` `scroll-pt-header` | 64 | 56 | 48 | Minimum height of the app header: a control plus room above and below, in every density |
| `layout.scroll-padding.top` | `--ds-layout-scroll-padding-top` | — | 64 | 56 | 48 | Space the browser keeps clear at the top when it scrolls to a focused element or an anchor: the sticky header's height, growing with the reader's text size (WCAG 2.4.11). tokens.css sets it on `<html>` |

## Classes in tokens.css
They work with or without Tailwind. Single values also have utilities: `max-w-reading`, `max-w-page`, `px-margin`, `gap-x-gutter`, `min-h-header`, `scroll-pt-header`, `w-nav`, `w-aside`.

| Class | What it does | In Tailwind |
|---|---|---|
| `.ds-page` | Page content: capped at layout.container.max, padded with layout.margin, centred | — (use the class: it adds the margin to the cap; px-margin alone sets the padding) |
| `.ds-grid` | The page grid: layout.columns columns of minmax(0, 1fr), layout.gutter between them; items can shrink; inside a region it takes the region's grid | — (use the class: utilities can't follow the region) |
| `.ds-span-half` `.ds-span-third` `.ds-span-two-thirds` `.ds-span-quarter` `.ds-span-full` | A grid item's width as a fraction of the grid it is in, in whole columns (see Spans); follows the region like the grid does | — (use the classes) |
| `.ds-measure` | Running text: no wider than layout.measure.reading | `max-w-reading` |
| `.ds-tiles` | Cards that wrap: as many layout.tile.min columns as fit, one full-width tile on the smallest screens; gaps follow density | — (use the class) |
| `.ds-region` | A size container: a grid inside takes the grid of the region's width (shell regions are regions already) | — (use the class; Tailwind's @container sizes are not the ds breakpoints) |
| `.ds-shell` | The app shell: children data-shell="header", the start panes, "main", the end panes; panes go inline at their breakpoint | — (use the class) |

**Spans.** Columns each fraction takes, per grid (a grid in a region uses the region's breakpoint):

| Grid | `.ds-span-full` | `.ds-span-half` | `.ds-span-third` | `.ds-span-two-thirds` | `.ds-span-quarter` |
|---|---|---|---|---|---|
| sm (4 columns) | 4 | 4 | 4 | 4 | 2 |
| md (8 columns) | 8 | 4 | 3 | 5 | 2 |
| lg (12 columns) | 12 | 6 | 4 | 8 | 3 |
| xl (12 columns) | 12 | 6 | 4 | 8 | 3 |

## The app shell
`<div class="ds-shell"> <header data-shell="header"> <nav data-shell="nav"> <main data-shell="main"> <aside data-shell="aside"> </div> — in this order`

Below its breakpoint a start pane is hidden until the app sets data-open on it (a button with aria-expanded and aria-controls toggles it; Escape closes it and focus returns to the button). [data-shell-toggle="<pane>"] is hidden from the pane's breakpoint.

| Breakpoint | Checked at | Inline panes | Main region | Main content | Grid inside main |
|---|---|---|---|---|---|
| `sm` | 320px | — | 320px | 288px | sm: 4 columns of 60px |
| `md` | 600px | — | 600px | 536px | md: 8 columns of 46px |
| `lg` | 1024px | `layout.pane.nav` | 768px | 688px | md: 8 columns of 65px |
| `xl` | 1440px | `layout.pane.nav` + `layout.pane.aside` | 864px | 736px | md: 8 columns of 71px |

## Limits the build enforces
| Limit | Value |
|---|---|
| Reflow | every page works at 320 × 256px (a 1280 × 1024 window at 400% zoom) without scrolling sideways |
| Columns | at least 40px wide and gutters at most a third of the row, at the narrowest width of every breakpoint — inside an open pane's main region too |
| Panes | inline only where the main region keeps one reading line (544px) beside them; a drawer leaves 48px of the page visible at 320px |
| Sticky header | holds a control with 8px to spare in every density; sticks only in windows at least 30em (480px) tall, where it takes at most 25% of the height — at 400% zoom it scrolls with the page; the scroll padding is its height |
| Reading width | 34rem: about 71 characters of body text (WCAG 1.4.8 asks for 80 or fewer) |
| Page content | at most 1312px; wider screens get wider margins |

## Common mistakes (measured)
| Mistake | Measured | Use instead |
|---|---|---|
| Reading width in px that grows with the screen (640px from lg) | about 83 characters a line of 16px text — past 75; at 200% text about 42 | `layout.measure.reading` — 34rem: about 71 characters at every breakpoint and every text size |
| A container with width: 1200px | on a 320px screen (or 400% zoom) the page scrolls 880px sideways | `layout.container.max` — as max-width (.ds-page): 1312px at most, the screen width below that |
| Twelve columns kept beside an open navigation pane | at 1024px the main region keeps 688px: 12 columns of 35.3px, gutters 38% of the row | `layout.columns` — in a region (.ds-grid inside the shell): the region is 768px, so it takes the md grid — 8 columns of 65px |
| Navigation and supporting panes both inline at lg | 1024 − 256 − 320 − 2 × 40 = 368px for the main content, under one reading line (544px) | `layout.pane.aside` — inline from xl (≥ 1440px); below the main content before that |
| A sticky header without scroll padding | tabbing back up the page, each focused item scrolls to the top edge — under the 56px header | `layout.scroll-padding.top` — on `<html>` (tokens.css sets it): the browser stops that far below the top |
| A breakpoint at 768px in px | a fifth layout, between md (600px) and lg (1024px) that no check covers; at 200% text it still switches at 768px | `breakpoint.md` / `breakpoint.lg` — 37.5em / 64em (Tailwind md: / lg:) |
| grid-template-columns: repeat(3, 1fr) with a long URL in one card | a 1fr track never shrinks below its longest word, so that column pushes the page sideways | `minmax(0, 1fr)` — the .ds-grid and .ds-tiles classes do it; flex children get min-width: 0 |

## Self-check before answering
- [ ] Page edges use `layout.margin` (`.ds-page` or `px-margin`); no container has a fixed width.
- [ ] Running text and forms stay within `layout.measure.reading`.
- [ ] Every media query is a system breakpoint, min-width, in em (or Tailwind `md:` `lg:` `xl:`); none inside panes or regions.
- [ ] Grid tracks are `minmax(0, 1fr)` or come from `.ds-grid` / `.ds-tiles`; flex children that hold text have `min-width: 0`.
- [ ] Panes use `data-shell` in DOM order (header, start panes, main, end panes); nothing is reordered with `order` or `*-reverse`.
- [ ] A sticky header uses `layout.header.height` as min-height and nothing overrides `scroll-padding-top`.
- [ ] Nothing scrolls sideways at 320px; wide tables scroll inside a focusable, named container; no `100vw`, no hidden overflow on `<html>` or `<body>`.
- [ ] No layout variables redefined.
