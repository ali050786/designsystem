# Fit borders to a product — prompt

Use this to choose the control width (and any extra jobs) for a product. The AI sets up the config and runs the engine; every
number in its answer comes from the engine's output, not from memory.

**Attach:** `border.md` (or `border.contract.json`).
**Needs:** a way to run `node src/cli.js` in the engine folder, or you run it and paste the output back.

```text
Product: {what it is, who uses it, how often, on what devices}
What people say about the fields and lines today: {e.g. "older users can't find the text boxes", "the tables feel heavy"}

Use the attached ds border rulebook (border.md).

1. Choose the control width: 1 (the default) or 2. 2 suits products whose people must find fields easily and fill them in
   rarely (public services, insurance claims, forms done once a year); 1 suits dense tools people use every day.
   Structure lines stay 1px either way; states stay one pixel wider than controls. Say why in two sentences.
2. Only if the product has a line the four jobs don't cover, add a job (see the rulebook's rules for names, widths,
   colours, identifies and style).
3. Write the config:
   { "border": { "control": <1|2>, "roles": [ … ] } }
4. Run: node src/cli.js my-config.json out/<name>
   Quote from its output: B1–B6 and F2 results and the widths of line, control, state and indicator. If a check fails,
   say which and change the config — never the numbers.
5. Say what changes for people: which lines get heavier, what stays the same, and that component code doesn't change.

Reply with the config, the engine output you quoted, and the explanation.
```

## What a good answer looks like

- A benefits application for the public → `"control": 2`: fields 2px, errors and selections 3px, dividers still 1px.
- A trading or analytics tool → `"control": 1`, and the advice to remove lines rather than add weight.
- "Can we make every border 0.5px for a lighter look?" → no (BR-03); lighter is a quieter colour, not a thinner line.
