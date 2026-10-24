// Colour AI content: a machine-readable contract (JSON) and a rulebook (Markdown) for AI tools.
// Both are generated from the engine, so they always match the shipped tokens.
import { cssName } from './css.js';
import { contrast } from '../color-math.js';
import { flatten } from '../checks/index.js';

const STATUSES = ['success', 'warning', 'danger', 'info'];

// Which chapter of the colour foundation documents each role (mirrors the Figma file).
export function chapterOf(path) {
  const p = path.replace(/^color\./, '');
  if (/^shadow\./.test(p) || ['bg.canvas', 'bg.surface', 'bg.surface-sunken', 'bg.surface-raised', 'bg.surface-overlay', 'bg.selected', 'bg.scrim'].includes(p)) return { n: '05', title: 'Surfaces and depth' };
  if (['fg.default', 'fg.muted', 'fg.subtle', 'fg.brand', 'fg.link', 'fg.link-hover', 'fg.disabled', 'fg.icon', 'fg.icon-subtle', 'border.subtle', 'border.default', 'border.strong', 'border.input'].includes(p)) return { n: '06', title: 'Text, icons and outlines' };
  if (/^action\./.test(p) || /^bg\.(surface-hover|surface-pressed|state-|item-|disabled|brand)/.test(p) || p === 'border.focus' || p === 'fg.on-brand') return { n: '07', title: 'Actions and states' };
  return { n: '08', title: 'Status and data' };
}

export function kindOf(path) {
  if (path.startsWith('color.shadow.')) return 'shadow';
  if (/state-(hover|pressed)$|ghost\.bg-(hover|pressed)$|\.scrim$/.test(path)) return 'tint';
  if (path.startsWith('color.border.') || path.endsWith('.border')) return 'line';
  if (/^color\.fg\.icon/.test(path)) return 'icon';
  if (path.startsWith('color.fg.') || /^color\.action\.[a-z]+\.fg$/.test(path)) return 'text';
  if (path.startsWith('color.data.')) return 'data';
  return 'fill';
}

const TW_PREFIX = { fill: 'bg', tint: 'bg', text: 'text', icon: 'text', line: 'border', data: 'fill', shadow: 'shadow' };

export const DECISIONS = [
  { what: 'A background', question: 'Where does it sit?', answers: [
    ['The page itself', 'color.bg.canvas'], ['A card, panel or table', 'color.bg.surface'], ['Set back inside a card (table head, well, code)', 'color.bg.surface-sunken'],
    ['Stays above scrolling content (sticky header, toolbar)', 'color.bg.surface-raised'], ['Opens on top (menu, popover, dialog)', 'color.bg.surface-overlay'],
    ['The selected item', 'color.bg.selected'], ['A message or highlight tint', 'color.bg.{intent}-subtle'], ['Behind a modal dialog', 'color.bg.scrim']] },
  { what: 'Text', question: 'How important is it?', answers: [
    ['Main content and headings', 'color.fg.default'], ['Supporting details', 'color.fg.muted'], ['Meta text, timestamps, placeholders', 'color.fg.subtle'],
    ['A link (always underlined)', 'color.fg.link'], ['Status words', 'color.fg.{intent}'], ['On a solid fill', 'color.fg.on-{fill}'], ['A good / bad change (with an arrow)', 'color.fg.positive / color.fg.negative']] },
  { what: 'An icon', question: 'Does it carry meaning?', answers: [
    ['Beside a label', 'color.fg.icon'], ['Chevron or decoration', 'color.fg.icon-subtle'], ['Status icon', 'color.fg.{intent}'], ['Inside a button with a label', 'color.action.{kind}.fg'], ['An icon-only button (toolbar, row actions): ghost button with a neutral icon', 'color.fg.icon']] },
  { what: 'An outline', question: 'Would someone miss the control if this line disappeared?', answers: [
    ['Yes — input, checkbox, radio', 'color.border.input'], ['Yes — button, toggle, chip', 'color.border.strong'], ['No — divider, card edge', 'color.border.subtle / color.border.default'],
    ['Keyboard focus', 'color.border.focus'], ['Field in error', 'color.border.danger']] },
  { what: 'A button', question: 'How important is the action?', answers: [
    ['The main action (one per view)', 'color.action.primary.*'], ['An alternative', 'color.action.secondary.*'], ['Quiet actions, toolbars', 'color.action.ghost.*'],
    ['Deletes or can\'t be undone', 'color.action.danger.*'], ['Not available right now', 'color.action.disabled.*']] },
  { what: 'Hover or pressed', question: 'What is underneath?', answers: [
    ['canvas, surface or sunken', 'color.bg.state-hover / color.bg.state-pressed (translucent tint)'], ['Inside a menu, popover, dialog or raised card', 'color.bg.item-hover / color.bg.item-pressed (solid)'],
    ['A row on a surface (solid)', 'color.bg.surface-hover / color.bg.surface-pressed']] },
  { what: 'Data and charts', question: 'What does it show?', answers: [
    ['A good change (arrow shows direction)', 'color.fg.positive (text) / color.data.positive (marks)'], ['A bad change', 'color.fg.negative (text) / color.data.negative (marks)'], ['No change', 'color.data.neutral'],
    ['Several series, in order', 'color.data.chart-1 … chart-8'], ['Axes and ticks', 'color.data.axis'], ['Gridlines (decorative)', 'color.data.gridline']] },
];

export const RULES = [
  ['CR-01', 'Use roles, never shades or hex.', 'Roles carry the Light and Dark values and the contrast promise; `color.<hue>.<grade>` and hex codes carry neither.', '—'],
  ['CR-02', 'Put text, icons and outlines only on backgrounds listed for them in the pair contract.', 'Only listed pairs are measured. Anything else is unsupported.', '1.4.3, 1.4.11'],
  ['CR-03', 'On a solid fill (bg.brand, bg.danger, action.primary.bg …) use its partner on- colour.', 'Any other text on a solid fill falls far below 4.5 : 1.', '1.4.3'],
  ['CR-04', 'Never use colour alone to carry meaning.', 'Status needs words or an icon, links need an underline, changes need an arrow or sign.', '1.4.1'],
  ['CR-05', 'Positive and negative mean good and bad, not up and down.', 'A falling error rate is positive (green with ▼). Choose by meaning; the arrow shows direction.', '1.4.1'],
  ['CR-06', 'Hover with translucent tints only on canvas, surface or sunken; inside menus, popovers, dialogs and raised cards use the solid item roles.', 'In Dark, lightening a high surface closes the gap to its text (brand text measured at 2.8 : 1).', '1.4.3'],
  ['CR-07', 'Never place ghost buttons or brand-coloured text on a tinted sunken well.', 'Brand text there lands on the 4.5 : 1 line — too close to rely on.', '1.4.3'],
  ['CR-08', 'One primary action per view.', 'Two primaries force people to choose between equals.', '—'],
  ['CR-09', 'Every focusable element shows a 2px border.focus ring with a 2px gap on :focus-visible. Never remove it.', 'Keyboard users lose their place without it.', '2.4.7, 2.4.13'],
  ['CR-10', 'Outlines that identify a control use border.input or border.strong; border.subtle and border.default are decorative only.', 'People need to see a field\'s edge to find it (3 : 1).', '1.4.11'],
  ['CR-11', 'Disabled colours are exempt from contrast, so never put information in disabled text; explain nearby why something is disabled.', 'Low-contrast text is hard to read for many people.', '1.4.3 (exception)'],
  ['CR-12', 'Overlays (menus, popovers, dialogs) take their whole elevation level — bg.surface-overlay, border.floating at border.width.line and the level\'s shadow; modal dialogs also get bg.scrim (Elevation rulebook).', 'Depth must not rely on shadow alone.', '1.4.11'],
  ['CR-13', 'Use chart series in order (chart-1, chart-2 …) and label series directly or with a legend.', 'The order is tuned so neighbours stay distinct for colour-blind readers.', '1.4.1'],
  ['CR-14', 'Brand colour is identity, not an intent. Never use it to mean success.', 'Intent colours must keep one meaning everywhere.', '—'],
  ['CR-15', 'Design once with roles; switch Light and Dark by mode (data-theme on <html>), never by swapping names.', 'Roles are remapped per mode; swapping names breaks the pair contract.', '—'],
];

const BAD = [
  ['color.fg.subtle', 'color.bg.brand', 'Meta text on a solid brand fill', 'color.fg.on-brand'],
  ['color.fg.brand', 'color.bg.brand', 'Brand text on the brand fill', 'color.fg.on-brand'],
  ['color.fg.on-brand', 'color.bg.warning', 'White text on the warning fill', 'color.fg.on-warning'],
  ['color.fg.positive', 'color.bg.success', 'Positive text on a solid success fill', 'color.fg.on-success'],
  ['color.fg.muted', 'color.bg.danger', 'Muted text on a solid danger fill', 'color.fg.on-danger'],
  ['color.border.subtle', 'color.bg.surface', 'Decorative border used as an input outline', 'color.border.input'],
];

// '{color.neutral.90}' → 'neutral.90' (the hue.grade a role points to; used by people and AI for the gap rule).
const shadeOf = (v) => String(v).replace(/^\{color\.(.+)\}$/, '$1');

export function colorContract(sys, cfg, report) {
  const p = cfg.prefix;
  const R = (path, m, over) => {
    const v = sys.resolve(path, { Color: m });
    return over ? flatten(v, sys.resolve(over, { Color: m })) : v;
  };
  const roles = [...sys.tokens.values()].filter((t) => t.collection === 'Color').map((t) => {
    const kind = kindOf(t.path);
    const tail = t.path.split('.').slice(1).join('-');
    return {
      name: t.path, figma: t.path.replace(/\./g, '/'), css: cssName(p, t.path), tailwind: `${TW_PREFIX[kind]}-${tail}`,
      kind, chapter: t.meta?.product ? 'Product roles' : chapterOf(t.path).title, use: t.description, light: R(t.path, 'Light'), dark: R(t.path, 'Dark'),
      lightShade: shadeOf(t.values.Light), darkShade: shadeOf(t.values.Dark),
      exempt: /disabled/.test(t.path) || /^color\.border\.(subtle|default)$/.test(t.path) || t.path === 'color.data.gridline',
    };
  });
  // One entry per fg/bg(/over). A text role that doubles as an icon colour is listed once, at the stricter text minimum.
  const uniq = new Map();
  for (const pr of sys.pairs) {
    const k = `${pr.fg}|${pr.bg}|${pr.over ?? ''}`;
    if (!uniq.has(k) || uniq.get(k).min < pr.min) uniq.set(k, pr);
  }
  const pairs = [...uniq.values()].map((pr) => {
    const out = { fg: pr.fg, bg: pr.bg, kind: pr.kind, min: pr.min, wcag: pr.wcag };
    if (pr.over) out.over = pr.over;
    for (const m of ['Light', 'Dark']) out[m.toLowerCase()] = +contrast(R(pr.fg, m).slice(0, 7), R(pr.bg, m, pr.over)).toFixed(2);
    return out;
  });
  const notAllowed = BAD.map(([fg, bg, label, fix]) => ({
    fg, bg, label, fix, light: +contrast(R(fg, 'Light').slice(0, 7), R(bg, 'Light').slice(0, 7)).toFixed(2), dark: +contrast(R(fg, 'Dark').slice(0, 7), R(bg, 'Dark').slice(0, 7)).toFixed(2),
  }));
  return {
    $schema: 'ds-color-contract/1', system: sys.name, prefix: p, standard: 'WCAG 2.2 AA', modes: ['Light', 'Dark'],
    modeSwitching: { css: '<html data-theme="light|dark">; without it the OS preference is followed', figma: 'Set the Color collection mode on a frame' },
    build: { brand: cfg.color.brand, ok: report.ok, pairs: pairs.length, measurements: pairs.length * 2 },
    rules: RULES.map(([id, rule, why, wcag]) => ({ id, rule, why, wcag })),
    decisions: DECISIONS,
    roles, pairs, notAllowed,
    // Other tokens that are just another name for a colour role (e.g. elevation surfaces, the focus ring colour).
    aliases: Object.fromEntries([...sys.tokens.values()].filter((t) => !['Color', 'Primitives'].includes(t.collection))
      .filter((t) => Object.values(t.values).every((v) => /^\{color\.(bg|fg|border|action|data|shadow)\./.test(String(v))) && new Set(Object.values(t.values).map(String)).size === 1)
      .map((t) => [cssName(p, t.path), String(Object.values(t.values)[0]).replace(/^\{(.+)\}$/, '$1')])),
  };
}

const code = (s) => `\`${s}\``;
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;

export function colorRulesMd(c) {
  let md = `# Colour rules for AI tools — ${c.system}\n\n`;
  md += `Generated from the engine (brand ${c.build.brand}; ${c.build.pairs} pairs, each measured in Light and Dark, all passing). The same data in machine-readable form: ${code('color.contract.json')}.\n\n`;
  md += `## How to use this file\n1. Pick colours with the **Decision guide**, using role names exactly as written.\n2. Check every text, icon and outline against the **Pair contract** for the background it sits on.\n3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.\n4. Before answering, run the **Self-check**.\n\n`;
  md += `## Hard rules\n` + table(['ID', 'Rule', 'Why', 'WCAG'], c.rules.map((r) => [r.id, r.rule, r.why, r.wcag]));
  md += `\n## Decision guide\n`;
  for (const d of c.decisions) md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, role]) => [w, code(role)]));
  md += `\n## Roles\nIn code use the CSS variable; in Figma the variable of the same name. Light and Dark show each role's value and, in brackets, the shade it points to as hue.grade — white is grade 0, black is grade 100. A gap of 50 grades between two shades gives at least 4.5 : 1, a gap of 40 at least 3 : 1.\n`;
  for (const n of ['Surfaces and depth', 'Text, icons and outlines', 'Actions and states', 'Status and data', 'Product roles']) {
    if (!c.roles.some((r) => r.chapter === n)) continue;
    md += `\n### ${n === 'Product roles' ? 'Roles added for this product' : n}\n` + table(['Role', 'CSS', 'Light', 'Dark', 'Use'], c.roles.filter((r) => r.chapter === n).map((r) => [code(r.name), code(`var(${r.css})`), `${r.light} (${r.lightShade})`, `${r.dark} (${r.darkShade})`, r.use + (r.exempt && !/exempt/i.test(r.use) ? ' *(exempt)*' : '')]));
  }
  md += `\n## Pair contract\nForeground role → the backgrounds it may sit on (minimum ratio). A tint pair names the surface underneath. Anything not listed is unsupported.\n\n`;
  const byFg = {};
  for (const p of c.pairs) (byFg[p.fg] ??= { min: p.min, on: [] }).on.push(p.over ? `${p.bg.replace('color.', '')} over ${p.over.replace('color.bg.', '')}` : p.bg.replace('color.', ''));
  md += table(['Foreground', 'Min', 'Allowed on'], Object.entries(byFg).map(([fg, v]) => [code(fg), `${v.min} : 1`, v.on.join(', ')]));
  md += `\n## Not allowed (measured)\n` + table(['Pair', 'Light', 'Dark', 'Use instead'], c.notAllowed.map((b) => [`${code(b.fg)} on ${code(b.bg)} — ${b.label}`, `${b.light} : 1`, `${b.dark} : 1`, code(b.fix)]));
  md += `\n## Self-check before answering\n- [ ] No hex codes, no rgb(), no ${code('color.<hue>.<grade>')} primitives in the output.\n- [ ] Every role name exists in the Roles tables.\n- [ ] Every text/icon/outline sits on a background listed for it.\n- [ ] Solid fills use their on- colour.\n- [ ] Status, links and changes carry words, an underline or an arrow.\n- [ ] At most one primary action per view; focus ring kept.\n- [ ] Hover inside menus/dialogs uses item roles.\n`;
  return md;
}
