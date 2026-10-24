#!/usr/bin/env node
// Radius audit: opens an HTML page in a real browser and measures the corners people get. In every radius style
// (data-radius sharp, default, round), at 1280 and 320px and at 200% text (the browser's text-size setting) it checks
// radii that ignore the style (hard-coded), nested corners (inner = outer − padding; a corner that pokes out of its
// parent), text that runs outside its rounded shape (WCAG 1.4.3: off the fill its contrast was measured on), joined
// groups with rounded seams in both text directions, and — tabbing through the page — every focus ring sampled on all
// four sides (clipped by a rounded container, covered by a neighbour; WCAG 2.4.7), rings drawn on their own layer that
// don't follow the shape, and radii that change on focus. Complements the radius checker (which reads source code).
//
// Needs Playwright:  npm i -D playwright   (uses the Chromium that Playwright installs, or CHROMIUM_PATH)
// Usage: node tools/audit-radius.mjs page.html [--shots out-dir] [--prefix ds] [--json]
// Exit code 1 when anything fails (warnings don't fail).
import path from 'node:path';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const page = args.find((a, i) => !a.startsWith('--') && !['--shots', '--prefix'].includes(args[i - 1]));
const shots = opt('--shots');
const prefix = opt('--prefix') ?? 'ds';
const asJson = args.includes('--json');
if (!page) { console.error('Usage: node tools/audit-radius.mjs page.html [--shots dir] [--prefix ds] [--json]'); process.exit(2); }

let chromium;
try { ({ chromium } = createRequire(path.join(process.cwd(), 'x.js'))('playwright')); } catch {
  try { ({ chromium } = await import('playwright')); } catch { console.error('Playwright is not installed. Run: npm i -D playwright'); process.exit(2); }
}

const STYLES = ['sharp', 'default', 'round'];
const TOL = 1.5; // px: what a corner may be off by before it shows

// ---------- runs inside the page ----------
function shared() {
  window.__rq = window.__rq || {};
  const R = window.__rq;
  R.name = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.'); const t = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24); return t ? `${s} "${t}"` : s; };
  R.shown = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0; };
  R.alpha = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return 0; const p = m[1].split(/[,\s/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; };
  R.fill = (cs) => R.alpha(cs.backgroundColor) > 0.05 || cs.backgroundImage !== 'none';
  R.box = (cs) => R.fill(cs) || ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none' && R.alpha(cs[`border${s}Color`]) > 0.05) || (cs.boxShadow !== 'none' && !/inset/.test(cs.boxShadow));
  R.radii = (cs) => ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'].map((k) => parseFloat(cs[k]) || 0);
  // CSS scales radii down when adjacent ones add up to more than a side: the radius actually drawn.
  R.drawn = (el, cs = getComputedStyle(el)) => {
    const r = el.getBoundingClientRect(), [tl, tr, br, bl] = R.radii(cs);
    const f = Math.min(1, r.width / (tl + tr || 1), r.width / (bl + br || 1), r.height / (tl + bl || 1), r.height / (tr + br || 1));
    return [tl, tr, br, bl].map((x) => x * f);
  };
  return true;
}

/** Every element's radius per corner, in each style: radii that never change ignore the style. */
function styleScan({ styles }) {
  const R = window.__rq;
  // Elements inside a region with its own data-radius (a preview) are meant to keep their style.
  const els = [...document.body.querySelectorAll('*')].filter((el) => R.shown(el) && R.box(getComputedStyle(el)) && !el.closest('body [data-radius]'));
  const per = els.map(() => []);
  for (const s of styles) {
    document.documentElement.setAttribute('data-radius', s);
    els.forEach((el, i) => { per[i].push(R.drawn(el)); });
  }
  document.documentElement.removeAttribute('data-radius');
  const out = [];
  els.forEach((el, i) => {
    const r = el.getBoundingClientRect(), half = Math.min(r.width, r.height) / 2;
    for (let c = 0; c < 4; c++) {
      const v = per[i].map((x) => x[c]);
      if (v.every((x) => x === 0) || v.some((x) => x >= half - 0.5)) continue; // square, or round ends (a pill)
      if (Math.max(...v) - Math.min(...v) < 0.5) { out.push({ el: R.name(el), px: +v[0].toFixed(1) }); break; }
    }
  });
  return out;
}

/** Nested corners, text outside its shape, joined groups. */
function geometry({ TOL }) {
  const R = window.__rq;
  const nested = [], poke = [], text = [], seams = [];
  const all = [...document.body.querySelectorAll('*')].filter((el) => R.shown(el));
  const boxed = new Set(all.filter((el) => R.box(getComputedStyle(el))));
  const parentBox = (el) => { for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) if (boxed.has(n)) return n; return null; };
  const clips = (el) => /hidden|clip|auto|scroll/.test(getComputedStyle(el).overflow); // scroll containers clip to their rounded padding box too
  const inside = (r, dx, dy) => dx >= r || dy >= r || Math.hypot(r - dx, r - dy) <= r + 0.01;
  const by = (r, dx, dy) => (dx >= r || dy >= r ? 0 : Math.hypot(r - dx, r - dy) - r); // > 0: outside by that much
  for (const el of boxed) {
    const A = parentBox(el);
    if (!A) continue;
    const acs = getComputedStyle(A), ar = A.getBoundingClientRect(), er = el.getBoundingClientRect();
    const bw = [acs.borderTopWidth, acs.borderRightWidth, acs.borderBottomWidth, acs.borderLeftWidth].map(parseFloat);
    const outer = R.drawn(A, acs), mine = R.drawn(el);
    const inner = { t: ar.top + bw[0], r: ar.right - bw[1], b: ar.bottom - bw[2], l: ar.left + bw[3] };
    // corners: tl, tr, br, bl — distance of el's edges from A's inner edges at that corner
    const d = [[er.left - inner.l, er.top - inner.t], [inner.r - er.right, er.top - inner.t], [inner.r - er.right, inner.b - er.bottom], [er.left - inner.l, inner.b - er.bottom]];
    // Nested corners are for a shape that fills its parent (edge to edge inside the padding on one axis): a panel, a
    // header, a menu item, a segment — not a button that happens to sit near a corner.
    const fills = Math.abs((er.left - inner.l) - (inner.r - er.right)) <= 1.5 || Math.abs((er.top - inner.t) - (inner.b - er.bottom)) <= 1.5;
    for (let c = 0; c < 4; c++) {
      const Ro = Math.max(0, outer[c] - Math.max(bw[c], bw[(c + 3) % 4])); // the padding edge's curve
      const [dx, dy] = d[c];
      if (Ro < 2 || dx < -0.5 || dy < -0.5 || dx >= Ro || dy >= Ro) continue; // no curve, outside, or clear of the curve
      // Only what el draws at this corner can poke out: a fill, a shadow, or a border on one of the two sides that meet
      // there. A row with only a top divider draws nothing at its bottom corners.
      const ecs = getComputedStyle(el), side = (s) => parseFloat(ecs[`border${s}Width`]) > 0 && ecs[`border${s}Style`] !== 'none' && R.alpha(ecs[`border${s}Color`]) > 0.05;
      const meet = [['Top', 'Left'], ['Top', 'Right'], ['Bottom', 'Right'], ['Bottom', 'Left']][c];
      if (!R.fill(ecs) && !(ecs.boxShadow !== 'none' && !/inset/.test(ecs.boxShadow)) && !meet.some(side)) continue;
      const r = mine[c];
      // The point of el's corner nearest A's corner, along the diagonal.
      const px = dx + r - r / Math.SQRT2, py = dy + r - r / Math.SQRT2;
      const out = r > 0 ? by(Ro, px, py) : by(Ro, Math.max(dx, 0), Math.max(dy, 0));
      const corner = ['top-left', 'top-right', 'bottom-right', 'bottom-left'][c];
      if (out > 0.75 && !clips(A)) poke.push({ el: R.name(el), parent: R.name(A), corner, out: +out.toFixed(1), r: +r.toFixed(1), R: +Ro.toFixed(1), p: +Math.min(dx, dy).toFixed(1) });
      else if (Math.abs(dx - dy) <= 1 && !clips(A) && fills) {
        const want = Math.max(0, Ro - Math.min(dx, dy));
        if (Math.abs(r - want) > TOL) nested.push({ el: R.name(el), parent: R.name(A), corner, r: +r.toFixed(1), R: +Ro.toFixed(1), p: +Math.min(dx, dy).toFixed(1), want: +want.toFixed(1) });
      }
    }
  }
  // Text off its rounded fill: each line of text against the rounded shape of the nearest ancestor with a fill.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.data.trim() || !n.parentElement || !R.shown(n.parentElement)) continue;
    let F = null;
    for (let a = n.parentElement; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); if (R.fill(cs)) { F = a; break; } }
    if (!F) continue;
    const rad = R.drawn(F);
    if (rad.every((x) => x < 2)) continue;
    const fr = F.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(n.parentElement).fontSize);
    range.selectNodeContents(n);
    let worst = 0;
    for (const lr of range.getClientRects()) {
      if (!lr.width) continue;
      const v = Math.max(0, (lr.height - fs) / 2); // the glyphs sit in the font-size box, centred in the line
      const g = { l: lr.left, r: lr.right, t: lr.top + v, b: lr.bottom - v };
      const pts = [[g.l - fr.left, g.t - fr.top, rad[0]], [fr.right - g.r, g.t - fr.top, rad[1]], [fr.right - g.r, fr.bottom - g.b, rad[2]], [g.l - fr.left, fr.bottom - g.b, rad[3]]];
      for (const [dx, dy, r] of pts) if (!inside(r, dx, dy)) worst = Math.max(worst, by(r, dx, dy));
    }
    if (worst >= TOL) text.push({ el: R.name(F), text: n.data.replace(/\s+/g, ' ').trim().slice(0, 30), out: +worst.toFixed(1), lines: range.getClientRects().length });
  }
  // Joined groups: neighbours that touch keep square corners where they meet.
  const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
  for (const P of all) {
    const kids = [...P.children].filter((k) => boxed.has(k));
    for (let i = 1; i < kids.length; i++) {
      const a = kids[i - 1], b = kids[i], ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const A = R.drawn(a), B = R.drawn(b);
      const overlapY = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top), overlapX = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      let seam = null;
      if (overlapY > Math.min(ra.height, rb.height) / 2) {
        if (!rtl && Math.abs(rb.left - ra.right) <= 1.5) seam = [A[1], A[2], B[0], B[3]];
        if (rtl && Math.abs(ra.left - rb.right) <= 1.5) seam = [A[0], A[3], B[1], B[2]];
      } else if (overlapX > Math.min(ra.width, rb.width) / 2 && Math.abs(rb.top - ra.bottom) <= 1.5) seam = [A[3], A[2], B[0], B[1]];
      if (seam && Math.max(...seam) > 0.5) seams.push({ a: R.name(a), b: R.name(b), r: +Math.max(...seam).toFixed(1) });
    }
  }
  return { nested, poke, text, seams };
}

/** The focused element: its shape, its ring, and what could clip or cover the ring. */
function focusInfo() {
  const R = window.__rq;
  const el = document.activeElement;
  if (!el || el === document.body || el.tagName === 'IFRAME') return null; // in a frame, focus and its ring are in the frame's own page
  const cs = getComputedStyle(el), r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  if (!el.dataset.rqId) el.dataset.rqId = String(Object.keys(R.ids ??= {}).length), R.ids[el.dataset.rqId] = 1;
  const ow = cs.outlineStyle === 'none' ? 0 : parseFloat(cs.outlineWidth) || 0;
  let ring = null;
  if (ow > 0) ring = { kind: 'outline', color: cs.outlineColor, from: parseFloat(cs.outlineOffset) || 0, width: ow };
  else if (cs.boxShadow && cs.boxShadow !== 'none') {
    const sh = cs.boxShadow.split(/,(?![^(]*\))/).map((x) => x.trim()).filter((x) => !/inset/.test(x)).map((x) => { const c = /rgba?\([^)]*\)|#[0-9a-f]+/i.exec(x)?.[0]; const n = x.replace(/rgba?\([^)]*\)|#[0-9a-f]+/i, '').trim().split(/\s+/).map(parseFloat); return { c, blur: n[2] || 0, spread: n[3] || 0 }; }).filter((x) => x.blur === 0 && x.spread > 0).sort((a, b) => a.spread - b.spread);
    if (sh.length) { const o = sh.at(-1), prev = sh.length > 1 ? sh.at(-2).spread : 0; ring = { kind: 'box-shadow', color: o.c, from: prev, width: o.spread - prev }; }
  }
  // A ring drawn on a pseudo-element: is its radius the element's radius plus its distance from the element?
  let layer = null;
  for (const pe of ['::after', '::before']) {
    const ps = getComputedStyle(el, pe);
    if (ps.content === 'none' || ps.position !== 'absolute') continue;
    const drawn = (ps.outlineStyle !== 'none' && parseFloat(ps.outlineWidth) > 0) || (ps.borderTopStyle !== 'none' && parseFloat(ps.borderTopWidth) > 0) || ps.boxShadow !== 'none';
    if (!drawn) continue;
    const dist = -parseFloat(ps.top);
    if (!(dist > 0)) continue;
    const want = R.radii(cs)[0] + dist, got = parseFloat(ps.borderTopLeftRadius) || 0;
    layer = { pseudo: pe, dist, want: +want.toFixed(1), got: +got.toFixed(1) };
  }
  const clippers = [];
  for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
    const acs = getComputedStyle(a);
    if (/hidden|clip|auto|scroll/.test(acs.overflow + acs.overflowX + acs.overflowY)) { const ar = a.getBoundingClientRect(); clippers.push({ name: R.name(a), l: ar.left + parseFloat(acs.borderLeftWidth), t: ar.top + parseFloat(acs.borderTopWidth), r: ar.right - parseFloat(acs.borderRightWidth), b: ar.bottom - parseFloat(acs.borderBottomWidth), x: acs.overflowX, y: acs.overflowY }); }
  }
  // A link that wraps has a ring per line: the first line carries the top and start, the last the bottom and end.
  const frags = [...el.getClientRects()].filter((x) => x.width && x.height);
  const first = frags[0] ?? r, last = frags.at(-1) ?? r;
  return { id: el.dataset.rqId, name: R.name(el), rect: { l: r.left, t: r.top, r: r.right, b: r.bottom }, first: { l: first.left, t: first.top, r: first.right, b: first.bottom }, last: { l: last.left, t: last.top, r: last.right, b: last.bottom }, radius: R.radii(cs), ring, layer, clippers, dpr: devicePixelRatio, vw: innerWidth, vh: innerHeight };
}

/** What sits on top at a point, if it isn't the element or one of its ancestors. */
function coverAt({ x, y }) {
  const R = window.__rq, el = document.activeElement, top = document.elementFromPoint(x, y);
  if (!top || top === el || top.contains(el) || el.contains(top)) return null;
  let bar = null;
  for (let a = top; a && a !== document.body; a = a.parentElement) if (/sticky|fixed/.test(getComputedStyle(a).position)) { bar = a; break; }
  return bar ? `a sticky bar, ${R.name(bar)}` : R.name(top);
}

// ---------- PNG (Playwright screenshots) ----------
function decodePng(buf) {
  let pos = 8, w = 0, h = 0, type = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), kind = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (kind === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); type = data[9]; }
    if (kind === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const bpp = type === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = px.subarray(y * stride, (y + 1) * stride), up = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0, b = up ? up[i] : 0, c = up && i >= bpp ? up[i - bpp] : 0;
      const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
      row[i] = (src[i] + [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f]) & 255;
    }
  }
  return { w, h, at: (x, y) => { const i = (Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))) * bpp; return [px[i], px[i + 1], px[i + 2]]; } };
}
const rgb = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c ?? ''); return m ? m[1].split(/[,\s/]+/).filter(Boolean).slice(0, 3).map(Number) : null; };
const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 90;

// ---------- drive the browser ----------
const url = /^https?:/.test(page) ? page : 'file://' + path.resolve(page);
const browser = await chromium.launch(process.env.CHROMIUM_PATH || fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' } : {});
const open = async (width, { height = 900, text = 100, dir = null, style = null } = {}) => {
  const p = await browser.newPage({ viewport: { width, height } });
  if (text !== 100) {
    try { const cdp = await p.context().newCDPSession(p); await cdp.send('Page.setFontSizes', { fontSizes: { standard: 16 * text / 100, fixed: 13 * text / 100 } }); }
    catch { await p.addInitScript((t) => { document.documentElement.style.fontSize = `${t}%`; }, text); }
  }
  await p.goto(url);
  await p.evaluate(({ dir, style }) => { if (dir) document.documentElement.setAttribute('dir', dir); if (style) document.documentElement.setAttribute('data-radius', style); }, { dir, style });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(shared);
  await p.waitForTimeout(60);
  return p;
};
const shot = async (p, label) => {
  if (!shots) return;
  fs.mkdirSync(shots, { recursive: true });
  await p.screenshot({ path: path.join(shots, `${path.basename(page, '.html')}-${label}.png`), fullPage: true });
};
const result = { fails: [], warns: [], notes: [] };
const fail = (s) => result.fails.push(s), warn = (s) => result.warns.push(s);

// The product's style: the one :root has without data-radius.
let product = 'default';
{
  const p = await open(1280);
  product = await p.evaluate(({ pre, styles }) => {
    // A probe with the container role: the style whose radius matches :root's is the product's.
    const probe = document.body.appendChild(document.createElement('div'));
    probe.style.borderRadius = `var(--${pre}-shape-container)`;
    const px = () => getComputedStyle(probe).borderTopLeftRadius;
    const cur = px(), per = styles.map((s) => { document.documentElement.setAttribute('data-radius', s); return px(); });
    document.documentElement.removeAttribute('data-radius');
    probe.remove();
    const hits = styles.filter((s, i) => per[i] === cur);
    return new Set(per).size === styles.length && hits.length === 1 ? hits[0] : null;
  }, { pre: prefix, styles: STYLES }) ?? 'default';
  // Radii that ignore the style.
  for (const w of [1280, 320]) {
    if (w !== 1280) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(40); }
    const flat = await p.evaluate(styleScan, { styles: STYLES });
    for (const x of flat) fail(`all       ${String(w).padEnd(5)} style     ${x.el}: ${x.px}px in every radius style — hard-coded? Use a shape role (RR-01)`);
  }
  await p.close();
}

// Nested corners and text, per style, width and text size.
const counts = {};
for (const style of STYLES) for (const [w, text] of [[1280, 100], [320, 100], [1280, 200], [320, 200]]) {
  const p = await open(w, { text, style });
  const g = await p.evaluate(geometry, { TOL });
  if (style === product && text === 100) await shot(p, `${style}-${w}`);
  if (style === 'round' && w === 320 && text === 200) await shot(p, `round-320-text200`);
  await p.close();
  const tag = `${style.padEnd(9)} ${`${w}${text === 200 ? '/200%' : ''}`.padEnd(9)}`;
  counts[`${style}/${w}/${text}`] = { nested: g.nested.length, poke: g.poke.length, text: g.text.length };
  for (const x of g.poke) fail(`${tag} poke      ${x.el}: its ${x.corner} corner pokes ${x.out}px out of ${x.parent}'s rounded corner (radius ${x.r}px, ${x.p}px from the edge; parent ${x.R}px) — give it max(0px, parent − padding) (RR-05)`);
  for (const x of g.nested) warn(`${tag} nested    ${x.el} fills ${x.parent}: ${x.corner} corner ${x.r}px, but ${x.R} − ${x.p}px padding = ${x.want}px — the gap isn't even round the corner. If it is a part of the parent (a segment, an item, a panel) give it max(0px, parent − padding); a separate control can keep its role (RR-05)`);
  for (const x of g.text) (text === 200 ? fail : fail)(`${tag} text      "${x.text}" runs ${x.out}px outside the rounded corner of ${x.el}${x.lines > 1 ? ` (${x.lines} lines)` : ''} — off the fill its contrast was measured on (WCAG 1.4.3; RR-04: a pill's label must not wrap)`);
}

// Joined groups, left to right and right to left.
for (const dir of ['ltr', 'rtl']) for (const w of [1280, 320]) {
  const p = await open(w, { dir });
  const g = await p.evaluate(geometry, { TOL });
  if (dir === 'rtl' && w === 1280) await shot(p, 'rtl-1280');
  await p.close();
  for (const x of g.seams) fail(`${dir.padEnd(9)} ${String(w).padEnd(9)} seam      ${x.a} and ${x.b} touch, and the edge where they meet is rounded (${x.r}px)${dir === 'rtl' ? ' in right-to-left — physical corners?' : ''} — use .${prefix}-join or logical corners (RR-06)`);
}

// Focus rings: tab through, sample each ring on all four sides.
const focusRuns = [];
const radiusAtFocus = new Map();
for (const [label, w, style] of [['1280', 1280, product], ['320', 320, product], ['1280', 1280, 'round']]) {
  const p = await open(w, { style: style === product ? null : style, height: 800 });
  let stops = 0, rings = 0;
  const seen = new Set();
  for (let i = 0; i < 150; i++) {
    await p.keyboard.press('Tab');
    const f = await p.evaluate(focusInfo);
    if (!f) continue;
    if (seen.has(f.id)) break; // back at the start
    seen.add(f.id); stops++;
    if (style === product) radiusAtFocus.set(f.id, f.radius);
    const tag = `${style.padEnd(9)} ${label.padEnd(9)}`;
    if (f.layer && Math.abs(f.layer.got - f.layer.want) > TOL) fail(`${tag} ring      ${f.name}: the ring on ${f.layer.pseudo} sits ${f.layer.dist}px out with radius ${f.layer.got}px — it needs ${f.layer.want}px (the shape + its distance) to follow the corners; use shape.<role>-focus (RR-07)`);
    if (!f.ring) { if (!f.layer) warn(`${tag} ring      ${f.name}: no focus ring drawn as an outline or box-shadow (Border foundation; WCAG 2.4.7)`); continue; }
    const col = rgb(f.ring.color);
    if (!col) continue;
    rings++;
    const mid = f.ring.from + f.ring.width / 2, pad = f.ring.from + f.ring.width + 4;
    const clip = { x: Math.max(0, f.rect.l - pad), y: Math.max(0, f.rect.t - pad) };
    clip.width = Math.min(f.vw, f.rect.r + pad) - clip.x; clip.height = Math.min(f.vh, f.rect.b + pad) - clip.y;
    if (clip.width < 2 || clip.height < 2) continue;
    const img = decodePng(await p.screenshot({ clip }));
    const sx = (x) => Math.round((x - clip.x) * f.dpr), sy = (y) => Math.round((y - clip.y) * f.dpr);
    const cx = (f.rect.l + f.rect.r) / 2, cy = (f.rect.t + f.rect.b) / 2;
    const F = f.first, L = f.last, wrapped = F.t !== L.t;
    const sides = wrapped
      ? { top: [(F.l + F.r) / 2, F.t - mid], left: [F.l - mid, (F.t + F.b) / 2], bottom: [(L.l + L.r) / 2, L.b + mid], right: [L.r + mid, (L.t + L.b) / 2] }
      : { top: [cx, f.rect.t - mid], right: [f.rect.r + mid, cy], bottom: [cx, f.rect.b + mid], left: [f.rect.l - mid, cy] };
    const missing = [];
    let checked = 0;
    for (const [side, [x, y]] of Object.entries(sides)) {
      if (x < 0 || y < 0 || x > f.vw || y > f.vh) continue; // off screen: scrolled, not clipped
      checked++;
      const hit = [-1, 0, 1].some((k) => near(img.at(sx(x) + (side === 'left' || side === 'right' ? k : 0), sy(y) + (side === 'top' || side === 'bottom' ? k : 0)), col));
      if (hit) continue;
      const by = f.clippers.find((c) => (x < c.l && c.x !== 'visible') || (x > c.r && c.x !== 'visible') || (y < c.t && c.y !== 'visible') || (y > c.b && c.y !== 'visible'));
      missing.push({ side, cause: by ? `clipped by ${by.name}` : (await p.evaluate(coverAt, { x, y })) ? `covered by ${await p.evaluate(coverAt, { x, y })}` : 'not drawn there' });
    }
    if (!missing.length) continue;
    const where = missing.map((m) => `${m.side} (${m.cause})`).join(', ');
    const wcag = missing.length >= checked ? 'WCAG 2.4.7: no ring left' : 'WCAG 2.4.13 (AAA): part of the ring hidden';
    if (missing.every((m) => m.cause.includes('sticky bar'))) warn(`${tag} focus     ${f.name}: the focus ring is under ${where.replace(/covered by /g, '')} when it gets focus (WCAG 2.4.12, AAA) — the browser left it partly in view; keep the scroll padding ≥ the bar + focus.ring.offset + focus.ring.width`);
    else if (missing.some((m) => m.cause.startsWith('clipped'))) fail(`${tag} focus     ${f.name}: the focus ring is cut off on the ${where} — ${wcag}; remove the clipping and give flush children the nested radius (RR-08)`);
    else fail(`${tag} focus     ${f.name}: the focus ring is missing on the ${where} — ${wcag}; lift the focused part above its neighbours (.${prefix}-join does it)`);
  }
  // Radius on focus vs at rest.
  if (style === product) {
    const rest = await p.evaluate(() => { document.activeElement?.blur(); return Object.fromEntries([...document.querySelectorAll('[data-rq-id]')].map((el) => [el.dataset.rqId, window.__rq.radii(getComputedStyle(el))])); });
    const names = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-rq-id]')].map((el) => [el.dataset.rqId, window.__rq.name(el)])));
    for (const [id, r] of radiusAtFocus) if (rest[id] && r.some((x, i) => Math.abs(x - rest[id][i]) > 0.5)) fail(`${style.padEnd(9)} ${label.padEnd(9)} state     ${names[id]}: radius ${rest[id].join('/')}px at rest, ${r.join('/')}px with focus — corners don't change with state (RR-09)`);
  }
  await p.close();
  focusRuns.push({ label: `${style} ${label}`, stops, rings });
}
await browser.close();

result.notes.push(`product style: ${product}`);
for (const s of STYLES) result.notes.push(`${s.padEnd(8)} ${Object.entries(counts).filter(([k]) => k.startsWith(s + '/')).map(([k, v]) => `${k.split('/').slice(1).join('px/')}%: ${v.poke} poke, ${v.nested} nested, ${v.text} text`).join(' · ')}`);
for (const f of focusRuns) result.notes.push(`focus ${f.label.padEnd(14)} ${f.stops} tab stops, ${f.rings} rings sampled on four sides`);

function merge(list) {
  const groups = new Map();
  for (const line of list) {
    const m = /^(\S+)\s+(\S+)\s+(\S+)\s+(.*)$/.exec(line);
    if (!m) { groups.set(line, { text: line, runs: [] }); continue; }
    const [, a, b, kind, rest] = m;
    const key = `${kind} ${rest.replace(/\d+(\.\d+)?px/g, '#')}`;
    if (!groups.has(key)) groups.set(key, { kind, rest, runs: [] });
    groups.get(key).runs.push([a, b]);
  }
  return [...groups.values()].map((g) => {
    if (!g.runs.length) return g.text;
    const as = [...new Set(g.runs.map((r) => r[0]))], bs = [...new Set(g.runs.map((r) => r[1]))];
    return `${g.kind.padEnd(9)} ${g.rest}${g.runs.length > 1 ? ' (numbers from the first)' : ''}  [${as.join(', ')}; ${bs.join(', ')}]`;
  });
}
if (asJson) console.log(JSON.stringify({ ...result, focus: focusRuns, counts }, null, 2));
else {
  for (const n of result.notes) console.log(n);
  for (const f of merge(result.fails)) console.log('✕ ' + f);
  for (const w of merge(result.warns)) console.log('! ' + w);
}
process.exit(result.fails.length ? 1 : 0);
