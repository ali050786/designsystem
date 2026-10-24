// Elevation: what sits on top of what. Levels are named by job (page, raised, sticky, floating, modal, dragging); each is a
// surface (linked to Colour), a shadow (computed from the level's height, its colour linked to Colour), an edge where the
// level floats over content, and a place in the stacking order (layer.*). Light shows height mainly by shadow; Dark shows
// it by lighter surfaces, because a black shadow on a near-black page has almost nothing to darken (measured in the teardown:
// 1.04–1.08:1). Floating levels keep a real border in both modes, so forced colours (which remove shadows) keep their edge.
// Only product layers are a choice; everything else is computed, and the checks prove the order holds in every mode.
import { ref } from '../system.js';

const E = 'Elevation';

export const ELEVATION_JOB_ORDER = ['page', 'raised', 'sticky', 'floating', 'modal', 'dragging'];
// height: how far the level sits above the page, in px — the shadow is computed from it.
// shadow: the colour role step (color.shadow.N, a strength scale in Colour). edge: where the level draws its border.
export const ELEVATION_JOBS = {
  page: { surface: 'canvas', height: 0, edge: 'none', use: 'The page itself and what lies flat in it: the page background, bands, wells' },
  raised: { surface: 'surface', height: 1, shadow: 1, edge: 'none', use: 'Cards, panels and table frames in the flow of the page' },
  sticky: { surface: 'surface-raised', height: 3, shadow: 2, edge: 'side', layer: 'sticky', use: 'Bars that stay while content scrolls under them: the page header, toolbars, sticky table headers, a settings bar' },
  floating: { surface: 'surface-overlay', height: 8, shadow: 3, edge: 'all', layer: 'floating', use: 'What opens over content without blocking it: menus, popovers, tooltips, toasts, date pickers, the navigation drawer' },
  modal: { surface: 'surface-overlay', height: 16, shadow: 4, edge: 'all', layer: 'modal', scrim: true, use: 'What blocks the page until it is answered or closed: dialogs, sheets, modal drawers — always with the scrim behind' },
  dragging: { surface: null, height: 24, shadow: 4, edge: 'all', layer: 'dragging', temporary: true, use: 'An item while it is being dragged: it keeps its own surface, lifts above everything, and returns to its level when dropped' },
};
// The stacking order (z-index). Values are computed: 100 apart, so product layers fit between two of them.
export const LAYER_ORDER = ['sticky', 'floating', 'modal', 'toast', 'dragging'];
export const LAYERS = {
  sticky: 'Sticky bars and the page header: above the content that scrolls under them',
  floating: 'Menus, popovers, tooltips and the navigation drawer: above sticky bars, so a menu opened from the header is never cut by it',
  modal: 'Dialogs and their scrim: above everything the page shows, so nothing outside the dialog can be reached',
  toast: 'Toasts and status messages: above dialogs, so a message is never hidden behind a scrim (it must not need an action while a dialog is open)',
  dragging: 'An item being dragged: above everything while the pointer or keyboard holds it',
};
export const LAYER_STEP = 100;
// Limits the checks hold the levels to.
export const EDGE_MIN = 1.5; // a floating level's edge against anything it can sit on: clearly there, still quiet
export const SURFACE_STEP_MIN = 1.1; // in Dark each rising surface is at least this much lighter than the level below it
const LAYER_LOOK = /(^|-)(top|bottom|high|higher|highest|low|lower|front|back|above|below|max|min|z|\d)(-|$)/;

/** The shadow a level casts, computed from its height: one shadow, offset down by half the height, blurred twice as far. */
export const shadowFor = (h) => ({ offsetX: 0, offsetY: Math.max(1, Math.ceil(h / 2)), blur: Math.max(3, 2 * h), spread: -Math.floor(h / 4) });

/** The config's elevation choices, checked before anything is computed. Returns { layers }. */
export function validateElevationConfig(cfg) {
  const c = cfg.elevation ?? {};
  const fail = (msg) => { throw new Error(`elevation: ${msg}`); };
  for (const k of Object.keys(c)) if (k !== 'layers') fail(`"${k}" is not an elevation choice: the config takes "layers" (product places in the stacking order). Levels, surfaces and shadows are computed`);
  const layers = (c.layers ?? []).map(productLayer);
  const names = layers.map((l) => l.name);
  const twice = names.find((n, i) => names.indexOf(n) !== i);
  if (twice) throw new Error(`elevation.layers → ${twice}: this name is listed twice`);
  const spots = layers.map((l) => l.above);
  const shared = spots.find((n, i) => spots.indexOf(n) !== i);
  if (shared) throw new Error(`elevation.layers → two product layers sit just above layer.${shared}: give one of them "above" the other's name, so the order between them is written down`);
  return { layers };
}

function productLayer(t) {
  const where = `elevation.layers → ${t?.name ?? '(no name)'}`;
  const fail = (msg) => { throw new Error(`${where}: ${msg}`); };
  for (const k of ['value', 'z', 'zIndex', 'z-index']) if (t && k in t) fail(`"${k}" is not allowed: say which layer it sits just above ("above": ${LAYER_ORDER.map((x) => `"${x}"`).join(', ')}); the number is computed`);
  if (!/^layer\.[a-z]+(-[a-z]+)*$/.test(t?.name ?? '')) fail('name must be layer.<job>, e.g. "layer.banner" — what sits there');
  const job = t.name.slice(6);
  if (LAYERS[job]) fail('a layer with this name already exists — use it');
  if (LAYER_LOOK.test(job)) fail('name the layer by what sits there, not by where it is ("top", "high", "z-50") — the order is set by "above"');
  if (!t.above) fail(`add "above": the layer it sits just above (${LAYER_ORDER.join(', ')}, or another product layer)`);
  if (!t.description) fail('add a description: what sits in this layer');
  return { name: t.name, job, above: String(t.above).replace(/^layer\./, ''), use: t.description };
}

/** The stacking order with product layers placed: [{ job, value, product, use }], lowest first. */
export function layerStack(layers) {
  const out = LAYER_ORDER.map((job, i) => ({ job, value: (i + 1) * LAYER_STEP, product: false, use: LAYERS[job] }));
  let pending = [...layers];
  while (pending.length) {
    const next = pending.find((l) => out.some((x) => x.job === l.above));
    if (!next) throw new Error(`elevation.layers → ${pending[0].name}: "above" must name a layer (${LAYER_ORDER.join(', ')}, or another product layer)`);
    pending = pending.filter((l) => l !== next);
    const i = out.findIndex((x) => x.job === next.above);
    const below = out[i].value;
    const aboveV = out[i + 1]?.value ?? below + LAYER_STEP;
    const value = Math.floor((below + aboveV) / 2);
    if (value === below) throw new Error(`elevation.layers → ${next.name}: no room left above layer.${next.above}`);
    out.splice(i + 1, 0, { job: next.job, value, product: true, use: next.use, above: next.above });
  }
  return out;
}

export function buildElevation(sys, cfg) {
  const { layers } = validateElevationConfig(cfg);
  for (const l of layerStack(layers)) sys.add(`layer.${l.job}`, { collection: E, type: 'number', value: l.value, description: l.use, layer: true, product: l.product });
  for (const job of ELEVATION_JOB_ORDER) {
    const j = ELEVATION_JOBS[job];
    const meta = { job, height: j.height, edge: j.edge, temporary: !!j.temporary };
    if (j.surface) sys.add(`elevation.${job}.surface`, { collection: E, type: 'color', value: ref(`color.bg.${j.surface}`), description: `${j.use} — surface (linked to Colour)`, ...meta });
    if (j.shadow) sys.add(`elevation.${job}.shadow`, { collection: E, type: 'shadow', value: { color: ref(`color.shadow.${j.shadow}`), ...shadowFor(j.height) }, description: `Shadow of ${job}: ${j.height}px above the page (colour linked to Colour)`, ...meta });
    if (j.edge === 'side') sys.add(`elevation.${job}.border`, { collection: E, type: 'color', value: ref('color.border.subtle'), description: `Line on the side of ${job} that faces the content scrolling under it, drawn at border.width.line — keeps the bar's edge where shadows are removed (forced colours)`, ...meta });
    if (j.edge === 'all') sys.add(`elevation.${job}.border`, { collection: E, type: 'color', value: ref('color.border.floating'), description: `Edge of ${job}, all sides, drawn at border.width.line — never shadow alone: forced colours remove shadows and Dark barely shows them`, ...meta });
    if (j.scrim) sys.add(`elevation.${job}.scrim`, { collection: E, type: 'color', value: ref('color.bg.scrim'), description: 'Backdrop behind a modal: dims the page and shows it can\'t be used until the dialog closes', ...meta });
  }
  sys.notes.push(`Elevation: ${ELEVATION_JOB_ORDER.length} levels by job, ${LAYER_ORDER.length + layers.length} layers${layers.length ? ` (${layers.length} added for this product)` : ''}.`);
}

/** Normal cumulative distribution (Abramowitz–Stegun 7.1.26), for the blur's edge. */
const phi = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2); return x >= 0 ? (1 + y) / 2 : (1 - y) / 2; };

/**
 * How dark a shadow gets just below a surface: the share of the shadow's colour that reaches the first pixel under the
 * bottom edge, in the middle of a surface wider than the blur. CSS blurs with a Gaussian whose standard deviation is half
 * the blur radius. Returns the alpha that pixel receives (0 = no shadow). The elevation audit measures the same thing in
 * Chromium; the two agree to within a few hundredths of a contrast ratio.
 */
export function shadowEdgeAlpha({ offsetY, blur, spread }, colorAlpha) {
  const reach = offsetY + spread; // how far the shadow's own rectangle passes the bottom edge
  const d = 0.5;
  const cover = blur <= 0 ? (reach > d ? 1 : 0) : phi((reach - d) / (blur / 2));
  return colorAlpha * cover;
}

/**
 * How dark a shadow gets beside a surface, `d` px out from its side, at mid-height: the shadow's own rectangle reaches
 * `spread` past the side (negative: it stays inside), blurred with a standard deviation of half the blur radius. The edge
 * of a floating surface is seen against this darkened page, not the bare page (measured by the elevation audit: the
 * floating edge on the Light page reads 1.46:1 there against 1.58:1 on the bare page).
 */
export function shadowSideAlpha({ blur, spread }, colorAlpha, d = 3) {
  const cover = blur <= 0 ? (spread > d ? 1 : 0) : phi((spread - d) / (blur / 2));
  return colorAlpha * cover;
}
