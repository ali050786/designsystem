# Add a border job — prompt

Use this when a design seems to need a line the four jobs don't have. Most of the time the answer is an existing job (or no
line at all); this prompt makes the AI check that first, and only then propose a job the engine can check.

**Attach:** `border.md` (or `border.contract.json`).
**Check the result:** paste the proposed JSON into the engine config under `border.roles` and run `npm run build`.

```text
I need a line for: {what the line is for and where it appears}
Width in the design: {the value in the mock-up, if there is one}

Use the attached ds border rulebook (border.md) and follow these steps.

1. Look for an existing answer first, with the Decision guide:
   - does it need a line at all, or does space or a surface change do it?
   - is it structure (line), a control's edge (control), a state (state) or the current item (indicator)?
     Then that job, whatever width the mock-up shows.
   If an existing answer fits, recommend it, explain why in two sentences, and stop. A mock-up value is not a reason for
   a new job. If the request breaks a rule (a hairline, a name by look, a px or rem width, a state shown by colour alone),
   say which rule, give the closest allowed answer, and stop.

2. If nothing fits, propose ONE job:
   - Name: border.width.<job> — what it is for (drop-zone, placeholder), never how it looks (thick, hairline, strong).
   - A width on the scale: 1, 2 or 3 (px).
   - One colour role: a color.border.* or color.action.*.border role.
   - identifies: true if someone needs the line to find or use something (then its colour must reach 3:1), else false.
   - A style: solid, dashed or dotted. If it shares a width with another job, it must differ in colour, style or sides.

3. Give the engine config, exactly in this shape and nothing else in the block:

   { "border": { "control": <the product's control width>, "roles": [
     { "name": "border.width.<job>", "width": <1|2|3>, "color": "<colour role>", "identifies": <true|false>,
       "style": "<solid|dashed|dotted>", "description": "<what it's for, one sentence>" }
   ] } }

4. Say what to check after the build: that it passes (B1–B3), and the job's row in the rulebook.
```

## What a good answer looks like

- "A 2px border for our featured card" → a selected-looking outline is a state; a featured card is a line (or a surface
  change), no new job.
- "A 0.5px divider like iOS" → refused (BR-03): line with color.border.subtle.
- "A dashed outline where files can be dropped" → `border.width.drop-zone`, 2px, dashed, identifies true, a 3:1 colour.
- No px, nothing named by look, no sub-pixel widths.
