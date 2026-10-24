# Add a job — answers

Each request was answered by following [the prompt](../../prompts/add-a-job.md) with only the rulebook in hand. Every
config was then built by the engine (`node src/cli.js <case>.config.json out/test`); its output is next to it.

| Request | Answer | Engine |
|---|---|---|
| "Make the onboarding cards bounce in one by one" | **No motion.** Nobody would miss it: the cards are there when the page opens. A bounce overshoots (more movement for no meaning) and a stagger makes people wait. If the cards change while the page is open, `motion.change`, all together. | `bounce.config.json` refused: `name the job by what moves ("carousel", "sheet"), not by how it looks or how fast` |
| "A bottom sheet that slides up from off the screen" | **No new job.** A sheet that must be answered is `elevation.modal`: `<dialog class="ds-modal">` with `showModal()` rises 16px and fades with the scrim. A slide from off the screen breaks MR-03 (nothing travels more than 32px). | `sheet-offscreen.config.json` (space.24, 96px) refused: `96px is too far: nothing travels more than 32px (space.8)` |
| "Our snackbar needs 500ms to feel smooth" | **Refused (MR-01):** durations are computed, never chosen. A snackbar is a toast: `.ds-floating data-layer="toast"`, 150ms in, 100ms out. | `duration.config.json` refused: `"duration" is not allowed: durations and curves are computed from the kind and the distance` |
| "A pulsing dot while a call is recorded" | **Refused (MR-06):** the only loop is the loading indicator. A recording state is a status: a still red dot with the word "Recording" (and the time). | `loop.config.json` refused: `add "kind": "in-place" … or "in-out" … Loops and highlights are the built-in loading and highlight jobs` |
| "A carousel slide" | **A product job:** slides change in place and move a little as they change; nothing in the six fits a 24px step. | `carousel.config.json` builds: `motion.carousel` 250ms, 24px; reduced 100ms, 0px; M1–M6 pass |
| "A carousel slide, and the handle of a non-modal bottom panel" | Two product jobs: the carousel in place, the handle arrives and leaves (a panel that doesn't block the page; the panel itself is floating). | `two-jobs.config.json` builds: carousel 250ms; sheet-handle 300ms in, 200ms out, 32px; reduced 100ms, 0px; M1–M6 pass |

**Result: pass.** Every refusal names the rule, and the jobs that built have the durations the rule gives for their
distance (`--ds-motion-carousel-duration: var(--ds-motion-duration-250)`, `--ds-motion-sheet-handle-duration:
var(--ds-motion-duration-300)` in tokens.css, both 100ms with no distance in reduced motion).
