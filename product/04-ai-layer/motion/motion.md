# Motion rules for AI tools — ds

Generated from the engine (29 tokens; 6 jobs; all checks pass). The same data in machine-readable form: `motion.contract.json`.

## How to use this file
1. Decide with the **Decision guide** whether it needs motion at all, then which job — by what is changing, not by how lively you want it.
2. Take the whole job: its duration, curve and distance together — or the ready transition tokens.css already has (menus, popovers, toasts, dialogs, the drawer).
3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.
4. Before answering, run the **Self-check**.

## Hard rules
| ID | Rule | Why | WCAG |
|---|---|---|---|
| MR-01 | Durations and curves come from a job: transition-duration and animation-duration are var(--ds-motion-`<job>`-duration) (or -exit-duration), timing functions var(--ds-motion-`<job>`-easing) (or -exit-easing). No ms or s numbers, no ease, ease-in-out or cubic-bezier() written by hand, no Tailwind duration-300 or ease-in-out (Tailwind: ease-`<job>` and duration-(--ds-motion-`<job>`-duration)). | A number belongs to no job: reduced motion can't shorten it, and nobody can tell what it is for. | 2.3.3 |
| MR-02 | Name what transitions: never transition: all (Tailwind transition-all) — list the properties. Never transition outline or outline-offset, and never animate a focus indicator: focus rings appear at once. | all animates whatever happens to change — layout, the focus ring, colours in forced colours — and a ring that fades in is missing for its first frames. | 2.4.7 |
| MR-03 | Move only by a job's distance, on one axis: translate by var(--ds-motion-`<job>`-distance) (or calc(-1 * …)). No px, %, vw or vh distances, no scale, rotate or skew, no animated top, left, margin, width or height. | Reduced motion sets every distance to 0: movement written any other way keeps moving for people who asked it to stop. Nothing travels more than 32px. | 2.3.3 |
| MR-04 | Every animation has a reduced path: keyframes that move (transform, translate, rotate, scale, position) run only inside @media (prefers-reduced-motion: no-preference) or move by the job distances; a reduced block never keeps movement. Tailwind: motion-safe: in front of anything that moves. | The reduced mode can only switch off what goes through its tokens. | 2.3.3 |
| MR-05 | Opening and closing use the ready transitions: menus, popovers and tooltips are .ds-floating popovers, toasts .ds-floating data-layer="toast", dialogs <dialog class="ds-modal"> opened with showModal(). Don't add transitions or animations of your own to them, and don't animate them with JavaScript. | tokens.css already opens and closes them with the right job, keeps them shown and in the top layer while they leave, and only fades them in reduced motion. | 2.3.3 |
| MR-06 | One loop: the loading indicator (.ds-loading), shown only while work runs. Any other infinite animation (animation-iteration-count: infinite, Tailwind animate-*) needs a visible pause or stop control, or must end within 5 seconds. Work that can take longer than 5 seconds shows progress in words or a bar, not only a spinner. | Motion that runs on beside content pulls the eye away from it, and for some people makes reading impossible. | 2.2.2 |
| MR-07 | Nothing flashes: no animation that switches visibility or swings brightness (opacity, colour, background, filter) in a cycle shorter than 334ms, no blinking text, no `<marquee>` or `<blink>`. | More than three flashes in a second can trigger seizures. | 2.3.1 |
| MR-08 | Highlights fade once: a value or row that changed on its own takes .ds-highlight (a tint fading over motion.highlight), at most once per highlight. Never shake, bounce or pulse something to get attention, and never roll digits. | A repeated highlight becomes a flash; a shaking field moves for people who asked it not to and tells a screen reader nothing. | 2.3.1 |
| MR-09 | Nothing moves with scrolling or on its own: no parallax, no scroll-linked movement (animation-timeline: scroll() or view() that moves things, scroll handlers that translate), scroll-behavior: smooth only inside @media (prefers-reduced-motion: no-preference), no autoplaying video or carousel without pause controls. | Movement tied to scrolling is the strongest trigger of motion sickness on the web; autoplay moves beside the content people are reading. | 2.3.3, 2.2.2 |
| MR-10 | Never redefine motion variables in app code (--ds-motion-*). Set data-motion only from the reader's own setting — never data-motion="full" by default. Add a product job in the engine config (motion.jobs) and build. | An overridden job skips the checks for reduced motion, flashes and jumps; a page that forces full motion overrides what the reader asked their system for. | — |

## Decision guide

**Does it need motion at all** — What would people miss without it?

| When | Use |
|---|---|
| Nothing — it would only look livelier | no motion: it changes at once |
| That the thing they touched heard them | `motion.feedback` — colour, fill or border, in 100ms; never movement |
| Where content went or came from (a panel opening, an item removed) | `motion.change` |
| That something opened over the page, and from where | `motion.floating` or `motion.modal` — ready in tokens.css |
| That something changed on its own while they looked elsewhere | `motion.highlight` — once |
| That work is still going | `motion.loading` (`.ds-loading`) — and progress in words or a bar once it runs past 5 seconds |

**Which job** — What is changing?

| When | Use |
|---|---|
| A hover, a press, a toggle, a checkbox, a selected row | `motion.feedback` |
| A panel expanding or collapsing, a tab panel, an item added to or removed from a list, a value replaced | `motion.change` |
| A menu, popover, tooltip, date picker, toast or the navigation drawer | `motion.floating` — `.ds-floating` as a `popover` (`data-layer="toast"` for a toast); the drawer is the shell's |
| A dialog or a sheet | `motion.modal` — `dialog.ds-modal` opened with `showModal()` |
| A live value that updated, a row that just arrived, a field that saved | `motion.highlight` — `.ds-highlight` |
| Waiting for work to finish | `motion.loading` — `.ds-loading` on the indicator |
| A new page or view | no movement: a crossfade at `motion.change` timing, or nothing |
| Something the system has no job for (a carousel slide, a bottom sheet handle) | a product job in the config (`motion.jobs`: a kind and a distance) — the duration is computed |

**Which way** — Where does it come from?

| When | Use |
|---|---|
| A menu or popover from its button | `.ds-floating` does it: it drops in from above, toward where it opens |
| A toast from the edge it sits on | `data-layer="toast"`: it comes up from the bottom |
| The navigation drawer | the shell does it: in from the start side, flipped right to left |
| A dialog | `dialog.ds-modal` does it: it rises into place while the scrim fades in |
| Content changing in place | the way it grows (down as a panel opens) by `motion.change.distance` — or not at all |
| Anything | one axis, the job's distance; never from off the screen, never scale, rotate or skew |

**What never moves** — Is it something people are reading or steering by?

| When | Use |
|---|---|
| The focus ring | it appears at once (tokens.css draws it; never in a transition list) |
| Text being read | never moves on its own: no auto-advancing carousels, no rolling digits, no marquees |
| The page while it scrolls | nothing moves with the scroll: no parallax, no scroll-linked movement |
| A field with an error | a message and the state border (Border foundation) — never a shake |
| Something that must get attention | its position and a highlight once — never a pulse or bounce that repeats |

## Jobs
Full motion, then reduced. Durations are computed from the distance (duration = 100ms + 37.5ms × √(distance in px), rounded down to 50ms; leaving takes two thirds of arriving (rounded down to 50ms, never under 100ms)).

| Job | Duration (full · reduced) | Curve (full · reduced) | Distance (full · reduced) | Leaving (full · reduced) | Use |
|---|---|---|---|---|---|
| `motion.feedback` | 100 · 100ms | standard · linear | — | — | The thing you touched answers: hover, press, a toggle or checkbox, a selected row — colour, fill and border, never movement |
| `motion.change` | 200 · 100ms | standard · linear | 8 · 0px (`space.2`) | — | Content changing where it is: a panel expanding or collapsing, a tab panel, an item added to or removed from a list, a value replaced |
| `motion.floating` | 150 · 100ms | enter · linear | 4 · 0px (`space.1`) | 100 · 100ms, exit · linear | What opens over the page without blocking it: menus, popovers, tooltips, date pickers, toasts, the navigation drawer (elevation.floating) |
| `motion.modal` | 250 · 100ms | enter · linear | 16 · 0px (`space.4`) | 150 · 100ms, exit · linear | What blocks the page until it is answered: dialogs and sheets, with the scrim fading in behind (elevation.modal) |
| `motion.highlight` | 1000 · 1000ms | exit · exit | — | — | Drawing the eye to something that changed on its own: a live value that updated, a row that just arrived, a saved field — a tint that fades, once |
| `motion.loading` | 1000 · 2000ms | linear · standard | — | — | Work in progress: the loading indicator turns while it runs (in reduced motion it pulses slowly instead) and stops when the work is done |

In CSS: `var(--ds-motion-<job>-duration)`, `-easing`, `-distance`, `-exit-duration`, `-exit-easing`. In Tailwind: `ease-<job>`, `ease-<job>-exit`, `duration-(--ds-motion-<job>-duration)`; plain `transition-colors` already uses the feedback job.

**Feedback, written out:** `transition: background-color var(--ds-motion-feedback-duration) var(--ds-motion-feedback-easing), border-color var(--ds-motion-feedback-duration) var(--ds-motion-feedback-easing), color var(--ds-motion-feedback-duration) var(--ds-motion-feedback-easing);`

## Curves
| Curve | Value | Speed at the start · end · fastest (× average) | Use |
|---|---|---|---|
| `motion.easing.enter` | `cubic-bezier(0.2, 0.5, 0.4, 1)` | 2.5 · 0 · 2.5 | Something arriving: a menu, a dialog, a toast, the drawer |
| `motion.easing.exit` | `cubic-bezier(0.6, 0, 0.8, 0.5)` | 0 · 2.5 · 2.5 | Something leaving: the entry played backwards |
| `motion.easing.standard` | `cubic-bezier(0.3, 0, 0.3, 1)` | 0 · 0 · 2.18 | Something changing where it is: a hover, a panel opening, a tab, a highlight fading |
| `motion.easing.linear` | `cubic-bezier(0, 0, 1, 1)` | 1 · 1 · 1 | Loops only: the loading turn |

No curve goes faster than 2.5× its average speed, so no frame jumps. Leaving is arriving played backwards.

## Reduced motion
Fade only: no job moves (every distance is 0), transitions fade in 100ms or less, the loading indicator stops turning and pulses every 2000ms, highlights fade as before (a fade is not movement).

- tokens.css switches to the reduced values when the reader's system asks for less motion (prefers-reduced-motion: reduce)
- data-motion="reduced" (or "full") on `<html>` is the reader's own setting in the product; on any container it previews a mode
- Figma: a frame set to the Motion collection's reduced mode

## Ready transitions (tokens.css)
| What | Markup | Job | Comes from |
|---|---|---|---|
| Menus, popovers, tooltips, date pickers | `<div class="ds-floating" popover id="menu">…</div> + <button popovertarget="menu">` | `motion.floating` | above, toward where it opens |
| Toasts | `<div class="ds-floating" data-layer="toast" popover="manual" role="status">…</div>` | `motion.floating` | the bottom edge |
| Dialogs and sheets | `<dialog class="ds-modal" aria-labelledby="…">…</dialog> opened with showModal()` | `motion.modal` | below: it rises into place while the scrim fades in |
| The navigation drawer | `<nav data-shell="nav" data-open> in .ds-shell (below the breakpoint where it goes inline)` | `motion.floating` | its own side (the start side; flipped right to left) |

Don't add transitions of your own to these (MR-05). Browsers that can't animate an opening popover or dialog simply open and close it at once.

## Loading and highlights
- `.ds-loading`: one turn every 1000ms. Shows only while work runs and stops when it ends; after 5 seconds, show progress in words or a bar. In reduced motion it pulses to 0.65 opacity — the lowest that keeps color.fg.icon ≥ 3:1 on every surface.
- `.ds-highlight`: a `color.bg.brand-subtle` tint fading over 1000ms. Once per change, at most once per 1000ms; text on the tint stays ≥ 4.5:1 (M5). To run it again, remove the class and add it back on the next frame.

## Classes
| Class | What it does | Notes |
|---|---|---|
| `.ds-floating[popover]` | Menus, popovers, tooltips: drop in from above with motion.floating, leave with its exit (data-layer="toast": up from the bottom) | popover (top layer); nothing to add — tokens.css animates [popover].ds-floating |
| `.ds-modal` | A `<dialog>` opened with showModal(): rises in with motion.modal while the scrim fades, leaves with its exit | `<dialog>` + showModal(); nothing to add |
| `.ds-loading` | The loading indicator: one turn per motion.loading cycle while work runs; in reduced motion a slow pulse | ds-loading (Tailwind's animate-spin is removed) |
| `.ds-highlight` | A tint (color.bg.brand-subtle) that fades over motion.highlight, once, when something changed on its own | ds-highlight |

## Limits the build enforces
| Limit | Value |
|---|---|
| Reduced | no movement; transitions ≤ 100ms; the loading indicator pulses (M1) |
| Flashes | highlights ≥ 334ms; no loop faster than 3 changes a second (M2) |
| Duration | computed from distance; ≤ 32px and ≤ 300ms; leaving shorter than arriving; a loop turns at most once a second (M3) |
| Curves | ≤ 2.5× the average speed; arriving lands at rest, leaving starts from rest (M4) |
| Readable | the loading pulse keeps ≥ 3:1; text on the highlight tint ≥ 4.5:1 (M5) |
| Ready transitions | popovers, toasts, dialogs and the drawer animate both ways with tokens; focus rings never animate (M6) |

## Common mistakes (measured)
| Mistake | Measured | Use instead |
|---|---|---|
| transition: all 0.3s ease on a button | it animates every property that changes — the focus ring and the layout too — for 300ms, 3× the feedback job, and still 300ms in reduced motion | `motion.feedback` — transition: background-color, border-color and color at var(--ds-motion-feedback-duration) (100ms), var(--ds-motion-feedback-easing) |
| A curve that starts at full speed (cubic-bezier(0, 0, 0, 1)) | its first frame covers 47% of a 4px menu move and 36% of a 16px dialog move (5.8px), then it crawls: a jump, not an arrival — its starting speed has no limit | `motion.easing.enter` — cubic-bezier(0.2, 0.5, 0.4, 1): never above 2.5× the average speed; the dialog's first frame is 2.6px of 16px |
| A dialog sliding in from off the screen (translate: 0 100vh) | on an 800px-tall window it travels 800px in 300ms (2667px a second), 25× the 32px limit — and reduced motion can't stop it unless it is written twice | `dialog.ds-modal` — rises 16px in 250ms; in reduced motion it only fades (100ms) |
| A spinner at animation: spin 0.6s linear infinite | 1.7 turns a second, and it keeps turning in reduced motion | `.ds-loading` — one turn in 1000ms; in reduced motion a pulse every 2000ms that never drops below 3:1 |
| A skeleton that pulses every 300ms | 3.3 cycles a second — over the three flashes a second of WCAG 2.3.1 for any area large and contrasty enough to count | `.ds-loading` — the indicator turns once a second; a skeleton stays still, or pulses at most at the reduced pace (2000ms) |
| Shaking a field to show an error | it moves back and forth in reduced motion, tells a screen reader nothing, and is gone before some people look | an error message and the state border — the message names the problem (aria-describedby), the border widens to its state (Border foundation); .ds-highlight once if the field is out of view |
| scroll-behavior: smooth on `<html>` | every in-page link and every focus jump glides the whole page — for people with reduced motion too | `@media (prefers-reduced-motion: no-preference)` — put the smooth scrolling inside it, or leave it out |

## Self-check before answering
- [ ] Each thing that moves needs to (people would miss something without it), and its job says what it does: feedback, change, floating, modal, highlight or loading.
- [ ] Every duration and curve is a `var(--ds-motion-<job>-…)`; no ms numbers, no `ease-in-out`, no `cubic-bezier()` by hand; no `transition: all`.
- [ ] Movement is only ever a job's distance, on one axis — no scale, rotate, off-screen slides or animated layout.
- [ ] Menus, popovers and toasts are `.ds-floating` popovers and dialogs `dialog.ds-modal` with `showModal()`, with no motion of their own.
- [ ] With reduced motion nothing moves (every animation of your own has a reduced path or uses the tokens); nothing flashes; the only loop is `.ds-loading`, and long waits show progress.
- [ ] Focus rings, text being read and the page while scrolling never move; errors are messages, not shakes.
- [ ] No motion variables redefined; `data-motion` only from the reader's setting.
