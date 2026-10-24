#!/usr/bin/env node
// Motion audit: opens an HTML page in a real browser twice — with full motion and with the reader asking for reduced
// motion (Chromium's prefers-reduced-motion emulation) — at 1280 and 320px, and records every animation and transition the
// page runs: on load, while hovering each control, while tabbing, and when each popover, dialog and --open selector opens
// and closes (each from a fresh page; "--open '#a then #b'" clicks a chain). Every animation is paused and stepped frame by
// frame (60 a second) to measure what it really does on screen:
//   - in reduced motion nothing may move (its box shifts, grows or turns by more than half a pixel) — WCAG 2.3.3;
//   - with full motion nothing travels further than the contract's limit, and every duration and curve is one of the jobs';
//   - nothing flashes: the luminance of each animated element, sampled frame by frame from screenshots, may not reverse
//     more than three times in any second — WCAG 2.3.1;
//   - nothing runs forever except the loading indicator, and the loading indicator doesn't turn in reduced motion — 2.2.2;
//   - focus rings appear at once (no transition or animation on outline or box-shadow when focus arrives) — 2.4.7;
//   - nothing moves with the scroll (parallax), smooth scrolling is off in reduced motion, no video plays by itself.
//
// Needs Playwright:  npm i -D playwright   (uses the Chromium that Playwright installs, or CHROMIUM_PATH)
// Usage: node tools/audit-motion.mjs page.html [--open "#button" ... or "#a then #b"] [--shots dir] [--prefix ds] [--contract file] [--json]
// Exit code 1 when anything fails (warnings don't fail).
import path from 'node:path';
import fs from 'node:fs';
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
const contractFile = opt('--contract') ?? path.join(HERE, '../out/default/ai/motion.contract.json');
if (!page) { console.error('Usage: node tools/audit-motion.mjs page.html [--open "#button" ...] [--shots dir] [--prefix ds] [--json]'); process.exit(2); }
const contract = fs.existsSync(contractFile) ? JSON.parse(fs.readFileSync(contractFile, 'utf8')) : null;
const MAX_DISTANCE = contract?.limits.maxDistance ?? 32;
const REDUCED_MAX = contract?.limits.reducedMaxMs ?? 100;
const FLASH_MIN = contract?.limits.flashMinMs ?? 334;
const FLASH_AREA = (341 * 256) / 4; // a quarter of a 10° field of view at typical viewing distance (WCAG's flash area)
const JOBS = contract?.jobs.map((j) => j.job) ?? ['feedback', 'change', 'floating', 'modal', 'highlight', 'loading'];

let chromium;
try { ({ chromium } = createRequire(path.join(process.cwd(), 'x.js'))('playwright')); } catch {
  try { ({ chromium } = await import('playwright')); } catch { console.error('Playwright is not installed. Run: npm i -D playwright'); process.exit(2); }
}

// ---------- runs inside the page ----------
function shared({ pre, jobs }) {
  window.__mq = window.__mq || {};
  const R = window.__mq;
  R.name = (el) => { if (!el || !el.tagName) return String(el); let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.'); const t = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24); return t ? `${s} "${t}"` : s; };
  R.shown = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const bez = { linear: [0, 0, 1, 1], ease: [0.25, 0.1, 0.25, 1], 'ease-in': [0.42, 0, 1, 1], 'ease-out': [0, 0, 0.58, 1], 'ease-in-out': [0.42, 0, 0.58, 1] };
  R.curve = (s) => { s = String(s).trim(); if (bez[s]) return bez[s].join(','); const m = /^cubic-bezier\(([^)]+)\)$/.exec(s); return m ? m[1].split(',').map((x) => +(+x).toFixed(3)).join(',') : s; };
  /** The jobs' durations and curves as this page's tokens resolve them, for the mode the page is in now. */
  R.jobs = () => {
    const probe = document.createElement('div'); document.body.append(probe);
    const out = { durations: new Set(), curves: new Set(), byJob: {} };
    for (const j of jobs) {
      const v = (part) => getComputedStyle(document.documentElement).getPropertyValue(`--${pre}-motion-${j}-${part}`).trim();
      const ms = (x) => { if (!x) return null; probe.style.transitionDuration = x; const d = getComputedStyle(probe).transitionDuration; return d.endsWith('ms') ? parseFloat(d) : parseFloat(d) * 1000; };
      const c = (x) => { if (!x) return null; probe.style.transitionTimingFunction = x; return R.curve(getComputedStyle(probe).transitionTimingFunction); };
      const rec = { duration: ms(v('duration')), easing: c(v('easing')), exit: ms(v('exit-duration')), exitEasing: c(v('exit-easing')), distance: parseFloat(v('distance')) || 0 };
      out.byJob[j] = rec;
      for (const d of [rec.duration, rec.exit]) if (d != null) out.durations.add(d);
      for (const e of [rec.easing, rec.exitEasing]) if (e) out.curves.add(e);
    }
    probe.remove();
    return { durations: [...out.durations], curves: [...out.curves], byJob: out.byJob };
  };
  R.anims = () => document.getAnimations().filter((a) => a.effect && a.effect.target && a.playState !== 'finished');
  /** Describe and measure one animation by pausing it and stepping through it at 60 frames a second. */
  R.inspect = (a, i) => {
    const el = a.effect.target, pseudo = a.effect.pseudoElement || null;
    const t = a.effect.getComputedTiming();
    const timing = a.effect.getTiming();
    const kind = a.constructor.name;
    const prop = kind === 'CSSTransition' ? a.transitionProperty : null;
    const kfs = a.effect.getKeyframes();
    const props = [...new Set(kfs.flatMap((k) => Object.keys(k).filter((x) => !['offset', 'computedOffset', 'easing', 'composite'].includes(x))))];
    let easing = kind === 'CSSTransition' ? R.curve(timing.easing) : R.curve(kfs.find((k) => k.easing)?.easing ?? 'ease');
    const dur = typeof t.duration === 'number' ? t.duration : 0;
    // What the CSS asked for (a transition reversed half-way is shortened by the browser, so its own timing isn't the job's).
    let declared = dur;
    {
      const cs = getComputedStyle(el, pseudo);
      const list = (x) => x.split(/,(?![^(]*\))/).map((y) => y.trim());
      const secs = (x) => (x.endsWith('ms') ? parseFloat(x) : parseFloat(x) * 1000);
      if (kind === 'CSSTransition') {
        const props = list(cs.transitionProperty), durs = list(cs.transitionDuration), eases = list(cs.transitionTimingFunction);
        let k = props.indexOf(prop); if (k < 0) k = props.indexOf('all');
        if (k >= 0) { declared = secs(durs[k % durs.length]); easing = R.curve(eases[k % eases.length]); }
      } else if (kind === 'CSSAnimation') {
        const names = list(cs.animationName), durs = list(cs.animationDuration), eases = list(cs.animationTimingFunction);
        const k = names.indexOf(a.animationName);
        if (k >= 0) { declared = secs(durs[k % durs.length]); easing = R.curve(eases[k % eases.length]); }
      }
    }
    const iterations = t.iterations;
    const loading = !!el.closest?.(`.${pre}-loading`) || el.classList?.contains(`${pre}-loading`);
    let move = 0, turn = 0;
    const discrete = kind === 'CSSTransition' && /^(display|overlay|visibility|content-visibility)$/.test(prop);
    if (!pseudo && dur > 0 && !discrete) {
      const wasState = a.playState, wasTime = a.currentTime;
      a.pause();
      const box = () => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, tf: `${cs.transform}|${cs.rotate}|${cs.scale}` }; };
      const steps = Math.min(240, Math.ceil(Math.min(dur, 2000) / (1000 / 60)));
      const samples = [];
      for (let k = 0; k <= steps; k++) { a.currentTime = (Math.min(dur, 2000) * k) / steps; samples.push(box()); }
      // How far the box travels: the spread of its centre and size over every frame where it is drawn at all.
      const drawn = samples.filter((s) => s.w > 0 && s.h > 0);
      const span = (k) => (drawn.length ? Math.max(...drawn.map((s) => s[k])) - Math.min(...drawn.map((s) => s[k])) : 0);
      move = Math.max(Math.hypot(span('x'), span('y')), span('w') / 2, span('h') / 2);
      // Turning or scaling: a rotate or scale property, or a transform matrix whose rotation or scale isn't the identity.
      const bent = (tf) => { const [m, rot, sc] = tf.split('|'); if (rot !== 'none' && !/^0(deg|turn|rad)?$/.test(rot)) return true; if (sc !== 'none' && sc.split(/\s+/).some((x) => Math.abs(parseFloat(x) - 1) > 0.01)) return true; const n = /^matrix\(([^)]+)\)$/.exec(m)?.[1].split(',').map(Number); if (!n) return false; return Math.abs(Math.hypot(n[0], n[1]) - 1) > 0.01 || Math.abs(Math.hypot(n[2], n[3]) - 1) > 0.01 || Math.abs(Math.atan2(n[1], n[0])) > 0.01; };
      turn = new Set(samples.map((s) => s.tf)).size > 1 && samples.some((s) => bent(s.tf)) ? 1 : 0;
      a.currentTime = wasTime ?? 0; if (wasState === 'running') a.play();
    }
    if (!el.dataset.mqId) el.dataset.mqId = String(document.querySelectorAll('[data-mq-id]').length);
    const rr = el.getBoundingClientRect();
    return { i, id: el.dataset.mqId, area: Math.round(rr.width * rr.height), name: R.name(el) + (pseudo ?? ''), kind, prop, name2: kind === 'CSSAnimation' ? a.animationName : null, props, duration: dur, declared, iterations, direction: timing.direction, easing, move: +move.toFixed(2), turn, loading, pseudo, brightness: props.some((x) => /^(opacity|color|background|backgroundColor|filter|visibility|borderColor|fill|outlineColor)$/.test(x)), focusRing: /^(outline|outline-offset|outline-width|outline-style|box-shadow)$/.test(prop ?? '') || props.some((x) => /^(outline|outlineOffset|outlineWidth|boxShadow)$/.test(x)) };
  };
  R.controls = () => [...document.querySelectorAll('a[href], button, [role="button"], [role="tab"], [role="menuitem"], summary, input, select, textarea, label, [tabindex="0"], .card, [data-hover]')].filter((el) => R.shown(el) && !el.closest('[popover]:not(:popover-open), dialog:not([open])')).slice(0, 40).map((el) => { if (!el.dataset.mqHover) el.dataset.mqHover = String(Math.random()).slice(2, 9); return `[data-mq-hover="${el.dataset.mqHover}"]`; });
  R.docPositions = () => [...document.querySelectorAll('body *')].filter((el) => { if (!R.shown(el) || el.getAnimations({ subtree: false }).length) return false; const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.position === 'sticky') return false; for (let a = el.parentElement; a; a = a.parentElement) { const p = getComputedStyle(a).position; if (p === 'fixed' || p === 'sticky') return false; } return true; }).slice(0, 400).map((el) => { if (!el.dataset.mqPos) el.dataset.mqPos = String(Math.random()).slice(2, 9); const r = el.getBoundingClientRect(); return { k: el.dataset.mqPos, name: R.name(el), y: r.top + scrollY, x: r.left + scrollX }; });
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
  return { w, h, bpp, px };
}
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
/** Mean relative luminance of a screenshot. */
const meanLum = (png) => { let s = 0, n = 0; for (let i = 0; i < png.px.length; i += png.bpp) { s += 0.2126 * lin(png.px[i]) + 0.7152 * lin(png.px[i + 1]) + 0.0722 * lin(png.px[i + 2]); n++; } return s / n; };
/**
 * Flashes in a luminance series sampled at 60Hz: a flash is a pair of opposing changes of at least 10% of the larger
 * luminance where the darker is below 0.80 (WCAG's general flash). Returns the most flashes in any one second.
 */
function flashesPerSecond(series) {
  const turns = [];
  let anchor = series[0], dir = 0;
  for (let i = 1; i < series.length; i++) {
    const v = series[i];
    const change = v - anchor;
    if (Math.abs(change) >= 0.1 * Math.max(v, anchor) && Math.min(v, anchor) < 0.8) {
      const d = Math.sign(change);
      if (d !== dir) { turns.push(i); dir = d; }
      anchor = v;
    } else if ((dir > 0 && v > anchor) || (dir < 0 && v < anchor)) anchor = v;
  }
  let best = 0;
  for (let i = 0; i < turns.length; i++) { const inSecond = turns.filter((t) => t >= turns[i] && t < turns[i] + 60).length; best = Math.max(best, Math.floor(inSecond / 2)); }
  return best;
}

// ---------- drive the browser ----------
const url = /^https?:/.test(page) ? page : 'file://' + path.resolve(page);
const browser = await chromium.launch({ args: ['--disable-background-networking', '--disable-component-update'], ...(process.env.CHROMIUM_PATH || fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' } : {}) });
const open = async (width, motion) => {
  const ctx = await browser.newContext({ viewport: { width, height: 800 }, deviceScaleFactor: 1, reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  p.load = async () => { await p.goto(url); await p.evaluate(() => document.fonts.ready); await p.evaluate(shared, { pre: prefix, jobs: JOBS }); };
  await p.load();
  p.done = () => ctx.close();
  return p;
};
const shot = async (p, label) => { if (!shots) return; fs.mkdirSync(shots, { recursive: true }); await p.screenshot({ path: path.join(shots, `${path.basename(page, '.html')}-${label}.png`) }); };

const result = { fails: [], warns: [], notes: [] };
const fail = (s) => result.fails.push(s), warn = (s) => result.warns.push(s), note = (s) => result.notes.push(s);
const counts = {};
const seen = new Map(); // one finding per animation per tag

/** Record what is animating now, measure it, and judge it. */
async function judge(p, tag, when, jobs, motion) {
  log(tag, when);
  await p.waitForTimeout(30);
  const list = await p.evaluate(() => window.__mq.anims().map((a, i) => window.__mq.inspect(a, i)));
  for (const a of list) {
    const key = `${tag}|${a.name}|${a.prop ?? a.name2}`; // each animation once per run, where it was first seen
    if (seen.has(key)) continue;
    seen.set(key, true);
    (counts[`animations/${tag}`] ??= 0); counts[`animations/${tag}`]++;
    const what = `${a.name} (${a.kind === 'CSSTransition' ? `transition of ${a.prop}` : `@keyframes ${a.name2}`}) ${when}`;
    const discrete = a.kind === 'CSSTransition' && /^(display|overlay|visibility|content-visibility)$/.test(a.prop);
    // Movement.
    if (motion === 'reduced' && (a.move > 0.5 || a.turn)) fail(`${tag} moves     ${what}: ${a.turn ? 'turns or scales' : `moves ${a.move}px`} with reduced motion (WCAG 2.3.3)`);
    if (motion === 'full' && a.move > MAX_DISTANCE + 0.5) fail(`${tag} distance  ${what}: travels ${a.move}px — over ${MAX_DISTANCE}px (MR-03)`);
    if (a.turn && !a.loading && motion === 'full') fail(`${tag} turns     ${what}: grows, shrinks or turns — only the loading indicator turns (MR-03)`);
    // Loops.
    if (a.iterations === Infinity && !a.loading) fail(`${tag} loop      ${what}: runs forever — only the loading indicator does (add a pause control, or stop it within 5 seconds) (WCAG 2.2.2)`);
    // Jobs: duration and curve.
    if (!discrete && !a.focusRing && a.duration > 0 && !a.loading && !/highlight/.test(a.name2 ?? '')) {
      const d = Math.round(a.declared);
      if (!jobs.durations.includes(d)) fail(`${tag} job       ${what}: ${d}ms is not a job's duration (${jobs.durations.sort((x, y) => x - y).join(', ')}ms in ${motion} motion) (MR-01)`);
      else if (!jobs.curves.includes(a.easing)) fail(`${tag} job       ${what}: curve ${a.easing} is not a job's curve (MR-01)`);
      if (motion === 'reduced' && d > REDUCED_MAX && !a.move) warn(`${tag} fade      ${what}: fades for ${d}ms — reduced motion fades in ${REDUCED_MAX}ms or less`);
    }
    if (a.focusRing) fail(`${tag} focus     ${what}: the focus ring animates — it must appear at once (MR-02, WCAG 2.4.7)`);
    // Repeated brightness changes: analytic first (cheap), then measured from screenshots below.
    if (a.brightness && a.duration > 0 && (a.iterations === Infinity || a.iterations > 1)) {
      const cycle = a.direction?.includes('alternate') ? a.duration * 2 : a.duration;
      if (cycle < FLASH_MIN) (a.area >= FLASH_AREA ? fail : warn)(`${tag} flash     ${what}: changes brightness every ${Math.round(cycle)}ms — more than three times a second${a.area >= FLASH_AREA ? ' (WCAG 2.3.1)' : ` over ${a.area}px², under WCAG's flash area — but nothing may blink (MR-07)`}`);
    }
  }
  return list;
}

/** Sample each repeating brightness animation from screenshots, frame by frame, and count flashes in any second. */
async function measureFlashes(p, tag, list) {
  const reps = list.filter((a) => a.brightness && a.duration > 0 && (a.iterations === Infinity || a.iterations > 1) && !a.pseudo).slice(0, 6);
  for (const a of reps) {
    const box = await p.evaluate((id) => { const el = document.querySelector(`[data-mq-id="${id}"]`); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: Math.max(0, r.left), y: Math.max(0, r.top), width: Math.max(1, Math.min(r.width, innerWidth - Math.max(0, r.left))), height: Math.max(1, Math.min(r.height, innerHeight - Math.max(0, r.top))) }; }, a.id);
    if (!box || box.width < 1 || box.height < 1) continue;
    const series = [];
    for (let k = 0; k <= 60; k++) {
      await p.evaluate(([i, t]) => { const an = window.__mq.anims()[i]; if (an) { an.pause(); an.currentTime = t; } }, [a.i, (1000 * k) / 60]);
      series.push(meanLum(decodePng(await p.screenshot({ clip: box }))));
    }
    await p.evaluate((i) => window.__mq.anims()[i]?.play(), a.i);
    const f = flashesPerSecond(series);
    (counts.flashes ??= {})[`${tag} ${a.name}`] = f;
    if (f > 3) (a.area >= FLASH_AREA ? fail : warn)(`${tag} flash     ${a.name}: ${f} flashes in one second, measured frame by frame${a.area >= FLASH_AREA ? ' (WCAG 2.3.1)' : ` over ${a.area}px², under WCAG's flash area — but nothing may blink (MR-07)`}`);
  }
}

/** Wait for every finite animation to end (at most 3 seconds). */
const settle = async (p) => { const t = Date.now(); const timedOut = await p.evaluate(() => Promise.race([Promise.all(window.__mq.anims().filter((a) => a.effect.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => {}))).then(() => false), new Promise((r) => setTimeout(() => r(window.__mq.anims().filter((a) => a.effect.getComputedTiming().endTime !== Infinity).map((a) => `${window.__mq.name(a.effect.target)} ${a.playState} ${a.transitionProperty ?? a.animationName}`)), 3000))])); log('settle', Date.now() - t, timedOut || ''); };
const log = (...x) => { if (process.env.MQ_DEBUG) console.error(...x); };

async function overlays(p, tag, jobs, motion) {
  await p.load();
  const invokers = await p.evaluate(() => [...document.querySelectorAll('[popovertarget]')].filter((b) => window.__mq.shown(b) && !b.closest('dialog, [popover]')).map((b) => { if (!b.id) b.id = `mq-inv-${Math.random().toString(36).slice(2, 8)}`; return { sel: `#${b.id}`, label: window.__mq.name(b) }; }));
  const list = [...invokers.map((s) => ({ ...s, kind: 'popover' })), ...opens.map((s) => ({ sel: s, label: s, kind: 'open' }))];
  let n = 0;
  for (const x of list) {
    // Each --open starts from the page as it loaded; popovers open and close in turn on the same page.
    if (x.kind === 'open') { await p.load(); await p.evaluate(() => window.scrollTo(0, 0)); }
    const steps = x.sel.split(/\s+then\s+/);
    let missing = null;
    for (const [i, s] of steps.entries()) {
      const el = await p.$(s);
      if (!el || !(await el.isVisible())) { missing = s; break; }
      await el.scrollIntoViewIfNeeded();
      await el.click();
      const lab = `on opening ${x.label.replace(/\s+then\s+/g, ' → ')}${steps.length > 1 ? ` (step ${i + 1})` : ''}`;
      await judge(p, tag, lab, jobs, motion);
      await p.waitForTimeout(40);
      await settle(p);
    }
    if (missing) { warn(`${tag} open      ${x.label}: ${missing} not found or not shown`); continue; }
    n++;
    if (motion === 'full' && p.viewportSize().width === 1280) await shot(p, `${motion}-${x.label.replace(/\s+then\s+/g, ' ').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60)}`);
    await p.keyboard.press('Escape');
    await judge(p, tag, `on closing ${x.label.replace(/\s+then\s+/g, ' → ')}`, jobs, motion);
    await settle(p);
  }
  counts[`overlays/${tag}`] = n;
}

/**
 * Record the viewport in real time for a second and a half — every frame the browser paints, through Chromium's
 * screencast (a screenshot loop if that isn't available) — and count flashes per 32px tile: this catches flashing made by
 * scripts (a class toggled on a timer), which no CSS animation shows. A tile flashes when its mean luminance swings both
 * ways by 10% of the brighter value, the darker below 0.80, more than three times in a second (WCAG's general flash).
 * The flashing tiles are added up: WCAG counts a flash when it covers more than a quarter of a 10° field of view —
 * 341 × 256px on a typical screen, so 21,824px² — and MR-07 forbids smaller ones too (a warning).
 */
async function recordFlashes(p, tag) {
  const TILE = 32;
  const frames = [];
  const grab = (png, t) => {
    const cols = Math.ceil(png.w / TILE), rows = Math.ceil(png.h / TILE), tiles = new Float64Array(cols * rows), n = new Float64Array(cols * rows);
    for (let y = 0; y < png.h; y += 2) for (let x = 0; x < png.w; x += 2) { const i = (y * png.w + x) * png.bpp, k = Math.floor(y / TILE) * cols + Math.floor(x / TILE); tiles[k] += 0.2126 * lin(png.px[i]) + 0.7152 * lin(png.px[i + 1]) + 0.0722 * lin(png.px[i + 2]); n[k]++; }
    for (let k = 0; k < tiles.length; k++) tiles[k] /= n[k] || 1;
    frames.push({ t, tiles, cols });
  };
  let how = 'screencast';
  try {
    const cdp = await p.context().newCDPSession(p);
    const pending = [];
    cdp.on('Page.screencastFrame', (f) => { pending.push(f); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
    const vp = p.viewportSize();
    await cdp.send('Page.startScreencast', { format: 'png', maxWidth: vp.width, maxHeight: vp.height, everyNthFrame: 1 });
    await p.waitForTimeout(1500);
    await cdp.send('Page.stopScreencast');
    await cdp.detach();
    if (pending.length < 2) throw new Error('too few frames');
    const t0 = pending[0].metadata.timestamp;
    for (const f of pending) grab(decodePng(Buffer.from(f.data, 'base64')), (f.metadata.timestamp - t0) * 1000);
  } catch {
    how = 'screenshots';
    frames.length = 0;
    const t0 = Date.now();
    while (Date.now() - t0 < 1500) grab(decodePng(await p.screenshot({ type: 'png' })), Date.now() - t0);
  }
  // The screencast sends a frame when something changes: hold each frame until the next, sampled at 60Hz.
  const span = Math.max(1000, frames[frames.length - 1].t);
  const count = frames[0].tiles.length;
  let flashing = 0, worst = 0;
  for (let k = 0; k < count; k++) {
    const series = [];
    for (let ms = 0, j = 0; ms <= span; ms += 1000 / 60) { while (j + 1 < frames.length && frames[j + 1].t <= ms) j++; series.push(frames[j].tiles[k]); }
    const f = flashesPerSecond(series);
    worst = Math.max(worst, f);
    if (f > 3) flashing++;
  }
  const area = flashing * TILE * TILE;
  (counts.recorded ??= {})[tag] = { how, frames: frames.length, flashingArea: area, worst };
  if (area >= FLASH_AREA) fail(`${tag} flash     ${area}px² of the screen flashes ${worst} times in a second, recorded in real time (${frames.length} frames) — over WCAG's area for a flash (${FLASH_AREA}px²) (WCAG 2.3.1)`);
  else if (area) warn(`${tag} flash     ${area}px² of the screen blinks ${worst} times in a second (recorded in real time) — smaller than WCAG's flash area, but nothing may blink (MR-07)`);
}

for (const motion of ['full', 'reduced']) for (const w of [1280, 320]) {
  const tag = `${motion}/${w}`;
  const p = await open(w, motion);
  const jobs = await p.evaluate(() => window.__mq.jobs());
  if (w === 1280) { (counts.jobs ??= {})[motion] = jobs.byJob; await shot(p, `${motion}-1280`); }
  // On load: what runs by itself.
  const onLoad = await judge(p, tag, 'on load', jobs, motion);
  await measureFlashes(p, tag, onLoad);
  await recordFlashes(p, tag);
  const videos = await p.evaluate(() => [...document.querySelectorAll('video')].filter((v) => !v.paused || v.autoplay).filter((v) => !v.controls).map((v) => window.__mq.name(v)));
  for (const v of videos) fail(`${tag} autoplay  ${v}: plays by itself with no controls (WCAG 2.2.2)`);
  const smooth = await p.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  if (motion === 'reduced' && smooth === 'smooth') fail(`${tag} scroll    html: scroll-behavior is smooth with reduced motion (MR-09)`);
  // Hover each control.
  const controls = await p.evaluate(() => window.__mq.controls());
  for (const s of controls) {
    const el = await p.$(s);
    if (!el) continue;
    try { await el.hover({ timeout: 500 }); } catch { continue; }
    const name = await p.evaluate((q) => window.__mq.name(document.querySelector(q)), s);
    await judge(p, tag, `on hovering ${name}`, jobs, motion);
  }
  await p.mouse.move(0, 0);
  // Tab through: focus rings must not animate in.
  await p.evaluate(() => document.activeElement?.blur());
  for (let i = 0; i < 30; i++) {
    await p.keyboard.press('Tab');
    const f = await p.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const ring = document.getAnimations().filter((x) => x.effect?.target === a && x.constructor.name === 'CSSTransition' && /^(outline|outline-offset|outline-width|outline-style|box-shadow)$/.test(x.transitionProperty)); return { name: window.__mq.name(a), ring: ring.map((x) => x.transitionProperty) }; });
    if (f?.ring.length) { fail(`${tag} focus     ${f.name}: its focus ring animates in (${f.ring.join(', ')}) — it must appear at once (MR-02, WCAG 2.4.7)`); }
  }
  // Scroll: does anything move against the scroll (parallax, scroll-linked motion)?
  // Measured at the top, scrolled down, and at the top again: what is somewhere else only while scrolled moves with the
  // scroll; what differs between the two measurements at the top was moving anyway (a layout change) and is left out.
  await p.load();
  await p.mouse.move(0, 0);
  await settle(p);
  const scrollable = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  if (scrollable > 40) {
    const at = (list) => new Map(list.map((x) => [x.k, x]));
    const top1 = at(await p.evaluate(() => window.__mq.docPositions()));
    await p.evaluate(() => window.scrollTo({ top: Math.min(600, document.documentElement.scrollHeight), behavior: 'instant' }));
    await p.waitForTimeout(80);
    const down = at(await p.evaluate(() => window.__mq.docPositions()));
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await p.waitForTimeout(80);
    const top2 = at(await p.evaluate(() => window.__mq.docPositions()));
    const d = (a, b) => Math.hypot(a.y - b.y, a.x - b.x);
    const moved = [...top1.values()].filter((b) => down.has(b.k) && top2.has(b.k) && d(b, top2.get(b.k)) <= 0.5 && d(b, down.get(b.k)) > 2);
    for (const m of moved.slice(0, 3)) fail(`${tag} scroll    ${m.name}: moves ${Math.round(d(m, down.get(m.k)))}px against the page as it scrolls (parallax or scroll-linked motion) (MR-09)`);
  }
  // Open every popover and each --open selector, from a fresh page each time.
  await overlays(p, tag, jobs, motion);
  await p.done();
}
await browser.close();

function merge(list) {
  const groups = new Map();
  for (const line of list) {
    const m = /^(\S+)\s+(\S+)\s+(.*)$/.exec(line);
    if (!m) { groups.set(line, { text: line, runs: [] }); continue; }
    const [, where, kind, rest] = m;
    const key = `${kind} ${rest.replace(/\d+(\.\d+)?(px|ms)/g, '#')}`;
    if (!groups.has(key)) groups.set(key, { kind, rest, runs: [] });
    groups.get(key).runs.push(where);
  }
  return [...groups.values()].map((g) => (g.runs.length ? `${g.kind.padEnd(9)} ${g.rest}${g.runs.length > 1 ? ' (numbers from the first)' : ''}  [${[...new Set(g.runs)].join(', ')}]` : g.text));
}
note(`motion audit · ${path.basename(page)} · full and reduced motion at 1280 and 320px · nothing moves in reduced motion · ≤ ${MAX_DISTANCE}px · flashes ≤ 3 a second`);
const tally = Object.entries(counts).filter(([k]) => k.startsWith('animations/')).map(([k, v]) => `${k.slice(11)} ${v}`).join(' · ');
if (tally) note(`animations recorded: ${tally}`);
if (asJson) console.log(JSON.stringify({ ...result, counts }, null, 2));
else {
  for (const n of result.notes) console.log(n);
  for (const f of merge(result.fails)) console.log('✕ ' + f);
  for (const w of merge(result.warns)) console.log('! ' + w);
  console.log(`\n${result.fails.length ? `${merge(result.fails).length} problem(s)` : 'no problems'}${result.warns.length ? ` · ${merge(result.warns).length} warning(s)` : ''}`);
}
process.exit(result.fails.length ? 1 : 0);
