# Typography rules for AI tools — ds

Generated from the engine (21 styles, every one checked at all 4 breakpoints; all checks pass). The same data in machine-readable form: `typography.contract.json`.

## How to use this file
1. Pick a style for every piece of text with the **Decision guide**, using style names exactly as written.
2. Use the style whole — its class, Tailwind utility or Figma text style. Never copy its numbers into your own CSS.
3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.
4. Before answering, run the **Self-check**.

## Hard rules
| ID | Rule | Why | WCAG |
|---|---|---|---|
| TR-01 | Use a text style for every piece of text. Never set font size, line height or letter-spacing by hand. | Styles carry the sizes for every breakpoint and line heights that are checked; a hand-set 15px carries neither. | — |
| TR-02 | Choose the style by what the text is, not by the size you want. | The size of a style changes with the screen; its job doesn't. Pick by job and the sizes follow. | — |
| TR-03 | Nothing smaller than 12px. Paragraphs, help text and code use reading styles (body, caption, code), which keep line height at 1.5 or more. | Small or cramped text is the first thing people with low vision or dyslexia lose. | 1.4.12, 1.4.8 |
| TR-04 | Numbers people compare — table columns, totals, metrics, timers — use tabular numerals: type.numeric.* or tabular-nums. | Proportional digits have different widths, so columns don't line up and values jump while they update. | — |
| TR-05 | Heading tags follow the page outline; styles follow the visual weight. Never skip a level (h2 → h4) to get a size. | Screen-reader users move through a page by heading level. | 1.3.1, 2.4.6 |
| TR-06 | At most one display style per view, and never for an app's page title (use type.heading.lg). | A second display competes with the first and flattens the hierarchy. | — |
| TR-07 | Never give text a fixed height. If you must truncate, the full text stays available (expand, tooltip on hover and focus, or a details view). | People enlarge text to 200% and override line and letter spacing; fixed boxes clip it. | 1.4.4, 1.4.12 |
| TR-08 | Keep running text within layout.measure.reading (about 70 characters a line). | On long lines readers lose their place when jumping to the next line. | 1.4.8 |
| TR-09 | Never block zoom (user-scalable=no, maximum-scale below 2) and never size text in px in code. | Zoom and the browser's text size are how many people read; px text ignores the text-size setting. | 1.4.4 |
| TR-10 | Emphasise with `<strong>` (semibold) or `<em>`. Underline is only for links; colour alone never carries emphasis. | Underlined words look like links; colour-only emphasis is invisible to some readers. | 1.4.1 |
| TR-11 | Capitals only for short labels (three words or fewer), using a style made for them (it adds letter-spacing). Never for sentences. | All-caps text is slower to read and loses word shapes. | — |
| TR-12 | Left-align running text (start-align in right-to-left languages). Never justify it. | Justified text leaves uneven gaps that make lines hard to follow. | 1.4.8 |
| TR-13 | Fonts come only from font.family.sans and font.family.mono. Never set a font-family in a component. | The family tokens carry a tested fallback stack, so text stays readable while fonts load; one place to change a brand font. | — |
| TR-14 | Design once with styles; the breakpoint changes the sizes (Responsive mode in Figma, media queries in code). Never swap to a "mobile" style by name. | The styles already shrink on small screens; swapping names breaks the hierarchy at other widths. | — |

## Decision guide

**Text that names something** — What does it name?

| When | Use |
|---|---|
| The page's one big statement (landing, welcome, empty page) | `type.display.lg` / `type.display.md` / `type.display.sm` |
| The page itself — its title (the h1) | `type.heading.lg` |
| A section of the page | `type.heading.md` |
| A subsection | `type.heading.sm` |
| A dialog or side panel | `type.title.lg` |
| A card or panel | `type.title.md` |
| An item in a dense list, menu or table group | `type.title.sm` |

**Text people read** — Where does it sit?

| When | Use |
|---|---|
| The intro under a page or section title | `type.body.lg` |
| A paragraph or description | `type.body.md` |
| Dense screens, text in table cells, secondary paragraphs | `type.body.sm` |
| Help under a field, a timestamp, a footnote, chart labels | `type.caption.md` |

**Text people act on** — How dense is the screen?

| When | Use |
|---|---|
| Buttons, field labels, tabs, menu items | `type.label.md` |
| The same in comfortable density | `type.label.lg` |
| Badges, chips, compact controls | `type.label.sm` |

**A number** — Will people compare it with others?

| When | Use |
|---|---|
| Yes — a column in a table, a list of totals, a timer | `type.numeric.md` (type.numeric.sm in compact tables) |
| The headline figure on a metric card | `type.numeric.lg` |
| No — a number inside a sentence | the sentence's own style (body …) |

**Code** — What is around it?

| When | Use |
|---|---|
| A code block, or inline code in body text | `type.code.md` |
| Inline code in small text; IDs and keys in tables | `type.code.sm` |

**A heading tag** — Where is it in the page outline?

| When | Use |
|---|---|
| Pick h1–h6 by the outline (never skip a level); pick the style by how much it should stand out | any heading tag + any heading or title style |
| A title that is not a heading (a card label, a button) | no heading tag; use the style on a div/span/button |

## Styles
Size / line height in px at each breakpoint. **L** = large text for contrast (WCAG: 24px+, or 18.66px+ bold), so 3 : 1 would be enough — but every ds colour pair already meets 4.5 : 1. In code use the class (or the Tailwind utility); in Figma the text style of the same name.

### Headings and display
| Style | Class · Tailwind | sm (≥0px) | md (≥600px) | lg (≥1024px) | xl (≥1440px) | Weight | Use |
|---|---|---|---|---|---|---|---|
| `type.display.lg` | `.ds-type-display-lg` · `text-display-lg` | 40/46 L | 48/56 L | 68/80 L | 68/80 L | bold 700 | The one big statement on a landing, welcome or empty page |
| `type.display.md` | `.ds-type-display-md` · `text-display-md` | 36/42 L | 44/52 L | 56/66 L | 56/66 L | bold 700 | Hero heading on a marketing or onboarding page |
| `type.display.sm` | `.ds-type-display-sm` · `text-display-sm` | 32/38 L | 36/42 L | 48/56 L | 48/56 L | bold 700 | A large statement inside a page, such as a welcome banner |
| `type.heading.lg` | `.ds-type-heading-lg` · `text-heading-lg` | 28/36 L | 32/40 L | 40/50 L | 40/50 L | semibold 600 | Page title — the h1 of a screen (default for `<h1>`) |
| `type.heading.md` | `.ds-type-heading-md` · `text-heading-md` | 26/34 L | 28/36 L | 32/40 L | 32/40 L | semibold 600 | Section heading inside a page (default for `<h2>`) |
| `type.heading.sm` | `.ds-type-heading-sm` · `text-heading-sm` | 22/28 | 24/30 L | 28/36 L | 28/36 L | semibold 600 | Subsection heading (default for `<h3>`) |

### Titles and labels
| Style | Class · Tailwind | sm (≥0px) | md (≥600px) | lg (≥1024px) | xl (≥1440px) | Weight | Use |
|---|---|---|---|---|---|---|---|
| `type.title.lg` | `.ds-type-title-lg` · `text-title-lg` | 20/26 | 20/26 | 20/26 | 20/26 | semibold 600 | Dialog and side-panel titles (default for `<h4>`) |
| `type.title.md` | `.ds-type-title-md` · `text-title-md` | 18/24 | 18/24 | 18/24 | 18/24 | semibold 600 | Card and panel titles (default for `<h5>`, `<h6>`) |
| `type.title.sm` | `.ds-type-title-sm` · `text-title-sm` | 16/22 | 16/22 | 16/22 | 16/22 | semibold 600 | Titles in dense lists, menus and table groups |
| `type.label.lg` | `.ds-type-label-lg` · `text-label-lg` | 16/22 | 16/22 | 16/22 | 16/22 | medium 500 | Buttons and controls in comfortable density |
| `type.label.md` | `.ds-type-label-md` · `text-label-md` | 14/20 | 14/20 | 14/20 | 14/20 | medium 500 | Buttons, form labels, tabs, menu items |
| `type.label.sm` | `.ds-type-label-sm` · `text-label-sm` | 12/16 | 12/16 | 12/16 | 12/16 | medium 500 | Compact controls, badges and chips |

### Reading text
| Style | Class · Tailwind | sm (≥0px) | md (≥600px) | lg (≥1024px) | xl (≥1440px) | Weight | Use |
|---|---|---|---|---|---|---|---|
| `type.body.lg` | `.ds-type-body-lg` · `text-body-lg` | 18/28 | 18/28 | 18/28 | 18/28 | regular 400 | Lead paragraph at the top of a page or section · reading text |
| `type.body.md` | `.ds-type-body-md` · `text-body-md` | 16/24 | 16/24 | 16/24 | 16/24 | regular 400 | Default paragraphs and descriptions (default for `<body>`) · reading text |
| `type.body.sm` | `.ds-type-body-sm` · `text-body-sm` | 14/22 | 14/22 | 14/22 | 14/22 | regular 400 | Secondary paragraphs, dense screens, text in table cells · reading text |
| `type.caption.md` | `.ds-type-caption-md` · `text-caption-md` | 12/18 | 12/18 | 12/18 | 12/18 | regular 400 | Help text, timestamps, footnotes, chart labels · reading text |
| `type.code.md` | `.ds-type-code-md` · `text-code-md` + `font-mono` | 14/22 | 14/22 | 14/22 | 14/22 | regular 400 | Code blocks, and inline code in body text · reading text |
| `type.code.sm` | `.ds-type-code-sm` · `text-code-sm` + `font-mono` | 12/18 | 12/18 | 12/18 | 12/18 | regular 400 | Inline code in small text; IDs and keys in tables · reading text |

### Numbers and data
| Style | Class · Tailwind | sm (≥0px) | md (≥600px) | lg (≥1024px) | xl (≥1440px) | Weight | Use |
|---|---|---|---|---|---|---|---|
| `type.numeric.lg` | `.ds-type-numeric-lg` · `text-numeric-lg` + `tabular-nums` | 28/36 L | 28/36 L | 28/36 L | 28/36 L | semibold 600 | Headline figures in metric cards · tabular numerals |
| `type.numeric.md` | `.ds-type-numeric-md` · `text-numeric-md` + `tabular-nums` | 16/24 | 16/24 | 16/24 | 16/24 | regular 400 | Numbers in tables, forms and running text · reading text · tabular numerals |
| `type.numeric.sm` | `.ds-type-numeric-sm` · `text-numeric-sm` + `tabular-nums` | 14/22 | 14/22 | 14/22 | 14/22 | regular 400 | Numbers in compact tables · reading text · tabular numerals |

## What tokens.css already does
- `<body>` → `type.body.md`, `<h1>` → `type.heading.lg`, `<h2>` → `type.heading.md`, `<h3>` → `type.heading.sm`, `<h4>` → `type.title.lg`, `<h5>` → `type.title.md`, `<h6>` → `type.title.md` — as defaults in the `base` layer; any class or utility wins.
- `td`, `th`, `output` and `data` get tabular numerals.
- Buttons, inputs, selects and text areas inherit the page font (browsers otherwise shrink them).
- `code`, `kbd`, `samp`, `pre` use the mono family; `strong` and `b` are semibold.

## Limits the build enforces
| Limit | Value |
|---|---|
| Smallest text | 12px |
| Reading text line height | ≥ 1.5 |
| Any style's line height | ≥ 1.15 |
| Negative letter-spacing | only from 24px, never tighter than −0.02em |
| Running text width | `layout.measure.reading` = 34rem (544px at the default text size, about 70 characters) |
| Fonts | sans = Inter, "Segoe UI", system-ui, -apple-system, sans-serif; mono = "JetBrains Mono", "SFMono-Regular", Consolas, monospace |

## Common mistakes (measured)
| Mistake | Measured | Use instead |
|---|---|---|
| Paragraph left at the browser's line height | 16px text, line height ~1.2 (19.2px) — below 1.5 | `type.body.md` — 16/24px (1.5) |
| 11px meta text | 11px — below the 12px floor | `type.caption.md` — 12/18px |
| Negative tracking on a button label | −0.02em on 14px = −0.28px a letter — letters crowd at small sizes | `type.label.md` — 14px, letter-spacing 0 |
| Card title in a fixed 40px-high box | at 200% text size one line of 18px text needs 48px, so the box cuts it off | `type.title.md` — no fixed height: the box grows with the text |
| Caption style for a paragraph of instructions | 12px over many lines — tiring to read | `type.body.sm` — 14px, or type.body.md for longer text |
| Amounts in a column with proportional digits | 1 is narrower than 0 in most fonts, so totals don't line up | `type.numeric.md` — every digit the same width (or add tabular-nums) |

## Self-check before answering
- [ ] No font-size, line-height or letter-spacing values in the output — only styles (classes, Tailwind `text-<style>` utilities, Figma text styles).
- [ ] Every style name exists in the Styles tables.
- [ ] Paragraphs and help text use body, caption or code styles; nothing under 12px.
- [ ] Compared numbers use tabular numerals.
- [ ] Heading tags follow the outline with no skipped levels; at most one display style.
- [ ] No fixed heights on text; truncated text stays available.
- [ ] No font-family outside the family tokens; no blocked zoom; no justified or all-caps sentences.
