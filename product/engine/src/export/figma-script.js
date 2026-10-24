// Generates a Figma Plugin API script that creates/updates variables from the engine.
// Idempotent: finds collections and variables by name and updates them in place.
// Runs via the Figma MCP (use_figma) or as a local development plugin.
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
const scopesFor = (path, collection) => (collection === 'Primitives' ? [] : (SCOPES.find(([re]) => re.test(path)) ?? [null, []])[1]);

function rgba(hex) {
  const [r, g, b] = hexToRgb(hex.slice(0, 7));
  const a = hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1;
  return { r: +r.toFixed(5), g: +g.toFixed(5), b: +b.toFixed(5), a: +a.toFixed(4) };
}

/** Data for the colour foundation: colour primitives + the Color collection. */
export function colorVariableData(sys, cfg) {
  const vars = [];
  for (const t of sys.tokens.values()) {
    if (t.type !== 'color') continue;
    if (!['Primitives', 'Color'].includes(t.collection)) continue;
    const values = {};
    for (const [mode, v] of Object.entries(t.values)) values[mode] = isAlias(v) ? { alias: figmaName(aliasTarget(v)) } : rgba(v);
    vars.push({
      name: figmaName(t.path),
      collection: t.collection,
      values,
      description: t.description || '',
      scopes: scopesFor(t.path, t.collection),
      web: `var(${cssName(cfg.prefix, t.path)})`,
    });
  }
  return { collections: { Primitives: ['Value'], Color: ['Light', 'Dark'] }, vars };
}

/** The script body: plain JS with top-level await, returns a summary. */
export function figmaVariablesScript(data) {
  return `const DATA = ${JSON.stringify(data)};
const out = { collections: {}, created: 0, updated: 0, errors: [] };
const existing = await figma.variables.getLocalVariableCollectionsAsync();
const cols = {};
for (const [name, modes] of Object.entries(DATA.collections)) {
  let c = existing.find((x) => x.name === name);
  if (!c) c = figma.variables.createVariableCollection(name);
  if (c.modes[0].name !== modes[0]) c.renameMode(c.modes[0].modeId, modes[0]);
  for (const m of modes.slice(1)) {
    if (!c.modes.find((x) => x.name === m)) {
      try { c.addMode(m); } catch (e) { out.errors.push('addMode ' + name + '/' + m + ': ' + e.message); }
    }
  }
  cols[name] = c;
  out.collections[name] = { id: c.id, modes: c.modes.map((m) => m.name) };
}
const all = await figma.variables.getLocalVariablesAsync('COLOR');
const byKey = new Map(all.map((v) => [v.variableCollectionId + '|' + v.name, v]));
const byName = new Map();
// Pass 1: create variables
for (const d of DATA.vars) {
  const c = cols[d.collection];
  let v = byKey.get(c.id + '|' + d.name);
  if (!v) { v = figma.variables.createVariable(d.name, c, 'COLOR'); out.created++; } else out.updated++;
  v.description = d.description;
  v.scopes = d.scopes;
  v.hiddenFromPublishing = d.collection === 'Primitives';
  v.setVariableCodeSyntax('WEB', d.web);
  byName.set(d.name, v);
}
// Pass 2: values and aliases
for (const d of DATA.vars) {
  const c = cols[d.collection];
  const v = byName.get(d.name);
  for (const [modeName, val] of Object.entries(d.values)) {
    const mode = c.modes.find((m) => m.name === modeName);
    if (!mode) { out.errors.push('missing mode ' + modeName + ' for ' + d.name); continue; }
    if (val.alias) {
      const target = byName.get(val.alias);
      if (!target) { out.errors.push('missing alias ' + val.alias); continue; }
      v.setValueForMode(mode.modeId, figma.variables.createVariableAlias(target));
    } else v.setValueForMode(mode.modeId, val);
  }
}
out.total = DATA.vars.length;
return out;`;
}
