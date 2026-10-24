// Spacing: one scale of primitives, one ladder of sizes used in three directions, and density as one computed rule.
// Only choices live in the config (the density step, the default density, product tokens); every value per density is
// computed here, and the checks then prove the rules hold in every density.
import { ref } from '../system.js';

const P = 'Primitives';
const D = 'Density';
export const DENSITIES = ['comfortable', 'default', 'compact'];
export const BASE = 4; // px per unit; a key is the unit count, so the numbers match Tailwind's (space.4 = 16px)

// The scale. Steps grow with the space, so neighbours always look different: 2px apart up to 8px, 4px up to 24px,
// 8px up to 64px, 16px after. Half units use a hyphen ("0-5" = 2px).
export const SPACE = { 0: 0, '0-5': 0.5, 1: 1, '1-5': 1.5, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 8: 8, 10: 10, 12: 12, 14: 14, 16: 16, 20: 20, 24: 24 };
export const SCALE = Object.keys(SPACE).sort((a, b) => SPACE[a] - SPACE[b]);
export const px = (key) => SPACE[key] * BASE;

export const TARGET_MIN = 24; // WCAG 2.5.8
export const TARGET_ENHANCED = 44; // WCAG 2.5.5 (AAA)
export const MIN_SPACE = 2; // no spacing token gets smaller than this in any density
export const LABEL_ROOM = 4; // at least this much above and below a control's label, in every density
export const GRID_FROM = 8; // from here up every value is on the 4px grid; below, on the 2px grid

// Families say which way the space runs; sizes say how much. A size word is the same distance in every family.
export const FAMILIES = {
  inset: { about: 'Padding inside a container', css: 'padding', figma: 'Padding', tw: 'p-, px-, py-, pt-, pr-, pb-, pl-' },
  stack: { about: 'Vertical gap between things stacked in a column', css: 'row-gap, margin-block (margin-top, margin-bottom)', figma: 'Gap in a vertical auto layout', tw: 'gap-y-, space-y-, mt-, mb-, my-' },
  inline: { about: 'Horizontal gap between things side by side in a row', css: 'column-gap, margin-inline (margin-left, margin-right)', figma: 'Gap in a horizontal auto layout', tw: 'gap-x-, space-x-, ml-, mr-, mx-' },
};
export const SIZE_ORDER = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
// The ladder: what each size word means in default density, as a key on the scale.
export const LADDER = { xs: '1', sm: '2', md: '3', lg: '4', xl: '6', '2xl': '8' };

// The built-in tokens and the job each one does.
export const TOKENS = {
  inset: {
    xs: 'Badges, tags and small chips, above and below the label (their sides take inset.sm)',
    sm: 'Menu items, list rows, tooltips, cells in dense tables',
    md: 'The sides of buttons and inputs; table cells, popovers, toasts',
    lg: 'Cards and panels',
    xl: 'Dialogs, sheets, large cards and empty states',
    '2xl': 'Bands that run across a page; the space above and below a page\'s content',
  },
  stack: {
    xs: 'Parts of one thing: a label and its field, a field and its help text, a title and its subtitle',
    sm: 'Items of one group: options in a checkbox group, rows of a simple list, menu items',
    md: 'A heading and the content under it; items inside a card',
    lg: 'Paragraphs, fields in a form, cards in a list',
    xl: 'Groups in a form or panel; blocks inside a large card',
    '2xl': 'Sections of a page or panel',
  },
  inline: {
    xs: 'An icon and its text in content; a value and its unit',
    sm: 'Items of one group: buttons in a button group, chips, tags; a checkbox or radio and its label',
    md: 'Fields side by side; a title and its actions in a header',
    lg: 'Columns of content inside a card or panel; filters next to a search box',
    xl: 'Groups in a toolbar or action bar',
  },
};
// Sizes of things people press. Control sizes follow the density rule like spacing; the target floor never moves.
export const SIZE_TOKENS = {
  'size.control.height': { base: '10', use: 'Minimum height of buttons, inputs, selects and tabs; the minimum width and height of an icon-only button', target: true },
  'size.control.icon-gap': { base: '2', use: 'Gap between an icon and the label inside a control' },
  'size.target.min': { base: '6', use: 'Smallest pointer target in every density (WCAG 2.5.8: 24×24px): the hit area of a checkbox, a close icon, a drag handle', target: true, fixed: true },
};
// The label each density's controls use (Typography foundation), for the label-fit check.
export const LABEL_FOR = { comfortable: 'type.label.lg', default: 'type.label.md', compact: 'type.label.md' };

/** The key `steps` places along the scale from `key`, or undefined past either end. */
export const shift = (key, steps) => SCALE[SCALE.indexOf(key) + steps];
/** Keys per density for a default key: compact `step` steps down, comfortable `step` steps up. */
export const densityKeys = (base, step) => ({ comfortable: shift(base, step), default: base, compact: shift(base, -step) });

const NAME = /^space\.(inset|stack|inline)\.(2xs|xs|sm|md|lg|xl|2xl|3xl|4xl)$/;

/** The config's spacing choices, checked before anything is computed. Returns { step, tokens }. */
export function validateSpaceConfig(cfg) {
  const s = cfg.spacing ?? {};
  const fail = (msg) => { throw new Error(`spacing: ${msg}`); };
  const step = s.densityStep ?? 1;
  if (!Number.isInteger(step) || step < 1 || step > 2) fail('"densityStep" must be 1 or 2 — how many steps along the scale compact and comfortable move from default');
  if (!DENSITIES.includes(cfg.density?.default)) fail(`"density.default" must be one of ${DENSITIES.join(', ')}`);
  const tokens = (s.tokens ?? []).map((t) => productToken(t, step));
  const names = tokens.map((t) => t.name);
  const twice = names.find((n, i) => names.indexOf(n) !== i);
  if (twice) throw new Error(`spacing.tokens → ${twice}: this name is listed twice`);
  return { step, tokens };
}

/** Validate a product token from config (spacing.tokens). */
function productToken(t, step) {
  const where = `spacing.tokens → ${t?.name ?? '(no name)'}`;
  const fail = (msg) => { throw new Error(`${where}: ${msg}`); };
  for (const k of ['value', 'px', 'size', 'rem', 'comfortable', 'default', 'compact']) {
    if (t && k in t) fail(`"${k}" is not allowed: give a "base" — a key on the spacing scale, such as "8" (32px). The engine computes compact and comfortable`);
  }
  if (!NAME.test(t?.name ?? '')) {
    if (/^space\.[a-z0-9-]+\./.test(t?.name ?? '') && !/^space\.(inset|stack|inline)\./.test(t.name)) fail('the family must be inset (padding), stack (vertical gaps) or inline (horizontal gaps). Space for one component belongs with the component, not in spacing');
    fail('name must be space.<inset|stack|inline>.<size>, with a size from 2xs to 4xl, e.g. "space.stack.3xl"');
  }
  const [, family, size] = t.name.split('.');
  if (TOKENS[family][size]) fail('a token with this name already exists — use it');
  if (!(String(t.base) in SPACE)) fail(`"base" must be a key on the spacing scale: ${SCALE.map((k) => `"${k}" (${px(k)}px)`).join(', ')}`);
  const base = String(t.base);
  const keys = densityKeys(base, step);
  if (keys.compact === undefined) fail(`base "${base}" (${px(base)}px) has no step below it for compact`);
  if (keys.comfortable === undefined) fail(`base "${base}" (${px(base)}px) has no step above it for comfortable — the scale ends at ${px(SCALE.at(-1))}px`);
  if (!t.description) fail('add a description: what the space is for');
  return { name: t.name, family, size, base, use: t.description };
}

export function buildSpacing(sys, cfg) {
  const { step, tokens } = validateSpaceConfig(cfg);
  for (const k of SCALE) sys.add(`space.${k}`, { collection: P, type: 'dimension', value: px(k), description: `${px(k)}px` });

  const add = (path, base, description, meta) => {
    const keys = meta.fixed ? { comfortable: base, default: base, compact: base } : densityKeys(base, step);
    const values = Object.fromEntries(DENSITIES.map((d) => [d, ref(`space.${keys[d]}`)]));
    sys.add(path, { collection: D, type: 'dimension', values, description, base, ...meta });
  };
  for (const [family, sizes] of Object.entries(TOKENS)) {
    for (const [size, use] of Object.entries(sizes)) add(`space.${family}.${size}`, LADDER[size], use, { family, size, spacing: true, product: false });
  }
  for (const t of tokens) add(t.name, t.base, t.use, { family: t.family, size: t.size, spacing: true, product: true });
  for (const [path, s] of Object.entries(SIZE_TOKENS)) add(path, s.base, s.use, { target: !!s.target, fixed: !!s.fixed, spacing: false, product: false });
  sys.notes.push(`Spacing: density moves every token ${step} step${step > 1 ? 's' : ''} along the scale; default density is ${cfg.density.default}.`);
}
