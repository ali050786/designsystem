// Motion AI content: a machine-readable contract (JSON) and a rulebook (Markdown) for AI tools and the motion checker.
// Both are generated from the engine, so they always match the shipped tokens.
import { cssName } from './css.js';
import {
  MOTION_JOB_ORDER, EASING, EASING_ORDER, RESPONSE_MS, MS_PER_ROOT_PX, STEP_MS, EXIT_SHARE, REDUCED_MAX_MS, MAX_DISTANCE, MAX_DURATION,
  PEAK_SPEED_MAX, MIN_FLASH_INTERVAL_MS, HIGHLIGHT_MS, LOADING_TURN_MS, PULSE_MS, PAUSE_AFTER_MS, INDICATOR_MIN,
  motionJobs, validateMotionConfig, curveSpeeds, framesOf, pulseFloor, durationFor,
} from '../foundations/motion.js';
import { contrast, composite } from '../color-math.js';

export const MOTION_CHAPTER = {
  built: 'How tokens are built', jobs: 'Motion by job', duration: 'Duration follows distance', curves: 'Curves',
  reduced: 'Reduced motion', opening: 'Opening and closing', loops: 'Loading and highlights', still: 'What never moves',
};
export const chapterOfMotionToken = (path) => {
  if (path.startsWith('motion.duration.')) return MOTION_CHAPTER.duration;
  if (path.startsWith('motion.easing.')) return MOTION_CHAPTER.curves;
  const job = path.split('.')[1];
  if (job === 'floating' || job === 'modal') return MOTION_CHAPTER.opening;
  if (job === 'highlight' || job === 'loading') return MOTION_CHAPTER.loops;
  return MOTION_CHAPTER.jobs;
};

export const MOTION_DECISIONS = [
  { what: 'Does it need motion at all', question: 'What would people miss without it?', answers: [
    ['Nothing — it would only look livelier', 'no motion: it changes at once'],
    ['That the thing they touched heard them', 'motion.feedback — colour, fill or border, in 100ms; never movement'],
    ['Where content went or came from (a panel opening, an item removed)', 'motion.change'],
    ['That something opened over the page, and from where', 'motion.floating or motion.modal — ready in tokens.css'],
    ['That something changed on its own while they looked elsewhere', 'motion.highlight — once'],
    ['That work is still going', 'motion.loading (.ds-loading) — and progress in words or a bar once it runs past 5 seconds']] },
  { what: 'Which job', question: 'What is changing?', answers: [
    ['A hover, a press, a toggle, a checkbox, a selected row', 'motion.feedback'],
    ['A panel expanding or collapsing, a tab panel, an item added to or removed from a list, a value replaced', 'motion.change'],
    ['A menu, popover, tooltip, date picker, toast or the navigation drawer', 'motion.floating — .ds-floating as a popover (data-layer="toast" for a toast); the drawer is the shell\'s'],
    ['A dialog or a sheet', 'motion.modal — dialog.ds-modal opened with showModal()'],
    ['A live value that updated, a row that just arrived, a field that saved', 'motion.highlight — .ds-highlight'],
    ['Waiting for work to finish', 'motion.loading — .ds-loading on the indicator'],
    ['A new page or view', 'no movement: a crossfade at motion.change timing, or nothing'],
    ['Something the system has no job for (a carousel slide, a bottom sheet handle)', 'a product job in the config (motion.jobs: a kind and a distance) — the duration is computed']] },
  { what: 'Which way', question: 'Where does it come from?', answers: [
    ['A menu or popover from its button', '.ds-floating does it: it drops in from above, toward where it opens'],
    ['A toast from the edge it sits on', 'data-layer="toast": it comes up from the bottom'],
    ['The navigation drawer', 'the shell does it: in from the start side, flipped right to left'],
    ['A dialog', 'dialog.ds-modal does it: it rises into place while the scrim fades in'],
    ['Content changing in place', 'the way it grows (down as a panel opens) by motion.change.distance — or not at all'],
    ['Anything', 'one axis, the job\'s distance; never from off the screen, never scale, rotate or skew']] },
  { what: 'What never moves', question: 'Is it something people are reading or steering by?', answers: [
    ['The focus ring', 'it appears at once (tokens.css draws it; never in a transition list)'],
    ['Text being read', 'never moves on its own: no auto-advancing carousels, no rolling digits, no marquees'],
    ['The page while it scrolls', 'nothing moves with the scroll: no parallax, no scroll-linked movement'],
    ['A field with an error', 'a message and the state border (Border foundation) — never a shake'],
    ['Something that must get attention', 'its position and a highlight once — never a pulse or bounce that repeats']] },
];

export const MOTION_RULES = [
  ['MR-01', 'Durations and curves come from a job: transition-duration and animation-duration are var(--ds-motion-<job>-duration) (or -exit-duration), timing functions var(--ds-motion-<job>-easing) (or -exit-easing). No ms or s numbers, no ease, ease-in-out or cubic-bezier() written by hand, no Tailwind duration-300 or ease-in-out (Tailwind: ease-<job> and duration-(--ds-motion-<job>-duration)).', 'A number belongs to no job: reduced motion can\'t shorten it, and nobody can tell what it is for.', '2.3.3'],
  ['MR-02', 'Name what transitions: never transition: all (Tailwind transition-all) — list the properties. Never transition outline or outline-offset, and never animate a focus indicator: focus rings appear at once.', 'all animates whatever happens to change — layout, the focus ring, colours in forced colours — and a ring that fades in is missing for its first frames.', '2.4.7'],
  ['MR-03', 'Move only by a job\'s distance, on one axis: translate by var(--ds-motion-<job>-distance) (or calc(-1 * …)). No px, %, vw or vh distances, no scale, rotate or skew, no animated top, left, margin, width or height.', 'Reduced motion sets every distance to 0: movement written any other way keeps moving for people who asked it to stop. Nothing travels more than 32px.', '2.3.3'],
  ['MR-04', 'Every animation has a reduced path: keyframes that move (transform, translate, rotate, scale, position) run only inside @media (prefers-reduced-motion: no-preference) or move by the job distances; a reduced block never keeps movement. Tailwind: motion-safe: in front of anything that moves.', 'The reduced mode can only switch off what goes through its tokens.', '2.3.3'],
  ['MR-05', 'Opening and closing use the ready transitions: menus, popovers and tooltips are .ds-floating popovers, toasts .ds-floating data-layer="toast", dialogs <dialog class="ds-modal"> opened with showModal(). Don\'t add transitions or animations of your own to them, and don\'t animate them with JavaScript.', 'tokens.css already opens and closes them with the right job, keeps them shown and in the top layer while they leave, and only fades them in reduced motion.', '2.3.3'],
  ['MR-06', 'One loop: the loading indicator (.ds-loading), shown only while work runs. Any other infinite animation (animation-iteration-count: infinite, Tailwind animate-*) needs a visible pause or stop control, or must end within 5 seconds. Work that can take longer than 5 seconds shows progress in words or a bar, not only a spinner.', 'Motion that runs on beside content pulls the eye away from it, and for some people makes reading impossible.', '2.2.2'],
  ['MR-07', 'Nothing flashes: no animation that switches visibility or swings brightness (opacity, colour, background, filter) in a cycle shorter than 334ms, no blinking text, no <marquee> or <blink>.', 'More than three flashes in a second can trigger seizures.', '2.3.1'],
  ['MR-08', 'Highlights fade once: a value or row that changed on its own takes .ds-highlight (a tint fading over motion.highlight), at most once per highlight. Never shake, bounce or pulse something to get attention, and never roll digits.', 'A repeated highlight becomes a flash; a shaking field moves for people who asked it not to and tells a screen reader nothing.', '2.3.1'],
  ['MR-09', 'Nothing moves with scrolling or on its own: no parallax, no scroll-linked movement (animation-timeline: scroll() or view() that moves things, scroll handlers that translate), scroll-behavior: smooth only inside @media (prefers-reduced-motion: no-preference), no autoplaying video or carousel without pause controls.', 'Movement tied to scrolling is the strongest trigger of motion sickness on the web; autoplay moves beside the content people are reading.', '2.3.3, 2.2.2'],
  ['MR-10', 'Never redefine motion variables in app code (--ds-motion-*). Set data-motion only from the reader\'s own setting — never data-motion="full" by default. Add a product job in the engine config (motion.jobs) and build.', 'An overridden job skips the checks for reduced motion, flashes and jumps; a page that forces full motion overrides what the reader asked their system for.', '—'],
];

export const MOTION_CLASSES = [
  ['floating[popover]', 'Menus, popovers, tooltips: drop in from above with motion.floating, leave with its exit (data-layer="toast": up from the bottom)', 'popover (top layer); nothing to add — tokens.css animates [popover].ds-floating'],
  ['modal', 'A <dialog> opened with showModal(): rises in with motion.modal while the scrim fades, leaves with its exit', '<dialog> + showModal(); nothing to add'],
  ['loading', 'The loading indicator: one turn per motion.loading cycle while work runs; in reduced motion a slow pulse', 'ds-loading (Tailwind\'s animate-spin is removed)'],
  ['highlight', 'A tint (color.bg.brand-subtle) that fades over motion.highlight, once, when something changed on its own', 'ds-highlight'],
];

const code = (s) => `\`${s}\``;
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m)).replace(/``/g, '`');
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
const bz = (c) => `cubic-bezier(${c.join(', ')})`;
const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);

/** The frames a job draws at 60Hz: count, the largest step in px and as a share of the distance, and the first step. */
export function jobFrames(sys, job, part = 'duration', ease = 'easing') {
  const r = (p, m = 'full') => sys.resolve(p, { Motion: m });
  const ms = r(`motion.${job}.${part}`);
  const px = sys.tokens.has(`motion.${job}.distance`) ? r(`motion.${job}.distance`) : 0;
  const f = framesOf(r(`motion.${job}.${ease}`), ms);
  const big = Math.max(...f.map((x) => x.step));
  return { ms, px, frames: f.length, largest: +(big * px).toFixed(2), largestShare: +big.toFixed(3), first: +(f[0].step * px).toFixed(2), progress: f.map((x) => +x.progress.toFixed(4)) };
}

/** Measured mistakes: what goes wrong, with the numbers from this build, and the token that fixes it. */
function mistakes(sys) {
  const r = (p, m = 'full') => sys.resolve(p, { Motion: m });
  const jump = [0, 0, 0, 1];
  const fm = framesOf(jump, r('motion.modal.duration')), ff = framesOf(jump, r('motion.floating.duration'));
  const modal = jobFrames(sys, 'modal');
  const travel = 800, slideMs = 300;
  return [
    { mistake: 'transition: all 0.3s ease on a button', measured: `it animates every property that changes — the focus ring and the layout too — for 300ms, ${300 / r('motion.feedback.duration')}× the feedback job, and still 300ms in reduced motion`, fix: 'motion.feedback', fixValue: `transition: background-color, border-color and color at var(--ds-motion-feedback-duration) (${r('motion.feedback.duration')}ms), var(--ds-motion-feedback-easing)` },
    { mistake: 'A curve that starts at full speed (cubic-bezier(0, 0, 0, 1))', measured: `its first frame covers ${Math.round(ff[0].step * 100)}% of a ${r('motion.floating.distance')}px menu move and ${Math.round(fm[0].step * 100)}% of a ${r('motion.modal.distance')}px dialog move (${f1(fm[0].step * r('motion.modal.distance'))}px), then it crawls: a jump, not an arrival — ${curveSpeeds(jump).peak === Infinity ? 'its starting speed has no limit' : `${curveSpeeds(jump).peak.toFixed(0)}× the average speed`}`, fix: 'motion.easing.enter', fixValue: `${bz(r('motion.easing.enter'))}: never above ${PEAK_SPEED_MAX}× the average speed; the dialog's first frame is ${f1(modal.first)}px of ${modal.px}px` },
    { mistake: 'A dialog sliding in from off the screen (translate: 0 100vh)', measured: `on an ${travel}px-tall window it travels ${travel}px in ${slideMs}ms (${Math.round(travel / slideMs * 1000)}px a second), ${travel / MAX_DISTANCE}× the ${MAX_DISTANCE}px limit — and reduced motion can't stop it unless it is written twice`, fix: 'dialog.ds-modal', fixValue: `rises ${r('motion.modal.distance')}px in ${r('motion.modal.duration')}ms; in reduced motion it only fades (${r('motion.modal.duration', 'reduced')}ms)` },
    { mistake: 'A spinner at animation: spin 0.6s linear infinite', measured: `${f1(1000 / 600)} turns a second, and it keeps turning in reduced motion`, fix: '.ds-loading', fixValue: `one turn in ${r('motion.loading.duration')}ms; in reduced motion a pulse every ${r('motion.loading.duration', 'reduced')}ms that never drops below ${INDICATOR_MIN}:1` },
    { mistake: 'A skeleton that pulses every 300ms', measured: `${f1(1000 / 300)} cycles a second — over the three flashes a second of WCAG 2.3.1 for any area large and contrasty enough to count`, fix: '.ds-loading', fixValue: `the indicator turns once a second; a skeleton stays still, or pulses at most at the reduced pace (${r('motion.loading.duration', 'reduced')}ms)` },
    { mistake: 'Shaking a field to show an error', measured: 'it moves back and forth in reduced motion, tells a screen reader nothing, and is gone before some people look', fix: 'an error message and the state border', fixValue: 'the message names the problem (aria-describedby), the border widens to its state (Border foundation); .ds-highlight once if the field is out of view' },
    { mistake: 'scroll-behavior: smooth on <html>', measured: 'every in-page link and every focus jump glides the whole page — for people with reduced motion too', fix: '@media (prefers-reduced-motion: no-preference)', fixValue: 'put the smooth scrolling inside it, or leave it out' },
  ];
}

export function motionContract(sys, cfg, report) {
  const p = cfg.prefix;
  const r = (path, m = 'full') => sys.resolve(path, { Motion: m });
  const { jobs: productJobs } = validateMotionConfig(cfg);
  const computed = motionJobs(productJobs);
  const dim = pulseFloor(sys, contrast, composite);
  const jobs = computed.map((j) => {
    const has = (x) => sys.tokens.has(`motion.${j.job}.${x}`);
    const both = (x) => ({ full: r(`motion.${j.job}.${x}`), reduced: r(`motion.${j.job}.${x}`, 'reduced') });
    const easeOf = (x) => { const t = sys.get(`motion.${j.job}.${x}`); return { full: t.values.full.slice(15, -1), reduced: t.values.reduced.slice(15, -1), css: `var(${cssName(p, `motion.${j.job}.${x}`)})`, tailwind: `ease-${j.job}${x.startsWith('exit') ? '-exit' : ''}` }; };
    return {
      job: j.job, kind: j.kind, use: j.use, level: j.level ? `elevation.${j.level}` : null, product: !!j.product,
      duration: { ...both('duration'), css: `var(${cssName(p, `motion.${j.job}.duration`)})`, tailwind: `duration-(${cssName(p, `motion.${j.job}.duration`)})` },
      easing: easeOf('easing'),
      distance: has('distance') ? { ...both('distance'), space: sys.get(`motion.${j.job}.distance`).values.full.slice(1, -1), css: `var(${cssName(p, `motion.${j.job}.distance`)})` } : null,
      exit: has('exit-duration') ? { duration: { ...both('exit-duration'), css: `var(${cssName(p, `motion.${j.job}.exit-duration`)})` }, easing: easeOf('exit-easing') } : null,
      frames: has('distance') ? jobFrames(sys, j.job) : null,
      exitFrames: has('exit-duration') ? jobFrames(sys, j.job, 'exit-duration', 'exit-easing') : null,
    };
  });
  const curves = EASING_ORDER.map((k) => { const s = curveSpeeds(r(`motion.easing.${k}`)); return { name: k, token: `motion.easing.${k}`, value: r(`motion.easing.${k}`), css: bz(r(`motion.easing.${k}`)), start: +s.start.toFixed(2), end: +s.end.toFixed(2), peak: +s.peak.toFixed(2), use: EASING[k].use }; });
  const durations = sys.byPrefix('motion.duration.').map((t) => ({ token: t.path, ms: r(t.path), usedBy: sys.byPrefix('motion.').filter((x) => x.collection === 'Motion' && Object.values(x.values).includes(`{${t.path}}`)).map((x) => `${x.path} (${Object.entries(x.values).filter(([, v]) => v === `{${t.path}}`).map(([m]) => m).join(', ')})`) }));
  const tokens = [...sys.tokens.values()].filter((t) => t.path.startsWith('motion.')).map((t) => ({
    name: t.path, figma: t.path.replace(/\./g, '/'), cssVar: cssName(p, t.path),
    tailwind: t.path.endsWith('exit-easing') ? [`ease-${t.path.split('.')[1]}-exit`] : t.path.endsWith('.easing') && t.collection === 'Motion' ? [`ease-${t.path.split('.')[1]}`] : t.collection === 'Motion' && t.path.endsWith('duration') ? [`duration-(${cssName(p, t.path)})`] : [],
    use: t.description, collection: t.collection, chapter: chapterOfMotionToken(t.path), type: t.type,
    ...(t.collection === 'Primitives' ? { value: r(t.path) } : { full: r(t.path), reduced: r(t.path, 'reduced'), alias: { full: t.values.full.slice(1, -1), reduced: t.values.reduced.slice(1, -1) } }),
    product: !!t.meta.product,
  }));
  const fb = r('motion.feedback.duration');
  return {
    $schema: 'ds-motion-contract/1', system: sys.name, prefix: p, standard: 'WCAG 2.2 AA (and 2.3.3, held as a rule)',
    jobs, curves, durations,
    rule: { formula: `duration = ${RESPONSE_MS}ms + ${MS_PER_ROOT_PX}ms × √(distance in px), rounded down to ${STEP_MS}ms; leaving takes two thirds of arriving (rounded down to ${STEP_MS}ms, never under ${RESPONSE_MS}ms)`, responseMs: RESPONSE_MS, msPerRootPx: MS_PER_ROOT_PX, stepMs: STEP_MS, exitShare: +EXIT_SHARE.toFixed(4), table: [0, 4, 8, 16, 24, 32].map((px) => ({ px, ms: durationFor(px) })) },
    reduced: {
      what: `Fade only: no job moves (every distance is 0), transitions fade in ${REDUCED_MAX_MS}ms or less, the loading indicator stops turning and pulses every ${r('motion.loading.duration', 'reduced')}ms, highlights fade as before (a fade is not movement).`,
      how: [`tokens.css switches to the reduced values when the reader's system asks for less motion (prefers-reduced-motion: reduce)`, `data-motion="reduced" (or "full") on <html> is the reader's own setting in the product; on any container it previews a mode`, 'Figma: a frame set to the Motion collection\'s reduced mode'],
      perJob: jobs.map((j) => ({ job: j.job, full: `${j.duration.full}ms${j.distance ? `, ${j.distance.full}px` : ''}`, reduced: `${j.duration.reduced}ms${j.distance ? `, ${j.distance.reduced}px` : ''}` })),
    },
    ready: [
      { what: 'Menus, popovers, tooltips, date pickers', html: `<div class="${p}-floating" popover id="menu">…</div> + <button popovertarget="menu">`, job: 'motion.floating', from: 'above, toward where it opens' },
      { what: 'Toasts', html: `<div class="${p}-floating" data-layer="toast" popover="manual" role="status">…</div>`, job: 'motion.floating', from: 'the bottom edge' },
      { what: 'Dialogs and sheets', html: `<dialog class="${p}-modal" aria-labelledby="…">…</dialog> opened with showModal()`, job: 'motion.modal', from: 'below: it rises into place while the scrim fades in' },
      { what: 'The navigation drawer', html: `<nav data-shell="nav" data-open> in .${p}-shell (below the breakpoint where it goes inline)`, job: 'motion.floating', from: 'its own side (the start side; flipped right to left)' },
    ],
    loading: { class: `${p}-loading`, turnMs: r('motion.loading.duration'), pulseMs: r('motion.loading.duration', 'reduced'), dim, indicatorMin: INDICATOR_MIN, rule: `Shows only while work runs and stops when it ends; after ${PAUSE_AFTER_MS / 1000} seconds, show progress in words or a bar. In reduced motion it pulses to ${dim} opacity — the lowest that keeps color.fg.icon ≥ ${INDICATOR_MIN}:1 on every surface` },
    highlight: { class: `${p}-highlight`, ms: r('motion.highlight.duration'), tint: 'color.bg.brand-subtle', rule: `Once per change, at most once per ${r('motion.highlight.duration')}ms; text on the tint stays ≥ 4.5:1 (M5)` },
    feedback: { css: `transition: background-color var(${cssName(p, 'motion.feedback.duration')}) var(${cssName(p, 'motion.feedback.easing')}), border-color var(${cssName(p, 'motion.feedback.duration')}) var(${cssName(p, 'motion.feedback.easing')}), color var(${cssName(p, 'motion.feedback.duration')}) var(${cssName(p, 'motion.feedback.easing')});`, tailwind: 'transition-colors (Tailwind\'s default duration and curve are motion.feedback in tailwind.theme.css)', ms: fb },
    classes: MOTION_CLASSES.map(([name, use, tw]) => ({ class: `${p}-${name}`, use, tailwind: tw.replace(/ds-/g, `${p}-`) })),
    limits: { reducedMaxMs: REDUCED_MAX_MS, maxDistance: MAX_DISTANCE, maxDuration: MAX_DURATION, peakSpeed: PEAK_SPEED_MAX, flashMinMs: MIN_FLASH_INTERVAL_MS, highlightMs: HIGHLIGHT_MS, loadingTurnMs: LOADING_TURN_MS, pulseMs: PULSE_MS, pauseAfterMs: PAUSE_AFTER_MS, indicatorMin: INDICATOR_MIN },
    build: { ok: report.ok, tokens: tokens.length, productJobs: productJobs.length, checks: report.checks.filter((c) => c.foundation === 'Motion').map((c) => ({ id: c.id, title: c.title, status: c.status, summary: c.summary })) },
    rules: MOTION_RULES.map(([id, rule, why, wcag]) => ({ id, rule, why, wcag })),
    decisions: MOTION_DECISIONS,
    tokens,
    mistakes: mistakes(sys),
  };
}

export function motionRulesMd(c) {
  const P = (s) => s.replace(/--ds-/g, `--${c.prefix}-`).replace(/\.ds-/g, `.${c.prefix}-`).replace(/\bds-(loading|highlight)\b/g, `${c.prefix}-$1`);
  const f = (s) => P(s).replace(/(motion\.[a-z]+(\.[a-z-]+)?|elevation\.[a-z]+|color\.bg\.[a-z-]+|\.[a-z]+-(floating|modal|loading|highlight)|data-layer="toast"|popover|showModal\(\)|dialog\.[a-z]+-modal)(?![a-z-])/g, (m) => code(m));
  let md = `# Motion rules for AI tools — ${c.system}\n\n`;
  md += `Generated from the engine (${c.build.tokens} tokens; ${c.jobs.length} jobs; ${c.build.ok ? 'all checks pass' : 'SOME CHECKS FAIL'}). The same data in machine-readable form: ${code('motion.contract.json')}.\n\n`;
  md += `## How to use this file\n1. Decide with the **Decision guide** whether it needs motion at all, then which job — by what is changing, not by how lively you want it.\n2. Take the whole job: its duration, curve and distance together — or the ready transition tokens.css already has (menus, popovers, toasts, dialogs, the drawer).\n3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.\n4. Before answering, run the **Self-check**.\n\n`;
  md += `## Hard rules\n` + table(['ID', 'Rule', 'Why', 'WCAG'], c.rules.map((x) => [x.id, P(tags(x.rule)), tags(x.why), x.wcag]));
  md += `\n## Decision guide\n`;
  for (const d of c.decisions) md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [tags(w), f(tags(s))]));
  md += `\n## Jobs\nFull motion, then reduced. Durations are computed from the distance (${c.rule.formula}).\n\n`;
  md += table(['Job', 'Duration (full · reduced)', 'Curve (full · reduced)', 'Distance (full · reduced)', 'Leaving (full · reduced)', 'Use'], c.jobs.map((j) => [code(`motion.${j.job}`) + (j.product ? ' (added for this product)' : ''),
    `${j.duration.full} · ${j.duration.reduced}ms`, `${j.easing.full} · ${j.easing.reduced}`, j.distance ? `${j.distance.full} · ${j.distance.reduced}px (${code(j.distance.space)})` : '—',
    j.exit ? `${j.exit.duration.full} · ${j.exit.duration.reduced}ms, ${j.exit.easing.full} · ${j.exit.easing.reduced}` : '—', tags(j.use)]));
  md += `\nIn CSS: ${code(`var(--${c.prefix}-motion-<job>-duration)`)}, ${code('-easing')}, ${code('-distance')}, ${code('-exit-duration')}, ${code('-exit-easing')}. In Tailwind: ${code('ease-<job>')}, ${code('ease-<job>-exit')}, ${code(`duration-(--${c.prefix}-motion-<job>-duration)`)}; plain ${code('transition-colors')} already uses the feedback job.\n\n`;
  md += `**Feedback, written out:** ${code(c.feedback.css)}\n`;
  md += `\n## Curves\n` + table(['Curve', 'Value', 'Speed at the start · end · fastest (× average)', 'Use'], c.curves.map((x) => [code(x.token), code(x.css), `${x.start} · ${x.end} · ${x.peak}`, x.use]));
  md += `\nNo curve goes faster than ${c.limits.peakSpeed}× its average speed, so no frame jumps. Leaving is arriving played backwards.\n`;
  md += `\n## Reduced motion\n${c.reduced.what}\n\n${c.reduced.how.map((x) => `- ${tags(x)}`).join('\n')}\n`;
  md += `\n## Ready transitions (tokens.css)\n` + table(['What', 'Markup', 'Job', 'Comes from'], c.ready.map((x) => [x.what, code(x.html), code(x.job), x.from]));
  md += `\nDon't add transitions of your own to these (MR-05). Browsers that can't animate an opening popover or dialog simply open and close it at once.\n`;
  md += `\n## Loading and highlights\n- ${code(`.${c.loading.class}`)}: one turn every ${c.loading.turnMs}ms. ${c.loading.rule}.\n- ${code(`.${c.highlight.class}`)}: a ${code(c.highlight.tint)} tint fading over ${c.highlight.ms}ms. ${c.highlight.rule}. To run it again, remove the class and add it back on the next frame.\n`;
  md += `\n## Classes\n` + table(['Class', 'What it does', 'Notes'], c.classes.map((x) => [code(`.${x.class}`), tags(x.use), tags(x.tailwind)]));
  md += `\n## Limits the build enforces\n` + table(['Limit', 'Value'], [
    ['Reduced', `no movement; transitions ≤ ${c.limits.reducedMaxMs}ms; the loading indicator pulses (M1)`],
    ['Flashes', `highlights ≥ ${c.limits.flashMinMs}ms; no loop faster than 3 changes a second (M2)`],
    ['Duration', `computed from distance; ≤ ${c.limits.maxDistance}px and ≤ ${c.limits.maxDuration}ms; leaving shorter than arriving; a loop turns at most once a second (M3)`],
    ['Curves', `≤ ${c.limits.peakSpeed}× the average speed; arriving lands at rest, leaving starts from rest (M4)`],
    ['Readable', `the loading pulse keeps ≥ ${c.limits.indicatorMin}:1; text on the highlight tint ≥ 4.5:1 (M5)`],
    ['Ready transitions', 'popovers, toasts, dialogs and the drawer animate both ways with tokens; focus rings never animate (M6)'],
  ]);
  md += `\n## Common mistakes (measured)\n` + table(['Mistake', 'Measured', 'Use instead'], c.mistakes.map((m) => [tags(m.mistake), tags(m.measured), `${/^(motion|\.|dialog|@)/.test(m.fix) ? code(P(m.fix)) : m.fix} — ${tags(P(m.fixValue))}`]));
  md += `\n## Self-check before answering\n- [ ] Each thing that moves needs to (people would miss something without it), and its job says what it does: feedback, change, floating, modal, highlight or loading.\n- [ ] Every duration and curve is a ${code(`var(--${c.prefix}-motion-<job>-…)`)}; no ms numbers, no ${code('ease-in-out')}, no ${code('cubic-bezier()')} by hand; no ${code('transition: all')}.\n- [ ] Movement is only ever a job's distance, on one axis — no scale, rotate, off-screen slides or animated layout.\n- [ ] Menus, popovers and toasts are ${code(`.${c.prefix}-floating`)} popovers and dialogs ${code(`dialog.${c.prefix}-modal`)} with ${code('showModal()')}, with no motion of their own.\n- [ ] With reduced motion nothing moves (every animation of your own has a reduced path or uses the tokens); nothing flashes; the only loop is ${code(`.${c.prefix}-loading`)}, and long waits show progress.\n- [ ] Focus rings, text being read and the page while scrolling never move; errors are messages, not shakes.\n- [ ] No motion variables redefined; ${code('data-motion')} only from the reader's setting.\n`;
  return md;
}
