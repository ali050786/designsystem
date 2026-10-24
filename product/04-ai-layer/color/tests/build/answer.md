# Build with colour — test answer

**Request filled into the prompt**

> What to build: a project settings page. A sticky header with the title, a Cancel and a Save changes button. A "General" card with a Project name field (with help text) and a Visibility select. A "Storage" card with a usage bar at 92%, a warning that storage is almost full, and two weekly changes: uploads up 12% (good) and failed jobs up 3 (bad). A "Recent activity" table (who, what, when, status) with one row hovered, one row selected, statuses Done / Failed / In progress, and a row-actions menu open with Rename, Download log and Delete (destructive), the first item hovered. A "Delete this project" card with a destructive button.
> Code style: plain HTML + CSS variables

## Colour plan

| Part | Sits on | Role | Why |
|---|---|---|---|
| Page | — | `bg.canvas`, text `fg.default` | The page itself (set by tokens.css) |
| Sticky header | canvas | `bg.surface-raised` + `border.subtle` + elevation 2 shadow | Stays above scrolling content |
| Title, card titles, labels, table cells | surface / raised | `fg.default` | Main content |
| Card intro, help text, "When" column, table head text, change labels | surface / sunken | `fg.muted` | Supporting details |
| Cards | canvas | `bg.surface` + `border.subtle` | Default home for content; the edge is decorative |
| Cancel | raised | `action.secondary.*` | The alternative action |
| Save changes | raised | `action.primary.*` | The one primary action in the view |
| Inputs and select | surface | `bg.surface`, `fg.default`, `border.input`; placeholder `fg.subtle` | The outline shows where to type (3 : 1) |
| Usage bar track / fill | surface | `bg.surface-sunken` / `bg.warning` | The number is also in text ("46 GB of 50 GB used (92%)") |
| Warning message | surface | `bg.warning-subtle`, icon `fg.warning`, text `fg.default` | Tinted message; words + "!" carry the meaning |
| Uploads ▲ +12% | surface | `fg.positive` + ▲ | Good news; the arrow shows direction |
| Failed jobs ▲ +3 | surface | `fg.negative` + ▲ | Bad news, even though it went up |
| Table head | surface | `bg.surface-sunken`, text `fg.muted` | Set back inside the card |
| Row dividers | surface | `border.subtle` | Only separates rows |
| Hovered row | surface | `bg.surface-hover` (solid) | Status text sits on it; tints only list default/muted/brand text |
| Selected row | surface | `bg.selected` + "✓" + bold | Selected is shown by more than colour |
| Done / Failed / In progress | surface, surface-hover, selected | `fg.success` ✓ / `fg.danger` ✕ / `fg.info` ◔ | Words + symbol carry the status |
| Row-actions button | surface | `action.ghost.*` with `fg.icon` | Icon-only ghost button |
| Menu | page | `bg.surface-overlay` + `border.subtle` + elevation 3 shadow (via elevation tokens) | Opens on top |
| Menu items / hovered / pressed | overlay | `fg.default` on `bg.surface-overlay` / `bg.item-hover` / `bg.item-pressed` | Solid item roles inside overlays (CR-06) |
| Delete menu item | overlay, item-hover | `fg.danger` | Destructive, said in words too |
| Danger card | canvas | `bg.surface` + `border.danger` | Outline marks the area; the heading says why |
| Delete project | surface | `action.danger.*` | Can't be undone |
| "View all activity" | surface | `fg.link` (underlined by tokens.css) | A link |

All pairs checked against the Pair contract, including the hovered and selected rows and the menu's hovered item.

## Code

See [settings.html](settings.html). It loads `tokens.css` and uses only `--ds-color-*` roles and elevation tokens.

## Self-check

- [x] No hex, rgb() or shade variables.
- [x] Every role exists in the rulebook.
- [x] Every text, icon and outline sits on a listed background — including hover, selected and menu states.
- [x] Solid fills use their on- colour (primary and danger buttons use `action.*.fg`).
- [x] Status has words and a symbol; the link is underlined; both changes carry ▲.
- [x] One primary action; focus ring left to tokens.css.
- [x] Hover inside the menu uses `bg.item-hover`.

Not possible within the rules: nothing. Note: the usage bar fill has no dedicated "meter" role; `bg.warning` was used and the value is repeated in text.
