// Variables as the Figma REST "local variables" response shape (also read by FigCraft's
// variable.import and by most Figma variable importers).
import { isAlias, aliasTarget } from '../system.js';
import { hexToRgb } from '../color-math.js';
import { cssName } from './css.js';

const figmaName = (path) => path.replace(/\./g, '/');
const SCOPES = [
  [/^color\.action\.[a-z]+\.bg/, ['FRAME_FILL', 'SHAPE_FILL']],
  [/^color\.action\.[a-z]+\.fg/, ['TEXT_FILL', 'SHAPE_FILL']],
  [/^color\.action\.[a-z]+\.border/, ['STROKE_COLOR']],
  [/^color\.bg\./, ['FRAME_FILL', 'SHAPE_FILL']],
  [/^color\.fg\./, ['TEXT_FILL', 'SHAPE_FILL']],
  [/^color\.border\./, ['STROKE_COLOR']],
  [/^color\.data\./, ['SHAPE_FILL', 'STROKE_COLOR']],
  [/^color\.shadow\./, ['EFFECT_COLOR']],
];

function rgba(hex) {
  const [r, g, b] = hexToRgb(hex.slice(0, 7));
  const a = hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1;
  return { r, g, b, a };
}

/** collections: names of collections to include; filter: token predicate. */
export function toRestVariables(sys, cfg, { collections = ['Primitives', 'Color'], filter = (t) => t.type === 'color' } = {}) {
  const variableCollections = {};
  const variables = {};
  const colId = (name) => `VariableCollectionId:${name}`;
  const varId = (path) => `VariableID:${path}`;
  for (const name of collections) {
    const c = sys.collections.get(name);
    const modes = c.modes.map((m) => ({ modeId: `${name}:${m}`, name: m }));
    variableCollections[colId(name)] = {
      id: colId(name), name, key: colId(name), modes, defaultModeId: modes[0].modeId,
      remote: false, hiddenFromPublishing: false, variableIds: [],
    };
  }
  const tokens = [...sys.tokens.values()].filter((t) => collections.includes(t.collection) && filter(t));
  const included = new Set(tokens.map((t) => t.path));
  for (const t of tokens) {
    const col = variableCollections[colId(t.collection)];
    const valuesByMode = {};
    for (const [mode, v] of Object.entries(t.values)) {
      if (isAlias(v)) {
        const target = aliasTarget(v);
        if (!included.has(target)) throw new Error(`${t.path} aliases ${target}, which is not exported`);
        valuesByMode[`${t.collection}:${mode}`] = { type: 'VARIABLE_ALIAS', id: varId(target) };
      } else valuesByMode[`${t.collection}:${mode}`] = rgba(v);
    }
    variables[varId(t.path)] = {
      id: varId(t.path), name: figmaName(t.path), key: varId(t.path), variableCollectionId: col.id,
      resolvedType: 'COLOR', valuesByMode, remote: false, description: t.description || '',
      hiddenFromPublishing: t.collection === 'Primitives',
      scopes: t.collection === 'Primitives' ? [] : (SCOPES.find(([re]) => re.test(t.path)) ?? [null, ['ALL_SCOPES']])[1],
      codeSyntax: { WEB: `var(${cssName(cfg.prefix, t.path)})` },
    };
    col.variableIds.push(varId(t.path));
  }
  return { status: 200, error: false, meta: { variableCollections, variables } };
}

// ---------- Typography variables (FigCraft variable.import and Figma importers) ----------
// Primitives: families (string), weights, sizes (number), letter-spacings (em, for reference — Figma styles use px).
// Responsive (sm, md, lg, xl): per style, the five values a Figma text style binds: family and size and weight point to
// primitives; font style (the weight's name), line height and letter-spacing (both px) are computed per breakpoint.
export function typeRestVariables(sys, cfg, { fontStyles = { 400: 'Regular', 500: 'Medium', 600: 'Semi Bold', 700: 'Bold' } } = {}) {
  const variableCollections = {}, variables = {};
  const colId = (name) => `VariableCollectionId:${name}`;
  const varId = (path) => `VariableID:${path}`;
  for (const name of ['Primitives', 'Responsive']) {
    const c = sys.collections.get(name);
    const modes = c.modes.map((m) => ({ modeId: `${name}:${m}`, name: m }));
    variableCollections[colId(name)] = { id: colId(name), name, key: colId(name), modes, defaultModeId: modes[0].modeId, remote: false, hiddenFromPublishing: false, variableIds: [] };
  }
  const add = (path, collection, resolvedType, valuesByMode, { description = '', scopes = [], code = null } = {}) => {
    variables[varId(path)] = {
      id: varId(path), name: path.replace(/\./g, '/'), key: varId(path), variableCollectionId: colId(collection), resolvedType, valuesByMode, remote: false,
      description, hiddenFromPublishing: collection === 'Primitives', scopes: collection === 'Primitives' ? [] : scopes, codeSyntax: code ? { WEB: code } : {},
    };
    variableCollections[colId(collection)].variableIds.push(varId(path));
  };
  const one = (v) => ({ 'Primitives:Value': v });
  const alias = (path) => ({ type: 'VARIABLE_ALIAS', id: varId(path) });
  const first = (stack) => stack.split(',')[0].trim().replace(/^["']|["']$/g, '');
  for (const t of sys.byPrefix('font.')) {
    const v = t.values.Value;
    if (t.type === 'fontFamily') add(t.path, 'Primitives', 'STRING', one(first(v)), { description: `${t.description}. Stack in code: ${v}` });
    else add(t.path, 'Primitives', 'FLOAT', one(v), { description: t.type === 'letterSpacing' ? `${t.description}; Figma styles use px per breakpoint` : t.description });
  }
  const BPS = sys.collections.get('Responsive').modes;
  for (const t of sys.byPrefix('type.')) {
    const per = (fn) => Object.fromEntries(BPS.map((bp) => [`Responsive:${bp}`, fn(bp)]));
    const raw = (bp) => t.values[bp];
    const res = (bp) => sys.resolve(t.path, { Responsive: bp });
    const css = (k) => `var(${cssName(cfg.prefix, t.path)}-${k})`;
    add(`${t.path}.font-family`, 'Responsive', 'STRING', per((bp) => alias(raw(bp).fontFamily.slice(1, -1))), { scopes: ['FONT_FAMILY'], code: css('font-family') });
    add(`${t.path}.font-size`, 'Responsive', 'FLOAT', per((bp) => alias(raw(bp).fontSize.slice(1, -1))), { scopes: ['FONT_SIZE'], code: css('font-size') });
    add(`${t.path}.font-weight`, 'Responsive', 'FLOAT', per((bp) => alias(raw(bp).fontWeight.slice(1, -1))), { scopes: ['FONT_WEIGHT'], code: css('font-weight') });
    add(`${t.path}.font-style`, 'Responsive', 'STRING', per((bp) => fontStyles[res(bp).fontWeight]), { scopes: ['FONT_STYLE'], description: 'The weight as a font style name, for text styles' });
    add(`${t.path}.line-height`, 'Responsive', 'FLOAT', per((bp) => raw(bp).lineHeight), { scopes: ['LINE_HEIGHT'], code: css('line-height'), description: 'px (unitless ratio in code)' });
    add(`${t.path}.letter-spacing`, 'Responsive', 'FLOAT', per((bp) => +(res(bp).letterSpacing * res(bp).fontSize).toFixed(2)), { scopes: ['LETTER_SPACING'], code: css('letter-spacing'), description: 'px (em in code)' });
  }
  return { status: 200, error: false, meta: { variableCollections, variables } };
}

/** Merge REST variable exports: collections with the same id join, variables are added. */
export function mergeRest(...parts) {
  const variableCollections = {}, variables = {};
  for (const p of parts) {
    for (const [id, c] of Object.entries(p.meta.variableCollections)) {
      if (!variableCollections[id]) variableCollections[id] = { ...c, variableIds: [...c.variableIds] };
      else variableCollections[id].variableIds.push(...c.variableIds);
    }
    Object.assign(variables, p.meta.variables);
  }
  return { status: 200, error: false, meta: { variableCollections, variables } };
}

// ---------- Spacing variables (FigCraft variable.import and Figma importers) ----------
// Primitives: the scale (px). Density (comfortable, default, compact): every semantic token aliases a primitive per mode,
// scoped to padding and gaps (spacing) or width and height (control and target sizes).
export function spaceRestVariables(sys, cfg) {
  const variableCollections = {}, variables = {};
  const colId = (name) => `VariableCollectionId:${name}`;
  const varId = (path) => `VariableID:${path}`;
  for (const name of ['Primitives', 'Density']) {
    const c = sys.collections.get(name);
    // Figma's first mode is the default that frames on Auto follow: put the config's default density first.
    const order = name === 'Density' ? [cfg.density.default, ...c.modes.filter((m) => m !== cfg.density.default)] : c.modes;
    const modes = order.map((m) => ({ modeId: `${name}:${m}`, name: m }));
    variableCollections[colId(name)] = { id: colId(name), name, key: colId(name), modes, defaultModeId: modes[0].modeId, remote: false, hiddenFromPublishing: false, variableIds: [] };
  }
  const add = (t, collection, valuesByMode, scopes) => {
    variables[varId(t.path)] = {
      id: varId(t.path), name: figmaName(t.path), key: varId(t.path), variableCollectionId: colId(collection), resolvedType: 'FLOAT', valuesByMode, remote: false,
      description: t.description || '', hiddenFromPublishing: collection === 'Primitives', scopes: collection === 'Primitives' ? [] : scopes,
      codeSyntax: { WEB: `var(${cssName(cfg.prefix, t.path)})` },
    };
    variableCollections[colId(collection)].variableIds.push(varId(t.path));
  };
  for (const t of sys.byPrefix('space.').filter((x) => x.collection === 'Primitives')) add(t, 'Primitives', { 'Primitives:Value': t.values.Value }, []);
  for (const t of [...sys.tokens.values()].filter((x) => x.collection === 'Density')) {
    const vbm = Object.fromEntries(Object.entries(t.values).map(([m, v]) => [`Density:${m}`, { type: 'VARIABLE_ALIAS', id: varId(aliasTarget(v)) }]));
    add(t, 'Density', vbm, t.path.startsWith('space.') || t.path.endsWith('icon-gap') ? ['GAP'] : t.path.includes('scroll-padding') ? [] : ['WIDTH_HEIGHT']);
  }
  return { status: 200, error: false, meta: { variableCollections, variables } };
}

// ---------- Layout variables (FigCraft variable.import and Figma importers) ----------
// Primitives: the breakpoints. Layout (one mode): widths named by job, scoped to width and height. Responsive (sm, md,
// lg, xl): the page grid — columns (kept out of pickers; a grid style binds it), gutter and margin (aliases of the
// spacing scale, scoped to gaps and padding). Merge with spaceRestVariables, which holds the scale and the header tokens.
export function layoutRestVariables(sys, cfg) {
  const variableCollections = {}, variables = {};
  const colId = (name) => `VariableCollectionId:${name}`;
  const varId = (path) => `VariableID:${path}`;
  for (const name of ['Primitives', 'Layout', 'Responsive']) {
    const c = sys.collections.get(name);
    const modes = c.modes.map((m) => ({ modeId: `${name}:${m}`, name: m }));
    variableCollections[colId(name)] = { id: colId(name), name, key: colId(name), modes, defaultModeId: modes[0].modeId, remote: false, hiddenFromPublishing: false, variableIds: [] };
  }
  const add = (t, collection, valuesByMode, scopes) => {
    variables[varId(t.path)] = {
      id: varId(t.path), name: figmaName(t.path), key: varId(t.path), variableCollectionId: colId(collection), resolvedType: 'FLOAT', valuesByMode, remote: false,
      description: t.description || '', hiddenFromPublishing: collection === 'Primitives', scopes: collection === 'Primitives' ? [] : scopes,
      codeSyntax: { WEB: `var(${cssName(cfg.prefix, t.path)})` },
    };
    variableCollections[colId(collection)].variableIds.push(varId(t.path));
  };
  for (const t of sys.byPrefix('breakpoint.')) add(t, 'Primitives', { 'Primitives:Value': t.values.Value }, []);
  for (const t of [...sys.tokens.values()].filter((x) => x.collection === 'Layout')) add(t, 'Layout', { 'Layout:Value': t.values.Value }, ['WIDTH_HEIGHT']);
  for (const t of [...sys.tokens.values()].filter((x) => x.collection === 'Responsive' && x.path.startsWith('layout.'))) {
    const vbm = Object.fromEntries(Object.entries(t.values).map(([m, v]) => [`Responsive:${m}`, isAlias(v) ? { type: 'VARIABLE_ALIAS', id: varId(aliasTarget(v)) } : v]));
    add(t, 'Responsive', vbm, t.path === 'layout.columns' ? [] : ['GAP']);
  }
  return { status: 200, error: false, meta: { variableCollections, variables } };
}

// ---------- Radius variables (FigCraft variable.import and Figma importers) ----------
// Primitives: the radius scale (hidden from pickers). Shape (one mode per radius style, the product's style first so frames
// on Auto use it): the roles alias a primitive per style; the focus-ring radii are computed per style. All scoped to corner
// radius, so they are offered only in the radius field.
export function radiusRestVariables(sys, cfg) {
  const variableCollections = {}, variables = {};
  const colId = (name) => `VariableCollectionId:${name}`;
  const varId = (path) => `VariableID:${path}`;
  for (const name of ['Primitives', 'Shape']) {
    const c = sys.collections.get(name);
    const modes = c.modes.map((m) => ({ modeId: `${name}:${m}`, name: m }));
    variableCollections[colId(name)] = { id: colId(name), name, key: colId(name), modes, defaultModeId: modes[0].modeId, remote: false, hiddenFromPublishing: false, variableIds: [] };
  }
  const add = (t, collection, valuesByMode) => {
    variables[varId(t.path)] = {
      id: varId(t.path), name: figmaName(t.path), key: varId(t.path), variableCollectionId: colId(collection), resolvedType: 'FLOAT', valuesByMode, remote: false,
      description: t.description || '', hiddenFromPublishing: collection === 'Primitives', scopes: collection === 'Primitives' ? [] : ['CORNER_RADIUS'],
      codeSyntax: { WEB: `var(${cssName(cfg.prefix, t.path)})` },
    };
    variableCollections[colId(collection)].variableIds.push(varId(t.path));
  };
  for (const t of sys.byPrefix('radius.').filter((x) => x.collection === 'Primitives')) add(t, 'Primitives', { 'Primitives:Value': t.values.Value });
  for (const t of [...sys.tokens.values()].filter((x) => x.collection === 'Shape')) {
    add(t, 'Shape', Object.fromEntries(Object.entries(t.values).map(([m, v]) => [`Shape:${m}`, isAlias(v) ? { type: 'VARIABLE_ALIAS', id: varId(aliasTarget(v)) } : v])));
  }
  return { status: 200, error: false, meta: { variableCollections, variables } };
}

// ---------- Border variables (FigCraft variable.import and Figma importers) ----------
// Primitives: the border scale (hidden from pickers). Border (one mode): the jobs alias a primitive, scoped to stroke
// weight so they are offered only there; the focus ring's width and offset (stroke weight) and colour (stroke colour,
// linked to color.border.focus). Merge with spaceRestVariables (the ring offset aliases space.0-5) and toRestVariables.
export function borderRestVariables(sys, cfg) {
  const variableCollections = {}, variables = {};
  const colId = (name) => `VariableCollectionId:${name}`;
  const varId = (path) => `VariableID:${path}`;
  for (const name of ['Primitives', 'Border']) {
    const c = sys.collections.get(name);
    const modes = c.modes.map((m) => ({ modeId: `${name}:${m}`, name: m }));
    variableCollections[colId(name)] = { id: colId(name), name, key: colId(name), modes, defaultModeId: modes[0].modeId, remote: false, hiddenFromPublishing: false, variableIds: [] };
  }
  const val = (v) => (isAlias(v) ? { type: 'VARIABLE_ALIAS', id: varId(aliasTarget(v)) } : v);
  const add = (t, collection, type, scopes) => {
    variables[varId(t.path)] = {
      id: varId(t.path), name: figmaName(t.path), key: varId(t.path), variableCollectionId: colId(collection), resolvedType: type,
      valuesByMode: Object.fromEntries(Object.entries(t.values).map(([m, v]) => [`${collection}:${m}`, val(v)])), remote: false,
      description: t.description || '', hiddenFromPublishing: collection === 'Primitives', scopes: collection === 'Primitives' ? [] : scopes,
      codeSyntax: { WEB: `var(${cssName(cfg.prefix, t.path)})` },
    };
    variableCollections[colId(collection)].variableIds.push(varId(t.path));
  };
  for (const t of sys.byPrefix('border.width.').filter((x) => x.collection === 'Primitives')) add(t, 'Primitives', 'FLOAT', []);
  for (const t of [...sys.tokens.values()].filter((x) => x.collection === 'Border')) add(t, 'Border', t.type === 'color' ? 'COLOR' : 'FLOAT', t.type === 'color' ? ['STROKE_COLOR'] : ['STROKE_FLOAT']);
  return { status: 200, error: false, meta: { variableCollections, variables } };
}

// ---------- Elevation variables (FigCraft variable.import and Figma importers) ----------
// Elevation (one mode): each level's surface (fill scopes), edge (stroke colour) and scrim, all aliases of Colour roles, so a
// frame in Dark mode shows the Dark surfaces; and each shadow's numbers (offset-y, blur, spread: effect scopes) for the effect
// styles to bind, beside the Colour shadow strength each style's colour binds to. The stacking order (layer.*) is code only:
// Figma has no z-index, so it is not exported. Merge with toRestVariables (the aliases point into Color).
export function elevationRestVariables(sys, cfg) {
  const variableCollections = {}, variables = {};
  const colId = (name) => `VariableCollectionId:${name}`;
  const varId = (path) => `VariableID:${path}`;
  const c = sys.collections.get('Elevation');
  const modes = c.modes.map((m) => ({ modeId: `Elevation:${m}`, name: m }));
  variableCollections[colId('Elevation')] = { id: colId('Elevation'), name: 'Elevation', key: colId('Elevation'), modes, defaultModeId: modes[0].modeId, remote: false, hiddenFromPublishing: false, variableIds: [] };
  const add = (path, type, value, scopes, description, web) => {
    variables[varId(path)] = {
      id: varId(path), name: figmaName(path), key: varId(path), variableCollectionId: colId('Elevation'), resolvedType: type,
      valuesByMode: { [`Elevation:${c.modes[0]}`]: value }, remote: false, description, hiddenFromPublishing: false, scopes,
      codeSyntax: { WEB: web },
    };
    variableCollections[colId('Elevation')].variableIds.push(varId(path));
  };
  for (const t of sys.byPrefix('elevation.')) {
    const v = t.values.Value;
    if (t.type === 'color') add(t.path, 'COLOR', { type: 'VARIABLE_ALIAS', id: varId(aliasTarget(v)) }, t.path.endsWith('.border') ? ['STROKE_COLOR'] : ['FRAME_FILL', 'SHAPE_FILL'], t.description || '', `var(${cssName(cfg.prefix, t.path)})`);
    if (t.type === 'shadow') {
      for (const [k, name] of [['offsetY', 'offset-y'], ['blur', 'blur'], ['spread', 'spread']]) add(`${t.path}.${name}`, 'FLOAT', v[k], ['EFFECT_FLOAT'], `${t.description} — ${name}`, `var(${cssName(cfg.prefix, t.path)})`);
    }
  }
  return { status: 200, error: false, meta: { variableCollections, variables } };
}

// ---------- Motion variables (FigCraft variable.import and Figma importers) ----------
// Primitives: the durations the jobs use (FLOAT, ms) and the four curves (STRING, the CSS cubic-bezier text). Motion (full,
// reduced): per job its duration (FLOAT ms), curve (STRING), distance (FLOAT px, an alias of the spacing scale) and, for what
// opens and closes, the leaving duration and curve. Nothing in Figma's pickers takes a duration or a curve, and a distance is
// not a gap, so every motion variable has empty scopes: the examples bind the distances (the "before" offset of a prototype
// state, so a frame in the reduced mode doesn't move) and the token tables bind the curve text. Merge with spaceRestVariables,
// which holds the spacing scale the distances link to.
export function motionRestVariables(sys, cfg) {
  const variableCollections = {}, variables = {};
  const colId = (name) => `VariableCollectionId:${name}`;
  const varId = (path) => `VariableID:${path}`;
  for (const name of ['Primitives', 'Motion']) {
    const c = sys.collections.get(name);
    const modes = c.modes.map((m) => ({ modeId: `${name}:${m}`, name: m }));
    variableCollections[colId(name)] = { id: colId(name), name, key: colId(name), modes, defaultModeId: modes[0].modeId, remote: false, hiddenFromPublishing: false, variableIds: [] };
  }
  const typeOf = (t) => (t.type === 'cubicBezier' ? 'STRING' : 'FLOAT');
  const raw = (t, v) => (t.type === 'cubicBezier' ? `cubic-bezier(${v.join(', ')})` : v);
  const add = (t, collection, valuesByMode) => {
    variables[varId(t.path)] = {
      id: varId(t.path), name: figmaName(t.path), key: varId(t.path), variableCollectionId: colId(collection), resolvedType: typeOf(t), valuesByMode, remote: false,
      description: t.description || '', hiddenFromPublishing: collection === 'Primitives', scopes: [],
      codeSyntax: { WEB: `var(${cssName(cfg.prefix, t.path)})` },
    };
    variableCollections[colId(collection)].variableIds.push(varId(t.path));
  };
  for (const t of sys.byPrefix('motion.').filter((x) => x.collection === 'Primitives')) add(t, 'Primitives', { 'Primitives:Value': raw(t, t.values.Value) });
  for (const t of sys.byPrefix('motion.').filter((x) => x.collection === 'Motion')) {
    add(t, 'Motion', Object.fromEntries(Object.entries(t.values).map(([m, v]) => [`Motion:${m}`, { type: 'VARIABLE_ALIAS', id: varId(aliasTarget(v)) }])));
  }
  return { status: 200, error: false, meta: { variableCollections, variables } };
}
