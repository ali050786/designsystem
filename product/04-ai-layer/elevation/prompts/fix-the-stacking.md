# Fix the stacking — prompt

Use this on existing code where things end up under other things: a menu cut off by its card, a dropdown under the
sticky header, a toast behind a dialog's scrim, z-index values in the thousands. The AI replaces the numbers with
levels, layers and the browser's top layer, and changes nothing else.

**Attach:** `elevation.md`, the code, and — if you have it — the output of `npm run lint:elevation -- <files>` and
`npm run audit:elevation -- <page.html> --open "#button"`.
**Check the result:** run the checker and the audit on the code before and after; every elevation finding should be gone
and nothing new should appear.

```text
The attached code has stacking problems: {what goes wrong, e.g. "the account menu opens under the header",
"the delete dialog's toast is hidden"}. Fix them using the attached ds elevation rulebook (elevation.md) as the only
standard. Change only what elevation needs; keep the markup, content and behaviour otherwise as they are.

1. Make a table of every part that sets z-index, position: sticky|fixed|absolute, overflow, box-shadow, a backdrop,
   or opens over the page. Columns: Part | Today (the CSS that does it) | Level it really is | How it should open.

2. Fix them, in this order:
   - Menus, popovers, tooltips and comboboxes that open over content: the popover attribute with a popovertarget
     button (or showPopover()), and .ds-floating. Remove the z-index and the absolute positioning that fought the
     parent's overflow.
   - Dialogs: <dialog class="ds-modal"> opened with showModal(); remove hand-made overlays, their z-index and any
     focus-trap code the browser now does; keep returning focus to the opener.
   - Toasts: .ds-floating data-layer="toast" popover="manual", shown after any open dialog.
   - Sticky bars and anything else that still needs a z-index: var(--ds-layer-<job>). Only -1 … 2 stay, and only for
     order inside one component.
   - Every shadow that remains is its level's (the class, or var(--ds-elevation-<job>-shadow) with its surface and
     edge).

3. Give the changed code, then a short list: what moved to the top layer, what got a layer token, which numbers were
   removed. Then run the rulebook's self-check and report each item.
```

## What a good answer looks like

- No `z-index` number above 2 is left; nothing has `z-index` "just in case".
- The menus are popovers (so the card's `overflow: hidden` stays and no longer cuts them); the dialog is a `<dialog>`
  with `showModal()`; the toast is shown after the dialog.
- The checker and the audit find nothing for elevation afterwards, and the page still does what it did.
