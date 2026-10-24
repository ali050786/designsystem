// Engine → data for the typography Figma file: variables (vars_type.json) and computed numbers (data_type.json).
// Usage: node figcraft/data_type.mjs <outDir>   (run from the engine folder)
import fs from 'node:fs';
import path from 'node:path';
import { build } from '../src/build.js';
import { toRestVariables, typeRestVariables, mergeRest } from '../src/export/figma-rest.js';
import { typeContract } from '../src/export/ai-type.js';
import { TYPE_CHAPTERS, TYPE_GROUPS } from '../src/export/guide-type.js';
import { sizeAt, KINDS, TRACKING, WEIGHTS, MIN_SIZE, READING_LH, TRACK_FROM } from '../src/foundations/typography.js';
import { BREAKPOINT_MIN } from '../src/foundations/layout.js';

const out = process.argv[2] ?? 'figcraft/out-type';
fs.mkdirSync(out, { recursive: true });
const { sys, cfg, report } = build();
const vars = mergeRest(toRestVariables(sys, cfg), typeRestVariables(sys, cfg));
fs.writeFileSync(path.join(out, 'vars_type.json'), JSON.stringify(vars));
const c = typeContract(sys, cfg, report);
const t = cfg.typography;
const steps = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8].map((st) => ({ step: st, sizes: Object.fromEntries(['sm', 'md', 'lg', 'xl'].map((bp) => [bp, sizeAt(t.baseSize, t.ratio[bp], st)])),
  stays: c.styles.filter((s) => !s.product && !s.scales && sys.get(s.name).meta.step === st).map((s) => s.name), moves: c.styles.filter((s) => !s.product && s.scales && sys.get(s.name).meta.step === st).map((s) => s.name) }));
const data = {
  system: sys.name, prefix: cfg.prefix, chapters: TYPE_CHAPTERS, groups: TYPE_GROUPS, base: t.baseSize, ratio: t.ratio, charWidth: t.charWidth,
  breakpoints: ['sm', 'md', 'lg', 'xl'].map((bp) => ({ name: bp, min: BREAKPOINT_MIN[bp], ratio: t.ratio[bp] })),
  styles: c.styles, steps, kinds: Object.entries(KINDS).map(([k, v]) => ({ kind: k, lh: v.lh, about: v.about })), tracking: TRACKING, weights: WEIGHTS,
  sizes: sys.byPrefix('font.size.').map((x) => x.values.Value), families: { sans: t.sans, mono: t.mono }, limits: c.limits, rules: c.rules, decisions: c.decisions, mistakes: c.mistakes, htmlDefaults: c.htmlDefaults,
  density: Object.fromEntries(['comfortable', 'default', 'compact'].map((d) => [d, { control: sys.resolve('size.control.height', { Density: d }), stack: sys.resolve('space.stack.md', { Density: d }) }])),
  measure: sys.resolve('layout.measure.reading'), minSize: MIN_SIZE, readingLh: READING_LH, trackFrom: TRACK_FROM,
  checks: report.checks.filter((x) => x.foundation === 'Typography' || x.id === 'L1').map((x) => ({ id: x.id, title: x.title, wcag: x.wcag, level: x.level, status: x.status, summary: x.summary })),
  counts: { styles: c.styles.length, variables: Object.values(vars.meta.variables).filter((v) => /^(font|type)\//.test(v.name)).length, prims: sys.byPrefix('font.').length },
};
fs.writeFileSync(path.join(out, 'data_type.json'), JSON.stringify(data, null, 1));
console.log('styles', data.counts.styles, 'type variables', data.counts.variables, 'all variables', Object.keys(vars.meta.variables).length, '→', out);
