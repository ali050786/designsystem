// Engine → data for the spacing Figma file: variables (vars_space.json: colour, type and spacing) and computed numbers (data_space.json).
// Usage: node figcraft/data_space.mjs <outDir>   (run from the engine folder)
import fs from 'node:fs';
import path from 'node:path';
import { build } from '../src/build.js';
import { toRestVariables, typeRestVariables, spaceRestVariables, mergeRest } from '../src/export/figma-rest.js';
import { typeContract } from '../src/export/ai-type.js';
import { spaceContract, SPACE_CHAPTER } from '../src/export/ai-space.js';
import { SPACE_CHAPTERS } from '../src/export/guide-space.js';
import { SCALE, DENSITIES, LABEL_FOR, MIN_SPACE, LABEL_ROOM, TARGET_MIN, TARGET_ENHANCED, GRID_FROM, px, shift } from '../src/foundations/spacing.js';
import { REFLOW_WIDTH } from '../src/foundations/layout.js';

const out = process.argv[2] ?? 'figcraft/out-space';
fs.mkdirSync(out, { recursive: true });
const { sys, cfg, report } = build();
const vars = mergeRest(toRestVariables(sys, cfg), typeRestVariables(sys, cfg), spaceRestVariables(sys, cfg));
fs.writeFileSync(path.join(out, 'vars_space.json'), JSON.stringify(vars));
const tc = typeContract(sys, cfg, report);
const c = spaceContract(sys, cfg, report);
const r = (p, d) => sys.resolve(p, { Density: d });
// Where each primitive is used per density (the ladder slides along the scale).
const usedIn = (k, d) => {
  const who = [...sys.tokens.values()].filter((t) => t.collection === 'Density' && t.values[d] === `{space.${k}}`);
  return [...new Set(who.filter((t) => t.meta.spacing && !t.meta.product).map((t) => t.meta.size)), ...who.filter((t) => !t.meta.spacing).map((t) => t.path.replace(/^size\./, '').replace(/\./g, '/'))];
};
const links = (k) => [...sys.tokens.values()].filter((t) => ['Responsive', 'Border'].includes(t.collection) && Object.values(t.values).includes(`{space.${k}}`)).map((t) => t.path.replace(/\./g, '/'));
const label = Object.fromEntries(DENSITIES.map((d) => { const v = sys.resolve(LABEL_FOR[d], { Responsive: 'sm' }); return [d, { style: LABEL_FOR[d], size: v.fontSize, lh: v.lineHeight, room: (r('size.control.height', d) - v.lineHeight) / 2 }]; }));
const data = {
  system: sys.name, prefix: cfg.prefix, chapters: SPACE_CHAPTERS, chapterName: SPACE_CHAPTER, densities: DENSITIES, defaultDensity: cfg.density.default, step: c.densityRule.step, densityRule: c.densityRule.text,
  scale: SCALE.map((k) => ({ key: k, token: `space.${k}`, px: px(k), used: Object.fromEntries(DENSITIES.map((d) => [d, usedIn(k, d)])), links: links(k) })),
  tokens: c.tokens, families: c.families, ladder: c.ladder, decisions: c.decisions, rules: c.rules, mistakes: c.mistakes, layoutLinks: c.layoutLinks, label,
  limits: { minSpace: MIN_SPACE, labelRoom: LABEL_ROOM, targetMin: TARGET_MIN, targetEnhanced: TARGET_ENHANCED, gridFrom: GRID_FROM },
  margin: sys.resolve('layout.margin', { Responsive: 'sm' }), reflow: REFLOW_WIDTH, linkHex: sys.resolve('color.fg.link', { Color: 'Light' }),
  step2: { insetXs: px(shift('1', -2)), control: px(shift('10', -2)) },
  styles: tc.styles.map((s) => ({ name: s.name, figma: s.figma, use: s.use, tabular: s.tabular, reading: s.reading, product: s.product })),
  checks: report.checks.filter((x) => x.foundation === 'Spacing').map((x) => ({ id: x.id, title: x.title, wcag: x.wcag, level: x.level, status: x.status, summary: x.summary })),
  counts: { tokens: c.tokens.length, prims: SCALE.length, variables: c.tokens.length + SCALE.length },
};
fs.writeFileSync(path.join(out, 'data_space.json'), JSON.stringify(data, null, 1));
console.log('spacing tokens', data.counts.tokens, 'primitives', data.counts.prims, 'all variables', Object.keys(vars.meta.variables).length, '→', out);
