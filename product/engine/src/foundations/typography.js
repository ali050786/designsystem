// Typography: families, weights, one size scale per breakpoint, letter-spacing by size, and the text styles.
// Only choices live in the config (fonts, base size, ratio per breakpoint); every size, line height and
// letter-spacing is computed here, and the checks then prove the rules hold at every breakpoint.
import { ref } from '../system.js';

const P = 'Primitives';
const R = 'Responsive';
export const BREAKPOINTS = ['sm', 'md', 'lg', 'xl'];
export const MIN_SIZE = 12; // smallest text anywhere
export const READING_LH = 1.5; // reading text never below this (WCAG 1.4.12 baseline; 1.4.8)
export const MIN_LH = 1.15; // no style below this: ascenders and descenders of wrapped lines would touch
export const TRACK_FROM = 24; // no negative letter-spacing below this size
export const GRID4_FROM = 32; // sizes from here up land on the 4px grid; below, on whole even pixels

export const WEIGHTS = { regular: 400, medium: 500, semibold: 600, bold: 700 };
// Style names as design tools list them for the default fonts (Inter, JetBrains Mono).
export const FONT_STYLE = { regular: 'Regular', medium: 'Medium', semibold: 'Semi Bold', bold: 'Bold' };
// Letter-spacing in em, so it grows and shrinks with the size it is applied to.
export const TRACKING = { normal: 0, tight: -0.01, tighter: -0.02, caps: 0.06 };
export const trackingFor = (size, upper = false) => (upper ? 'caps' : size >= 44 ? 'tighter' : size >= TRACK_FROM ? 'tight' : 'normal');

// What a style is for decides its line height and whether it is reading text.
export const KINDS = {
  display: { lh: 1.15, reading: false, about: 'Short, large statements — one or two lines' },
  heading: { lh: 1.25, reading: false, about: 'Headings that name a page or a section' },
  title: { lh: 1.3, reading: false, about: 'Names of components: cards, dialogs, panels' },
  label: { lh: 4 / 3, reading: false, about: 'Text people act on: buttons, fields, tabs' },
  reading: { lh: READING_LH, reading: true, about: 'Text people read in lines: paragraphs, help, code' },
};

// The built-in styles. A step is a position on the scale (0 = the base size). Styles with `scales` take the
// breakpoint's ratio, so they grow on wider screens; all others keep their small-screen size everywhere.
export const ROLES = {
  display: { kind: 'display', weight: 'bold', family: 'sans', scales: true, variants: {
    lg: [8, 'The one big statement on a landing, welcome or empty page'],
    md: [7, 'Hero heading on a marketing or onboarding page'],
    sm: [6, 'A large statement inside a page, such as a welcome banner'] } },
  heading: { kind: 'heading', weight: 'semibold', family: 'sans', scales: true, variants: {
    lg: [5, 'Page title — the h1 of a screen'],
    md: [4, 'Section heading inside a page'],
    sm: [3, 'Subsection heading'] } },
  title: { kind: 'title', weight: 'semibold', family: 'sans', variants: {
    lg: [2, 'Dialog and side-panel titles'],
    md: [1, 'Card and panel titles'],
    sm: [0, 'Titles in dense lists, menus and table groups'] } },
  body: { kind: 'reading', weight: 'regular', family: 'sans', variants: {
    lg: [1, 'Lead paragraph at the top of a page or section'],
    md: [0, 'Default paragraphs and descriptions'],
    sm: [-1, 'Secondary paragraphs, dense screens, text in table cells'] } },
  label: { kind: 'label', weight: 'medium', family: 'sans', variants: {
    lg: [0, 'Buttons and controls in comfortable density'],
    md: [-1, 'Buttons, form labels, tabs, menu items'],
    sm: [-2, 'Compact controls, badges and chips'] } },
  caption: { kind: 'reading', weight: 'regular', family: 'sans', variants: {
    md: [-2, 'Help text, timestamps, footnotes, chart labels'] } },
  code: { kind: 'reading', weight: 'regular', family: 'mono', variants: {
    md: [-1, 'Code blocks, and inline code in body text'],
    sm: [-2, 'Inline code in small text; IDs and keys in tables'] } },
  numeric: { kind: 'reading', weight: 'regular', family: 'sans', tabular: true, variants: {
    lg: [5, 'Headline figures in metric cards', { kind: 'heading', weight: 'semibold' }],
    md: [0, 'Numbers in tables, forms and running text'],
    sm: [-1, 'Numbers in compact tables'] } },
};

/** A scale step in px: whole even pixels below 32px, the 4px grid from 32px up; never below 12px. */
export function sizeAt(base, ratio, step) {
  const v = base * ratio ** step;
  return Math.max(MIN_SIZE, v < GRID4_FROM ? Math.round(v / 2) * 2 : Math.round(v / 4) * 4);
}
/** Line height in px: the smallest whole even pixel value at or above size × ratio. */
export const lineHeightFor = (size, ratio) => Math.ceil((size * ratio) / 2 - 1e-9) * 2;

/** WCAG large text: >= 24px, or >= 18.66px (14pt) at bold (700+). */
export const isLarge = (size, weight) => size >= 24 || (size >= 18.66 && weight >= 700);

/** Every style's plan: { path, role, variant, kind, weight, family, tabular, upper, scales, use, perBp: {bp: {size, lh, ls}} } */
export function planStyles(cfg) {
  const t = cfg.typography;
  const out = [];
  const plan = (path, s) => {
    const k = KINDS[s.kind];
    const perBp = Object.fromEntries(BREAKPOINTS.map((bp) => {
      const size = sizeAt(t.baseSize, s.scales ? t.ratio[bp] : t.ratio.sm, s.step);
      return [bp, { size, lh: lineHeightFor(size, k.lh), ls: trackingFor(size, s.upper) }];
    }));
    out.push({ path, ...s, reading: k.reading, perBp });
  };
  for (const [role, spec] of Object.entries(ROLES)) {
    for (const [variant, [step, use, over = {}]] of Object.entries(spec.variants)) {
      plan(`type.${role}.${variant}`, { role, variant, step, use, kind: over.kind ?? spec.kind, weight: over.weight ?? spec.weight, family: spec.family, tabular: !!spec.tabular, scales: !!spec.scales, upper: false, product: false });
    }
  }
  for (const s of t.styles ?? []) plan(s.name, productStyle(s, out, t));
  return out;
}

const STYLE_NAME = /^type\.[a-z][a-z0-9-]*\.(xs|sm|md|lg|xl)$/;
const LOOK_WORDS = /\b(big|bigger|small|smaller|tiny|huge|large|bold|light|thin|heavy|xl|px|\d+)\b/;

/** Validate a product style from config (typography.styles) and return its plan input. */
function productStyle(s, existing, t) {
  const where = `typography.styles → ${s?.name ?? '(no name)'}`;
  const fail = (msg) => { throw new Error(`${where}: ${msg}`); };
  if (!STYLE_NAME.test(s?.name ?? '')) fail('name must be type.<job>.<sm|md|lg>, lower-case, e.g. "type.overline.sm" — name it by its job');
  const job = s.name.split('.')[1];
  if (LOOK_WORDS.test(job.replace(/-/g, ' '))) fail('name it by its job (what the text is), not by how it looks');
  if (ROLES[job] && ROLES[job].variants[s.name.split('.')[2]]) fail('a style with this name already exists — use it');
  if (existing.some((x) => x.path === s.name)) fail('this name is listed twice');
  for (const k of ['size', 'fontSize', 'px', 'lineHeight', 'letterSpacing']) if (k in s) fail(`"${k}" is not allowed: give a "step" on the scale — the engine computes size, line height and letter-spacing`);
  if (!Number.isInteger(s.step) || s.step < -2 || s.step > 9) fail('"step" must be a whole number from -2 to 9 (0 = the base size; -2 is the smallest, 12px by default)');
  if (!KINDS[s.kind]) fail(`"kind" must be one of ${Object.keys(KINDS).join(', ')} — it sets the line height`);
  if (!WEIGHTS[s.weight]) fail(`"weight" must be one of ${Object.keys(WEIGHTS).join(', ')}`);
  const family = s.family ?? 'sans';
  if (!['sans', 'mono'].includes(family)) fail('"family" must be sans or mono');
  if (!s.description) fail('add a description: what the text is for');
  const upper = s.case === 'upper';
  if (s.case && !upper) fail('"case" can only be "upper"');
  if (upper && !['label', 'title'].includes(s.kind)) fail('only labels and titles may be upper case — capitals are slow to read in sentences');
  const scales = !!s.scales;
  if (scales && !['display', 'heading'].includes(s.kind)) fail('only display and heading styles change size with the screen; text people read and use stays put');
  const raw = t.baseSize * t.ratio.sm ** s.step;
  if (raw < MIN_SIZE - 0.5) fail(`step ${s.step} would be ${raw.toFixed(1)}px — the smallest text is ${MIN_SIZE}px`);
  const mine = { kind: s.kind, weight: s.weight, family, upper, tabular: !!s.tabular, scales, step: s.step };
  const sizeOf = (x, bp) => sizeAt(t.baseSize, x.scales ? t.ratio[bp] : t.ratio.sm, x.step);
  const twin = existing.find((x) => x.weight === mine.weight && x.family === mine.family && x.upper === mine.upper && x.tabular === mine.tabular
    && BREAKPOINTS.every((bp) => sizeOf(x, bp) === sizeOf(mine, bp)));
  if (twin) fail(`it would look exactly like ${twin.path} (${sizeOf(twin, 'lg')}px ${twin.weight}) — use that style`);
  const [, , variant] = s.name.split('.');
  return { role: job, variant, step: s.step, use: s.description, kind: s.kind, weight: s.weight, family, tabular: !!s.tabular, scales, upper, product: true };
}

/** The config's type choices, checked before anything is computed. */
export function validateTypeConfig(t) {
  const fail = (msg) => { throw new Error(`typography: ${msg}`); };
  if (!Number.isInteger(t.baseSize) || t.baseSize % 2 || t.baseSize < 14 || t.baseSize > 24) fail('"baseSize" must be a whole even number of px from 14 to 24 (sizes are whole even pixels; 16 is the default)');
  let prev = 0;
  for (const bp of BREAKPOINTS) {
    const v = t.ratio?.[bp];
    if (typeof v !== 'number' || v < 1.05 || v > 1.5) fail(`"ratio.${bp}" must be a number from 1.05 to 1.5`);
    if (v < prev) fail('ratios must not shrink from sm to xl — wider screens never get smaller headings');
    prev = v;
  }
  if (t.charWidth !== undefined && (typeof t.charWidth !== 'number' || t.charWidth < 0.3 || t.charWidth > 0.7)) fail('"charWidth" is the average character width of the sans font in em (0.3–0.7; Inter measures 0.48)');
  for (const k of ['sans', 'mono']) if (typeof t[k] !== 'string' || !t[k].trim()) fail(`"${k}" must be a CSS font stack, e.g. "Inter, system-ui, sans-serif"`);
  if (/^\s*(serif|sans-serif|monospace|cursive|fantasy)\s*$/.test(t.sans)) fail('"sans" needs a named font first, with a generic family as the last fallback');
}

export function buildTypography(sys, cfg) {
  const t = cfg.typography;
  validateTypeConfig(t);
  sys.add('font.family.sans', { collection: P, type: 'fontFamily', value: t.sans, description: 'Interface and reading text' });
  sys.add('font.family.mono', { collection: P, type: 'fontFamily', value: t.mono, description: 'Code, IDs and keys' });
  for (const [k, v] of Object.entries(WEIGHTS)) sys.add(`font.weight.${k}`, { collection: P, type: 'fontWeight', value: v });
  const track = { normal: 'Text below 24px', tight: 'Headings from 24px', tighter: 'Display and headings from 44px', caps: 'Upper-case labels' };
  for (const [k, v] of Object.entries(TRACKING)) sys.add(`font.letter-spacing.${k}`, { collection: P, type: 'letterSpacing', value: v, description: `${track[k]} (em)` });

  const styles = planStyles(cfg);
  const sizes = new Set(styles.flatMap((s) => BREAKPOINTS.map((bp) => s.perBp[bp].size)));
  for (const s of [...sizes].sort((a, b) => a - b)) sys.add(`font.size.${s}`, { collection: P, type: 'dimension', value: s });

  for (const s of styles) {
    const weight = WEIGHTS[s.weight];
    const values = Object.fromEntries(BREAKPOINTS.map((bp) => [bp, {
      fontFamily: ref(`font.family.${s.family}`),
      fontSize: ref(`font.size.${s.perBp[bp].size}`),
      fontWeight: ref(`font.weight.${s.weight}`),
      lineHeight: s.perBp[bp].lh, // px, whole even pixels
      letterSpacing: ref(`font.letter-spacing.${s.perBp[bp].ls}`), // em
    }]));
    const large = Object.fromEntries(BREAKPOINTS.map((bp) => [bp, isLarge(s.perBp[bp].size, weight)]));
    sys.add(s.path, {
      collection: R, type: 'typography', values, description: s.use,
      role: s.role, variant: s.variant, kind: s.kind, tabular: s.tabular, reading: s.reading, scales: s.scales, upper: s.upper, product: s.product, step: s.step, large,
    });
  }
}
