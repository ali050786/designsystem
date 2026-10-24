// Layout: breakpoints (one mode set with Typography), the page grid (linked to Spacing), widths named by job, and the
// app shell — panes that go inline only at the breakpoint where they fit. Only choices live in the config (pane widths,
// the tile width, product panes); every other value is computed here, and the checks prove the sizes add up at the
// narrowest width of every breakpoint, in every density.
import { ref } from '../system.js';
import { BREAKPOINTS } from './typography.js';
import { px as spacePx, SPACE, shift } from './spacing.js';

const P = 'Primitives';
const R = 'Responsive';
const L = 'Layout';
const D = 'Density';
export const BREAKPOINT_MIN = { sm: 0, md: 600, lg: 1024, xl: 1440 };
export const REFLOW_WIDTH = 320; // WCAG 1.4.10: a 1280px window at 400% zoom
export const REFLOW_HEIGHT = 256; // the same window's height (1024px at 400%)
/** The narrowest width each breakpoint has to work at (sm starts at 0, but reflow is tested at 320px). */
export const narrowest = (bp) => (bp === 'sm' ? REFLOW_WIDTH : BREAKPOINT_MIN[bp]);

// The page grid. Gutters and margins are keys on the spacing scale, so they are links, not copies.
export const COLUMNS = { sm: 4, md: 8, lg: 12, xl: 12 };
export const GUTTER = { sm: '4', md: '6', lg: '6', xl: '8' };
export const MARGIN = { sm: '4', md: '8', lg: '10', xl: '16' };
export const MIN_COLUMN = 40; // no column narrower than this at the start of any breakpoint
export const MAX_GUTTER_SHARE = 1 / 3; // gutters never take more than a third of the row

// Running text: in rem, so the characters per line stay the same at every breakpoint and every text size.
// 34rem: about 70 characters of 16px Inter (68 measured in Chromium on a sample paragraph; T9 estimates it per build).
export const MEASURE_REM = 34;
export const MEASURE_PX = MEASURE_REM * 16;

// The header holds controls, so its height follows density: one step along the spacing scale each way.
export const HEADER_BASE = '14';
export const HEADER_ROOM = 8; // at least this much between a control and the header's edges, added up (4px above, 4px below)
export const STICKY_SHARE = 0.25; // a sticky header takes at most a quarter of the shortest window it sticks in
// The header sticks only in windows at least this tall (30em: 480px at 16px text). At 400% zoom (256px tall), and at 200%
// text in windows under 960px, it scrolls with the page: a header that wraps can't grow past its scroll padding there.
export const STICKY_FROM_EM = 30;
export const DRAWER_STRIP = 48; // a navigation drawer on a 320px screen leaves this much of the page visible to tap

// Panes of the app shell, start to end. Built-ins take their width from the config; products can add their own.
export const PANES = {
  nav: { name: 'layout.pane.nav', from: 'lg', side: 'start', below: 'drawer', use: 'Navigation between the product\'s sections; a drawer below its breakpoint' },
  aside: { name: 'layout.pane.aside', from: 'xl', side: 'end', below: 'flow', use: 'Supporting content beside the main region: details, filters, help; below the main content on narrower screens' },
};
export const LIMITS = { nav: [160, 272], aside: [240, 480], tile: [160, 320], pane: [160, 480] };
const LOOK = /\b(left|right|top|bottom|wide|narrow|big|small|large|thin|fat|half|full)\b/;

/** The config's layout choices, checked before anything is computed. Returns { nav, aside, tile, panes }. */
export function validateLayoutConfig(cfg) {
  const l = cfg.layout ?? {};
  const fail = (msg) => { throw new Error(`layout: ${msg}`); };
  const width = (key, [lo, hi]) => {
    const v = l[key];
    if (typeof v !== 'number' || !Number.isInteger(v)) fail(`"${key}" must be a width in px, a whole number`);
    if (v % 8) fail(`"${key}" must be a multiple of 8 (${v}px is not)`);
    if (v < lo || v > hi) fail(`"${key}" must be between ${lo} and ${hi}px${key === 'nav' ? ` — as a drawer on a ${REFLOW_WIDTH}px screen it must leave ${DRAWER_STRIP}px of the page visible` : ''}`);
    return v;
  };
  const nav = width('nav', LIMITS.nav), aside = width('aside', LIMITS.aside), tile = width('tile', LIMITS.tile);
  const panes = (l.panes ?? []).map((p) => productPane(p));
  const names = panes.map((p) => p.name);
  const twice = names.find((n, i) => names.indexOf(n) !== i);
  if (twice) throw new Error(`layout.panes → ${twice}: this name is listed twice`);
  return { nav, aside, tile, panes };
}

function productPane(p) {
  const where = `layout.panes → ${p?.name ?? '(no name)'}`;
  const fail = (msg) => { throw new Error(`${where}: ${msg}`); };
  for (const k of ['rem', 'value', 'percent', 'min', 'max']) if (p && k in p) fail(`"${k}" is not allowed: give "width" in px (a multiple of 8). Panes are px so the build can add them up`);
  if (!/^layout\.pane\.[a-z][a-z0-9-]*$/.test(p?.name ?? '')) fail('name must be layout.pane.<job>, e.g. "layout.pane.inspector"');
  const job = p.name.split('.')[2];
  if (['nav', 'aside'].includes(job)) fail(`a built-in pane has this name — set its width with "layout.${job}"`);
  if (LOOK.test(job.replace(/-/g, ' '))) fail(`name it by its job, not its look or position: "${job}" says where or how big, and sides swap in right-to-left languages`);
  const w = p.width;
  if (typeof w !== 'number' || !Number.isInteger(w) || w % 8) fail('"width" must be px, a whole number and a multiple of 8');
  if (w < LIMITS.pane[0] || w > LIMITS.pane[1]) fail(`"width" must be between ${LIMITS.pane[0]} and ${LIMITS.pane[1]}px`);
  if (!['md', 'lg', 'xl'].includes(p.from)) fail(`"from" must be md, lg or xl — the breakpoint where it goes inline. ${p.from === 'sm' ? 'On a phone nothing fits beside the main region; ' : ''}below it, the pane sits below the main content`);
  if (!['start', 'end'].includes(p.side ?? 'end')) fail('"side" must be start or end (start is left in left-to-right languages; a start pane is a drawer below its breakpoint, an end pane sits below the main region)');
  if (!p.description) fail('add a description: what the pane is for');
  // A start-side pane becomes a drawer below its breakpoint (stacked above the main region it would push the page down,
  // and stacked below it the visual order would no longer match the DOM order); an end-side pane sits below the main region.
  const side = p.side ?? 'end';
  return { name: p.name, width: w, from: p.from, side, below: side === 'start' ? 'drawer' : 'flow', use: p.description, product: true };
}

/**
 * Column spans by fraction for a grid of `columns` columns: what "half", "a third" … mean in whole columns. On the
 * smallest grid everything but a quarter takes the full row (two halves of a phone are too narrow for most content).
 */
export function spansFor(columns) {
  const small = columns < 8;
  const third = small ? columns : Math.round(columns / 3);
  return { full: columns, half: small ? columns : columns / 2, third, 'two-thirds': small ? columns : columns - third, quarter: small ? columns / 2 : columns / 4 };
}
export const SPANS = ['full', 'half', 'third', 'two-thirds', 'quarter'];

/** Every pane, built-in first, with its width. */
export function panesOf(choices) {
  return [
    { ...PANES.nav, width: choices.nav, product: false },
    { ...PANES.aside, width: choices.aside, product: false },
    ...choices.panes,
  ];
}

/** The breakpoint whose grid a region of this width uses: grids follow the region they sit in, not the window. */
export const regionMode = (widthPx) => BREAKPOINTS.filter((bp) => BREAKPOINT_MIN[bp] <= widthPx).at(-1);

/**
 * The app shell at the narrowest width of a breakpoint: which panes are inline, how much the main region keeps, and
 * the grid inside it. The main region pads itself with the window's layout.margin; its grid takes the columns and
 * gutter of the breakpoint its own width falls in (a container query in code, the frame's Responsive mode in Figma).
 * gridOf(bp) → { columns, gutterPx }.
 */
export function shellAt(bp, panes, marginPx, gridOf, measurePx = MEASURE_PX) {
  const width = narrowest(bp);
  const inline = panes.filter((p) => BREAKPOINTS.indexOf(p.from) <= BREAKPOINTS.indexOf(bp));
  const main = width - inline.reduce((a, p) => a + p.width, 0);
  const content = main - 2 * marginPx;
  const mode = regionMode(main) ?? 'sm';
  const { columns, gutterPx } = gridOf(mode);
  const gutters = (columns - 1) * gutterPx;
  const column = +((content - gutters) / columns).toFixed(1);
  const share = +(gutters / content).toFixed(3);
  return { bp, width, inline: inline.map((p) => p.name), main, content, mode, columns, gutterPx, column, share, need: measurePx,
    fitsMeasure: content >= measurePx, fitsGrid: column >= MIN_COLUMN && share <= MAX_GUTTER_SHARE + 1e-9 };
}

/** The page grid at the narrowest width of a breakpoint: content width, column width, gutter share. */
export function gridAt(bp, { columns, gutterPx, marginPx, containerPx }) {
  const width = narrowest(bp);
  const content = Math.min(width - 2 * marginPx, containerPx);
  const gutters = (columns - 1) * gutterPx;
  const column = (content - gutters) / columns;
  return { bp, width, content, column: +column.toFixed(1), share: +(gutters / content).toFixed(3) };
}

export function buildLayout(sys, cfg) {
  const choices = validateLayoutConfig(cfg);
  for (const bp of BREAKPOINTS) sys.add(`breakpoint.${bp}`, { collection: P, type: 'dimension', value: BREAKPOINT_MIN[bp], description: `Narrowest window width of ${bp} (${BREAKPOINT_MIN[bp] / 16}em in media queries)` });

  const per = (o) => Object.fromEntries(BREAKPOINTS.map((bp) => [bp, o[bp]]));
  const sp = (o) => per(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, ref(`space.${v}`)])));
  sys.add('layout.columns', { collection: R, type: 'number', values: per(COLUMNS), description: 'Columns of the page grid', layout: 'grid' });
  sys.add('layout.gutter', { collection: R, type: 'dimension', values: sp(GUTTER), description: 'Gap between the columns of the page grid (linked to Spacing)', layout: 'grid' });
  sys.add('layout.margin', { collection: R, type: 'dimension', values: sp(MARGIN), description: 'Space between the screen edge and the page content; the main region\'s side padding (linked to Spacing)', layout: 'grid' });

  // Widths named by job. The container is computed: the page stops growing where the widest breakpoint begins.
  const container = BREAKPOINT_MIN.xl - 2 * spacePx(MARGIN.xl);
  sys.add('layout.container.max', { collection: L, type: 'dimension', value: container, layout: 'width',
    description: `Widest the page content gets: ${BREAKPOINT_MIN.xl} − 2 × the xl margin, so it stops growing where xl begins and wider screens get wider margins` });
  sys.add('layout.measure.reading', { collection: L, type: 'dimension', value: MEASURE_PX, rem: true, layout: 'width',
    description: `Widest running text gets: about ${Math.round(MEASURE_PX / (16 * (cfg.typography?.charWidth ?? 0.48)))} characters of type.body.md at any text size (${MEASURE_REM}rem)` });
  for (const p of panesOf(choices)) {
    sys.add(p.name, { collection: L, type: 'dimension', value: p.width, layout: 'pane', from: p.from, side: p.side, below: p.below, product: !!p.product,
      description: `${p.use}. Inline from ${p.from} (≥ ${BREAKPOINT_MIN[p.from]}px)` });
  }
  sys.add('layout.tile.min', { collection: L, type: 'dimension', value: choices.tile, layout: 'width',
    description: 'Narrowest a tile gets in a tile grid (cards on a dashboard); the grid fits as many as the row holds, and one full-width tile on the smallest screens' });

  // The header holds controls, so it follows density like they do (the same steps along the scale).
  const step = cfg.spacing?.densityStep ?? 1;
  const keys = { comfortable: shift(HEADER_BASE, step), default: HEADER_BASE, compact: shift(HEADER_BASE, -step) };
  if (Object.values(keys).some((k) => k === undefined || !(k in SPACE))) throw new Error('layout: the header height has no step above or below it on the spacing scale');
  sys.add('layout.header.height', { collection: D, type: 'dimension', values: Object.fromEntries(Object.entries(keys).map(([d, k]) => [d, ref(`space.${k}`)])), base: HEADER_BASE, layout: 'header',
    description: 'Minimum height of the app header: a control plus room above and below, in every density' });
  // In CSS the scroll padding is max(the header height, the same in rem): when readers enlarge text the header's labels
  // grow and so does the padding, always staying above the header's real height.
  sys.add('layout.scroll-padding.top', { collection: D, type: 'dimension', values: Object.fromEntries(Object.keys(keys).map((d) => [d, ref('layout.header.height')])), layout: 'header', growsWithText: true,
    description: 'Space the browser keeps clear at the top when it scrolls to a focused element or an anchor: the sticky header\'s height, growing with the reader\'s text size (WCAG 2.4.11). tokens.css sets it on <html>' });
  sys.notes.push(`Layout: container ${container}px (computed), measure ${MEASURE_REM}rem, panes ${panesOf(choices).map((p) => `${p.name.split('.')[2]} ${p.width}px from ${p.from}`).join(', ')}, tiles from ${choices.tile}px.`);
}
