// Engine → data for the elevation Figma file: variables (vars_elevation.json: colour, type, spacing, radius, border and
// elevation) and computed numbers (data_elevation.json). Usage: node figcraft/data_elevation.mjs <outDir>   (run from the engine folder)
import fs from 'node:fs';
import path from 'node:path';
import { build } from '../src/build.js';
import { toRestVariables, typeRestVariables, spaceRestVariables, radiusRestVariables, borderRestVariables, elevationRestVariables, mergeRest } from '../src/export/figma-rest.js';
import { typeContract } from '../src/export/ai-type.js';
import { elevationContract } from '../src/export/ai-elevation.js';
import { ELEVATION_CHAPTERS } from '../src/export/guide-elevation.js';
import { contrast, composite } from '../src/color-math.js';

const out = process.argv[2] ?? 'figcraft/out-elevation';
fs.mkdirSync(out, { recursive: true });
const { sys, cfg, report } = build();
const vars = mergeRest(toRestVariables(sys, cfg), typeRestVariables(sys, cfg), spaceRestVariables(sys, cfg), radiusRestVariables(sys, cfg), borderRestVariables(sys, cfg), elevationRestVariables(sys, cfg));
fs.writeFileSync(path.join(out, 'vars_elevation.json'), JSON.stringify(vars));
const tc = typeContract(sys, cfg, report);
const c = elevationContract(sys, cfg, report);
const r = (p, m) => sys.resolve(p, m ? { Color: m } : {});
const op = (x) => x.slice(0, 7);
const alpha = (hex) => (hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1);
const scrimOver = (m) => composite('#000000', alpha(r('elevation.modal.scrim', m)), op(r('elevation.page.surface', m)));
const data = {
  system: sys.name, prefix: cfg.prefix, chapters: ELEVATION_CHAPTERS, defaultDensity: cfg.density.default, defaultStyle: cfg.radius.style,
  levels: c.levels, layers: c.layers, layerStep: c.layerStep, shadowFormula: c.shadowFormula, edges: c.edges,
  // Each Dark step against the level below it, measured directly (not as a ratio of two rounded ratios).
  dark: { ...c.dark, steps: c.dark.steps.map((st, i, a) => ({ ...st, overBelow: i ? +contrast(st.dark, a[i - 1].dark).toFixed(2) : null })) }, topLayer: c.topLayer,
  modal: c.modal, forcedColors: c.forcedColors, classes: c.classes, decisions: c.decisions, rules: c.rules, mistakes: c.mistakes, limits: c.limits, tokens: c.tokens,
  // Ratios quoted on the pages, so no number on a page is typed by hand.
  quoted: {
    modalOnScrim: Object.fromEntries(['Light', 'Dark'].map((m) => [m, +contrast(op(r('elevation.modal.surface', m)), scrimOver(m)).toFixed(2)])),
    edgeOnScrim: Object.fromEntries(['Light', 'Dark'].map((m) => [m, +contrast(op(r('elevation.modal.border', m)), scrimOver(m)).toFixed(2)])),
    cardOnScrimDark: +contrast(op(r('color.bg.surface', 'Dark')), scrimOver('Dark')).toFixed(2),
    hoverOnCard: +contrast(op(r('color.bg.surface-hover', 'Light')), op(r('color.bg.surface', 'Light'))).toFixed(2),
  },
  styles_: tc.styles.map((s) => ({ name: s.name, figma: s.figma, use: s.use, tabular: s.tabular, reading: s.reading, product: s.product })),
  checks: report.checks.filter((x) => x.foundation === 'Elevation').map((x) => ({ id: x.id, title: x.title, wcag: x.wcag, level: x.level, status: x.status, summary: x.summary })),
  counts: { tokens: c.tokens.length, levels: c.levels.length, layers: c.layers.length },
};
fs.writeFileSync(path.join(out, 'data_elevation.json'), JSON.stringify(data, null, 1));
console.log('elevation tokens', data.counts.tokens, 'all variables', Object.keys(vars.meta.variables).length, '→', out);
