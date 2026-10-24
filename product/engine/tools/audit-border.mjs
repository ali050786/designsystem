#!/usr/bin/env node
// Border audit: opens an HTML page in a real browser and measures the lines people get — in normal colours and in forced
// colours (Windows contrast themes, emulated by Chromium with its real forced-colour rendering).
// Normal colours, at 1280 and 320px: border widths that don't follow the product's control width (hard-coded),
// widths that grow with text (200% text), control edges under 3:1 against what is behind them (WCAG 1.4.11), doubled
// seams between parts that touch, state changes (aria-selected, -pressed, -current, -checked, -invalid) that move the
// content or show only by colour (1.4.1), lines drawn with box-shadow. Forced colours: controls that lose their edge,
// focus rings that disappear (2.4.7) and states that stop showing. Every focus ring is found by comparing the pixels
// around the element with and without focus, so rings drawn any way are judged by what is on screen.
//
// Needs Playwright:  npm i -D playwright   (uses the Chromium that Playwright installs, or CHROMIUM_PATH)
// Usage: node tools/audit-border.mjs page.html [--shots out-dir] [--prefix ds] [--json]
// Exit code 1 when anything fails (warnings don't fail).
import path from 'node:path';
import fs from 'node:fs';

// Opening and closing animate now (Motion foundation): wait for every finite animation to end before measuring (at most 2 seconds).
const settle = (p) => p.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 2000))]));
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const page = args.find((a, i) => !a.startsWith('--') && !['--shots', '--prefix'].includes(args[i - 1]));
const shots = opt('--shots');
const prefix = opt('--prefix') ?? 'ds';
const asJson = args.includes('--json');
if (!page) { console.error('Usage: node tools/audit-border.mjs page.html [--shots dir] [--prefix ds] [--json]'); process.exit(2); }

let chromium;
try { ({ chromium } = createRequire(path.join(process.cwd(), 'x.js'))('playwright')); } catch {
  try { ({ chromium } = await import('playwright')); } catch { console.error('Playwright is not installed. Run: npm i -D playwright'); process.exit(2); }
}

// ---------- runs inside the page ----------
function shared({ pre }) {
  window.__bq = window.__bq || {};
  const R = window.__bq;
  R.pre = pre;
  R.name = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.'); const t = (el.getAttribute('aria-label') || el.value || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24); return t ? `${s} "${t}"` : s; };
  R.shown = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0 && !el.closest('[hidden], [inert]'); };
  R.rgba = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c ?? ''); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  R.lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  R.ratio = (a, b) => { const x = R.lum(a), y = R.lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  R.over = (fg, bg) => { const a = fg[3]; return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)); };
  /** The colour behind an element: the nearest ancestor with a fill (flattened over the ones behind it). */
  R.behind = (el) => {
    const stack = [];
    for (let a = el.parentElement; a; a = a.parentElement) { const c = R.rgba(getComputedStyle(a).backgroundColor); if (c && c[3] > 0) { stack.push(c); if (c[3] >= 0.99) break; } }
    let col = [255, 255, 255];
    for (const c of stack.reverse()) col = R.over(c, col);
    return col;
  };
  R.sides = (cs) => ['Top', 'Right', 'Bottom', 'Left'].map((s) => ({ w: cs[`border${s}Style`] === 'none' || cs[`border${s}Style`] === 'hidden' ? 0 : parseFloat(cs[`border${s}Width`]) || 0, c: cs[`border${s}Color`] }));
  R.visibleSides = (cs) => R.sides(cs).map((s) => (s.w > 0 && (R.rgba(s.c)?.[3] ?? 0) > 0.05 ? s.w : 0));
  const FIELD = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]):not([type=file]), select, textarea, [role=textbox], [role=combobox], [role=spinbutton], [role=switch], [role=checkbox]:not(input), [role=radio]:not(input), [role=slider]:not(input)';
  R.controls = () => {
    const out = [];
    for (const el of document.querySelectorAll(`${FIELD}, input[type=checkbox], input[type=radio], button, [role=button], input[type=submit], input[type=button], input[type=reset]`)) {
      if (!R.shown(el) || el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
      const cs = getComputedStyle(el);
      const native = (el.type === 'checkbox' || el.type === 'radio') && cs.appearance !== 'none';
      if (native) continue; // drawn by the browser, which handles forced colours itself
      const kind = el.matches(FIELD) || el.type === 'checkbox' || el.type === 'radio' ? 'field' : 'button';
      out.push({ el, kind });
    }
    return out;
  };
  R.stateEls = () => [...document.querySelectorAll('[aria-selected="true"], [aria-pressed="true"], [aria-current]:not([aria-current="false"]), [aria-checked="true"]:not(input), [aria-invalid="true"]')].filter((el) => R.shown(el));
  // Choices drawn around a hidden checked radio or checkbox (a segmented control, a choice card): the label shows the state.
  R.hiddenChecked = () => [...document.querySelectorAll('input[type=radio]:checked, input[type=checkbox]:checked')].filter((i) => { const cs = getComputedStyle(i); const r = i.getBoundingClientRect(); return (+cs.opacity < 0.05 || r.width < 2 || r.height < 2 || cs.clipPath !== 'none') && i.closest('label') && R.shown(i.closest('label')); }).map((i) => ({ input: i, el: i.closest('label') }));
  R.firstText = (el) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) if (n.data.trim()) { const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getClientRects()[0]; if (r) return { l: r.left, t: r.top }; } return null; };
    // A shape signature: what changes besides colour.
  R.signature = (el) => {
    const cs = getComputedStyle(el), sig = [R.sides(cs).map((s) => s.w).join(','), cs.outlineStyle === 'none' ? 0 : cs.outlineWidth, cs.fontWeight, cs.textDecorationLine, el.innerText];
    for (const pe of ['::before', '::after']) { const p = getComputedStyle(el, pe); sig.push(p.content === 'none' ? '' : `${p.content}|${p.display}|${p.width}|${p.height}|${['Top', 'Right', 'Bottom', 'Left'].map((s) => p[`border${s}Width`]).join(',')}`); }
    for (const k of el.querySelectorAll('*')) { const r = k.getBoundingClientRect(); sig.push(R.shown(k) ? `${k.tagName}${Math.round(r.width)}x${Math.round(r.height)}` : '-'); }
    return sig.join('§');
  };

  return true;
}

/** Widths per element: the computed border width of every side, by element index. */
function widths() {
  const R = window.__bq;
  // Indexed over every element (shown or not), so two renders of the same page line up.
  return [...document.body.querySelectorAll('*')].map((el, i) => ({ i, name: R.name(el), shown: R.shown(el), w: R.visibleSides(getComputedStyle(el)) })).filter((x) => x.shown);
}

/** Controls that don't follow the product's control width: redefine it and see who changes. */
function followsControl({ pre }) {
  const R = window.__bq;
  const ctrls = R.controls().filter(({ el }) => R.visibleSides(getComputedStyle(el)).some((w) => w > 0) || /transparent/.test(getComputedStyle(el).borderTopColor) || getComputedStyle(el).borderTopWidth !== '0px');
  const before = ctrls.map(({ el }) => R.sides(getComputedStyle(el)).map((s) => s.w));
  const root = document.documentElement;
  const cur = parseFloat(getComputedStyle(root).getPropertyValue(`--${pre}-border-width-control`)) || 1;
  root.style.setProperty(`--${pre}-border-width-control`, `${cur + 1}px`);
  root.style.setProperty(`--${pre}-border-width-state`, `${cur + 2}px`);
  const after = ctrls.map(({ el }) => R.sides(getComputedStyle(el)).map((s) => s.w));
  root.style.removeProperty(`--${pre}-border-width-control`); root.style.removeProperty(`--${pre}-border-width-state`);
  const out = [];
  ctrls.forEach(({ el }, i) => { const b = before[i], a = after[i]; const drawn = b.some((x) => x > 0); if (drawn && b.every((x, k) => x === 0 || a[k] === x)) out.push({ el: R.name(el), w: Math.max(...b) }); });
  return out;
}

/** Control edges against what is behind them; lines drawn with box-shadow; doubled seams. */
function lines() {
  const R = window.__bq;
  const edge = [], shadow = [], seams = [];
  for (const { el, kind } of R.controls()) {
    const cs = getComputedStyle(el), back = R.behind(el);
    const fill = R.rgba(cs.backgroundColor);
    const own = fill && fill[3] > 0 ? R.over(fill, back) : back;
    if (R.ratio(own, back) >= 3) continue; // its fill identifies it
    const vis = R.sides(cs).filter((s) => s.w > 0 && (R.rgba(s.c)?.[3] ?? 0) > 0.05);
    if (!vis.length) { if (kind === 'field') edge.push({ el: R.name(el), ratio: null }); continue; }
    const worst = Math.min(...vis.map((s) => R.ratio(R.over(R.rgba(s.c), back), back)));
    if (worst < 3 && !(kind === 'button' && el.matches('[class*="ghost"], [data-variant="ghost"]'))) edge.push({ el: R.name(el), ratio: +worst.toFixed(2), kind });
  }
  for (const el of document.body.querySelectorAll('*')) {
    if (!R.shown(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.boxShadow === 'none' || el.matches(':focus')) continue;
    const layers = cs.boxShadow.split(/,(?![^(]*\))/);
    const line = layers.some((x) => { const n = x.replace(/rgba?\([^)]*\)|inset/g, ' ').trim().split(/\s+/).map(parseFloat); if (n.length < 3 || n.some(Number.isNaN)) return false; const [x0, y0, blur = 0, spread = 0] = n; return blur === 0 && (spread > 0 || (Math.abs(x0) <= 4 && Math.abs(y0) <= 4 && (x0 !== 0 || y0 !== 0))); });
    if (line && !R.visibleSides(cs).some((w) => w > 0)) shadow.push({ el: R.name(el) });
  }
  // Doubled seams: neighbours that touch, each with a visible border on the side they share.
  for (const P of document.body.querySelectorAll('*')) {
    if (getComputedStyle(P).display === 'table-row' || P.tagName === 'TR' || P.tagName === 'TBODY' || P.tagName === 'THEAD') continue;
    const kids = [...P.children].filter((k) => R.shown(k) && getComputedStyle(k).position !== 'absolute' && getComputedStyle(k).position !== 'fixed');
    for (let i = 1; i < kids.length; i++) {
      const a = kids[i - 1], b = kids[i], ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const A = R.visibleSides(getComputedStyle(a)), B = R.visibleSides(getComputedStyle(b));
      const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top), ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const rtl = getComputedStyle(P).direction === 'rtl';
      if (oy > Math.min(ra.height, rb.height) / 2) {
        const [l, r] = rtl ? [rb, ra] : [ra, rb], [Lw, Rw] = rtl ? [B[1], A[3]] : [A[1], B[3]];
        if (Math.abs(r.left - l.right) <= 0.5 && Lw > 0 && Rw > 0) seams.push({ a: R.name(a), b: R.name(b), w: Lw + Rw });
      } else if (ox > Math.min(ra.width, rb.width) / 2 && Math.abs(rb.top - ra.bottom) <= 0.5 && A[2] > 0 && B[0] > 0) seams.push({ a: R.name(a), b: R.name(b), w: A[2] + B[0] });
    }
  }
  return { edge, shadow, seams };
}

/** State changes: does the content move, and does anything besides colour change? */
function stateChanges() {
  const R = window.__bq;
  const out = [];
  for (const el of R.stateEls()) {
    const attr = ['aria-invalid', 'aria-selected', 'aria-pressed', 'aria-checked', 'aria-current'].find((a) => el.hasAttribute(a) && el.getAttribute(a) !== 'false');
    const was = el.getAttribute(attr);
    const t0 = R.firstText(el), r0 = el.getBoundingClientRect(), s0 = R.signature(el), b0 = R.sides(getComputedStyle(el)).map((x) => x.w).join();
    el.setAttribute(attr, 'false');
    const t1 = R.firstText(el), r1 = el.getBoundingClientRect(), s1 = R.signature(el), b1 = R.sides(getComputedStyle(el)).map((x) => x.w).join();
    el.setAttribute(attr, was);
    const moved = t0 && t1 ? Math.max(Math.abs(t0.l - t1.l), Math.abs(t0.t - t1.t)) : 0;
    const grew = Math.max(Math.abs(r0.width - r1.width), Math.abs(r0.height - r1.height));
    out.push({ el: R.name(el), attr: `${attr}="${was}"`, moved: +moved.toFixed(1), grew: +grew.toFixed(1), colourOnly: s0 === s1, border: b0 !== b1 });
  }
  for (const { input, el } of R.hiddenChecked()) {
    const t0 = R.firstText(el), r0 = el.getBoundingClientRect(), s0 = R.signature(el), b0 = R.sides(getComputedStyle(el)).map((x) => x.w).join();
    input.checked = false;
    const t1 = R.firstText(el), r1 = el.getBoundingClientRect(), s1 = R.signature(el), b1 = R.sides(getComputedStyle(el)).map((x) => x.w).join();
    input.checked = true;
    const moved = t0 && t1 ? Math.max(Math.abs(t0.l - t1.l), Math.abs(t0.t - t1.t)) : 0;
    out.push({ el: R.name(el), attr: ':checked', moved: +moved.toFixed(1), grew: +Math.max(Math.abs(r0.width - r1.width), Math.abs(r0.height - r1.height)).toFixed(1), colourOnly: s0 === s1, border: b0 !== b1 });
  }
  return out;
}

/** Rectangles to compare with and without a state (forced colours), by element. */
function stateRects() {
  const R = window.__bq;
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  const a = R.stateEls().map((el, i) => { el.dataset.bqS = String(i); return { i, name: R.name(el), attr: ['aria-invalid', 'aria-selected', 'aria-pressed', 'aria-checked', 'aria-current'].find((x) => el.hasAttribute(x) && el.getAttribute(x) !== 'false'), r: rect(el) }; });
  const b = R.hiddenChecked().map(({ input, el }, k) => { const i = a.length + k; input.dataset.bqS = String(i); return { i, name: R.name(el), attr: ':checked', r: rect(el) }; });
  return [...a, ...b];
}
function toggleState({ i, attr, on, was }) { const el = document.querySelector(`[data-bq-s="${i}"]`); if (!el) return; if (attr === ':checked') el.checked = on; else el.setAttribute(attr, on ? was : 'false'); }

function controlRects() {
  const R = window.__bq;
  return R.controls().map(({ el, kind }) => { const r = el.getBoundingClientRect(); return { name: R.name(el), kind, r: { l: r.left, t: r.top, r: r.right, b: r.bottom } }; });
}

function focused() {
  const R = window.__bq, el = document.activeElement;
  if (!el || el === document.body || el.tagName === 'IFRAME') return null;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  if (!el.dataset.bqF) el.dataset.bqF = String(document.querySelectorAll('[data-bq-f]').length);
  // A field selects its text when tabbed into, and its caret blinks: neither is a ring, so both are switched off.
  if (/^(INPUT|TEXTAREA)$/.test(el.tagName)) { try { el.setSelectionRange(0, 0); } catch { /* not a text input */ } el.style.caretColor = 'transparent'; }
  return { id: el.dataset.bqF, name: R.name(el), r: { l: r.left, t: r.top, r: r.right, b: r.bottom }, bw: Math.max(...R.sides(getComputedStyle(el)).map((x) => x.w)), vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio };
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
  return { w, h, at: (x, y) => { const i = (Math.min(h - 1, Math.max(0, Math.floor(y))) * w + Math.min(w - 1, Math.max(0, Math.floor(x)))) * bpp; return [px[i], px[i + 1], px[i + 2]]; } };
}
const diff = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// ---------- drive the browser ----------
const url = /^https?:/.test(page) ? page : 'file://' + path.resolve(page);
const browser = await chromium.launch(process.env.CHROMIUM_PATH || fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' } : {});
const open = async (width, { height = 900, text = 100, forced = false, dpr = 1 } = {}) => {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, forcedColors: forced ? 'active' : 'none', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  if (text !== 100) {
    try { const cdp = await ctx.newCDPSession(p); await cdp.send('Page.setFontSizes', { fontSizes: { standard: 16 * text / 100, fixed: 13 * text / 100 } }); }
    catch { await p.addInitScript((t) => { document.documentElement.style.fontSize = `${t}%`; }, text); }
  }
  await p.goto(url);
  if (forced) await p.emulateMedia({ forcedColors: 'active' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(shared, { pre: prefix });
  await p.waitForTimeout(60);
  p.done = () => ctx.close();
  return p;
};
const shot = async (p, label) => {
  if (!shots) return;
  fs.mkdirSync(shots, { recursive: true });
  await p.screenshot({ path: path.join(shots, `${path.basename(page, '.html')}-${label}.png`), fullPage: true });
};
const result = { fails: [], warns: [], notes: [] };
const fail = (s) => result.fails.push(s), warn = (s) => result.warns.push(s);
const counts = {};

// Normal colours: widths, edges, seams, at two widths; widths at 200% text.
for (const w of [1280, 320]) {
  const p = await open(w);
  const tag = `normal    ${String(w).padEnd(9)}`;
  const base = await p.evaluate(widths);
  for (const x of await p.evaluate(followsControl, { pre: prefix })) fail(`${tag} width     ${x.el}: its ${x.w}px border doesn't follow the product's control width (border.control) — hard-coded? Use --${prefix}-border-width-control (BR-01)`);
  const L = await p.evaluate(lines);
  for (const x of L.edge) fail(`${tag} edge      ${x.el}: ${x.ratio === null ? 'no visible border and a fill like its background — nothing shows where it is' : `its border is ${x.ratio}:1 against what is behind it (needs 3:1)`} — WCAG 1.4.11; use border.width.control with color.border.input${x.kind === 'button' ? ' or color.action.secondary.border' : ''} (BR-07)`);
  for (const x of L.shadow) warn(`${tag} shadow    ${x.el}: a line drawn with box-shadow and no border — forced colours remove it (BR-06)`);
  for (const x of L.seams) fail(`${tag} seam      ${x.a} and ${x.b} touch with a border each: a ${x.w}px seam — use .${prefix}-join, which overlaps them to one line (BR-10)`);
  if (w === 1280) await shot(p, 'normal-1280');
  await p.done();
  // The same widths at 200% text: a width that grew is in rem or em.
  const big = await open(w, { text: 200 });
  const at2 = new Map((await big.evaluate(widths)).map((x) => [x.i, x.w]));
  await big.done();
  const grew = new Set();
  for (const x of base) { const y = at2.get(x.i); if (y && x.w.some((v, k) => v > 0 && Math.abs(y[k] - v) > 0.25) && !grew.has(x.name)) { grew.add(x.name); fail(`text200   ${String(w).padEnd(9)} grows     ${x.name}: border ${Math.max(...x.w)}px at 100% text, ${Math.max(...y)}px at 200% — a width in rem or em (BR-03)`); } }
  counts[`normal/${w}`] = { edges: L.edge.length, seams: L.seams.length, shadows: L.shadow.length };
}
// Hairlines are the checker's job: Chromium rounds borders under 1px up to 1px, so a rendered page can't show them.

// State changes: content that moves, states that show by colour alone.
{
  const p = await open(1280);
  const st = await p.evaluate(stateChanges);
  for (const x of st) {
    // Only a border that changes width is the border's business; bold text that re-centres is the type foundation's.
    if (x.border && x.moved > 0.5) fail(`normal    1280      moves     ${x.el} [${x.attr}]: its text moves ${x.moved}px when the state changes its border — take the extra border width off the padding (BR-09)`);
    else if (x.border && x.grew > 0.5) warn(`normal    1280      grows     ${x.el} [${x.attr}]: it changes size by ${x.grew}px with the state — neighbours move (BR-09)`);
    if (x.colourOnly) warn(`normal    1280      colour    ${x.el} [${x.attr}]: only colours change with the state — widen the border to its job, add a check mark, icon or bold text (WCAG 1.4.1; BR-08)`);
  }
  counts.states = st.length;
  await p.done();
}

// Forced colours: control edges, states, focus rings.
const ring = { normal: { stops: 0, missing: 0 }, forced: { stops: 0, missing: 0 } };
for (const mode of ['forced', 'normal']) for (const w of mode === 'forced' ? [1280, 320] : [1280]) {
  const forced = mode === 'forced';
  const p = await open(w, { forced, height: 800 });
  const tag = `${mode.padEnd(9)} ${String(w).padEnd(9)}`;
  if (forced) {
    if (w === 1280) await shot(p, 'forced-1280');
    // Control edges: the pixels on each edge against the pixels just outside.
    const ctrls = await p.evaluate(controlRects);
    const full = decodePng(await p.screenshot({ fullPage: false }));
    let lost = 0;
    for (const c of ctrls) {
      const { l, t, r, b } = c.r;
      if (b < 0 || t > 800 || r < 0 || l > w) continue;
      const cx = (l + r) / 2, cy = (t + b) / 2;
      const probes = [[cx, t + 0.5, cx, t - 3], [r - 0.5, cy, r + 3, cy], [cx, b - 0.5, cx, b + 3], [l + 0.5, cy, l - 3, cy]];
      const seen = probes.filter(([x, y, ox, oy]) => diff(full.at(x, y), full.at(ox, oy)) > 60).length;
      if (seen === 0) { lost++; (c.kind === 'field' ? fail : warn)(`${tag} edge      ${c.name}: no visible edge in forced colours — its fill is replaced and it has no border; add border: var(--${prefix}-border-width-control) solid transparent (BR-06)`); }
    }
    counts[`forced/${w}`] = { controls: ctrls.length, lost };
    // States: the element with and without its state must look different.
    if (w === 1280) {
      const sts = await p.evaluate(stateRects);
      let same = 0;
      for (const s of sts) {
        if (s.r.w < 2 || s.r.h < 2 || s.r.y < 0 || s.r.y + s.r.h > 800) continue;
        const clip = { x: Math.max(0, s.r.x - 4), y: Math.max(0, s.r.y - 4), width: Math.min(w - Math.max(0, s.r.x - 4), s.r.w + 8), height: s.r.h + 8 };
        const was = s.attr === ':checked' ? 'true' : await p.evaluate(({ i, attr }) => document.querySelector(`[data-bq-s="${i}"]`).getAttribute(attr), { i: s.i, attr: s.attr });
        const on = await p.screenshot({ clip });
        await p.evaluate(toggleState, { i: s.i, attr: s.attr, on: false, was });
        await p.waitForTimeout(20);
        await settle(p);
        const off = await p.screenshot({ clip });
        await p.evaluate(toggleState, { i: s.i, attr: s.attr, on: true, was });
        if (Buffer.compare(on, off) === 0) { same++; fail(`${tag} state     ${s.name} [${s.attr === ':checked' ? ':checked' : `${s.attr}="${was}"`}]: looks exactly the same with and without its state in forced colours — the state is shown by a fill or a colour only; use an attribute tokens.css knows (aria-selected, -current, -pressed, -checked) or widen the border (BR-06, BR-08)`); }
      }
      counts.forcedStates = { checked: sts.length, invisible: same };
    }
  }
  // Focus rings: tab through; compare the band around each element with and without focus.
  const seen = new Set();
  for (let i = 0; i < 150; i++) {
    await p.keyboard.press('Tab');
    const f = await p.evaluate(focused);
    if (!f) continue;
    if (seen.has(f.id)) break;
    seen.add(f.id);
    ring[mode].stops++;
    const pad = 8;
    const clip = { x: Math.max(0, f.r.l - pad), y: Math.max(0, f.r.t - pad) };
    clip.width = Math.min(f.vw, f.r.r + pad) - clip.x; clip.height = Math.min(f.vh, f.r.b + pad) - clip.y;
    if (clip.width < 4 || clip.height < 4 || f.r.b < 0 || f.r.t > f.vh) continue;
    const withFocus = decodePng(await p.screenshot({ clip }));
    await p.evaluate(() => { const el = document.activeElement; el.dataset.bqBlur = '1'; el.blur(); });
    const without = decodePng(await p.screenshot({ clip }));
    await p.evaluate(() => { const el = document.querySelector('[data-bq-blur]'); delete el.dataset.bqBlur; el.focus({ preventScroll: true }); });
    // Count changed pixels in the band around the element (outside it, up to the pad) and on its edge.
    let changed = 0, total = 0;
    for (let y = 0; y < withFocus.h; y++) for (let x = 0; x < withFocus.w; x++) {
      const px = clip.x + x / f.dpr, py = clip.y + y / f.dpr;
      const inside = px > f.r.l + 3 && px < f.r.r - 3 && py > f.r.t + 3 && py < f.r.b - 3;
      if (inside) continue;
      // The element's own border doesn't count: a border that changes colour on focus is not a ring (forced colours
      // recolour a focused field's border by themselves).
      const inBox = px >= f.r.l && px < f.r.r && py >= f.r.t && py < f.r.b;
      const edge = Math.min(px - f.r.l, f.r.r - px, py - f.r.t, f.r.b - py);
      if (inBox && edge < f.bw + 0.5) continue;
      total++;
      if (diff(withFocus.at(x, y), without.at(x, y)) > 40) changed++;
    }
    if (changed < Math.max(6, total * 0.02)) { ring[mode].missing++; fail(`${tag} focus     ${f.name}: no focus ring ${forced ? 'in forced colours — a box-shadow ring or outline: none? ' : ''}(WCAG 2.4.7; BR-05)`); }
  }
  await p.done();
}
await browser.close();

for (const [k, v] of Object.entries(counts)) result.notes.push(`${k.padEnd(14)} ${typeof v === 'object' ? Object.entries(v).map(([a, b]) => `${b} ${a}`).join(', ') : `${v} state elements`}`);
for (const [m, v] of Object.entries(ring)) result.notes.push(`focus ${m.padEnd(8)} ${v.stops} tab stops, ${v.missing} without a ring`);

function merge(list) {
  const groups = new Map();
  for (const line of list) {
    const m = /^(\S+)\s+(\S+)\s+(\S+)\s+(.*)$/.exec(line);
    if (!m) { groups.set(line, { text: line, runs: [] }); continue; }
    const [, a, b, kind, rest] = m;
    const key = `${kind} ${rest.replace(/\d+(\.\d+)?(px|:1)/g, '#')}`;
    if (!groups.has(key)) groups.set(key, { kind, rest, runs: [] });
    groups.get(key).runs.push([a, b]);
  }
  return [...groups.values()].map((g) => {
    if (!g.runs.length) return g.text;
    const as = [...new Set(g.runs.map((r) => r[0]))], bs = [...new Set(g.runs.map((r) => r[1]))];
    return `${g.kind.padEnd(9)} ${g.rest}${g.runs.length > 1 ? ' (numbers from the first)' : ''}  [${as.join(', ')}; ${bs.join(', ')}]`;
  });
}
if (asJson) console.log(JSON.stringify({ ...result, counts, ring }, null, 2));
else {
  for (const n of result.notes) console.log(n);
  for (const f of merge(result.fails)) console.log('✕ ' + f);
  for (const w of merge(result.warns)) console.log('! ' + w);
}
process.exit(result.fails.length ? 1 : 0);
