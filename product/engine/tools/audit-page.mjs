#!/usr/bin/env node
// Page audit: opens an HTML page in a real browser, in Light and Dark, and measures what people actually see —
// every piece of text against the background behind it, every form-control outline, and the keyboard focus ring.
// Complements the colour checker (which reads source code) by checking the rendered result.
//
// Needs Playwright:  npm i -D playwright   (uses the Chromium that Playwright installs, or CHROMIUM_PATH)
// Usage: node tools/audit-page.mjs page.html [--click "#open-menu,#open-dialog"] [--shots out-dir] [--json]
//   --click: also audit the page after clicking each selector (one state per selector) — menus, dialogs, popovers.
// Exit code 1 when anything fails.
import path from 'node:path';
import fs from 'node:fs';

// Opening and closing animate now (Motion foundation): wait for every finite animation to end before measuring (at most 2 seconds).
const settle = (p) => p.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 2000))]));
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const page = args.find((a, i) => !a.startsWith('--') && !['--shots', '--click'].includes(args[i - 1]));
const shots = opt('--shots');
const clicks = (opt('--click') ?? '').split(',').map((x) => x.trim()).filter(Boolean); // e.g. "#menu-button,#open-dialog"
const asJson = args.includes('--json');
if (!page) { console.error('Usage: node tools/audit-page.mjs page.html [--click "#open-menu,#open-dialog"] [--shots dir] [--json]'); process.exit(2); }

let chromium;
try { ({ chromium } = createRequire(path.join(process.cwd(), 'x.js'))('playwright')); } catch {
  try { ({ chromium } = await import('playwright')); } catch { console.error('Playwright is not installed. Run: npm i -D playwright'); process.exit(2); }
}

// Runs inside the page.
function auditInPage() {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (top, under) => { const a = top.a + under.a * (1 - top.a); if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }; return { r: (top.r * top.a + under.r * under.a * (1 - top.a)) / a, g: (top.g * top.a + under.g * under.a * (1 - top.a)) / a, b: (top.b * top.a + under.b * under.a * (1 - top.a)) / a, a }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hex = ({ r, g, b }) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  const name = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.'); return s; };
  const bgBehind = (el) => {
    const stack = [];
    let imageBehind = false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') imageBehind = true;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 }; // the browser's default canvas
    for (let i = stack.length - 1; i >= 0; i--) bg = over(stack[i], bg);
    return { bg, imageBehind };
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0; };
  const disabled = (el) => !!el.closest(':disabled, [aria-disabled="true"], [data-disabled]');
  const results = { text: [], controls: [], notes: [] };

  // Text
  // With a modal dialog open, only the dialog is in play — the page behind it is inert under the scrim.
  const scope = document.querySelector('dialog[open]:modal') || document.body;
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const el = t.parentElement;
    if (!el || seen.has(el) || !t.textContent.trim() || !visible(el) || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    const { bg, imageBehind } = bgBehind(el);
    const fg = over(parse(cs.color), bg);
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
    const large = size >= 24 || (bold && size >= 18.66);
    const min = large ? 3 : 4.5;
    const r = ratio(fg, bg);
    results.text.push({ el: name(el), text: t.textContent.trim().slice(0, 40), fg: hex(fg), bg: hex(bg), ratio: +r.toFixed(2), min, exempt: disabled(el), imageBehind, ok: r >= min || disabled(el) });
  }
  // Outlines that identify a control (WCAG 1.4.11)
  // Native checkboxes, radios and sliders are drawn by the browser (accent-color), not by CSS borders — check those by eye.
  for (const el of scope.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]), select, textarea')) {
    if (!visible(el) || disabled(el)) continue;
    const cs = getComputedStyle(el);
    const bw = parseFloat(cs.borderTopWidth);
    const { bg: outside } = bgBehind(el.parentElement);
    const border = over(parse(cs.borderTopColor), outside);
    const own = parse(cs.backgroundColor);
    const fill = own && own.a > 0 ? over(own, outside) : outside;
    // The control is visible if its outline OR its fill stands out 3:1 from what surrounds it.
    const rb = bw > 0 ? ratio(border, outside) : 0, rf = ratio(fill, outside);
    results.controls.push({ el: name(el), border: hex(border), around: hex(outside), ratio: +Math.max(rb, rf).toFixed(2), min: 3, ok: Math.max(rb, rf) >= 3 });
  }
  return results;
}

function focusInPage() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const cs = getComputedStyle(el);
  const w = parseFloat(cs.outlineWidth) || 0;
  const shadow = cs.boxShadow && cs.boxShadow !== 'none';
  const n = el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
  // Focus inside a frame belongs to the framed page, which draws its own rings: audit that page on its own.
  if (el.tagName === 'IFRAME') return { el: n, outline: 'focus moves into the frame', offset: '', ok: true, frame: true };
  return { el: n, outline: cs.outlineStyle !== 'none' ? `${cs.outlineWidth} ${cs.outlineStyle}` : 'none', offset: cs.outlineOffset, ok: (cs.outlineStyle !== 'none' && w >= 2) || shadow };
}

const url = /^https?:/.test(page) ? page : 'file://' + path.resolve(page);
const browser = await chromium.launch(process.env.CHROMIUM_PATH || fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' } : {});
const report = {};
const shot = async (p, name) => {
  if (!shots) return;
  fs.mkdirSync(shots, { recursive: true });
  // Full-page captures repeat sticky headers mid-page; pin them to the top for the picture only.
  await p.evaluate(() => { for (const el of document.querySelectorAll('*')) if (getComputedStyle(el).position === 'sticky') el.style.position = 'relative'; });
  const modal = await p.evaluate(() => !!document.querySelector('dialog[open]:modal')); // a modal is shown as people see it: the viewport
  await p.screenshot({ path: path.join(shots, `${path.basename(page, '.html')}-${name}.png`), fullPage: !modal });
};
for (const theme of ['light', 'dark']) {
  for (const state of [null, ...clicks]) {
    const p = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: theme });
    await p.goto(url);
    await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await p.waitForTimeout(150);
    if (state) { await p.click(state); await p.waitForTimeout(200); await settle(p); }
    const r = await p.evaluate(auditInPage);
    r.focus = [];
    if (!state) {
      for (let i = 0; i < 40; i++) {
        await p.keyboard.press('Tab');
        const f = await p.evaluate(focusInPage);
        if (!f || r.focus.some((x) => x.el === f.el)) { if (!f) break; continue; }
        r.focus.push(f);
      }
      await p.evaluate(() => document.activeElement?.blur());
    }
    const key = state ? `${theme} · after clicking ${state}` : theme;
    await shot(p, state ? `${theme}-${state.replace(/[^a-z0-9]+/gi, '')}` : theme);
    report[key] = r;
    await p.close();
  }
}
await browser.close();

const fails = [];
for (const [theme, r] of Object.entries(report)) {
  for (const x of r.text) if (!x.ok) fails.push(`${theme}  text     ${x.el} "${x.text}"  ${x.fg} on ${x.bg} = ${x.ratio} : 1 (needs ${x.min})`);
  for (const x of r.controls) if (!x.ok) fails.push(`${theme}  control  ${x.el}  ${x.border} around ${x.around} = ${x.ratio} : 1 (needs 3)`);
  for (const x of r.focus) if (!x.ok) fails.push(`${theme}  focus    ${x.el}  no visible focus ring (${x.outline})`);
  for (const x of r.text) if (x.imageBehind) fails.push(`${theme}  check    ${x.el} "${x.text}" sits on a background image — check it by eye`);
}
if (asJson) console.log(JSON.stringify(report, null, 2));
else {
  for (const [theme, r] of Object.entries(report)) {
    const t = r.text.filter((x) => !x.exempt), low = t.reduce((m, x) => (x.ratio < m.ratio ? x : m), { ratio: Infinity });
    console.log(`${theme}  text ${t.filter((x) => x.ok).length}/${t.length} pass (lowest ${low.ratio} : 1, ${low.el})  ·  controls ${r.controls.filter((x) => x.ok).length}/${r.controls.length}${r.focus.length ? `  ·  focus ring ${r.focus.filter((x) => x.ok).length}/${r.focus.length}` : ''}`);
  }
  for (const f of fails) console.log('✕ ' + f);
}
process.exit(fails.some((f) => !f.includes('  check  ')) ? 1 : 0);
