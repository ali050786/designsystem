# Add a layer — prompt

Use this when something doesn't seem to fit the stacking order: "the banner has to go over the header", "the chat
widget must be on top of everything". Most of the time it fits an existing level and layer, or should be a popover; this
prompt makes the AI check that first, and only then propose a product layer the engine can place.

**Attach:** `elevation.md` (or `elevation.contract.json`).
**Check the result:** paste the proposed JSON into the engine config under `elevation.layers` and run `npm run build`.

```text
I need a place in the stacking order for: {what it is, where it appears, what it must sit above and below}

Use the attached ds elevation rulebook (elevation.md) and follow these steps.

1. Look for an existing answer first, with the Decision guide:
   - is it something that opens over content (a menu, popover, tooltip, chat panel)? Then floating, opened as a
     popover: the top layer is above every z-index and never clipped.
   - must it be answered before the page can be used? Then modal, on a <dialog> with showModal().
   - is it a message that needs no action? Then a toast (layer.toast).
   - does it stay while content scrolls under it? Then sticky.
   If an existing level or layer fits, recommend it, explain why in two sentences, and stop. "It must be on top of
   everything" is not a reason for a new layer: say what it must sit above, and what must stay above it (dialogs,
   toasts, a dragged item).
   If the request breaks a rule (a z-index number, a name by position such as "top" or "z-50", glass, a modal
   without <dialog>), say which rule, give the closest allowed answer, and stop.

2. If nothing fits, propose ONE product layer:
   - Name: layer.<job> — what sits there (banner, help-panel), never where it is (top, high, front, max).
   - "above": the layer it sits just above (sticky, floating, modal, toast, dragging, or another product layer).
     Never a number: the build computes it, between that layer and the next.
   - A one-sentence description of what sits there.
   - Which level its surface, shadow and edge come from (usually sticky or floating).

3. Give the engine config, exactly in this shape and nothing else in the block:

   { "elevation": { "layers": [
     { "name": "layer.<job>", "above": "<layer>", "description": "<what sits there, one sentence>" }
   ] } }

4. Say what to check after the build: the layer's number in the rulebook's stacking table, and that E6 passes.
```

## What a good answer looks like

- "A support chat panel over everything" → floating, opened as a popover; no new layer.
- "z-index: 99999 for the cookie banner" → refused (ER-05); a site-wide banner that stays above sticky bars is
  `layer.banner` with `"above": "sticky"`.
- "layer.top" → refused: named by position.
- No numbers anywhere in the config.
