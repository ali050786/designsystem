// Automated checks. Each returns { id, title, wcag, level, foundation, status, summary, items }.
// status: 'pass' | 'fail' | 'warn' (AAA or advisory miss) | 'info'.
// The build fails if any check with level A or AA fails.
import { contrast, composite, hexToRgb } from '../color-math.js';
import { worstDistance, distance, CVD_TYPES } from '../cvd.js';
import { isAlias, aliasTarget } from '../system.js';
import { BREAKPOINTS, MIN_SIZE, ROLES, READING_LH, MIN_LH, TRACK_FROM } from '../foundations/typography.js';
import { toCss, toTailwindTheme } from '../export/css.js';
import { DENSITIES, TARGET_MIN, TARGET_ENHANCED, SCALE, SIZE_ORDER, MIN_SPACE, LABEL_ROOM, LABEL_FOR, GRID_FROM, shift } from '../foundations/spacing.js';
import { REFLOW_WIDTH, REFLOW_HEIGHT, BREAKPOINT_MIN, MIN_COLUMN, MAX_GUTTER_SHARE, HEADER_ROOM, STICKY_SHARE, STICKY_FROM_EM, DRAWER_STRIP, validateLayoutConfig, panesOf, shellAt, gridAt } from '../foundations/layout.js';
import { REDUCED_MAX_MS, MIN_FLASH_INTERVAL_MS, RESPONSE_MS, MS_PER_ROOT_PX, STEP_MS, MAX_DISTANCE, MAX_DURATION, PEAK_SPEED_MAX, FRAME_MS, LOADING_TURN_MS, INDICATOR_MIN, EASING, EASING_ORDER, durationFor, exitFor, curveSpeeds, framesOf, motionJobs, validateMotionConfig, pulseFloor } from '../foundations/motion.js';
import { STYLE_NAMES, ROLE_ORDER, MARK_SIZE, CORNER_SHARE, insideCorner, BORDER_MIN, BORDER_MAX, BORDER_SCALE } from '../foundations/shape.js';
import { ELEVATION_JOB_ORDER, ELEVATION_JOBS, EDGE_MIN, SURFACE_STEP_MIN, LAYER_ORDER, shadowSideAlpha } from '../foundations/elevation.js';

export const CVD_TREND_MIN = 0.1;
export const CVD_CHART_MIN = 0.07;
const COLOR_MODES = ['Light', 'Dark'];
const opaque = (hex) => hex.slice(0, 7);
/** A translucent colour seen over an opaque base (state layers). */
export const flatten = (hex, base) => (hex.length === 9 ? composite(hex.slice(0, 7), parseInt(hex.slice(7), 16) / 255, base.slice(0, 7)) : hex.slice(0, 7));

function result(base, items, { failWhen = (i) => !i.ok, failStatus = 'fail' } = {}) {
  const failed = items.filter(failWhen);
  return { ...base, status: failed.length ? failStatus : 'pass', summary: `${items.length - failed.length}/${items.length} pass`, items };
}

export function runChecks(sys, { charWidth = 0.48, cfg = null } = {}) {
  const checks = [];
  const r = (path, ctx) => sys.resolve(path, ctx);

  // ---- Colour pairs (C1, C2, C3, F2-colour) ----
  for (const [kind, id, title, wcag] of [
    ['text', 'C1', 'Text contrast ≥ 4.5:1 on every allowed background', '1.4.3'],
    ['non-text', 'C3', 'Borders, focus rings and chart marks ≥ 3:1 against their backgrounds', '1.4.11'],
    ['icon', 'C4', 'Icons ≥ 3:1 against every background they are allowed on', '1.4.11'],
  ]) {
    const items = [];
    for (const p of sys.pairs.filter((x) => x.kind === kind)) {
      for (const m of COLOR_MODES) {
        const fg = r(p.fg, { Color: m });
        const base = p.over ? r(p.over, { Color: m }) : null;
        const bg = base ? flatten(r(p.bg, { Color: m }), base) : opaque(r(p.bg, { Color: m }));
        const ratio = contrast(opaque(fg), bg);
        items.push({ mode: m, fg: p.fg, bg: p.bg, over: p.over, fgHex: fg, bgHex: bg, ratio: +ratio.toFixed(2), min: p.min, ok: ratio >= p.min, wcag: p.wcag });
      }
    }
    checks.push(result({ id, title, wcag, level: 'AA', foundation: 'Colour' }, items));
  }

  // ---- C6: AAA report for body text ----
  {
    const items = [];
    for (const fg of ['color.fg.default', 'color.fg.muted']) {
      for (const bg of ['color.bg.canvas', 'color.bg.surface', 'color.bg.surface-sunken']) {
        for (const m of COLOR_MODES) {
          const ratio = contrast(opaque(r(fg, { Color: m })), opaque(r(bg, { Color: m })));
          items.push({ mode: m, fg, bg, ratio: +ratio.toFixed(2), min: 7, ok: ratio >= 7 });
        }
      }
    }
    checks.push(result({ id: 'C6', title: 'Body text against AAA 7:1 (report only)', wcag: '1.4.6', level: 'AAA', foundation: 'Colour' }, items, { failStatus: 'warn' }));
  }

  // ---- C5: colour-blind distinguishability ----
  {
    const items = [];
    for (const m of COLOR_MODES) {
      const g = r('color.data.positive', { Color: m }), l = r('color.data.negative', { Color: m });
      const per = Object.fromEntries(CVD_TYPES.map((t) => [t, +distance(g, l, t).toFixed(3)]));
      const worst = Math.min(...Object.values(per));
      items.push({ mode: m, a: 'color.data.positive', b: 'color.data.negative', aHex: g, bHex: l, per, worst, min: CVD_TREND_MIN, ok: worst >= CVD_TREND_MIN });
      const chart = sys.byPrefix('color.data.chart-').map((t) => [t.path, r(t.path, { Color: m })]);
      for (let i = 0; i < chart.length; i++) {
        for (let j = i + 1; j < chart.length; j++) {
          const worstC = worstDistance(chart[i][1], chart[j][1]);
          items.push({ mode: m, a: chart[i][0], b: chart[j][0], aHex: chart[i][1], bHex: chart[j][1], worst: +worstC.toFixed(3), min: CVD_CHART_MIN, ok: worstC >= CVD_CHART_MIN });
        }
      }
    }
    checks.push(result({ id: 'C5', title: `Positive/negative change (≥ ${CVD_TREND_MIN}) and chart colours (≥ ${CVD_CHART_MIN}) stay distinct for protanopia, deuteranopia, tritanopia (OKLab distance)`, wcag: '1.4.1', level: 'A', foundation: 'Colour' }, items));
  }

  // ---- Typography ----
  const typeTokens = sys.byPrefix('type.');
  const tv = (t, bp) => {
    const v = r(t.path, { Responsive: bp });
    return { ...v, ratio: v.lineHeight / v.fontSize, trackPx: v.letterSpacing * v.fontSize };
  };
  {
    // What ships: sizes in rem, line heights unitless, letter-spacing in em — so text follows the reader's text size.
    const css = toCss(sys, { prefix: 'x', density: { default: 'default' } });
    const decl = (name) => (css.match(new RegExp(`${name}: ([^;]+);`)) ?? [])[1];
    const items = [];
    for (const t of sys.byPrefix('font.size.')) { const v = decl(`--x-${t.path.replace(/\./g, '-')}`); items.push({ token: t.path, value: v, ok: /^[\d.]+rem$/.test(v ?? '') }); }
    for (const t of typeTokens) {
      const n = `--x-${t.path.replace(/\./g, '-')}`;
      const lh = decl(`${n}-line-height`), ls = decl(`${n}-letter-spacing`);
      items.push({ token: `${t.path} line height`, value: lh, ok: /^[\d.]+$/.test(lh ?? '') });
      items.push({ token: `${t.path} letter-spacing`, value: ls, ok: /^var\(--x-font-letter-spacing-[a-z]+\)$/.test(ls ?? '') });
    }
    for (const t of sys.byPrefix('font.letter-spacing.')) { const v = decl(`--x-${t.path.replace(/\./g, '-')}`); items.push({ token: t.path, value: v, ok: v === '0' || /^-?[\d.]+em$/.test(v ?? '') }); }
    checks.push(result({ id: 'T1', title: 'In code, sizes are rem, line heights unitless and letter-spacing em — text follows the reader\'s text size', wcag: '1.4.4', level: 'AA', foundation: 'Typography' }, items));
  }
  {
    const items = [];
    for (const t of typeTokens.filter((x) => x.meta.reading)) for (const bp of BREAKPOINTS) {
      const v = tv(t, bp);
      items.push({ token: t.path, bp, size: v.fontSize, lineHeight: v.lineHeight, ratio: +v.ratio.toFixed(2), min: READING_LH, ok: v.ratio >= READING_LH });
    }
    checks.push(result({ id: 'T2', title: `Reading text line height ≥ ${READING_LH} at every breakpoint`, wcag: '1.4.12', level: 'AA', foundation: 'Typography' }, items));
  }
  {
    const items = [];
    for (const t of typeTokens) for (const bp of BREAKPOINTS) {
      const v = tv(t, bp);
      items.push({ token: t.path, bp, size: v.fontSize, min: MIN_SIZE, ok: v.fontSize >= MIN_SIZE });
    }
    checks.push(result({ id: 'T3', title: `Smallest text size ≥ ${MIN_SIZE}px`, wcag: '—', level: 'AA', foundation: 'Typography' }, items));
  }
  {
    const items = [];
    for (const t of typeTokens) for (const bp of BREAKPOINTS) {
      const v = tv(t, bp);
      items.push({ token: t.path, bp, size: v.fontSize, weight: v.fontWeight, large: t.meta.large[bp], ok: true });
    }
    checks.push({ id: 'T4', title: 'Large / normal text class per breakpoint (sets the contrast each style needs)', wcag: '1.4.3', level: 'AA', foundation: 'Typography', status: 'info', summary: `${items.filter((i) => i.large).length} large, ${items.filter((i) => !i.large).length} normal`, items });
  }
  {
    const items = typeTokens.filter((t) => t.path.startsWith('type.numeric.') || t.meta.tabular).map((t) => ({ token: t.path, ok: !!t.meta.tabular }));
    checks.push(result({ id: 'T5', title: 'Number styles use tabular numerals, so digits line up in columns', wcag: '—', level: 'AA', foundation: 'Typography' }, items));
  }
  {
    const items = [];
    for (const t of typeTokens) for (const bp of BREAKPOINTS) {
      const v = tv(t, bp);
      items.push({ token: t.path, bp, size: v.fontSize, lineHeight: v.lineHeight, ratio: +v.ratio.toFixed(2), min: MIN_LH, ok: v.ratio >= MIN_LH - 1e-9 });
    }
    checks.push(result({ id: 'T6', title: `Every style's line height ≥ ${MIN_LH}, so wrapped lines never touch`, wcag: '—', level: 'AA', foundation: 'Typography' }, items));
  }
  {
    // Hierarchy: inside a role each step is bigger than the one below; headings stay above titles, display above headings.
    const items = [];
    const size = (p, bp) => r(p, { Responsive: bp }).fontSize;
    const has = (p) => sys.tokens.has(p);
    for (const bp of BREAKPOINTS) {
      for (const role of Object.keys(ROLES)) {
        const vs = ['sm', 'md', 'lg'].map((x) => `type.${role}.${x}`).filter(has);
        for (let i = 1; i < vs.length; i++) items.push({ item: `${vs[i - 1]} < ${vs[i]}`, bp, value: `${size(vs[i - 1], bp)} < ${size(vs[i], bp)}`, ok: size(vs[i - 1], bp) < size(vs[i], bp) });
      }
      for (const [lo, hi] of [['type.title.lg', 'type.heading.sm'], ['type.heading.lg', 'type.display.sm'], ['type.body.lg', 'type.title.lg']]) {
        items.push({ item: `${lo} < ${hi}`, bp, value: `${size(lo, bp)} < ${size(hi, bp)}`, ok: size(lo, bp) < size(hi, bp) });
      }
    }
    checks.push(result({ id: 'T7', title: 'Hierarchy holds at every breakpoint: each role steps up, headings stay above titles, display above headings', wcag: '1.3.1', level: 'AA', foundation: 'Typography' }, items));
  }
  {
    const items = [];
    for (const t of typeTokens) for (const bp of BREAKPOINTS) {
      const v = tv(t, bp);
      const ok = t.meta.upper ? v.letterSpacing > 0 : v.letterSpacing >= -0.02 - 1e-9 && (v.fontSize >= TRACK_FROM || v.letterSpacing >= 0);
      items.push({ token: t.path, bp, size: v.fontSize, value: `${v.letterSpacing}em (${+v.trackPx.toFixed(2)}px)`, ok });
    }
    checks.push(result({ id: 'T8', title: `Letter-spacing follows the size: no negative tracking below ${TRACK_FROM}px, never tighter than −0.02em; capitals are spaced out`, wcag: '—', level: 'AA', foundation: 'Typography' }, items));
  }

  {
    // Characters per line at the reading width: width / (size × average character width in em, from config).
    const items = [];
    const measure = r('layout.measure.reading');
    for (const path of ['type.body.md', 'type.body.lg']) {
      const v = r(path, { Responsive: 'md' });
      const chars = Math.round(measure / (v.fontSize * charWidth));
      items.push({ token: path, item: `${measure}px wide`, value: `~${chars} characters`, min: 45, max: 75, ok: chars >= 45 && chars <= 75 });
    }
    checks.push(result({ id: 'T9', title: 'Running text width gives 45–75 characters a line at body sizes (estimate; the page audit measures real lines)', wcag: '1.4.8', level: 'AAA', foundation: 'Typography' }, items, { failStatus: 'warn' }));
  }

  // ---- Spacing ----
  const densityTokens = [...sys.tokens.values()].filter((t) => t.collection === 'Density');
  // The scale key a Density token resolves to in a density (following links such as scroll padding → header height).
  const keyOf = (t, d) => {
    let target = aliasTarget(t.values[d]);
    while (!target.startsWith('space.')) target = aliasTarget(sys.get(target).values[d]);
    return target.replace(/^space\./, '');
  };
  {
    const items = [];
    for (const d of DENSITIES) {
      for (const t of densityTokens.filter((x) => x.meta.target)) {
        const v = r(t.path, { Density: d });
        items.push({ token: t.path, density: d, value: v, min: TARGET_MIN, ok: v >= TARGET_MIN });
      }
    }
    checks.push(result({ id: 'S1', title: `Pointer targets ≥ ${TARGET_MIN}×${TARGET_MIN}px in every density`, wcag: '2.5.8', level: 'AA', foundation: 'Spacing' }, items));
    const v = r('size.control.height', { Density: 'comfortable' });
    checks.push(result({ id: 'S2', title: `Comfortable density controls ≥ ${TARGET_ENHANCED}px`, wcag: '2.5.5', level: 'AAA', foundation: 'Spacing' }, [{ token: 'size.control.height', density: 'comfortable', value: v, min: TARGET_ENHANCED, ok: v >= TARGET_ENHANCED }], { failStatus: 'warn' }));
  }
  {
    // One rule for density: compact is `step` steps down the scale, comfortable `step` steps up. The target floor never moves.
    const step = SCALE.indexOf(keyOf(sys.get('size.control.height'), 'comfortable')) - SCALE.indexOf(keyOf(sys.get('size.control.height'), 'default'));
    const items = densityTokens.map((t) => {
      const k = Object.fromEntries(DENSITIES.map((d) => [d, keyOf(t, d)]));
      const want = t.meta.fixed ? { comfortable: k.default, default: k.default, compact: k.default } : { comfortable: shift(k.default, step), default: k.default, compact: shift(k.default, -step) };
      const value = DENSITIES.map((d) => r(t.path, { Density: d })).join(' / ');
      return { token: t.path, value: `${value} (comfortable / default / compact)`, rule: t.meta.fixed ? 'the same in every density' : `${step} step${step > 1 ? 's' : ''} each way`, ok: DENSITIES.every((d) => k[d] === want[d]) };
    });
    checks.push(result({ id: 'S3', title: 'Density is one rule: every token moves the same number of steps along the scale (compact down, comfortable up); the target floor never moves', wcag: '—', level: 'AA', foundation: 'Spacing' }, items));
  }
  {
    // The ladder: sizes step up inside each family, and a size word is the same distance in every family.
    const items = [];
    const spacing = densityTokens.filter((t) => t.meta.spacing);
    const fams = [...new Set(spacing.map((t) => t.meta.family))];
    for (const d of DENSITIES) {
      for (const fam of fams) {
        const ts = spacing.filter((t) => t.meta.family === fam).sort((a, b) => SIZE_ORDER.indexOf(a.meta.size) - SIZE_ORDER.indexOf(b.meta.size));
        for (let i = 1; i < ts.length; i++) {
          const lo = r(ts[i - 1].path, { Density: d }), hi = r(ts[i].path, { Density: d });
          items.push({ item: `${ts[i - 1].path} < ${ts[i].path}`, density: d, value: `${lo} < ${hi}`, ok: lo < hi });
        }
      }
      for (const size of SIZE_ORDER) {
        const same = spacing.filter((t) => t.meta.size === size);
        if (same.length < 2) continue;
        const vals = same.map((t) => r(t.path, { Density: d }));
        const same1 = new Set(vals).size === 1;
        items.push({ item: `${size} in ${same.map((t) => t.meta.family).join(', ')}`, density: d, value: vals.join(same1 ? ' = ' : ' ≠ '), ok: same1 });
      }
    }
    checks.push(result({ id: 'S4', title: 'One ladder: sizes step up inside each family, and a size word is the same distance in every family, in every density', wcag: '—', level: 'AA', foundation: 'Spacing' }, items));
  }
  {
    const items = [];
    for (const t of densityTokens.filter((x) => !x.meta.target)) for (const d of DENSITIES) {
      const v = r(t.path, { Density: d });
      items.push({ token: t.path, density: d, value: v, min: MIN_SPACE, ok: v >= MIN_SPACE });
    }
    checks.push(result({ id: 'S5', title: `Nothing collapses: every space is at least ${MIN_SPACE}px in every density`, wcag: '—', level: 'AA', foundation: 'Spacing' }, items));
  }
  {
    // Controls fit the label their density uses (Typography), with room above and below.
    const items = DENSITIES.map((d) => {
      const h = r('size.control.height', { Density: d });
      const lab = r(LABEL_FOR[d], { Responsive: 'sm' });
      const room = (h - lab.lineHeight) / 2;
      return { token: 'size.control.height', density: d, item: `${LABEL_FOR[d]} (${lab.fontSize}/${lab.lineHeight}px)`, value: `${h}px → ${room}px above and below`, min: LABEL_ROOM, ok: room >= LABEL_ROOM };
    });
    checks.push(result({ id: 'S6', title: `Controls fit their label in every density, with at least ${LABEL_ROOM}px above and below`, wcag: '—', level: 'AA', foundation: 'Spacing' }, items));
  }
  {
    const items = SCALE.map((k, i) => {
      const v = sys.resolve(`space.${k}`);
      const grid = v < GRID_FROM ? 2 : 4;
      const prev = i ? sys.resolve(`space.${SCALE[i - 1]}`) : -1;
      return { token: `space.${k}`, value: v, item: `multiple of ${grid}`, ok: v % grid === 0 && v > prev };
    });
    checks.push(result({ id: 'S7', title: `The scale sits on a grid: 2px steps below ${GRID_FROM}px, the 4px grid from ${GRID_FROM}px up, always increasing`, wcag: '—', level: 'AA', foundation: 'Spacing' }, items));
  }
  {
    // What ships: spacing in px, so enlarged text gets the room instead of the margins (rem margins double at 200% text).
    const css = toCss(sys, { prefix: 'x', density: { default: 'default' } });
    const decl = (name) => (css.match(new RegExp(`${name}: ([^;]+);`)) ?? [])[1];
    const items = SCALE.map((k) => { const v = decl(`--x-space-${k}`); return { token: `space.${k}`, value: v, ok: v === '0' || /^\d+px$/.test(v ?? '') }; });
    const margin = r('layout.margin', { Responsive: 'sm' });
    items.push({ item: `content at ${REFLOW_WIDTH}px with 200% text`, value: `${REFLOW_WIDTH} − 2 × ${margin} = ${REFLOW_WIDTH - 2 * margin}px (margins stay ${margin}px)`, min: 272, ok: REFLOW_WIDTH - 2 * margin >= 272 });
    checks.push(result({ id: 'S8', title: 'In code, spacing is px: when readers enlarge text, the text gets the room, not the margins', wcag: '1.4.4, 1.4.10', level: 'AA', foundation: 'Spacing' }, items));
  }

  // ---- Layout ----
  {
    const margin = r('layout.margin', { Responsive: 'sm' });
    const content = REFLOW_WIDTH - 2 * margin;
    const display = r('type.display.lg', { Responsive: 'sm' }).fontSize;
    checks.push(result({ id: 'L1', title: `Reflow at ${REFLOW_WIDTH}px: content width ≥ 272px and largest heading ≤ 40px`, wcag: '1.4.10', level: 'AA', foundation: 'Layout' }, [
      { item: 'content width at 320px', value: content, min: 272, ok: content >= 272 },
      { item: 'type.display.lg at sm', value: display, max: 40, ok: display <= 40 },
    ]));
  }
  {
    // The page grid at the narrowest width of every breakpoint: columns wide enough, gutters not eating the row.
    const containerPx = r('layout.container.max');
    const items = [];
    for (const bp of BREAKPOINTS) {
      const cols = r('layout.columns', { Responsive: bp });
      const g = gridAt(bp, { columns: cols, gutterPx: r('layout.gutter', { Responsive: bp }), marginPx: r('layout.margin', { Responsive: bp }), containerPx });
      items.push({ item: `${bp} at ${g.width}px: column width`, value: `${g.column}px (${g.content}px of content, ${cols} columns)`, min: MIN_COLUMN, ok: g.column >= MIN_COLUMN });
      items.push({ item: `${bp} at ${g.width}px: gutters' share of the row`, value: `${Math.round(g.share * 100)}%`, max: '33%', ok: g.share <= MAX_GUTTER_SHARE + 1e-9 });
    }
    const xlm = r('layout.margin', { Responsive: 'xl' });
    const xl = BREAKPOINT_MIN.xl - 2 * xlm;
    items.push({ item: 'the page reaches its widest where xl begins', value: `${BREAKPOINT_MIN.xl} − 2 × ${xlm} = ${xl}px; container ${containerPx}px`, ok: xl === containerPx });
    checks.push(result({ id: 'L2', title: `The page grid fits every breakpoint: at its narrowest width each column is ≥ ${MIN_COLUMN}px and gutters take ≤ a third of the row`, wcag: '1.4.10', level: 'AA', foundation: 'Layout' }, items));
  }
  if (cfg) {
    // Panes go inline only where the main region still holds a full reading line beside them, and the grid inside the
    // main region (which takes the grid of its own width) still has columns wide enough.
    const panes = panesOf(validateLayoutConfig(cfg));
    const measure = r('layout.measure.reading');
    const gridOf = (mode) => ({ columns: r('layout.columns', { Responsive: mode }), gutterPx: r('layout.gutter', { Responsive: mode }) });
    const items = [];
    for (const bp of BREAKPOINTS) {
      const m = r('layout.margin', { Responsive: bp });
      const s = shellAt(bp, panes, m, gridOf, measure);
      if (!s.inline.length) continue;
      const names = s.inline.map((n) => n.split('.')[2]).join(' + ');
      items.push({ item: `${bp} at ${s.width}px: ${names} inline — main content`, value: `${s.content}px (${s.width} − ${s.width - s.main} − 2 × ${m})`, min: measure, ok: s.fitsMeasure });
      items.push({ item: `${bp} at ${s.width}px: ${names} inline — grid in the main region`, value: `${s.main}px wide → the ${s.mode} grid: ${s.columns} columns of ${s.column}px, gutters ${Math.round(s.share * 100)}%`, min: MIN_COLUMN, ok: s.fitsGrid });
    }
    for (const p of panes.filter((x) => x.below === 'drawer')) {
      const left = REFLOW_WIDTH - p.width;
      items.push({ item: `${p.name.split('.')[2]} as a drawer at ${REFLOW_WIDTH}px`, value: `${left}px of the page stays visible`, min: DRAWER_STRIP, ok: left >= DRAWER_STRIP });
    }
    checks.push(result({ id: 'L3', title: `Panes add up: a pane goes inline only at a breakpoint where the main region still holds a full reading line (layout.measure.reading) and its own grid keeps columns ≥ ${MIN_COLUMN}px`, wcag: '1.4.10', level: 'AA', foundation: 'Layout' }, items));
  }
  {
    const items = [];
    for (const d of DENSITIES) {
      const h = r('layout.header.height', { Density: d }), ctl = r('size.control.height', { Density: d }), pad = r('layout.scroll-padding.top', { Density: d });
      items.push({ item: `${d}: header holds a control`, value: `${h}px − ${ctl}px = ${h - ctl}px of room`, min: HEADER_ROOM, ok: h - ctl >= HEADER_ROOM });
      items.push({ item: `${d}: scroll padding = header height`, value: `${pad}px / ${h}px`, ok: pad === h });
      const shortest = STICKY_FROM_EM * 16;
      items.push({ item: `${d}: header in the shortest window it sticks in (${shortest}px tall)`, value: `${Math.round((h / shortest) * 100)}% of the height`, max: `${STICKY_SHARE * 100}%`, ok: h <= shortest * STICKY_SHARE });
    }
    items.push({ item: `at 400% zoom (${REFLOW_WIDTH} × ${REFLOW_HEIGHT}) the header scrolls with the page`, value: `it sticks only from ${STICKY_FROM_EM}em (${STICKY_FROM_EM * 16}px) tall`, ok: STICKY_FROM_EM * 16 > REFLOW_HEIGHT });
    const css = toCss(sys, { prefix: 'x', density: { default: 'default' } });
    const grows = sys.get('layout.scroll-padding.top').meta.growsWithText && /--x-layout-scroll-padding-top: max\(var\(--x-layout-header-height\), [\d.]+rem\);/.test(css);
    items.push({ item: 'the scroll padding grows with the reader\'s text (the header\'s labels do)', value: grows ? 'max(header height, header height in rem)' : 'px only', ok: grows });
    const linked = Object.values(sys.get('layout.scroll-padding.top').values).every((v) => isAlias(v) && aliasTarget(v) === 'layout.header.height');
    items.push({ item: 'layout.scroll-padding.top → layout.header.height', value: linked ? 'linked in every density' : 'not linked', ok: linked });
    checks.push(result({ id: 'L4', title: `A sticky header never hides focus: it holds its controls in every density, the scroll padding is its height, and it sticks only in windows ≥ ${STICKY_FROM_EM}em tall, where it takes ≤ ${STICKY_SHARE * 100}% of the height`, wcag: '2.4.11', level: 'AA', foundation: 'Layout' }, items));
  }
  {
    // One set of breakpoints: rising from 0, shared by type and layout, and the same in tokens.css and Tailwind.
    const items = [];
    const mins = BREAKPOINTS.map((bp) => r(`breakpoint.${bp}`));
    items.push({ item: 'sm starts at 0, so every window width has a breakpoint', value: `${mins[0]}px`, ok: mins[0] === 0 });
    for (let i = 1; i < mins.length; i++) items.push({ item: `${BREAKPOINTS[i]} starts above ${BREAKPOINTS[i - 1]}`, value: `${mins[i]} > ${mins[i - 1]}`, ok: mins[i] > mins[i - 1] });
    const resp = [...sys.tokens.values()].filter((t) => t.collection === 'Responsive');
    const both = resp.some((t) => t.path.startsWith('type.')) && resp.some((t) => t.path.startsWith('layout.'));
    items.push({ item: 'type and layout share one mode set (Responsive)', value: sys.collections.get('Responsive').modes.join(' · '), ok: both });
    const css = toCss(sys, { prefix: 'x', density: { default: 'default' } });
    const mq = [...css.matchAll(/@media \(min-width: ([\d.]+)em\) \{\n  :root \{([^}]*)\}/g)].filter((m) => m[2].includes('-layout-columns:')).map((m) => +m[1]); // the Responsive mode blocks
    const tw = [...toTailwindTheme(sys, { prefix: 'x' }).matchAll(/--breakpoint-(md|lg|xl): ([\d.]+)rem/g)].map((m) => +m[2]);
    const want = mins.slice(1).map((x) => x / 16);
    items.push({ item: 'tokens.css breakpoint blocks (em)', value: mq.join(' · '), ok: JSON.stringify(mq) === JSON.stringify(want) });
    items.push({ item: 'Tailwind breakpoints (rem)', value: tw.join(' · '), ok: JSON.stringify(tw) === JSON.stringify(want) });
    const removed = ['sm', '2xl'].every((b) => new RegExp(`--breakpoint-${b}: initial;`).test(toTailwindTheme(sys, { prefix: 'x' })));
    items.push({ item: 'Tailwind\'s own sm (40rem) and 2xl (96rem) removed', value: removed ? 'removed — no prefix means sm' : 'still defined', ok: removed });
    checks.push(result({ id: 'L5', title: 'One set of breakpoints: rising from 0, shared by type and layout, and the same in tokens.css (em) and Tailwind (rem), so both follow the reader\'s text size', wcag: '1.4.4', level: 'AA', foundation: 'Layout' }, items));
  }

  // ---- Radius (R1–R4) ----
  if (sys.tokens.has('shape.control')) {
    const at = (path, style, extra = {}) => r(path, { Shape: style, ...extra });
    // R1: roles in order in every style, and each style a real step from the one before.
    {
      const items = [];
      for (const s of STYLE_NAMES) {
        const v = ROLE_ORDER.map((j) => at(`shape.${j}`, s));
        const ok = v[0] === 0 && v.every((x, i) => i === 0 || x >= v[i - 1]) && v[1] > 0 && v.at(-2) < v.at(-1);
        items.push({ item: `${s}: ${ROLE_ORDER.map((j, i) => `${j} ${v[i] >= 9999 ? 'full' : v[i]}`).join(' ≤ ')}`, ok });
      }
      for (const j of ROLE_ORDER.filter((x) => x !== 'none' && x !== 'pill')) {
        const v = STYLE_NAMES.map((s) => at(`shape.${j}`, s));
        items.push({ item: `shape.${j}: ${STYLE_NAMES.map((s, i) => `${s} ${v[i]}`).join(' ≤ ')}`, ok: v.every((x, i) => i === 0 || x >= v[i - 1]) });
      }
      for (let i = 1; i < STYLE_NAMES.length; i++) {
        const a = STYLE_NAMES[i - 1], b = STYLE_NAMES[i];
        const differ = ['control', 'container', 'surface'].some((j) => at(`shape.${j}`, b) > at(`shape.${j}`, a));
        items.push({ item: `${b} is rounder than ${a} for control, container or surface`, ok: differ });
      }
      checks.push(result({ id: 'R1', title: 'Roles keep their order in every style (none < mark ≤ control ≤ container ≤ surface < pill), and each style is rounder than the one before', wcag: '—', level: 'AA', foundation: 'Radius' }, items));
    }
    // R2: corners stay corners — a checkbox never reads as a radio, a control never as a pill (linked to Spacing's sizes).
    {
      const items = [];
      const smallest = Math.min(...DENSITIES.map((d) => r('size.control.height', { Density: d })));
      for (const s of STYLE_NAMES) {
        const m = at('shape.mark', s), c = at('shape.control', s);
        items.push({ token: 'shape.mark', style: s, value: m, max: MARK_SIZE * CORNER_SHARE, item: `a ${MARK_SIZE}px checkbox: radius ${m}px (≤ ${MARK_SIZE * CORNER_SHARE}px — a square with soft corners, never a circle)`, ok: m <= MARK_SIZE * CORNER_SHARE });
        items.push({ token: 'shape.control', style: s, value: c, max: smallest * CORNER_SHARE, item: `a ${smallest}px control (compact): radius ${c}px (≤ ${smallest * CORNER_SHARE}px — corners, not round ends)`, ok: c <= smallest * CORNER_SHARE });
      }
      checks.push(result({ id: 'R2', title: `Shapes keep their corners: a mark's radius ≤ ${CORNER_SHARE * 100}% of a ${MARK_SIZE}px checkbox (never mistaken for a radio), a control's ≤ ${CORNER_SHARE * 100}% of the smallest control height`, wcag: '—', level: 'AA', foundation: 'Radius' }, items));
    }
    // R3: content stays inside the corners — the corner of each text's box sits inside the rounded shape, so text is
    // always on the fill its contrast was measured against (linked to Spacing and Typography).
    {
      const items = [];
      const font = (style) => r(style, { Responsive: 'sm' });
      for (const s of STYLE_NAMES) for (const d of DENSITIES) {
        const D = { Density: d }, sp = (path) => r(path, D);
        const label = font(LABEL_FOR[d]), h = sp('size.control.height');
        const lead = (t) => (t.lineHeight - t.fontSize) / 2; // the glyphs sit in the font-size box, centred in the line
        const badgeFont = font('type.label.sm'), badgeH = badgeFont.lineHeight + 2 * sp('space.inset.xs');
        const cases = [
          ['a button label', at('shape.control', s), sp('space.inset.md'), (h - label.lineHeight) / 2 + lead(label)],
          ['a badge label (pill)', badgeH / 2, sp('space.inset.sm'), sp('space.inset.xs') + lead(badgeFont)],
          ['a menu item label', at('shape.container', s), sp('space.inset.xs') + sp('space.inset.sm'), sp('space.inset.xs') + (h - label.lineHeight) / 2 + lead(label)],
          ['tooltip text', at('shape.container', s), sp('space.inset.sm'), sp('space.inset.sm') + lead(font('type.body.sm'))],
          ['card content', at('shape.container', s), sp('space.inset.lg'), sp('space.inset.lg')],
          ['dialog content', at('shape.surface', s), sp('space.inset.xl'), sp('space.inset.xl')],
        ];
        for (const [what, rad, dx, dy] of cases) items.push({ item: `${s} · ${d} · ${what}: radius ${+rad.toFixed(1)}px, text corner ${+dx.toFixed(1)} × ${+dy.toFixed(1)}px in`, style: s, density: d, ok: insideCorner(rad, dx, dy) });
      }
      checks.push(result({ id: 'R3', title: 'Text stays inside the corners: in every style and density, the corner of a label\'s or content\'s box sits inside its rounded shape, on the fill its contrast is measured against', wcag: '1.4.3', level: 'AA', foundation: 'Radius' }, items));
    }
    // R4: a focus ring drawn on its own layer hugs the shape: its radius is the shape's plus the ring offset.
    {
      const items = [];
      const off = r('focus.ring.offset');
      for (const t of sys.byPrefix('shape.').filter((x) => x.meta.focusOf)) {
        for (const s of STYLE_NAMES) {
          const shape = at(`shape.${t.meta.focusOf}`, s), ring = at(t.path, s);
          items.push({ token: t.path, style: s, item: `${t.path} ${s}: ${ring}px = ${shape} + ${off}`, ok: ring === shape + off });
        }
      }
      checks.push(result({ id: 'R4', title: 'Focus rings follow the shape: a ring on its own layer has the shape\'s radius plus the ring offset, in every style', wcag: '2.4.7', level: 'AA', foundation: 'Radius' }, items));
    }
  }

  // ---- Border: focus ring ----
  {
    const w = r('focus.ring.width'), off = r('focus.ring.offset');
    checks.push(result({ id: 'F2', title: 'Focus ring ≥ 2px thick with an offset (colour checked in C3)', wcag: '2.4.7, 2.4.13', level: 'AA', foundation: 'Border' }, [
      { token: 'focus.ring.width', value: w, min: 2, ok: w >= 2 },
      { token: 'focus.ring.offset', value: off, min: 1, ok: off >= 1 },
    ]));
  }

  // ---- Border: widths by job ----
  {
    const jobs = sys.byPrefix('border.width.').filter((t) => t.meta.job);
    const w = (t) => r(t.path);
    const css = toCss(sys, { prefix: 'x', density: { default: 'default' } });
    // B1: whole pixels on the scale, px in code.
    {
      const items = [];
      for (const t of [...sys.byPrefix('border.width.'), sys.get('focus.ring.width')]) {
        const v = r(t.path);
        items.push({ token: t.path, value: v, item: `${t.path}: ${v}px`, ok: Number.isInteger(v) && v >= BORDER_MIN && v <= BORDER_MAX });
      }
      for (const t of [...jobs, sys.get('focus.ring.width')]) {
        const n = `--x-${t.path.replace(/\./g, '-')}`;
        const decl = new RegExp(`${n}: ([^;]+);`).exec(css)?.[1] ?? '';
        const prim = /var\(--x-border-width-(\d)\)/.exec(decl)?.[1];
        const raw = new RegExp(`--x-border-width-${prim}: ([^;]+);`).exec(css)?.[1] ?? '';
        items.push({ token: t.path, item: `tokens.css ${n} → ${raw || decl}`, ok: !!prim && /^\d+px$/.test(raw) });
      }
      checks.push(result({ id: 'B1', title: `Widths are whole pixels from ${BORDER_MIN} to ${BORDER_MAX}px on the scale — no hairlines below a pixel — and px in code, so a line stays a line at 200% text`, wcag: '1.4.11', level: 'AA', foundation: 'Border' }, items));
    }
    // B2: jobs that share a width look different; states are wider than what they mark.
    {
      const items = [];
      const by = (job) => jobs.find((t) => t.meta.job === job);
      const L = w(by('line')), C = w(by('control')), S = w(by('state')), I = w(by('indicator')), F = r('focus.ring.width'), off = r('focus.ring.offset');
      items.push({ item: `a state is wider than the control it marks: state ${S}px > control ${C}px (state never shows by colour alone)`, ok: S > C });
      items.push({ item: `the current-item bar is at least as wide as a state: indicator ${I}px ≥ state ${S}px`, ok: I >= S });
      items.push({ item: `a control boundary is at least a structure line: control ${C}px ≥ line ${L}px`, ok: C >= L });
      items.push({ item: `the focus ring stands off the element: offset ${off}px > 0, so it never looks like the element's own ${F === S ? 'state ' : ''}border`, ok: off > 0 });
      // Same width → no colour in common, in Light and Dark.
      for (let i = 0; i < jobs.length; i++) for (let k = i + 1; k < jobs.length; k++) {
        const a = jobs[i], b = jobs[k];
        if (w(a) !== w(b)) continue;
        const shared = a.meta.colors.filter((c) => b.meta.colors.some((d) => COLOR_MODES.every((m) => r(c, { Color: m }) === r(d, { Color: m }))));
        const sameStyle = a.meta.style === b.meta.style;
        const sameSides = a.meta.sides === b.meta.sides || a.meta.sides === 'any' || b.meta.sides === 'any';
        const apart = !shared.length ? 'different colour roles' : !sameStyle ? `different styles (${a.meta.style}, ${b.meta.style})` : !sameSides ? `different sides (${a.meta.sides === 'one' ? a.path : b.path} is a bar on one side)` : null;
        items.push({ item: `${a.path} and ${b.path} are both ${w(a)}px: ${apart ?? `they share ${shared.join(', ')} — nothing tells them apart`}`, ok: !!apart });
      }
      checks.push(result({ id: 'B2', title: 'Jobs stay apart: a state is wider than the control it marks, jobs that share a width use different colours, and the focus ring stands off the element', wcag: '1.4.1', level: 'AA', foundation: 'Border' }, items));
    }
    // B3: lines that identify something reach 3:1 in Light and Dark on every background they are paired with.
    {
      const c3 = checks.find((c) => c.id === 'C3')?.items ?? [];
      const items = [];
      for (const t of jobs) for (const c of t.meta.colors) {
        const pairs = c3.filter((x) => x.fg === c);
        if (!t.meta.identifies) { items.push({ token: t.path, color: c, item: `${t.path} with ${c}: decorative — the content it surrounds identifies itself`, ok: true, decorative: true }); continue; }
        const worst = pairs.length ? pairs.reduce((a, b) => (a.ratio < b.ratio ? a : b)) : null;
        items.push({ token: t.path, color: c, item: pairs.length ? `${t.path} with ${c}: lowest ${worst.ratio}:1 (${worst.mode}, ${worst.bg}) over ${pairs.length} pairs` : `${t.path} with ${c}: no 3:1 pairs measured — the colour is not checked as a boundary`, ok: pairs.length > 0 && pairs.every((x) => x.ok) });
      }
      checks.push(result({ id: 'B3', title: 'Lines people need — control boundaries, states, the current-item bar — reach 3:1 against every background, in Light and Dark', wcag: '1.4.11', level: 'AA', foundation: 'Border' }, items));
    }
    // B4: a widened border takes its extra width from the padding, so content doesn't move — and what is left stays a space.
    {
      const items = [];
      const by = (job) => r(`border.width.${job}`);
      for (const d of ['comfortable', 'default', 'compact']) {
        const D = { Density: d }, sp = (x) => r(`space.inset.${x}`, D);
        for (const [what, pad, extra] of [
          ['a selected or invalid control (padding inset.md)', sp('md'), by('state') - by('control')],
          ['a selected card (padding inset.lg, outline line → state)', sp('lg'), by('state') - by('line')],
          ['the current navigation item (padding inset.md, bar on its start edge)', sp('md'), by('indicator')],
        ]) items.push({ density: d, item: `${d} · ${what}: ${pad} − ${extra} = ${pad - extra}px left`, ok: pad - extra >= MIN_SPACE });
      }
      checks.push(result({ id: 'B4', title: `States don't move content: a wider border takes its extra width off the padding, and at least ${MIN_SPACE}px of padding is left in every density`, wcag: '—', level: 'AA', foundation: 'Border' }, items));
    }
    // B5 and B6 read tokens.css: joined parts share one line; forced colours keep the ring and the states.
    {
      const join = css.slice(css.indexOf('/* Joined parts'));
      const items = [
        { item: '.x-join: each part after the first overlaps the one before by the control width (one line at every seam, not two)', ok: /:not\(:first-child\) \{[^}]*margin-inline-start: calc\(-1 \* var\(--x-border-width-control\)\)/.test(join) && /\[data-join="block"\] > :not\(:first-child\) \{[^}]*margin-block-start: calc\(-1 \* var\(--x-border-width-control\)\)/.test(join) },
        { item: '.x-join lifts the hovered, focused and selected part, so its whole border and ring show', ok: /:hover/.test(join) && /:focus-visible/.test(join) && /aria-pressed|aria-selected|aria-current/.test(join) },
      ];
      checks.push(result({ id: 'B5', title: 'Joined parts share one line: parts overlap by the control width and the part that changes is lifted above its neighbours', wcag: '—', level: 'AA', foundation: 'Border' }, items));
      const fc = /@media \(forced-colors: active\) \{([\s\S]*?)\n\s*\}\n/.exec(css)?.[1] ?? '';
      const ring = /:focus-visible \{ outline: var\(--x-focus-ring-width\) solid var\(--x-focus-ring-color\)/.test(css);
      checks.push(result({ id: 'B6', title: 'Forced colours (Windows contrast themes) keep every cue: the focus ring is an outline, states get a system-colour outline, disabled controls turn GrayText, overlays keep a border', wcag: '1.4.11, 2.4.7', level: 'AA', foundation: 'Border' }, [
        { item: 'the focus ring is an outline (box-shadow rings are removed in forced colours)', ok: ring },
        { item: 'forced colours: the ring takes Highlight', ok: /:focus-visible[^{]*\{[^}]*outline-color: Highlight/.test(fc) },
        { item: 'forced colours: selected, current, pressed and checked states get an outline in SelectedItem (their fill is replaced)', ok: /aria-selected="true"/.test(fc) && /aria-current/.test(fc) && /SelectedItem/.test(fc) },
        { item: 'forced colours: disabled controls use GrayText', ok: /:disabled[^{]*\{[^}]*GrayText/.test(fc) },
        { item: 'floating levels (floating, modal, dragging) have a border, not shadow alone (shadows are removed in forced colours)', ok: ['floating', 'modal', 'dragging'].every((l) => sys.tokens.has(`elevation.${l}.border`)) },
      ]));
    }
  }

  // ---- Elevation ----
  if (sys.tokens.has('layer.sticky')) {
    const css = toCss(sys, { prefix: 'x', density: { default: 'default' } });
    const jobs = ELEVATION_JOB_ORDER;
    const surfaceOf = (job, m) => (ELEVATION_JOBS[job].surface ? opaque(r(`elevation.${job}.surface`, { Color: m })) : null);
    const lum = (hex) => { const [R, G, B] = hexToRgb(hex).map((c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * R + 0.7152 * G + 0.0722 * B; };
    // E1: everything that floats over content keeps an edge; a modal has its scrim; the sticky bar has a line toward the content.
    {
      const items = [];
      for (const job of jobs) {
        const j = ELEVATION_JOBS[job];
        if (j.edge === 'none') continue;
        const has = sys.tokens.has(`elevation.${job}.border`);
        items.push({ token: `elevation.${job}.border`, item: `${job}: ${j.edge === 'all' ? 'an edge on every side' : 'a line on the side facing the content'} (${has ? sys.get(`elevation.${job}.border`).values.Value.slice(1, -1) : 'missing'})`, ok: has });
      }
      items.push({ token: 'elevation.modal.scrim', item: 'modal: the scrim behind it', ok: sys.tokens.has('elevation.modal.scrim') });
      for (const cls of ['floating', 'modal', 'dragging']) items.push({ item: `.x-${cls} in tokens.css draws the border with the shadow`, ok: new RegExp(`\\.x-${cls} \\{[^}]*box-shadow: var\\(--x-elevation-${cls}-shadow\\)[^}]*border: var\\(--x-border-width-line\\) solid var\\(--x-elevation-${cls}-border\\)`).test(css) });
      items.push({ item: '.x-modal::backdrop is the scrim', ok: /\.x-modal::backdrop \{ background: var\(--x-elevation-modal-scrim\)/.test(css) });
      checks.push(result({ id: 'E1', title: 'Whatever floats keeps an edge — never shadow alone (forced colours remove shadows) — and a modal has its scrim', wcag: '1.4.11', level: 'AA', foundation: 'Elevation' }, items));
    }
    // E2: height shows by surface where shadows can't: in Dark each rising level is lighter; in Light none is darker than the page.
    {
      const items = [];
      const resting = jobs.filter((j) => ELEVATION_JOBS[j].surface);
      for (let i = 1; i < resting.length; i++) {
        const lo = resting[i - 1], hi = resting[i];
        const same = ELEVATION_JOBS[lo].surface === ELEVATION_JOBS[hi].surface;
        const d = contrast(surfaceOf(hi, 'Dark'), surfaceOf(lo, 'Dark'));
        const lighter = lum(surfaceOf(hi, 'Dark')) > lum(surfaceOf(lo, 'Dark'));
        items.push({ mode: 'Dark', item: same ? `Dark · ${hi} shares ${lo}'s surface by design (the scrim tells a modal apart)` : `Dark · ${hi} over ${lo}: ${d.toFixed(2)}:1, ${lighter ? 'lighter' : 'NOT lighter'}`, ratio: +d.toFixed(2), ok: same ? hi === 'modal' && lo === 'floating' : lighter && d >= SURFACE_STEP_MIN });
        items.push({ mode: 'Light', item: `Light · ${hi} is no darker than ${lo}`, ok: lum(surfaceOf(hi, 'Light')) >= lum(surfaceOf(lo, 'Light')) - 1e-9 });
      }
      checks.push(result({ id: 'E2', title: `Height shows by surface where shadows can't: in Dark each level is lighter than the one below (≥ ${SURFACE_STEP_MIN}:1); in Light no level is darker than the page`, wcag: '—', level: 'AA', foundation: 'Elevation' }, items));
    }
    // E3: a floating level's edge is seen against everything it can sit on — the page, raised and sticky surfaces, another
    // floating surface (a menu over a menu or a dialog) and the scrim over the page — in Light and Dark.
    {
      const items = [];
      for (const job of ['floating', 'modal', 'dragging'].filter((j) => sys.tokens.has(`elevation.${j}.border`))) { // a missing edge is E1's
        const edgeRole = sys.get(`elevation.${job}.border`).values.Value.slice(1, -1);
        for (const m of COLOR_MODES) {
          const edge = opaque(r(`elevation.${job}.border`, { Color: m }));
          const unders = ['page', 'raised', 'sticky', 'floating'].filter((u) => !(job === 'floating' && u === 'modal')).map((u) => [u, surfaceOf(u, m)]);
          if (job === 'modal') { const s = r('elevation.modal.scrim', { Color: m }); unders.push(['the scrim over the page', flatten(s, surfaceOf('page', m))]); }
          // What is right beside the edge is the surface under it, darkened by the level's own shadow (3px out, mid-height).
          const sh = r(`elevation.${job}.shadow`, { Color: m });
          const side = shadowSideAlpha(sh, sh.color.length === 9 ? parseInt(sh.color.slice(7), 16) / 255 : 1);
          for (const [u, bg] of unders) {
            const beside = composite('#000000', side, bg);
            const c = Math.min(contrast(edge, bg), contrast(edge, beside));
            items.push({ token: `elevation.${job}.border`, mode: m, on: u, ratio: +c.toFixed(2), item: `${m} · ${job} edge (${edgeRole}) on ${u}, beside its own shadow: ${c.toFixed(2)}:1`, ok: c >= EDGE_MIN });
          }
        }
      }
      for (const m of COLOR_MODES) {
        const s = r('elevation.modal.scrim', { Color: m });
        const c = contrast(surfaceOf('modal', m), flatten(s, surfaceOf('page', m)));
        items.push({ mode: m, ratio: +c.toFixed(2), item: `${m} · the modal surface against the scrim over the page: ${c.toFixed(2)}:1`, ok: c >= EDGE_MIN });
      }
      checks.push(result({ id: 'E3', title: `Edges are seen: the edge of whatever floats reaches ${EDGE_MIN}:1 against every surface it can sit on and against the scrim, in Light and Dark`, wcag: '—', level: 'AA', foundation: 'Elevation' }, items));
    }
    // E4: shadows grow with height, in both modes, and every shadow is linked to a Colour shadow role.
    {
      const items = [];
      const shadowed = jobs.filter((j) => sys.tokens.has(`elevation.${j}.shadow`));
      const alpha = (hex) => (hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1);
      for (let i = 1; i < shadowed.length; i++) {
        const lo = shadowed[i - 1], hi = shadowed[i];
        for (const m of COLOR_MODES) {
          const a = r(`elevation.${lo}.shadow`, { Color: m }), b = r(`elevation.${hi}.shadow`, { Color: m });
          const reachA = a.offsetY + a.blur / 2 + a.spread, reachB = b.offsetY + b.blur / 2 + b.spread;
          const ok = b.offsetY >= a.offsetY && b.blur >= a.blur && reachB > reachA && alpha(b.color) >= alpha(a.color);
          items.push({ mode: m, item: `${m} · ${hi} (${b.offsetY}/${b.blur}/${b.spread}px, alpha ${alpha(b.color).toFixed(2)}, reach ${reachB}px) above ${lo} (${a.offsetY}/${a.blur}/${a.spread}px, alpha ${alpha(a.color).toFixed(2)}, reach ${reachA}px)`, ok });
        }
      }
      items.push({ item: 'the page casts no shadow', ok: !sys.tokens.has('elevation.page.shadow') });
      checks.push(result({ id: 'E4', title: 'Shadows grow with height: a higher level drops further, blurs wider and is at least as dark, in Light and Dark', wcag: '—', level: 'AA', foundation: 'Elevation' }, items));
    }
    // E5: text reads on every level's surface — each surface is a background the colour build measured text on (C1).
    {
      const c1 = checks.find((c) => c.id === 'C1')?.items ?? [];
      const items = jobs.filter((j) => ELEVATION_JOBS[j].surface).map((job) => {
        const bg = sys.get(`elevation.${job}.surface`).values.Value.slice(1, -1);
        const pairs = c1.filter((x) => x.bg === bg);
        const worst = pairs.length ? pairs.reduce((a, b) => (a.ratio < b.ratio ? a : b)) : null;
        return { token: `elevation.${job}.surface`, item: `${job} (${bg}): ${pairs.length ? `${pairs.length} text pairs, lowest ${worst.ratio}:1 (${worst.fg}, ${worst.mode})` : 'no text pairs measured'}`, ok: pairs.length > 0 && pairs.every((x) => x.ok) };
      });
      checks.push(result({ id: 'E5', title: 'Text reads on every level: each surface is measured with every text colour (C1), in Light and Dark', wcag: '1.4.3', level: 'AA', foundation: 'Elevation' }, items));
    }
    // E6: the stacking order holds, with room for product layers, and tokens.css uses it (no stray numbers).
    {
      const layers = sys.byPrefix('layer.').map((t) => ({ path: t.path, v: r(t.path), product: t.meta.product })).sort((a, b) => a.v - b.v);
      const built = LAYER_ORDER.map((j) => r(`layer.${j}`));
      const items = [{ item: `built-in order ${LAYER_ORDER.join(' < ')}: ${built.join(' < ')}`, ok: built.every((x, i) => i === 0 || x > built[i - 1]) }];
      for (let i = 1; i < layers.length; i++) items.push({ item: `${layers[i].path} (${layers[i].v}) above ${layers[i - 1].path} (${layers[i - 1].v})`, ok: layers[i].v > layers[i - 1].v });
      const zs = [...css.matchAll(/z-index: ([^;]+);/g)].map((m) => m[1].trim());
      const stray = zs.filter((z) => !/^var\(--x-layer-[a-z-]+\)$/.test(z) && !/^(auto|1|2)$/.test(z));
      items.push({ item: `tokens.css: every z-index is a layer (local 1 and 2 only inside .x-join)${stray.length ? ` — stray: ${stray.join(', ')}` : ''}`, ok: !stray.length });
      items.push({ item: 'tokens.css: the shell header is layer.sticky and the drawer layer.floating', ok: /\[data-shell="header"\] \{[^}]*z-index: var\(--x-layer-sticky\)/.test(css) && !/position: fixed; z-index: (?!var\(--x-layer-floating\))/.test(css) });
      checks.push(result({ id: 'E6', title: `The stacking order holds: ${LAYER_ORDER.join(' < ')}, product layers in between, and tokens.css stacks only with layer tokens`, wcag: '2.4.11', level: 'AA', foundation: 'Elevation' }, items));
    }
  }

  // ---- Motion ----
  if (sys.tokens.has('motion.feedback.duration')) {
    const jobs = motionJobs(validateMotionConfig(cfg ?? {}).jobs);
    const css = toCss(sys, { prefix: 'x', density: { default: 'default' } });
    const motionCss = css.slice(css.indexOf('/* Motion:'));
    const ms = (path, m) => r(path, { Motion: m });
    // M1: reduced motion is fade only — nothing moves, transitions fade in 100ms or less, the loading indicator stops turning.
    {
      const items = [];
      for (const j of jobs) {
        if (sys.tokens.has(`motion.${j.job}.distance`)) items.push({ token: `motion.${j.job}.distance`, mode: 'reduced', item: `${j.job}: travels ${ms(`motion.${j.job}.distance`, 'reduced')}px in reduced motion (full: ${ms(`motion.${j.job}.distance`, 'full')}px)`, ok: ms(`motion.${j.job}.distance`, 'reduced') === 0 });
        if (j.kind === 'in-place' || j.kind === 'in-out') for (const part of j.kind === 'in-out' ? ['duration', 'exit-duration'] : ['duration']) {
          const v = ms(`motion.${j.job}.${part}`, 'reduced');
          items.push({ token: `motion.${j.job}.${part}`, mode: 'reduced', value: v, max: REDUCED_MAX_MS, item: `${j.job} ${part === 'duration' ? '' : 'exit '}fades in ${v}ms in reduced motion`, ok: v <= REDUCED_MAX_MS });
        }
      }
      items.push({ item: 'the loading indicator pulses instead of turning in reduced motion (prefers-reduced-motion and data-motion="reduced")', ok: /@media \(prefers-reduced-motion: reduce\) \{\s*\.x-loading:not\(\[data-motion="full"\] \*\) \{ animation-name: x-pulse; \}/.test(motionCss) && /\[data-motion="reduced"\] \.x-loading \{ animation-name: x-pulse; \}/.test(motionCss) && !/@keyframes x-pulse \{[^}]*(rotate|transform|translate|scale)/.test(motionCss) });
      const moves = [...motionCss.matchAll(/translate: ([^;]+);/g)].map((m) => m[1].trim()).filter((v) => !/^(none|0)$/.test(v) && !/^(calc\(-1 \* var\(--x-motion-[a-z-]+-distance\)\)|var\(--x-motion-[a-z-]+-distance\))( (0|calc\(-1 \* var\(--x-motion-[a-z-]+-distance\)\)|var\(--x-motion-[a-z-]+-distance\)))?$/.test(v) && !/^0 (calc\(-1 \* var\(--x-motion-[a-z-]+-distance\)\)|var\(--x-motion-[a-z-]+-distance\))$/.test(v));
      items.push({ item: `tokens.css moves things only by a job's distance, which reduced motion sets to 0${moves.length ? ` — not: ${moves.join(', ')}` : ''}`, ok: !moves.length && !/(^|[^-])(scale|rotate):/.test(motionCss.replace(/@keyframes x-spin \{[^}]*\}/, '')) });
      items.push({ item: 'the reduced block reaches every element: prefers-reduced-motion on :root, and data-motion="reduced" on <html> or any container', ok: /@media \(prefers-reduced-motion: reduce\) \{\s*:root:not\(\[data-motion="full"\]\) \{/.test(css) && /\n\[data-motion="reduced"\] \{/.test(css) && /\n\[data-motion="full"\] \{/.test(css) });
      checks.push(result({ id: 'M1', title: `Reduced motion is fade only: nothing moves, transitions fade in ${REDUCED_MAX_MS}ms or less, the loading indicator pulses instead of turning`, wcag: '2.3.3', level: 'AA', foundation: 'Motion' }, items));
    }
    // M2: nothing flashes more than three times a second.
    {
      const items = [];
      for (const m of ['full', 'reduced']) {
        const h = ms('motion.highlight.duration', m);
        items.push({ token: 'motion.highlight.duration', mode: m, value: h, min: MIN_FLASH_INTERVAL_MS, item: `${m}: a highlight takes ${h}ms — one change, never a blink`, ok: h >= MIN_FLASH_INTERVAL_MS });
      }
      const pulse = ms('motion.loading.duration', 'reduced');
      items.push({ token: 'motion.loading.duration', mode: 'reduced', value: pulse, min: MIN_FLASH_INTERVAL_MS, item: `reduced: the loading pulse takes ${pulse}ms a cycle (${(1000 / pulse).toFixed(1)} a second)`, ok: pulse >= MIN_FLASH_INTERVAL_MS });
      const blinks = [...motionCss.matchAll(/@keyframes (x-[a-z-]+) \{([^}]*\}[^@]*?)\}\n/g)].filter(([, , b]) => /visibility|opacity: 0[;\s]/.test(b));
      items.push({ item: `tokens.css has no keyframes that blink (switch visibility or drop to opacity 0)${blinks.length ? ` — ${blinks.map((b) => b[1]).join(', ')}` : ''}`, ok: !blinks.length });
      checks.push(result({ id: 'M2', title: `Nothing flashes: a highlight takes ≥ ${MIN_FLASH_INTERVAL_MS}ms and no loop changes brightness more than 3 times a second`, wcag: '2.3.1', level: 'A', foundation: 'Motion' }, items));
    }
    // M3: duration follows distance — computed, not picked; exits are shorter; loops are calm.
    {
      const items = [];
      for (const j of jobs.filter((x) => x.kind === 'in-place' || x.kind === 'in-out')) {
        const px = sys.tokens.has(`motion.${j.job}.distance`) ? ms(`motion.${j.job}.distance`, 'full') : 0;
        const d = ms(`motion.${j.job}.duration`, 'full');
        items.push({ token: `motion.${j.job}.duration`, item: `${j.job}: ${px}px → ${d}ms (rule: ${RESPONSE_MS} + ${MS_PER_ROOT_PX} × √${px} = ${(RESPONSE_MS + MS_PER_ROOT_PX * Math.sqrt(px)).toFixed(0)}, down to ${durationFor(px)})`, ok: d === durationFor(px) && px <= MAX_DISTANCE && d <= MAX_DURATION });
        if (j.kind === 'in-out') { const e = ms(`motion.${j.job}.exit-duration`, 'full'); items.push({ token: `motion.${j.job}.exit-duration`, item: `${j.job} leaves in ${e}ms, arrives in ${d}ms`, ok: e === exitFor(d) && e <= d }); }
      }
      const turn = ms('motion.loading.duration', 'full');
      items.push({ token: 'motion.loading.duration', item: `loading turns once in ${turn}ms (at most once a second)`, ok: turn >= LOADING_TURN_MS });
      checks.push(result({ id: 'M3', title: `Duration follows distance: ${RESPONSE_MS}ms + ${MS_PER_ROOT_PX}ms × √px rounded down to ${STEP_MS}ms, nothing over ${MAX_DISTANCE}px or ${MAX_DURATION}ms; leaving takes two thirds of arriving; a loop turns at most once a second`, wcag: '—', level: 'AA', foundation: 'Motion' }, items));
    }
    // M4: curves have no jumps — every curve stays under the speed limit and rests where it should.
    {
      const items = [];
      for (const k of EASING_ORDER) {
        const c = r(`motion.easing.${k}`);
        const s = curveSpeeds(c);
        const want = EASING[k];
        const restOk = k === 'linear' || ((want.start === 0 ? s.start === 0 : true) && (want.end === 0 ? s.end === 0 : true));
        items.push({ token: `motion.easing.${k}`, item: `${k} cubic-bezier(${c.join(', ')}): starts at ${s.start.toFixed(2)}×, ends at ${s.end.toFixed(2)}×, fastest ${s.peak.toFixed(2)}× the average speed`, ok: s.peak <= PEAK_SPEED_MAX + 1e-6 && restOk });
      }
      const en = r('motion.easing.enter'), ex = r('motion.easing.exit');
      items.push({ item: 'exit is the entry played backwards', ok: ex.every((v, i) => Math.abs(v - [1 - en[2], 1 - en[3], 1 - en[0], 1 - en[1]][i]) < 1e-9) });
      for (const j of jobs.filter((x) => sys.tokens.has(`motion.${x.job}.distance`))) {
        const px = ms(`motion.${j.job}.distance`, 'full');
        for (const [part, ease] of j.kind === 'in-out' ? [['duration', 'easing'], ['exit-duration', 'exit-easing']] : [['duration', 'easing']]) {
          const f = framesOf(r(`motion.${j.job}.${ease}`, { Motion: 'full' }), ms(`motion.${j.job}.${part}`, 'full'));
          const big = Math.max(...f.map((x) => x.step)) * px;
          items.push({ token: `motion.${j.job}.${part}`, item: `${j.job}${part === 'duration' ? '' : ' leaving'}: ${f.length} frames at 60Hz, the largest step ${big.toFixed(1)}px of ${px}px`, ok: big <= px * Math.min(1, (PEAK_SPEED_MAX * FRAME_MS) / ms(`motion.${j.job}.${part}`, 'full')) + 0.05 });
        }
      }
      checks.push(result({ id: 'M4', title: `No jumps: every curve stays under ${PEAK_SPEED_MAX}× its average speed; arriving lands at rest, leaving starts from rest, changing in place does both`, wcag: '—', level: 'AA', foundation: 'Motion' }, items));
    }
    // M5: loops and highlights stay readable.
    {
      const items = [];
      const floor = pulseFloor(sys, contrast, composite);
      const dim = +(/@keyframes x-pulse \{ 50% \{ opacity: ([0-9.]+); \} \}/.exec(motionCss)?.[1] ?? NaN);
      items.push({ item: `the reduced loading pulse dims to ${dim} — the lowest that keeps color.fg.icon ≥ ${INDICATOR_MIN}:1 on every surface is ${floor}`, ok: dim >= floor && dim < 1 });
      for (const m of COLOR_MODES) for (const fg of ['color.fg.default', 'color.fg.muted']) {
        const bg = opaque(r('color.bg.brand-subtle', { Color: m }));
        const c = contrast(opaque(r(fg, { Color: m })), bg);
        items.push({ mode: m, item: `${m} · ${fg} on the highlight tint (color.bg.brand-subtle): ${c.toFixed(2)}:1`, ratio: +c.toFixed(2), ok: c >= 4.5 });
      }
      checks.push(result({ id: 'M5', title: `Loops and highlights stay readable: the loading indicator never pulses below ${INDICATOR_MIN}:1; text stays ≥ 4.5:1 on the highlight tint`, wcag: '1.4.11, 1.4.3', level: 'AA', foundation: 'Motion' }, items));
    }
    // M6: tokens.css opens and closes the elevation levels with the motion jobs, and nothing else.
    {
      const items = [];
      const has = (re) => re.test(motionCss);
      items.push({ item: 'popovers (.x-floating[popover]) fade and move in with motion.floating and out with its exit', ok: has(/\.x-floating\[popover\] \{[^}]*transition-duration: var\(--x-motion-floating-exit-duration\)/) && has(/\.x-floating\[popover\]:popover-open \{[^}]*transition-duration: var\(--x-motion-floating-duration\)/) && has(/@starting-style \{\s*\.x-floating\[popover\]:popover-open/) });
      items.push({ item: 'toasts (data-layer="toast") come from the edge they sit on', ok: has(/\.x-floating\[popover\]\[data-layer="toast"\] \{ translate: 0 var\(--x-motion-floating-distance\); \}/) });
      items.push({ item: 'dialogs (dialog.x-modal) rise in with motion.modal, their scrim fades with them, and both leave with its exit', ok: has(/dialog\.x-modal \{[^}]*transition-duration: var\(--x-motion-modal-exit-duration\)/) && has(/dialog\.x-modal\[open\] \{[^}]*transition-duration: var\(--x-motion-modal-duration\)/) && has(/dialog\.x-modal::backdrop \{[^}]*opacity: 0/) && has(/@starting-style \{\s*dialog\.x-modal\[open\]::backdrop/) });
      items.push({ item: 'the navigation drawer comes in from its own side with motion.floating (flipped right to left)', ok: /data-shell="nav"\]\[data-open\] \{ transition-duration: var\(--x-motion-floating-duration\)/.test(css) && /:dir\(rtl\)/.test(css) });
      items.push({ item: 'exits keep the element shown and in the top layer until they end (display and overlay transition with allow-discrete)', ok: (motionCss.match(/transition-behavior: allow-discrete/g) ?? []).length >= 3 && /overlay/.test(motionCss) });
      const raw = [...motionCss.matchAll(/(transition|animation)[a-z-]*: ([^;]+);/g)].map((m) => m[2]).filter((v) => /\b\d+(\.\d+)?m?s\b|cubic-bezier|\bease(-in|-out|-in-out)?\b|\blinear\b/.test(v));
      items.push({ item: `every duration and curve in the motion section is a motion token${raw.length ? ` — raw: ${raw.join(' | ')}` : ''}`, ok: !raw.length });
      items.push({ item: 'focus rings appear at once: no transition on :focus-visible, outline in no transition list', ok: !/:focus-visible \{[^}]*transition/.test(css) && ![...css.matchAll(/transition(-property)?: ([^;]+);/g)].some((m) => /\boutline/.test(m[2])) });
      checks.push(result({ id: 'M6', title: 'Ready transitions: menus, popovers, toasts, the drawer and dialogs open and close with their motion jobs in tokens.css — tokens only, focus rings never animated', wcag: '2.3.3, 2.4.7', level: 'AA', foundation: 'Motion' }, items));
    }
  }

  // ---- Structure: aliases and links ----
  {
    const problems = sys.validateAliases().map((p) => ({ item: p, ok: false }));
    const mustLink = [
      ['layout.gutter', 'space.'], ['layout.margin', 'space.'], ['focus.ring.color', 'color.border.focus'],
      ...ELEVATION_JOB_ORDER.filter((j) => ELEVATION_JOBS[j].surface).map((j) => [`elevation.${j}.surface`, 'color.bg.']),
      ...ELEVATION_JOB_ORDER.filter((j) => ELEVATION_JOBS[j].edge !== 'none' && sys.tokens.has(`elevation.${j}.border`)).map((j) => [`elevation.${j}.border`, 'color.border.']),
      ...sys.byPrefix('motion.').filter((t) => t.path.endsWith('.distance')).map((t) => [t.path, 'space.']),
    ];
    const links = mustLink.map(([p, prefix]) => {
      const vals = Object.values(sys.get(p).values);
      const ok = vals.every((v) => isAlias(v) && aliasTarget(v).startsWith(prefix));
      return { item: `${p} → ${prefix}*`, ok };
    });
    for (const t of sys.byPrefix('elevation.').filter((x) => x.type === 'shadow')) {
      const ok = Object.values(t.values).every((v) => isAlias(v.color) && aliasTarget(v.color).startsWith('color.shadow.'));
      links.push({ item: `${t.path}.color → color.shadow.*`, ok });
    }
    const semanticRaw = [...sys.tokens.values()]
      .filter((t) => ['Color', 'Density', 'Motion', 'Border', 'Elevation'].includes(t.collection))
      .filter((t) => !t.meta.layer) // layer.* numbers are positions computed here, not copies of another foundation
      .filter((t) => Object.values(t.values).some((v) => !isAlias(v) && typeof v !== 'object'))
      .map((t) => ({ item: `${t.path} holds a raw value (should alias a primitive)`, ok: false }));
    checks.push(result({ id: 'X1', title: 'Every alias resolves; foundations are linked, not copied', wcag: '—', level: 'AA', foundation: 'System' }, [...problems, ...links, ...semanticRaw]));
  }

  const blocking = checks.filter((c) => c.status === 'fail' && ['A', 'AA'].includes(c.level));
  return { checks, ok: blocking.length === 0, blocking: blocking.map((c) => c.id) };
}
