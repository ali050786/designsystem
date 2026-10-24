// Colour foundation: contrast-grade primitives, semantic Light/Dark roles, data colours, pair contract.
import { GRADES, scale, describe } from '../grades.js';
import { hexToOklch } from '../color-math.js';
import { ref } from '../system.js';

const P = 'Primitives';
const C = 'Color';
const round5 = (g) => Math.round(g / 5) * 5;
const clampG = (g) => Math.min(95, Math.max(5, g));

const STATUS_DEFAULT_C = 0.16;

/** "#RRGGBB" + alpha -> "#RRGGBBAA" */
const withAlpha = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase();

/**
 * A solid fill that carries text: picks text colour (white or black) and hover/pressed grades
 * so that text keeps >= 4.5:1 on all three.
 */
export function solidFill(grade) {
  const base = clampG(round5(grade));
  if (base >= 50) {
    const dir = base <= 75 ? 1 : -1; // darker states, unless already very dark
    return { base, hover: base + 10 * dir, pressed: base + 20 * dir, on: 'white' };
  }
  const dir = base + 10 <= 45 ? 1 : -1;
  return { base, hover: base + 5 * dir, pressed: base + 10 * dir, on: 'black' };
}

function hueSpec(v, fallbackC = STATUS_DEFAULT_C) {
  if (typeof v === 'number') return { H: v, C: fallbackC };
  if (typeof v === 'string') { const { H, C } = hexToOklch(v); return { H, C }; }
  return { H: v.hue, C: v.chroma ?? fallbackC };
}

export function buildColor(sys, cfg) {
  const c = cfg.color;
  const brand = describe(c.brand);
  const statusNames = ['success', 'warning', 'danger', 'info'];

  // ---------- Primitives ----------
  sys.add('color.white', { collection: P, type: 'color', value: '#FFFFFF', description: 'Grade 0' });
  sys.add('color.black', { collection: P, type: 'color', value: '#000000', description: 'Grade 100' });
  sys.add('color.brand-source', {
    collection: P, type: 'color', value: c.brand.toUpperCase(),
    description: `Exact brand colour from config (grade ${brand.grade.toFixed(1)}). Reference only; UI uses the graded scale.`,
  });

  const hues = {
    brand: { H: brand.H, scale: scale(brand.H, brand.C, GRADES, { grade: brand.grade, C: brand.C }) },
    neutral: { H: brand.H, scale: scale(brand.H, c.neutralTint) },
  };
  for (const s of statusNames) {
    const { H, C: ch } = hueSpec(c.status[s]);
    hues[s] = { H, scale: scale(H, ch) };
  }
  for (const [name, { scale: sc }] of Object.entries(hues)) {
    for (const g of GRADES) {
      sys.add(`color.${name}.${g}`, { collection: P, type: 'color', value: sc[g], grade: g });
    }
  }

  // Chart (categorical) primitives: one shade per series per mode (tuned for colour-blind separation).
  const chart = cfg.color.chart;
  chart.forEach((spec, i) => {
    for (const m of ['light', 'dark']) {
      const { hue, chroma, grade } = spec[m];
      sys.add(`color.chart-${i + 1}.${m}`, { collection: P, type: 'color', value: scale(hue, chroma, [grade])[grade], grade, description: `Series ${i + 1}, ${m} mode (grade ${grade})` });
    }
  });

  // Alpha blacks (shadows, scrims, light-mode state layers) and alpha whites (dark-mode state layers).
  for (const a of [4, 6, 8, 12, 16, 20, 32, 40, 48, 56, 64]) {
    sys.add(`color.black-alpha.${a}`, { collection: P, type: 'color', value: withAlpha('#000000', a / 100) });
  }
  for (const a of [4, 6, 8, 12, 16, 24, 32]) {
    sys.add(`color.white-alpha.${a}`, { collection: P, type: 'color', value: withAlpha('#FFFFFF', a / 100) });
  }
  sys.add('color.transparent', { collection: P, type: 'color', value: '#FFFFFF00', description: 'Fully transparent' });

  // ---------- Semantic ----------
  const g = (hue, grade) => ref(`color.${hue}.${grade}`);
  // Grades: contrast = 21^(gap/100), so 15 grades ≈ 1.58:1. In Light the level's own shadow darkens the page right beside
  // the edge, so the edge goes 5 grades further (Elevation check E3 measures the edge beside the shadow); in Dark the
  // shadow darkens the page away from a lighter edge, which only helps.
  const EDGE_GAP = 15, EDGE_SHADOW = 5;
  const mode = (light, dark, description, meta = {}) => ({ collection: C, type: 'color', values: { Light: light, Dark: dark }, description, ...meta });

  // Backgrounds. Light text-carrying backgrounds stay in grades 0–15; dark in 80–95.
  sys.add('color.bg.canvas', mode(g('neutral', 5), g('neutral', 95), 'Page background'));
  sys.add('color.bg.surface', mode(ref('color.white'), g('neutral', 90), 'Cards, panels, tables'));
  sys.add('color.bg.surface-raised', mode(ref('color.white'), g('neutral', 85), 'Sticky bars: headers, toolbars, sticky table headers (elevation.sticky)'));
  sys.add('color.bg.surface-overlay', mode(ref('color.white'), g('neutral', 80), 'Menus, popovers, toasts, dialogs (elevation.floating and elevation.modal)'));
  sys.add('color.bg.surface-sunken', mode(g('neutral', 10), g('neutral', 95), 'Wells, table headers, code blocks'));
  sys.add('color.bg.surface-hover', mode(g('neutral', 10), g('neutral', 85), 'Hovered row or item'));
  sys.add('color.bg.surface-pressed', mode(g('neutral', 15), g('neutral', 80), 'Pressed row or item'));
  sys.add('color.bg.selected', mode(g('brand', 10), g('brand', 80), 'Selected row or item'));
  sys.add('color.bg.disabled', mode(g('neutral', 10), g('neutral', 85), 'Disabled control fill (exempt from contrast, WCAG 1.4.3 exception)'));
  sys.add('color.bg.scrim', mode(ref('color.black-alpha.48'), ref('color.black-alpha.64'), 'Behind modal dialogs'));

  const textBgs = ['canvas', 'surface', 'surface-raised', 'surface-overlay', 'surface-sunken', 'surface-hover', 'surface-pressed', 'selected'].map((b) => `color.bg.${b}`);

  // Solid fills (brand + status), with their on-colour.
  const solids = { brand: solidFill(brand.grade) };
  for (const s of statusNames) solids[s] = solidFill(c.solidGrade[s]);
  for (const [name, f] of Object.entries(solids)) {
    sys.add(`color.bg.${name}`, mode(g(name, f.base), g(name, f.base), `Solid ${name} fill (grade ${f.base}) — text on it uses color.fg.on-${name}`));
    sys.add(`color.bg.${name}-hover`, mode(g(name, f.hover), g(name, f.hover), `Hovered solid ${name} fill`));
    sys.add(`color.bg.${name}-pressed`, mode(g(name, f.pressed), g(name, f.pressed), `Pressed solid ${name} fill`));
    sys.add(`color.bg.${name}-subtle`, mode(g(name, 10), g(name, 85), `Tinted ${name} background (alerts, badges)`));
    sys.add(`color.fg.on-${name}`, mode(ref(`color.${f.on}`), ref(`color.${f.on}`), `Text and icons on color.bg.${name}`));
    for (const st of ['', '-hover', '-pressed']) {
      sys.pairs.push({ fg: `color.fg.on-${name}`, bg: `color.bg.${name}${st}`, min: 4.5, kind: 'text', wcag: '1.4.3' });
    }
  }
  sys.notes.push({
    foundation: 'Colour',
    text: `Brand ${c.brand.toUpperCase()} sits at grade ${brand.grade.toFixed(1)}; solid brand fill uses grade ${solids.brand.base} (${hues.brand.scale[solids.brand.base]}) with ${solids.brand.on} text.`,
  });

  if (solids.brand.base <= 15) {
    sys.notes.push({
      foundation: 'Colour',
      text: `Brand fill is very light (grade ${solids.brand.base}): in Light mode it shares or nearly shares a shade with bg.selected and bg.brand-subtle (grade 10). Selected rows stay distinct by their check mark and bold label, but review screens where a primary button sits on a selected or subtle background. Links and the focus ring use darker brand shades (grades 60–65) and will look much darker than the brand colour.`,
    });
  }

  // Text.
  const text = {
    default: [90, 5, 'neutral', 'Body text, headings'],
    muted: [75, 20, 'neutral', 'Secondary text'],
    subtle: [65, 30, 'neutral', 'Meta text, placeholders, captions'],
    brand: [65, 30, 'brand', 'Brand-coloured text'],
    link: [65, 30, 'brand', 'Links (underlined by default — WCAG 1.4.1)'],
    'link-hover': [80, 15, 'brand', 'Hovered links'],
  };
  for (const s of statusNames) text[s] = [65, 30, s, `${s[0].toUpperCase() + s.slice(1)} text and icons — with words or an icon, never colour alone`];
  for (const [name, [l, d, hue, desc]] of Object.entries(text)) {
    sys.add(`color.fg.${name}`, mode(g(hue, l), g(hue, d), desc));
    for (const bg of textBgs) sys.pairs.push({ fg: `color.fg.${name}`, bg, min: 4.5, kind: 'text', wcag: '1.4.3' });
  }
  for (const s of [...statusNames, 'brand']) {
    // Messages hold a heading, body text, their intent colour and often a link ("Upgrade plan").
    for (const fg of ['default', 'muted', s, 'link']) {
      sys.pairs.push({ fg: `color.fg.${fg}`, bg: `color.bg.${s}-subtle`, min: 4.5, kind: 'text', wcag: '1.4.3' });
    }
  }
  sys.add('color.fg.disabled', mode(g('neutral', 40), g('neutral', 60), 'Disabled text (exempt from contrast, WCAG 1.4.3 exception)'));

  // Borders.
  sys.add('color.border.subtle', mode(g('neutral', 15), g('neutral', 75), 'Decorative dividers (not needed to identify a control)'));
  sys.add('color.border.default', mode(g('neutral', 20), g('neutral', 70), 'Card and table outlines (decorative)'));
  sys.add('color.border.strong', mode(g('neutral', 55), g('neutral', 40), 'Boundaries that identify a control'));
  sys.add('color.border.input', mode(g('neutral', 55), g('neutral', 40), 'Text field, checkbox, radio borders'));
  sys.add('color.border.focus', mode(g('brand', 60), g('brand', 35), 'Focus ring'));
  // The edge of anything that floats over content (menus, dialogs, dragged items). Computed: EDGE_GAP grades past the
  // surfaces it can sit on — darker than the page in Light, lighter than the highest surface in Dark — so it reads ≥ 1.5:1
  // against all of them, beside its own shadow (Elevation check E3). Decorative: the floating thing's content identifies itself.
  sys.add('color.border.floating', mode(g('neutral', 5 + EDGE_GAP + EDGE_SHADOW), g('neutral', 80 - EDGE_GAP), 'The edge of anything that floats over content: menus, popovers, toasts, dialogs, a dragged item — seen against every surface below it, kept in forced colours'));
  sys.add('color.border.selected', mode(g('brand', 65), g('brand', 30), 'Selected or current item: the border of a selected option or card, the bar under the current tab — with a second cue (a check mark, bold text)'));
  for (const s of statusNames) sys.add(`color.border.${s}`, mode(g(s, 55), g(s, 40), `${s[0].toUpperCase() + s.slice(1)} outline — ${{ success: 'a field that passed validation', warning: 'a field that needs attention', danger: 'a field in error', info: 'a highlighted field or callout' }[s]}`));
  for (const b of ['strong', 'input', 'focus', 'selected', ...statusNames]) {
    for (const bg of textBgs) sys.pairs.push({ fg: `color.border.${b}`, bg, min: 3, kind: 'non-text', wcag: b === 'focus' ? '1.4.11, 2.4.13' : '1.4.11' });
  }

  // Data colours.
  const d = c.data;
  sys.add('color.fg.positive', mode(g('success', 65), g('success', 30), 'A good change, as text — always with an arrow or sign; colour shows good, the arrow shows direction (WCAG 1.4.1)'));
  sys.add('color.fg.negative', mode(g('danger', 65), g('danger', 30), 'A bad change, as text — always with an arrow or sign; colour shows bad, the arrow shows direction (WCAG 1.4.1)'));
  sys.add('color.data.positive', mode(g('success', d.positive.light), g('success', d.positive.dark), 'Marks for good changes: bars, sparklines, deltas'));
  sys.add('color.data.negative', mode(g('danger', d.negative.light), g('danger', d.negative.dark), 'Marks for bad changes: bars, sparklines, deltas'));
  sys.add('color.data.neutral', mode(g('neutral', 55), g('neutral', 40), 'Unchanged values'));
  sys.add('color.data.gridline', mode(g('neutral', 15), g('neutral', 75), 'Chart gridlines (decorative)'));
  sys.add('color.data.axis', mode(g('neutral', 55), g('neutral', 40), 'Chart axes and ticks'));
  const chartBgs = ['canvas', 'surface', 'surface-raised'].map((b) => `color.bg.${b}`);
  for (const t of ['positive', 'negative']) {
    for (const bg of textBgs) sys.pairs.push({ fg: `color.fg.${t}`, bg, min: 4.5, kind: 'text', wcag: '1.4.3' });
    sys.pairs.push({ fg: `color.fg.${t}`, bg: `color.bg.${t === 'positive' ? 'success' : 'danger'}-subtle`, min: 4.5, kind: 'text', wcag: '1.4.3' });
  }
  for (const m of ['positive', 'negative', 'neutral', 'axis']) {
    for (const bg of chartBgs) sys.pairs.push({ fg: `color.data.${m}`, bg, min: 3, kind: 'non-text', wcag: '1.4.11' });
  }
  chart.forEach((spec, i) => {
    const n = i + 1;
    sys.add(`color.data.chart-${n}`, mode(ref(`color.chart-${n}.light`), ref(`color.chart-${n}.dark`), `Categorical chart series ${n}`));
    for (const bg of chartBgs) sys.pairs.push({ fg: `color.data.chart-${n}`, bg, min: 3, kind: 'non-text', wcag: '1.4.11' });
  });

  // Icons: non-text contrast (3:1). Status and brand text roles double as icon colours.
  sys.add('color.fg.icon', mode(g('neutral', 75), g('neutral', 20), 'Default icons — same weight as muted text'));
  sys.add('color.fg.icon-subtle', mode(g('neutral', 55), g('neutral', 40), 'Secondary icons (chevrons, decorative glyphs next to a label) — 3:1'));
  for (const ic of ['icon', 'icon-subtle']) {
    for (const bg of textBgs) sys.pairs.push({ fg: `color.fg.${ic}`, bg, min: 3, kind: 'icon', wcag: '1.4.11' });
  }
  for (const ic of ['default', 'muted', 'brand', ...statusNames]) {
    for (const bg of textBgs) sys.pairs.push({ fg: `color.fg.${ic}`, bg, min: 3, kind: 'icon', wcag: '1.4.11' });
  }

  // State layers: translucent tints laid over the LOW surfaces (canvas, surface, sunken) — ghost buttons, icon
  // buttons, rows. In Dark, lifting a high surface would close the gap to the text, so menus, popovers, dialogs
  // and raised cards use solid item roles that step one grade darker instead (measured, see C1).
  sys.add('color.bg.state-hover', mode(ref('color.black-alpha.6'), ref('color.white-alpha.4'), 'Hover tint over canvas, surface or sunken'));
  sys.add('color.bg.state-pressed', mode(ref('color.black-alpha.8'), ref('color.white-alpha.8'), 'Pressed tint over canvas, surface or sunken'));
  const layerBases = ['canvas', 'surface', 'surface-sunken'].map((b) => `color.bg.${b}`);
  for (const layer of ['state-hover', 'state-pressed']) {
    for (const base of layerBases) {
      // Brand text (ghost buttons, links) is not supported on tinted sunken wells: it lands on the 4.5 line.
      const fgs = base === 'color.bg.surface-sunken' ? ['default', 'muted'] : ['default', 'muted', 'brand'];
      for (const fg of fgs) sys.pairs.push({ fg: `color.fg.${fg}`, bg: `color.bg.${layer}`, over: base, min: 4.5, kind: 'text', wcag: '1.4.3' });
      for (const ic of ['icon', 'icon-subtle']) sys.pairs.push({ fg: `color.fg.${ic}`, bg: `color.bg.${layer}`, over: base, min: 3, kind: 'icon', wcag: '1.4.11' });
    }
  }
  sys.add('color.bg.item-hover', mode(g('neutral', 10), g('neutral', 85), 'Hovered item inside a menu, popover, dialog or raised card'));
  sys.add('color.bg.item-pressed', mode(g('neutral', 15), g('neutral', 90), 'Pressed item inside a menu, popover, dialog or raised card'));
  for (const bg of ['item-hover', 'item-pressed']) {
    for (const fg of ['default', 'muted', 'subtle', 'brand', 'link', ...statusNames]) sys.pairs.push({ fg: `color.fg.${fg}`, bg: `color.bg.${bg}`, min: 4.5, kind: 'text', wcag: '1.4.3' });
    for (const ic of ['icon', 'icon-subtle']) sys.pairs.push({ fg: `color.fg.${ic}`, bg: `color.bg.${bg}`, min: 3, kind: 'icon', wcag: '1.4.11' });
  }

  // Actions: the roles buttons and links use. They point at the same shades as the solids above,
  // named by job so people pick "primary action", not "brand 60".
  const sb = solids.brand, sd = solids.danger;
  const act = (path, light, dark, desc) => sys.add(`color.action.${path}`, mode(light, dark, desc));
  act('primary.bg', g('brand', sb.base), g('brand', sb.base), 'Primary button fill — one per view');
  act('primary.bg-hover', g('brand', sb.hover), g('brand', sb.hover), 'Primary button, hovered');
  act('primary.bg-pressed', g('brand', sb.pressed), g('brand', sb.pressed), 'Primary button, pressed');
  act('primary.fg', ref(`color.${sb.on}`), ref(`color.${sb.on}`), 'Label and icon on a primary button');
  act('secondary.bg', ref('color.white'), g('neutral', 90), 'Secondary button fill (matches the surface)');
  act('secondary.bg-hover', g('neutral', 10), g('neutral', 85), 'Secondary button, hovered');
  act('secondary.bg-pressed', g('neutral', 15), g('neutral', 80), 'Secondary button, pressed');
  act('secondary.fg', g('neutral', 90), g('neutral', 5), 'Label and icon on a secondary button');
  act('secondary.border', g('neutral', 55), g('neutral', 40), 'Secondary button outline — 3:1, it is what shows the button');
  act('ghost.bg', ref('color.transparent'), ref('color.transparent'), 'Ghost button: no fill until hovered');
  act('ghost.bg-hover', ref('color.black-alpha.6'), ref('color.white-alpha.4'), 'Ghost button, hovered (state layer; inside menus and dialogs use bg/item-hover)');
  act('ghost.bg-pressed', ref('color.black-alpha.8'), ref('color.white-alpha.8'), 'Ghost button, pressed (state layer; inside menus and dialogs use bg/item-pressed)');
  act('ghost.fg', g('brand', 65), g('brand', 30), 'Ghost button label — brand text');
  act('danger.bg', g('danger', sd.base), g('danger', sd.base), 'Destructive button fill');
  act('danger.bg-hover', g('danger', sd.hover), g('danger', sd.hover), 'Destructive button, hovered');
  act('danger.bg-pressed', g('danger', sd.pressed), g('danger', sd.pressed), 'Destructive button, pressed');
  act('danger.fg', ref(`color.${sd.on}`), ref(`color.${sd.on}`), 'Label and icon on a destructive button');
  act('disabled.bg', g('neutral', 10), g('neutral', 85), 'Any disabled button (exempt from contrast)');
  act('disabled.fg', g('neutral', 40), g('neutral', 60), 'Disabled label (exempt from contrast)');
  act('disabled.border', g('neutral', 15), g('neutral', 75), 'Disabled outline (exempt from contrast)');
  for (const k of ['primary', 'danger']) for (const st of ['', '-hover', '-pressed']) {
    sys.pairs.push({ fg: `color.action.${k}.fg`, bg: `color.action.${k}.bg${st}`, min: 4.5, kind: 'text', wcag: '1.4.3' });
  }
  for (const st of ['', '-hover', '-pressed']) sys.pairs.push({ fg: 'color.action.secondary.fg', bg: `color.action.secondary.bg${st}`, min: 4.5, kind: 'text', wcag: '1.4.3' });
  for (const base of ['canvas', 'surface', 'surface-raised', 'surface-overlay', 'surface-sunken'].map((b) => `color.bg.${b}`)) {
    sys.pairs.push({ fg: 'color.action.secondary.border', bg: base, min: 3, kind: 'non-text', wcag: '1.4.11' });
    sys.pairs.push({ fg: 'color.action.ghost.fg', bg: base, min: 4.5, kind: 'text', wcag: '1.4.3' });
  }
  for (const base of ['canvas', 'surface'].map((b) => `color.bg.${b}`)) for (const st of ['-hover', '-pressed']) {
    sys.pairs.push({ fg: 'color.action.ghost.fg', bg: `color.action.ghost.bg${st}`, over: base, min: 4.5, kind: 'text', wcag: '1.4.3' });
  }
  for (const st of ['item-hover', 'item-pressed']) sys.pairs.push({ fg: 'color.action.ghost.fg', bg: `color.bg.${st}`, min: 4.5, kind: 'text', wcag: '1.4.3' });

  // Product roles from config (color.roles): a team adds a role by its job and picks grades; the engine
  // solves the shades and measures every pair the role takes part in. See docs: "Adding a role".
  for (const r of c.roles ?? []) addProductRole(sys, r, ref);

  // Shadow colours (used by Elevation).
  const shadow = [[8, 32], [12, 40], [16, 48], [20, 56]];
  shadow.forEach(([l, dk], i) => sys.add(`color.shadow.${i + 1}`, mode(ref(`color.black-alpha.${l}`), ref(`color.black-alpha.${dk}`), `Shadow strength ${i + 1} of 4 (Light: the shadow itself; Dark: a weak extra cue — height there comes from lighter surfaces)`)));

  return { brand, solids };
}

const ROLE_NAME = /^color\.(bg|fg|border|data)\.[a-z][a-z0-9-]*$/;
const SHADE = /^(white|black|transparent|[a-z]+\.\d+|[a-z]+-alpha\.\d+|chart-\d\.(light|dark))$/;

/** Validate and add one product role: { name, light, dark, description, on: [backgrounds] | carries: [foregrounds] }. */
export function addProductRole(sys, r, ref) {
  const where = `color.roles → ${r?.name ?? '(no name)'}`;
  const fail = (msg) => { throw new Error(`${where}: ${msg}`); };
  if (!ROLE_NAME.test(r?.name ?? '')) fail('name must be color.<bg|fg|border|data>.<job>, lower-case, e.g. "color.bg.highlight" — name it by its job, never its colour');
  if (/\b(red|green|blue|yellow|orange|purple|pink|grey|gray|black|white|teal|violet)\b/.test(r.name)) fail('name it by its job, not its colour');
  if (sys.tokens.has(r.name)) fail('a role with this name already exists — use it');
  if (!r.description) fail('add a description: what it is for');
  for (const m of ['light', 'dark']) {
    if (!SHADE.test(r[m] ?? '')) fail(`${m} must be a shade such as "brand.15", "neutral.90", "white" or "black" (grades, not hex — the engine solves the colour)`);
    if (!sys.tokens.has(`color.${r[m]}`)) fail(`${m} shade color.${r[m]} does not exist (grades run 5–95 in steps of 5)`);
  }
  const group = r.name.split('.')[1];
  const isBg = group === 'bg';
  const list = isBg ? r.carries : r.on;
  if (!Array.isArray(list) || !list.length) fail(isBg ? 'a background must list the foreground roles that will sit on it in "carries"' : 'a foreground must list the backgrounds it may sit on in "on"');
  for (const x of list) if (!sys.tokens.has(x)) fail(`${x} is not a role`);
  sys.add(r.name, { collection: 'Color', type: 'color', values: { Light: ref(`color.${r.light}`), Dark: ref(`color.${r.dark}`) }, description: r.description, product: true });
  const kindOf = (fg) => (/^color\.fg\.icon/.test(fg) ? ['icon', 3, '1.4.11'] : /^color\.(fg\.|action\.[a-z]+\.fg$)/.test(fg) ? ['text', 4.5, '1.4.3'] : ['non-text', 3, '1.4.11']);
  for (const x of list) {
    const fg = isBg ? x : r.name, bg = isBg ? r.name : x;
    const [kind, min, wcag] = kindOf(fg);
    sys.pairs.push({ fg, bg, min, kind, wcag });
  }
}
