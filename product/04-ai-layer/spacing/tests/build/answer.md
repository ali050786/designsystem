# Build test — reference answer

**Prompt:** [build-with-space.md](../../prompts/build-with-space.md), with `spacing.md`, `typography.md` and `color.md` attached.

**Request (HTML + CSS):** "A team members page for a workspace admin: a page title with an Invite button, a filter toolbar
(search, role, status), a table of members with an actions button per row, seat usage, and an invite form (email, role,
message, send and cancel). Show the empty-search note." → [members.html](members.html)

**Request (React + Tailwind):** "An invite dialog: title, description, close button, an email field with help text, a role
choice, send and cancel." → [InviteDialog.jsx](InviteDialog.jsx)

Author-run: the assistant that wrote the rulebook followed the prompt. The answer is judged by the tools, not by its author.

## Spacing plan (members.html)

| Between (or inside) | Direction | How closely they belong | Token | Why |
|---|---|---|---|---|
| Page edges | inset / layout | — | `layout.margin` (sides), `space.inset.2xl` (top, bottom) | Page edges follow the breakpoint, not density |
| Page head → toolbar → content | stack | Sections of the page | `space.stack.xl` | New groups on one page |
| Title → subtitle | stack | Parts of one thing | `space.stack.xs` | |
| Title block ↔ Invite button | inline | A title and its action | `space.inline.md` | |
| Label → input; input → help | stack | Parts of one field | `space.stack.xs` | |
| Toolbar fields and the chip group | inline (wraps: stack) | Groups in a toolbar | `space.inline.xl`, lines `space.stack.md` | Groups, not items |
| Chip ↔ chip | inline (wraps: stack) | Items of one group | `space.inline.sm`, lines `space.stack.sm` | |
| Members heading → table | stack | A heading and its content | `space.stack.md` | |
| Table cells | inset | A cell in a dense table | `space.inset.sm` / sides `space.inset.md` | The table region is `data-density="compact"` |
| Name → email in a cell | stack | Parts of one thing | `space.stack.xs` | |
| Table → empty-search note | stack | A heading and its content | `space.stack.md` | |
| Main column ↔ side column; card ↔ card | inline / stack | Groups on a page | `space.inline.xl`, `space.stack.xl` | |
| Card padding | inset | A card | `space.inset.lg` | |
| Card title → content | stack | A heading and its content | `space.stack.md` | |
| Field → field | stack | Fields in a form | `space.stack.lg` | |
| Fields → buttons | stack | A new group | `space.stack.lg` + `space.stack.sm` | |
| Button ↔ button | inline | Items of one group | `space.inline.sm` | |
| Buttons, inputs, selects, chips | — | Controls | `size.control.height` (min-height), sides `space.inset.md`, `space.inset.xs` above and below | Heights are minimums |
| Row action buttons | — | Icon-only buttons | `size.control.height` as min-width and min-height | Square, still a minimum |
| Note padding | inset | A short message | `space.inset.md` | |

Groups in the markup: the filters are a `form role="search"`, the status chips a `fieldset` with a `legend`, the side
column an `aside` with two `section`s, each form field a label/input/help unit with `aria-describedby`.

## Self-check

- [x] No px, rem or em in padding, margin or gap — tokens only. (Two inline styles use `margin-top` with stack tokens.)
- [x] Every token exists; no primitives.
- [x] Padding uses inset, vertical gaps stack, horizontal gaps inline.
- [x] Inside a group is smaller than around it; the markup groups it too.
- [x] Density from `data-density` (the table region); no `.compact` classes.
- [x] Every target ≥ 24px; controls use `min-height`.
- [x] No spacer elements, `<br>` runs or `&nbsp;`.
- Fixed while building: the table first got `inset.md` all round; a dense table reads better with `inset.sm` above and below
  and its own compact region, so it stays compact while the rest of the page follows the product's density.

## Results

| Check | Result |
|---|---|
| Spacing checker (`lint:space`), both files | 0 errors, 0 warnings ([output](checker-output.txt)) |
| Type and colour checkers, both files | 0 errors, 0 warnings |
| Spacing audit (`audit:space`) | 14 targets, smallest 32px in every density; fits 320px in all three densities; nothing ignores density; nothing cut off at 200% text in compact ([output](audit-output.txt), [screenshots](shots/)) |
| Type audit | smallest text 12px; nothing cut off with the spacing override or at 200%; fits 320px |
| Colour audit | 41/41 text pairs in Light and Dark |

`tokens.css` next to the page is the build the test ran against.
