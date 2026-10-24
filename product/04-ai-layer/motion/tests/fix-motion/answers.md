# Fix the motion — answer

The request: *"Everything still moves with reduced motion, the dialog zooms in, and the spinner never stops."* Answered
by following [the prompt](../../prompts/fix-the-motion.md) with only the rulebook in hand, on [before.html](before.html);
the result is [after.html](after.html).

## The table

| Part | Today | Job it really is | With reduced motion |
|---|---|---|---|
| `html` | `scroll-behavior: smooth` | none for reduced motion | instant jumps (`no-preference` only) |
| `.intro` | slides 60px from the left on load, 800ms | **none: delete** — the heading is there when the page opens | — |
| `#sent` | digits roll from 0 to 1,234 on load | **none: delete** — a number is read, not watched | — |
| `.btn` | `transition: all 300ms ease-in-out` (and the focus ring with it) | feedback: `background-color`, `border-color`, `color` | 100ms colour |
| `.btn-primary:hover` | lifts 2px | feedback: the fill only | — |
| `.menu:popover-open` | `drop-in`: scale 0.95 → 1, 200ms | floating — tokens.css already animates `.ds-floating` popovers | fades, 100ms |
| `dialog.ds-modal[open]`, `::backdrop` | `zoom-in` 350ms with an overshooting curve; the scrim fades over 500ms | modal — tokens.css | fades, 100ms |
| `.toast:popover-open` | flies in from the right edge (120%) | floating, toast — tokens.css | fades, 100ms |
| `.panel .body` | `max-height` 0 → 12rem over 400ms | change: the size at once, the content arrives by the change distance | fades, 100ms |
| `.spinner` | a hand-made spinner, 0.8s a turn, never hidden again | loading: `.ds-loading`, hidden when the report is ready | pulses |
| `.skeleton` | a shimmer that loops 1.2s forever | **none** — a still placeholder | — |
| "Report ready." | appears | highlight, once | the same fade |

## What changed

- **Deleted:** the intro slide, the rolling digits, the shimmer, the hover lift, every keyframes animation on the menu, the
  dialog, its scrim and the toast.
- **Onto jobs:** buttons and menu items → `motion.feedback` (named properties); the panel → `motion.change` (`hidden` +
  an `arrive` keyframes that moves by `--ds-motion-change-distance`); the spinner → `.ds-loading`; the ready message →
  `.ds-highlight`.
- **Reduced path:** smooth scrolling only inside `@media (prefers-reduced-motion: no-preference)`; everything else goes
  through the tokens, which reduced motion zeroes.

## Self-check

- [x] Each thing that moves needs to; its job says what it does.
- [x] Every duration and curve is a `var(--ds-motion-<job>-…)`; no ms, no `ease-in-out`, no `cubic-bezier()`, no `transition: all`.
- [x] Movement only by a job's distance, one axis; no scale, rotate, off-screen slides or animated `max-height`.
- [x] The menu and the toast are `.ds-floating` popovers and the dialog `dialog.ds-modal` with `showModal()`, with no motion of their own.
- [x] Nothing moves with reduced motion; nothing flashes; the only loop is `.ds-loading`, and it stops when the work ends.
- [x] Focus rings, text and scrolling never move.
- [x] No motion variables redefined; no `data-motion`.

## Judged by the tools

| | Checker (`lint:motion`) | Audit (`audit:motion`, full and reduced at 1280 and 320px, `--open "#more" "#open-delete" "#open-delete then #confirm" "#run" "#panel-toggle"`) |
|---|---|---|
| Before | 32 errors ([output](before-checker.txt)) | 53 problems ([output](before-audit.txt)): 7 things that move with reduced motion (the intro 60px, the hover lift 2px, the menu's scale, the dialog's zoom, the toast's 180px flight), 3 over 32px, 3 that grow or turn, 2 loops, 9 focus rings animating in, smooth scrolling with reduced motion, and 28 durations or curves that belong to no job |
| After | 0 ([output](after-checker.txt)) | no problems ([output](after-audit.txt)) |

The seven other checkers report 0 on `after.html`. **Result: pass.** One part needed judgement the tools don't give: the
rolling digits (a `requestAnimationFrame` loop writing text) — neither tool sees it; the rulebook does ("never roll digits").
