#!/usr/bin/env node
// Type audit: opens an HTML page in a real browser and measures what readers actually get — text size, line height,
// characters per line, numerals that line up — then applies the settings readers use (the WCAG 1.4.12 text-spacing
// override, text at 200%, a 320px-wide screen) and reports anything that gets cut off or scrolls sideways.
// Complements the type checker (which reads source code) by checking the rendered result.
//
// Needs Playwright:  npm i -D playwright   (uses the Chromium that Playwright installs, or CHROMIUM_PATH)
// Usage: node tools/audit-type.mjs page.html [--shots out-dir] [--json]
// Exit code 1 when anything fails (warnings don't fail).
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const page = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--shots');
const shots = opt('--shots');
const asJson = args.includes('--json');
if (!page) { console.error('Usage: node tools/audit-type.mjs page.html [--shots dir] [--json]'); process.exit(2); }

let chromium;
try { ({ chromium } = createRequire(path.join(process.cwd(), 'x.js'))('playwright')); } catch {
  try { ({ chromium } = await import('playwright')); } catch { console.error('Playwright is not installed. Run: npm i -D playwright'); process.exit(2); }
}

const MIN_SIZE = 12, READING = 1.5, MIN_LH = 1.15, MAX_CHARS = 80;
// WCAG 1.4.12 text spacing (the values of the W3C test bookmarklet).
const SPACING_CSS = `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`;

// ---------- runs inside the page ----------
function measure() {
  const out = [];
  const name = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.'); return s; };
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0; };
  const hidden = (el) => !!el.closest('[aria-hidden="true"], .sr-only, .visually-hidden');
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const el = t.parentElement;
    if (!el || seen.has(el) || !t.textContent.trim() || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'OPTION'].includes(el.tagName) || !visible(el) || hidden(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const lh = cs.lineHeight === 'normal' ? size * 1.2 : parseFloat(cs.lineHeight);
    // Lines of this element's own text, and characters per line.
    const range = document.createRange();
    const lines = [];
    let cur = null, count = 0;
    for (const node of el.childNodes) {
      if (node.nodeType !== 3) continue;
      for (let i = 0; i < node.length; i++) {
        range.setStart(node, i); range.setEnd(node, i + 1);
        const rect = range.getClientRects()[0];
        if (!rect || rect.width === 0) continue;
        const y = Math.round(rect.top);
        if (cur === null) cur = y;
        if (Math.abs(y - cur) > size * 0.5) { lines.push(count); count = 0; cur = y; }
        count++;
      }
    }
    if (count) lines.push(count);
    const tag = el.tagName.toLowerCase();
    const headingLike = /^(h[1-6]|button|label|legend|th|summary|caption)$/.test(tag) || +cs.fontWeight >= 600;
    // Line height matters once text wraps: wrapped text below heading sizes that isn't a heading or label is reading text.
    // (Wrapped headings and display text only need the 1.15 floor.)
    const reading = lines.length > 1 && size < 24 && !headingLike;
    const full = lines.slice(0, -1);
    const text = t.textContent.trim();
    out.push({
      el: name(el), tag, text: text.slice(0, 40), size: +size.toFixed(2), lineHeight: +lh.toFixed(2), ratio: +(lh / size).toFixed(2), lines: lines.length, reading,
      chars: full.length >= 2 ? Math.round(full.reduce((a, b) => a + b, 0) / full.length) : null,
      numeric: /^[−+\-–]?\s?[$€£¥₹]?\s?\d[\d,.\s:]*\d\s?(%|[kKmMbB]|ms|s|h)?$/.test(text) && (text.match(/\d/g) || []).length >= 3,
      tabular: /tabular-nums/.test(cs.fontVariantNumeric), font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, inTable: !!el.closest('td, th'),
    });
  }
  // Does each font in use actually have tabular figures? Compare ten 1s with ten 0s.
  const fonts = [...new Set(out.filter((x) => x.tabular).map((x) => x.font))];
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-variant-numeric:tabular-nums';
  document.body.append(probe);
  const tabularOk = {};
  for (const f of fonts) {
    probe.style.font = f; probe.style.fontVariantNumeric = 'tabular-nums';
    probe.textContent = '1111111111'; const a = probe.getBoundingClientRect().width;
    probe.textContent = '0000000000'; const b = probe.getBoundingClientRect().width;
    tabularOk[f] = Math.abs(a - b) < 0.5;
  }
  probe.remove();
  // Headings in order.
  const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(visible).map((h) => ({ level: +h.tagName[1], text: h.textContent.trim().slice(0, 40) }));
  const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '';
  return { text: out, tabularOk, headings, viewport };
}

// Elements whose text is cut off: content larger than the box while overflow is hidden or clipped.
function clipped() {
  const out = [];
  const name = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.'); return s; };
  for (const el of document.body.querySelectorAll('*')) {
    if (!el.textContent.trim() || ['SCRIPT', 'STYLE', 'SELECT', 'OPTION', 'TEXTAREA', 'INPUT'].includes(el.tagName)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || el.closest('.sr-only, .visually-hidden')) continue;
    const clipX = /hidden|clip/.test(cs.overflowX), clipY = /hidden|clip/.test(cs.overflowY);
    if ((clipX && el.scrollWidth > el.clientWidth + 1) || (clipY && el.scrollHeight > el.clientHeight + 1)) out.push({ el: name(el), text: el.textContent.trim().slice(0, 40), box: `${el.clientWidth}×${el.clientHeight}`, content: `${el.scrollWidth}×${el.scrollHeight}`, ellipsis: cs.textOverflow === 'ellipsis' && !(clipY && el.scrollHeight > el.clientHeight + 1) });
  }
  return out;
}

// Horizontal scrolling at 320px: the page is wider than the viewport. Culprits are elements that stick out and are
// not inside something that scrolls on its own (data tables may scroll inside their container).
function reflow() {
  const vw = document.documentElement.clientWidth;
  const wide = document.documentElement.scrollWidth > vw + 1;
  const culprits = [];
  if (wide) {
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.right <= vw + 1 || r.width === 0) continue;
      let scroller = false;
      for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) if (/auto|scroll/.test(getComputedStyle(n).overflowX)) { scroller = true; break; }
      if (!scroller && ![...el.children].some((c) => c.getBoundingClientRect().right > vw + 1)) culprits.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.classList.length ? '.' + el.classList[0] : '') + ` (right edge ${Math.round(r.right)}px)`);
    }
  }
  return { width: vw, scrollWidth: document.documentElement.scrollWidth, wide: wide && culprits.length > 0, culprits: culprits.slice(0, 8) };
}

// ---------- drive the browser ----------
const url = /^https?:/.test(page) ? page : 'file://' + path.resolve(page);
const browser = await chromium.launch(process.env.CHROMIUM_PATH || fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' } : {});
const open = async (width, height = 900) => { const p = await browser.newPage({ viewport: { width, height } }); await p.goto(url); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(100); return p; };
const shot = async (p, label) => {
  if (!shots) return;
  fs.mkdirSync(shots, { recursive: true });
  await p.evaluate(() => { for (const el of document.querySelectorAll('*')) if (getComputedStyle(el).position === 'sticky') el.style.position = 'relative'; });
  await p.screenshot({ path: path.join(shots, `${path.basename(page, '.html')}-${label}.png`), fullPage: true });
};
const result = { fails: [], warns: [], notes: [] };
const fail = (s) => result.fails.push(s), warn = (s) => result.warns.push(s);

// 1. As designed, desktop and phone.
const views = {};
for (const [label, w] of [['desktop', 1280], ['phone', 320]]) {
  const p = await open(w, label === 'phone' ? 640 : 900);
  const m = await p.evaluate(measure);
  views[label] = m;
  await shot(p, label);
  for (const x of m.text) {
    if (x.size < MIN_SIZE) fail(`${label}  size      ${x.el} "${x.text}" is ${x.size}px (smallest allowed ${MIN_SIZE}px)`);
    if (x.reading && x.ratio < READING) fail(`${label}  leading   ${x.el} "${x.text}" reading text at line height ${x.ratio} (${x.size}/${x.lineHeight}px; needs ${READING})`);
    else if (x.lines > 1 && x.ratio < MIN_LH) fail(`${label}  leading   ${x.el} "${x.text}" wraps at line height ${x.ratio} — lines touch (needs ${MIN_LH})`);
    if (x.chars && x.chars > MAX_CHARS && label === 'desktop') warn(`${label}  measure   ${x.el} "${x.text}" ~${x.chars} characters a line (aim for 45–75; WCAG 1.4.8 says at most 80)`);
    if (x.numeric && x.inTable && !x.tabular) warn(`${label}  numerals  ${x.el} "${x.text}" in a table without tabular numerals`);
  }
  for (const [font, ok] of Object.entries(m.tabularOk)) if (!ok) fail(`${label}  numerals  "${font}" has no tabular figures — tabular-nums does nothing, digits won't line up`);
  if (label === 'desktop') {
    let prev = 0;
    for (const h of m.headings) { if (prev && h.level > prev + 1) warn(`desktop  headings  h${prev} → h${h.level} skips a level ("${h.text}")`); prev = h.level; }
    if (!m.headings.some((h) => h.level === 1)) warn('desktop  headings  no h1 on the page');
    if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*(0?\.\d+|1(\.\d+)?)\b/.test(m.viewport)) fail(`desktop  zoom      viewport blocks zoom (${m.viewport})`);
  }
  if (label === 'phone') {
    const rf = await p.evaluate(reflow);
    views.reflow = rf;
    if (rf.wide) fail(`phone    reflow    the page scrolls sideways at 320px (${rf.scrollWidth}px wide): ${rf.culprits.join(', ')}`);
  }
  await p.close();
}

// 2. Readers' settings: each compared with the page as designed, so only new clipping is reported.
const baseline = {};
for (const [label, w] of [['desktop', 1280], ['phone', 320]]) {
  const p = await open(w);
  const cut = await p.evaluate(clipped);
  baseline[label] = new Set(cut.map((c) => c.el));
  for (const c of cut) {
    if (c.ellipsis) warn(`${label}  truncated ${c.el} "${c.text}" ends in an ellipsis — keep the full text available (title and an expand control or details view)`);
    else fail(`${label}  clipped   ${c.el} "${c.text}" is cut off as designed (box ${c.box}, text ${c.content})`);
  }
  await p.close();
}
const settings = {};
for (const [label, w] of [['desktop', 1280], ['phone', 320]]) {
  // Text spacing override (WCAG 1.4.12)
  let p = await open(w);
  await p.addStyleTag({ content: SPACING_CSS });
  await p.waitForTimeout(50);
  const sp = (await p.evaluate(clipped)).filter((c) => !baseline[label].has(c.el));
  await shot(p, `${label}-spacing`);
  for (const c of sp) fail(`${label}  spacing   ${c.el} "${c.text}" is cut off with the WCAG text-spacing override (box ${c.box}, text ${c.content})`);
  await p.close();
  // Text at 200% (the browser's text-size setting doubles rem-based text) (WCAG 1.4.4)
  p = await open(w);
  const before = await p.evaluate(() => [...document.body.querySelectorAll('*')].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => parseFloat(getComputedStyle(e).fontSize)));
  await p.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await p.waitForTimeout(50);
  const after = await p.evaluate(() => [...document.body.querySelectorAll('*')].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => ({ size: parseFloat(getComputedStyle(e).fontSize), el: e.tagName.toLowerCase() + (e.id ? '#' + e.id : e.classList.length ? '.' + e.classList[0] : ''), text: e.textContent.trim().slice(0, 30) })));
  const stuck = after.filter((a, i) => before[i] && a.size < before[i] * 1.5);
  const big = (await p.evaluate(clipped)).filter((c) => !baseline[label].has(c.el));
  await shot(p, `${label}-200`);
  if (label === 'desktop') for (const s of stuck.slice(0, 10)) fail(`desktop  text-size ${s.el} "${s.text}" doesn't grow with the reader's text size (px-sized text)`);
  for (const c of big) fail(`${label}  text-size ${c.el} "${c.text}" is cut off at 200% text (box ${c.box}, text ${c.content})`);
  settings[label] = { spacingClipped: sp, textSizeClipped: big, notGrowing: stuck.length };
  await p.close();
}
await browser.close();

const d = views.desktop.text;
const reading = d.filter((x) => x.reading);
const charsSeen = d.filter((x) => x.chars).map((x) => x.chars);
result.notes.push(`desktop: ${d.length} text elements · smallest ${Math.min(...d.map((x) => x.size))}px · reading text ${reading.length} (lowest line height ${reading.length ? Math.min(...reading.map((x) => x.ratio)) : '—'})${charsSeen.length ? ` · longest lines ~${Math.max(...charsSeen)} characters` : ''}`);
result.notes.push(`phone: ${views.phone.text.length} text elements · page ${views.reflow.wide ? 'scrolls sideways' : 'fits 320px'}`);
result.notes.push(`tabular figures: ${Object.keys(views.desktop.tabularOk).length ? Object.entries(views.desktop.tabularOk).map(([f, ok]) => `${f.split(' ').slice(2).join(' ').split(',')[0]} ${ok ? 'ok' : 'MISSING'}`).filter((v, i, a) => a.indexOf(v) === i).join(', ') : 'no tabular text on the page'}`);
result.notes.push(`cut off as designed: ${baseline.desktop.size + baseline.phone.size} · readers' settings: text-spacing override cuts off ${settings.desktop.spacingClipped.length + settings.phone.spacingClipped.length} more · 200% text cuts off ${settings.desktop.textSizeClipped.length + settings.phone.textSizeClipped.length} more · text not growing ${settings.desktop.notGrowing}`);

if (asJson) console.log(JSON.stringify({ ...result, views, settings }, null, 2));
else {
  for (const n of result.notes) console.log(n);
  for (const f of result.fails) console.log('✕ ' + f);
  for (const w of result.warns) console.log('! ' + w);
}
process.exit(result.fails.length ? 1 : 0);
