// W3C Design Tokens (DTCG 2025.10) export.
// - tokens.json: every token, default mode as $value, other modes in $extensions
// - figma/<Collection>.<Mode>.tokens.json: one file per collection and mode, Figma variable types only
import { isAlias, aliasTarget } from '../system.js';
import { hexToRgb } from '../color-math.js';

export const EXT = 'org.ds';
const px = (v) => ({ value: v, unit: 'px' });

export function dtcgColor(hex) {
  const [r, g, b] = hexToRgb(hex.slice(0, 7));
  const alpha = hex.length === 9 ? +(parseInt(hex.slice(7), 16) / 255).toFixed(3) : 1;
  return { colorSpace: 'srgb', components: [r, g, b].map((x) => +x.toFixed(4)), alpha, hex: hex.slice(0, 7).toLowerCase() };
}

const families = (s) => s.split(',').map((x) => x.trim().replace(/^"|"$/g, ''));

/** Convert one stored value to DTCG; aliases stay as "{path}". */
function toDtcg(sys, type, v, ctx) {
  if (isAlias(v)) return v;
  switch (type) {
    case 'color': return dtcgColor(v);
    case 'dimension': return px(v);
    case 'duration': return { value: v, unit: 'ms' };
    case 'fontFamily': return families(v);
    case 'letterSpacing': return v; // em, as a plain number (DTCG dimensions have no em unit)
    case 'typography': {
      const size = sys.resolveValue(v.fontSize, ctx);
      const em = sys.resolveValue(v.letterSpacing, ctx);
      return { fontFamily: v.fontFamily, fontSize: v.fontSize, fontWeight: v.fontWeight, lineHeight: +(v.lineHeight / size).toFixed(3), letterSpacing: px(+(em * size).toFixed(2)) };
    }
    case 'shadow': return { color: v.color, offsetX: px(v.offsetX), offsetY: px(v.offsetY), blur: px(v.blur), spread: px(v.spread) };
    default: return v;
  }
}

function setPath(root, path, node) {
  const parts = path.split('.');
  let cur = root;
  for (const p of parts.slice(0, -1)) {
    cur[p] ??= {};
    if ('$value' in cur[p]) throw new Error(`Token/group clash at ${p} in ${path}`);
    cur = cur[p];
  }
  cur[parts.at(-1)] = { ...(cur[parts.at(-1)] ?? {}), ...node };
}

export function toTokensJson(sys) {
  const root = { $description: `${sys.name} design tokens — generated, do not edit by hand.` };
  for (const t of sys.tokens.values()) {
    const col = sys.collections.get(t.collection);
    const [first, ...rest] = col.modes;
    const ctxFor = (m) => ({ [t.collection]: m });
    const node = { $type: t.type === 'letterSpacing' ? 'number' : t.type, $value: toDtcg(sys, t.type, t.values[first], ctxFor(first)) };
    if (t.description) node.$description = t.description;
    const ext = { collection: t.collection, tier: t.collection === 'Primitives' ? 'primitive' : 'semantic' };
    if (rest.length) ext.modes = Object.fromEntries(col.modes.map((m) => [m, toDtcg(sys, t.type, t.values[m], ctxFor(m))]));
    if (t.type === 'typography') { ext.tabularNumerals = !!t.meta.tabular; ext.textCase = t.meta.upper ? 'uppercase' : 'none'; ext.reading = !!t.meta.reading; ext.largeText = t.meta.large; }
    if (t.type === 'letterSpacing') ext.unit = 'em';
    node.$extensions = { [EXT]: ext };
    setPath(root, t.path, node);
  }
  return root;
}

// ---------- Figma ----------
const SCOPES = [
  [/^color\.action\.[a-z]+\.bg/, ['FRAME_FILL', 'SHAPE_FILL']],
  [/^color\.action\.[a-z]+\.fg/, ['TEXT_FILL', 'SHAPE_FILL']],
  [/^color\.action\.[a-z]+\.border/, ['STROKE_COLOR']],
  [/^color\.bg\.|^elevation\.[a-z]+\.(surface|scrim)/, ['FRAME_FILL', 'SHAPE_FILL']],
  [/^color\.fg\./, ['TEXT_FILL', 'SHAPE_FILL']],
  [/^color\.border\.|^focus\.ring\.color|^elevation\.[a-z]+\.border/, ['STROKE_COLOR']],
  [/^layer\./, []], // stacking order: code only (Figma has no z-index), kept out of every picker
  [/^elevation\.[a-z]+\.shadow\.color$/, ['EFFECT_COLOR']],
  [/^elevation\.[a-z]+\.shadow\./, ['EFFECT_FLOAT']],
  [/^color\.data\./, ['SHAPE_FILL', 'STROKE_COLOR']],
  [/^color\.shadow\./, ['EFFECT_COLOR']],
  [/^space\.(inset|stack|inline)|^layout\.(gutter|margin)$/, ['GAP']],
  [/^size\.|^layout\.(container|measure|pane|tile|header)\./, ['WIDTH_HEIGHT']],
  [/^layout\.(columns|scroll-padding)/, []], // a count and a code-only value: kept out of every picker
  [/^shape\./, ['CORNER_RADIUS']],
  [/^border\.width\.|^focus\.ring\.(width|offset)/, ['STROKE_FLOAT']],
  [/\.font-size$/, ['FONT_SIZE']],
  [/\.line-height$/, ['LINE_HEIGHT']],
  [/\.letter-spacing$/, ['LETTER_SPACING']],
  [/\.font-weight$/, ['FONT_WEIGHT']],
  [/\.font-family$/, ['FONT_FAMILY']],
];
const scopesFor = (path) => (SCOPES.find(([re]) => re.test(path)) ?? [null, ['ALL_SCOPES']])[1];

/** Figma variables are COLOR, FLOAT, STRING: flatten composites, drop units. */
function figmaEntries(sys, t, mode) {
  const v = t.values[mode];
  const ctx = { [t.collection]: mode };
  const leaf = (type, value) => ({ $type: type, $value: value });
  switch (t.type) {
    case 'color': return [[t.path, leaf('color', isAlias(v) ? v : dtcgColor(v))]];
    case 'dimension': case 'duration': case 'number': case 'fontWeight': case 'letterSpacing': return [[t.path, leaf('number', v)]];
    case 'fontFamily': return [[t.path, leaf('string', isAlias(v) ? v : families(v)[0])]];
    case 'cubicBezier': return [[t.path, leaf('string', isAlias(v) ? v : `cubic-bezier(${v.join(', ')})`)]];
    case 'typography': return [
      [`${t.path}.font-family`, leaf('string', v.fontFamily)],
      [`${t.path}.font-size`, leaf('number', v.fontSize)],
      [`${t.path}.font-weight`, leaf('number', v.fontWeight)],
      [`${t.path}.line-height`, leaf('number', v.lineHeight)],
      [`${t.path}.letter-spacing`, leaf('number', +(sys.resolveValue(v.letterSpacing, ctx) * sys.resolveValue(v.fontSize, ctx)).toFixed(2))], // px
    ];
    case 'shadow': return [
      [`${t.path}.color`, leaf('color', v.color)],
      ...['offsetX', 'offsetY', 'blur', 'spread'].map((k) => [`${t.path}.${k.replace('offset', 'offset-').toLowerCase()}`, leaf('number', v[k])]),
    ];
    default: throw new Error(`No Figma mapping for ${t.type} (${t.path}) ${JSON.stringify(sys.resolveValue(v, ctx))}`);
  }
}

export function toFigmaFiles(sys) {
  const files = {};
  for (const col of sys.collections.values()) {
    for (const mode of col.modes) {
      const root = {};
      for (const t of [...sys.tokens.values()].filter((x) => x.collection === col.name)) {
        for (const [path, node] of figmaEntries(sys, t, mode)) {
          node.$extensions = { 'com.figma': { scopes: col.name === 'Primitives' ? [] : scopesFor(path), hiddenFromPublishing: col.name === 'Primitives' } };
          if (t.description) node.$description = t.description;
          setPath(root, path, node);
        }
      }
      files[`${col.name}.${mode}.tokens.json`] = root;
    }
  }
  return files;
}

export { aliasTarget };
