// Engine → data for the border Figma file: variables (vars_border.json: colour, type, spacing, radius and border) and computed
// numbers (data_border.json). Usage: node figcraft/data_border.mjs <outDir>   (run from the engine folder)
import fs from 'node:fs';
import path from 'node:path';
import { build } from '../src/build.js';
import { toRestVariables, typeRestVariables, spaceRestVariables, radiusRestVariables, borderRestVariables, mergeRest } from '../src/export/figma-rest.js';
import { typeContract } from '../src/export/ai-type.js';
import { borderContract } from '../src/export/ai-border.js';
import { BORDER_CHAPTERS } from '../src/export/guide-border.js';
import { DENSITIES } from '../src/foundations/spacing.js';
import { borderWidths } from '../src/foundations/shape.js';

const out = process.argv[2] ?? 'figcraft/out-border';
fs.mkdirSync(out, { recursive: true });
const { sys, cfg, report } = build();
const vars = mergeRest(toRestVariables(sys, cfg), typeRestVariables(sys, cfg), spaceRestVariables(sys, cfg), radiusRestVariables(sys, cfg), borderRestVariables(sys, cfg));
fs.writeFileSync(path.join(out, 'vars_border.json'), JSON.stringify(vars));
const tc = typeContract(sys, cfg, report);
const c = borderContract(sys, cfg, report);
const job = (j) => c.jobs.find((x) => x.job === j);
const color = (j, name) => job(j).colors.find((x) => x.name === name);
const data = {
  system: sys.name, prefix: cfg.prefix, chapters: BORDER_CHAPTERS, densities: DENSITIES, defaultDensity: cfg.density.default, defaultStyle: cfg.radius.style,
  control: c.control, scale: c.scale, jobs: c.jobs, focus: c.focus, compensation: c.compensation, join: c.join, forcedColors: c.forcedColors,
  decisions: c.decisions, rules: c.rules, mistakes: c.mistakes, limits: c.limits, tokens: c.tokens,
  widths: Object.fromEntries([1, 2].map((n) => [String(n), borderWidths(n)])),
  // Ratios quoted in the examples, so no number on a page is typed by hand.
  quoted: { cardGreyOnField: color('line', 'color.border.default').onSurface, inputOnField: color('control', 'color.border.input').onSurface },
  styles_: tc.styles.map((s) => ({ name: s.name, figma: s.figma, use: s.use, tabular: s.tabular, reading: s.reading, product: s.product })),
  checks: report.checks.filter((x) => x.foundation === 'Border').map((x) => ({ id: x.id, title: x.title, wcag: x.wcag, level: x.level, status: x.status, summary: x.summary })),
  counts: { tokens: c.tokens.length, jobs: c.jobs.length },
};
fs.writeFileSync(path.join(out, 'data_border.json'), JSON.stringify(data, null, 1));
console.log('border tokens', data.counts.tokens, 'all variables', Object.keys(vars.meta.variables).length, '→', out);
