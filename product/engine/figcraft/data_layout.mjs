// Engine → data for the layout Figma file: variables (vars_layout.json: colour, type, spacing and layout) and computed numbers
// (data_layout.json). Usage: node figcraft/data_layout.mjs <outDir>   (run from the engine folder)
import fs from 'node:fs';
import path from 'node:path';
import { build } from '../src/build.js';
import { toRestVariables, typeRestVariables, spaceRestVariables, layoutRestVariables, mergeRest } from '../src/export/figma-rest.js';
import { typeContract } from '../src/export/ai-type.js';
import { layoutContract, LAYOUT_CHAPTER, charsPerLine } from '../src/export/ai-layout.js';
import { LAYOUT_CHAPTERS } from '../src/export/guide-layout.js';
import { BREAKPOINTS } from '../src/foundations/typography.js';
import { DENSITIES } from '../src/foundations/spacing.js';
import { BREAKPOINT_MIN, REFLOW_WIDTH, REFLOW_HEIGHT, MIN_COLUMN, HEADER_ROOM, STICKY_SHARE, STICKY_FROM_EM, DRAWER_STRIP, MEASURE_REM, LIMITS, narrowest, spansFor } from '../src/foundations/layout.js';

const out = process.argv[2] ?? 'figcraft/out-layout';
fs.mkdirSync(out, { recursive: true });
const { sys, cfg, report } = build();
const vars = mergeRest(toRestVariables(sys, cfg), typeRestVariables(sys, cfg), spaceRestVariables(sys, cfg), layoutRestVariables(sys, cfg));
fs.writeFileSync(path.join(out, 'vars_layout.json'), JSON.stringify(vars));
const tc = typeContract(sys, cfg, report);
const c = layoutContract(sys, cfg, report);
const r = (p, ctx) => sys.resolve(p, ctx);
const cw = cfg.typography.charWidth;
const body = r('type.body.md', { Responsive: 'sm' }).fontSize;
const measure = r('layout.measure.reading');
const tile = r('layout.tile.min');
const gapD = r('space.inline.lg', { Density: cfg.density.default });
const data = {
  system: sys.name, prefix: cfg.prefix, chapters: LAYOUT_CHAPTERS, chapterName: LAYOUT_CHAPTER, densities: DENSITIES, defaultDensity: cfg.density.default,
  breakpoints: c.breakpoints.map((b) => ({ ...b, use: { sm: 'Phones, and any window at 400% zoom', md: 'Large phones on their side, small tablets', lg: 'Tablets on their side, laptops — the navigation pane opens', xl: 'Desktops — the supporting pane opens; the page reaches its widest' }[b.name], spans: spansFor(b.columns) })),
  tokens: c.tokens, grids: c.grids, shells: c.shell.atBreakpoints, panes: c.panes, decisions: c.decisions, rules: c.rules, mistakes: c.mistakes, classes: c.classes,
  measure: { rem: MEASURE_REM, px: measure, chars: charsPerLine(measure, body, cw), chars200: charsPerLine(2 * measure, 2 * body, cw), chars640: charsPerLine(640, body, cw), body },
  container: r('layout.container.max'), tile, tilesPerRow: c.grids.map((g) => ({ bp: g.bp, content: g.content, tiles: Math.max(1, Math.floor((g.content + gapD) / (tile + gapD))) })),
  header: Object.fromEntries(DENSITIES.map((d) => [d, { header: r('layout.header.height', { Density: d }), control: r('size.control.height', { Density: d }), label: d === 'comfortable' ? 'type.label.lg' : 'type.label.md' }])),
  limits: { reflowWidth: REFLOW_WIDTH, reflowHeight: REFLOW_HEIGHT, minColumn: MIN_COLUMN, headerRoom: HEADER_ROOM, stickyShare: STICKY_SHARE, stickyFromEm: STICKY_FROM_EM, drawerStrip: DRAWER_STRIP, panes: LIMITS },
  narrowest: Object.fromEntries(BREAKPOINTS.map((bp) => [bp, narrowest(bp)])), min: BREAKPOINT_MIN,
  marginXl: r('layout.margin', { Responsive: 'xl' }), marginSm: r('layout.margin', { Responsive: 'sm' }),
  room: c.shell.atBreakpoints.find((s) => s.breakpoint === 'xl').mainContentPx - measure,
  threeAtLg: c.mistakes.find((m) => m.mistake.startsWith('Navigation and')).measured.match(/= (\d+)px/)[1],
  keep12: c.mistakes.find((m) => m.mistake.startsWith('Twelve')).measured,
  styles: tc.styles.map((s) => ({ name: s.name, figma: s.figma, use: s.use, tabular: s.tabular, reading: s.reading, product: s.product })),
  checks: report.checks.filter((x) => x.foundation === 'Layout' || x.id === 'T9').map((x) => ({ id: x.id, title: x.title, wcag: x.wcag, level: x.level, status: x.status, summary: x.summary })),
  counts: { tokens: c.tokens.length, panes: c.panes.length },
};
fs.writeFileSync(path.join(out, 'data_layout.json'), JSON.stringify(data, null, 1));
console.log('layout tokens', data.counts.tokens, 'all variables', Object.keys(vars.meta.variables).length, '→', out);
