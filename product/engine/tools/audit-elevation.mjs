#!/usr/bin/env node
// Elevation audit: opens an HTML page in a real browser and measures what sits on top of what — in Light, in Dark and in
// forced colours (Windows contrast themes, emulated by Chromium with its real forced-colour rendering), at 1280 and 320px.
// For everything that has height (a shadow, position sticky or fixed, an open popover or dialog): which level its shadow
// belongs to (a hand-made shadow belongs to none), the edge of floating, modal and dragging levels measured in pixels
// against what is really outside it (≥ the contract's edge minimum), the surface step over what is under it in Dark,
// how far its shadow shows, and z-index numbers that are not layers. Then the stacking: sticky bars, open menus and
// dialogs must be the topmost thing at their centre; every tab stop must not be hidden under a sticky or fixed bar
// (WCAG 2.4.11). Every popover the page can open (popovertarget) and every --open selector is opened: a popover must be
// in the top layer and on top; a dialog must be modal (showModal), labelled, hold focus, show the scrim, close on Escape
// and give focus back. In forced colours, everything that floats must keep a visible edge.
//
// Needs Playwright:  npm i -D playwright   (uses the Chromium that Playwright installs, or CHROMIUM_PATH)
// Usage: node tools/audit-elevation.mjs page.html [--open "#button" ...  or  --open "#a then #b" for a chain of clicks] [--shots out-dir] [--prefix ds] [--contract file] [--json]
// Exit code 1 when anything fails (warnings don't fail).
import path from 'node:path';
import fs from 'node:fs';

// Opening and closing animate now (Motion foundation): wait for every finite animation to end before measuring (at most 2 seconds).
const settle = (p) => p.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 2000))]));
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const VAL = ['--shots', '--prefix', '--open', '--contract'];
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const opens = args.map((a, i) => (a === '--open' ? args[i + 1] : null)).filter(Boolean);
const page = args.find((a, i) => !a.startsWith('--') && !VAL.includes(args[i - 1]));
const shots = opt('--shots');
const prefix = opt('--prefix') ?? 'ds';
const asJson = args.includes('--json');
const contractFile = opt('--contract') ?? path.join(HERE, '../out/default/ai/elevation.contract.json');
if (!page) { console.error('Usage: node tools/audit-elevation.mjs page.html [--open "#button" ...] [--shots dir] [--prefix ds] [--json]'); process.exit(2); }
const contract = fs.existsSync(contractFile) ? JSON.parse(fs.readFileSync(contractFile, 'utf8')) : null;
const EDGE_MIN = contract?.edges.min ?? 1.5;
const STEP_MIN = contract?.limits.surfaceStepMin ?? 1.1;
const LOCAL_Z = new Set(contract?.limits.localZ ?? [-1, 0, 1, 2]);

let chromium;
try { ({ chromium } = createRequire(path.join(process.cwd(), 'x.js'))('playwright')); } catch {
  try { ({ chromium } = await import('playwright')); } catch { console.error('Playwright is not installed. Run: npm i -D playwright'); process.exit(2); }
}

// ---------- runs inside the page ----------
function shared({ pre }) {
  window.__eq = window.__eq || {};
  const R = window.__eq;
  R.name = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.classList.length) s += '.' + [...el.classList].filter((c) => !c.startsWith('__')).slice(0, 2).join('.'); const t = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24); return t ? `${s} "${t}"` : s; };
  R.shown = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0; };
  // The levels as this page's tokens.css draws them: a probe per class.
  R.levels = () => {
    const out = {};
    for (const job of ['raised', 'sticky', 'floating', 'modal', 'dragging']) {
      const d = document.createElement('div'); d.className = `${pre}-${job}`; d.style.position = 'absolute'; d.style.visibility = 'hidden';
      document.body.append(d); const cs = getComputedStyle(d);
      out[job] = { shadow: cs.boxShadow, bg: cs.backgroundColor, z: cs.zIndex };
      d.remove();
    }
    const layers = {};
    for (const l of ['sticky', 'floating', 'modal', 'toast', 'dragging']) layers[l] = +getComputedStyle(document.documentElement).getPropertyValue(`--${pre}-layer-${l}`).trim() || null;
    const scrim = (() => { const d = document.createElement('div'); d.style.background = `var(--${pre}-elevation-modal-scrim)`; document.body.append(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; })();
    return { levels: out, layers, scrim };
  };
  R.blurOf = (sh) => { if (!sh || sh === 'none') return 0; return Math.max(...sh.split(/,(?![^(]*\))/).map((x) => { const n = x.replace(/rgba?\([^)]*\)|inset/g, '').trim().split(/\s+/).map(parseFloat); return n[2] || 0; })); };
  /** Everything with height: a blurred shadow, sticky or fixed, or an open popover or dialog. */
  R.lifted = (lv) => {
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!R.shown(el) || el.closest('[data-eq-skip]')) continue;
      const cs = getComputedStyle(el);
      const top = el.matches(':popover-open') || (el.tagName === 'DIALOG' && el.open);
      const shadowed = cs.boxShadow !== 'none' && R.blurOf(cs.boxShadow) > 0;
      const pinned = cs.position === 'sticky' || cs.position === 'fixed';
      if (!shadowed && !pinned && !top) continue;
      const job = Object.entries(lv.levels).find(([, x]) => x.shadow === cs.boxShadow)?.[0] ?? (shadowed ? null : top ? (el.tagName === 'DIALOG' && el.matches(':modal') ? 'modal' : 'floating') : 'sticky');
      if (!el.dataset.eqId) el.dataset.eqId = String(document.querySelectorAll('[data-eq-id]').length);
      const r = el.getBoundingClientRect();
      const sides = ['Top', 'Right', 'Bottom', 'Left'].map((s) => (cs[`border${s}Style`] === 'none' || cs[`border${s}Style`] === 'hidden' ? 0 : parseFloat(cs[`border${s}Width`]) || 0));
      out.push({ id: el.dataset.eqId, name: R.name(el), job, shadowed, handMade: shadowed && !Object.values(lv.levels).some((x) => x.shadow === cs.boxShadow), shadow: cs.boxShadow, top, modal: el.tagName === 'DIALOG' && el.matches(':modal'), position: cs.position, z: cs.zIndex, sides, radius: parseFloat(cs.borderTopLeftRadius) || 0,
        r: { l: r.left, t: r.top, r: r.right, b: r.bottom }, bg: cs.backgroundColor });
    }
    return out;
  };
  /** A clean sheet in the page's own CSS: one probe per level on the page surface, nothing else, for measuring shadows. */
  R.probe = (on) => {
    document.getElementById('__eq-probe')?.remove();
    if (!on) return null;
    const box = document.createElement('div'); box.id = '__eq-probe'; box.dataset.eqSkip = '';
    box.style.cssText = `position: fixed; inset: 0; z-index: 2147483647; background: var(--${pre}-elevation-page-surface); display: grid; grid-template-columns: repeat(5, 200px); gap: 40px; padding: 40px; align-content: start;`;
    for (const job of ['raised', 'sticky', 'floating', 'modal', 'dragging']) { const d = document.createElement('div'); d.className = `${pre}-${job}`; d.dataset.job = job; d.style.cssText = 'position: static; height: 120px; z-index: auto; background: var(--' + pre + '-elevation-' + (job === 'dragging' ? 'raised' : job) + '-surface);'; box.append(d); }
    document.body.append(box);
    return [...box.children].map((d) => { const r = d.getBoundingClientRect(); return { job: d.dataset.job, l: r.left, r: r.right, b: r.bottom }; });
  };
  R.strayZ = (layers, local) => {
    const known = new Set(Object.values(layers).filter(Boolean));
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const z = getComputedStyle(el).zIndex;
      if (z === 'auto' || !R.shown(el)) continue;
      if (!known.has(+z) && !local.includes(+z)) out.push({ name: R.name(el), z: +z });
    }
    return out;
  };
  /** Is the element the topmost thing at its centre (and at its corners, inset a little)? */
  /** The part of an element its clipping ancestors (a scrolling table, a card with overflow hidden) still show. */
  R.visible = (el) => {
    const r = el.getBoundingClientRect(); let v = { l: r.left, t: r.top, r: r.right, b: r.bottom };
    if (!(el.matches(':popover-open') || (el.tagName === 'DIALOG' && el.open) || getComputedStyle(el).position === 'fixed'))
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const cs = getComputedStyle(a); if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        const ar = a.getBoundingClientRect(); v = { l: Math.max(v.l, ar.left), t: Math.max(v.t, ar.top), r: Math.min(v.r, ar.right), b: Math.min(v.b, ar.bottom) };
      }
    return v;
  };
  R.onTop = (id) => {
    const el = document.querySelector(`[data-eq-id="${id}"]`); const r = R.visible(el);
    if (r.r - r.l < 12 || r.b - r.t < 12) return { seen: 0, over: [], covered: 0 }; // scrolled out of sight inside its own box
    const pts = [[(r.l + r.r) / 2, (r.t + r.b) / 2], [r.l + 6, r.t + 6], [r.r - 6, r.t + 6], [r.l + 6, r.b - 6], [r.r - 6, r.b - 6]].filter(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight);
    const over = pts.map(([x, y]) => document.elementFromPoint(x, y)).filter((h) => h && h !== el && !el.contains(h)).map((h) => R.name(h.closest('[data-eq-id]') ?? h));
    return { seen: pts.length, over: [...new Set(over)], covered: over.length };
  };
  /** Is the element cut off by an ancestor that clips (overflow other than visible)? The top layer and fixed boxes escape. */
  R.clipped = (id) => {
    const el = document.querySelector(`[data-eq-id="${id}"]`);
    if (!el || el.matches(':popover-open') || (el.tagName === 'DIALOG' && el.open) || getComputedStyle(el).position === 'fixed') return null;
    const r = el.getBoundingClientRect();
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
      const ar = a.getBoundingClientRect(), bw = ['Top', 'Right', 'Bottom', 'Left'].map((x) => parseFloat(cs[`border${x}Width`]) || 0);
      const cut = Math.max(ar.top + bw[0] - r.top, r.right - (ar.right - bw[1]), r.bottom - (ar.bottom - bw[2]), ar.left + bw[3] - r.left);
      if (cut > 1) return { by: R.name(a), overflow: cs.overflowX === cs.overflowY ? cs.overflowX : `${cs.overflowX} ${cs.overflowY}`, cut: Math.round(cut) };
    }
    return null;
  };
  R.focusInfo = () => {
    const el = document.activeElement; if (!el || el === document.body) return null;
    const r = el.getBoundingClientRect();
    const pts = [[(r.left + r.right) / 2, (r.top + r.bottom) / 2], [r.left + 2, r.top + 2], [r.right - 2, r.top + 2], [r.left + 2, r.bottom - 2], [r.right - 2, r.bottom - 2]].filter(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight);
    const hiders = pts.map(([x, y]) => document.elementFromPoint(x, y)).filter((h) => h && h !== el && !el.contains(h) && !h.contains(el)).map((h) => { for (let a = h; a; a = a.parentElement) { const p = getComputedStyle(a).position; if (p === 'sticky' || p === 'fixed') return R.name(a); } return null; }).filter(Boolean);
    return { name: R.name(el), inView: pts.length, hidden: hiders.length, by: [...new Set(hiders)], inDialog: !!el.closest('dialog[open], [role="dialog"][aria-modal="true"]') };
  };
  return true;
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
const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const f2 = (x) => x.toFixed(2);

// ---------- drive the browser ----------
const url = /^https?:/.test(page) ? page : 'file://' + path.resolve(page);
const browser = await chromium.launch(process.env.CHROMIUM_PATH || fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' } : {});
const open = async (width, { theme = 'light', forced = false, height = 800 } = {}) => {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, colorScheme: theme, forcedColors: forced ? 'active' : 'none', reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(url);
  await p.evaluate((t) => { document.documentElement.setAttribute('data-theme', t); }, theme);
  if (forced) await p.emulateMedia({ forcedColors: 'active' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(shared, { pre: prefix });
  await p.waitForTimeout(60);
  // Back to the page as it loaded (each --open starts from here, so what one step left open can't change the next).
  p.fresh = async () => { await p.goto(url); await p.evaluate((t) => { document.documentElement.setAttribute('data-theme', t); }, theme); await p.evaluate(() => document.fonts.ready); await p.evaluate(shared, { pre: prefix }); await p.waitForTimeout(60); };
  p.done = () => ctx.close();
  return p;
};
const shot = async (p, label) => { if (!shots) return; fs.mkdirSync(shots, { recursive: true }); await p.screenshot({ path: path.join(shots, `${path.basename(page, '.html')}-${label}.png`), fullPage: false }); };

const result = { fails: [], warns: [], notes: [] };
const fail = (s) => result.fails.push(s), warn = (s) => result.warns.push(s), note = (s) => result.notes.push(s);
const counts = {};
const FLOAT = new Set(['floating', 'modal', 'dragging']);

/** Measure everything lifted on the page as it is now (scrolled to y). */
async function measure(p, tag, { forced = false, theme = 'light' } = {}) {
  const lv = await p.evaluate(() => window.__eq.levels());
  let items = await p.evaluate((x) => window.__eq.lifted(x), lv);
  // While a modal dialog is open the page behind is inert and dimmed: only what is in the top layer counts.
  if (items.some((x) => x.modal)) items = items.filter((x) => x.top);
  // While a menu is open, measure the menu: what it covers is not what is being checked.
  else if (items.some((x) => x.top)) items = items.filter((x) => x.top);
  const png = decodePng(await p.screenshot());
  const vw = png.w, vh = png.h;
  const inView = (it) => it.r.r > 0 && it.r.b > 0 && it.r.l < vw && it.r.t < vh;
  const barBottom = Math.max(0, ...items.filter((x) => (x.position === 'sticky' || x.position === 'fixed') && x.r.t <= 1 && x.r.r - x.r.l > vw / 2).map((x) => x.r.b));
  let edges = 0, lowEdge = Infinity;
  for (const it of items) {
    if (it.handMade && !forced) fail(`${tag} shadow    ${it.name}: a shadow that is no level's (${it.shadow.slice(0, 60)}) — use the level's shadow or class (ER-01)`);
    if (!it.job) continue;
    const floats = FLOAT.has(it.job);
    if (floats && it.sides.some((w) => w < 1)) { fail(`${tag} edge      ${it.name}: ${it.job} with no border on ${['top', 'right', 'bottom', 'left'].filter((_, i) => it.sides[i] < 1).join(', ')} — ${forced ? 'in forced colours it has no edge at all' : 'shadow alone'} (ER-04)`); continue; }
    if (!inView(it)) continue;
    // Edge and surface in pixels: the element's left border column against the page 3px outside it, mid-height.
    const y = Math.min(vh - 2, Math.max(1, (Math.max(0, it.r.t) + Math.min(vh, it.r.b)) / 2));
    const xOut = it.r.l - 3;
    if (floats && xOut >= 0 && it.r.l < vw) {
      // The border's pixel column: of the columns around the left edge, the one that differs most from the outside
      // (a fractional edge is shared by two columns; the purer one is the line people see).
      const out0 = png.at(xOut, y);
      const c = Math.max(...[-1, 0, 1].map((dx) => ratio(png.at(Math.floor(it.r.l) + dx, y), out0)));
      edges++; lowEdge = Math.min(lowEdge, c);
      if (c < EDGE_MIN) fail(`${tag} edge      ${it.name}: its edge measures ${f2(c)}:1 against what is outside it — under ${EDGE_MIN}:1 (E3)`);
    }
    const bg = /rgba?\(([^)]+)\)/.exec(it.bg)?.[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (!forced && theme === 'dark' && ['raised', 'sticky', 'floating', 'modal'].includes(it.job) && xOut >= 0 && bg && (bg[3] ?? 1) >= 0.99 && it.r.t >= barBottom && it.position !== 'sticky') {
      // The surface as its CSS says against what is really beside it (below the sticky bars, which would cover both).
      const s = ratio(bg.slice(0, 3), png.at(xOut, y));
      if (s < STEP_MIN && !floats) warn(`${tag} dark      ${it.name}: ${it.job} surface is ${f2(s)}:1 over what is under it — in Dark it shows no height (a card on a card?)`);
    }
  }
  if (edges) (counts.edges ??= {})[tag] = { measured: edges, lowest: +f2(lowEdge) };
  return { lv, items };
}

async function stacking(p, tag, items) {
  for (const it of items.filter((x) => x.job && x.job !== 'raised' && x.job !== 'dragging' && (x.position === 'sticky' || x.position === 'fixed' || x.top))) {
    const o = await p.evaluate((id) => window.__eq.onTop(id), it.id);
    if (o.seen && o.covered) fail(`${tag} stack     ${it.name} (${it.job}) is covered by ${o.over.join(', ')} — check the layers (E6, ER-05)`);
  }
}

async function tabThrough(p, tag) {
  // Both ways: going forward the browser scrolls a field up from the bottom; going back it scrolls it down from the top,
  // where it lands under a sticky header unless the scroll padding clears it.
  let stops = 0, hidden = 0, partly = 0;
  for (const [key, start] of [['Tab', 'top'], ['Shift+Tab', 'end']]) {
    await p.evaluate((s) => { document.activeElement?.blur(); window.scrollTo(0, s === 'top' ? 0 : document.documentElement.scrollHeight); }, start);
    let first = null;
    for (let i = 0; i < 150; i++) {
      await p.keyboard.press(key);
      // Chromium centres a field it scrolls to; Safari and Firefox scroll the least they can, which puts it right at the
      // top (going back) or bottom (going forward). Do what they do — scroll-padding is honoured, as in those browsers.
      await p.evaluate((k) => document.activeElement?.scrollIntoView({ block: k === 'Tab' ? 'end' : 'start', inline: 'nearest' }), key);
      const f = await p.evaluate(() => window.__eq.focusInfo());
      if (!f) continue;
      if (first === null) first = f.name; else if (f.name === first) break;
      stops++;
      if (f.inView && f.hidden === f.inView) { hidden++; fail(`${tag} focus     ${f.name}: hidden under ${f.by.join(', ')} when it gets focus (${key}) (WCAG 2.4.11)`); }
      else if (f.hidden) { partly++; warn(`${tag} focus     ${f.name}: partly under ${f.by.join(', ')} when it gets focus (${key}) (2.4.12, AAA)`); }
    }
  }
  counts[`tab/${tag}`] = { stops, hidden, partly };
}

/** Open each popover the page can open, and each --open selector, and check it. */
async function overlays(p, tag, lv, theme) {
  const invokers = await p.evaluate(() => [...document.querySelectorAll('[popovertarget]')].filter((b) => window.__eq.shown(b) && !b.closest('dialog, [popover]')).map((b) => { if (!b.id) b.id = `eq-inv-${Math.random().toString(36).slice(2, 8)}`; return `#${b.id}`; }));
  const list = [...invokers.map((s) => ({ sel: s, kind: 'popover' })), ...opens.map((s) => ({ sel: s, kind: 'open' }))];
  let checked = 0;
  for (const x of list) {
    await p.evaluate(() => window.scrollTo(0, 0));
    // "--open 'a then b'" clicks a chain: e.g. open a dialog, then the button inside it that shows a toast.
    if (x.kind === 'open') await p.fresh();
    const steps = x.sel.split(/\s+then\s+/);
    let missing = null;
    for (const s of steps) {
      const el = await p.$(s);
      if (!el || !(await el.isVisible())) { missing = s; break; }
      await el.scrollIntoViewIfNeeded();
      await el.click();
      await p.waitForTimeout(80);
      await settle(p);
    }
    if (missing) { warn(`${tag} open      ${x.sel}: ${missing} not found or not shown`); await p.keyboard.press('Escape'); continue; }
    const st = await p.evaluate(() => ({ dialogs: [...document.querySelectorAll('dialog[open]')].map((d) => ({ name: window.__eq.name(d), modal: d.matches(':modal'), label: !!(d.getAttribute('aria-labelledby') && document.getElementById(d.getAttribute('aria-labelledby'))?.textContent.trim()) || !!d.getAttribute('aria-label'), backdrop: getComputedStyle(d, '::backdrop').backgroundColor, focusIn: d.contains(document.activeElement) })), pops: [...document.querySelectorAll(':popover-open')].map((q) => window.__eq.name(q)), aria: [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].filter((d) => window.__eq.shown(d)).map((d) => window.__eq.name(d)) }));
    const lab = `${tag}+${x.sel.replace(/\s+then\s+/g, '→')}`; // one word: findings are grouped by this label
    const lifted = await measure(p, lab, { theme });
    // On top: what opened into the top layer, and anything fixed over the page that floats (a toast made by hand).
    await stacking(p, lab, lifted.items.filter((i) => i.top || (i.position === 'fixed' && i.shadowed)));
    // What opened over the page must not be cut off by a parent that clips: that is what popovers are for.
    for (const it of lifted.items.filter((i) => i.shadowed && !i.top && i.position !== 'sticky')) {
      const c = await p.evaluate((id) => window.__eq.clipped(id), it.id);
      if (c) fail(`${lab} clipped   ${it.name}: cut off ${c.cut}px by ${c.by} (overflow: ${c.overflow}) — open it as a popover: the top layer is never clipped`);
    }
    for (const d of st.dialogs) {
      checked++;
      if (!d.modal) fail(`${tag} dialog    ${d.name}: open but not modal — opened with the open attribute or show(), so the page behind is not inert (ER-06)`);
      if (!d.label) fail(`${tag} dialog    ${d.name}: no accessible name (aria-labelledby its heading) (WCAG 4.1.2)`);
      if (!d.focusIn) fail(`${tag} dialog    ${d.name}: focus did not move into the dialog when it opened (WCAG 2.4.3)`);
      if (d.modal && d.backdrop !== lv.scrim) fail(`${tag} dialog    ${d.name}: its ::backdrop is ${d.backdrop}, not the scrim (${lv.scrim}) (ER-06)`);
      // Focus stays inside while tabbing both ways.
      let out = 0;
      for (const key of ['Tab', 'Shift+Tab']) for (let i = 0; i < 12; i++) { await p.keyboard.press(key); const inside = await p.evaluate(() => { const a = document.activeElement; return !a || a === document.body || !!a.closest('dialog[open]'); }); if (!inside) out++; }
      if (out) fail(`${tag} dialog    ${d.name}: Tab reached the page behind the dialog ${out} time(s) (ER-06, WCAG 2.4.3)`);
      if (x.kind === 'open') {
        // A popover inside the dialog must open above it.
        const inner = await p.evaluate(() => [...document.querySelectorAll('dialog[open] [popovertarget]')].map((b) => { if (!b.id) b.id = `eq-in-${Math.random().toString(36).slice(2, 8)}`; return `#${b.id}`; }));
        for (const s of inner) {
          await p.click(s); await p.waitForTimeout(60); await settle(p);
          const it = await p.evaluate(() => window.__eq.lifted(window.__eq.levels()).filter((q) => q.top && !q.modal));
          for (const q of it) { const o = await p.evaluate((id) => window.__eq.onTop(id), q.id); if (o.covered) fail(`${tag} stack     ${q.name} inside the dialog is covered by ${o.over.join(', ')}`); }
          await shot(p, `${theme}-dialog-menu-${p.viewportSize().width}`);
          await p.keyboard.press('Escape'); await p.waitForTimeout(40); await settle(p);
        }
      }
      await shot(p, `${theme}-dialog-${p.viewportSize().width}`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(60); await settle(p);
      const after = await p.evaluate(() => ({ open: !!document.querySelector('dialog[open]'), active: window.__eq.name(document.activeElement) }));
      if (after.open) fail(`${tag} dialog    ${d.name}: Escape did not close it`);
      // The control that opened it: the last click of an --open chain (inside a menu: the menu's own button gets focus back).
      const back = await p.evaluate((sel) => { const a = document.activeElement, s = document.querySelector(sel); return a === s || !!(s && a && (s.contains(a) || a.getAttribute('popovertarget') === s.closest('[popover]')?.id)); }, steps[steps.length - 1]);
      if (!after.open && !back) warn(`${tag} dialog    ${d.name}: after closing, focus is on ${after.active}, not the control that opened it (WCAG 2.4.3)`);
    }
    for (const n of st.aria) warn(`${tag} dialog    ${n}: a modal built without <dialog> — the audit can't prove the page behind is inert; prefer <dialog> + showModal()`);
    if (x.kind === 'popover') {
      checked++;
      if (!st.pops.length) warn(`${tag} popover   ${x.sel}: clicking it opened no popover`);
      await shot(p, `${theme}-popover-${p.viewportSize().width}`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(40); await settle(p);
    }
  }
  counts[`overlays/${tag}`] = checked;
}

for (const theme of ['light', 'dark']) for (const w of [1280, 320]) {
  const tag = `${theme}/${w}`;
  const p = await open(w, { theme });
  if (w === 1280) await shot(p, `${theme}-1280`);
  const { lv, items } = await measure(p, tag, { theme });
  counts[`lifted/${tag}`] = items.length;
  const stray = await p.evaluate(([l, z]) => window.__eq.strayZ(l, z), [lv.layers, [...LOCAL_Z]]);
  for (const s of stray) fail(`${tag} z-index   ${s.name}: z-index ${s.z} is not a layer (${Object.entries(lv.layers).map(([k, v]) => `${k} ${v}`).join(', ')}) (ER-05)`);
  // Shadows, measured on a clean sheet: how dark each level's shadow gets just under its bottom edge.
  {
    const probes = await p.evaluate(() => window.__eq.probe(true));
    const png = decodePng(await p.screenshot());
    for (const q of probes.filter((x) => x.r <= png.w && x.b + 60 < png.h)) { const cx = (q.l + q.r) / 2; (counts.shadow ??= {})[`${theme}/${q.job}`] = +f2(ratio(png.at(cx, q.b + 0.5), png.at(cx, q.b + 60))); }
    await p.evaluate(() => window.__eq.probe(false));
  }
  // Scroll so content sits under the sticky bars, then check they are on top.
  await p.evaluate(() => window.scrollTo(0, Math.min(400, document.documentElement.scrollHeight)));
  await p.waitForTimeout(40);
  const scrolled = await measure(p, `${tag}+scrolled`, { theme });
  await stacking(p, tag, scrolled.items);
  await tabThrough(p, tag);
  await overlays(p, tag, lv, theme);
  await p.done();
}
for (const w of [1280, 320]) {
  const tag = `forced/${w}`;
  const p = await open(w, { forced: true });
  if (w === 1280) await shot(p, 'forced-1280');
  const lv = await p.evaluate(() => window.__eq.levels());
  // In forced colours the shadows are gone, so find the floating things by class and by state.
  const fl = await p.evaluate((pre) => [...document.querySelectorAll(`.${pre}-floating, .${pre}-modal, .${pre}-dragging, :popover-open, dialog[open]`)].filter((e) => window.__eq.shown(e)).map((e) => { const cs = getComputedStyle(e); return { name: window.__eq.name(e), sides: ['Top', 'Right', 'Bottom', 'Left'].map((s) => (cs[`border${s}Style`] === 'none' ? 0 : parseFloat(cs[`border${s}Width`]) || 0)), shadow: cs.boxShadow }; }), prefix);
  for (const x of fl) if (x.sides.some((s) => s < 1)) fail(`${tag} edge      ${x.name}: no border on every side in forced colours — it has no edge there (ER-04)`);
  counts[tag] = { floating: fl.length, shadowsLeft: fl.filter((x) => x.shadow !== 'none').length };
  await measure(p, tag, { forced: true });
  await overlays(p, tag, lv, 'forced');
  await p.done();
}
await browser.close();

function merge(list) {
  const groups = new Map();
  for (const line of list) {
    const m = /^(\S+)\s+(\S+)\s+(.*)$/.exec(line);
    if (!m) { groups.set(line, { text: line, runs: [] }); continue; }
    const [, where, kind, rest] = m;
    const key = `${kind} ${rest.replace(/\d+(\.\d+)?(px|:1)/g, '#')}`;
    if (!groups.has(key)) groups.set(key, { kind, rest, runs: [] });
    groups.get(key).runs.push(where);
  }
  return [...groups.values()].map((g) => (g.runs.length ? `${g.kind.padEnd(9)} ${g.rest}${g.runs.length > 1 ? ' (numbers from the first)' : ''}  [${[...new Set(g.runs)].join(', ')}]` : g.text));
}
note(`elevation audit · ${path.basename(page)} · edges ≥ ${EDGE_MIN}:1 · Dark surface step ≥ ${STEP_MIN}:1`);
if (counts.shadow) note(`shadow just under the edge (measured): ${Object.entries(counts.shadow).map(([k, v]) => `${k} ${v}:1`).join(' · ')}`);
if (asJson) console.log(JSON.stringify({ ...result, counts }, null, 2));
else {
  for (const n of result.notes) console.log(n);
  for (const f of merge(result.fails)) console.log('✕ ' + f);
  for (const w of merge(result.warns)) console.log('! ' + w);
  console.log(`\n${result.fails.length ? `${merge(result.fails).length} problem(s)` : 'no problems'}${result.warns.length ? ` · ${merge(result.warns).length} warning(s)` : ''}`);
}
process.exit(result.fails.length ? 1 : 0);
