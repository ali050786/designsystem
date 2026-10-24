#!/usr/bin/env node
// Spacing audit: opens an HTML page in a real browser in each density (comfortable, default, compact), at desktop and
// phone width, and measures what people get: every pointer target against WCAG 2.5.8 (24 × 24px, or the spacing
// exception), controls against the density's control height, spacing that doesn't follow density, sideways scrolling,
// and labels that no longer fit their control at 200% text in compact.
// Complements the spacing checker (which reads source code) by checking the rendered result.
//
// Needs Playwright:  npm i -D playwright   (uses the Chromium that Playwright installs, or CHROMIUM_PATH)
// Usage: node tools/audit-space.mjs page.html [--shots out-dir] [--prefix ds] [--json]
// Exit code 1 when anything fails (warnings don't fail).
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const page = args.find((a, i) => !a.startsWith('--') && !['--shots', '--prefix'].includes(args[i - 1]));
const shots = opt('--shots');
const prefix = opt('--prefix') ?? 'ds';
const asJson = args.includes('--json');
if (!page) { console.error('Usage: node tools/audit-space.mjs page.html [--shots dir] [--prefix ds] [--json]'); process.exit(2); }

let chromium;
try { ({ chromium } = createRequire(path.join(process.cwd(), 'x.js'))('playwright')); } catch {
  try { ({ chromium } = await import('playwright')); } catch { console.error('Playwright is not installed. Run: npm i -D playwright'); process.exit(2); }
}

const DENSITIES = ['comfortable', 'default', 'compact'];
const MIN = 24;

// ---------- runs inside the page ----------
function measure({ prefix, MIN }) {
  const name = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.'); const t = (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 24); return t ? `${s} "${t}"` : s; };
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const SEL = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=checkbox], [role=radio], [role=switch], [role=tab], [role=menuitem], [role=option], [tabindex]:not([tabindex="-1"])';
  const root = getComputedStyle(document.documentElement);
  const ctlVar = `--${prefix}-size-control-height`;
  const targets = [];
  const seen = new Set();
  for (const el of document.querySelectorAll(SEL)) {
    if (el.disabled || el.closest('[aria-hidden="true"], [inert]')) continue;
    let node = el, how = '';
    // A checkbox or radio with a label: the label toggles it too, so they are one target.
    if (el.matches('input[type=checkbox], input[type=radio]')) {
      const lab = el.closest('label') || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`));
      if (lab) { node = lab; how = 'with its label'; }
    }
    if (seen.has(node) || !visible(node)) continue;
    seen.add(node);
    const r = node.getBoundingClientRect();
    let box = { x: r.left, y: r.top, w: r.width, h: r.height };
    if (how) { const ir = el.getBoundingClientRect(); const x1 = Math.min(r.left, ir.left), y1 = Math.min(r.top, ir.top); box = { x: x1, y: y1, w: Math.max(r.right, ir.right) - x1, h: Math.max(r.bottom, ir.bottom) - y1 }; }
    // WCAG's inline exception: a link inside a sentence takes its size from the line of text.
    let inline = false;
    if (getComputedStyle(node).display === 'inline') {
      let block = node.parentElement;
      while (block && getComputedStyle(block).display === 'inline') block = block.parentElement;
      if (block && block.textContent.trim().length > node.textContent.trim().length + 2) inline = true;
    }
    const cs = getComputedStyle(node);
    const control = node.matches('button, select, textarea, summary, [role=button], [role=tab], input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color])');
    const ctl = parseFloat(cs.getPropertyValue(ctlVar)) || null;
    targets.push({ el: name(node), how, inline, control, ctl, x: +box.x.toFixed(1), y: +box.y.toFixed(1), w: +box.w.toFixed(1), h: +box.h.toFixed(1) });
  }
  // WCAG 2.5.8 per target: big enough, or undersized but spaced (a 24px circle on each undersized target's centre
  // must not touch another target or another undersized target's circle), or inline in a sentence.
  const small = (t) => t.w < MIN - 0.01 || t.h < MIN - 0.01;
  const centre = (t) => [t.x + t.w / 2, t.y + t.h / 2];
  const distToRect = ([cx, cy], t) => Math.hypot(Math.max(t.x - cx, 0, cx - (t.x + t.w)), Math.max(t.y - cy, 0, cy - (t.y + t.h)));
  for (const t of targets) {
    if (!small(t)) { t.verdict = 'ok'; continue; }
    if (t.inline) { t.verdict = 'inline'; continue; }
    const c = centre(t);
    const hit = targets.find((o) => o !== t && (small(o) && !o.inline ? Math.hypot(c[0] - centre(o)[0], c[1] - centre(o)[1]) < MIN - 0.01 : distToRect(c, o) < MIN / 2 - 0.01));
    t.verdict = hit ? 'fail' : 'spaced';
    if (hit) t.near = hit.el;
  }
  // Spacing per element, to see what follows density (padding and gaps; margins are often auto).
  const els = [...document.body.querySelectorAll('*')];
  const spacing = els.map((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return null;
    const inRegion = !!el.parentElement?.closest('[data-density]:not(html)') || (el.hasAttribute('data-density') && el !== document.documentElement);
    return { el: name(el), inRegion, v: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'row-gap', 'column-gap'].map((p) => parseFloat(cs.getPropertyValue(p)) || 0) };
  });
  const layout = ['margin', 'gutter', 'dense-gutter', 'header-height'].map((k) => parseFloat(root.getPropertyValue(`--${prefix}-layout-${k}`))).filter((x) => !Number.isNaN(x));
  return { targets, spacing, layout, ctlRoot: parseFloat(root.getPropertyValue(ctlVar)) || null };
}

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

// Controls whose label no longer fits: the box is shorter than one line of its text, or its content spills out.
function spill() {
  const out = [];
  for (const el of document.querySelectorAll('button, select, summary, [role=button], [role=tab], input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=hidden])')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || el.closest('[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    const lh = cs.lineHeight === 'normal' ? parseFloat(cs.fontSize) * 1.2 : parseFloat(cs.lineHeight);
    const text = (el.textContent || el.value || el.getAttribute('placeholder') || '').trim();
    if (!text) continue;
    const over = el.tagName !== 'INPUT' && el.tagName !== 'SELECT' && el.scrollHeight > el.clientHeight + 1;
    if (r.height + 0.5 < lh || over) out.push({ el: el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.classList.length ? '.' + el.classList[0] : '') + ` "${text.slice(0, 20)}"`, box: Math.round(r.height), line: Math.round(lh), content: el.scrollHeight });
  }
  return out;
}

// ---------- drive the browser ----------
const url = /^https?:/.test(page) ? page : 'file://' + path.resolve(page);
const browser = await chromium.launch(process.env.CHROMIUM_PATH || fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' } : {});
const open = async (width, density, extraCss) => {
  const p = await browser.newPage({ viewport: { width, height: 900 } });
  await p.goto(url);
  await p.evaluate((d) => { document.documentElement.setAttribute('data-density', d); }, density);
  if (extraCss) await p.addStyleTag({ content: extraCss });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(80);
  return p;
};
const shot = async (p, label) => {
  if (!shots) return;
  fs.mkdirSync(shots, { recursive: true });
  await p.evaluate(() => { for (const el of document.querySelectorAll('*')) if (getComputedStyle(el).position === 'sticky') el.style.position = 'relative'; });
  await p.screenshot({ path: path.join(shots, `${path.basename(page, '.html')}-${label}.png`), fullPage: true });
};
const result = { fails: [], warns: [], notes: [] };
const fail = (s) => result.fails.push(s), warn = (s) => result.warns.push(s);
const runs = {};
for (const d of DENSITIES) {
  for (const [label, w] of [['desktop', 1280], ['phone', 320]]) {
    const p = await open(w, d);
    const m = await p.evaluate(measure, { prefix, MIN });
    const rf = label === 'phone' ? await p.evaluate(reflow) : null;
    runs[`${d}/${label}`] = { ...m, reflow: rf };
    if (label === 'desktop' || d === 'compact') await shot(p, `${d}-${label}`);
    await p.close();
    const tag = `${d.padEnd(11)} ${label.padEnd(7)}`;
    for (const t of m.targets) {
      if (t.verdict === 'fail') fail(`${tag} target    ${t.el}${t.how ? ` (${t.how})` : ''} is ${t.w}×${t.h}px and too close to ${t.near} (WCAG 2.5.8: 24×24px, or a 24px circle that touches nothing)`);
      else if (t.verdict === 'spaced') warn(`${tag} target    ${t.el} is ${t.w}×${t.h}px — passes only on spacing; ds asks for 24px on its own (SR-05)`);
      if (t.control && t.ctl && !t.inline && t.h + 0.5 < t.ctl) warn(`${tag} height    ${t.el} is ${t.h}px tall — shorter than size.control.height in ${d} (${t.ctl}px)`);
    }
    if (rf?.wide) fail(`${tag} reflow    the page scrolls sideways at 320px (${rf.scrollWidth}px wide): ${rf.culprits.join(', ')}`);
  }
}
// Spacing that doesn't follow density (desktop): non-zero padding or gaps identical in all three densities.
{
  const [a, b, c] = DENSITIES.map((d) => runs[`${d}/desktop`].spacing);
  const layout = new Set(runs['default/desktop'].layout.map((x) => Math.round(x)));
  const stuck = [];
  if (a.length === b.length && b.length === c.length) {
    for (let i = 0; i < b.length; i++) {
      if (!a[i] || !b[i] || !c[i] || b[i].inRegion || /^(option|optgroup|legend|datalist)\b/.test(b[i].el)) continue; // browser-drawn parts
      const props = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'row-gap', 'column-gap'];
      const same = props.filter((_, j) => b[i].v[j] > 1 && a[i].v[j] === b[i].v[j] && b[i].v[j] === c[i].v[j] && !layout.has(Math.round(b[i].v[j])));
      if (same.length) stuck.push(`${b[i].el}: ${same.map((p) => `${p} ${b[i].v[props.indexOf(p)]}px`).join(', ')}`);
    }
  }
  for (const s of stuck.slice(0, 12)) warn(`all         desktop density   ${s} — the same in every density (hand-set, a primitive or a browser default)`);
  if (stuck.length > 12) warn(`all         desktop density   … and ${stuck.length - 12} more`);
  result.stuck = stuck.length;
}
// 200% text in compact: the tightest controls with the biggest text.
for (const [label, w] of [['desktop', 1280], ['phone', 320]]) {
  const p = await open(w, 'compact', 'html { font-size: 200% !important; }');
  const s = await p.evaluate(spill);
  await shot(p, `compact-${label}-200`);
  await p.close();
  for (const x of s) fail(`compact     ${label.padEnd(7)} text-size ${x.el} no longer fits at 200% text (box ${x.box}px, line ${x.line}px) — use min-height, not height (SR-06)`);
}
await browser.close();

for (const d of DENSITIES) {
  const t = runs[`${d}/desktop`].targets.filter((x) => !x.inline);
  const smallest = t.length ? t.reduce((m, x) => (Math.min(x.w, x.h) < Math.min(m.w, m.h) ? x : m)) : null;
  const ph = runs[`${d}/phone`];
  result.notes.push(`${d.padEnd(11)} ${t.length} targets (+${runs[`${d}/desktop`].targets.length - t.length} links in sentences) · smallest ${smallest ? `${Math.min(smallest.w, smallest.h)}px (${smallest.el})` : '—'} · control height ${runs[`${d}/desktop`].ctlRoot ?? '?'}px · phone ${ph.reflow?.wide ? 'scrolls sideways' : 'fits 320px'}`);
}
result.notes.push(`spacing that doesn't follow density: ${result.stuck} element(s)`);

// The same finding in several runs prints once, with where it happened ("every density, desktop and phone").
function merge(list) {
  const groups = new Map();
  for (const line of list) {
    const m = /^(\S+)\s+(\S+)\s+(\S+)\s+(.*)$/.exec(line);
    if (!m) { groups.set(line, { text: line, runs: [] }); continue; }
    const [, dens, width, kind, rest] = m;
    const key = `${kind} ${rest.replace(/ in (comfortable|default|compact) \(\d+px\)/, ' in this density')}`;
    if (!groups.has(key)) groups.set(key, { kind, rest, runs: [] });
    groups.get(key).runs.push([dens, width]);
  }
  return [...groups.values()].map((g) => {
    if (!g.runs.length) return g.text;
    const ds = [...new Set(g.runs.map((r) => r[0]))], ws = [...new Set(g.runs.map((r) => r[1]))];
    const where = `${ds.includes('all') || ds.length === 3 ? 'every density' : ds.join(', ')}, ${ws.length === 2 ? 'desktop and phone' : ws[0]}`;
    const rest = ds.length > 1 ? g.rest.replace(/ in (comfortable|default|compact) \((\d+)px\)/, ' in that density') : g.rest;
    return `${g.kind.padEnd(9)} ${rest}  [${where}]`;
  });
}
if (asJson) console.log(JSON.stringify({ ...result, runs: Object.fromEntries(Object.entries(runs).map(([k, v]) => [k, { targets: v.targets, reflow: v.reflow }])) }, null, 2));
else {
  for (const n of result.notes) console.log(n);
  for (const f of merge(result.fails)) console.log('✕ ' + f);
  for (const w of merge(result.warns)) console.log('! ' + w);
}
process.exit(result.fails.length ? 1 : 0);
