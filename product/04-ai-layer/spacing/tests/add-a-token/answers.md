# Add a spacing token — test answers

**Prompt:** [add-a-space-token.md](../../prompts/add-a-space-token.md), with `spacing.md` attached. Author-run; every config was
built by the engine and the outputs are saved next to this file. The engine's numbers are the result; the answer's
expectations are only checked against them.

| Request | Answer | Engine |
|---|---|---|
| "Space between the sections of a long landing page — `stack.2xl` isn't enough" | New token `space.stack.3xl`, base `"12"`: expected 56 / 48 / 40px (one step each way) | **Pass** — 56 / 48 / 40px, S3 and S4 pass ([config](landing-sections.config.json), [build](landing-sections.build.txt)) |
| "Our cards need 18px padding to match the mock-up" | No new token: 18px isn't on the scale (SR-01) and matching a mock-up isn't a job. Use `space.inset.lg` (16px). | Refused, as expected, when tried with a px value ([config](card-18px.config.json), [build](card-18px.build.txt)) |
| "A gutter between table columns" | No new token: space for one component belongs with the component. Cells already take `space.inset.md` at their sides; for a visible gap between groups of columns, `space.inline.lg`. | Refused: not a family ([config](table-gutter.config.json), [build](table-gutter.build.txt)) |
| "Padding for hero bands, bigger than `inset.2xl`", in a product that already has `stack.3xl` | First try `space.inset.3xl` with base `"16"` (64px) | **Fails S4**: 3xl would mean 64px as inset but 48px as stack — one size word, two distances ([build](hero-band-first-try.build.txt)) |
| (same, fixed) | `space.inset.3xl`, base `"12"` — the same distance as `stack.3xl` | **Pass** — 56 / 48 / 40px, matching `stack.3xl` in every density ([config](hero-band.config.json), [build](hero-band.build.txt)) |

## What this tested

- The two refusals come from the engine, not from the AI's judgement: a px value and a component family can't be built.
- The ladder rule (a size word is the same distance in every family) is what the first hero-band try broke. The fix was the
  smallest change: the same base as the size that already exists.
- No px in any answer; every value quoted above is copied from the build output.
