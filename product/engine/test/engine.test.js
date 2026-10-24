import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from '../src/build.js';
import { scale, worstGapContrast, GRADES } from '../src/grades.js';
import { toTokensJson, toFigmaFiles } from '../src/export/dtcg.js';
import { toCss, toTailwindTheme } from '../src/export/css.js';

test('contrast grades: 50 apart ≥ 4.5, 40 apart ≥ 3, 70 apart ≥ 7, in every hue and chroma', () => {
  for (let H = 0; H < 360; H += 15) {
    for (const C of [0, 0.02, 0.1, 0.2, 0.3]) {
      const sc = scale(H, C, GRADES);
      assert.ok(worstGapContrast(sc, 50) >= 4.5, `H${H} C${C} gap 50`);
      assert.ok(worstGapContrast(sc, 40) >= 3, `H${H} C${C} gap 40`);
      assert.ok(worstGapContrast(sc, 70) >= 7, `H${H} C${C} gap 70`);
    }
  }
});

test('default system and the 3 sample brands build with zero A/AA failures', () => {
  const samples = fs.readdirSync(new URL('../config/samples/', import.meta.url));
  for (const cfg of [{}, ...samples.map((f) => JSON.parse(fs.readFileSync(new URL(`../config/samples/${f}`, import.meta.url))))]) {
    const { report } = build(cfg);
    assert.equal(report.ok, true, `${cfg.name ?? 'default'} blocking: ${report.blocking}`);
  }
});

test('any brand colour builds accessibly (200 random + edge cases)', () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const brands = ['#FFFFFF', '#000000', '#FFFF00', '#00FFFF', '#FF00FF', '#808080', '#FF0000', '#00FF00', '#0000FF'];
  for (let i = 0; i < 200; i++) brands.push(`#${Math.floor(rnd() * 0xffffff).toString(16).padStart(6, '0')}`);
  for (const brand of brands) {
    const { report } = build({ color: { brand } });
    assert.equal(report.ok, true, `${brand}: ${report.blocking}`);
  }
});

test('solid fills choose readable text: white on dark brands, black on bright ones', () => {
  const on = (brand) => build({ color: { brand } }).sys.resolve('color.fg.on-brand', { Color: 'Light' });
  assert.equal(on('#0B2E6B'), '#FFFFFF');
  assert.equal(on('#FF6B00'), '#000000');
});

test('foundations are linked: gutter follows spacing, elevation follows colour', () => {
  const { sys } = build();
  assert.equal(sys.get('layout.gutter').values.md, '{space.6}');
  assert.equal(sys.get('elevation.raised.surface').values.Value, '{color.bg.surface}');
  assert.equal(sys.get('elevation.sticky.shadow').values.Value.color, '{color.shadow.2}');
  assert.equal(sys.get('elevation.floating.border').values.Value, '{color.border.floating}');
  assert.equal(sys.get('focus.ring.color').values.Value, '{color.border.focus}');
  assert.deepEqual(sys.validateAliases(), []);
});

test('reduced motion removes movement; compact density keeps 24px targets', () => {
  const { sys } = build();
  for (const i of ['change', 'floating', 'modal']) assert.equal(sys.resolve(`motion.${i}.distance`, { Motion: 'reduced' }), 0);
  for (const i of ['feedback', 'change', 'floating', 'modal']) assert.ok(sys.resolve(`motion.${i}.duration`, { Motion: 'reduced' }) <= 100);
  assert.ok(sys.resolve('size.control.height', { Density: 'compact' }) >= 24);
});

test('exports are well-formed', () => {
  const { sys, cfg } = build();
  const json = toTokensJson(sys);
  assert.equal(json.color.bg.surface.$type, 'color');
  assert.equal(json.color.bg.surface.$value, '{color.white}');
  assert.equal(json.color.bg.surface.$extensions['org.ds'].modes.Dark, '{color.neutral.90}');
  const figma = toFigmaFiles(sys);
  assert.equal(Object.keys(figma).length, 18);
  assert.equal(figma['Responsive.md.tokens.json'].type.body.md['font-size'].$value, '{font.size.16}');
  const css = toCss(sys, cfg);
  assert.match(css, /--ds-color-bg-surface: var\(--ds-color-white\);/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /undefined|NaN|\[object Object\]/);
});

test('every exporter loads and runs (catches syntax slips in files the build does not import)', async () => {
  const { sys, cfg } = build();
  const { toRestVariables } = await import('../src/export/figma-rest.js');
  const { colorVariableData, figmaVariablesScript } = await import('../src/export/figma-script.js');
  const rest = toRestVariables(sys, cfg);
  assert.ok(Object.keys(rest.meta.variables).length > 200);
  assert.equal(rest.meta.variables['VariableID:color.action.primary.bg'].scopes.join(), 'FRAME_FILL,SHAPE_FILL');
  assert.ok(figmaVariablesScript(colorVariableData(sys, cfg)).length > 1000);
});

test('colour checker: clean files pass, each rule break is caught', async () => {
  const { sys, cfg, report } = build();
  const { colorContract } = await import('../src/export/ai-color.js');
  const { contractIndex, lintText } = await import('../src/lint/color-lint.js');
  const K = contractIndex(colorContract(sys, cfg, report));
  const run = (f) => lintText(K, fs.readFileSync(new URL(`./fixtures/color/${f}`, import.meta.url), 'utf8'), f);
  for (const f of ['good.html', 'good.jsx']) assert.deepEqual(run(f), [], f);
  const rules = (f) => run(f).map((x) => x.rule).sort().join(' ');
  assert.equal(rules('bad.html'), 'CR-01 CR-01 CR-01 CR-03 CR-03 CR-04 CR-04 CR-09 CR-10');
  assert.equal(rules('bad.jsx'), 'CR-01 CR-01 CR-01 CR-01 CR-03 CR-04 CR-09');
});

test('colour guide: every role documented once, numbers come from the build', async () => {
  const { sys, cfg, report } = build();
  const { colorContract } = await import('../src/export/ai-color.js');
  const { colorGuideMd } = await import('../src/export/guide-color.js');
  const c = colorContract(sys, cfg, report);
  const md = colorGuideMd(sys, cfg, report, c); // throws if a role is missing or listed twice
  assert.ok(!/undefined|NaN|\[object/.test(md));
  for (const r of c.roles) assert.ok(md.includes(r.light), `${r.name} Light value shown`);
  for (const t of ['Five principles', 'Contrast grades', 'How tokens are built', 'Shade scales', 'Surfaces and depth', 'Text, icons and outlines',
    'Actions and states', 'Status and data', 'What goes on what', 'Choosing and using colour', 'Modes and brands']) assert.ok(md.includes(`\n## ${t}\n`), t);
  assert.ok(!/chapter \d|## \d/i.test(md), 'no chapter numbers');
});

test('product roles: added from config, measured, and refused when unsafe', () => {
  const role = (r) => ({ color: { roles: [r] } });
  const ok = build(role({ name: 'color.bg.highlight', light: 'warning.5', dark: 'warning.90', description: 'New row', carries: ['color.fg.default', 'color.fg.muted'] }));
  assert.ok(ok.report.ok);
  assert.ok(ok.sys.tokens.has('color.bg.highlight'));
  assert.equal(ok.sys.pairs.filter((p) => p.bg === 'color.bg.highlight').length, 2);
  // A pair that fails contrast stops the build.
  const bad = build(role({ name: 'color.bg.highlight', light: 'warning.50', dark: 'warning.90', description: 'x', carries: ['color.fg.muted'] }));
  assert.equal(bad.report.ok, false);
  // Refused outright: hex values, colour names, existing names, missing pair lists, unknown shades.
  for (const r of [
    { name: 'color.bg.highlight', light: '#FFEBD0', dark: 'warning.90', description: 'x', carries: ['color.fg.default'] },
    { name: 'color.bg.yellow', light: 'warning.5', dark: 'warning.90', description: 'x', carries: ['color.fg.default'] },
    { name: 'color.bg.surface', light: 'warning.5', dark: 'warning.90', description: 'x', carries: ['color.fg.default'] },
    { name: 'color.bg.highlight', light: 'warning.5', dark: 'warning.90', description: 'x' },
    { name: 'color.fg.note', light: 'warning.7', dark: 'warning.30', description: 'x', on: ['color.bg.surface'] },
  ]) assert.throws(() => build(role(r)), /color\.roles/);
});

test('typography: reading text ≥ 1.5, nothing under 12px, headings move and text stays, at every breakpoint', () => {
  const { sys, report } = build();
  for (const id of ['T1', 'T2', 'T3', 'T5', 'T6', 'T7', 'T8']) assert.equal(report.checks.find((c) => c.id === id).status, 'pass', id);
  const at = (p, bp) => sys.resolve(p, { Responsive: bp });
  for (const t of sys.byPrefix('type.')) {
    for (const bp of ['sm', 'md', 'lg', 'xl']) {
      const v = at(t.path, bp);
      assert.ok(v.fontSize >= 12, `${t.path} ${bp}`);
      assert.equal(v.fontSize % 2, 0, `${t.path} ${bp} even px`);
      assert.equal(v.lineHeight % 2, 0, `${t.path} ${bp} even line height`);
      if (t.meta.reading) assert.ok(v.lineHeight / v.fontSize >= 1.5, `${t.path} ${bp} reading`);
      if (v.fontSize < 24) assert.ok(v.letterSpacing >= 0, `${t.path} ${bp} no negative tracking below 24px`);
    }
    const sizes = new Set(['sm', 'md', 'lg', 'xl'].map((bp) => at(t.path, bp).fontSize));
    assert.equal(sizes.size > 1, t.meta.scales, `${t.path}: only display and heading styles move`);
  }
  assert.ok(at('type.display.lg', 'sm').fontSize <= 40, 'largest display fits a 320px screen');
});

test('typography config: product styles are computed and checked; unsafe ones and bad scales are refused', () => {
  const style = (s) => ({ typography: { styles: [s] } });
  const ok = build(style({ name: 'type.overline.sm', step: -2, kind: 'label', weight: 'semibold', case: 'upper', description: 'Label above a section title' }));
  assert.ok(ok.report.ok);
  const v = ok.sys.resolve('type.overline.sm', { Responsive: 'lg' });
  assert.deepEqual([v.fontSize, v.lineHeight, v.letterSpacing, v.fontWeight], [12, 16, 0.06, 600]);
  for (const s of [
    { name: 'type.overline.sm', step: -2, kind: 'label', weight: 'medium', description: 'x' }, // identical to label.sm
    { name: 'type.tiny.sm', step: -2, kind: 'label', weight: 'semibold', description: 'x' }, // named by look
    { name: 'type.note.sm', step: -3, kind: 'reading', weight: 'regular', description: 'x' }, // under 12px
    { name: 'type.note.md', size: 13, kind: 'reading', weight: 'regular', description: 'x' }, // px instead of a step
    { name: 'type.lead.md', step: 2, kind: 'reading', weight: 'regular', case: 'upper', description: 'x' }, // capitals in reading text
    { name: 'type.body.md', step: 0, kind: 'reading', weight: 'regular', description: 'x' }, // exists
    { name: 'type.note.md', step: 0, kind: 'reading', weight: 'regular', scales: true, description: 'x' }, // reading text that moves
  ]) assert.throws(() => build(style(s)), /typography\.styles/, s.name);
  for (const t of [{ baseSize: 15 }, { ratio: { sm: 1.2, md: 1.1, lg: 1.2, xl: 1.2 } }, { sans: 'serif' }]) assert.throws(() => build({ typography: t }), /typography:/);
  // Scales that are valid input but break a rule fail the build with the check that explains why.
  assert.deepEqual(build({ typography: { ratio: { sm: 1.2, md: 1.2, lg: 1.2, xl: 1.2 } } }).report.blocking, ['L1']);
  assert.deepEqual(build({ typography: { ratio: { sm: 1.1, md: 1.1, lg: 1.1, xl: 1.1 } } }).report.blocking, ['T7']);
});

test('typography exports: rem sizes, em spacing, Tailwind utilities, Figma px, base-layer defaults', () => {
  const { sys, cfg } = build();
  const css = toCss(sys, cfg);
  assert.match(css, /--ds-font-size-16: 1rem;/);
  assert.match(css, /--ds-font-letter-spacing-tight: -0\.01em;/);
  assert.match(css, /\.ds-type-numeric-md \{[^}]*tabular-nums/);
  assert.match(css, /td, th, output, data \{ font-variant-numeric: tabular-nums; \}/);
  assert.match(css, /--ds-layout-measure-reading: 34rem;/);
  const tw = toTailwindTheme(sys, cfg);
  assert.match(tw, /--text-body-md: var\(--ds-type-body-md-font-size\);/);
  assert.match(tw, /--text-body-md--line-height: var\(--ds-type-body-md-line-height\);/);
  assert.match(tw, /--font-mono: var\(--ds-font-family-mono\);/);
  const json = toTokensJson(sys);
  assert.equal(json.type.heading.lg.$extensions['org.ds'].modes.lg.letterSpacing.value, -0.4);
  const figma = toFigmaFiles(sys);
  assert.equal(figma['Responsive.lg.tokens.json'].type.display.lg['letter-spacing'].$value, -1.36);
  assert.equal(figma['Responsive.sm.tokens.json'].type.body.md['line-height'].$value, 24);
});

test('type checker: clean files pass, each rule break is caught', async () => {
  const { sys, cfg, report } = build();
  const { typeContract } = await import('../src/export/ai-type.js');
  const { contractIndex, lintText } = await import('../src/lint/type-lint.js');
  const K = contractIndex(typeContract(sys, cfg, report));
  const run = (f) => lintText(K, fs.readFileSync(new URL(`./fixtures/type/${f}`, import.meta.url), 'utf8'), f);
  for (const f of ['good.html', 'good.jsx']) assert.deepEqual(run(f), [], f);
  const rules = (f) => run(f).map((x) => x.rule).sort().join(' ');
  assert.equal(rules('bad.html'), 'TR-01 TR-01 TR-01 TR-01 TR-02 TR-03 TR-03 TR-04 TR-04 TR-05 TR-07 TR-09 TR-12 TR-13');
  assert.equal(rules('bad.jsx'), 'TR-01 TR-01 TR-01 TR-03 TR-03 TR-04 TR-07 TR-07 TR-11');
});

test('typography guide and rulebook: every style documented once, numbers come from the build', async () => {
  const { sys, cfg, report } = build();
  const { typeContract, typeRulesMd } = await import('../src/export/ai-type.js');
  const { typeGuideMd, TYPE_CHAPTERS } = await import('../src/export/guide-type.js');
  const c = typeContract(sys, cfg, report);
  const md = typeGuideMd(sys, cfg, report, c); // throws if a style is missing or listed twice
  const rb = typeRulesMd(c);
  for (const doc of [md, rb]) assert.ok(!/undefined|NaN|\[object/.test(doc));
  for (const t of TYPE_CHAPTERS) assert.ok(md.includes(`\n## ${t}\n`), t);
  assert.ok(!/chapter \d|## \d/i.test(md), 'no chapter numbers');
  for (const s of c.styles) {
    const lg = s.breakpoints.lg;
    assert.ok(md.includes(`${lg.size}/${lg.lineHeight}`), `${s.name} shown with its lg size`);
    assert.ok(rb.includes(`\`${s.name}\``), `${s.name} in the rulebook`);
  }
  assert.equal(c.rules.length, 14);
});

test('spacing: one ladder, density is one computed rule, targets and labels fit in every density', () => {
  const { sys, report } = build();
  for (const id of ['S1', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']) assert.equal(report.checks.find((c) => c.id === id).status, 'pass', id);
  const at = (p, d) => sys.resolve(p, { Density: d });
  const triple = (p) => ['comfortable', 'default', 'compact'].map((d) => at(p, d));
  assert.deepEqual(triple('space.inset.md'), [16, 12, 8]);
  assert.deepEqual(triple('size.control.height'), [48, 40, 32]);
  assert.deepEqual(triple('size.target.min'), [24, 24, 24]);
  // A size word is the same distance in every family, in every density.
  for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) for (const d of ['comfortable', 'default', 'compact']) {
    assert.equal(at(`space.inset.${size}`, d), at(`space.stack.${size}`, d), `${size} ${d}`);
    assert.equal(at(`space.inline.${size}`, d), at(`space.stack.${size}`, d), `${size} ${d}`);
  }
  for (const t of sys.byPrefix('space.').filter((x) => x.collection === 'Density')) for (const d of ['comfortable', 'default', 'compact']) assert.ok(at(t.path, d) >= 2, `${t.path} ${d}`);
});

test('spacing config: product tokens are computed and checked; unsafe ones and bad steps are refused', () => {
  const tok = (t) => ({ spacing: { tokens: [t] } });
  const ok = build(tok({ name: 'space.stack.3xl', base: '12', description: 'Sections of a long landing page' }));
  assert.ok(ok.report.ok);
  assert.deepEqual(['comfortable', 'default', 'compact'].map((d) => ok.sys.resolve('space.stack.3xl', { Density: d })), [56, 48, 40]);
  for (const t of [
    { name: 'space.stack.3xl', value: 48, description: 'x' }, // px instead of a base
    { name: 'space.gutter.table', base: '4', description: 'x' }, // not a direction
    { name: 'space.stack.big', base: '4', description: 'x' }, // named by look
    { name: 'space.stack.md', base: '4', description: 'x' }, // exists
    { name: 'space.stack.3xl', base: '7', description: 'x' }, // not on the scale
    { name: 'space.stack.4xl', base: '24', description: 'x' }, // no step above for comfortable
    { name: 'space.stack.3xl', base: '12' }, // no description
  ]) assert.throws(() => build(tok(t)), /spacing\.tokens/, t.name);
  assert.throws(() => build({ spacing: { densityStep: 3 } }), /spacing:/);
  assert.throws(() => build({ density: { default: 'dense' } }), /spacing:/);
  // Valid input that breaks a rule fails the build with the check that explains why.
  assert.deepEqual(build({ spacing: { densityStep: 2 } }).report.blocking, ['S5', 'S6', 'R2']); // R2: 24px compact controls can't keep round's 8px corners
  assert.deepEqual(build(tok({ name: 'space.stack.3xl', base: '6', description: 'x' })).report.blocking, ['S4']);
  assert.deepEqual(build(tok({ name: 'space.inline.2xl', base: '10', description: 'x' })).report.blocking, ['S4']);
});

test('spacing exports: px values, density on any element, Tailwind size utilities', () => {
  const { sys, cfg } = build();
  const css = toCss(sys, cfg);
  assert.match(css, /--ds-space-4: 16px;/);
  assert.match(css, /\n\[data-density="compact"\] \{[^}]*--ds-space-inset-md: var\(--ds-space-2\);/);
  assert.doesNotMatch(css, /:root\[data-density/);
  const tw = toTailwindTheme(sys, cfg);
  assert.match(tw, /--spacing-inset-md: var\(--ds-space-inset-md\);/);
  assert.match(tw, /--spacing-control: var\(--ds-size-control-height\);/);
  assert.match(tw, /--spacing-target: var\(--ds-size-target-min\);/);
});

test('spacing checker: clean files pass, each rule break is caught', async () => {
  const { sys, cfg, report } = build();
  const { spaceContract } = await import('../src/export/ai-space.js');
  const { contractIndex, lintText } = await import('../src/lint/space-lint.js');
  const K = contractIndex(spaceContract(sys, cfg, report));
  const run = (f) => lintText(K, fs.readFileSync(new URL(`./fixtures/space/${f}`, import.meta.url), 'utf8'), f);
  for (const f of ['good.html', 'good.jsx']) assert.deepEqual(run(f), [], f);
  const rules = (f) => run(f).map((x) => x.rule).sort().join(' ');
  assert.equal(rules('bad.html'), 'SR-01 SR-01 SR-01 SR-02 SR-02 SR-04 SR-04 SR-04 SR-05 SR-05 SR-06 SR-07 SR-08 SR-09 SR-09 SR-09');
  assert.equal(rules('bad.jsx'), 'SR-01 SR-01 SR-01 SR-01 SR-02 SR-02 SR-04 SR-05 SR-05 SR-06 SR-09');
});

test('spacing guide and rulebook: every token documented once, numbers come from the build', async () => {
  const { sys, cfg, report } = build();
  const { spaceContract, spaceRulesMd } = await import('../src/export/ai-space.js');
  const { spaceGuideMd, SPACE_CHAPTERS } = await import('../src/export/guide-space.js');
  const c = spaceContract(sys, cfg, report);
  const md = spaceGuideMd(sys, cfg, report, c); // throws if a token is missing or listed twice
  const rb = spaceRulesMd(c);
  for (const doc of [md, rb]) assert.ok(!/undefined|NaN|\[object/.test(doc));
  for (const t of SPACE_CHAPTERS) assert.ok(md.includes(`\n## ${t}\n`), t);
  assert.ok(!/chapter \d|## \d/i.test(md), 'no chapter numbers');
  for (const t of c.tokens) {
    const row = `| \`${t.name.replace(/\./g, '/')}\` | `;
    assert.ok(md.includes(row), `${t.name} has a row in the guide`);
    assert.ok(rb.includes(`\`${t.name}\``), `${t.name} in the rulebook`);
  }
  assert.equal(c.rules.length, 9);
  // A product token appears in the guide's product section and in the rulebook.
  const p = build({ spacing: { tokens: [{ name: 'space.stack.3xl', base: '12', description: 'Sections of a long landing page' }] } });
  const pc = spaceContract(p.sys, p.cfg, p.report);
  assert.match(spaceGuideMd(p.sys, p.cfg, p.report, pc), /Tokens added for this product[\s\S]*space\/stack\/3xl/);
});

test('layout: the grid fits every breakpoint, panes add up, grids follow their region, the header never hides focus', async () => {
  const { sys, report } = build();
  for (const id of ['L1', 'L2', 'L3', 'L4', 'L5', 'T9']) assert.equal(report.checks.find((c) => c.id === id).status, 'pass', id);
  const at = (p, bp) => sys.resolve(p, { Responsive: bp });
  assert.deepEqual(['sm', 'md', 'lg', 'xl'].map((bp) => at('layout.columns', bp)), [4, 8, 12, 12]);
  assert.deepEqual(['sm', 'md', 'lg', 'xl'].map((bp) => at('layout.margin', bp)), [16, 32, 40, 64]);
  assert.equal(sys.resolve('layout.container.max'), 1440 - 2 * 64); // computed: the page stops growing where xl begins
  assert.equal(sys.get('layout.measure.reading').meta.rem, true);
  assert.deepEqual(['comfortable', 'default', 'compact'].map((d) => sys.resolve('layout.header.height', { Density: d })), [64, 56, 48]);
  assert.deepEqual(Object.values(sys.get('layout.scroll-padding.top').values), ['{layout.header.height}', '{layout.header.height}', '{layout.header.height}']);
  const { shellAt, panesOf, validateLayoutConfig, regionMode } = await import('../src/foundations/layout.js');
  const panes = panesOf(validateLayoutConfig(build().cfg));
  const gridOf = (m) => ({ columns: at('layout.columns', m), gutterPx: at('layout.gutter', m) });
  const lg = shellAt('lg', panes, at('layout.margin', 'lg'), gridOf);
  assert.deepEqual([lg.main, lg.content, lg.mode, lg.columns], [768, 688, 'md', 8]); // beside the nav pane the main region takes the md grid
  assert.equal(regionMode(599), 'sm');
  assert.equal(regionMode(600), 'md');
});

test('layout config: product panes are computed and checked; unsafe ones are refused', () => {
  const pane = (p) => ({ layout: { panes: [p] } });
  const ok = build(pane({ name: 'layout.pane.outline', width: 192, from: 'xl', side: 'end', description: 'Headings of a long page, to jump between them' }));
  assert.ok(ok.report.ok, ok.report.blocking.join());
  assert.equal(ok.sys.resolve('layout.pane.outline'), 192);
  assert.match(toCss(ok.sys, ok.cfg), /grid-template-columns: auto minmax\(0, 1fr\) auto auto;\n    grid-template-areas: "header header header header" "nav main aside outline";/);
  // Three panes already open at xl: a 288px fourth leaves 448px for the main content, under a reading line.
  assert.deepEqual(build(pane({ name: 'layout.pane.inspector', width: 288, from: 'xl', side: 'end', description: 'x' })).report.blocking, ['L3']);
  for (const p of [
    { name: 'layout.pane.inspector', width: 300, from: 'xl', description: 'x' }, // not a multiple of 8
    { name: 'layout.pane.inspector', width: 520, from: 'xl', description: 'x' }, // too wide
    { name: 'layout.pane.right', width: 288, from: 'xl', description: 'x' }, // named by position
    { name: 'layout.pane.inspector', width: 288, from: 'sm', description: 'x' }, // inline on a phone
    { name: 'layout.pane.nav', width: 288, from: 'xl', description: 'x' }, // exists
    { name: 'layout.pane.inspector', rem: 18, from: 'xl', description: 'x' }, // rem, not px
    { name: 'layout.pane.inspector', width: 288, from: 'xl' }, // no description
    { name: 'layout.inspector', width: 288, from: 'xl', description: 'x' }, // not a pane name
  ]) assert.throws(() => build(pane(p)), /layout\.panes/, JSON.stringify(p));
  assert.throws(() => build({ layout: { nav: 300 } }), /layout:/); // a 300px drawer leaves 20px of a 320px screen
  assert.throws(() => build({ layout: { tile: 250 } }), /layout:/);
  // Valid input that breaks a rule fails the build with the check that explains why.
  assert.deepEqual(build(pane({ name: 'layout.pane.inspector', width: 320, from: 'lg', side: 'end', description: 'x' })).report.blocking, ['L3']);
  assert.deepEqual(build({ layout: { aside: 480 } }).report.blocking, []); // 1440 − 256 − 480 − 128 = 576px still holds a reading line
});

test('layout exports: em breakpoints, the shell, grids that follow their region, Tailwind widths', () => {
  const { sys, cfg } = build();
  const css = toCss(sys, cfg);
  assert.match(css, /@media \(min-width: 37\.5em\) \{\n  :root \{/);
  assert.doesNotMatch(css, /@media \(min-width: \d+px\)/);
  assert.match(css, /--ds-layout-measure-reading: 34rem;/);
  assert.match(css, /html \{ scroll-padding-top: calc\(var\(--ds-layout-scroll-padding-top\) \+ var\(--ds-focus-ring-offset\) \+ var\(--ds-focus-ring-width\)\);/);
  assert.match(css, /@container ds-region \(min-width: 64em\) \{\n  \.ds-grid \{\n    --ds-layout-columns: 12;/);
  assert.match(css, /\.ds-shell > \[data-shell="nav"\]:not\(\[data-open\]\) \{ display: none; \}/);
  assert.match(css, /@media \(min-width: 64em\) \{\n  \.ds-shell \{\n    grid-template-columns: auto minmax\(0, 1fr\);/);
  assert.match(css, /\.ds-shell > \[data-shell="nav"\]:not\(\[data-open\]\) \{ display: block;[^}]*width: var\(--ds-layout-pane-nav\);/);
  assert.match(css, /\.ds-grid \{ display: grid; grid-template-columns: repeat\(var\(--ds-layout-columns\), minmax\(0, 1fr\)\);/);
  assert.match(css, /\[data-density="compact"\] \{[^}]*--ds-layout-header-height: var\(--ds-space-12\);/);
  const tw = toTailwindTheme(sys, cfg);
  for (const re of [/--container-reading: var\(--ds-layout-measure-reading\);/, /--container-page: var\(--ds-layout-container-max\);/, /--spacing-margin: var\(--ds-layout-margin\);/, /--spacing-header: var\(--ds-layout-header-height\);/, /--breakpoint-md: 37\.5rem;/, /--breakpoint-sm: initial;/]) assert.match(tw, re);
  const figma = toFigmaFiles(sys);
  assert.ok(figma['Layout.Value.tokens.json'], 'Layout collection exported');
});

test('layout checker: clean files pass, each rule break is caught', async () => {
  const { sys, cfg, report } = build();
  const { layoutContract } = await import('../src/export/ai-layout.js');
  const { contractIndex, lintText } = await import('../src/lint/layout-lint.js');
  const K = contractIndex(layoutContract(sys, cfg, report));
  const run = (f) => lintText(K, fs.readFileSync(new URL(`./fixtures/layout/${f}`, import.meta.url), 'utf8'), f);
  for (const f of ['good.html', 'good.jsx']) assert.deepEqual(run(f), [], f);
  const rules = (f) => run(f).map((x) => x.rule).sort().join(' ');
  assert.equal(rules('bad.html'), 'LR-01 LR-01 LR-02 LR-03 LR-04 LR-04 LR-04 LR-05 LR-06 LR-06 LR-06 LR-07 LR-07 LR-08 LR-08 LR-08 LR-09 LR-09 LR-09 LR-09 LR-10');
  assert.equal(rules('bad.jsx'), 'LR-01 LR-02 LR-02 LR-03 LR-04 LR-04 LR-05 LR-06 LR-06 LR-06 LR-06 LR-07 LR-07 LR-08');
  // The other checkers stay quiet on the clean layout files (layout tokens are not spacing or type mistakes).
  const { spaceContract } = await import('../src/export/ai-space.js');
  const S = await import('../src/lint/space-lint.js');
  const KS = S.contractIndex(spaceContract(sys, cfg, report));
  for (const f of ['good.html', 'good.jsx']) assert.deepEqual(S.lintText(KS, fs.readFileSync(new URL(`./fixtures/layout/${f}`, import.meta.url), 'utf8'), f).filter((x) => x.level === 'error'), [], `space-lint on ${f}`);
});

test('layout guide and rulebook: every token documented once, numbers come from the build', async () => {
  const { sys, cfg, report } = build();
  const { layoutContract, layoutRulesMd } = await import('../src/export/ai-layout.js');
  const { layoutGuideMd, LAYOUT_CHAPTERS } = await import('../src/export/guide-layout.js');
  const c = layoutContract(sys, cfg, report);
  const md = layoutGuideMd(sys, cfg, report, c); // throws if a token is missing or listed twice
  const rb = layoutRulesMd(c);
  for (const doc of [md, rb]) assert.ok(!/undefined|NaN|\[object/.test(doc));
  for (const t of LAYOUT_CHAPTERS) assert.ok(md.includes(`\n## ${t}\n`), t);
  assert.ok(!/chapter \d|## \d/i.test(md), 'no chapter numbers');
  for (const t of c.tokens) {
    assert.ok(md.includes(`| \`${t.name.replace(/\./g, '/')}\` | `), `${t.name} has a row in the guide`);
    assert.ok(rb.includes(`\`${t.name}\``), `${t.name} in the rulebook`);
  }
  assert.equal(c.rules.length, 10);
  assert.ok(md.includes(`${sys.resolve('layout.container.max')}px`));
  const p = build({ layout: { panes: [{ name: 'layout.pane.outline', width: 192, from: 'xl', side: 'end', description: 'Headings of a long page, to jump between them' }] } });
  const pc = layoutContract(p.sys, p.cfg, p.report);
  const pmd = layoutGuideMd(p.sys, p.cfg, p.report, pc);
  assert.ok(pmd.includes('Panes added for this product') && pmd.includes('`layout/pane/outline`'));
  assert.ok(layoutRulesMd(pc).includes('`layout.pane.outline`'));
});

test('radius: roles per style keep their order, keep their corners, keep text inside, rings hug the shape', () => {
  const { sys, cfg, report } = build();
  const at = (p, s) => sys.resolve(p, { Shape: s });
  assert.deepEqual(sys.collections.get('Shape').modes, ['default', 'sharp', 'round']); // the product's style first
  assert.deepEqual(['none', 'mark', 'control', 'container', 'surface'].map((j) => at(`shape.${j}`, 'default')), [0, 2, 4, 8, 12]);
  assert.deepEqual(['sharp', 'default', 'round'].map((s) => at('shape.control', s)), [2, 4, 8]);
  assert.equal(at('shape.pill', 'round'), 9999);
  for (const s of ['sharp', 'default', 'round']) for (const j of ['mark', 'control', 'container', 'surface']) assert.equal(at(`shape.${j}-focus`, s), at(`shape.${j}`, s) + sys.resolve('focus.ring.offset'));
  for (const id of ['R1', 'R2', 'R3', 'R4']) assert.equal(report.checks.find((c) => c.id === id).status, 'pass', id);
  assert.equal(sys.resolve('shape.container'), 8); // unscoped lookups use the product's style
  const round = build({ radius: { style: 'round' } });
  assert.deepEqual(round.sys.collections.get('Shape').modes[0], 'round');
  assert.equal(round.sys.resolve('shape.container'), 12);
  assert.ok(round.report.ok);
  const css = toCss(sys, cfg), tw = toTailwindTheme(sys, cfg);
  assert.match(css, /\[data-radius="round"\] \{[^}]*--ds-shape-container: var\(--ds-radius-6\);/);
  assert.match(css, /:root \{[^}]*--ds-shape-control: var\(--ds-radius-2\);/);
  assert.match(css, /\.ds-join:not\(\[data-join\]\) > :not\(:first-child\) \{ border-start-start-radius: 0; border-end-start-radius: 0; margin-inline-start: calc\(-1 \* var\(--ds-border-width-control\)\); margin-block-start: 0; \}/);
  assert.match(css, /@media not all and \(min-width: 37\.5em\) \{\n  \.ds-join\[data-join="auto"\] \{ flex-direction: column; \}/);
  assert.match(css, /\.ds-join > :focus-visible, \.ds-join > :focus-within \{ position: relative; z-index: 2; \}/);
  assert.match(tw, /--radius-\*: initial;/);
  assert.match(tw, /--radius-control: var\(--ds-shape-control\);/);
  assert.ok(!/--radius-control-focus/.test(tw));
});

test('radius config: product roles are computed and checked; unsafe ones are refused', () => {
  const role = (r) => ({ radius: { style: 'default', roles: [r] } });
  const ok = build(role({ name: 'shape.thumbnail', sharp: '1', default: '3', round: '4', description: 'Image previews in lists and pickers' }));
  assert.ok(ok.report.ok);
  assert.equal(ok.sys.resolve('shape.thumbnail'), 6);
  assert.equal(ok.sys.resolve('shape.thumbnail-focus', { Shape: 'round' }), 10);
  for (const r of [
    { name: 'shape.thumbnail', sharp: '1', default: '3', round: '2', description: 'x' }, // shrinks from default to round
    { name: 'shape.thumbnail', sharp: '1', default: '5', round: '6', description: 'x' }, // 5 is not on the scale
    { name: 'shape.thumbnail', sharp: '1', default: '3', round: 'full', description: 'x' }, // that is the pill
    { name: 'shape.rounded-card', sharp: '1', default: '3', round: '4', description: 'x' }, // named by look
    { name: 'shape.lg', sharp: '1', default: '3', round: '4', description: 'x' }, // named by size
    { name: 'shape.control', sharp: '1', default: '3', round: '4', description: 'x' }, // exists
    { name: 'shape.thumbnail', px: 6, description: 'x' }, // px, not keys
    { name: 'shape.thumbnail', sharp: '1', default: '3', round: '4' }, // no description
    { name: 'radius.thumbnail', sharp: '1', default: '3', round: '4', description: 'x' }, // not a shape name
  ]) assert.throws(() => build(role(r)), /radius\.roles/, JSON.stringify(r));
  assert.throws(() => build({ radius: { style: 'soft' } }), /radius:/);
  assert.throws(() => build({ radius: { style: 'default', control: 6 } }), /radius:/);
});

test('radius checker: clean files pass, each rule break is caught', async () => {
  const { sys, cfg, report } = build();
  const { radiusContract } = await import('../src/export/ai-radius.js');
  const { contractIndex, lintText } = await import('../src/lint/radius-lint.js');
  const K = contractIndex(radiusContract(sys, cfg, report));
  const run = (f) => lintText(K, fs.readFileSync(new URL(`./fixtures/radius/${f}`, import.meta.url), 'utf8'), f);
  for (const f of ['good.html', 'good.jsx']) assert.deepEqual(run(f), [], f);
  const rules = (f) => run(f).map((x) => x.rule).sort().join(' ');
  assert.equal(rules('bad.html'), 'RR-01 RR-01 RR-01 RR-02 RR-04 RR-04 RR-04 RR-06 RR-06 RR-06 RR-06 RR-07 RR-07 RR-08 RR-08 RR-09 RR-10');
  assert.equal(rules('bad.jsx'), 'RR-01 RR-03 RR-03 RR-03 RR-04 RR-04 RR-04 RR-05 RR-06 RR-08 RR-09');
  const all = new Set([...run('bad.html'), ...run('bad.jsx')].map((x) => x.rule));
  for (let i = 1; i <= 10; i++) assert.ok(all.has(`RR-${String(i).padStart(2, '0')}`), `RR-${i} caught`);
  // The other checkers stay quiet on the clean radius files.
  for (const [name, mod, contract] of [['space', '../src/lint/space-lint.js', '../src/export/ai-space.js'], ['layout', '../src/lint/layout-lint.js', '../src/export/ai-layout.js']]) {
    const L = await import(mod), C = await import(contract);
    const KK = L.contractIndex((C.spaceContract ?? C.layoutContract)(sys, cfg, report));
    for (const f of ['good.html', 'good.jsx']) assert.deepEqual(L.lintText(KK, fs.readFileSync(new URL(`./fixtures/radius/${f}`, import.meta.url), 'utf8'), f).filter((x) => x.level === 'error'), [], `${name}-lint on ${f}`);
  }
});

test('radius guide and rulebook: every token documented once, numbers come from the build', async () => {
  const { sys, cfg, report } = build();
  const { radiusContract, radiusRulesMd, cornerGap } = await import('../src/export/ai-radius.js');
  const { radiusGuideMd, RADIUS_CHAPTERS } = await import('../src/export/guide-radius.js');
  const c = radiusContract(sys, cfg, report);
  const md = radiusGuideMd(sys, cfg, report, c); // throws if a token is missing or listed twice
  const rb = radiusRulesMd(c);
  for (const doc of [md, rb]) assert.ok(!/undefined|NaN|\[object/.test(doc));
  for (const t of RADIUS_CHAPTERS) assert.ok(md.includes(`\n## ${t}\n`), t);
  assert.ok(!/chapter \d|## \d/i.test(md), 'no chapter numbers');
  for (const t of c.tokens) assert.ok(md.includes(`| \`${t.name.replace(/\./g, '/')}\` | `), `${t.name} has a row in the guide`);
  for (const t of c.tokens.filter((x) => x.collection === 'Shape')) assert.ok(rb.includes(`\`${t.name}\``), `${t.name} in the rulebook`);
  assert.equal(c.rules.length, 10);
  assert.equal(cornerGap(12, 8, 4), 8); // parent − padding: an even gap
  assert.equal(cornerGap(12, 8, 12), +(8 * Math.SQRT2).toFixed(1)); // a copied radius: always √2 × the padding
  const p = build({ radius: { style: 'round', roles: [{ name: 'shape.thumbnail', sharp: '1', default: '3', round: '4', description: 'Image previews' }] } });
  const pc = radiusContract(p.sys, p.cfg, p.report);
  const pmd = radiusGuideMd(p.sys, p.cfg, p.report, pc);
  assert.ok(pmd.includes('Roles added for this product') && pmd.includes('`shape/thumbnail`'));
  assert.ok(radiusRulesMd(pc).includes('`shape.thumbnail`') && radiusRulesMd(pc).includes('round (this product)'));
});

test('border: widths by job stay apart, lines people need reach 3:1, states keep content still, forced colours keep every cue', () => {
  const { sys, cfg, report } = build();
  const w = (j) => sys.resolve(`border.width.${j}`);
  assert.deepEqual(['line', 'control', 'state', 'indicator'].map(w), [1, 1, 2, 3]);
  assert.deepEqual([1, 2, 3].map((k) => sys.resolve(`border.width.${k}`)), [1, 2, 3]);
  assert.ok(!sys.tokens.has('border.width.4') && !sys.tokens.has('border.width.default'));
  assert.equal(sys.resolve('focus.ring.width'), 2);
  for (const id of ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'F2']) assert.equal(report.checks.find((c) => c.id === id).status, 'pass', id);
  assert.ok(sys.tokens.has('color.border.selected'));
  const heavy = build({ border: { control: 2 } });
  assert.deepEqual(['line', 'control', 'state', 'indicator'].map((j) => heavy.sys.resolve(`border.width.${j}`)), [1, 2, 3, 3]);
  assert.ok(heavy.report.ok);
  const css = toCss(sys, cfg), tw = toTailwindTheme(sys, cfg);
  assert.match(css, /--ds-border-width-control: var\(--ds-border-width-1\);/);
  assert.match(css, /--ds-border-width-1: 1px;/);
  assert.match(css, /@media \(forced-colors: active\) \{\n {4}\[aria-selected="true"\][^{]*\{ outline: var\(--ds-border-width-state\) solid SelectedItem;/);
  assert.match(css, /outline: var\(--ds-focus-ring-width\) solid Highlight;/);
  assert.match(css, /:disabled, \[aria-disabled="true"\] \{ color: GrayText; border-color: GrayText; \}/);
  assert.match(css, /\.ds-join > :hover, \.ds-join > \[aria-pressed="true"\]/);
  assert.match(tw, /--border-width-line: var\(--ds-border-width-line\);/);
  assert.match(tw, /--border-width-indicator: var\(--ds-border-width-indicator\);/);
  // B2 catches two jobs of one width that share a colour; B3 a job that identifies something in a decorative colour.
  const clash = build({ border: { control: 1, roles: [{ name: 'border.width.drop-zone', width: 1, color: 'color.border.input', identifies: true, description: 'Drop zone edge' }] } });
  assert.equal(clash.report.checks.find((c) => c.id === 'B2').status, 'fail');
  const dashed = build({ border: { control: 1, roles: [{ name: 'border.width.drop-zone', width: 1, color: 'color.border.input', identifies: true, style: 'dashed', description: 'Drop zone edge' }] } });
  assert.equal(dashed.report.checks.find((c) => c.id === 'B2').status, 'pass');
  const faint = build({ border: { control: 1, roles: [{ name: 'border.width.drop-zone', width: 2, color: 'color.border.subtle', identifies: true, style: 'dashed', description: 'Drop zone edge' }] } });
  assert.equal(faint.report.checks.find((c) => c.id === 'B3').status, 'fail');
  assert.ok(!faint.report.ok);
});

test('border config: product jobs are computed and checked; unsafe ones are refused', () => {
  const role = (r) => ({ border: { control: 1, roles: [r] } });
  const ok = build(role({ name: 'border.width.drop-zone', width: 2, color: 'color.border.strong', identifies: true, style: 'dashed', description: 'The edge of an area files can be dropped on' }));
  assert.ok(ok.report.ok);
  assert.equal(ok.sys.resolve('border.width.drop-zone'), 2);
  for (const r of [
    { name: 'border.width.thick-card', width: 2, color: 'color.border.strong', identifies: false, description: 'x' }, // named by look
    { name: 'border.width.hairline', width: 1, color: 'color.border.subtle', identifies: false, description: 'x' }, // named by look
    { name: 'border.width.divider', width: 0.5, color: 'color.border.subtle', identifies: false, description: 'x' }, // sub-pixel
    { name: 'border.width.divider', width: 4, color: 'color.border.subtle', identifies: false, description: 'x' }, // off the scale
    { name: 'border.width.divider', px: 1, color: 'color.border.subtle', identifies: false, description: 'x' }, // px, not a key
    { name: 'border.width.divider', width: 1, color: 'color.bg.surface', identifies: false, description: 'x' }, // not a border colour
    { name: 'border.width.divider', width: 1, color: 'color.border.subtle', description: 'x' }, // identifies missing
    { name: 'border.width.divider', width: 1, color: 'color.border.subtle', identifies: false, style: 'double', description: 'x' }, // style
    { name: 'border.width.divider', width: 1, color: 'color.border.subtle', identifies: false }, // no description
    { name: 'border.width.control', width: 1, color: 'color.border.input', identifies: true, description: 'x' }, // exists
    { name: 'border.divider', width: 1, color: 'color.border.subtle', identifies: false, description: 'x' }, // not a width name
    { name: 'border.width.divider', width: 1, color: 'color.border.nope', identifies: false, description: 'x' }, // unknown colour
  ]) assert.throws(() => build(role(r)), /border\.roles/, JSON.stringify(r));
  assert.throws(() => build({ border: { control: 3 } }), /border:/);
  assert.throws(() => build({ border: { control: 1, input: 2 } }), /border:/);
});

test('border checker: clean files pass, each rule break is caught', async () => {
  const { sys, cfg, report } = build();
  const { borderContract } = await import('../src/export/ai-border.js');
  const { contractIndex, lintText } = await import('../src/lint/border-lint.js');
  const K = contractIndex(borderContract(sys, cfg, report));
  const run = (f) => lintText(K, fs.readFileSync(new URL(`./fixtures/border/${f}`, import.meta.url), 'utf8'), f);
  for (const f of ['good.html', 'good.jsx']) assert.deepEqual(run(f), [], f);
  const rules = (f) => run(f).map((x) => x.rule).sort().join(' ');
  assert.equal(rules('bad.html'), 'BR-01 BR-01 BR-02 BR-03 BR-03 BR-05 BR-06 BR-06 BR-07 BR-08 BR-08 BR-09 BR-10 BR-11');
  assert.equal(rules('bad.jsx'), 'BR-02 BR-03 BR-03 BR-04 BR-04 BR-04 BR-05 BR-05 BR-06 BR-10');
  const all = new Set([...run('bad.html'), ...run('bad.jsx')].map((x) => x.rule));
  for (let i = 1; i <= 11; i++) assert.ok(all.has(`BR-${String(i).padStart(2, '0')}`), `BR-${i} caught`);
  // The other checkers stay quiet on the clean border files.
  for (const [name, mod, contract, fn] of [['space', '../src/lint/space-lint.js', '../src/export/ai-space.js', 'spaceContract'], ['radius', '../src/lint/radius-lint.js', '../src/export/ai-radius.js', 'radiusContract']]) {
    const L = await import(mod), C = await import(contract);
    const KK = L.contractIndex(C[fn](sys, cfg, report));
    for (const f of ['good.html', 'good.jsx']) assert.deepEqual(L.lintText(KK, fs.readFileSync(new URL(`./fixtures/border/${f}`, import.meta.url), 'utf8'), f).filter((x) => x.level === 'error'), [], `${name}-lint on ${f}`);
  }
});

test('border guide and rulebook: every token documented once, numbers come from the build', async () => {
  const { sys, cfg, report } = build();
  const { borderContract, borderRulesMd } = await import('../src/export/ai-border.js');
  const { borderGuideMd, BORDER_CHAPTERS } = await import('../src/export/guide-border.js');
  const c = borderContract(sys, cfg, report);
  const md = borderGuideMd(sys, cfg, report, c); // throws if a token is missing or listed twice
  const rb = borderRulesMd(c);
  for (const doc of [md, rb]) assert.ok(!/undefined|NaN|\[object/.test(doc));
  for (const t of BORDER_CHAPTERS) assert.ok(md.includes(`\n## ${t}\n`), t);
  assert.ok(!/chapter \d|## \d/i.test(md), 'no chapter numbers');
  for (const t of c.tokens) assert.ok(md.includes(`| \`${t.name.replace(/\./g, '/')}\` | `), `${t.name} has a row in the guide`);
  for (const t of c.tokens.filter((x) => x.collection === 'Border')) assert.ok(rb.includes(`\`${t.name}\``) || rb.includes(t.cssVar), `${t.name} in the rulebook`);
  assert.equal(c.rules.length, 11);
  assert.deepEqual(c.compensation.table.map((x) => x.left.compact), [7, 11, 5]);
  const p = build({ border: { control: 2, roles: [{ name: 'border.width.drop-zone', width: 2, color: 'color.border.strong', identifies: true, style: 'dashed', description: 'Drop zone edge' }] } });
  const pc = borderContract(p.sys, p.cfg, p.report);
  const pmd = borderGuideMd(p.sys, p.cfg, p.report, pc);
  assert.ok(pmd.includes('Jobs added for this product') && pmd.includes('`border/width/drop-zone`') && pmd.includes('(this product)'));
  assert.ok(borderRulesMd(pc).includes('`border.width.drop-zone`') && borderRulesMd(pc).includes('control boundaries 2px'));
});

test('elevation: levels by job, height in Dark by surface, edges seen, shadows grow, one stacking order', async () => {
  const { sys, report } = build();
  const ids = report.checks.filter((c) => c.foundation === 'Elevation').map((c) => `${c.id}:${c.status}`);
  assert.deepEqual(ids, ['E1:pass', 'E2:pass', 'E3:pass', 'E4:pass', 'E5:pass', 'E6:pass']);
  for (let i = 0; i <= 4; i++) assert.ok(!sys.tokens.has(`elevation.${i}.surface`), 'no numbered levels');
  assert.deepEqual(['sticky', 'floating', 'modal', 'toast', 'dragging'].map((l) => sys.resolve(`layer.${l}`)), [100, 200, 300, 400, 500]);
  // Shadows are computed from height.
  assert.deepEqual(sys.resolve('elevation.floating.shadow', { Color: 'Light' }), { color: '#00000029', offsetX: 0, offsetY: 4, blur: 16, spread: -2 });
  assert.ok(!sys.tokens.has('elevation.page.shadow') && !sys.tokens.has('elevation.dragging.surface'));
  // Floating and modal share the top surface; the scrim is the modal's.
  assert.equal(sys.get('elevation.modal.surface').values.Value, sys.get('elevation.floating.surface').values.Value);
  assert.equal(sys.get('elevation.modal.scrim').values.Value, '{color.bg.scrim}');
  // The analytic shadow edge agrees with Chromium (measured in the teardown: 0 1px 3px rgba(0,0,0,.08) on #ECEEF0 → 1.117:1).
  const { shadowEdgeAlpha } = await import('../src/foundations/elevation.js');
  const { contrast, composite } = await import('../src/color-math.js');
  assert.ok(Math.abs(contrast(composite('#000000', shadowEdgeAlpha({ offsetY: 1, blur: 3, spread: 0 }, 0.08), '#ECEEF0'), '#ECEEF0') - 1.117) < 0.01);
  assert.ok(Math.abs(contrast(composite('#000000', shadowEdgeAlpha({ offsetY: 8, blur: 32, spread: -4 }, 0.2), '#ECEEF0'), '#ECEEF0') - 1.292) < 0.02); // modal, Light, measured 1.292
  // tokens.css: classes carry the whole level, the scrim is the backdrop, the shell uses the layers.
  const { toCss, toTailwindTheme } = await import('../src/export/css.js');
  const { cfg } = build();
  const css = toCss(sys, cfg), tw = toTailwindTheme(sys, cfg);
  assert.match(css, /\.ds-floating \{ z-index: var\(--ds-layer-floating\); background: var\(--ds-elevation-floating-surface\); box-shadow: var\(--ds-elevation-floating-shadow\); border: var\(--ds-border-width-line\) solid var\(--ds-elevation-floating-border\);/);
  assert.match(css, /\.ds-modal::backdrop \{ background: var\(--ds-elevation-modal-scrim\); \}/);
  assert.match(css, /\[data-shell="header"\] \{ grid-area: header; z-index: var\(--ds-layer-sticky\);/);
  assert.match(css, /--ds-layer-modal: 300;/);
  assert.match(tw, /--shadow-\*: initial;/);
  assert.match(tw, /--shadow-floating: var\(--ds-elevation-floating-shadow\);/);
  assert.match(tw, /--color-elevation-floating-border: var\(--ds-elevation-floating-border\);/);
});

test('elevation checks catch what goes wrong', async () => {
  const { runChecks } = await import('../src/checks/index.js');
  const status = (sys) => Object.fromEntries(runChecks(sys).checks.filter((c) => c.foundation === 'Elevation').map((c) => [c.id, c.status]));
  // Dark: a floating surface darker than the sticky bar under it.
  let { sys } = build();
  sys.get('color.bg.surface-overlay').values.Dark = '{color.neutral.90}';
  assert.equal(status(sys).E2, 'fail');
  // A faint edge: the floating edge on the subtle border grey fails against a sticky bar in Dark.
  ({ sys } = build());
  sys.get('elevation.floating.border').values.Value = '{color.border.subtle}';
  assert.equal(status(sys).E3, 'fail');
  // A missing edge.
  ({ sys } = build());
  sys.tokens.delete('elevation.modal.border');
  assert.equal(status(sys).E1, 'fail');
  // A higher level with a smaller shadow.
  ({ sys } = build());
  sys.get('elevation.modal.shadow').values.Value = { ...sys.get('elevation.modal.shadow').values.Value, offsetY: 1, blur: 3 };
  assert.equal(status(sys).E4, 'fail');
  // Layers out of order.
  ({ sys } = build());
  sys.get('layer.floating').values.Value = 50;
  assert.equal(status(sys).E6, 'fail');
});

test('elevation config: product layers are computed and checked; unsafe ones are refused', () => {
  const ok = build({ elevation: { layers: [{ name: 'layer.banner', above: 'sticky', description: 'Site-wide banner above sticky bars' }, { name: 'layer.help', above: 'banner', description: 'Help panel' }] } });
  assert.ok(ok.report.ok);
  assert.equal(ok.sys.resolve('layer.banner'), 150);
  assert.equal(ok.sys.resolve('layer.help'), 175);
  assert.equal(ok.report.checks.find((c) => c.id === 'E6').status, 'pass');
  for (const l of [
    { name: 'layer.banner', above: 'sticky', value: 150, description: 'x' }, // a number
    { name: 'layer.top-bar', above: 'sticky', description: 'x' }, // named by position
    { name: 'layer.z-50', above: 'sticky', description: 'x' }, // named by number
    { name: 'layer.modal', above: 'sticky', description: 'x' }, // exists
    { name: 'layer.banner', description: 'x' }, // no "above"
    { name: 'layer.banner', above: 'nowhere', description: 'x' }, // unknown layer
    { name: 'layer.banner', above: 'sticky' }, // no description
    { name: 'banner', above: 'sticky', description: 'x' }, // not layer.*
  ]) assert.throws(() => build({ elevation: { layers: [l] } }), /elevation\.layers/, JSON.stringify(l));
  assert.throws(() => build({ elevation: { layers: [{ name: 'layer.a', above: 'sticky', description: 'x' }, { name: 'layer.b', above: 'sticky', description: 'x' }] } }), /two product layers/);
  assert.throws(() => build({ elevation: { levels: [] } }), /elevation:/);
});

test('elevation checker: clean files pass, each rule break is caught', async () => {
  const { sys, cfg, report } = build();
  const { elevationContract } = await import('../src/export/ai-elevation.js');
  const { contractIndex, lintText } = await import('../src/lint/elevation-lint.js');
  const K = contractIndex(elevationContract(sys, cfg, report));
  const run = (f) => lintText(K, fs.readFileSync(new URL(`./fixtures/elevation/${f}`, import.meta.url), 'utf8'), f);
  for (const f of ['good.html', 'good.jsx']) assert.deepEqual(run(f), [], f);
  const rules = (f) => run(f).map((x) => x.rule).sort().join(' ');
  assert.equal(rules('bad.html'), 'ER-01 ER-01 ER-01 ER-02 ER-03 ER-04 ER-04 ER-05 ER-06 ER-06 ER-06 ER-06 ER-07 ER-08 ER-09 ER-10');
  assert.equal(rules('bad.jsx'), 'ER-01 ER-01 ER-02 ER-04 ER-05 ER-08 ER-09 ER-09');
  const all = new Set([...run('bad.html'), ...run('bad.jsx')].map((x) => x.rule));
  for (let i = 1; i <= 10; i++) assert.ok(all.has(`ER-${String(i).padStart(2, '0')}`), `ER-${i} caught`);
  // The other checkers stay quiet (no errors) on the clean elevation files.
  for (const [name, mod, contract, fn] of [['border', '../src/lint/border-lint.js', '../src/export/ai-border.js', 'borderContract'], ['color', '../src/lint/color-lint.js', '../src/export/ai-color.js', 'colorContract']]) {
    const L = await import(mod), C = await import(contract);
    const KK = L.contractIndex ? L.contractIndex(C[fn](sys, cfg, report)) : null;
    if (!KK) continue;
    for (const f of ['good.html', 'good.jsx']) assert.deepEqual(L.lintText(KK, fs.readFileSync(new URL(`./fixtures/elevation/${f}`, import.meta.url), 'utf8'), f).filter((x) => x.level === 'error'), [], `${name}-lint on ${f}`);
  }
});

test('elevation guide and rulebook: every token documented once, numbers come from the build', async () => {
  const { sys, cfg, report } = build();
  const { elevationContract, elevationRulesMd } = await import('../src/export/ai-elevation.js');
  const { elevationGuideMd, ELEVATION_CHAPTERS } = await import('../src/export/guide-elevation.js');
  const c = elevationContract(sys, cfg, report);
  const md = elevationGuideMd(sys, cfg, report, c); // throws if a token is missing or listed twice
  const rb = elevationRulesMd(c);
  for (const doc of [md, rb]) assert.ok(!/undefined|NaN|\[object|null/.test(doc));
  for (const t of ELEVATION_CHAPTERS) assert.ok(md.includes(`\n## ${t}\n`), t);
  assert.ok(!/chapter \d|## \d|level \d\b(?!" tells)/i.test(md.replace(/"level 3" tells you nothing/, '')), 'no chapter or level numbers');
  for (const t of c.tokens) assert.ok(md.includes(`\`${t.name.replace(/\./g, '/')}\``), `${t.name} in the guide`);
  for (const t of c.tokens) assert.ok(rb.includes(t.name.split('.').slice(0, 2).join('.')) || rb.includes(t.cssVar), `${t.name} in the rulebook`);
  assert.equal(c.rules.length, 10);
  assert.equal(c.levels.length, 6);
  const p = build({ elevation: { layers: [{ name: 'layer.banner', above: 'sticky', description: 'Site-wide banner above sticky bars' }] } });
  const pc = elevationContract(p.sys, p.cfg, p.report);
  const pmd = elevationGuideMd(p.sys, p.cfg, p.report, pc);
  assert.ok(pmd.includes('Layers added for this product') && pmd.includes('`layer/banner`') && pmd.includes('150'));
  assert.ok(elevationRulesMd(pc).includes('`layer.banner`') && elevationRulesMd(pc).includes('(added for this product)'));
});

test('motion: jobs computed from distance, reduced is fade only, curves have no jumps, ready transitions in tokens.css', async () => {
  const { sys, cfg, report } = build();
  const ids = report.checks.filter((c) => c.foundation === 'Motion').map((c) => `${c.id}:${c.status}`);
  assert.deepEqual(ids, ['M1:pass', 'M2:pass', 'M3:pass', 'M4:pass', 'M5:pass', 'M6:pass']);
  const r = (p, m = 'full') => sys.resolve(p, { Motion: m });
  // Durations follow distance: 100 + 37.5 × √px, rounded down to 50ms; exits two thirds.
  assert.deepEqual(['feedback', 'change', 'floating', 'modal'].map((j) => r(`motion.${j}.duration`)), [100, 200, 150, 250]);
  assert.deepEqual(['floating', 'modal'].map((j) => r(`motion.${j}.exit-duration`)), [100, 150]);
  assert.deepEqual(['change', 'floating', 'modal'].map((j) => r(`motion.${j}.distance`)), [8, 4, 16]);
  assert.equal(sys.get('motion.modal.distance').values.full, '{space.4}');
  assert.deepEqual([r('motion.highlight.duration'), r('motion.loading.duration'), r('motion.loading.duration', 'reduced')], [1000, 1000, 2000]);
  for (const t of sys.byPrefix('motion.').filter((x) => x.collection === 'Motion')) assert.ok(!/data-update|overlay|transition/.test(t.path), t.path);
  const { durationFor, exitFor, curveSpeeds } = await import('../src/foundations/motion.js');
  assert.deepEqual([0, 4, 8, 16, 24, 32].map(durationFor), [100, 150, 200, 250, 250, 300]);
  assert.deepEqual([100, 150, 200, 250, 300].map(exitFor), [100, 100, 100, 150, 200]);
  // The old curve that starts at full speed has no speed limit; ours stay at or under 2.5×.
  assert.equal(curveSpeeds([0, 0, 0, 1]).start, Infinity);
  for (const k of ['enter', 'exit', 'standard']) assert.ok(curveSpeeds(r(`motion.easing.${k}`)).peak <= 2.5 + 1e-6, k);
  // tokens.css: the reduced block on any element, ready transitions both ways, the loading pulse, Tailwind's own curves gone.
  const { toCss, toTailwindTheme } = await import('../src/export/css.js');
  const css = toCss(sys, cfg), tw = toTailwindTheme(sys, cfg);
  assert.match(css, /\n\[data-motion="reduced"\] \{\n  --ds-motion-feedback-duration: var\(--ds-motion-duration-100\);/);
  assert.match(css, /--ds-motion-modal-distance: var\(--ds-space-0\);/);
  assert.match(css, /\.ds-floating\[popover\]:popover-open \{ opacity: 1; translate: none; transition-duration: var\(--ds-motion-floating-duration\);/);
  assert.match(css, /@starting-style \{\n  dialog\.ds-modal\[open\] \{ opacity: 0; translate: 0 var\(--ds-motion-modal-distance\); \}/);
  assert.match(css, /@keyframes ds-pulse \{ 50% \{ opacity: 0\.65; \} \}/);
  assert.match(css, /\[data-motion="reduced"\] \.ds-loading \{ animation-name: ds-pulse; \}/);
  assert.match(tw, /--ease-\*: initial;/);
  assert.match(tw, /--animate-\*: initial;/);
  assert.match(tw, /--ease-floating-exit: var\(--ds-motion-floating-exit-easing\);/);
  assert.match(tw, /--default-transition-duration: var\(--ds-motion-feedback-duration\);/);
  // Figma: durations and distances are numbers, curves text; every motion variable kept out of pickers.
  const { motionRestVariables } = await import('../src/export/figma-rest.js');
  const v = motionRestVariables(sys, cfg).meta.variables;
  assert.equal(v['VariableID:motion.easing.enter'].valuesByMode['Primitives:Value'], 'cubic-bezier(0.2, 0.5, 0.4, 1)');
  assert.equal(v['VariableID:motion.modal.distance'].valuesByMode['Motion:reduced'].id, 'VariableID:space.0');
  assert.ok(Object.values(v).every((x) => x.scopes.length === 0));
});

test('motion checks catch what goes wrong', async () => {
  const { runChecks } = await import('../src/checks/index.js');
  const status = (sys) => Object.fromEntries(runChecks(sys).checks.filter((c) => c.foundation === 'Motion').map((c) => [c.id, c.status]));
  // A job that still moves in reduced motion.
  let { sys } = build();
  sys.get('motion.modal.distance').values.reduced = '{space.1}';
  assert.equal(status(sys).M1, 'fail');
  // A highlight that blinks.
  ({ sys } = build());
  sys.get('motion.highlight.duration').values.full = '{motion.duration.200}';
  assert.equal(status(sys).M2, 'fail');
  // A duration picked by hand.
  ({ sys } = build());
  sys.get('motion.floating.duration').values.full = '{motion.duration.250}';
  assert.equal(status(sys).M3, 'fail');
  // A curve that starts at full speed.
  ({ sys } = build());
  sys.get('motion.easing.enter').values.Value = [0, 0, 0, 1];
  assert.equal(status(sys).M4, 'fail');
  // A highlight tint text can't be read on.
  ({ sys } = build());
  sys.get('color.bg.brand-subtle').values.Light = '{color.neutral.90}';
  assert.equal(status(sys).M5, 'fail');
});

test('motion config: product jobs are computed and checked; unsafe ones are refused', () => {
  const ok = build({ motion: { jobs: [{ name: 'motion.carousel', kind: 'in-place', distance: 'space.6', description: 'Slides of a carousel' }, { name: 'motion.sheet', kind: 'in-out', distance: 'space.8', description: 'A bottom sheet' }] } });
  assert.ok(ok.report.ok);
  const r = (p, m = 'full') => ok.sys.resolve(p, { Motion: m });
  assert.deepEqual([r('motion.carousel.duration'), r('motion.carousel.distance'), r('motion.carousel.distance', 'reduced')], [250, 24, 0]);
  assert.deepEqual([r('motion.sheet.duration'), r('motion.sheet.exit-duration'), r('motion.sheet.duration', 'reduced')], [300, 200, 100]);
  assert.ok(ok.sys.tokens.has('motion.duration.300'));
  for (const c of ['M1', 'M3', 'M4']) assert.equal(ok.report.checks.find((x) => x.id === c).status, 'pass', c);
  for (const j of [
    { name: 'motion.carousel', kind: 'in-place', distance: 'space.6', duration: 300, description: 'x' }, // a duration
    { name: 'motion.carousel', kind: 'in-place', distance: 'space.6', easing: 'ease', description: 'x' }, // a curve
    { name: 'motion.fast', kind: 'in-place', distance: 'space.2', description: 'x' }, // named by speed
    { name: 'motion.bounce-in', kind: 'in-out', distance: 'space.2', description: 'x' }, // named by look
    { name: 'motion.modal', kind: 'in-out', distance: 'space.4', description: 'x' }, // exists
    { name: 'motion.carousel', kind: 'loop', distance: 'space.2', description: 'x' }, // a loop
    { name: 'motion.carousel', kind: 'in-place', distance: 'space.12', description: 'x' }, // 48px: too far
    { name: 'motion.carousel', kind: 'in-place', distance: '13px', description: 'x' }, // not on the scale
    { name: 'motion.carousel', kind: 'in-place', distance: 'space.6' }, // no description
    { name: 'carousel', kind: 'in-place', distance: 'space.6', description: 'x' }, // not motion.*
  ]) assert.throws(() => build({ motion: { jobs: [j] } }), /motion\.jobs/, JSON.stringify(j));
  assert.throws(() => build({ motion: { speed: 2 } }), /motion:/);
});

test('motion checker: clean files pass, each rule break is caught', async () => {
  const { sys, cfg, report } = build();
  const { motionContract } = await import('../src/export/ai-motion.js');
  const { contractIndex, lintText } = await import('../src/lint/motion-lint.js');
  const K = contractIndex(motionContract(sys, cfg, report));
  const run = (f) => lintText(K, fs.readFileSync(new URL(`./fixtures/motion/${f}`, import.meta.url), 'utf8'), f);
  for (const f of ['good.html', 'good.jsx']) assert.deepEqual(run(f), [], f);
  const rules = (f) => run(f).map((x) => x.rule).sort().join(' ');
  assert.equal(rules('bad.html'), 'MR-01 MR-01 MR-01 MR-01 MR-02 MR-02 MR-03 MR-03 MR-03 MR-04 MR-04 MR-04 MR-05 MR-06 MR-07 MR-07 MR-08 MR-08 MR-09 MR-09 MR-10 MR-10');
  assert.equal(rules('bad.jsx'), 'MR-01 MR-01 MR-01 MR-02 MR-03 MR-04 MR-06 MR-08 MR-09');
  const all = new Set([...run('bad.html'), ...run('bad.jsx')].map((x) => x.rule));
  for (let i = 1; i <= 10; i++) assert.ok(all.has(`MR-${String(i).padStart(2, '0')}`), `MR-${i} caught`);
  // The other checkers stay quiet (no errors) on the clean motion files.
  for (const [name, mod, contract, fn] of [['elevation', '../src/lint/elevation-lint.js', '../src/export/ai-elevation.js', 'elevationContract'], ['color', '../src/lint/color-lint.js', '../src/export/ai-color.js', 'colorContract']]) {
    const L = await import(mod), C = await import(contract);
    const KK = L.contractIndex(C[fn](sys, cfg, report));
    for (const f of ['good.html', 'good.jsx']) assert.deepEqual(L.lintText(KK, fs.readFileSync(new URL(`./fixtures/motion/${f}`, import.meta.url), 'utf8'), f).filter((x) => x.level === 'error'), [], `${name}-lint on ${f}`);
  }
});

test('motion guide and rulebook: every token documented once, numbers come from the build', async () => {
  const { sys, cfg, report } = build();
  const { motionContract, motionRulesMd } = await import('../src/export/ai-motion.js');
  const { motionGuideMd, MOTION_CHAPTERS } = await import('../src/export/guide-motion.js');
  const c = motionContract(sys, cfg, report);
  const md = motionGuideMd(sys, cfg, report, c); // throws if a token is missing or listed twice
  const rb = motionRulesMd(c);
  for (const doc of [md, rb]) assert.ok(!/undefined|NaN|\[object|null/.test(doc));
  for (const t of MOTION_CHAPTERS) assert.ok(md.includes(`\n## ${t}\n`), t);
  assert.ok(!/chapter \d|## \d/i.test(md), 'no chapter numbers');
  for (const t of c.tokens) assert.ok(md.includes(`\`${t.name.replace(/\./g, '/')}\``), `${t.name} in the guide`);
  for (const t of c.tokens.filter((x) => x.collection === 'Motion')) assert.ok(rb.includes(`motion.${t.name.split('.')[1]}`), `${t.name} in the rulebook`);
  assert.equal(c.rules.length, 10);
  assert.equal(c.jobs.length, 6);
  const p = build({ motion: { jobs: [{ name: 'motion.carousel', kind: 'in-place', distance: 'space.6', description: 'Slides of a carousel' }] } });
  const pc = motionContract(p.sys, p.cfg, p.report);
  const pmd = motionGuideMd(p.sys, p.cfg, p.report, pc);
  assert.ok(pmd.includes('Jobs added for this product') && pmd.includes('`motion/carousel`') && pmd.includes('250'));
  assert.ok(motionRulesMd(pc).includes('`motion.carousel` (added for this product)'));
});
