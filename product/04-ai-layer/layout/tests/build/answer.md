# Build with layout — test answer (HTML + CSS)

**Prompt:** [Build with layout](../../prompts/build-with-layout.md) · **Attached:** `layout.md`, `spacing.md`, `typography.md`, `color.md`
**What to build:** "A members page for a workspace: the list of members with their role and last activity, a way to invite
someone, and filters for the list. People manage a team of up to a few hundred."
**Code style:** plain HTML + CSS. **Result:** [members.html](members.html)

## The frame

| Part | Job | Region | Width (token or class) | On a phone |
|---|---|---|---|---|
| Product name, menu button, Invite | Global: where am I, the main action | header | `layout.header.height` (min-height), one row | the menu button opens the navigation drawer |
| Projects, Members, Storage, Settings | Moving between the product's sections | nav | `layout.pane.nav` | a drawer (from the menu button) |
| Title and intro | Says what the page is for | main | `.ds-page`; intro `.ds-measure` | full width, intro within the reading width |
| Summary cards | Three counts of one kind | main | `.ds-tiles` (`layout.tile.min`) | one card per row |
| Member list | Data people compare across | main | the region's full width; scrolls inside a focusable, named container | scrolls inside its container |
| Invite form | A form: one column of fields | main | `.ds-measure` | full width |
| Filters | Supports the task: narrows the list | aside | `layout.pane.aside` | below the main content |

**Checks on the plan.** The task (the list) is the main region. Filters are supporting content, so the aside — inline from
`xl`, under the content before that; they don't push the list down on a phone. Invite is a section of the page, not an
overlay, because it has a single field. Regions in code order: header, nav, main, aside. No breakpoints of its own: the shell,
the tiles and the reading width adapt by themselves. The only media queries move padding at 64em and 90em (system
breakpoints).

## Self-check (from the rulebook)

- [x] Page edges use `layout.margin` (`.ds-page`); no container has a fixed width.
- [x] Running text and the form stay within `layout.measure.reading`.
- [x] Every media query is a system breakpoint, min-width, in em; none inside regions.
- [x] No grids of its own; the tiles come from `.ds-tiles`. Flex and grid children that hold text have `min-width: 0`.
- [x] Regions use `data-shell` in DOM order; nothing reordered.
- [x] The header uses `layout.header.height` as min-height; scroll padding untouched.
- [x] Nothing scrolls sideways at 320px; the table scrolls inside `.table-wrap` (`tabindex="0"`, `role="region"`, named by its caption); no `100vw`, no hidden overflow.
- [x] No layout variables redefined.

**Fixed after the audit:** the Invite link-button was 50px tall — an `<a>` keeps `box-sizing: content-box`, so the 40px
minimum height plus padding and border grew to 50px and the header to 59px, 3px past its scroll padding. Added
`box-sizing: border-box` to `.btn`. (The audit's check for a sticky bar taller than its scroll padding was added because of
this case — see the tests README.)
