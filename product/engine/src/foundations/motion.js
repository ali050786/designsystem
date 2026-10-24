// Motion: how things change on screen. Motion is chosen by job — what is changing and why — and each job carries the
// duration, the curve and the distance that go with it: feedback (the thing you touched answers), change (content
// changing in place), floating and modal (what opens over the page, linked to the elevation levels of the same names),
// highlight (drawing the eye to something that changed on its own) and loading (work in progress).
// Nothing here is picked by eye: a job's duration is computed from how far it moves (time grows with the square root of
// the distance, as for anything that accelerates), exits take two thirds of the time of the entry, curves are defined
// by their speed at each end and checked for jumps. Reduced motion is a real mode: no job moves, transitions fade in
// 100ms or less, the loading indicator stops turning and pulses slowly instead. Products add jobs by name, kind and
// distance; the build computes the rest.
import { ref } from '../system.js';
import { SPACE, BASE } from './spacing.js';

const P = 'Primitives';
const M = 'Motion';

// ---------- The rules every value is computed from ----------
export const RESPONSE_MS = 100; // a direct answer within 100ms reads as instant (the feedback job, and the reduced fades)
export const MS_PER_ROOT_PX = 37.5; // added per √px travelled: 4px → 175ms, 8px → 206ms, 16px → 250ms, 32px → 312ms
export const STEP_MS = 50; // durations are rounded down to this step
export const EXIT_SHARE = 2 / 3; // leaving needs less attention than arriving
export const REDUCED_MAX_MS = 100; // the longest fade in reduced motion
export const MAX_DISTANCE = 32; // px; nothing travels further — a bigger change fades instead of sliding
export const MAX_DURATION = 300; // ms; the longest transition the rule can produce (32px)
export const PEAK_SPEED_MAX = 2.5; // no curve moves faster than 2.5× its average speed: no jump on any frame
export const FRAME_MS = 1000 / 60;
export const MIN_FLASH_INTERVAL_MS = 334; // ≤ 3 flashes a second (WCAG 2.3.1)
export const HIGHLIGHT_MS = 1000; // a highlight fades over three flash intervals: seen, never a blink
export const LOADING_TURN_MS = 1000; // one turn a second: calm, never "nervous"
export const PULSE_MS = 2000; // reduced loading: a slow pulse, one every two seconds
export const PAUSE_AFTER_MS = 5000; // motion that runs longer than this needs a way to stop it (WCAG 2.2.2)
export const INDICATOR_MIN = 3; // the loading indicator at its dimmest still reaches 3:1 (WCAG 1.4.11)

/** A job's duration from the distance it travels: RESPONSE_MS + MS_PER_ROOT_PX × √px, rounded down to STEP_MS. */
export const durationFor = (px) => Math.floor((RESPONSE_MS + MS_PER_ROOT_PX * Math.sqrt(px)) / STEP_MS) * STEP_MS;
/** How long leaving takes: two thirds of the entry, rounded down to STEP_MS, never under RESPONSE_MS. */
export const exitFor = (ms) => Math.max(RESPONSE_MS, Math.floor((ms * EXIT_SHARE) / STEP_MS) * STEP_MS);

// ---------- Curves, defined by their speed at each end (× the average speed) ----------
// enter: starts at the speed limit and lands at rest — it arrives, then settles.
// exit:  the entry played backwards — it starts from rest and leaves at speed.
// standard: for things that change in place — starts and lands at rest, quicker in the first half.
// linear: only for loops (the loading turn).
export const EASING = {
  enter: { value: [0.2, 0.5, 0.4, 1], start: 2.5, end: 0, use: 'Something arriving: a menu, a dialog, a toast, the drawer' },
  exit: { value: [0.6, 0, 0.8, 0.5], start: 0, end: 2.5, use: 'Something leaving: the entry played backwards' },
  standard: { value: [0.3, 0, 0.3, 1], start: 0, end: 0, use: 'Something changing where it is: a hover, a panel opening, a tab, a highlight fading' },
  linear: { value: [0, 0, 1, 1], start: 1, end: 1, use: 'Loops only: the loading turn' },
};
export const EASING_ORDER = ['enter', 'exit', 'standard', 'linear'];

/** Progress (0–1) of a cubic-bezier curve at time t (0–1), solved numerically. */
export function bezierAt([x1, y1, x2, y2], t) {
  const B = (a, b, s) => 3 * a * (1 - s) ** 2 * s + 3 * b * (1 - s) * s * s + s ** 3;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (B(x1, x2, m) < t) lo = m; else hi = m; }
  return B(y1, y2, (lo + hi) / 2);
}

/** Speed at each end and at its fastest, as multiples of the average speed. */
export function curveSpeeds(c) {
  const [x1, y1, x2, y2] = c;
  const slope = (dy, dx) => (dx === 0 ? (dy === 0 ? null : Infinity) : dy / dx);
  // At an end where the first control point sits on the end point, the tangent runs toward the second one.
  const start = slope(y1, x1) ?? slope(y2, x2) ?? 1;
  const end = slope(1 - y2, 1 - x2) ?? slope(1 - y1, 1 - x1) ?? 1;
  let peak = 0;
  for (let i = 0; i < 2000; i++) peak = Math.max(peak, (bezierAt(c, (i + 1) / 2000) - bezierAt(c, i / 2000)) * 2000);
  return { start, end, peak: Math.max(peak, start === Infinity ? Infinity : 0) };
}

/** The frames a browser draws at 60Hz: [{ t (ms), progress, step (share of the distance covered in that frame) }]. */
export function framesOf(c, ms) {
  const out = [];
  const n = Math.max(1, Math.ceil(ms / FRAME_MS));
  let prev = 0;
  for (let k = 1; k <= n; k++) { const t = Math.min(ms, k * FRAME_MS); const p = bezierAt(c, t / ms); out.push({ t: +t.toFixed(1), progress: p, step: p - prev }); prev = p; }
  return out;
}

// ---------- The jobs ----------
// kind: "in-place" (changes where it is: one duration, the standard curve), "in-out" (arrives and leaves: enter and exit),
// "once" (a highlight that fades away), "loop" (runs while work is in progress).
// distance: a key on the spacing scale (space.N); the duration is computed from it.
export const MOTION_JOB_ORDER = ['feedback', 'change', 'floating', 'modal', 'highlight', 'loading'];
export const MOTION_JOBS = {
  feedback: { kind: 'in-place', distance: null, use: 'The thing you touched answers: hover, press, a toggle or checkbox, a selected row — colour, fill and border, never movement' },
  change: { kind: 'in-place', distance: '2', use: 'Content changing where it is: a panel expanding or collapsing, a tab panel, an item added to or removed from a list, a value replaced' },
  floating: { kind: 'in-out', distance: '1', level: 'floating', use: 'What opens over the page without blocking it: menus, popovers, tooltips, date pickers, toasts, the navigation drawer (elevation.floating)' },
  modal: { kind: 'in-out', distance: '4', level: 'modal', use: 'What blocks the page until it is answered: dialogs and sheets, with the scrim fading in behind (elevation.modal)' },
  highlight: { kind: 'once', use: 'Drawing the eye to something that changed on its own: a live value that updated, a row that just arrived, a saved field — a tint that fades, once' },
  loading: { kind: 'loop', use: 'Work in progress: the loading indicator turns while it runs (in reduced motion it pulses slowly instead) and stops when the work is done' },
};
const LOOK = /(^|-)(fast|faster|slow|slower|quick|snappy|smooth|bounce|bouncy|spring|springy|elastic|wobble|shake|jiggle|swoosh|zoom|pop|flash|blink|pulse|spin|\d+(ms|s)?)(-|$)/;

/** The config's motion choices, checked before anything is computed. Returns { jobs } (product jobs). */
export function validateMotionConfig(cfg) {
  const c = cfg.motion ?? {};
  const fail = (msg) => { throw new Error(`motion: ${msg}`); };
  for (const k of Object.keys(c)) if (k !== 'jobs') fail(`"${k}" is not a motion choice: the config takes "jobs" (product motion by name, kind and distance). Durations and curves are computed`);
  const jobs = (c.jobs ?? []).map(productJob);
  const names = jobs.map((j) => j.name);
  const twice = names.find((n, i) => names.indexOf(n) !== i);
  if (twice) throw new Error(`motion.jobs → ${twice}: this name is listed twice`);
  return { jobs };
}

function productJob(t) {
  const where = `motion.jobs → ${t?.name ?? '(no name)'}`;
  const fail = (msg) => { throw new Error(`${where}: ${msg}`); };
  for (const k of ['duration', 'ms', 'easing', 'curve', 'timing', 'delay', 'speed']) if (t && k in t) fail(`"${k}" is not allowed: durations and curves are computed from the kind and the distance (${RESPONSE_MS}ms + ${MS_PER_ROOT_PX}ms × √px, rounded down to ${STEP_MS}ms)`);
  if (!/^motion\.[a-z]+(-[a-z]+)*$/.test(t?.name ?? '')) fail('name must be motion.<job>, e.g. "motion.carousel" — what moves');
  const job = t.name.slice(7);
  if (MOTION_JOBS[job]) fail('a job with this name already exists — use it');
  if (LOOK.test(job)) fail('name the job by what moves ("carousel", "sheet"), not by how it looks or how fast ("fast", "bounce", "200ms")');
  if (!['in-place', 'in-out'].includes(t.kind)) fail(`add "kind": "in-place" (it changes where it is) or "in-out" (it arrives and leaves). Loops and highlights are the built-in loading and highlight jobs`);
  const key = String(t.distance ?? '').replace(/^space\./, '');
  if (!(key in SPACE)) fail(`"distance" must be a step on the spacing scale (${Object.keys(SPACE).filter((k) => SPACE[k] * BASE <= MAX_DISTANCE).map((k) => `space.${k}`).join(', ')}), e.g. "space.6"`);
  if (SPACE[key] * BASE > MAX_DISTANCE) fail(`${SPACE[key] * BASE}px is too far: nothing travels more than ${MAX_DISTANCE}px (space.8). For a bigger change, fade (distance "space.0") — movement across the screen is what reduced motion exists for`);
  if (!t.description) fail('add a description: what moves, and when');
  return { name: t.name, job, kind: t.kind, distance: key, use: t.description, product: true };
}

/** Every job with its computed values, built-in first: [{ job, kind, px, full, reduced, product }]. */
export function motionJobs(productJobs = []) {
  const all = [...MOTION_JOB_ORDER.map((job) => ({ job, ...MOTION_JOBS[job], product: false })), ...productJobs];
  return all.map((j) => {
    const px = j.distance == null ? 0 : SPACE[j.distance] * BASE;
    if (j.kind === 'in-place') {
      const ms = durationFor(px);
      return { ...j, px, full: { duration: ms, easing: 'standard', distance: j.distance }, reduced: { duration: Math.min(ms, REDUCED_MAX_MS), easing: 'linear', distance: j.distance == null ? null : '0' } };
    }
    if (j.kind === 'in-out') {
      const ms = durationFor(px);
      return { ...j, px, full: { duration: ms, easing: 'enter', distance: j.distance, exit: exitFor(ms), exitEasing: 'exit' }, reduced: { duration: REDUCED_MAX_MS, easing: 'linear', distance: '0', exit: REDUCED_MAX_MS, exitEasing: 'linear' } };
    }
    if (j.kind === 'once') return { ...j, px: 0, full: { duration: HIGHLIGHT_MS, easing: 'exit' }, reduced: { duration: HIGHLIGHT_MS, easing: 'exit' } };
    return { ...j, px: 0, full: { duration: LOADING_TURN_MS, easing: 'linear' }, reduced: { duration: PULSE_MS, easing: 'standard' } };
  });
}

/** The parts a job has, as token suffixes. */
export const partsOf = (j) => (j.kind === 'in-out' ? ['duration', 'easing', 'distance', 'exit-duration', 'exit-easing'] : j.kind === 'in-place' && j.distance != null ? ['duration', 'easing', 'distance'] : ['duration', 'easing']);

export function buildMotion(sys, cfg) {
  const { jobs: productJobs } = validateMotionConfig(cfg);
  const jobs = motionJobs(productJobs);
  // Primitives: exactly the durations the jobs use, and the four curves. Distances link to the spacing scale.
  const used = new Set();
  for (const j of jobs) for (const m of [j.full, j.reduced]) { used.add(m.duration); if (m.exit) used.add(m.exit); }
  for (const d of [...used].sort((a, b) => a - b)) sys.add(`motion.duration.${d}`, { collection: P, type: 'duration', value: d, description: `${d}ms` });
  for (const k of EASING_ORDER) sys.add(`motion.easing.${k}`, { collection: P, type: 'cubicBezier', value: EASING[k].value, description: EASING[k].use });
  for (const j of jobs) {
    const meta = { job: j.job, kind: j.kind, product: j.product, px: j.px };
    const both = (f) => ({ full: f(j.full), reduced: f(j.reduced) });
    sys.add(`motion.${j.job}.duration`, { collection: M, type: 'duration', values: both((m) => ref(`motion.duration.${m.duration}`)), description: `${j.use} — ${j.kind === 'loop' ? 'one cycle' : j.kind === 'in-out' ? 'arriving' : 'how long it takes'}`, ...meta });
    sys.add(`motion.${j.job}.easing`, { collection: M, type: 'cubicBezier', values: both((m) => ref(`motion.easing.${m.easing}`)), description: `${j.use} — ${j.kind === 'in-out' ? 'curve arriving' : 'curve'}`, ...meta });
    if (partsOf(j).includes('distance')) sys.add(`motion.${j.job}.distance`, { collection: M, type: 'dimension', values: both((m) => ref(`space.${m.distance}`)), description: `${j.use} — how far it travels (reduced: 0, it only fades)`, ...meta });
    if (j.kind === 'in-out') {
      sys.add(`motion.${j.job}.exit-duration`, { collection: M, type: 'duration', values: both((m) => ref(`motion.duration.${m.exit}`)), description: `${j.use} — leaving`, ...meta });
      sys.add(`motion.${j.job}.exit-easing`, { collection: M, type: 'cubicBezier', values: both((m) => ref(`motion.easing.${m.exitEasing}`)), description: `${j.use} — curve leaving`, ...meta });
    }
  }
  sys.notes.push(`Motion: ${MOTION_JOB_ORDER.length} jobs${productJobs.length ? ` + ${productJobs.length} added for this product` : ''}; durations computed from distance (${RESPONSE_MS}ms + ${MS_PER_ROOT_PX}ms × √px).`);
}

/**
 * The lowest opacity the loading indicator may pulse to: the colour at that opacity over the surface still reaches
 * INDICATOR_MIN against the surface, on every surface and in both modes. Returned rounded up to 0.05.
 */
export function pulseFloor(sys, contrast, composite) {
  let need = 0;
  const surfaces = ['color.bg.canvas', 'color.bg.surface', 'color.bg.surface-raised', 'color.bg.surface-overlay', 'color.bg.surface-sunken'].filter((p) => sys.tokens.has(p));
  for (const m of ['Light', 'Dark']) for (const s of surfaces) {
    const bg = sys.resolve(s, { Color: m }).slice(0, 7), fg = sys.resolve('color.fg.icon', { Color: m }).slice(0, 7);
    let a = 1;
    for (let x = 1; x >= 0; x -= 0.01) { if (contrast(composite(fg, x, bg), bg) >= INDICATOR_MIN) a = x; else break; }
    need = Math.max(need, a);
  }
  return Math.ceil(need * 20 - 1e-9) / 20;
}
