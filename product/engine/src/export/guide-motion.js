// Motion guide (Markdown) for people: the written version of the motion foundation's chapters.
// The words are fixed; every value, table and example number is computed from the build, so the guide can't drift
// from the tokens. Regenerate it with the build; never edit the output by hand.
import { MOTION_CHAPTER } from './ai-motion.js';
import { RESPONSE_MS, MS_PER_ROOT_PX, STEP_MS, REDUCED_MAX_MS, MAX_DISTANCE, MAX_DURATION, PEAK_SPEED_MAX, MIN_FLASH_INTERVAL_MS, PAUSE_AFTER_MS, INDICATOR_MIN, durationFor } from '../foundations/motion.js';

const code = (s) => `\`${s}\``;
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
const short = (p) => p.replace(/\./g, '/');
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m)).replace(/``/g, '`');
const slash = (x) => x.replace(/\b(space|motion|color|elevation)\.[a-z0-9.<>*-]*[a-z0-9>*]/g, (m) => (m === 'motion.jobs' ? m : short(m)));
const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);

export const MOTION_CHAPTERS = ['Five principles', MOTION_CHAPTER.built, MOTION_CHAPTER.jobs, MOTION_CHAPTER.duration, MOTION_CHAPTER.curves, MOTION_CHAPTER.reduced,
  MOTION_CHAPTER.opening, MOTION_CHAPTER.loops, MOTION_CHAPTER.still, 'Choosing motion', 'Readers\' settings and products'];

export function motionGuideMd(sys, cfg, report, contract) {
  const p = cfg.prefix;
  const tok = new Map(contract.tokens.map((t) => [t.name, t]));
  const r = (path, m = 'full') => sys.resolve(path, { Motion: m });
  const documented = [];
  const anchor = (title) => title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-');
  const see = (title) => `[${title}](#${anchor(title)})`;
  const chapter = (title) => `\n---\n\n## ${title}\n\n`;
  const rules = (items) => `\n**Rules**\n\n${items.map(([a, b]) => `- **${a}.** ${b}`).join('\n')}\n`;
  const checks = new Map(report.checks.map((c) => [c.id, c]));
  const mark = (paths) => { for (const x of paths) { if (!tok.has(x)) throw new Error(`guide: unknown token ${x}`); documented.push(x); } };
  const J = (job) => contract.jobs.find((j) => j.job === job);
  const mistake = (start) => contract.mistakes.find((m) => m.mistake.startsWith(start));
  const partsOf = (job) => contract.tokens.filter((t) => t.name.startsWith(`motion.${job}.`)).map((t) => t.name);
  const both = (path, unit = 'ms') => `${r(path)} · ${r(path, 'reduced')}${unit}`;
  const tokenRows = (job) => partsOf(job).map((n) => { const t = tok.get(n); const unit = t.type === 'duration' ? 'ms' : t.type === 'dimension' ? 'px' : ''; return [code(short(n)), t.type === 'cubicBezier' ? `${code(short(t.alias.full))} · ${code(short(t.alias.reduced))}` : `${t.full} · ${t.reduced}${unit}`, t.type === 'dimension' ? `${code(short(t.alias.full))} · ${code(short(t.alias.reduced))}` : code(t.cssVar)]; });

  let md = `# Motion\n\n`;
  md += `*${sys.name} foundations · motion · the written guide. Generated from the engine — ${contract.tokens.length} tokens, ${contract.jobs.length} jobs; ${report.checks.filter((c) => c.foundation === 'Motion').every((c) => c.status !== 'fail') ? 'every motion check passing' : 'SOME CHECKS FAILING'}. Do not edit by hand; change the engine config and build again.*\n\n`;
  md += `This guide explains how ${sys.name} moves things on screen: when something needs motion at all, the six jobs motion is chosen by, how long each takes (computed from how far it moves), the curves, what reduced motion does, how menus, dialogs, toasts and the drawer open and close, the loading indicator and highlights, and what never moves. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after ${see('Choosing motion')}; developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (${code('motion.md')}, ${code('motion.contract.json')}).\n\n`;
  md += `**Contents**\n\n${MOTION_CHAPTERS.map((c) => `- ${see(c)}`).join('\n')}\n`;

  // Five principles
  md += chapter('Five principles');
  md += `Five principles shape every job. Each one is checked by the build or the motion audit, not left to taste.\n\n`;
  md += table(['Principle', 'What it means in practice'], [
    ['**Motion explains a change**', 'It shows where something came from or went, or that something heard you. If nobody would miss it, nothing moves — the change happens at once.'],
    ['**Picked by job, not by speed**', `Six jobs named by what changes — feedback, change, floating, modal, highlight, loading. "Fast" or "300ms" tells nobody whether a menu should use it; "floating" does, and the job carries its duration, curve and distance together.`],
    ['**Time follows distance**', `A job's duration is computed from how far it moves: ${RESPONSE_MS}ms + ${MS_PER_ROOT_PX}ms × √px, rounded down to ${STEP_MS}ms. Leaving takes two thirds of arriving (M3: ${checks.get('M3').summary}).`],
    ['**Reduced means still**', `With reduced motion nothing moves: every distance is 0, transitions fade in ${REDUCED_MAX_MS}ms or less, the loading indicator pulses instead of turning (M1: ${checks.get('M1').summary}).`],
    ['**Nothing flashes, nothing runs on**', `No change faster than three a second (M2: ${checks.get('M2').summary}); the only loop is the loading indicator, shown while work runs; anything else that keeps moving has a pause.`],
  ]);

  // How tokens are built
  md += chapter(MOTION_CHAPTER.built);
  md += `Motion tokens live in one collection with two modes, and point into Primitives for every value.\n\n`;
  md += table(['Collection', 'Modes', 'Motion tokens in it', 'Changes with'], [
    ['**Motion**', 'full, reduced', `Per job: a duration (${code('motion/<job>/duration')}), a curve (${code('motion/<job>/easing')}), a distance where it moves (${code('motion/<job>/distance')}), and for what opens and closes the leaving duration and curve (${code('exit-duration')}, ${code('exit-easing')})`, `The reader's motion setting (${code('prefers-reduced-motion')}, ${code('data-motion')}), and the product's own jobs (${code('motion.jobs')})`],
    ['**Primitives**', 'one', `The durations the jobs use (${contract.durations.map((d) => code(short(d.token))).join(', ')}) and the four curves (${contract.curves.map((c) => code(short(c.token))).join(', ')})`, 'nothing: computed'],
    ['**Primitives** (Spacing foundation)', 'one', `What the distances link to: ${[...new Set(contract.jobs.filter((j) => j.distance).flatMap((j) => [j.distance.space, 'space.0']))].sort((a, b) => parseFloat(a.slice(6).replace('-', '.')) - parseFloat(b.slice(6).replace('-', '.'))).map((x) => code(short(x))).join(', ')}`, 'the spacing scale'],
  ]);
  md += `\n**Reading a name.** ${code('motion / floating / exit-duration')} — category ${code('motion')}, job ${code('floating')}, part ${code('exit-duration')}. Jobs are named by what changes; the floating and modal jobs share their names with the elevation levels they open and close.\n\n`;
  const eg = tok.get('motion.floating.duration'), ee = tok.get('motion.floating.easing');
  md += `**One name, three places.**\n\n` + table(['Figma', 'CSS variable', 'Tailwind'], [[code(eg.figma), code(eg.cssVar), code(eg.tailwind[0])], [code(ee.figma), code(ee.cssVar), code(ee.tailwind[0])]]);
  md += `\n**In Figma.** Durations are numbers in ms, distances numbers in px (links to the spacing scale), curves are text (${code('cubic-bezier(…)')}), so a token table can show them live. Figma can't bind a prototype transition to a variable, so each transition in the file carries the build's numbers, and every example comes in a full and a reduced frame — the reduced frame is set to the reduced mode, so its distances are 0.\n`;

  // Motion by job
  md += chapter(MOTION_CHAPTER.jobs);
  md += `Six jobs. Pick by what is changing; the duration, curve and distance come with the job.\n\n`;
  md += table(['Job', 'Use it for', 'Duration (full · reduced)', 'Distance', 'Comes and goes', 'Linked to'], contract.jobs.filter((j) => !j.product).map((j) => [code(`motion/${j.job}`), tags(j.use.replace(/ \(elevation\.[a-z]+\)$/, '')), `${j.duration.full} · ${j.duration.reduced}ms`, j.distance ? `${j.distance.full}px (reduced 0)` : '—', j.exit ? `leaves in ${j.exit.duration.full}ms` : j.kind === 'loop' ? 'runs while work runs' : j.kind === 'once' ? 'once' : 'in place', j.level ? code(short(j.level)) : '—']));
  md += `\nThe floating and modal jobs are in ${see(MOTION_CHAPTER.opening)}, highlight and loading in ${see(MOTION_CHAPTER.loops)}. The two everyday jobs:\n\n`;
  mark([...partsOf('feedback'), ...partsOf('change')]);
  md += `**Feedback** — the thing you touched answers. Colour, fill and border only; never movement, so it is the same in reduced motion.\n\n` + table(['Token', 'Full · reduced', 'CSS'], tokenRows('feedback'));
  md += `\n${code(contract.feedback.css)}\n\n`;
  md += `**Change** — content changing where it is: a panel opening, a tab panel, an item added or removed, a value replaced. It moves ${r('motion.change.distance')}px the way it grows, or only fades.\n\n` + table(['Token', 'Full · reduced', 'Links to / CSS'], tokenRows('change'));
  md += rules([['No motion for its own sake', 'A page that changes at once is fine. Motion is for a change people would otherwise miss or misread.'],
    ['Never by speed', `Don't reach for the "fastest" or "smoothest" duration: take the job. If no job fits, add one in the config (${see('Readers\' settings and products')}).`],
    ['Name the properties', `${code('transition: all')} animates the focus ring and the layout too (MR-02). List what changes: ${code('background-color')}, ${code('border-color')}, ${code('color')}, ${code('opacity')}, ${code('translate')}.`]]);

  // Duration follows distance
  md += chapter(MOTION_CHAPTER.duration);
  md += `Durations are not picked; they are computed from how far a job moves:\n\n**duration = ${RESPONSE_MS}ms + ${MS_PER_ROOT_PX}ms × √(distance in px), rounded down to ${STEP_MS}ms**\n\n`;
  md += table(['Distance', 'Computed', 'Duration', 'Jobs'], contract.rule.table.map((x) => [`${x.px}px`, `${(RESPONSE_MS + MS_PER_ROOT_PX * Math.sqrt(x.px)).toFixed(0)}ms`, `${x.ms}ms`, contract.jobs.filter((j) => (j.distance ? j.distance.full : (j.kind === 'in-place' ? 0 : -1)) === x.px && (j.kind === 'in-place' || j.kind === 'in-out')).map((j) => code(`motion/${j.job}`)).join(', ') || '—']));
  md += `\n**Why these numbers.** ${RESPONSE_MS}ms is the time within which an answer feels instant, so something that doesn't move (feedback) takes exactly that. Anything that moves needs a little longer, growing with the square root of the distance — as for anything that speeds up and slows down — so twice as far takes about 40% longer, not twice as long. Nothing travels more than ${MAX_DISTANCE}px, so nothing takes more than ${MAX_DURATION}ms: a bigger change fades instead of sliding.\n\n`;
  md += `**Leaving takes two thirds.** People watch something arrive; they have already moved on when it leaves. The leaving duration is two thirds of the arriving one, rounded down to ${STEP_MS}ms, never under ${RESPONSE_MS}ms: floating ${J('floating').duration.full} → ${J('floating').exit.duration.full}ms, modal ${J('modal').duration.full} → ${J('modal').exit.duration.full}ms.\n\n`;
  mark(contract.durations.map((d) => d.token));
  md += `**The durations in use** (Primitives, computed from the jobs — never used directly):\n\n` + table(['Primitive', 'Used by'], contract.durations.map((d) => [code(short(d.token)), d.usedBy.map((u) => code(short(u.replace(/ \(.*$/, ''))) + u.replace(/^[^ ]*/, '')).join('<br>')]));
  md += `\n*The highlight (${r('motion.highlight.duration')}ms) and the loading turn (${r('motion.loading.duration')}ms) don't move, so they follow their own rules: a highlight takes three flash intervals, a turn takes a second (${see(MOTION_CHAPTER.loops)}).*\n`;
  md += rules([['Exits are shorter', 'A menu that leaves slower than it came holds up the next thing people do (M3).'],
    ['No delays to stagger', `Items arriving one after another (a list "cascading" in) add up: ten items × 50ms is half a second of waiting. Bring a group in together, with ${code('motion/change')}.`]]);

  // Curves
  md += chapter(MOTION_CHAPTER.curves);
  md += `Four curves, each defined by how fast it moves at its start and its end, as a multiple of its average speed. None goes faster than ${PEAK_SPEED_MAX}×, so no single frame jumps (M4: ${checks.get('M4').summary}).\n\n`;
  mark(contract.curves.map((c) => c.token));
  md += table(['Curve', 'Value', 'Start · end · fastest', 'Use'], contract.curves.map((c) => [code(short(c.token)), code(c.css), `${c.start}× · ${c.end}× · ${c.peak}×`, c.use]));
  md += `\n**Arriving lands at rest; leaving starts from rest.** The enter curve starts at the speed limit and settles; the exit curve is the enter curve played backwards. Things that change in place start and land at rest. Linear is only for the loading turn — anywhere else it looks mechanical.\n\n`;
  md += `**Frame by frame.** What a screen at 60 frames a second draws for each job that moves:\n\n`;
  md += table(['Job', 'Frames', 'Largest step', 'First step'], contract.jobs.filter((j) => j.frames).flatMap((j) => [[code(`motion/${j.job}`) + ' arriving', String(j.frames.frames), `${f1(j.frames.largest)}px of ${j.frames.px}px`, `${f1(j.frames.first)}px`], ...(j.exitFrames ? [[code(`motion/${j.job}`) + ' leaving', String(j.exitFrames.frames), `${f1(j.exitFrames.largest)}px of ${j.exitFrames.px}px`, `${f1(j.exitFrames.first)}px`]] : [])]));
  const jump = mistake('A curve that starts');
  md += `\n**The common slip.** ${jump.mistake}: ${jump.measured}. Instead: ${code(short(jump.fix))} — ${jump.fixValue}.\n`;
  md += rules([['No springs or bounces', 'A curve that overshoots moves past where things belong and back — more movement for no meaning, and not something reduced motion can turn into a fade.'],
    ['Curves come from the job', `Never ${code('ease')}, ${code('ease-in-out')} or a ${code('cubic-bezier()')} of your own (MR-01); Tailwind's ${code('ease-in')}, ${code('ease-out')} and ${code('ease-in-out')} are removed from the theme.`]]);

  // Reduced motion
  md += chapter(MOTION_CHAPTER.reduced);
  md += `Reduced motion is a mode, not an afterthought: every job has a reduced value, and ${sys.name}'s ready transitions switch by themselves. Reduced means **fade only** — no job moves, transitions fade in ${REDUCED_MAX_MS}ms or less, the loading indicator stops turning, and highlights fade as before (a fade is not movement).\n\n`;
  md += table(['Job', 'Full', 'Reduced'], contract.jobs.filter((j) => !j.product).map((j) => [code(`motion/${j.job}`), `${j.duration.full}ms${j.distance ? `, moves ${j.distance.full}px` : ''}${j.exit ? `, leaves in ${j.exit.duration.full}ms` : ''}${j.kind === 'loop' ? ', turns' : ''}`, `${j.duration.reduced}ms${j.distance ? ', fades in place' : ''}${j.exit ? `, leaves in ${j.exit.duration.reduced}ms` : ''}${j.kind === 'loop' ? `, pulses (never below ${INDICATOR_MIN}:1)` : ''}`]));
  md += `\n**How it is switched.**\n\n${contract.reduced.how.map((x) => `- ${tags(x)}`).join('\n')}\n\n`;
  md += `A product that offers its own setting writes it to ${code('<html>')} and remembers it; with nothing set, the system setting decides:\n\n`;
  md += '```html\n' + `<label>Motion\n  <select id="motion">\n    <option value="">Same as my device</option>\n    <option value="reduced">Reduced</option>\n    <option value="full">Full</option>\n  </select>\n</label>\n<script>\n  const s = document.getElementById('motion');\n  s.value = localStorage.getItem('motion') ?? '';\n  const apply = () => { s.value ? document.documentElement.dataset.motion = s.value : delete document.documentElement.dataset.motion; localStorage.setItem('motion', s.value); };\n  s.addEventListener('change', apply); apply();\n</script>` + '\n```\n';
  md += rules([['Keep one clear signal', 'In reduced motion a change still shows: it fades. Removing the change altogether hides it.'],
    ['Your own animations too', `Anything you animate outside the tokens needs its own reduced path — or it keeps moving for the people who asked it to stop (MR-03, MR-04).`],
    ['Never force full motion', `${code('data-motion="full"')} comes only from the reader's own choice, never as a default (MR-10).`]]);

  // Opening and closing
  md += chapter(MOTION_CHAPTER.opening);
  md += `What opens over the page moves with the job of its elevation level: ${code('motion/floating')} for menus, popovers, tooltips, toasts and the drawer, ${code('motion/modal')} for dialogs. tokens.css already does it — open them the way the Elevation foundation says and they animate, both ways, and only fade in reduced motion.\n\n`;
  mark([...partsOf('floating'), ...partsOf('modal')]);
  md += table(['Token', 'Full · reduced', 'Links to / CSS'], [...tokenRows('floating'), ...tokenRows('modal')]);
  md += `\n` + table(['What', 'Markup', 'Comes from'], contract.ready.map((x) => [x.what, code(x.html), x.from]));
  md += `\n**How it works.** A popover or dialog starts from its "before" look (${code('@starting-style')}: transparent, the job's distance away) and moves to its resting place with the job's duration and curve. When it closes, it goes back the other way with the leaving duration and curve, and ${code('display')} and ${code('overlay')} transition with ${code('allow-discrete')} so it stays shown — and in the top layer — until it has faded. The scrim fades with its dialog. Browsers that can't do this simply open and close at once.\n\n`;
  const off = mistake('A dialog sliding');
  md += `**The common slip.** ${off.mistake}: ${off.measured}. With ${code(`dialog.${p}-modal`)}: ${off.fixValue}.\n`;
  md += rules([['Nothing of your own on top', `Don't add transitions or animations to ${code(`.${p}-floating`)} popovers or ${code(`dialog.${p}-modal`)}, and don't animate them with JavaScript (MR-05).`],
    ['Focus moves at once', 'Moving focus into a dialog or menu happens when it opens, not when its animation ends — the animation is only how it looks.'],
    ['Leaving never blocks', `A closing menu doesn't hold up the next click: it leaves in ${J('floating').exit.duration.full}ms and is out of the way of the pointer from the start.`]]);

  // Loading and highlights
  md += chapter(MOTION_CHAPTER.loops);
  md += `Two jobs that aren't about something arriving: the loading indicator, which runs while work runs, and the highlight, which draws the eye to a change once.\n\n`;
  mark([...partsOf('loading'), ...partsOf('highlight')]);
  md += table(['Token', 'Full · reduced', 'CSS'], [...tokenRows('loading'), ...tokenRows('highlight')]);
  md += `\n**Loading** (${code(`.${p}-loading`)}): one turn every ${contract.loading.turnMs}ms. ${contract.loading.rule} (M5: ${checks.get('M5').summary}).\n\n`;
  md += '```html\n' + `<p role="status"><svg class="${p}-loading" aria-hidden="true" …></svg> Saving…</p>` + '\n```\n\n';
  md += `**Highlight** (${code(`.${p}-highlight`)}): a ${code(short(contract.highlight.tint))} tint that fades over ${contract.highlight.ms}ms, back to the element's own background. ${contract.highlight.rule}. To run it again, remove the class and add it back on the next frame:\n\n`;
  md += '```js\n' + `el.classList.remove('${p}-highlight');\nrequestAnimationFrame(() => el.classList.add('${p}-highlight'));` + '\n```\n\n';
  md += `**Flashes.** More than three flashes in a second can trigger seizures (WCAG 2.3.1). A highlight is one change over ${r('motion.highlight.duration')}ms; the reduced loading pulse is one every ${r('motion.loading.duration', 'reduced')}ms; nothing in ${sys.name} changes brightness faster than once every ${MIN_FLASH_INTERVAL_MS}ms.\n\n`;
  const sk = mistake('A skeleton'), sp = mistake('A spinner');
  md += `**The common slips.** ${sp.mistake}: ${sp.measured}. ${sk.mistake}: ${sk.measured}. Use ${code(`.${p}-loading`)} — ${sp.fixValue}.\n`;
  md += rules([['One loop', `${code(`.${p}-loading`)} is the only animation that runs on. Anything else that keeps moving — a carousel, an animated illustration — needs a pause or stop control, or stops within ${PAUSE_AFTER_MS / 1000} seconds (WCAG 2.2.2, MR-06).`],
    ['Progress after five seconds', `Work that can take longer than ${PAUSE_AFTER_MS / 1000} seconds shows progress in words or a bar; a spinner alone says nothing about how long.`],
    ['Highlight once', 'Never on every tick of a value that updates many times a second; never as a blink or a pulse that repeats (MR-08).']]);

  // What never moves
  md += chapter(MOTION_CHAPTER.still);
  md += `Some things must stay still for people to read, steer and find their place. The motion checker and audit look for each of these.\n\n`;
  md += table(['Never', 'Because', 'Instead'], [
    ['The focus ring animating in', 'For its first frames it isn\'t there; keyboard users lose their place', 'It appears at once — tokens.css draws it and no transition list includes outline (M6)'],
    ['Text moving while it is read', 'Auto-advancing carousels, rolling digits and marquees move the words out from under the reader', 'Changes happen when the reader asks; a changed value gets one highlight'],
    ['Movement tied to scrolling', 'Parallax and scroll-linked effects are the strongest trigger of motion sickness on the web', 'Content scrolls; nothing else moves with it'],
    [`${code('scroll-behavior: smooth')} for everyone`, mistake('scroll-behavior').measured, `put it inside ${code('@media (prefers-reduced-motion: no-preference)')}`],
    ['A shaking field', mistake('Shaking').measured, mistake('Shaking').fixValue],
    ['Autoplay', 'A video or carousel that starts by itself moves beside the content people came for', 'It waits to be started, or has a pause control in reach (WCAG 2.2.2)'],
  ]);
  md += rules([['Scale, rotate and skew', 'Only the loading indicator turns. Nothing else grows, shrinks or spins to make a point: a change of size reads as movement toward or away from the reader.'],
    ['Nothing from off the screen', `The longest move is ${MAX_DISTANCE}px; a dialog doesn't slide up the whole window, a drawer doesn't sweep across it.`]]);

  // Choosing motion
  md += chapter('Choosing motion');
  md += `Four questions: *does it need motion at all?*, *which job?*, *which way does it move?* and *what must never move?*\n`;
  for (const d of contract.decisions) {
    md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [tags(w), tags(slash(s).replace(/\.ds-/g, `.${p}-`).replace(/\bdialog\.ds-/g, `dialog.${p}-`)).replace(/((motion|elevation|space|color)\/[a-z0-9/<>*-]+[a-z0-9>*]|\.[a-z]+-(floating|modal|loading|highlight)|dialog\.[a-z]+-modal|data-layer="toast"|showModal\(\)|motion\.jobs|popover)(?![a-z-])/g, (m) => code(m))]));
  }
  md += `\n**Worked example — a project page.** One part at a time:\n\n`;
  md += table(['Part', 'Job', 'What people see'], [
    ['Hovering a project card', code('motion/feedback'), `The card's fill changes in ${r('motion.feedback.duration')}ms; nothing moves.`],
    ['The card\'s "more" menu', `${code('motion/floating')} · a ${code(`.${p}-floating`)} popover`, `It drops ${r('motion.floating.distance')}px into place in ${r('motion.floating.duration')}ms and leaves in ${r('motion.floating.exit-duration')}ms.`],
    ['"Delete project?"', `${code('motion/modal')} · ${code(`dialog.${p}-modal`)}`, `It rises ${r('motion.modal.distance')}px in ${r('motion.modal.duration')}ms while the scrim fades in.`],
    ['The card disappearing from the list', code('motion/change'), `It fades and moves ${r('motion.change.distance')}px up in ${r('motion.change.duration')}ms; the cards after it close the gap at once.`],
    ['"Project deleted" toast', `${code('motion/floating')} · ${code('data-layer="toast"')}`, `It comes up ${r('motion.floating.distance')}px from the bottom.`],
    ['The open-task count updating', `${code('motion/highlight')} · ${code(`.${p}-highlight`)}`, `The number's tint fades over ${r('motion.highlight.duration')}ms, once.`],
    ['Saving', `${code('motion/loading')} · ${code(`.${p}-loading`)}`, 'The indicator turns until the save ends; after five seconds a line says how far it got.'],
    ['All of it, with reduced motion', 'the reduced mode', `Every one of these fades in place in ${REDUCED_MAX_MS}ms or less; the indicator pulses.`],
  ]);
  md += `\n**Do and avoid** (measured in this build)\n\n`;
  md += table(['Avoid', 'Measured', 'Do'], contract.mistakes.map((m) => [tags(slash(m.mistake)), tags(slash(m.measured)), `${/^(motion|\.|dialog|@)/.test(m.fix) ? code(slash(m.fix).replace(/\.ds-/, `.${p}-`).replace(/dialog\.ds-/, `dialog.${p}-`)) : m.fix} — ${tags(slash(m.fixValue).replace(/--ds-/g, `--${p}-`).replace(/\.ds-/g, `.${p}-`))}`]));

  // Readers' settings and products
  md += chapter('Readers\' settings and products');
  md += `People ask their system for less motion, zoom, enlarge text and switch to forced colours; products add jobs of their own. Motion is built so none of that breaks.\n\n`;
  md += `**Reduced motion.** The system setting (${code('prefers-reduced-motion')}) switches every job to its reduced value, unless the reader chose otherwise in the product (${code('data-motion')} on ${code('<html>')}); see ${see(MOTION_CHAPTER.reduced)}. The motion audit runs every page both ways and measures what still moves.\n\n`;
  md += `**Zoom and bigger text (WCAG 1.4.4, 1.4.10).** Distances are px and scale with zoom like everything else; durations don't change. Nothing in ${sys.name} animates size or layout, so text growing never sets anything moving.\n\n`;
  md += `**Forced colours.** Animations still run in forced colours; the ready transitions only move and fade, so nothing depends on a colour the system replaces.\n\n`;
  const prod = contract.jobs.filter((j) => j.product);
  if (prod.length) md += `**Jobs added for this product**\n\n` + table(['Job', 'Kind', 'Distance', 'Duration (full · reduced)', 'Leaving', 'Use'], prod.map((j) => [code(`motion/${j.job}`), j.kind, j.distance ? `${j.distance.full}px` : '—', `${j.duration.full} · ${j.duration.reduced}ms`, j.exit ? `${j.exit.duration.full}ms` : '—', tags(j.use)])) + '\n';
  md += `**Adding a job.** Most motion fits one of the six. If a product needs another (a carousel slide, a bottom sheet), name it by what moves, say whether it changes in place or arrives and leaves, and how far it moves on the spacing scale; the build computes the duration (${durationFor(24)}ms for 24px), the curves and the reduced mode, and refuses durations, curves, names by look or speed, loops and anything further than ${MAX_DISTANCE}px:\n\n`;
  md += '```json\n' + JSON.stringify({ motion: { jobs: [{ name: 'motion.carousel', kind: 'in-place', distance: 'space.6', description: 'Slides of a carousel the reader steps through' }] } }, null, 2) + '\n```\n\n';
  md += `Durations and curves are not config choices: they are computed, so every product gets the same checked motion.\n`;

  // Reference
  md += `\n---\n\n## Accessibility reference\n\nWhat the build checks for motion, and the result for this build:\n\n`;
  md += table(['Check', 'What it checks', 'WCAG', 'Result'], report.checks.filter((c) => c.foundation === 'Motion').map((c) => [c.id, c.title, `${c.wcag} (${c.level})`, `${c.status} · ${c.summary}`]));
  md += `\n*WCAG 2.3.3 (Animation from Interactions) is a AAA criterion; ${sys.name} holds it as a rule, so M1 fails the build like an AA check.*\n`;
  md += `\nWhat the checkers look for in your own code and pages: the motion checker (${code('npm run lint:motion')}) reads CSS, HTML and JSX; the motion audit (${code('npm run audit:motion')}) renders a page with full and reduced motion at 1280 and 320px, hovers, opens every popover, dialog and ${code('--open')} selector, records every animation frame by frame, and fails movement in reduced motion, flashes, loops that never stop, focus rings that animate and transitions that don't come from a job. See the [handoff](HANDOFF.md).\n\n`;
  md += `**Glossary**\n\n`;
  md += table(['Term', 'Meaning'], [['Job', 'What a motion does (feedback, change, floating, modal, highlight, loading); it decides duration, curve and distance.'], ['Distance', 'How far something moves while it arrives or changes, on the spacing scale; 0 in reduced motion.'],
    ['Curve (easing)', 'How speed changes over the duration: arriving settles, leaving speeds up, changing in place does both.'], ['Reduced motion', 'A mode the reader asks for: nothing moves, changes fade.'],
    ['Flash', 'A pair of opposite changes in brightness; more than three a second can trigger seizures.'], ['Top layer', 'A browser layer above every z-index, for dialogs and popovers — they stay there while they animate out.']]);

  // Every built-in token documented exactly once.
  const all = contract.tokens.filter((t) => !t.product).map((t) => t.name);
  const missing = all.filter((n) => !documented.includes(n));
  const dupes = documented.filter((n, i) => documented.indexOf(n) !== i);
  if (missing.length || dupes.length) throw new Error(`guide: motion tokens missing ${missing.join(', ')} / duplicated ${dupes.join(', ')}`);
  return md;
}
