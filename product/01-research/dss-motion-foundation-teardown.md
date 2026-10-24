# DSS Motion Foundation — teardown, 23 Oct 2026

Source: `surf/Motion Foundation.fig`, opened in FigCraft (variables, modes, aliases and scopes, every layer's variable
bindings and prototype interactions, and every text layer read directly, not from images). Easing curves and per-frame
movement computed from the token values in code (cubic-bezier solved numerically, frames at 60Hz).
Page PDFs for reference: `surf/motion_foundation/`. Reference only — nothing here is copied into `product/`.

## Structure
- Two motion collections, one mode each (`Default`): `motion-primitives` (15: 5 durations, 5 easings as STRING
  variables holding `cubic-bezier(...)` text, 5 distances) and `motion-semantic` (20: seven intents — enter, exit,
  replace, feedback, emphasize, loading, attention — each a duration, an easing and a distance, except loading, which has
  no distance; all aliases of primitives). Plus the two leftover collections every Surf file carries (`Collection 1`,
  `Measurements`).
- Values: durations 0 / 160 / 240 / 320 / 400ms (80ms steps), distances 0 / 4 / 8 / 16 / 24px, easings standard
  (0.4, 0, 0.2, 1), decelerate (0, 0, 0.2, 1), accelerate (0.4, 0, 1, 1), linear, emphasized (0.2, 0, 0, 1). The first
  three are the curves Material Design published in 2014; the last is the curve Material 3 calls *standard*.
- Pages: principles (10), token structure, primitives (duration, easing, distance), semantic tokens (one frame per
  intent), easing structure, duration by intent, spatial movement, reduced motion (10 rules), decision matrix (12
  conditions), usage rules. Every page is a table. 1,859 layers, 725 of them text.

## What works
- Motion is chosen by **intent** first (what is changing and why), then a duration, curve and distance — the right
  order, and the same idea as the role-first colour and elevation files.
- Exit is faster than enter (160 vs 240ms), and the usage rules say why: a slow exit delays the next action.
- Curves are matched to direction: decelerate for things arriving, accelerate for things leaving, linear only for
  continuous activity.
- The spatial rules are good: one axis by default, distance proportional to the change, transform origin at the source
  of the change, opacity paired with movement rather than replacing spatial meaning.
- The reduced-motion page treats reduced motion as "a real system mode, not an optional one-off exception", removes
  decorative motion first, reduces travel before removing transitions, and keeps **one clear signal** rather than
  stacking fade, scale and movement.
- The movement itself is small, so the values are comfortable (computed at 60Hz):

| Intent | Duration | Frames | Distance | Largest step per frame |
|---|---|---|---|---|
| enter | 240ms decelerate | 14 | 8px | 1.8px (the first frame) |
| exit | 160ms accelerate | 10 | 8px | 1.2px |
| replace | 240ms standard | 14 | 16px | 3.0px |
| emphasize | 240ms emphasized | 14 | 4px | 1.0px |
| attention | 320ms emphasized | 19 | 8px | 1.6px |

## Quality problems found (measured)

### Reduced motion is a page, not a mode
- Both motion collections have **one mode** (`Default`). The token-structure page describes a third layer, "Mode
  Overrides", with examples `motion.mode.reduced.feedback.duration` and `motion.mode.reduced.attention.easing`: **no
  such variable exists**, and no reduced value exists for any of the 20 semantic tokens.
- So the ten reduced-motion rules can't be applied from the file: nothing says what an enter becomes when reduced
  (how long, which curve, how far), or what loading does. The decision matrix answers "Reduced-motion mode is active"
  with "fade **or** instant fallback" — it never picks.
- Nothing says how a product learns the preference: `prefers-reduced-motion` appears 0 times, and neither does an
  in-product setting.

### Twelve intents on one page, seven in the tokens
The "Duration by Intent" page lists twelve intents and gives **no duration for any of them** (no millisecond value on
the page). Against the semantic tokens:

| Intent on the page | Token |
|---|---|
| Immediate Feedback | `feedback` |
| Minor Local Update | none |
| Enter | `enter` |
| Exit | `exit` |
| Transition | none |
| Replacement | `replace` |
| Structural Change | none |
| Emphasis | `emphasize` |
| Attention Guidance | `attention` |
| Loading / Continuous Activity | `loading` (no distance) |
| Expressive Highlight | none (`duration/expressive` 400ms is used by no semantic token) |
| Reduced Motion Fallback | none |

- Five intents have no token; "Transition" is called "the default timing for neutral UI transitions" and has none.
- The decision matrix uses a third vocabulary, motion levels None / Subtle / Standard / Expressive, that maps to no
  token either.
- Emphasize and attention share a curve (emphasized) and differ by 80ms and 4px; emphasize's own page says it is "to
  raise local visual priority **or draw attention to a change**", which is attention's job.

### Menus, dialogs, toasts and pages have no motion
- "menu", "dialog", "modal", "toast", "popover", "tooltip", "sheet", "drawer" and "scroll" appear **0** times in the
  725 text layers; "page" once, in what feedback is *not* for. A menu opening is presumably `enter`, but `enter` is the
  same for a 40px tooltip and a full-screen dialog; nothing links motion to the levels the elevation file defines.
- No stagger (a list arriving item by item), no hover timing beyond "feedback", no skeleton rule; spinners and progress
  indicators are named only as uses of loading.

### Loading's cycle is faster than its own rule allows
- `loading/duration` = `duration/slow` = **320ms per cycle, linear**: 3.1 cycles a second. As a spinner that is
  1,125° a second, against the page's own "avoid fast looping motion, nervous rhythm".
- If a product makes it a pulse (a skeleton that fades in and out), 3.1 cycles a second is **above the three-flashes
  limit** of WCAG 2.3.1 for any area large and contrasty enough to count. The file says neither "rotation only" nor a
  minimum cycle.
- No rule for how long a loop may run: nothing about a pause control after 5 seconds (2.2.2), or stopping when the work
  is done.

### No motion anywhere in the file
- **0 prototype interactions** on 1,859 layers (FigCraft reads them back from a `.fig` — checked on our own test file —
  and found none here), **0 drawn curves** (the "Curve" column on the easing page is the `cubic-bezier` text again) and
  **0 before/after pictures**. A designer can't see what 240ms decelerate looks like, or try it in a prototype.
- All 35 motion variables have **empty scopes** (hidden from every picker) and none is bound to a layer that moves; the
  only 10 bindings put the easing strings into text layers so the tables print them.
- No code syntax on any variable (0 / 35), so nothing ties `enter/duration` to a CSS name.

### The token pages print placeholders
- Duration primitives: `fast` shows 160, `instant` shows a lowercase **"o"** typed in place of 0, and `moderate`,
  `slow` and `expressive` show **"-"**. Distance primitives: all five show **"-"**. Only the easing table is right,
  because its cells are bound to the variables. Same pattern as the spacing, layout, radius, border and elevation files.
- The semantic pages print the right values (typed by hand).

### Accessibility: barely mentioned
- "WCAG" appears **0** times; so do "flash", "seizure", "pause", "vestibular", "parallax", "scroll", "hover" and
  "focus ring". Nothing on:
  - **Three flashes (2.3.1, A):** no minimum time between flashes for blinking or pulsing highlights (see loading).
  - **Pause, stop, hide (2.2.2, A):** nothing on loops or auto-playing motion that runs more than 5 seconds.
  - **Animation from interactions (2.3.3, AAA):** the reduced page has the right intent but no values (above).
  - **Scroll-linked motion and parallax:** the strongest vestibular trigger in web UI, not covered.
  - **Focus:** nothing says a focus ring appears instantly (never animated in), or that motion must not move the
    focused element out of view.
  - **Content that moves while being read:** live values updating, carousels, auto-advancing content.

### Names
- Pages write tokens with dots (`motion.enter.duration`), variables use slashes; components carry a property named
  `isIverted` (sic).

## What we do differently (ideas only, our own design — the three marked choices are Ali's, asked 23 Oct)
- **Reduced is a real mode:** the Motion collection has Full and Reduced modes in Figma and code; every motion token
  has a reduced value, computed and checked (no movement; short or none). *Choice: fade only, or no animation.*
- **Fewer, named jobs that cover what products open:** motion linked to the elevation levels (a menu, a dialog, a
  toast, a sticky bar), so "how does a menu open" has one answer. *Choice: intents by job, or a duration scale people
  pick from.* *Choice: ready transitions for menus and dialogs, or tokens only.*
- **Flashes, loops and scroll checked by tools:** a checker that flags hard-coded durations and curves,
  `transition: all`, animations without a reduced path, loops with no pause, flashing faster than 3 a second,
  scroll-linked movement and animated focus rings; an audit that emulates reduced motion in Chromium and measures what
  still moves.
- **Motion you can see in Figma:** real prototype transitions (smart animate between variants, the token's duration
  and curve), curves drawn from the bezier values, and frame-by-frame pictures computed by code.
- **Loading as rotation with a floor:** continuous motion at a calm cycle, never a pulse faster than 3 a second, and a
  pause rule for anything that runs past 5 seconds.
