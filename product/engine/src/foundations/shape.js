// Radius and Border (incl. focus ring) — linked to Colour, Spacing and each other. Elevation is in elevation.js.
import { ref } from '../system.js';

const P = 'Primitives';
const S = 'Shape';

// Radius: one scale of primitives, six roles named by job, and a style the product picks once (sharp, default, round)
// that remaps the roles. Only the style lives in the config; the focus-ring radii and the nested radii are computed, and
// the checks prove the roles keep their order, keep their corners, keep text inside and that rings hug every shape.
export const RADIUS = { 0: 0, 1: 2, 2: 4, 3: 6, 4: 8, 6: 12, 8: 16, full: 9999 };
export const RADIUS_KEYS = Object.keys(RADIUS).sort((a, b) => RADIUS[a] - RADIUS[b]);
export const STYLE_NAMES = ['sharp', 'default', 'round'];
// What each role is per style, as keys on the scale. none and pill are the same in every style.
export const STYLES = {
  sharp: { mark: '1', control: '1', container: '1', surface: '2' },
  default: { mark: '1', control: '2', container: '4', surface: '6' },
  round: { mark: '2', control: '4', container: '6', surface: '8' },
};
export const SHAPE_ROLES = {
  none: { use: 'Square corners: tables and their cells, full-bleed images and bands, dividers, and the edges where joined parts meet' },
  mark: { use: 'Small square marks about the size of a line of text: checkboxes, colour swatches, keyboard keys, inline code', ring: true },
  control: { use: 'Things people press, type in or pick from: buttons, inputs, selects, tabs, menu items, chips, segmented controls', ring: true },
  container: { use: 'Things that hold content in the page or float just above it: cards, panels, table frames, menus, popovers, tooltips, toasts', ring: true },
  surface: { use: 'The largest shapes, on top of everything: dialogs, sheets, drawers (rounded only on the side that faces the page)', ring: true },
  pill: { use: 'Fully round ends, for things whose label never wraps: badges, counters, toggle tracks, avatars, status dots' },
};
export const ROLE_ORDER = ['none', 'mark', 'control', 'container', 'surface', 'pill'];
export const FOCUS = { width: 2, offset: 2 };
// Limits the checks hold the roles to.
export const MARK_SIZE = 16; // the smallest mark the system draws (a checkbox): its radius stays ≤ a quarter of it, so it never reads as a radio
export const CORNER_SHARE = 0.25; // a mark's or control's radius ≤ this share of its smallest size: a corner, not a round end
export const PILL_FROM = 0.5; // a radius ≥ half the short side makes round ends (CSS draws anything larger the same)
const LOOK = /(^|-)(round|rounded|soft|sharp|square|curved|circle|big|small|large|tiny|xs|sm|md|lg|xl|\d)/;

/** Radius for an element nested inside another: outer − padding, never below 0. */
export const nestedRadius = (outer, padding) => Math.max(0, outer - padding);
/** Is a point (dx, dy) from a rounded corner of radius r inside the shape? */
export const insideCorner = (r, dx, dy) => dx >= r || dy >= r || (r - dx) ** 2 + (r - dy) ** 2 <= r ** 2 + 1e-9;

/** The config's radius choices, checked before anything is computed. Returns { style, roles }. */
export function validateRadiusConfig(cfg) {
  const c = cfg.radius ?? {};
  const fail = (msg) => { throw new Error(`radius: ${msg}`); };
  if (!STYLE_NAMES.includes(c.style)) fail(`"style" must be one of ${STYLE_NAMES.join(', ')}`);
  for (const k of Object.keys(c)) if (!['style', 'roles'].includes(k)) fail(`"${k}" is not a radius choice: the config takes "style" (${STYLE_NAMES.join(', ')}) and "roles" (product shapes)`);
  const roles = (c.roles ?? []).map(productRole);
  const names = roles.map((r) => r.name);
  const twice = names.find((n, i) => names.indexOf(n) !== i);
  if (twice) throw new Error(`radius.roles → ${twice}: this name is listed twice`);
  return { style: c.style, roles };
}

function productRole(t) {
  const where = `radius.roles → ${t?.name ?? '(no name)'}`;
  const fail = (msg) => { throw new Error(`${where}: ${msg}`); };
  for (const k of ['value', 'px', 'radius', 'rem']) if (t && k in t) fail(`"${k}" is not allowed: give a key on the radius scale for each style — "sharp", "default" and "round", e.g. "4" (8px). Keys: ${RADIUS_KEYS.filter((x) => x !== 'full').map((x) => `"${x}" (${RADIUS[x]}px)`).join(', ')}`);
  if (!/^shape\.[a-z]+(-[a-z]+)*$/.test(t?.name ?? '')) fail('name must be shape.<job>, e.g. "shape.thumbnail" — what the shape is for');
  const job = t.name.slice(6);
  if (SHAPE_ROLES[job] || /-focus$/.test(job)) fail('a role with this name already exists — use it');
  if (LOOK.test(job)) fail('name the role by its job (what it is for), not by how it looks or how big it is — the style decides that');
  const keys = {};
  for (const s of STYLE_NAMES) {
    const k = String(t[s] ?? '');
    if (k === 'full') fail('fully round ends are shape.pill — use it');
    if (!(k in RADIUS)) fail(`"${s}" must be a key on the radius scale: ${RADIUS_KEYS.filter((x) => x !== 'full').map((x) => `"${x}" (${RADIUS[x]}px)`).join(', ')}`);
    keys[s] = k;
  }
  if (!(RADIUS[keys.sharp] <= RADIUS[keys.default] && RADIUS[keys.default] <= RADIUS[keys.round])) fail('the radius must not shrink from sharp to default to round');
  if (!t.description) fail('add a description: what the shape is for');
  return { name: t.name, job, keys, use: t.description };
}

export function buildRadius(sys, cfg) {
  const { roles } = validateRadiusConfig(cfg);
  for (const [k, v] of Object.entries(RADIUS)) sys.add(`radius.${k}`, { collection: P, type: 'dimension', value: v, description: k === 'full' ? 'Round ends (anything ≥ half the short side draws the same)' : `${v}px` });
  const keyOf = (job, style) => (job === 'none' ? '0' : job === 'pill' ? 'full' : STYLES[style][job]);
  for (const job of ROLE_ORDER) {
    sys.add(`shape.${job}`, { collection: S, type: 'dimension', values: Object.fromEntries(STYLE_NAMES.map((s) => [s, ref(`radius.${keyOf(job, s)}`)])), description: SHAPE_ROLES[job].use, role: job, product: false });
  }
  for (const r of roles) sys.add(r.name, { collection: S, type: 'dimension', values: Object.fromEntries(STYLE_NAMES.map((s) => [s, ref(`radius.${r.keys[s]}`)])), description: r.use, role: r.job, product: true });
  // Focus ring radius: the shape's radius plus the ring offset (computed, so a ring drawn on its own layer hugs the shape).
  // An outline follows border-radius by itself; these are for rings drawn on a pseudo-element or another layer.
  const ringed = [...ROLE_ORDER.filter((j) => SHAPE_ROLES[j].ring), ...roles.map((r) => r.job)];
  for (const job of ringed) {
    const key = (s) => (SHAPE_ROLES[job] ? keyOf(job, s) : roles.find((r) => r.job === job).keys[s]);
    sys.add(`shape.${job}-focus`, {
      collection: S, type: 'dimension', values: Object.fromEntries(STYLE_NAMES.map((s) => [s, RADIUS[key(s)] + FOCUS.offset])),
      description: `Radius of a focus ring drawn on its own layer around shape.${job} (= shape.${job} + focus.ring.offset)`, derivedFrom: [`shape.${job}`, 'focus.ring.offset'], focusOf: job, product: !SHAPE_ROLES[job],
    });
  }
  sys.notes.push(`Radius: style ${cfg.radius.style}; ${ROLE_ORDER.length + roles.length} roles${roles.length ? ` (${roles.length} added for this product)` : ''}.`);
}

// Border: widths by job, each paired with the colour roles that may draw it. Structure is one pixel; a state is wider than
// the control it marks, so it never shows by colour alone; the current-item bar is wider again; the focus ring is an
// outline that stands off the element. Only the control width is a choice (1px, or 2px for products that want heavier
// fields); everything else is computed from it, and the checks prove the jobs stay apart.
export const BORDER_SCALE = { 1: 1, 2: 2, 3: 3 };
export const BORDER_KEYS = Object.keys(BORDER_SCALE);
export const BORDER_STYLES = ['solid', 'dashed', 'dotted'];
export const BORDER_JOB_ORDER = ['line', 'control', 'state', 'indicator'];
export const BORDER_JOBS = {
  line: { use: 'Lines that show structure: dividers between items, rows and sections; the outline of cards, panels and table frames; the edge of whatever floats (menus, dialogs: color.border.floating)', colors: ['color.border.subtle', 'color.border.default', 'color.border.floating'], identifies: false, sides: 'any' },
  control: { use: 'The boundary that shows where a control is: text fields, selects, checkboxes, radios, secondary buttons, toggles, segmented controls', colors: ['color.border.input', 'color.border.strong', 'color.action.secondary.border'], identifies: true, sides: 'all' },
  state: { use: 'A border that shows a state on its own element: a selected option or card, a field in error, warning or passed — always with a second cue (a check mark, an icon, a message)', colors: ['color.border.selected', 'color.border.danger', 'color.border.warning', 'color.border.success'], identifies: true, sides: 'all' },
  indicator: { use: 'The bar that marks the current item: the current tab, the current navigation link, the leading edge of a selected row', colors: ['color.border.selected'], identifies: true, sides: 'one' },
};
// Limits the checks hold the jobs to.
export const BORDER_MIN = 1; // no hairlines: below a pixel a line looks different on every screen
export const BORDER_MAX = 3; // nothing heavier: a thicker line reads as a bar or a block
const BORDER_LOOK = /(^|-)(thin|thick|heavy|hairline|bold|strong|light|fat|wide|narrow|xs|sm|md|lg|xl|\d)(-|$)/;

/** The config's border choices, checked before anything is computed. Returns { control, roles }. */
export function validateBorderConfig(cfg) {
  const c = cfg.border ?? {};
  const fail = (msg) => { throw new Error(`border: ${msg}`); };
  for (const k of Object.keys(c)) if (!['control', 'roles'].includes(k)) fail(`"${k}" is not a border choice: the config takes "control" (1 or 2: the width of control boundaries) and "roles" (product lines)`);
  const control = c.control ?? 1;
  if (![1, 2].includes(control)) fail(`"control" must be 1 or 2 (px): the width of the boundary of text fields, checkboxes and secondary buttons. ${typeof control === 'number' && control < 1 ? `${control}px is a hairline — browsers draw it differently, and a lighter look is a quieter colour, not a thinner line` : `States are drawn one pixel wider, and nothing goes above ${BORDER_MAX}px`}`);
  const roles = (c.roles ?? []).map(productBorderRole);
  const names = roles.map((r) => r.name);
  const twice = names.find((n, i) => names.indexOf(n) !== i);
  if (twice) throw new Error(`border.roles → ${twice}: this name is listed twice`);
  return { control, roles };
}

function productBorderRole(t) {
  const where = `border.roles → ${t?.name ?? '(no name)'}`;
  const fail = (msg) => { throw new Error(`${where}: ${msg}`); };
  for (const k of ['value', 'px', 'rem', 'em']) if (t && k in t) fail(`"${k}" is not allowed: give "width" as a key on the border scale: ${BORDER_KEYS.map((k2) => `${k2} (${BORDER_SCALE[k2]}px)`).join(', ')}`);
  if (!/^border\.width\.[a-z]+(-[a-z]+)*$/.test(t?.name ?? '')) fail('name must be border.width.<job>, e.g. "border.width.drop-zone" — what the line is for');
  const job = t.name.slice(13);
  if (BORDER_JOBS[job]) fail('a job with this name already exists — use it');
  if (BORDER_LOOK.test(job)) fail('name the line by its job (what it is for), not by how heavy or how big it looks');
  const w = t.width;
  if (typeof w === 'number' && w > 0 && w < BORDER_MIN) fail(`${w}px is a hairline: Chrome and Edge round it up to ${BORDER_MIN}px, Safari and Firefox can draw one device pixel, so it looks different in every browser. Use ${BORDER_MIN} and a quieter colour (color.border.subtle)`);
  if (!(String(w) in BORDER_SCALE)) fail(`"width" must be a key on the border scale: ${BORDER_KEYS.map((k2) => `${k2} (${BORDER_SCALE[k2]}px)`).join(', ')}`);
  if (!/^color\.(border\.[a-z-]+|action\.[a-z]+\.border)$/.test(t.color ?? '')) fail('"color" must be a border colour role (color.border.* or color.action.*.border) — the line\'s colour is part of its job');
  if (typeof t.identifies !== 'boolean') fail('"identifies" must be true or false: does someone need this line to find or use something (a control\'s edge, a state, a drop zone)? true means its colour must reach 3:1');
  const style = t.style ?? 'solid';
  if (!BORDER_STYLES.includes(style)) fail(`"style" must be one of ${BORDER_STYLES.join(', ')}`);
  if (!t.description) fail('add a description: what the line is for');
  return { name: t.name, job, key: String(w), color: t.color, identifies: t.identifies, style, use: t.description };
}

/** The widths a product gets: control from the config, the rest computed from it. */
export const borderWidths = (control) => ({ line: 1, control, state: control + 1, indicator: Math.max(3, control + 1) });

export function buildBorder(sys, cfg) {
  const { control, roles } = validateBorderConfig(cfg);
  const B = 'Border';
  for (const [k, v] of Object.entries(BORDER_SCALE)) sys.add(`border.width.${k}`, { collection: P, type: 'dimension', value: v, description: `${v}px` });
  const w = borderWidths(control);
  for (const job of BORDER_JOB_ORDER) {
    const j = BORDER_JOBS[job];
    sys.add(`border.width.${job}`, { collection: B, type: 'dimension', value: ref(`border.width.${w[job]}`), description: j.use, job, colors: j.colors, identifies: j.identifies, sides: j.sides, style: 'solid', product: false });
  }
  for (const r of roles) if (!sys.tokens.has(r.color)) throw new Error(`border.roles → ${r.name}: ${r.color} is not a colour role in this system — use a color.border.* role, or add one in color.roles`);
  for (const r of roles) sys.add(r.name, { collection: B, type: 'dimension', value: ref(`border.width.${r.key}`), description: r.use, job: r.job, colors: [r.color], identifies: r.identifies, sides: 'any', style: r.style, product: true });
  sys.add('focus.ring.width', { collection: B, type: 'dimension', value: ref(`border.width.${FOCUS.width}`), description: 'Focus ring thickness: an outline on :focus-visible (WCAG 2.4.7; 2.4.13 asks ≥ 2px)', job: 'focus' });
  sys.add('focus.ring.offset', { collection: B, type: 'dimension', value: ref('space.0-5'), description: 'Gap between the element and its focus ring: the ring is measured against the page, not the element\'s fill', job: 'focus' });
  sys.add('focus.ring.color', { collection: B, type: 'color', value: ref('color.border.focus'), description: 'Focus ring colour (linked to Colour)', job: 'focus' });
  sys.notes.push(`Border: control ${control}px (state ${w.state}px, indicator ${w.indicator}px); ${BORDER_JOB_ORDER.length + roles.length} jobs${roles.length ? ` (${roles.length} added for this product)` : ''}.`);
}
