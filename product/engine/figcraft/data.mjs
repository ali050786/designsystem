import { build } from '/mnt/user-data/outputs/engine/src/build.js';
import { contrast } from '/mnt/user-data/outputs/engine/src/color-math.js';
import { distance, CVD_TYPES } from '/mnt/user-data/outputs/engine/src/cvd.js';
import { GRADES } from '/mnt/user-data/outputs/engine/src/grades.js';
import fs from 'fs';
const { sys, cfg, report } = build();
const r = (p, m) => sys.resolve(p, m ? { Color: m } : {});
const name = (p) => p.replace(/\./g, '/');
const hues = ['brand', 'neutral', 'success', 'warning', 'danger', 'info'];
const scales = hues.map((h) => ({ hue: h, steps: GRADES.map((g) => { const hex = r(`color.${h}.${g}`); return { g, hex, v: name(`color.${h}.${g}`), w: +contrast(hex, '#FFFFFF').toFixed(2), b: +contrast(hex, '#000000').toFixed(2) }; }) }));
const sem = [...sys.tokens.values()].filter((t) => t.collection === 'Color').map((t) => ({ path: t.path, v: name(t.path), desc: t.description, light: r(t.path, 'Light'), dark: r(t.path, 'Dark') }));
const pairs = {};
for (const c of report.checks.filter((c) => ['C1', 'C3'].includes(c.id))) for (const i of c.items) {
  (pairs[i.mode] ??= []).push({ fg: name(i.fg), bg: name(i.bg), ratio: i.ratio, min: i.min, kind: c.id === 'C1' ? 'text' : 'non-text' });
}
const data = {};
for (const m of ['Light', 'Dark']) {
  const g = r('color.data.positive', m), l = r('color.data.negative', m);
  data[m] = { positive: g, negative: l, cvd: Object.fromEntries(CVD_TYPES.map((t) => [t, +distance(g, l, t).toFixed(3)])), chart: [1,2,3,4,5,6,7,8].map((n) => r(`color.data.chart-${n}`, m)) };
}
const checks = report.checks.map((c) => ({ id: c.id, title: c.title, wcag: c.wcag, level: c.level, status: c.status, summary: c.summary }));
fs.writeFileSync('/home/claude/fc/data.json', JSON.stringify({ brand: cfg.color.brand, notes: sys.notes, scales, sem, pairs, data, checks, solids: null }, null, 1));
console.log('sem', sem.length, 'pairs L', pairs.Light.length);
// v2: pairs that are NOT in the contract, measured, for the "Not allowed" page.
const bad = [
  ['color.fg.subtle', 'color.bg.brand', 4.5, 'Meta text on a solid brand fill'],
  ['color.fg.brand', 'color.bg.brand', 4.5, 'Brand text on the brand fill'],
  ['color.fg.on-brand', 'color.bg.warning', 4.5, 'White text on the warning fill'],
  ['color.fg.positive', 'color.bg.success', 4.5, 'Positive text on a solid success fill'],
  ['color.fg.muted', 'color.bg.danger', 4.5, 'Muted text on a solid danger fill'],
  ['color.border.subtle', 'color.bg.surface', 3, 'Decorative border used as an input outline'],
];
const out = JSON.parse(fs.readFileSync('/home/claude/fc/data.json', 'utf8'));
out.bad = bad.map(([fg, bg, min, label]) => ({ fg: name(fg), bg: name(bg), min, label,
  Light: +contrast(r(fg, 'Light').slice(0, 7), r(bg, 'Light').slice(0, 7)).toFixed(2),
  Dark: +contrast(r(fg, 'Dark').slice(0, 7), r(bg, 'Dark').slice(0, 7)).toFixed(2) }));
out.prefix = cfg.prefix;
fs.writeFileSync('/home/claude/fc/data.json', JSON.stringify(out, null, 1));
console.log(out.bad.map((b) => `${b.label}: L ${b.Light} D ${b.Dark}`).join('\n'));
// v3: brands side by side, grade examples, role grades per mode.
const out3 = JSON.parse(fs.readFileSync('/home/claude/fc/data.json', 'utf8'));
const { gradeOf } = await import('/mnt/user-data/outputs/engine/src/grades.js');
out3.brands = [['Blue', '#2D5BD7'], ['Green', '#00A86B'], ['Navy', '#0B2E6B'], ['Orange', '#FF6B00']].map(([label, hex]) => {
  const b = build({ color: { brand: hex } }).sys; const R = (p, m = 'Light') => b.resolve(p, { Color: m });
  return { label, hex, grade: +gradeOf(hex).toFixed(1), fill: R('color.bg.brand'), fillGrade: Math.round(gradeOf(R('color.bg.brand'))), on: R('color.fg.on-brand'),
    hover: R('color.bg.brand-hover'), pressed: R('color.bg.brand-pressed'), link: R('color.fg.link'), selected: R('color.bg.selected'), focus: R('color.border.focus'),
    linkDark: R('color.fg.link', 'Dark'), ratio: +contrast(R('color.fg.on-brand'), R('color.bg.brand')).toFixed(2) };
});
const H = ['brand', 'neutral', 'success', 'warning', 'danger', 'info'];
out3.hueGap = H.map((h) => ({ hue: h, a: r(`color.${h}.10`), b: r(`color.${h}.60`), ratio: +contrast(r(`color.${h}.10`), r(`color.${h}.60`)).toFixed(2) }));
out3.examples = [
  ['color.neutral.90', 'color.white', 'Body text on a white card', 90, 0, 4.5],
  ['color.brand.60', 'color.neutral.10', 'Brand text on a sunken well', 60, 10, 4.5],
  ['color.neutral.55', 'color.white', 'Input border on white', 55, 0, 3],
  ['color.brand.40', 'color.brand.10', 'Brand 40 on brand 10', 40, 10, 4.5],
].map(([a, b, label, ga, gb, min]) => ({ a: name(a), b: name(b), aHex: r(a), bHex: r(b), label, gap: ga - gb, min, ratio: +contrast(r(a), r(b)).toFixed(2) }));
const gr = (p, m) => { const t = sys.get(p).values[m]; const m2 = /\{color\.([a-z-]+)\.(\d+)\}/.exec(t); return m2 ? `${m2[1]} ${m2[2]}` : t.replace(/[{}]/g, '').replace('color.', ''); };
out3.remap = ['color.bg.canvas', 'color.bg.surface', 'color.bg.surface-raised', 'color.bg.surface-overlay', 'color.fg.default', 'color.fg.muted', 'color.fg.subtle', 'color.fg.brand', 'color.border.input', 'color.border.focus']
  .map((p) => ({ v: name(p), light: gr(p, 'Light'), dark: gr(p, 'Dark') }));
// pairs by kind (now includes icon + composite state layers)
out3.pairsAll = {};
for (const c of report.checks.filter((c) => ['C1', 'C3', 'C4'].includes(c.id))) for (const i of c.items) {
  (out3.pairsAll[i.mode] ??= []).push({ fg: name(i.fg), bg: name(i.bg), over: i.over ? name(i.over) : null, ratio: i.ratio, min: i.min, kind: c.id === 'C1' ? 'text' : c.id === 'C3' ? 'non-text' : 'icon' });
}
out3.counts = { tokens: sys.tokens.size, variables: [...sys.tokens.values()].filter((t) => t.type === 'color' && ['Primitives', 'Color'].includes(t.collection)).length,
  pairs: (await import('/mnt/user-data/outputs/engine/src/export/ai-color.js')).colorContract(sys, cfg, report).pairs.length };
fs.writeFileSync('/home/claude/fc/data.json', JSON.stringify(out3, null, 1));
console.log('v3 data', out3.counts, out3.brands.map((b) => `${b.label} g${b.grade} fill ${b.fillGrade} on ${b.on} ${b.ratio}`).join(' | '));
