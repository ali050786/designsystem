#!/usr/bin/env node
// Radius checker: finds radius-rule breaks in CSS, HTML and Tailwind/JSX against the radius contract.
// Usage: node src/lint/radius-lint.js <files or folders...> [--contract out/default/ai/radius.contract.json] [--json]
// Has no dependencies: copy this one file into any project and point --contract at the radius.contract.json you ship.
// Exit code 1 when any error is found. `ds-lint-ignore: RR-xx` anywhere in a file switches a rule off for that file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const loadContract = (file) => contractIndex(JSON.parse(fs.readFileSync(file, 'utf8')));

export function contractIndex(c) {
  const roles = c.roles.map((x) => x.job);
  const rings = c.tokens.filter((t) => t.of).map((t) => t.name.slice(6)); // "control-focus"
  return { c, p: c.prefix, roles, rings, known: new Set([...roles, ...rings]) };
}

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
const RADIUS_PROP = /^(-webkit-)?border(-(top|bottom)-(left|right)|-(start|end)-(start|end))?-radius$/;
const PHYSICAL_PROP = /^(-webkit-)?border-(top|bottom)-(left|right)-radius$/;
const STATE = /:(hover|focus-visible|focus-within|focus|active|checked|open)(?![\w-])|\[(aria-(pressed|selected|expanded|checked|current)|data-state|open)\b|\.(is-[a-z-]+|active|selected|open|checked|pressed)(?=$|[\s:.[,#>+~)])/;
const PSEUDO = /::?(before|after)\b/;
const FOCUS = /:(focus|focus-visible|focus-within)\b/;
const CHECKBOX = /checkbox/;
const BUTTON = /(^|[\s>+~,(])(button|\.btn|\.button)(?=$|[\s:.[,#>+~)])/;
const TW_SCALE = /^(xs|sm|md|lg|xl|2xl|3xl|4xl)$/;
const TW_ROUNDED = /^rounded(?:-(t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?(?:-(.+))?$/;

function parseDecls(body, baseLine) {
  const out = [];
  let offset = 0;
  for (const part of body.split(';')) {
    const i = part.indexOf(':');
    if (i > 0) out.push({ prop: part.slice(0, i).trim().toLowerCase(), value: part.slice(i + 1).trim().replace(/\s*!important\s*$/, ''), line: baseLine + body.slice(0, offset).split('\n').length - 1 + (part.match(/^\s*\n/) ? part.match(/^\s*/)[0].split('\n').length - 1 : 0) });
    offset += part.length + 1;
  }
  return out;
}

/** The shape roles a value uses (by job), the unknown ones, primitives, and the hard-coded lengths left after removing variables. */
function readValue(K, value) {
  const used = [...value.matchAll(new RegExp(`--${K.p}-shape-([a-z-]+)`, 'g'))].map((m) => m[1]);
  const tw = [...value.matchAll(/--radius-([a-z-]+)/g)].map((m) => m[1]);
  const prim = new RegExp(`--${K.p}-radius-`).test(value);
  const spacing = new RegExp(`--(${K.p}-space-|spacing-)`).test(value);
  const stripped = value.replace(/var\(\s*--[a-z0-9-]+\s*(,[^()]*)?\)/gi, ' ').replace(/(^|[\s(,])0(px|rem|em|%)?(?=$|[\s),])/g, ' ');
  const raw = [...stripped.matchAll(/(\d*\.?\d+)(px|rem|em|%|vw|vh)?/g)].filter((m) => +m[1] !== 0).map((m) => m[0]);
  return { used, tw, prim, spacing, raw, all: [...used, ...tw] };
}

function checkRadius(K, prop, value, sel, at, out, ctx) {
  const v = readValue(K, value);
  const roleList = K.roles.map((r) => `--${K.p}-shape-${r}`).join(', ');
  if (PHYSICAL_PROP.test(prop)) out.push({ ...at, rule: 'RR-06', level: 'error', message: `${prop} names a physical corner — it doesn't flip in right-to-left layouts.`, fix: `Use the logical corner (${prop.replace(/top-left/, 'start-start').replace(/top-right/, 'start-end').replace(/bottom-left/, 'end-start').replace(/bottom-right/, 'end-end')}), or the .${K.p}-join class for joined parts.` });
  if (v.prim) out.push({ ...at, rule: 'RR-02', level: 'error', message: `${prop}: ${value} uses a radius primitive.`, fix: `Pick the role by job: ${roleList}. Primitives don't change with the radius style.` });
  for (const u of [...v.used, ...v.tw]) if (!K.known.has(u)) out.push({ ...at, rule: 'RR-04', level: 'error', message: `${u} is not a shape role in this system.`, fix: `Use ${roleList} — or add a role in the engine config (radius.roles).` });
  if (v.raw.length) {
    const pill = v.raw.some((x) => /^(50%|100%|\d{3,}px)$/.test(x));
    out.push({ ...at, rule: 'RR-01', level: 'error', message: `${prop}: ${value} is hard-coded (${v.raw.join(', ')}) — it doesn't follow the radius style.`, fix: pill ? `Round ends are var(--${K.p}-shape-pill) (Tailwind rounded-pill).` : `Use a role: ${roleList}; inside a padded parent, max(0px, var(--${K.p}-shape-<parent>) - var(--${K.p}-space-inset-<size>)).` });
  }
  // Focus rings on their own layer take the -focus radius; -focus radii are for rings only.
  const ringRule = FOCUS.test(sel) && PSEUDO.test(sel);
  const usesRing = v.used.some((u) => u.endsWith('-focus'));
  if (ringRule && !usesRing && (v.used.length || v.raw.length)) out.push({ ...at, rule: 'RR-07', level: 'error', message: `A focus ring drawn on ${sel.match(PSEUDO)[0]} with the element's own radius — offset outwards, its corners pinch.`, fix: `Use var(--${K.p}-shape-<role>-focus) (the role's radius + the ring offset), or draw the ring as an outline, which follows the radius by itself.` });
  if (usesRing && !FOCUS.test(sel) && !/ring|focus/i.test(sel)) out.push({ ...at, rule: 'RR-07', level: 'error', message: `${value} is a focus-ring radius used as a shape.`, fix: `-focus radii are for rings only; use the role itself (${v.used.find((u) => u.endsWith('-focus')).replace(/-focus$/, '')}).` });
  // State rules must not change the radius.
  if (STATE.test(sel) && !ringRule) {
    const base = sel.replace(new RegExp(STATE.source, 'g'), '').replace(/\s+/g, ' ').trim();
    const was = ctx.base.get(base);
    if (was === undefined && PSEUDO.test(sel)) { /* a mark drawn only in that state (a radio's dot): nothing changes */ }
    else if (was === undefined) out.push({ ...at, rule: 'RR-09', level: 'warning', message: `${sel.trim()} sets a radius in a state rule.`, fix: 'Set the radius once on the element; state changes colour and the focus ring, not the corners.' });
    else if (was.replace(/\s/g, '') !== value.replace(/\s/g, '')) out.push({ ...at, rule: 'RR-09', level: 'error', message: `${sel.trim()} changes the radius (${was} → ${value}).`, fix: 'Keep the corners the same in every state; show the state with colour, the focus ring and text.' });
  }
  // Role by job: checkboxes take mark, buttons don't take pill.
  if (CHECKBOX.test(sel) && v.used.some((u) => ['control', 'container', 'surface', 'pill'].includes(u))) out.push({ ...at, rule: 'RR-04', level: 'error', message: `${sel.trim()} gives a checkbox the ${v.used.find((u) => ['control', 'container', 'surface', 'pill'].includes(u))} radius — in the round style it becomes a circle and reads as a radio button.`, fix: `Use var(--${K.p}-shape-mark).` });
  if (BUTTON.test(sel) && !CHECKBOX.test(sel) && v.used.includes('pill')) out.push({ ...at, rule: 'RR-04', level: 'warning', message: `${sel.trim()} has round ends — when its label wraps (a long translation, 200% text) the first and last letters fall outside the shape.`, fix: `Use var(--${K.p}-shape-control); keep the pill for labels that never wrap (badges, counters).` });
  return v;
}

export function lintText(K, text, file) {
  const ignored = new Set([...text.matchAll(/ds-lint-ignore:\s*([A-Z]{2}-\d{2}(?:[\s,]+[A-Z]{2}-\d{2})*)/g)].flatMap((m) => m[1].split(/[\s,]+/)));
  return lintCore(K, text, file).filter((x) => !ignored.has(x.rule));
}

function lintCore(K, text, file) {
  const out = [];
  if (/generated by ds-engine|Tailwind v4 theme for ds/.test(text.slice(0, 300))) return out;
  const ctx = { base: new Map() };
  const els = markupElements(text, file);
  const cssSources = /\.(css|scss)$/.test(file) ? [{ css: text, start: 0 }] : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ({ css: m[1], start: m.index + m[0].indexOf(m[1]) }));
  const rules = [];
  for (const src of cssSources) {
    const css = src.css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = m[1].trim();
      if (selector.startsWith('@')) continue;
      const line = lineOf(text, src.start + m.index + m[1].length);
      rules.push({ selector, line, decls: parseDecls(m[2], line) });
    }
  }
  // First pass: the radius each element has outside any state, to compare state rules with.
  for (const r of rules) {
    if (STATE.test(r.selector)) continue;
    for (const s of r.selector.split(',')) for (const d of r.decls) if (d.prop === 'border-radius') ctx.base.set(s.replace(/\s+/g, ' ').trim(), d.value);
  }
  for (const r of rules) {
    const sels = r.selector.split(',').map((s) => s.trim());
    for (const d of r.decls) {
      const at = { file, line: d.line, where: r.selector.slice(0, 60) };
      if (d.prop.startsWith('--')) {
        if (new RegExp(`^--${K.p}-(shape|radius)-`).test(d.prop)) out.push({ ...at, rule: 'RR-10', level: 'error', message: `${d.prop} is redefined in app code.`, fix: 'Change radius.style or radius.roles in the engine config and build, so the change is checked; switch one region with data-radius.' });
        continue;
      }
      if (!RADIUS_PROP.test(d.prop)) continue;
      // A rule with several selectors: check once with the joined selector, state per selector.
      const stateSel = sels.find((s) => STATE.test(s));
      checkRadius(K, d.prop, d.value, stateSel ?? r.selector, at, out, ctx);
    }
    const rad = r.decls.find((d) => d.prop === 'border-radius');
    const clip = r.decls.find((d) => /^overflow(-x|-y)?$/.test(d.prop) && /\b(hidden|clip)\b/.test(d.value));
    // Clipping matters only when something focusable sits inside: in a page we can look; in a stylesheet we can't.
    const cls = /\.([a-zA-Z][\w-]*)\s*$/.exec(r.selector.split(',')[0].trim())?.[1];
    const found = cls && els ? els.filter((e) => e.cls.includes(cls)) : [];
    const nothingFocusable = found.length > 0 && found.every((e) => !e.focusable);
    // In a stylesheet we can't look inside, so names of things that never hold controls are let through.
    if (rad && clip && !nothingFocusable && !/^\s*0(px)?\s*$/.test(rad.value) && !(!els && /(^|[\s.>#-])(img|image|avatar|thumb|video|picture|meter|progress)(?=$|[\s:.[,#>+~)])/i.test(r.selector))) out.push({ file, line: clip.line, where: r.selector.slice(0, 60), rule: 'RR-08', level: 'warning', message: `${r.selector.trim()} is rounded and clips its content (${clip.prop}: ${clip.value}) — the focus ring of anything within the ring's reach of its edge is cut off.`, fix: 'Give the flush child the container\'s radius on the corners it shares (nested radius) and remove the clipping; clip an image itself, not its card.' });
  }
  // Inline styles: the tag and classes stand in for the selector.
  for (const m of text.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)\sstyle\s*=\s*"([^"]*)"/g)) {
    const cls = /class(?:Name)?=["']([^"']*)/.exec(m[2])?.[1] ?? '';
    const type = /type=["']([a-z]+)/.exec(m[2])?.[1];
    const sel = `${m[1].toLowerCase()}${type ? `[type=${type}]` : ''}${cls ? '.' + cls.trim().split(/\s+/).join('.') : ''}`;
    const decls = parseDecls(m[3], lineOf(text, m.index));
    for (const d of decls) {
      const at = { file, line: lineOf(text, m.index), where: 'inline style' };
      if (d.prop.startsWith(`--${K.p}-shape-`) || d.prop.startsWith(`--${K.p}-radius-`)) out.push({ ...at, rule: 'RR-10', level: 'error', message: `${d.prop} is redefined inline.`, fix: 'Use data-radius on the element to switch style; change roles in the engine config.' });
      else if (RADIUS_PROP.test(d.prop)) checkRadius(K, d.prop, d.value, sel, at, out, ctx);
    }
    if (decls.some((d) => d.prop === 'border-radius' && !/^\s*0/.test(d.value)) && decls.some((d) => /^overflow(-x|-y)?$/.test(d.prop) && /hidden|clip/.test(d.value)) && !/^(img|video|picture)$/i.test(m[1])) out.push({ file, line: lineOf(text, m.index), where: 'inline style', rule: 'RR-08', level: 'warning', message: 'A rounded element that clips its content — focus rings at its edge are cut off.', fix: 'Give the flush child the nested radius and remove the clipping.' });
  }
  // Class lists: Tailwind rounded utilities.
  const component = /\.(jsx|tsx|vue|svelte)$/.test(file);
  const classLists = component
    ? [...text.matchAll(/(["'`])((?:(?!\1)[^\\\n])*)\1/g)].filter((m) => /(^|\s|:)rounded\b/.test(m[2]) && !/^[./@]|\s=>\s|^https?:/.test(m[2])).map((m) => ({ index: m.index, list: m[2] }))
    : [...text.matchAll(/class\s*=\s*["']([^"']*)["']/g)].map((m) => ({ index: m.index, list: m[1] }));
  for (const m of classLists) {
    const line = lineOf(text, m.index);
    const all = m.list.split(/\s+/).filter(Boolean);
    const tagM = /<([a-zA-Z][a-zA-Z0-9-]*)(?![^<]*>)[^<]*$/.exec(text.slice(0, m.index));
    const tag = tagM?.[1]?.toLowerCase() ?? '';
    const openTag = tagM ? text.slice(tagM.index, text.indexOf('>', m.index) + 1) : '';
    const base = all.map((c) => c.replace(/^([a-z0-9@[\]_&-]+:)+/, ''));
    let rounded = null;
    for (const [i, c] of base.entries()) {
      const raw = all[i];
      const w = { file, line, where: `class "${raw}"` };
      const variant = raw.slice(0, raw.length - c.length);
      const t = TW_ROUNDED.exec(c);
      if (!t) continue;
      const [, side, size] = t;
      if (variant && /(hover|focus|focus-visible|focus-within|active|checked|open|aria-[a-z[\]=-]+|data-[a-z[\]=-]+|group-[a-z-]+|peer-[a-z-]+):/.test(variant)) out.push({ ...w, rule: 'RR-09', level: 'error', message: `${raw} changes the radius with state.`, fix: 'Set the radius once; state changes colour and the focus ring, not the corners.' });
      if (side && /^(l|r|tl|tr|bl|br)$/.test(side)) out.push({ ...w, rule: 'RR-06', level: 'error', message: `${raw} names a physical side — it doesn't flip in right-to-left layouts.`, fix: `Use the logical form (rounded-${{ l: 's', r: 'e', tl: 'ss', tr: 'se', bl: 'es', br: 'ee' }[side]}-…), or the .${K.p}-join class for joined parts.` });
      if (!side && !variant && size !== 'none') rounded = rounded ?? (size ?? 'tw');
      if (size === undefined || TW_SCALE.test(size)) out.push({ ...w, rule: 'RR-03', level: 'error', message: `${raw} — Tailwind's own radius scale, removed in ds.`, fix: `Use the role by job: ${K.roles.map((r) => `rounded-${r}`).join(', ')}.` });
      else if (size === 'full') out.push({ ...w, rule: 'RR-03', level: 'error', message: `${raw} — not a ds role.`, fix: 'Use rounded-pill (shape.pill).' });
      else if (size.startsWith('[')) {
        const v = readValue(K, size.slice(1, -1).replace(/_/g, ' '));
        if (v.prim) out.push({ ...w, rule: 'RR-02', level: 'error', message: `${raw} uses a radius primitive.`, fix: 'Use a role (rounded-control …).' });
        else if (v.raw.length) out.push({ ...w, rule: 'RR-01', level: 'error', message: `${raw} is hard-coded — it doesn't follow the radius style.`, fix: `Use a role (rounded-${K.roles.join(', rounded-')}); inside a padded parent rounded-[max(0px,var(--radius-<parent>)-var(--spacing-inset-<size>))].` });
        for (const u of v.all) if (!K.known.has(u)) out.push({ ...w, rule: 'RR-04', level: 'error', message: `${u} is not a shape role.`, fix: `Use ${K.roles.join(', ')}.` });
      } else if (!K.known.has(size)) out.push({ ...w, rule: 'RR-04', level: 'error', message: `${raw} — "${size}" is not a shape role in this system.`, fix: `Use ${K.roles.map((r) => `rounded-${r}`).join(', ')} — or add a role in the engine config (radius.roles).` });
      else if (size.endsWith('-focus') && !/focus|ring/.test(m.list)) out.push({ ...w, rule: 'RR-07', level: 'error', message: `${raw} is a focus-ring radius used as a shape.`, fix: `Use rounded-${size.replace(/-focus$/, '')}.` });
      // Role by job.
      if (size && !side) {
        if (tag === 'input' && /type=["']?checkbox/.test(openTag) && ['control', 'container', 'surface', 'pill'].includes(size)) out.push({ ...w, rule: 'RR-04', level: 'error', message: `${raw} on a checkbox — in the round style it becomes a circle and reads as a radio button.`, fix: 'Use rounded-mark.' });
        if ((tag === 'button' || (tag === 'a' && base.some((x) => /^(btn|button)$/.test(x)))) && size === 'pill') out.push({ ...w, rule: 'RR-04', level: 'warning', message: `${raw} on a button — when its label wraps the first and last letters fall outside the shape.`, fix: 'Use rounded-control; keep the pill for labels that never wrap.' });
      }
    }
    if (rounded && rounded !== 'none' && base.some((c) => /^overflow(-[xy])?-(hidden|clip)$/.test(c)) && !/^(img|video|picture)$/.test(tag)) out.push({ file, line, where: `class "${m.list.slice(0, 50)}"`, rule: 'RR-08', level: 'warning', message: 'A rounded element that clips its content (overflow-hidden) — focus rings at its edge are cut off.', fix: 'Give the flush child the nested radius and remove overflow-hidden; clip an image itself.' });
  }
  // RR-05: a child that copies its padded parent's radius (markup only: Tailwind classes and inline styles).
  if (!/\.(css|scss)$/.test(file)) {
    const markup = text.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/g, (m) => m.replace(/[^\n]/g, ' '));
    const VOID = /^(input|img|br|hr|meta|link|source|area|col|embed|wbr|track|param)$/i;
    const stack = [];
    for (const m of markup.matchAll(/<(\/?)([a-zA-Z][\w.-]*)((?:[^<>"']|"[^"]*"|'[^']*')*?)(\/?)>/g)) {
      const [, close, tag, attrs, self] = m;
      if (close) { const i = stack.map((x) => x.tag).lastIndexOf(tag); if (i >= 0) stack.length = i; continue; }
      const cls = (/class(?:Name)?=["'{`]*([^"'`}]*)/.exec(attrs)?.[1] ?? '').split(/\s+/).filter((c) => !c.includes(':'));
      const style = /style=["']([^"']*)/.exec(attrs)?.[1] ?? '';
      const role = cls.map((c) => /^rounded-([a-z]+)$/.exec(c)?.[1]).find((x) => x && K.roles.includes(x)) ?? new RegExp(`border-radius:\\s*var\\(--${K.p}-shape-([a-z]+)\\)`).exec(style)?.[1] ?? null;
      const padded = cls.some((c) => /^p[xy]?-(?!0$)/.test(c)) || /(^|;)\s*padding(-inline|-block)?\s*:\s*(?!0[;\s]|0$)/.test(style);
      const parent = stack.at(-1);
      if (role && parent?.role === role && parent.padded && !['none', 'pill'].includes(role)) out.push({ file, line: lineOf(text, m.index), where: `<${tag}>`, rule: 'RR-05', level: 'warning', message: `<${tag}> copies its padded parent's radius (${role}) — the gap bulges at the corners.`, fix: `Inside a padded parent use max(0px, parent − padding): rounded-[max(0px,var(--radius-${role})-var(--spacing-inset-<size>))] or border-radius: max(0px, var(--${K.p}-shape-${role}) - var(--${K.p}-space-inset-<size>)).` });
      if (!self && !VOID.test(tag)) stack.push({ tag, role, padded });
    }
  }
  return out;
}

/** Elements in the markup with their classes and whether anything focusable is inside (null for stylesheets). */
function markupElements(text, file) {
  if (/\.(css|scss)$/.test(file)) return null;
  const markup = text.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/g, (m) => m.replace(/[^\n]/g, ' '));
  const VOID = /^(input|img|br|hr|meta|link|source|area|col|embed|wbr|track|param)$/i;
  const FOC = /^(a|button|input|select|textarea|summary|details)$/i;
  const all = [], stack = [];
  for (const m of markup.matchAll(/<(\/?)([a-zA-Z][\w.-]*)((?:[^<>"']|"[^"]*"|'[^']*')*?)(\/?)>/g)) {
    const [, close, tag, attrs, self] = m;
    if (close) { const i = stack.map((x) => x.tag).lastIndexOf(tag); if (i >= 0) stack.length = i; continue; }
    const focusable = (FOC.test(tag) && !(tag === 'a' && !/href=/.test(attrs))) || /tabindex=["']?0/.test(attrs);
    if (focusable) for (const x of stack) x.focusable = true;
    const el = { tag, cls: (/class(?:Name)?=["'{`]*([^"'`}]*)/.exec(attrs)?.[1] ?? '').split(/\s+/), focusable };
    all.push(el);
    if (!self && !VOID.test(tag)) stack.push(el);
  }
  return all;
}

const CHECKED = /\.(css|scss|html|htm|jsx|tsx|vue|svelte)$/;
export function expand(paths) {
  const out = [];
  const walk = (p) => {
    const st = fs.statSync(p);
    if (st.isDirectory()) { for (const n of fs.readdirSync(p)) if (!/^(node_modules|dist|build|out|\..*)$/.test(n)) walk(path.join(p, n)); }
    else if (CHECKED.test(p)) out.push(p);
  };
  for (const p of paths) walk(p);
  return out;
}

export function lintFiles(files, contractFile) {
  const K = loadContract(contractFile);
  return expand(files).flatMap((f) => lintText(K, fs.readFileSync(f, 'utf8'), f));
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('radius-lint.js')) {
  const args = process.argv.slice(2);
  const ci = args.indexOf('--contract');
  const contract = ci >= 0 ? args.splice(ci, 2)[1] : path.join(HERE, '../../out/default/ai/radius.contract.json');
  const asJson = args.includes('--json');
  const files = args.filter((a) => a !== '--json');
  const findings = lintFiles(files, contract);
  if (asJson) console.log(JSON.stringify(findings, null, 2));
  else {
    for (const x of findings) console.log(`${x.level === 'error' ? '✕' : '!'} ${x.file}:${x.line}  ${x.rule}  ${x.message}  → ${x.fix}`);
    const e = findings.filter((x) => x.level === 'error').length;
    console.log(`\n${expand(files).length} file(s) · ${e} error(s) · ${findings.length - e} warning(s)`);
  }
  process.exit(findings.some((x) => x.level === 'error') ? 1 : 0);
}
