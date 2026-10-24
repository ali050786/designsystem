# Build with type — test answer

**Request filled into the prompt**

> What to build: a billing page. A sticky header with the workspace name. Page title "Billing" with a one-line intro. A "Current plan" card: plan name, renewal date, price per month, a "Change plan" button. "Usage this month": three metric cards (seats, storage, API calls), each with a change since last month. An "Invoices" table (date, invoice number, amount, status) with one overdue invoice and one credit. A "Payment method" form: name on card, card number with help text, expiry with an error. A "Cancel plan" section with an explanation and a destructive button. Three questions and answers at the end.
> Code style: plain HTML + CSS (with a React + Tailwind version of the usage cards)

## Type plan

| Text | What it is | Style | Tag | Why |
|---|---|---|---|---|
| Workspace name in the header | Names the app, not part of the outline | `type.title.md` | span | A component title; the page title is the h1 |
| "Billing" | The page's title | `type.heading.lg` | h1 | tokens.css default for h1 |
| Intro under the title | Lead text | `type.body.lg` | p | Intro under a page title |
| Section names (Current plan, Usage, Invoices …) | Sections of the page | `type.heading.md` | h2 | tokens.css default for h2 |
| "Team plan", "Cancel the Team plan" | Names a card | `type.title.md` | h3 | A component title inside a section — tag from the outline, style from the job |
| Renewal date | Secondary paragraph | `type.body.sm` | p | Supporting detail in a card |
| "€480.00" | Headline figure | `type.numeric.lg` | span | The figure people look for; tabular |
| "per month, 24 seats" | Short supporting detail | `type.caption.md` | span | One line |
| Metric names | Labels | `type.label.md` | span | Name a value |
| Metric values | Headline figures | `type.numeric.lg` | span | Compared across cards |
| Changes ("▲ 3 since last month") | Short context | `type.caption.md` | span | One line, with an arrow; colour by good/bad |
| Table header | Column labels | `type.label.sm` | th | Labels in a dense table |
| Table cells | Text in cells | `type.body.sm` | td | Dense text; tabular numerals come from tokens.css for td |
| Invoice numbers | IDs | `type.code.sm` | code | IDs and keys in tables |
| Amounts | Compared numbers | `type.body.sm` (tabular from tokens.css), right-aligned | td | Numbers in a column; real minus sign for the credit |
| Field labels | Labels | `type.label.md` | label | Visible labels |
| Field values | Text people type | `type.body.md`; card number and expiry `type.numeric.md` | input | Digits that people compare and check |
| Help and error | Help under a field | `type.caption.md` | span | One line each, linked with aria-describedby |
| Buttons | Text people act on | `type.label.md` | button | Default density |
| Cancel explanation | A paragraph | `type.body.md` | p | Reading text, within the reading width |
| Questions | Name each answer | `type.title.lg` | h3 | Under the "Questions" h2 — see "Found while testing" |
| Answers | Paragraphs | `type.body.md` (body default) | p | Reading text, within the reading width |

## Code

[billing.html](billing.html) — loads `tokens.css`; every piece of text uses a style class or the tokens.css defaults.
[UsageCards.jsx](UsageCards.jsx) — the usage cards in React + Tailwind (`text-label-md`, `text-numeric-lg tabular-nums`, `text-caption-md`, `text-code-sm font-mono`).

## Self-check

- [x] No font-size, line-height, letter-spacing or font-family values — styles only.
- [x] Every style exists in the rulebook.
- [x] Paragraphs and help use body and caption styles; nothing under 12px.
- [x] Compared numbers use tabular numerals; the amount column is right-aligned; the credit uses −.
- [x] Heading tags go h1 → h2 → h3; no display style.
- [x] No fixed heights on text; nothing truncated.
- [x] No font families, no blocked zoom, no justified or all-caps text.

Not possible within the rules: nothing.

## Judged by the tools

| Tool | Result |
|---|---|
| Type checker (`lint:type`) | 0 errors, 0 warnings (both files) |
| Colour checker (`lint:color`) | 0 errors, 0 warnings (both files) |
| Type audit (`audit:type`) | smallest text 12px · lowest reading line height 1.5 · fits 320px · tabular figures present in Inter and JetBrains Mono · nothing cut off with the text-spacing override or at 200% text ([output](audit-output.txt), screenshots in `shots/`) |
| Page audit (`audit:page`) | text 59/59 in Light and Dark (lowest 6.2 : 1) · input outlines 3/3 · focus rings 6/6 |

## Found while testing

The first draft left the three questions as plain `<h3>`, so tokens.css gave them `heading/sm` — 28px at desktop, nearly the
size of the 32px "Questions" heading above them. No tool flags it: the tag is right, the style exists, nothing is too small.
It is a judgement the rulebook's TR-05 ("tag by outline, style by weight") covers, and the fix was `type.title.lg`.
This is the kind of problem the review prompt asks a person or an AI to look for.
