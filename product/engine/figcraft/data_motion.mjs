// Engine → data for the motion Figma file: variables (vars_motion.json: colour, type, spacing, radius, border, elevation
// and motion) and computed numbers (data_motion.json): curves as SVG paths, speeds, frames, the duration rule, pulse and
// highlight samples. Usage: node figcraft/data_motion.mjs <outDir>   (run from the engine folder)
import fs from 'node:fs';
import path from 'node:path';
import { build } from '../src/build.js';
import { toRestVariables, typeRestVariables, spaceRestVariables, radiusRestVariables, borderRestVariables, elevationRestVariables, motionRestVariables, mergeRest } from '../src/export/figma-rest.js';
import { typeContract } from '../src/export/ai-type.js';
import { motionContract } from '../src/export/ai-motion.js';
import { elevationContract } from '../src/export/ai-elevation.js';
import { MOTION_CHAPTERS } from '../src/export/guide-motion.js';
import { bezierAt, framesOf, durationFor, RESPONSE_MS, MS_PER_ROOT_PX, STEP_MS, FRAME_MS } from '../src/foundations/motion.js';

const out = process.argv[2] ?? 'figcraft/out-motion';
fs.mkdirSync(out, { recursive: true });
const { sys, cfg, report } = build();
const vars = mergeRest(toRestVariables(sys, cfg), typeRestVariables(sys, cfg), spaceRestVariables(sys, cfg), radiusRestVariables(sys, cfg), borderRestVariables(sys, cfg), elevationRestVariables(sys, cfg), motionRestVariables(sys, cfg));
fs.writeFileSync(path.join(out, 'vars_motion.json'), JSON.stringify(vars));
const tc = typeContract(sys, cfg, report);
const c = motionContract(sys, cfg, report);
const ec = elevationContract(sys, cfg, report);
const modes = sys.collections.get('Motion').modes;
const r = (p, m = modes[0]) => sys.resolve(p, { Motion: m });

/** Progress at an even time t (0…1) for a curve — the curve is x(s), y(s); solve x(s) = t. */
const at = (cv, t) => bezierAt(cv, t);
/** A curve drawn in a box of size W×H, time to the right, progress up: the CSS cubic-bezier is an SVG cubic. */
const svgCurve = ([x1, y1, x2, y2], W, H) => `M 0 ${H} C ${+(x1 * W).toFixed(2)} ${+((1 - y1) * H).toFixed(2)} ${+(x2 * W).toFixed(2)} ${+((1 - y2) * H).toFixed(2)} ${W} 0`;
/** Speed over time as a multiple of the average speed, sampled. */
const speeds = (cv, n = 120) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, d = 1 / 2000; const a = at(cv, Math.max(0, t - d)), b = at(cv, Math.min(1, t + d)); return [+t.toFixed(4), +((b - a) / (Math.min(1, t + d) - Math.max(0, t - d))).toFixed(4)]; });

const CW = 220, CH = 160, SW = 220, SH = 72;
const curves = c.curves.map((cv) => {
  const sp = speeds(cv.value);
  const top = 2.5; // the speed limit is the chart's top
  return { ...cv, path: svgCurve(cv.value, CW, CH), box: [CW, CH], speed: sp.map(([t, v]) => [+(t * SW).toFixed(2), +(SH - Math.min(v, top + 0.4) / (top + 0.4) * SH).toFixed(2)]), speedBox: [SW, SH], limitY: +(SH - top / (top + 0.4) * SH).toFixed(2), averageY: +(SH - 1 / (top + 0.4) * SH).toFixed(2) };
});

// The duration rule, sampled for the chart: the computed value and the step it rounds down to.
const rule = { ...c.rule, samples: Array.from({ length: 33 }, (_, px) => ({ px, computed: +(RESPONSE_MS + MS_PER_ROOT_PX * Math.sqrt(px)).toFixed(1), ms: durationFor(px) })) };

// Frames for the slip: a curve that starts at full speed.
const jump = [0, 0, 0, 1];
const fr = (cv, ms) => framesOf(cv, ms).map((x) => +x.progress.toFixed(4));
const slip = {
  curve: jump, css: 'cubic-bezier(0, 0, 0, 1)', path: svgCurve(jump, CW, CH),
  modal: { ms: r('motion.modal.duration'), px: r('motion.modal.distance'), progress: fr(jump, r('motion.modal.duration')) },
  modalEnter: { ms: r('motion.modal.duration'), px: r('motion.modal.distance'), progress: fr(r('motion.modal.easing'), r('motion.modal.duration')) },
};

// Reduced fades, frame by frame (opacity only).
const reducedFrames = Object.fromEntries(['change', 'floating', 'modal'].map((j) => [j, { ms: r(`motion.${j}.duration`, 'reduced'), progress: fr(r(`motion.${j}.easing`, 'reduced'), r(`motion.${j}.duration`, 'reduced')) }]));

// Loading: the turn every 100ms (full) and the pulse every 200ms (reduced, standard curve each half, to the computed floor).
const turnMs = r('motion.loading.duration'), pulseMs = r('motion.loading.duration', 'reduced'), dim = c.loading.dim;
const pulseCurve = r('motion.loading.easing', 'reduced');
const pulseAt = (t) => { const h = t <= pulseMs / 2 ? t / (pulseMs / 2) : (t - pulseMs / 2) / (pulseMs / 2); const p = at(pulseCurve, Math.min(1, h)); return t <= pulseMs / 2 ? 1 - (1 - dim) * p : dim + (1 - dim) * p; };
const loading = { ...c.loading, turnMs, pulseMs, turn: Array.from({ length: 10 }, (_, i) => ({ t: i * turnMs / 10, deg: i * 36 })), pulse: Array.from({ length: 11 }, (_, i) => ({ t: i * pulseMs / 10, opacity: +pulseAt(i * pulseMs / 10).toFixed(3) })) };
// Highlight: the tint left at every 100ms (the exit curve takes it away).
const hiMs = r('motion.highlight.duration'), hiCurve = r('motion.highlight.easing');
const highlight = { ...c.highlight, samples: Array.from({ length: 11 }, (_, i) => ({ t: i * hiMs / 10, tint: +(1 - at(hiCurve, i / 10)).toFixed(3) })) };
// A focus ring that transitions in (the slip) over 250ms with ease, frame by frame (opacity of the ring).
const ease = [0.25, 0.1, 0.25, 1];
const ringSlip = { ms: 250, frames: framesOf(ease, 250).filter((_, i) => i % 2 === 1).map((x) => ({ t: Math.round(x.t), opacity: +x.progress.toFixed(3) })) };

const data = {
  system: sys.name, prefix: cfg.prefix, chapters: MOTION_CHAPTERS, modes, defaultDensity: cfg.density.default, defaultStyle: cfg.radius.style, frameMs: FRAME_MS, stepMs: STEP_MS,
  jobs: c.jobs, curves, durations: c.durations, rule, reduced: c.reduced, ready: c.ready, loading, highlight, feedback: c.feedback, classes: c.classes,
  levels: ec.levels, limits: c.limits, decisions: c.decisions, rules: c.rules, mistakes: c.mistakes, tokens: c.tokens, slip, reducedFrames, ringSlip,
  styles_: tc.styles.map((s) => ({ name: s.name, figma: s.figma, use: s.use, tabular: s.tabular, reading: s.reading, product: s.product })),
  checks: report.checks.filter((x) => x.foundation === 'Motion').map((x) => ({ id: x.id, title: x.title, wcag: x.wcag, level: x.level, status: x.status, summary: x.summary })),
  counts: { tokens: c.tokens.length, jobs: c.jobs.length, curves: c.curves.length },
};
fs.writeFileSync(path.join(out, 'data_motion.json'), JSON.stringify(data, null, 1));
console.log('motion tokens', data.counts.tokens, 'modes', modes, 'all variables', Object.keys(vars.meta.variables).length, 'checks', data.checks.map((x) => x.id).join(' '), '→', out);
