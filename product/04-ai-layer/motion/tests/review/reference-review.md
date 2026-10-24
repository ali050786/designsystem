# Review motion — reference review

Written by following [the prompt](../../prompts/review-motion.md) with the rulebook, the page, and the checker and audit
output. Judged against the [answer key](answer-key.md): **16 of 16, no false alarms.**

## Tool findings, confirmed

| Where | Rule | What goes wrong for whom | Fix |
|---|---|---|---|
| `:root` line 9 | MR-10 | A redefined job: every menu now takes 400ms, and the build's checks never saw it | Delete the line. If menus feel slow or fast, the job is computed from its distance; a different motion is a product job (`motion.jobs`) |
| `html` line 10 | MR-09 | Every in-page jump glides the whole page, also for people who asked for less motion | `@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }` |
| `.btn` line 16 | MR-01, MR-02 | `all` animates the focus ring: for 250ms the ring is thinner and closer than it should be; the duration and curve belong to no job, so reduced motion can't shorten them | `transition: background-color var(--ds-motion-feedback-duration) var(--ds-motion-feedback-easing), border-color …, color …;` |
| `.badge` line 20 | MR-06, MR-08 | A loop that runs forever pulls the eye from everything else on the page | Delete the animation; the number says "3 new". When it changes, `.ds-highlight` once |
| `.card` lines 23–27 | MR-04, MR-01, judgement | Cards slide in 24px one after another on every visit, in reduced motion too; nobody misses it, and the stagger makes the last card wait 160ms | Delete the animation and the delays |
| `.card:hover` lines 25, 28 | MR-01, MR-03 | A spring that overshoots, a lift and a scale: movement for a hover. It is hidden today only because the load animation's fill holds the transform — delete the load animation and it appears | `.card:hover { background: var(--ds-color-bg-surface-hover); }` with the feedback transition on `background-color` |
| `.live` + line 87 | MR-07, WCAG 2.3.1 | The panel's fill flips every 125ms: four flashes a second over a large area — a seizure risk. The real news is the queue number changing every 2 seconds | Delete the toggle; on each change: `q.classList.remove('ds-highlight'); requestAnimationFrame(() => q.classList.add('ds-highlight'))`, and give the panel `role="status"` if the count matters to screen readers (or announce only big changes) |
| `.spinner` lines 31–32 | MR-06, MR-04, MR-01 | Turns 1.4 times a second, also in reduced motion; `display: inline-block` overrides `hidden`, so it turns from page load; after "Saved" nothing stops it | `<svg class="ds-loading" aria-hidden="true" hidden>`; remove the spinner CSS (or add `.spinner[hidden] { display: none; }`); hide it when the save ends: `saving.hidden = true` |
| `.menu` lines 33–34 | MR-05, MR-03, MR-01 | Motion of its own on a popover. tokens.css wins the cascade today, so it never runs — delete it before a specificity change makes it run | Delete `transform` and `transition` from `.menu` and `.menu:popover-open` |
| `dialog` lines 35–36 | MR-05, MR-03, MR-04 | Flies 800px up the screen in 400ms, in reduced motion too — the motion reduced mode exists for | Delete the animation and keyframes; `class="ds-modal"` — it rises 16px while the scrim fades, and only fades in reduced motion |
| `.field input:focus-visible` line 39 | MR-02 | The ring's offset grows in: for 200ms the ring sits on the field's edge | Delete the line |
| `.field input[aria-invalid]` lines 40–41 | MR-08, MR-04 | A 12px shake, in reduced motion too, tells a screen reader nothing and is gone before some people look | Delete the animation; keep the border (Border foundation: the state width) and add a message: `<p id="email-error">Enter an email address, like name@company.com.</p>` with `aria-describedby="email-error"`; keep `aria-invalid` until it is fixed (not 400ms) |
| line 89 | MR-09 | The hero text moves against the scroll: the strongest trigger of motion sickness on the web | Delete the scroll handler |
| line 82 | MR-05 | Focus waits for the slide to end; with reduced motion the animation may not run and focus never moves | Delete the `animationend` handler: `showModal()` moves focus at once (put `autofocus` on the email field if it should get it) |

## What tools can't see

| Where | Rule | What goes wrong for whom | Fix |
|---|---|---|---|
| `<dialog>` line 74 | judgement, ER-06 | Not `.ds-modal`: no modal surface, no scrim token, no ready transition; and no label, so a screen reader announces only "dialog" | `<dialog class="ds-modal" aria-labelledby="invite-title">` with `id="invite-title"` on its heading |
| line 45 | judgement ("Keep one clear signal") | With reduced motion the toast never appears: people who asked for less motion never learn the invite was sent | Delete the block — the toast already only fades in reduced motion |

## What is right

- Durations of the card animation already come from a job (`motion.change`) — only the movement and the stagger are wrong.
- The menu is a `.ds-floating` popover and the toast `.ds-floating data-layer="toast" popover="manual" role="status"`:
  tokens.css opens and closes both.
- `showModal()` opens the dialog; the queue is in the page as text, not only as colour.
