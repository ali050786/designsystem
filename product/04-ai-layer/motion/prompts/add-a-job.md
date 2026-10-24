# Add a job — prompt

Use this when something doesn't seem to fit the motion jobs: "the carousel needs its own slide", "our bottom sheet should
swoosh up", "make the onboarding cards bounce in". Most of the time it fits an existing job or ready transition, or should
not move at all; this prompt makes the AI check that first, and only then propose a product job the engine can compute.

**Attach:** `motion.md` (or `motion.contract.json`).
**Check the result:** paste the proposed JSON into the engine config under `motion.jobs` and run `npm run build`.

```text
I need motion for: {what moves, when, and what people would miss without it}

Use the attached ds motion rulebook (motion.md) and follow these steps.

1. Look for an existing answer first, with the Decision guide:
   - would nobody miss it? Then no motion: it changes at once. Say so and stop.
   - is it a menu, popover, tooltip, toast, drawer or dialog? Then it is floating or modal, and tokens.css already
     opens and closes it. Stop.
   - is it content changing where it is (a panel, a tab, a list item)? Then motion.change.
   - is it a value that changed on its own? motion.highlight. Work in progress? motion.loading (.ds-loading).
   If an existing job fits, recommend it, show the CSS in two lines, and stop.
   If the request breaks a rule (a duration or curve picked by hand, a bounce or spring, a loop, a slide across the
   screen, scale or rotate, parallax), say which rule, give the closest allowed answer, and stop.

2. If nothing fits, propose ONE product job:
   - Name: motion.<job> — what moves (carousel, sheet), never how it looks or how fast (fast, bounce, smooth, 300ms).
   - "kind": "in-place" (it changes where it is) or "in-out" (it arrives and leaves).
   - "distance": a step on the spacing scale, no further than space.8 (32px) — how far it moves while it arrives or
     changes. Never a duration or a curve: the build computes them from the distance.
   - A one-sentence description of what moves and when.

3. Give the engine config, exactly in this shape and nothing else in the block:

   { "motion": { "jobs": [
     { "name": "motion.<job>", "kind": "<in-place|in-out>", "distance": "space.<n>", "description": "<what moves, one sentence>" }
   ] } }

4. Say what to check after the build: the job's computed duration and reduced values in the rulebook's Jobs table, and
   that M1–M4 pass.
```

## What a good answer looks like

- "Make the onboarding cards bounce in one by one" → no motion (nobody misses it; a bounce overshoots, a stagger makes
  people wait); at most motion.change once, together.
- "A bottom sheet that slides up from off the screen" → modal (dialog.ds-modal), no new job; the slide breaks MR-03.
- "A carousel slide" → a product job: `motion.carousel`, `in-place`, `space.6` — the build gives 250ms, 0px reduced.
- No durations or curves anywhere in the config.
