// One config in -> linked token system + check results.
import { System } from './system.js';
import { buildColor } from './foundations/color.js';
import { buildTypography, BREAKPOINTS } from './foundations/typography.js';
import { buildSpacing, DENSITIES } from './foundations/spacing.js';
import { buildLayout } from './foundations/layout.js';
import { buildRadius, buildBorder, STYLE_NAMES, validateRadiusConfig } from './foundations/shape.js';
import { buildElevation } from './foundations/elevation.js';
import { buildMotion } from './foundations/motion.js';
import { runChecks } from './checks/index.js';
import defaults from '../config/default.json' with { type: 'json' };

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
export function mergeConfig(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over ?? {})) out[k] = isObj(v) && isObj(base[k]) ? mergeConfig(base[k], v) : v;
  return out;
}

export const COLLECTIONS = [
  ['Primitives', ['Value'], 'Raw computed values. Never used directly.'],
  ['Color', ['Light', 'Dark'], 'Semantic colour roles'],
  ['Responsive', BREAKPOINTS, 'Typography and layout per breakpoint (one shared mode set)'],
  ['Density', DENSITIES, 'Spacing and control sizes per density'],
  ['Layout', ['Value'], 'Widths named by job: page container, reading measure, panes, tiles'],
  ['Shape', STYLE_NAMES, 'Corner radius roles per radius style'],
  ['Border', ['Value'], 'Border widths and focus ring'],
  ['Elevation', ['Value'], 'Levels by job (surface, shadow, edge, scrim; linked to Color) and the stacking order (layer.*)'],
  ['Motion', ['full', 'reduced'], 'Durations, easing and movement per motion preference'],
];

export function build(userConfig = {}) {
  const cfg = mergeConfig(defaults, userConfig);
  if (!/^#[0-9a-fA-F]{6}$/.test(cfg.color.brand)) throw new Error('color.brand must be a 6-digit hex colour');
  const sys = new System(cfg.name);
  // The product's radius style is the Shape collection's first mode: what :root, Figma frames on Auto and unscoped
  // lookups use. The other styles stay available as modes (data-radius in code, a frame's Shape mode in Figma).
  const { style } = validateRadiusConfig(cfg);
  for (const [n, modes, d] of COLLECTIONS) sys.collection(n, n === 'Shape' ? [style, ...modes.filter((m) => m !== style)] : modes, d);

  buildColor(sys, cfg);
  buildTypography(sys, cfg);
  buildSpacing(sys, cfg);
  buildLayout(sys, cfg);
  buildRadius(sys, cfg);
  buildBorder(sys, cfg);
  buildElevation(sys, cfg);
  buildMotion(sys, cfg);

  const report = runChecks(sys, { charWidth: cfg.typography.charWidth, cfg });
  return { cfg, sys, report };
}
