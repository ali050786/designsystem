# Typography

*ds foundations · typography · the written guide. Generated from the engine — 21 styles, 4 breakpoints, base 16px, ratios sm 1.125 · md 1.15 · lg 1.2 · xl 1.2; every typography check passing. Do not edit by hand; change the engine config and build again.*

This guide explains how type works in ds and how to use it: where the sizes come from, what each style is for, how styles change with the screen, and how text survives the settings readers choose. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after [Choosing and using type](#choosing-and-using-type); developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (`typography.md`, `typography.contract.json`).

**Contents**

- [Five principles](#five-principles)
- [The type scale](#the-type-scale)
- [How tokens are built](#how-tokens-are-built)
- [Fonts, weights and spacing](#fonts-weights-and-spacing)
- [Headings and display](#headings-and-display)
- [Titles and labels](#titles-and-labels)
- [Reading text](#reading-text)
- [Numbers and data](#numbers-and-data)
- [Across screen sizes](#across-screen-sizes)
- [Choosing and using type](#choosing-and-using-type)
- [Readers' settings and brands](#readers-settings-and-brands)

---

## Five principles

Five principles shape every type decision. Each one is checked by the build, not left to taste.

| Principle | What it means in practice |
|---|---|
| **Readable by construction** | Reading styles keep a line height of 1.5 or more and nothing is smaller than 12px, at every breakpoint. A style that breaks either rule can't be generated. |
| **Roles, not sizes** | Designs and code use named styles like `type/body/md`. A style carries its size, line height, letter-spacing and weight for every screen width; a number like 15px carries none of that. |
| **Headings move, text stays** | Only display and heading styles change with the screen (6 of 21). Text people read and operate keeps one size everywhere, so forms, tables and buttons look the same on every device. |
| **Numbers line up** | Number styles use tabular numerals, and table cells get them by default, so columns align and live values don't jitter. |
| **Survives the reader's settings** | Sizes are rem, line heights have no unit and letter-spacing is in em, so text follows the browser's text size. Pages are checked with text at 200% and with the WCAG text-spacing override. |

---

## The type scale

Every size comes from one rule: **base × ratio^step**. The base is 16px (step 0). Each step up multiplies by the ratio, each step down divides by it. The ratio depends on the screen width, so the same step is bigger on a wider screen.

**Rounding.** Below 32px a size is rounded to a whole even pixel; from 32px up, to the 4px grid. Even sizes centre cleanly in controls, and large sizes land on the same grid as spacing. (The 4px grid starts at 32px because below that it is too coarse: two neighbouring steps would round to the same size.)

| Step | sm (≥0px) | md (≥600px) | lg (≥1024px) | xl (≥1440px) | Styles that stay (sm size everywhere) | Styles that move |
|---|---|---|---|---|---|---|
| -2 | 12 | 12 | 12 | 12 | `label/sm`, `caption/md`, `code/sm` | — |
| -1 | 14 | 14 | 14 | 14 | `body/sm`, `label/md`, `code/md`, `numeric/sm` | — |
| 0 | 16 | 16 | 16 | 16 | `title/sm`, `body/md`, `label/lg`, `numeric/md` | — |
| 1 | 18 | 18 | 20 | 20 | `title/md`, `body/lg` | — |
| 2 | 20 | 22 | 24 | 24 | `title/lg` | — |
| 3 | 22 | 24 | 28 | 28 | — | `heading/sm` |
| 4 | 26 | 28 | 32 | 32 | — | `heading/md` |
| 5 | 28 | 32 | 40 | 40 | `numeric/lg` | `heading/lg` |
| 6 | 32 | 36 | 48 | 48 | — | `display/sm` |
| 7 | 36 | 44 | 56 | 56 | — | `display/md` |
| 8 | 40 | 48 | 68 | 68 | — | `display/lg` |

Two kinds of style read this table differently:

- **Styles that move** (display, heading) take the ratio of the current breakpoint: sm 1.125, md 1.15, lg 1.2, xl 1.2.
- **Styles that stay** (everything else) always use the small-screen ratio, 1.125, so a button label is the same size on a phone and on a desktop.

Why the ratio grows with the screen: on a phone, a page title can only be a little bigger than a paragraph or it won't fit; on a desktop there is room for a clearer hierarchy. Large and extra-large share a ratio: past 1024px, wider screens get more columns and margin, not bigger headings — the reading width is capped anyway.

**Line height** comes from what the text is for. Each kind has a minimum ratio; the line height is size × ratio rounded *up* to the next even pixel, so it never falls below the minimum:

| Kind | Minimum ratio | For | Example |
|---|---|---|---|
| display | 1.15 | Short, large statements — one or two lines | `type/display/lg` at lg: 68/80 (1.18) |
| heading | 1.25 | Headings that name a page or a section | `type/heading/lg` at lg: 40/50 (1.25) |
| title | 1.30 | Names of components: cards, dialogs, panels | `type/title/lg` at lg: 20/26 (1.30) |
| label | 1.33 | Text people act on: buttons, fields, tabs | `type/label/lg` at lg: 16/22 (1.38) |
| reading | 1.50 | Text people read in lines: paragraphs, help, code | `type/body/lg` at lg: 18/28 (1.56) |

**Rules**

- **Never add a size between steps.** A 15px or 17px text breaks the rhythm and isn't checked. If no style fits, add a style on a step (see the last chapter).
- **Pick a style, not a step.** Steps are how styles are made. Designs and code use the styles.

---

## How tokens are built

Type comes in two tiers, like colour. Each tier only points to the one below it.

| Tier | In Figma | What it holds | Who touches it |
|---|---|---|---|
| **Primitives** | Primitives collection · one mode · hidden from publishing | Families, weights, sizes (16), letter-spacings. No meaning. | Nobody — the engine writes them |
| **Styles** | Responsive collection · sm, md, lg, xl · plus one text style each | 21 styles named by job. Each holds family, size, weight, line height and letter-spacing for every breakpoint. | Everyone: designs and code use only this tier |
| **Component text** | Added with components | Points to styles, e.g. a button's label. | Component authors (later phase) |

**Reading a name.** `type / body / md` — category `type`, role `body`, size `md`. Sizes are always `sm`, `md`, `lg` *within a role*: `body/sm` is the small body text, not "body on small screens". The screen size is a mode, never part of a name.

**What a style holds.** Five values per breakpoint, plus two switches for some styles:

| Property | Points to | In code |
|---|---|---|
| Family | `font/family/sans` or `font/family/mono` | font-family |
| Size | `font/size/<px>` | font-size in rem |
| Weight | `font/weight/<name>` | font-weight |
| Line height | computed per breakpoint (px in Figma) | line-height with no unit |
| Letter-spacing | `font/letter-spacing/<name>` | letter-spacing in em |
| Tabular numerals | number styles only | font-variant-numeric: tabular-nums |
| Upper case | only styles made for capitals | text-transform: uppercase |

**One name, four places.** Designers and developers say the same word for the same style:

| Figma text style | CSS class | CSS variables | Tailwind |
|---|---|---|---|
| `type/body/md` | `.ds-type-body-md` | `--ds-type-body-md-font-size` … | `text-body-md` |

In Figma, a frame's **Responsive** mode decides which sizes every text style inside it shows. In code, the same switch happens with media queries at 600px, 1024px, 1440px — nothing to set.

---

## Fonts, weights and spacing

The raw material every style is made from: two families, four weights, 16 sizes and four letter-spacings. Like colour shades, they are hidden from publishing — you meet them through styles.

**Families.** Each is a stack: the font you designed with first, then fonts that look close, then the system's generic family. While a web font loads — or if it never does — the next font in the stack is used, so text is always readable.

| Family | Stack | Used by |
|---|---|---|
| sans | `Inter, "Segoe UI", system-ui, -apple-system, sans-serif` | every style except code |
| mono | `"JetBrains Mono", "SFMono-Regular", Consolas, monospace` | `code/*` only |

Numbers stay in the sans family: tabular numerals line digits up without switching to a code font.

**Weights.** Four, named for what they are, so "bold" really means 700 — which matters for the large-text rule (bold text counts as large from 18.66px).

| Weight | Value | Used by |
|---|---|---|
| `font/weight/regular` | 400 | body, caption, code, numbers |
| `font/weight/medium` | 500 | labels |
| `font/weight/semibold` | 600 | titles, headings, the big metric figure, emphasis in text |
| `font/weight/bold` | 700 | display |

**Letter-spacing** is in em, so it follows the size it is applied to. Text below 24px is never tightened; large text is tightened slightly so letters don't look loose; capitals are spaced out.

| Token | Value | Used for | For example |
|---|---|---|---|
| `font/letter-spacing/normal` | 0 | Everything below 24px | 0px at 16px |
| `font/letter-spacing/tight` | −0.01em | Headings from 24px | −0.32px at 32px |
| `font/letter-spacing/tighter` | −0.02em | Display and headings from 44px | −1.36px at 68px |
| `font/letter-spacing/caps` | +0.06em | Upper-case label styles (none built in) | +0.72px at 12px |

**Sizes** used by the styles, with the rem value code uses:

| Token | px | rem |
|---|---|---|
| `font/size/12` | 12 | 0.75 |
| `font/size/14` | 14 | 0.875 |
| `font/size/16` | 16 | 1 |
| `font/size/18` | 18 | 1.125 |
| `font/size/20` | 20 | 1.25 |
| `font/size/22` | 22 | 1.375 |
| `font/size/24` | 24 | 1.5 |
| `font/size/26` | 26 | 1.625 |
| `font/size/28` | 28 | 1.75 |
| `font/size/32` | 32 | 2 |
| `font/size/36` | 36 | 2.25 |
| `font/size/40` | 40 | 2.5 |
| `font/size/44` | 44 | 2.75 |
| `font/size/48` | 48 | 3 |
| `font/size/56` | 56 | 3.5 |
| `font/size/68` | 68 | 4.25 |

**Rules**

- **Never use a primitive in a design.** `font/size/16` has no line height, no letter-spacing and doesn't change with the screen. Use the style.
- **Never set a font family in a component.** Change fonts once, in the engine config; the fallback stack comes with it.

---

## Headings and display

Display and heading styles name the page and its parts. They are the only styles that change with the screen.

- **Display** is for statements, not structure: the one big line on a landing, welcome or empty page. At most one per view.
- **Headings** build the page outline: the page title, its sections and subsections.

**Tag by outline, style by weight.** The heading *tag* (h1–h6) comes from where the text sits in the page's outline; the *style* comes from how much it should stand out. `tokens.css` gives each tag a sensible default (`<h1>` → `heading/lg`, `<h2>` → `heading/md`, `<h3>` → `heading/sm`, `<h4>` → `title/lg`, `<h5>` → `title/md`), and any class overrides it. A settings page, for example:

| Text | Tag | Style |
|---|---|---|
| Settings | h1 | `heading/lg` |
| Notifications | h2 | `heading/md` |
| Email (a card) | h3 | `title/md` |
| Weekly summary (a row in the card) | — (a label, not a heading) | `label/md` |

**L** in the tables marks large text for contrast (WCAG: 24px and up, or 18.66px and up in bold). ds colour pairs meet 4.5 : 1 for all text, so the larger allowance is never needed with ds colours.

**Display**

| Style | Use it for | sm (≥0px) | md (≥600px) | lg (≥1024px) | xl (≥1440px) | Weight |
|---|---|---|---|---|---|---|
| `type/display/lg` | The one big statement on a landing, welcome or empty page | 40/46 · L | 48/56 · L | 68/80 · L | 68/80 · L | bold 700 |
| `type/display/md` | Hero heading on a marketing or onboarding page | 36/42 · L | 44/52 · L | 56/66 · L | 56/66 · L | bold 700 |
| `type/display/sm` | A large statement inside a page, such as a welcome banner | 32/38 · L | 36/42 · L | 48/56 · L | 48/56 · L | bold 700 |

**Headings**

| Style | Use it for | sm (≥0px) | md (≥600px) | lg (≥1024px) | xl (≥1440px) | Weight |
|---|---|---|---|---|---|---|
| `type/heading/lg` | Page title — the h1 of a screen (default for `<h1>`) | 28/36 · L | 32/40 · L | 40/50 · L | 40/50 · L | semibold 600 |
| `type/heading/md` | Section heading inside a page (default for `<h2>`) | 26/34 · L | 28/36 · L | 32/40 · L | 32/40 · L | semibold 600 |
| `type/heading/sm` | Subsection heading (default for `<h3>`) | 22/28 | 24/30 · L | 28/36 · L | 28/36 · L | semibold 600 |

**Rules**

- **One display per view.** A second display competes with the first; use a heading for everything else.
- **Page titles are headings.** An app screen's title is `heading/lg`, never display.
- **Never skip a level.** Screen-reader users move by heading level; h2 → h4 makes them think something is missing. Change the style, not the tag.

---

## Titles and labels

Titles name components; labels are the text people act on. Both keep one size at every breakpoint, so a card or a button looks the same on every screen.

**Title or heading?** A heading names a part of the *page* and belongs in the outline. A title names a *component* — a card, a dialog, a panel — and is a heading only when the component is a section of the page. Use the title style either way.

**Labels follow the density.** Match the label to the density the screen uses (see the Spacing foundation):

| Density | Control height | Label |
|---|---|---|
| comfortable | 48px | `label/lg` |
| default | 40px | `label/md` |
| compact | 32px | `label/md` |
| badges and chips (any density) | — | `label/sm` |

**Titles**

| Style | Use it for | sm (≥0px) | md (≥600px) | lg (≥1024px) | xl (≥1440px) | Weight |
|---|---|---|---|---|---|---|
| `type/title/lg` | Dialog and side-panel titles (default for `<h4>`) | 20/26 | 20/26 | 20/26 | 20/26 | semibold 600 |
| `type/title/md` | Card and panel titles (default for `<h5>`, `<h6>`) | 18/24 | 18/24 | 18/24 | 18/24 | semibold 600 |
| `type/title/sm` | Titles in dense lists, menus and table groups | 16/22 | 16/22 | 16/22 | 16/22 | semibold 600 |

**Labels**

| Style | Use it for | sm (≥0px) | md (≥600px) | lg (≥1024px) | xl (≥1440px) | Weight |
|---|---|---|---|---|---|---|
| `type/label/lg` | Buttons and controls in comfortable density | 16/22 | 16/22 | 16/22 | 16/22 | medium 500 |
| `type/label/md` | Buttons, form labels, tabs, menu items | 14/20 | 14/20 | 14/20 | 14/20 | medium 500 |
| `type/label/sm` | Compact controls, badges and chips | 12/16 | 12/16 | 12/16 | 12/16 | medium 500 |

**Rules**

- **Labels may wrap; never clip them.** A translated or enlarged label is longer. Let the control grow rather than cutting the text.
- **Field labels stay visible.** Placeholders vanish when people type. Keep a `label/md` label above the field.
- **Capitals only through a style made for them.** A caps style adds letter-spacing; typing in capitals or adding text-transform by hand doesn't.

---

## Reading text

Paragraphs, help text and code are read line by line, so they get the most space between lines: 1.5 or more at every breakpoint. The build checks it (32/32 pass).

**Line length.** Running text stops at `layout.measure.reading` — 34rem, which is 544px at the default text size. That is about 71 characters of `body/md` and 63 of `body/lg` — inside the 45–75 range that is comfortable to read. Because it is in rem, the width grows when people enlarge text, and the characters per line stay the same.

**Paragraph spacing.** Separate paragraphs with `space/stack/lg` (16px in default density — one line of `body/md` text is 16px), never with empty lines.

**Captions are short.** `caption/md` is 12px — fine for a line or two of help, a timestamp or a chart label. Anything longer belongs in `body/sm`.

**Code.** Mono fonts look bigger than sans at the same size, so inline code goes one step down: `code/md` inside `body/md`, `code/sm` inside `body/sm` and captions.

**Body**

| Style | Use it for | sm (≥0px) | md (≥600px) | lg (≥1024px) | xl (≥1440px) | Weight |
|---|---|---|---|---|---|---|
| `type/body/lg` | Lead paragraph at the top of a page or section | 18/28 | 18/28 | 18/28 | 18/28 | regular 400 |
| `type/body/md` | Default paragraphs and descriptions (default for `<body>`) | 16/24 | 16/24 | 16/24 | 16/24 | regular 400 |
| `type/body/sm` | Secondary paragraphs, dense screens, text in table cells | 14/22 | 14/22 | 14/22 | 14/22 | regular 400 |

**Captions and code**

| Style | Use it for | sm (≥0px) | md (≥600px) | lg (≥1024px) | xl (≥1440px) | Weight |
|---|---|---|---|---|---|---|
| `type/caption/md` | Help text, timestamps, footnotes, chart labels | 12/18 | 12/18 | 12/18 | 12/18 | regular 400 |
| `type/code/md` | Code blocks, and inline code in body text | 14/22 | 14/22 | 14/22 | 14/22 | regular 400 |
| `type/code/sm` | Inline code in small text; IDs and keys in tables | 12/18 | 12/18 | 12/18 | 12/18 | regular 400 |

**Rules**

- **Left-align running text.** Justified text opens uneven gaps between words that make lines hard to follow.
- **Don't use caption for instructions.** Steps people must follow need `body/sm` or `body/md`.
- **Emphasis is weight or italics.** `<strong>` gives semibold; underline means a link; colour alone is not emphasis.

---

## Numbers and data

Numbers that people compare must line up. **Tabular numerals** give every digit the same width, so 1,111.11 and 8,888.88 take exactly the same space and a column of totals reads as a column. Many interface fonts draw a narrow 1 by default: in Inter, ten 1s are about two-thirds the width of ten 0s until tabular numerals are on (measured in Chromium).

- Number styles turn tabular numerals on.
- `tokens.css` turns them on for `td`, `th`, `output` and `data`, so tables need no class.
- Anywhere else, use a number style or add `tabular-nums`.

**In a table column:** right-align numbers, keep the same number of decimals, put the unit in the header, and write negatives with a real minus sign (−, not -). Changes also carry an arrow or sign — colour tells good from bad, the arrow tells direction (see the Colour foundation).

**On a metric card:** the figure in `numeric/lg`, its name in `label/md`, and the context ("▲ 2.4% this week") in `caption/md`.

**Numbers**

| Style | Use it for | sm (≥0px) | md (≥600px) | lg (≥1024px) | xl (≥1440px) | Weight |
|---|---|---|---|---|---|---|
| `type/numeric/lg` | Headline figures in metric cards | 28/36 · L | 28/36 · L | 28/36 · L | 28/36 · L | semibold 600 |
| `type/numeric/md` | Numbers in tables, forms and running text | 16/24 | 16/24 | 16/24 | 16/24 | regular 400 |
| `type/numeric/sm` | Numbers in compact tables | 14/22 | 14/22 | 14/22 | 14/22 | regular 400 |

**Rules**

- **Right-align numbers in columns.** Digits of the same place value then sit under each other.
- **Don't use mono for numbers.** Mono is for code. Tabular numerals align digits without changing the font.
- **Don't animate digits rolling.** Highlight a changed value briefly instead (see the Motion foundation).

---

## Across screen sizes

Type shares its four breakpoints with Layout. 6 styles move with the screen; the other 15 stay put.

| Breakpoint | From | Ratio | Page title | Section | Largest display |
|---|---|---|---|---|---|
| sm | 0px | 1.125 | 28px | 26px | 40px |
| md | 600px | 1.15 | 32px | 28px | 48px |
| lg | 1024px | 1.2 | 40px | 32px | 68px |
| xl | 1440px | 1.2 | 40px | 32px | 68px |

**Fits a phone.** At 320px wide the largest display is 40px, small enough that headings wrap onto more lines instead of running off the screen (check L1: pass). `tokens.css` also lets a very long word break rather than force sideways scrolling.

**Large text changes too.** A style can be normal text on a phone and large text on a desktop. Where that happens:

| Style | sm (≥0px) | md (≥600px) | lg (≥1024px) | xl (≥1440px) |
|---|---|---|---|---|
| `type/heading/sm` | normal | large | large | large |

**The hierarchy holds at every width.** Inside each role the sizes always step up, headings always stay above titles and display above headings (check T7: 64/64 pass).

**Rules**

- **Design at sm and lg at least.** Switch the frame's Responsive mode in Figma and look again; long headings wrap on phones.
- **Never swap styles for mobile.** `heading/lg` already shrinks on a phone. Choosing `heading/sm` "for mobile" makes it shrink twice and break the order.

---

## Choosing and using type

One question gets you to the right style almost every time: *what is this text?* Then let the tag follow the outline.

**Text that names something** — What does it name?

| When | Use |
|---|---|
| The page's one big statement (landing, welcome, empty page) | `type/display/lg` or `type/display/md` or `type/display/sm` |
| The page itself — its title (the h1) | `type/heading/lg` |
| A section of the page | `type/heading/md` |
| A subsection | `type/heading/sm` |
| A dialog or side panel | `type/title/lg` |
| A card or panel | `type/title/md` |
| An item in a dense list, menu or table group | `type/title/sm` |

**Text people read** — Where does it sit?

| When | Use |
|---|---|
| The intro under a page or section title | `type/body/lg` |
| A paragraph or description | `type/body/md` |
| Dense screens, text in table cells, secondary paragraphs | `type/body/sm` |
| Help under a field, a timestamp, a footnote, chart labels | `type/caption/md` |

**Text people act on** — How dense is the screen?

| When | Use |
|---|---|
| Buttons, field labels, tabs, menu items | `type/label/md` |
| The same in comfortable density | `type/label/lg` |
| Badges, chips, compact controls | `type/label/sm` |

**A number** — Will people compare it with others?

| When | Use |
|---|---|
| Yes — a column in a table, a list of totals, a timer | `type/numeric/md` (`type/numeric/sm` in compact tables) |
| The headline figure on a metric card | `type/numeric/lg` |
| No — a number inside a sentence | the sentence's own style (body …) |

**Code** — What is around it?

| When | Use |
|---|---|
| A code block, or inline code in body text | `type/code/md` |
| Inline code in small text; IDs and keys in tables | `type/code/sm` |

**A heading tag** — Where is it in the page outline?

| When | Use |
|---|---|
| Pick h1–h6 by the outline (never skip a level); pick the style by how much it should stand out | any heading tag + any heading or title style |
| A title that is not a heading (a card label, a button) | no heading tag; use the style on a div/span/button |

**What follows what.** Text comes in stacks; these keep a clear step between neighbours:

| Above | Below | Where |
|---|---|---|
| `heading/lg` | `body/lg` | Page title and its intro |
| `heading/md` | `body/md` | A section and its first paragraph |
| `title/md` | `body/sm` or `caption/md` | A card and its description |
| `label/md` | `caption/md` | A field label and its help text |
| `numeric/lg` | `caption/md` | A metric and its context |

**Worked example — a project card.** Styled one question at a time:

| Part | Style | Why |
|---|---|---|
| "Website redesign" | `title/md` | It names the card. |
| "Marketing · 12 tasks" | `caption/md` | Short supporting detail. |
| Description | `body/sm` | A sentence or two people read. |
| "1,248 hours" | `numeric/md` | Compared with other cards. |
| "Open project" | `label/md` | A button people press. |
| "Beta" | `label/sm` | A badge. |

**Do and avoid**

| Do | Avoid | Why it matters |
|---|---|---|
| `body/md` for paragraphs | 16px with the browser's line height | Browsers default to about 1.2; `body/md` is 16/24 (1.50). |
| `caption/md` at 12px for meta text | 11px "fine print" | Nothing in ds is smaller than 12px. |
| h1 → h2 → h3, styled as needed | h1 → h4 because h4 "looks right" | Headings are how screen-reader users move through a page. |
| Let boxes grow with their text | A fixed 40px-high card title | At 200% text size one line of `title/md` needs 48px. |
| `numeric/md` in a column of amounts | Proportional digits | Totals drift left and right and are hard to compare. |

---

## Readers' settings and brands

People change how text looks — bigger text, more spacing, zoom — and products change fonts. The system is built so neither breaks a screen.

**Bigger text (WCAG 1.4.4).** Sizes are rem and line heights have no unit, so when someone sets a larger default text size in the browser, every style grows and keeps its proportions. Zoom must never be blocked: no `user-scalable=no`, no `maximum-scale`. Check T1: 62/62 pass.

**More spacing (WCAG 1.4.12).** Some readers apply their own spacing: line height 1.5×, paragraph spacing 2×, letter-spacing 0.12em and word spacing 0.16em of the font size. Reading styles already meet the line-height part. What breaks under the rest is layout: fixed heights, `white-space: nowrap` with hidden overflow, and text inside fixed-size boxes. Let boxes grow instead.

**Narrow screens (WCAG 1.4.10).** At 320px wide nothing should need sideways scrolling except data tables, which scroll inside their own container. The largest text fits (see [Across screen sizes](#across-screen-sizes)).

**While fonts load.** Load web fonts with `font-display: swap` so text shows straight away in the next font of the stack, and preload the regular and semibold files. Text must never be invisible while fonts download.

**What a font change touches**

| Follows the config | Fixed on purpose |
|---|---|
| The sans and mono families in every style | The scale, line heights and letter-spacing |
| The fallback stacks | The minimum sizes and every check |
|  | Style names — nothing in designs or code is renamed |

**Changing fonts.** Set `typography.sans` (and `typography.mono`) in the engine config, build, read the report, and load the font files in the product. Before choosing a font, check three things the engine can't: it has tabular numerals, its digits and letters are easy to tell apart (1 l I, 0 O), and its average character width — set `typography.charWidth` so the line-length check stays honest (Inter measures 0.48 em).

**Changing the scale.** `typography.baseSize` (even px) and `typography.ratio` per breakpoint are the only other choices. The checks set the limits: the small-screen ratio must keep the largest display at 40px or less (L1), and ratios that are too flat make neighbouring styles collide (T7). The build stops and says which.

**Adding a style.** First check [Choosing and using type](#choosing-and-using-type) — most needs already have a style. If none fits, name the new style by its job, pick a step on the scale, a kind (which sets the line height) and a weight, and add it to the engine config. The build computes the sizes, refuses anything under 12px or identical to an existing style, and checks it with the rest; when it passes, the style is in Figma, CSS, Tailwind, this guide and the AI contract at once.

```json
{
  "typography": {
    "styles": [
      {
        "name": "type.overline.sm",
        "step": -2,
        "kind": "label",
        "weight": "semibold",
        "case": "upper",
        "description": "Short upper-case label above a section title"
      }
    ]
  }
}
```

Steps run from −2 to 9. `kind` is one of `display`, `heading`, `title`, `label`, `reading`; only display and heading kinds may set `"scales": true`; only labels and titles may be upper case; `"tabular": true` turns on tabular numerals.

---

## Accessibility reference

What the build checks for typography, and the result for this build:

| Check | What it checks | WCAG | Result |
|---|---|---|---|
| T1 | In code, sizes are rem, line heights unitless and letter-spacing em — text follows the reader's text size | 1.4.4 (AA) | pass · 62/62 pass |
| T2 | Reading text line height ≥ 1.5 at every breakpoint | 1.4.12 (AA) | pass · 32/32 pass |
| T3 | Smallest text size ≥ 12px | — (our rule) | pass · 84/84 pass |
| T4 | Large / normal text class per breakpoint (sets the contrast each style needs) | 1.4.3 (AA) | info · 27 large, 57 normal |
| T5 | Number styles use tabular numerals, so digits line up in columns | — (our rule) | pass · 3/3 pass |
| T6 | Every style's line height ≥ 1.15, so wrapped lines never touch | — (our rule) | pass · 84/84 pass |
| T7 | Hierarchy holds at every breakpoint: each role steps up, headings stay above titles, display above headings | 1.3.1 (AA) | pass · 64/64 pass |
| T8 | Letter-spacing follows the size: no negative tracking below 24px, never tighter than −0.02em; capitals are spaced out | — (our rule) | pass · 84/84 pass |
| T9 | Running text width gives 45–75 characters a line at body sizes (estimate; the page audit measures real lines) | 1.4.8 (AAA) | pass · 2/2 pass |
| L1 | Reflow at 320px: content width ≥ 272px and largest heading ≤ 40px | 1.4.10 (AA) | pass · 2/2 pass |

What the checkers look for in your own code and pages: the type checker (`npm run lint:type`) reads CSS, HTML and JSX; the type audit (`npm run audit:type`) renders a page and measures sizes, line heights and line lengths, then applies the text-spacing override and 200% text and reports anything that gets cut off. See the [handoff](HANDOFF.md).

**Glossary**

| Term | Meaning |
|---|---|
| Style | A named job such as type/body/md that holds family, size, weight, line height and letter-spacing per breakpoint. |
| Step | A position on the scale; 0 is the base size. |
| Ratio | How much bigger each step is than the one below; it depends on the breakpoint. |
| Reading text | Text read line by line — body, caption, code — which keeps a line height of 1.5 or more. |
| Large text | WCAG's term for text from 24px, or from 18.66px in bold; it may use 3 : 1 contrast instead of 4.5 : 1. |
| Tabular numerals | Digits that all have the same width, so columns line up. |
| Measure | The width of a line of running text. |
| Mode | sm, md, lg or xl. Switching mode changes which sizes every style shows. |
