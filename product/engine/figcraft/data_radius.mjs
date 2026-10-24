// Engine → data for the radius Figma file: variables (vars_radius.json: colour, type, spacing and radius) and computed
// numbers (data_radius.json). Usage: node figcraft/data_radius.mjs <outDir>   (run from the engine folder)
import fs from 'node:fs';
import path from 'node:path';
import { build } from '../src/build.js';
import { toRestVariables, typeRestVariables, spaceRestVariables, radiusRestVariables, mergeRest } from '../src/export/figma-rest.js';
import { typeContract } from '../src/export/ai-type.js';
import { radiusContract, RADIUS_CHAPTER, cornerGap, pokesOut } from '../src/export/ai-radius.js';
import { RADIUS_CHAPTERS } from '../src/export/guide-radius.js';
import { DENSITIES } from '../src/foundations/spacing.js';
import { STYLE_NAMES, MARK_SIZE, CORNER_SHARE, PILL_FROM, nestedRadius } from '../src/foundations/shape.js';

const out = process.argv[2] ?? 'figcraft/out-radius';
fs.mkdirSync(out, { recursive: true });
const { sys, cfg, report } = build();
const vars = mergeRest(toRestVariables(sys, cfg), typeRestVariables(sys, cfg), spaceRestVariables(sys, cfg), radiusRestVariables(sys, cfg));
fs.writeFileSync(path.join(out, 'vars_radius.json'), JSON.stringify(vars));
const tc = typeContract(sys, cfg, report);
const c = radiusContract(sys, cfg, report);
const r = (p, ctx) => sys.resolve(p, ctx);
const per = (p) => Object.fromEntries(STYLE_NAMES.map((s) => [s, r(p, { Shape: s })]));
const roles = Object.fromEntries(['none', 'mark', 'control', 'container', 'surface', 'pill', 'mark-focus', 'control-focus', 'container-focus', 'surface-focus'].map((j) => [j, per(`shape.${j}`)]));
const space = Object.fromEntries(['xs', 'sm', 'md', 'lg', 'xl'].map((s) => [s, Object.fromEntries(DENSITIES.map((d) => [d, r(`space.inset.${s}`, { Density: d })]))]));
const data = {
  system: sys.name, prefix: cfg.prefix, chapters: RADIUS_CHAPTERS, chapterName: RADIUS_CHAPTER, styles: STYLE_NAMES, defaultStyle: cfg.radius.style,
  densities: DENSITIES, defaultDensity: cfg.density.default,
  tokens: c.tokens, roles, scale: c.scale, nested: c.nested, decisions: c.decisions, rules: c.rules, mistakes: c.mistakes, limits: c.limits, focus: c.focus, space,
  control: Object.fromEntries(DENSITIES.map((d) => [d, r('size.control.height', { Density: d })])),
  markSize: MARK_SIZE, cornerShare: CORNER_SHARE, pillFrom: PILL_FROM,
  gaps: { even: cornerGap(12, 8, 4), step: cornerGap(12, 8, 8), copied: cornerGap(12, 8, 12), poke: pokesOut(12, 0, 0) },
  r3: report.checks.find((x) => x.id === 'R3').items.filter((i) => i.style === cfg.radius.style && i.density === cfg.density.default).map((i) => ({ item: i.item.replace(/^[a-z]+ · [a-z]+ · /, ''), ok: i.ok })),
  styles_: tc.styles.map((s) => ({ name: s.name, figma: s.figma, use: s.use, tabular: s.tabular, reading: s.reading, product: s.product })),
  checks: report.checks.filter((x) => x.foundation === 'Radius' || x.id === 'F2').map((x) => ({ id: x.id, title: x.title, wcag: x.wcag, level: x.level, status: x.status, summary: x.summary })),
  counts: { tokens: c.tokens.length, roles: c.roles.length },
};
fs.writeFileSync(path.join(out, 'data_radius.json'), JSON.stringify(data, null, 1));
console.log('radius tokens', data.counts.tokens, 'all variables', Object.keys(vars.meta.variables).length, '→', out);
