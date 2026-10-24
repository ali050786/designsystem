# Add a pane — prompt

Use this when a design seems to need another sidebar, panel or column the system doesn't have. Most of the time the answer
is an existing pane, width or an overlay; this prompt makes the AI check that first, and only then propose a pane in a form
the engine can add up and check.

**Attach:** `layout.md` (or `layout.contract.json`).
**Check the result:** paste the proposed JSON into the engine config under `layout.panes` and run `npm run build`.
The engine adds every pane up at every breakpoint, refuses unsafe panes and runs every layout check — the AI's arithmetic is
never trusted on its own.

```text
I need a pane for: {what it shows and what people do with it}
It appears on: {screens}
Width in the design: {the width in the mock-up, if there is one}

Use the attached ds layout rulebook (layout.md) and follow these steps.

1. Look for an existing answer first, with the Decision guide's "Where something goes":
   - navigation between sections → layout.pane.nav; supporting content (details, filters, help, a preview)
     → layout.pane.aside; a short task on top of the page → an overlay, not a pane;
   - a width inside the main region (a list beside a preview) → split the region with .ds-region, not a pane.
   If an existing pane does the job, recommend it, explain why in two sentences, and stop. A mock-up width is
   not a reason for a new pane. If the request breaks a rule (a pane on phones, a pane named by its side or
   size, a width in rem or %), say which rule, give the closest allowed answer, and stop.

2. If nothing fits, propose ONE new pane:
   - Name: layout.pane.<job> — what it is for (inspector, outline), never where or how big (right, wide).
   - "width": px, a multiple of 8, 160–480.
   - "from": md, lg or xl — where it goes beside the content. "side": start (a drawer below that) or end
     (below the main content below that).
   - Add it up yourself at the narrowest width of its breakpoint and every wider one, with every pane that is
     inline there: window − panes − 2 × layout.margin must be at least layout.measure.reading, and the main
     region's own grid must keep columns of at least 40px. If it doesn't fit, say what to change (a later
     breakpoint, a narrower pane, a narrower aside) before giving the config.

3. Say what you expect the build to show (the main region and its grid at each breakpoint) — but mark these as
   expectations to be checked against the build.

4. Give the engine config, exactly in this shape and nothing else in the block:

   { "layout": { "panes": [
     { "name": "layout.pane.<job>", "width": <px>, "from": "<md|lg|xl>", "side": "<start|end>", "description": "<what it's for, one sentence>" }
   ] } }

   (If you also change a built-in width, add "aside": <px> or "nav": <px> next to "panes".)

5. Say what to check after the build: that it passes (L3 in particular), and the new pane's row in the rulebook.
```

## What a good answer looks like

- For "a 280px filters panel beside the table" it recommends `layout.pane.aside` — filters are supporting content.
- For "a right sidebar, 400px" it refuses the name (sides swap in right-to-left languages) and asks for the job.
- For "an inspector beside a canvas, 320px from lg" it adds it up, finds the main region would keep too little, and
  proposes a fit (later breakpoint, narrower widths) before giving config that builds and passes.
- No rem, %, or "min/max" widths — one px width per pane.
