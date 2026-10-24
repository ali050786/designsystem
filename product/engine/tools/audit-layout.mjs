#!/usr/bin/env node
// Layout audit: opens an HTML page in a real browser at the narrowest width of every breakpoint (320, 600, 1024, 1440)
// and at 1920px, in each density, and measures what people get: sideways scrolling (WCAG 1.4.10), grids with columns
// too thin, reading order against the code (1.3.2), characters per line of running text (1.4.8), then focus hidden
// under sticky bars while tabbing both ways (2.4.11) — also at 200% text in a tall window — sticky bars at 400% zoom
// (320 × 256), the navigation drawer, and reflow at 200% text (the browser's text-size setting, via Chromium). Complements the layout checker (which reads source code) by checking the rendered result.
//
// Needs Playwright:  npm i -D playwright   (uses the Chromium that Playwright installs, or CHROMIUM_PATH)
// Usage: node tools/audit-layout.mjs page.html [--shots out-dir] [--prefix ds] [--json]
// Exit code 1 when anything fails (warnings don't fail).
import path from 'node:path';
import fs from 'node:fs';

// Opening and closing animate now (Motion foundation): wait for every finite animation to end before measuring (at most 2 seconds).
const settle = (p) => p.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 2000))]));
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const page = args.find((a, i) => !a.startsWith('--') && !['--shots', '--prefix'].includes(args[i - 1]));
const shots = opt('--shots');
const prefix = opt('--prefix') ?? 'ds';
const asJson = args.includes('--json');
if (!page) { console.error('Usage: node tools/audit-layout.mjs page.html [--shots dir] [--prefix ds] [--json]'); process.exit(2); }

let chromium;
try { ({ chromium } = createRequire(path.join(process.cwd(), 'x.js'))('playwright')); } catch {
  try { ({ chromium } = await import('playwright')); } catch { console.error('Playwright is not installed. Run: npm i -D playwright'); process.exit(2); }
}

const DENSITIES = ['comfortable', 'default', 'compact'];
const WIDTHS = [['sm', 320], ['md', 600], ['lg', 1024], ['xl', 1440], ['wide', 1920]];
const MIN_COLUMN = 40, MAX_CPL = 80, STICKY_SHARE = 0.25, DRAWER_STRIP = 48;

// ---------- runs inside the page ----------
function inPage({ prefix, MIN_COLUMN }) {
  const name = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.getAttribute('data-shell')) s += `[data-shell=${el.getAttribute('data-shell')}]`; else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.'); return s; };
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const vw = document.documentElement.clientWidth;
  // Sideways scrolling, and the elements that cause it (not inside their own scrolling container).
  const wide = document.documentElement.scrollWidth > vw + 1;
  const culprits = [];
  if (wide) {
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.right <= vw + 1 || r.width === 0 || getComputedStyle(el).position === 'fixed') continue;
      let scroller = false;
      for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) if (/auto|scroll/.test(getComputedStyle(n).overflowX)) { scroller = true; break; }
      if (!scroller && ![...el.children].some((c) => c.getBoundingClientRect().right > vw + 1)) culprits.push(`${name(el)} (right edge ${Math.round(r.right)}px)`);
    }
  }
  // Grids: the ds grid's columns, and any CSS grid whose content tracks got thinner than MIN_COLUMN.
  const grids = [];
  for (const el of document.querySelectorAll(`.${prefix}-grid`)) {
    if (!visible(el)) continue;
    const t = getComputedStyle(el).gridTemplateColumns.split(' ').map(parseFloat).filter((x) => !Number.isNaN(x));
    grids.push({ el: name(el), columns: t.length, min: Math.round(Math.min(...t) * 10) / 10, region: el.closest('[data-shell], .' + prefix + '-region')?.getAttribute('data-shell') ?? (el.closest('.' + prefix + '-region') ? 'region' : 'page') });
  }
  // Reading order: landmarks and shell regions in the order the code has them, against where they are drawn.
  const regions = [...document.querySelectorAll('header, nav, main, aside, footer, [data-shell], [role=banner], [role=navigation], [role=main], [role=complementary], [role=contentinfo]')]
    .filter((el) => visible(el) && getComputedStyle(el).position !== 'fixed' && !el.parentElement.closest('header, nav, main, aside, footer, [data-shell]'));
  const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
  const order = [];
  for (let i = 0; i < regions.length; i++) for (let j = i + 1; j < regions.length; j++) {
    const a = regions[i].getBoundingClientRect(), b = regions[j].getBoundingClientRect();
    const above = b.bottom <= a.top + 1;
    const beside = !(b.bottom <= a.top + 1 || b.top >= a.bottom - 1) && (rtl ? b.left >= a.right - 1 : b.right <= a.left + 1);
    if (above || beside) order.push(`${name(regions[j])} is drawn ${above ? 'above' : 'before'} ${name(regions[i])}, but comes after it in the code`);
  }
  // Running text: characters per line of each paragraph-like block with enough text to wrap.
  const lines = [];
  for (const el of document.querySelectorAll('p, li, dd, blockquote, figcaption')) {
    if (!visible(el) || el.closest('nav, [data-shell=nav], header')) continue;
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    if (text.length < 140) continue;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    const rows = new Map();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      for (let i = 0; i < n.length; i++) {
        if (/\s/.test(n.data[i])) continue;
        range.setStart(n, i); range.setEnd(n, i + 1);
        const r = range.getClientRects()[0];
        if (!r || !r.width) continue;
        const y = Math.round(r.top / 4);
        rows.set(y, (rows.get(y) ?? 0) + 1);
      }
    }
    const counts = [...rows.values()];
    if (counts.length < 2) continue; // one full line is enough to measure; long lines wrap into few of them
    const full = counts.slice(0, -1);
    // Characters per line counted with spaces: add the spaces back in proportion.
    const ratio = text.length / text.replace(/\s/g, '').length;
    lines.push({ el: name(el), max: Math.round(Math.max(...full) * ratio), avg: Math.round((full.reduce((s, x) => s + x, 0) / full.length) * ratio), width: Math.round(el.getBoundingClientRect().width) });
  }
  // Sticky and fixed bars at the top: their share of the viewport height.
  const bars = [...document.querySelectorAll('body *')].filter((el) => { const cs = getComputedStyle(el); return /sticky|fixed/.test(cs.position) && visible(el); })
    .map((el) => ({ el, r: el.getBoundingClientRect() })).filter((b) => b.r.top <= 1 && b.r.height < innerHeight);
  const barHeight = bars.reduce((s, b) => s + b.r.height, 0);
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const tooTall = bars.filter((b) => b.r.height > padding + 0.5).map((b) => `${name(b.el)} is ${Math.round(b.r.height)}px, the scroll padding ${Math.round(padding)}px`);
  // Scrolling containers people must be able to reach with a keyboard.
  const scrollers = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (!/auto|scroll/.test(cs.overflowX) || el.scrollWidth <= el.clientWidth + 1 || !visible(el)) continue;
    const focusable = el.tabIndex >= 0 || el.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const named = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
    if (!focusable || !named) scrollers.push(`${name(el)} scrolls sideways (${el.scrollWidth}px in ${el.clientWidth}px) but ${!focusable ? 'can\'t be focused' : 'has no name'}`);
  }
  const root = getComputedStyle(document.documentElement);
  return { width: vw, scrollWidth: document.documentElement.scrollWidth, wide: wide && culprits.length > 0, culprits: culprits.slice(0, 6), grids, order, lines, bars: bars.map((b) => `${name(b.el)} ${Math.round(b.r.height)}px`), barHeight: Math.round(barHeight), tooTall, scrollers, scrollPadding: root.scrollPaddingTop, header: parseFloat(root.getPropertyValue(`--${prefix}-layout-header-height`)) || null, MIN_COLUMN };
}

// Is the focused element hidden under a sticky or fixed bar? Samples points across it and asks the browser what is
// painted on top at each one; a point counts as covered when that is part of a sticky or fixed bar.
function focusCheck() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  const label = (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 24);
  const id = `${el.tagName.toLowerCase()}${label ? ` "${label}"` : ''}`;
  const vis = { l: Math.max(r.left, 0), t: Math.max(r.top, 0), r: Math.min(r.right, innerWidth), b: Math.min(r.bottom, innerHeight) };
  if (vis.r - vis.l < 1 || vis.b - vis.t < 1) return { el: id, covered: 1, by: 'off screen' };
  const barOf = (n) => { for (let x = n; x && x !== document.body; x = x.parentElement) if (/sticky|fixed/.test(getComputedStyle(x).position)) return x; return null; };
  let total = 0, covered = 0, by = '';
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
    const x = vis.l + ((i + 0.5) / 5) * (vis.r - vis.l), y = vis.t + ((j + 0.5) / 3) * (vis.b - vis.t);
    const top = document.elementFromPoint(x, y);
    total++;
    if (!top || el.contains(top) || top.contains(el)) continue;
    const bar = barOf(top);
    if (bar && !bar.contains(el)) { covered++; by = bar.tagName.toLowerCase() + (bar.getAttribute('data-shell') ? `[data-shell=${bar.getAttribute('data-shell')}]` : bar.className ? '.' + String(bar.className).split(' ')[0] : ''); }
  }
  return { el: id, covered: +(covered / total).toFixed(2), by };
}

// ---------- drive the browser ----------
const url = /^https?:/.test(page) ? page : 'file://' + path.resolve(page);
const browser = await chromium.launch(process.env.CHROMIUM_PATH || fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' } : {});
// text: 200 sets the browser's default text size to 32px, as a reader does in the browser settings — rem sizes and em
// breakpoints both follow it (a CSS font-size on <html> would move rem but not the breakpoints).
const open = async (width, density, { height = 900, css = '', text = 100 } = {}) => {
  const p = await browser.newPage({ viewport: { width, height } });
  if (text !== 100) {
    try { const cdp = await p.context().newCDPSession(p); await cdp.send('Page.setFontSizes', { fontSizes: { standard: 16 * text / 100, fixed: 13 * text / 100 } }); }
    catch { css += `html { font-size: ${text}% !important; }`; }
  }
  await p.goto(url);
  await p.evaluate((d) => { document.documentElement.setAttribute('data-density', d); }, density);
  if (css) await p.addStyleTag({ content: css });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(80);
  return p;
};
const shot = async (p, label) => {
  if (!shots) return;
  fs.mkdirSync(shots, { recursive: true });
  await p.screenshot({ path: path.join(shots, `${path.basename(page, '.html')}-${label}.png`), fullPage: false });
};
const result = { fails: [], warns: [], notes: [] };
const fail = (s) => result.fails.push(s), warn = (s) => result.warns.push(s);
const runs = {};
for (const d of DENSITIES) {
  for (const [bp, w] of WIDTHS) {
    const p = await open(w, d);
    const m = await p.evaluate(inPage, { prefix, MIN_COLUMN });
    runs[`${d}/${bp}`] = m;
    if (d === 'default' || bp === 'sm') await shot(p, `${d}-${w}`);
    await p.close();
    const tag = `${d.padEnd(11)} ${String(w).padEnd(5)}`;
    if (m.wide) fail(`${tag} reflow    the page scrolls sideways (${m.scrollWidth}px in ${m.width}px): ${m.culprits.slice(0, 4).join(', ')} (WCAG 1.4.10)`);
    for (const g of m.grids) if (g.min < MIN_COLUMN) fail(`${tag} grid      ${g.el} in ${g.region}: ${g.columns} columns of ${g.min}px — under ${MIN_COLUMN}px (a grid in a region should follow the region)`);
    for (const o of m.order) fail(`${tag} order     ${o} (WCAG 1.3.2)`);
    for (const s of m.scrollers) warn(`${tag} scroller  ${s} (LR-08)`);
    for (const t of m.tooTall) warn(`${tag} sticky    ${t} — focused items can end up partly under it (WCAG 2.4.12); keep the header to layout.header.height (one row, controls with box-sizing: border-box) or measure it (LR-04)`);
    if (d === 'default') for (const l of m.lines) if (l.max > MAX_CPL) warn(`${tag} measure   ${l.el}: up to ${l.max} characters a line (average ${l.avg}, ${l.width}px wide) — over ${MAX_CPL} (WCAG 1.4.8, AAA); use layout.measure.reading`);
  }
}
// 400% zoom: a 1280 × 1024 window is 320 × 256. Sticky bars take from that height.
for (const d of DENSITIES) {
  const p = await open(320, d, { height: 256 });
  const m = await p.evaluate(inPage, { prefix, MIN_COLUMN });
  runs[`${d}/zoom`] = m;
  if (d === 'comfortable') await shot(p, 'zoom400-comfortable');
  await p.close();
  if (m.wide) fail(`${d.padEnd(11)} 320×256 reflow    the page scrolls sideways at 400% zoom: ${m.culprits.join(', ')}`);
  if (m.barHeight > 256 * STICKY_SHARE + 0.5) warn(`${d.padEnd(11)} 320×256 sticky    sticky bars take ${m.barHeight}px of 256px (${Math.round((m.barHeight / 256) * 100)}%) at 400% zoom: ${m.bars.join(', ')} — keep it ≤ ${STICKY_SHARE * 100}%`);
}
// Focus under sticky bars: tab forward from the top, then backward from the end (where scroll padding matters).
const focusRuns = [];
for (const [label, w, h, d, text] of [['desktop', 1280, 720, 'default', 100], ['phone', 320, 640, 'default', 100], ['zoom400', 320, 256, 'comfortable', 100], ['text200', 1280, 1000, 'comfortable', 200]]) {
  const p = await open(w, d, { height: h, text });
  const hidden = [], partly = [];
  let steps = 0;
  const worst = new Map();
  const visit = async () => { const f = await p.evaluate(focusCheck); steps++; if (!f || f.covered <= 0) return; if (f.covered >= 0.99) hidden.push(`${f.el} (under ${f.by})`); else if ((worst.get(f.el)?.covered ?? 0) < f.covered) worst.set(f.el, f); };
  for (let i = 0; i < 80; i++) { await p.keyboard.press('Tab'); await visit(); }
  await p.evaluate(() => { const all = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => el.getClientRects().length); all.at(-1)?.focus(); window.scrollTo(0, document.documentElement.scrollHeight); });
  for (let i = 0; i < 80; i++) { await p.keyboard.press('Shift+Tab'); await visit(); }
  for (const [el, f] of worst) if (!hidden.some((h) => h.startsWith(el))) partly.push(`${el} up to ${Math.round(f.covered * 100)}% under ${f.by}`);
  const sp = await p.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop);
  await p.close();
  focusRuns.push({ label, steps, hidden: [...new Set(hidden)], partly: [...new Set(partly)], scrollPadding: sp });
  for (const x of [...new Set(hidden)]) fail(`${d.padEnd(11)} ${label.padEnd(7)} focus     ${x} — hidden when it gets focus (WCAG 2.4.11); set scroll-padding-top to the bar's height`);
  for (const x of [...new Set(partly)].slice(0, 6)) warn(`${d.padEnd(11)} ${label.padEnd(7)} focus     ${x} when it gets focus (WCAG 2.4.12, AAA)`);
}
// The navigation drawer on a phone: opens from its toggle, leaves the page visible, closes with Escape, returns focus.
const drawer = [];
for (const d of DENSITIES) {
  const p = await open(320, d, { height: 640 });
  const toggle = await p.$('[data-shell-toggle]');
  if (!toggle) { await p.close(); break; }
  const pane = await toggle.getAttribute('data-shell-toggle');
  await toggle.click();
  await p.waitForTimeout(60);
  await settle(p);
  const st = await p.evaluate((job) => { const el = document.querySelector(`[data-shell="${job}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return { shown: getComputedStyle(el).display !== 'none' && r.width > 0, right: Math.round(r.right), expanded: document.querySelector(`[data-shell-toggle="${job}"]`).getAttribute('aria-expanded') }; }, pane);
  if (d === 'default') await shot(p, 'drawer-320');
  await p.keyboard.press('Tab');
  const inside = await p.evaluate((job) => !!document.activeElement?.closest(`[data-shell="${job}"]`), pane);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(60);
  await settle(p);
  const after = await p.evaluate((job) => ({ stillOpen: getComputedStyle(document.querySelector(`[data-shell="${job}"]`)).display !== 'none', focusBack: document.activeElement?.getAttribute('data-shell-toggle') === job }), pane);
  await p.close();
  drawer.push({ d, pane, ...st, inside, ...after });
  const tag = `${d.padEnd(11)} 320   drawer   `;
  if (!st?.shown) fail(`${tag} the ${pane} toggle doesn't open the ${pane} pane`);
  else {
    if (320 - st.right < DRAWER_STRIP) fail(`${tag} the open ${pane} drawer leaves ${320 - st.right}px of the page visible — under ${DRAWER_STRIP}px`);
    if (st.expanded !== 'true') warn(`${tag} the toggle doesn't say it is open (aria-expanded="${st.expanded}")`);
    if (!inside) warn(`${tag} Tab after opening doesn't go into the ${pane} drawer`);
    if (after.stillOpen) warn(`${tag} Escape doesn't close the ${pane} drawer`);
    else if (!after.focusBack) warn(`${tag} after Escape, focus doesn't return to the toggle`);
  }
}
// 200% text: breakpoints in em hand over to the layout of a narrower screen; nothing scrolls sideways.
for (const [label, w] of [['phone', 320], ['desktop', 1280]]) {
  const p = await open(w, 'default', { text: 200 });
  const m = await p.evaluate(inPage, { prefix, MIN_COLUMN });
  const mode = await p.evaluate((pre) => getComputedStyle(document.documentElement).getPropertyValue(`--${pre}-layout-columns`).trim(), prefix);
  await shot(p, `${label}-200`);
  await p.close();
  runs[`200/${label}`] = { ...m, columns: mode };
  if (m.wide) fail(`default     ${label.padEnd(7)} text-200% the page scrolls sideways at 200% text: ${m.culprits.join(', ')} (WCAG 1.4.4, 1.4.10)`);
  for (const g of m.grids) if (g.min < MIN_COLUMN) fail(`default     ${label.padEnd(7)} text-200% ${g.el}: columns of ${g.min}px`);
}
await browser.close();

// Notes: what the page looks like at each width in default density.
for (const [bp, w] of WIDTHS) {
  const m = runs[`default/${bp}`];
  const g = m.grids.map((x) => `${x.region} ${x.columns}×${x.min}px`).join(', ');
  const longest = m.lines.length ? Math.max(...m.lines.map((l) => l.max)) : null;
  result.notes.push(`${String(w).padStart(4)}px  ${m.wide ? 'scrolls sideways' : 'fits'} · grids ${g || '—'} · longest line ${longest ?? '—'} characters · sticky ${m.bars.join(', ') || '—'}`);
}
result.notes.push(`400% zoom (320 × 256): sticky bars ${DENSITIES.map((d) => `${d} ${runs[`${d}/zoom`].barHeight}px`).join(' · ')}`);
for (const f of focusRuns) result.notes.push(`focus ${f.label.padEnd(8)} ${f.steps} tab stops, both directions · scroll-padding-top ${f.scrollPadding} · hidden ${f.hidden.length} · partly ${f.partly.length}`);
if (drawer.length) result.notes.push(`drawer (320px): ${drawer.map((x) => `${x.d} ${x.shown ? `opens, ${320 - x.right}px of the page visible${x.inside ? ', focus moves in' : ''}${!x.stillOpen && x.focusBack ? ', Escape closes it and returns focus' : ''}` : 'does not open'}`).join(' · ')}`);
result.notes.push(`200% text (browser setting): phone ${runs['200/phone'].wide ? 'scrolls sideways' : 'fits'} (${runs['200/phone'].columns} columns) · 1280px ${runs['200/desktop'].wide ? 'scrolls sideways' : 'fits'} (${runs['200/desktop'].columns} columns: the breakpoints are in em, so it gets the layout of a ${1280 / 2}px window)`);

// The same finding in several runs prints once, with where it happened.
function merge(list) {
  const groups = new Map();
  for (const line of list) {
    const m = /^(\S+)\s+(\S+)\s+(\S+)\s+(.*)$/.exec(line);
    if (!m) { groups.set(line, { text: line, runs: [] }); continue; }
    const [, dens, width, kind, rest] = m;
    const key = `${kind} ${rest.replace(/\d+(\.\d+)?px/g, '#')}`; // the same finding at another width differs only in its numbers
    if (!groups.has(key)) groups.set(key, { kind, rest, runs: [] });
    groups.get(key).runs.push([dens, width]);
  }
  return [...groups.values()].map((g) => {
    if (!g.runs.length) return g.text;
    const ds = [...new Set(g.runs.map((r) => r[0]))], ws = [...new Set(g.runs.map((r) => r[1]))];
    return `${g.kind.padEnd(9)} ${g.rest}${g.runs.length > 1 ? ' (numbers from the first)' : ''}  [${ds.length === 3 ? 'every density' : ds.join(', ')}; ${ws.join(', ')}]`;
  });
}
if (asJson) console.log(JSON.stringify({ ...result, focus: focusRuns, drawer, runs }, null, 2));
else {
  for (const n of result.notes) console.log(n);
  for (const f of merge(result.fails)) console.log('✕ ' + f);
  for (const w of merge(result.warns)) console.log('! ' + w);
}
process.exit(result.fails.length ? 1 : 0);
