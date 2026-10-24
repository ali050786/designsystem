# Motion

*ds foundations · motion · the written guide. Generated from the engine — 29 tokens, 6 jobs; every motion check passing. Do not edit by hand; change the engine config and build again.*

This guide explains how ds moves things on screen: when something needs motion at all, the six jobs motion is chosen by, how long each takes (computed from how far it moves), the curves, what reduced motion does, how menus, dialogs, toasts and the drawer open and close, the loading indicator and highlights, and what never moves. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after [Choosing motion](#choosing-motion); developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (`motion.md`, `motion.contract.json`).

**Contents**

- [Five principles](#five-principles)
- [How tokens are built](#how-tokens-are-built)
- [Motion by job](#motion-by-job)
- [Duration follows distance](#duration-follows-distance)
- [Curves](#curves)
- [Reduced motion](#reduced-motion)
- [Opening and closing](#opening-and-closing)
- [Loading and highlights](#loading-and-highlights)
- [What never moves](#what-never-moves)
- [Choosing motion](#choosing-motion)
- [Readers' settings and products](#readers-settings-and-products)

---

## Five principles

Five principles shape every job. Each one is checked by the build or the motion audit, not left to taste.

| Principle | What it means in practice |
|---|---|
| **Motion explains a change** | It shows where something came from or went, or that something heard you. If nobody would miss it, nothing moves — the change happens at once. |
| **Picked by job, not by speed** | Six jobs named by what changes — feedback, change, floating, modal, highlight, loading. "Fast" or "300ms" tells nobody whether a menu should use it; "floating" does, and the job carries its duration, curve and distance together. |
| **Time follows distance** | A job's duration is computed from how far it moves: 100ms + 37.5ms × √px, rounded down to 50ms. Leaving takes two thirds of arriving (M3: 7/7 pass). |
| **Reduced means still** | With reduced motion nothing moves: every distance is 0, transitions fade in 100ms or less, the loading indicator pulses instead of turning (M1: 12/12 pass). |
| **Nothing flashes, nothing runs on** | No change faster than three a second (M2: 4/4 pass); the only loop is the loading indicator, shown while work runs; anything else that keeps moving has a pause. |

---

## How tokens are built

Motion tokens live in one collection with two modes, and point into Primitives for every value.

| Collection | Modes | Motion tokens in it | Changes with |
|---|---|---|---|
| **Motion** | full, reduced | Per job: a duration (`motion/<job>/duration`), a curve (`motion/<job>/easing`), a distance where it moves (`motion/<job>/distance`), and for what opens and closes the leaving duration and curve (`exit-duration`, `exit-easing`) | The reader's motion setting (`prefers-reduced-motion`, `data-motion`), and the product's own jobs (`motion.jobs`) |
| **Primitives** | one | The durations the jobs use (`motion/duration/100`, `motion/duration/150`, `motion/duration/200`, `motion/duration/250`, `motion/duration/1000`, `motion/duration/2000`) and the four curves (`motion/easing/enter`, `motion/easing/exit`, `motion/easing/standard`, `motion/easing/linear`) | nothing: computed |
| **Primitives** (Spacing foundation) | one | What the distances link to: `space/0`, `space/1`, `space/2`, `space/4` | the spacing scale |

**Reading a name.** `motion / floating / exit-duration` — category `motion`, job `floating`, part `exit-duration`. Jobs are named by what changes; the floating and modal jobs share their names with the elevation levels they open and close.

**One name, three places.**

| Figma | CSS variable | Tailwind |
|---|---|---|
| `motion/floating/duration` | `--ds-motion-floating-duration` | `duration-(--ds-motion-floating-duration)` |
| `motion/floating/easing` | `--ds-motion-floating-easing` | `ease-floating` |

**In Figma.** Durations are numbers in ms, distances numbers in px (links to the spacing scale), curves are text (`cubic-bezier(…)`), so a token table can show them live. Figma can't bind a prototype transition to a variable, so each transition in the file carries the build's numbers, and every example comes in a full and a reduced frame — the reduced frame is set to the reduced mode, so its distances are 0.

---

## Motion by job

Six jobs. Pick by what is changing; the duration, curve and distance come with the job.

| Job | Use it for | Duration (full · reduced) | Distance | Comes and goes | Linked to |
|---|---|---|---|---|---|
| `motion/feedback` | The thing you touched answers: hover, press, a toggle or checkbox, a selected row — colour, fill and border, never movement | 100 · 100ms | — | in place | — |
| `motion/change` | Content changing where it is: a panel expanding or collapsing, a tab panel, an item added to or removed from a list, a value replaced | 200 · 100ms | 8px (reduced 0) | in place | — |
| `motion/floating` | What opens over the page without blocking it: menus, popovers, tooltips, date pickers, toasts, the navigation drawer | 150 · 100ms | 4px (reduced 0) | leaves in 100ms | `elevation/floating` |
| `motion/modal` | What blocks the page until it is answered: dialogs and sheets, with the scrim fading in behind | 250 · 100ms | 16px (reduced 0) | leaves in 150ms | `elevation/modal` |
| `motion/highlight` | Drawing the eye to something that changed on its own: a live value that updated, a row that just arrived, a saved field — a tint that fades, once | 1000 · 1000ms | — | once | — |
| `motion/loading` | Work in progress: the loading indicator turns while it runs (in reduced motion it pulses slowly instead) and stops when the work is done | 1000 · 2000ms | — | runs while work runs | — |

The floating and modal jobs are in [Opening and closing](#opening-and-closing), highlight and loading in [Loading and highlights](#loading-and-highlights). The two everyday jobs:

**Feedback** — the thing you touched answers. Colour, fill and border only; never movement, so it is the same in reduced motion.

| Token | Full · reduced | CSS |
|---|---|---|
| `motion/feedback/duration` | 100 · 100ms | `--ds-motion-feedback-duration` |
| `motion/feedback/easing` | `motion/easing/standard` · `motion/easing/linear` | `--ds-motion-feedback-easing` |

`transition: background-color var(--ds-motion-feedback-duration) var(--ds-motion-feedback-easing), border-color var(--ds-motion-feedback-duration) var(--ds-motion-feedback-easing), color var(--ds-motion-feedback-duration) var(--ds-motion-feedback-easing);`

**Change** — content changing where it is: a panel opening, a tab panel, an item added or removed, a value replaced. It moves 8px the way it grows, or only fades.

| Token | Full · reduced | Links to / CSS |
|---|---|---|
| `motion/change/duration` | 200 · 100ms | `--ds-motion-change-duration` |
| `motion/change/easing` | `motion/easing/standard` · `motion/easing/linear` | `--ds-motion-change-easing` |
| `motion/change/distance` | 8 · 0px | `space/2` · `space/0` |

**Rules**

- **No motion for its own sake.** A page that changes at once is fine. Motion is for a change people would otherwise miss or misread.
- **Never by speed.** Don't reach for the "fastest" or "smoothest" duration: take the job. If no job fits, add one in the config ([Readers' settings and products](#readers-settings-and-products)).
- **Name the properties.** `transition: all` animates the focus ring and the layout too (MR-02). List what changes: `background-color`, `border-color`, `color`, `opacity`, `translate`.

---

## Duration follows distance

Durations are not picked; they are computed from how far a job moves:

**duration = 100ms + 37.5ms × √(distance in px), rounded down to 50ms**

| Distance | Computed | Duration | Jobs |
|---|---|---|---|
| 0px | 100ms | 100ms | `motion/feedback` |
| 4px | 175ms | 150ms | `motion/floating` |
| 8px | 206ms | 200ms | `motion/change` |
| 16px | 250ms | 250ms | `motion/modal` |
| 24px | 284ms | 250ms | — |
| 32px | 312ms | 300ms | — |

**Why these numbers.** 100ms is the time within which an answer feels instant, so something that doesn't move (feedback) takes exactly that. Anything that moves needs a little longer, growing with the square root of the distance — as for anything that speeds up and slows down — so twice as far takes about 40% longer, not twice as long. Nothing travels more than 32px, so nothing takes more than 300ms: a bigger change fades instead of sliding.

**Leaving takes two thirds.** People watch something arrive; they have already moved on when it leaves. The leaving duration is two thirds of the arriving one, rounded down to 50ms, never under 100ms: floating 150 → 100ms, modal 250 → 150ms.

**The durations in use** (Primitives, computed from the jobs — never used directly):

| Primitive | Used by |
|---|---|
| `motion/duration/100` | `motion/feedback/duration` (full, reduced)<br>`motion/change/duration` (reduced)<br>`motion/floating/duration` (reduced)<br>`motion/floating/exit-duration` (full, reduced)<br>`motion/modal/duration` (reduced)<br>`motion/modal/exit-duration` (reduced) |
| `motion/duration/150` | `motion/floating/duration` (full)<br>`motion/modal/exit-duration` (full) |
| `motion/duration/200` | `motion/change/duration` (full) |
| `motion/duration/250` | `motion/modal/duration` (full) |
| `motion/duration/1000` | `motion/highlight/duration` (full, reduced)<br>`motion/loading/duration` (full) |
| `motion/duration/2000` | `motion/loading/duration` (reduced) |

*The highlight (1000ms) and the loading turn (1000ms) don't move, so they follow their own rules: a highlight takes three flash intervals, a turn takes a second ([Loading and highlights](#loading-and-highlights)).*

**Rules**

- **Exits are shorter.** A menu that leaves slower than it came holds up the next thing people do (M3).
- **No delays to stagger.** Items arriving one after another (a list "cascading" in) add up: ten items × 50ms is half a second of waiting. Bring a group in together, with `motion/change`.

---

## Curves

Four curves, each defined by how fast it moves at its start and its end, as a multiple of its average speed. None goes faster than 2.5×, so no single frame jumps (M4: 10/10 pass).

| Curve | Value | Start · end · fastest | Use |
|---|---|---|---|
| `motion/easing/enter` | `cubic-bezier(0.2, 0.5, 0.4, 1)` | 2.5× · 0× · 2.5× | Something arriving: a menu, a dialog, a toast, the drawer |
| `motion/easing/exit` | `cubic-bezier(0.6, 0, 0.8, 0.5)` | 0× · 2.5× · 2.5× | Something leaving: the entry played backwards |
| `motion/easing/standard` | `cubic-bezier(0.3, 0, 0.3, 1)` | 0× · 0× · 2.18× | Something changing where it is: a hover, a panel opening, a tab, a highlight fading |
| `motion/easing/linear` | `cubic-bezier(0, 0, 1, 1)` | 1× · 1× · 1× | Loops only: the loading turn |

**Arriving lands at rest; leaving starts from rest.** The enter curve starts at the speed limit and settles; the exit curve is the enter curve played backwards. Things that change in place start and land at rest. Linear is only for the loading turn — anywhere else it looks mechanical.

**Frame by frame.** What a screen at 60 frames a second draws for each job that moves:

| Job | Frames | Largest step | First step |
|---|---|---|---|
| `motion/change` arriving | 12 | 1.4px of 8px | 0.2px |
| `motion/floating` arriving | 9 | 1.1px of 4px | 1.1px |
| `motion/floating` leaving | 6 | 1.6px of 4px | 0.1px |
| `motion/modal` arriving | 15 | 2.6px of 16px | 2.6px |
| `motion/modal` leaving | 9 | 4.3px of 16px | 0.1px |

**The common slip.** A curve that starts at full speed (cubic-bezier(0, 0, 0, 1)): its first frame covers 47% of a 4px menu move and 36% of a 16px dialog move (5.8px), then it crawls: a jump, not an arrival — its starting speed has no limit. Instead: `motion/easing/enter` — cubic-bezier(0.2, 0.5, 0.4, 1): never above 2.5× the average speed; the dialog's first frame is 2.6px of 16px.

**Rules**

- **No springs or bounces.** A curve that overshoots moves past where things belong and back — more movement for no meaning, and not something reduced motion can turn into a fade.
- **Curves come from the job.** Never `ease`, `ease-in-out` or a `cubic-bezier()` of your own (MR-01); Tailwind's `ease-in`, `ease-out` and `ease-in-out` are removed from the theme.

---

## Reduced motion

Reduced motion is a mode, not an afterthought: every job has a reduced value, and ds's ready transitions switch by themselves. Reduced means **fade only** — no job moves, transitions fade in 100ms or less, the loading indicator stops turning, and highlights fade as before (a fade is not movement).

| Job | Full | Reduced |
|---|---|---|
| `motion/feedback` | 100ms | 100ms |
| `motion/change` | 200ms, moves 8px | 100ms, fades in place |
| `motion/floating` | 150ms, moves 4px, leaves in 100ms | 100ms, fades in place, leaves in 100ms |
| `motion/modal` | 250ms, moves 16px, leaves in 150ms | 100ms, fades in place, leaves in 100ms |
| `motion/highlight` | 1000ms | 1000ms |
| `motion/loading` | 1000ms, turns | 2000ms, pulses (never below 3:1) |

**How it is switched.**

- tokens.css switches to the reduced values when the reader's system asks for less motion (prefers-reduced-motion: reduce)
- data-motion="reduced" (or "full") on `<html>` is the reader's own setting in the product; on any container it previews a mode
- Figma: a frame set to the Motion collection's reduced mode

A product that offers its own setting writes it to `<html>` and remembers it; with nothing set, the system setting decides:

```html
<label>Motion
  <select id="motion">
    <option value="">Same as my device</option>
    <option value="reduced">Reduced</option>
    <option value="full">Full</option>
  </select>
</label>
<script>
  const s = document.getElementById('motion');
  s.value = localStorage.getItem('motion') ?? '';
  const apply = () => { s.value ? document.documentElement.dataset.motion = s.value : delete document.documentElement.dataset.motion; localStorage.setItem('motion', s.value); };
  s.addEventListener('change', apply); apply();
</script>
```

**Rules**

- **Keep one clear signal.** In reduced motion a change still shows: it fades. Removing the change altogether hides it.
- **Your own animations too.** Anything you animate outside the tokens needs its own reduced path — or it keeps moving for the people who asked it to stop (MR-03, MR-04).
- **Never force full motion.** `data-motion="full"` comes only from the reader's own choice, never as a default (MR-10).

---

## Opening and closing

What opens over the page moves with the job of its elevation level: `motion/floating` for menus, popovers, tooltips, toasts and the drawer, `motion/modal` for dialogs. tokens.css already does it — open them the way the Elevation foundation says and they animate, both ways, and only fade in reduced motion.

| Token | Full · reduced | Links to / CSS |
|---|---|---|
| `motion/floating/duration` | 150 · 100ms | `--ds-motion-floating-duration` |
| `motion/floating/easing` | `motion/easing/enter` · `motion/easing/linear` | `--ds-motion-floating-easing` |
| `motion/floating/distance` | 4 · 0px | `space/1` · `space/0` |
| `motion/floating/exit-duration` | 100 · 100ms | `--ds-motion-floating-exit-duration` |
| `motion/floating/exit-easing` | `motion/easing/exit` · `motion/easing/linear` | `--ds-motion-floating-exit-easing` |
| `motion/modal/duration` | 250 · 100ms | `--ds-motion-modal-duration` |
| `motion/modal/easing` | `motion/easing/enter` · `motion/easing/linear` | `--ds-motion-modal-easing` |
| `motion/modal/distance` | 16 · 0px | `space/4` · `space/0` |
| `motion/modal/exit-duration` | 150 · 100ms | `--ds-motion-modal-exit-duration` |
| `motion/modal/exit-easing` | `motion/easing/exit` · `motion/easing/linear` | `--ds-motion-modal-exit-easing` |

| What | Markup | Comes from |
|---|---|---|
| Menus, popovers, tooltips, date pickers | `<div class="ds-floating" popover id="menu">…</div> + <button popovertarget="menu">` | above, toward where it opens |
| Toasts | `<div class="ds-floating" data-layer="toast" popover="manual" role="status">…</div>` | the bottom edge |
| Dialogs and sheets | `<dialog class="ds-modal" aria-labelledby="…">…</dialog> opened with showModal()` | below: it rises into place while the scrim fades in |
| The navigation drawer | `<nav data-shell="nav" data-open> in .ds-shell (below the breakpoint where it goes inline)` | its own side (the start side; flipped right to left) |

**How it works.** A popover or dialog starts from its "before" look (`@starting-style`: transparent, the job's distance away) and moves to its resting place with the job's duration and curve. When it closes, it goes back the other way with the leaving duration and curve, and `display` and `overlay` transition with `allow-discrete` so it stays shown — and in the top layer — until it has faded. The scrim fades with its dialog. Browsers that can't do this simply open and close at once.

**The common slip.** A dialog sliding in from off the screen (translate: 0 100vh): on an 800px-tall window it travels 800px in 300ms (2667px a second), 25× the 32px limit — and reduced motion can't stop it unless it is written twice. With `dialog.ds-modal`: rises 16px in 250ms; in reduced motion it only fades (100ms).

**Rules**

- **Nothing of your own on top.** Don't add transitions or animations to `.ds-floating` popovers or `dialog.ds-modal`, and don't animate them with JavaScript (MR-05).
- **Focus moves at once.** Moving focus into a dialog or menu happens when it opens, not when its animation ends — the animation is only how it looks.
- **Leaving never blocks.** A closing menu doesn't hold up the next click: it leaves in 100ms and is out of the way of the pointer from the start.

---

## Loading and highlights

Two jobs that aren't about something arriving: the loading indicator, which runs while work runs, and the highlight, which draws the eye to a change once.

| Token | Full · reduced | CSS |
|---|---|---|
| `motion/loading/duration` | 1000 · 2000ms | `--ds-motion-loading-duration` |
| `motion/loading/easing` | `motion/easing/linear` · `motion/easing/standard` | `--ds-motion-loading-easing` |
| `motion/highlight/duration` | 1000 · 1000ms | `--ds-motion-highlight-duration` |
| `motion/highlight/easing` | `motion/easing/exit` · `motion/easing/exit` | `--ds-motion-highlight-easing` |

**Loading** (`.ds-loading`): one turn every 1000ms. Shows only while work runs and stops when it ends; after 5 seconds, show progress in words or a bar. In reduced motion it pulses to 0.65 opacity — the lowest that keeps color.fg.icon ≥ 3:1 on every surface (M5: 5/5 pass).

```html
<p role="status"><svg class="ds-loading" aria-hidden="true" …></svg> Saving…</p>
```

**Highlight** (`.ds-highlight`): a `color/bg/brand-subtle` tint that fades over 1000ms, back to the element's own background. Once per change, at most once per 1000ms; text on the tint stays ≥ 4.5:1 (M5). To run it again, remove the class and add it back on the next frame:

```js
el.classList.remove('ds-highlight');
requestAnimationFrame(() => el.classList.add('ds-highlight'));
```

**Flashes.** More than three flashes in a second can trigger seizures (WCAG 2.3.1). A highlight is one change over 1000ms; the reduced loading pulse is one every 2000ms; nothing in ds changes brightness faster than once every 334ms.

**The common slips.** A spinner at animation: spin 0.6s linear infinite: 1.7 turns a second, and it keeps turning in reduced motion. A skeleton that pulses every 300ms: 3.3 cycles a second — over the three flashes a second of WCAG 2.3.1 for any area large and contrasty enough to count. Use `.ds-loading` — one turn in 1000ms; in reduced motion a pulse every 2000ms that never drops below 3:1.

**Rules**

- **One loop.** `.ds-loading` is the only animation that runs on. Anything else that keeps moving — a carousel, an animated illustration — needs a pause or stop control, or stops within 5 seconds (WCAG 2.2.2, MR-06).
- **Progress after five seconds.** Work that can take longer than 5 seconds shows progress in words or a bar; a spinner alone says nothing about how long.
- **Highlight once.** Never on every tick of a value that updates many times a second; never as a blink or a pulse that repeats (MR-08).

---

## What never moves

Some things must stay still for people to read, steer and find their place. The motion checker and audit look for each of these.

| Never | Because | Instead |
|---|---|---|
| The focus ring animating in | For its first frames it isn't there; keyboard users lose their place | It appears at once — tokens.css draws it and no transition list includes outline (M6) |
| Text moving while it is read | Auto-advancing carousels, rolling digits and marquees move the words out from under the reader | Changes happen when the reader asks; a changed value gets one highlight |
| Movement tied to scrolling | Parallax and scroll-linked effects are the strongest trigger of motion sickness on the web | Content scrolls; nothing else moves with it |
| `scroll-behavior: smooth` for everyone | every in-page link and every focus jump glides the whole page — for people with reduced motion too | put it inside `@media (prefers-reduced-motion: no-preference)` |
| A shaking field | it moves back and forth in reduced motion, tells a screen reader nothing, and is gone before some people look | the message names the problem (aria-describedby), the border widens to its state (Border foundation); .ds-highlight once if the field is out of view |
| Autoplay | A video or carousel that starts by itself moves beside the content people came for | It waits to be started, or has a pause control in reach (WCAG 2.2.2) |

**Rules**

- **Scale, rotate and skew.** Only the loading indicator turns. Nothing else grows, shrinks or spins to make a point: a change of size reads as movement toward or away from the reader.
- **Nothing from off the screen.** The longest move is 32px; a dialog doesn't slide up the whole window, a drawer doesn't sweep across it.

---

## Choosing motion

Four questions: *does it need motion at all?*, *which job?*, *which way does it move?* and *what must never move?*

**Does it need motion at all** — What would people miss without it?

| When | Use |
|---|---|
| Nothing — it would only look livelier | no motion: it changes at once |
| That the thing they touched heard them | `motion/feedback` — colour, fill or border, in 100ms; never movement |
| Where content went or came from (a panel opening, an item removed) | `motion/change` |
| That something opened over the page, and from where | `motion/floating` or `motion/modal` — ready in tokens.css |
| That something changed on its own while they looked elsewhere | `motion/highlight` — once |
| That work is still going | `motion/loading` (`.ds-loading`) — and progress in words or a bar once it runs past 5 seconds |

**Which job** — What is changing?

| When | Use |
|---|---|
| A hover, a press, a toggle, a checkbox, a selected row | `motion/feedback` |
| A panel expanding or collapsing, a tab panel, an item added to or removed from a list, a value replaced | `motion/change` |
| A menu, popover, tooltip, date picker, toast or the navigation drawer | `motion/floating` — `.ds-floating` as a `popover` (`data-layer="toast"` for a toast); the drawer is the shell's |
| A dialog or a sheet | `motion/modal` — `dialog.ds-modal` opened with `showModal()` |
| A live value that updated, a row that just arrived, a field that saved | `motion/highlight` — `.ds-highlight` |
| Waiting for work to finish | `motion/loading` — `.ds-loading` on the indicator |
| A new page or view | no movement: a crossfade at `motion/change` timing, or nothing |
| Something the system has no job for (a carousel slide, a bottom sheet handle) | a product job in the config (`motion.jobs`: a kind and a distance) — the duration is computed |

**Which way** — Where does it come from?

| When | Use |
|---|---|
| A menu or popover from its button | `.ds-floating` does it: it drops in from above, toward where it opens |
| A toast from the edge it sits on | `data-layer="toast"`: it comes up from the bottom |
| The navigation drawer | the shell does it: in from the start side, flipped right to left |
| A dialog | `dialog.ds-modal` does it: it rises into place while the scrim fades in |
| Content changing in place | the way it grows (down as a panel opens) by `motion/change/distance` — or not at all |
| Anything | one axis, the job's distance; never from off the screen, never scale, rotate or skew |

**What never moves** — Is it something people are reading or steering by?

| When | Use |
|---|---|
| The focus ring | it appears at once (tokens.css draws it; never in a transition list) |
| Text being read | never moves on its own: no auto-advancing carousels, no rolling digits, no marquees |
| The page while it scrolls | nothing moves with the scroll: no parallax, no scroll-linked movement |
| A field with an error | a message and the state border (Border foundation) — never a shake |
| Something that must get attention | its position and a highlight once — never a pulse or bounce that repeats |

**Worked example — a project page.** One part at a time:

| Part | Job | What people see |
|---|---|---|
| Hovering a project card | `motion/feedback` | The card's fill changes in 100ms; nothing moves. |
| The card's "more" menu | `motion/floating` · a `.ds-floating` popover | It drops 4px into place in 150ms and leaves in 100ms. |
| "Delete project?" | `motion/modal` · `dialog.ds-modal` | It rises 16px in 250ms while the scrim fades in. |
| The card disappearing from the list | `motion/change` | It fades and moves 8px up in 200ms; the cards after it close the gap at once. |
| "Project deleted" toast | `motion/floating` · `data-layer="toast"` | It comes up 4px from the bottom. |
| The open-task count updating | `motion/highlight` · `.ds-highlight` | The number's tint fades over 1000ms, once. |
| Saving | `motion/loading` · `.ds-loading` | The indicator turns until the save ends; after five seconds a line says how far it got. |
| All of it, with reduced motion | the reduced mode | Every one of these fades in place in 100ms or less; the indicator pulses. |

**Do and avoid** (measured in this build)

| Avoid | Measured | Do |
|---|---|---|
| transition: all 0.3s ease on a button | it animates every property that changes — the focus ring and the layout too — for 300ms, 3× the feedback job, and still 300ms in reduced motion | `motion/feedback` — transition: background-color, border-color and color at var(--ds-motion-feedback-duration) (100ms), var(--ds-motion-feedback-easing) |
| A curve that starts at full speed (cubic-bezier(0, 0, 0, 1)) | its first frame covers 47% of a 4px menu move and 36% of a 16px dialog move (5.8px), then it crawls: a jump, not an arrival — its starting speed has no limit | `motion/easing/enter` — cubic-bezier(0.2, 0.5, 0.4, 1): never above 2.5× the average speed; the dialog's first frame is 2.6px of 16px |
| A dialog sliding in from off the screen (translate: 0 100vh) | on an 800px-tall window it travels 800px in 300ms (2667px a second), 25× the 32px limit — and reduced motion can't stop it unless it is written twice | `dialog.ds-modal` — rises 16px in 250ms; in reduced motion it only fades (100ms) |
| A spinner at animation: spin 0.6s linear infinite | 1.7 turns a second, and it keeps turning in reduced motion | `.ds-loading` — one turn in 1000ms; in reduced motion a pulse every 2000ms that never drops below 3:1 |
| A skeleton that pulses every 300ms | 3.3 cycles a second — over the three flashes a second of WCAG 2.3.1 for any area large and contrasty enough to count | `.ds-loading` — the indicator turns once a second; a skeleton stays still, or pulses at most at the reduced pace (2000ms) |
| Shaking a field to show an error | it moves back and forth in reduced motion, tells a screen reader nothing, and is gone before some people look | an error message and the state border — the message names the problem (aria-describedby), the border widens to its state (Border foundation); .ds-highlight once if the field is out of view |
| scroll-behavior: smooth on `<html>` | every in-page link and every focus jump glides the whole page — for people with reduced motion too | `@media (prefers-reduced-motion: no-preference)` — put the smooth scrolling inside it, or leave it out |

---

## Readers' settings and products

People ask their system for less motion, zoom, enlarge text and switch to forced colours; products add jobs of their own. Motion is built so none of that breaks.

**Reduced motion.** The system setting (`prefers-reduced-motion`) switches every job to its reduced value, unless the reader chose otherwise in the product (`data-motion` on `<html>`); see [Reduced motion](#reduced-motion). The motion audit runs every page both ways and measures what still moves.

**Zoom and bigger text (WCAG 1.4.4, 1.4.10).** Distances are px and scale with zoom like everything else; durations don't change. Nothing in ds animates size or layout, so text growing never sets anything moving.

**Forced colours.** Animations still run in forced colours; the ready transitions only move and fade, so nothing depends on a colour the system replaces.

**Adding a job.** Most motion fits one of the six. If a product needs another (a carousel slide, a bottom sheet), name it by what moves, say whether it changes in place or arrives and leaves, and how far it moves on the spacing scale; the build computes the duration (250ms for 24px), the curves and the reduced mode, and refuses durations, curves, names by look or speed, loops and anything further than 32px:

```json
{
  "motion": {
    "jobs": [
      {
        "name": "motion.carousel",
        "kind": "in-place",
        "distance": "space.6",
        "description": "Slides of a carousel the reader steps through"
      }
    ]
  }
}
```

Durations and curves are not config choices: they are computed, so every product gets the same checked motion.

---

## Accessibility reference

What the build checks for motion, and the result for this build:

| Check | What it checks | WCAG | Result |
|---|---|---|---|
| M1 | Reduced motion is fade only: nothing moves, transitions fade in 100ms or less, the loading indicator pulses instead of turning | 2.3.3 (AA) | pass · 12/12 pass |
| M2 | Nothing flashes: a highlight takes ≥ 334ms and no loop changes brightness more than 3 times a second | 2.3.1 (A) | pass · 4/4 pass |
| M3 | Duration follows distance: 100ms + 37.5ms × √px rounded down to 50ms, nothing over 32px or 300ms; leaving takes two thirds of arriving; a loop turns at most once a second | — (AA) | pass · 7/7 pass |
| M4 | No jumps: every curve stays under 2.5× its average speed; arriving lands at rest, leaving starts from rest, changing in place does both | — (AA) | pass · 10/10 pass |
| M5 | Loops and highlights stay readable: the loading indicator never pulses below 3:1; text stays ≥ 4.5:1 on the highlight tint | 1.4.11, 1.4.3 (AA) | pass · 5/5 pass |
| M6 | Ready transitions: menus, popovers, toasts, the drawer and dialogs open and close with their motion jobs in tokens.css — tokens only, focus rings never animated | 2.3.3, 2.4.7 (AA) | pass · 7/7 pass |

*WCAG 2.3.3 (Animation from Interactions) is a AAA criterion; ds holds it as a rule, so M1 fails the build like an AA check.*

What the checkers look for in your own code and pages: the motion checker (`npm run lint:motion`) reads CSS, HTML and JSX; the motion audit (`npm run audit:motion`) renders a page with full and reduced motion at 1280 and 320px, hovers, opens every popover, dialog and `--open` selector, records every animation frame by frame, and fails movement in reduced motion, flashes, loops that never stop, focus rings that animate and transitions that don't come from a job. See the [handoff](HANDOFF.md).

**Glossary**

| Term | Meaning |
|---|---|
| Job | What a motion does (feedback, change, floating, modal, highlight, loading); it decides duration, curve and distance. |
| Distance | How far something moves while it arrives or changes, on the spacing scale; 0 in reduced motion. |
| Curve (easing) | How speed changes over the duration: arriving settles, leaving speeds up, changing in place does both. |
| Reduced motion | A mode the reader asks for: nothing moves, changes fade. |
| Flash | A pair of opposite changes in brightness; more than three a second can trigger seizures. |
| Top layer | A browser layer above every z-index, for dialogs and popovers — they stay there while they animate out. |
