#!/usr/bin/env node
// Colour checker: finds colour-rule breaks in CSS, HTML and Tailwind/JSX against the colour contract.
// Usage: node src/lint/color-lint.js <files or folders...> [--contract out/default/ai/color.contract.json] [--json]
// Has no dependencies: copy this one file into any project and point --contract at the color.contract.json you ship.
// Exit code 1 when any error is found.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const loadContract = (file) => contractIndex(JSON.parse(fs.readFileSync(file, 'utf8')));

export function contractIndex(c) {
  const byCss = new Map(c.roles.map((r) => [r.css, r]));
  const byTw = new Map(c.roles.map((r) => [r.name.split('.').slice(1).join('-'), r]));
  const pairs = new Set(c.pairs.map((p) => `${p.fg}|${p.bg}|${p.over ?? ''}`));
  const bad = new Map(c.notAllowed.map((b) => [`${b.fg}|${b.bg}`, b]));
  const byName = new Map(c.roles.map((r) => [r.name, r]));
  for (const [cssVar, role] of Object.entries(c.aliases ?? {})) if (byName.has(role)) byCss.set(cssVar, byName.get(role));
  return { c, byCss, byTw, pairs, bad, prefix: c.prefix };
}

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
// A fully transparent background (e.g. a ghost button at rest) shows whatever is behind it; the pair is decided there.
const transparent = (role) => /^#[0-9A-F]{6}00$/i.test(role.light) && /^#[0-9A-F]{6}00$/i.test(role.dark);

function checkPair(K, fgRole, bgRole, where, out, kind = 'text') {
  if (!fgRole || !bgRole) return;
  if (fgRole.exempt) return;
  const key = `${fgRole.name}|${bgRole.name}|`;
  if (K.pairs.has(key)) return;
  if (bgRole.kind === 'tint') return; // a tint's base is unknown in a single block; checked by CR-06 guidance
  const b = K.bad.get(`${fgRole.name}|${bgRole.name}`);
  const solid = /^color\.(bg\.(brand|success|warning|danger|info)(-hover|-pressed)?|action\.(primary|danger)\.bg(-hover|-pressed)?)$/.test(bgRole.name);
  const fix = b ? b.fix : solid ? bgRole.name.replace(/^color\.bg\.([a-z]+).*/, 'color.fg.on-$1').replace(/^color\.action\.([a-z]+)\.bg.*/, 'color.action.$1.fg') : 'a role listed for this background in the pair contract';
  out.push({ ...where, rule: solid ? 'CR-03' : 'CR-02', level: 'error',
    message: `${fgRole.name} on ${bgRole.name} is not an approved pair${b ? ` (measured ${b.light} : 1 Light, ${b.dark} : 1 Dark)` : ''}.`, fix: `Use ${fix}.` });
}

function varsIn(value, K) {
  const re = new RegExp(`var\\((--${K.prefix}-[a-z0-9-]+)`, 'g');
  return [...value.matchAll(re)].map((m) => m[1]);
}

function checkDeclarations(K, decls, where, selector, out) {
  // decls: [{prop, value, line}]
  let fg = null, bg = null, border = null;
  for (const d of decls) {
    const vals = varsIn(d.value, K);
    for (const v of vals) {
      if (!v.startsWith(`--${K.prefix}-color-`) && !K.byCss.has(v)) continue;
      const role = K.byCss.get(v);
      if (!role) {
        const prim = /-color-(brand|neutral|success|warning|danger|info|chart-\d)-(\d+|light|dark)$|-color-(white|black|transparent)$|-alpha-/.test(v);
        out.push({ ...where, line: d.line, rule: 'CR-01', level: 'error', message: prim ? `${v} is a raw shade, not a role.` : `${v} is not a colour role in this system.`, fix: 'Pick a role with the decision guide.' });
        continue;
      }
      if (/^(color|fill|-webkit-text-fill-color)$/.test(d.prop)) fg = role;
      else if (/^(background|background-color)$/.test(d.prop)) bg = role;
      else if (/^(border|border-color|border-(top|right|bottom|left)(-color)?|outline|outline-color|box-shadow)$/.test(d.prop)) border = role;
    }
    if (/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(/i.test(d.value) && !/^--/.test(d.prop)) {
      out.push({ ...where, line: d.line, rule: 'CR-01', level: 'error', message: `Raw colour in ${d.prop}: ${d.value.trim()}`, fix: 'Replace it with a colour role (var(--…-color-…)).' });
    }
    if (/^text-decoration(-line)?$/.test(d.prop) && /^\s*none\b/.test(d.value) && /(^|[\s,>+~(])a(?=$|[\s:.\[,#)])/.test(selector ?? '')) {
      out.push({ ...where, line: d.line, rule: 'CR-04', level: 'warning', message: 'Underline removed from links — they are then told apart by colour only.', fix: 'Keep links underlined (tokens.css does it); remove only for links whose role is obvious, like navigation and buttons.' });
    }
    if (/^outline$/.test(d.prop) && /^\s*(none|0)\s*$/.test(d.value) && !/:focus-visible/.test(selector ?? '')) {
      out.push({ ...where, line: d.line, rule: 'CR-09', level: 'error', message: 'Focus outline removed.', fix: 'Keep the built-in :focus-visible ring (border.focus, 2px, 2px offset).' });
    }
  }
  // A control's outline is measured against what surrounds it (WCAG 1.4.11), not its own fill — and that
  // surrounding background isn't known from one rule, so outlines are checked by CR-10 here and by the page audit.
  if (fg && bg && !transparent(bg)) checkPair(K, fg, bg, where, out);
  if (border && /^color\.border\.(subtle|default)$/.test(border.name) && /\b(input|textarea|select)\b|\[type=|\.input|\.field/.test(selector ?? '')) {
    out.push({ ...where, rule: 'CR-10', level: 'error', message: `${border.name} is decorative; an input needs an outline people can see (3 : 1).`, fix: 'Use color.border.input.' });
  }
}

function parseDecls(body, baseLine) {
  const out = [];
  let offset = 0;
  for (const part of body.split(';')) {
    const i = part.indexOf(':');
    if (i > 0) out.push({ prop: part.slice(0, i).trim().toLowerCase(), value: part.slice(i + 1), line: baseLine + body.slice(0, offset).split('\n').length - 1 });
    offset += part.length + 1;
  }
  return out;
}

export function lintText(K, text, file) {
  const out = [];
  // Generated token files define the roles from shades; they are the one place shades belong.
  const isTokens = /generated by ds-engine|Tailwind v4 theme for ds/.test(text.slice(0, 300));
  // CSS blocks (in .css files and <style> tags)
  const cssSources = file.endsWith('.css') ? [{ css: text, start: 0 }] : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ({ css: m[1], start: m.index + m[0].indexOf(m[1]) }));
  if (!isTokens) {
    for (const src of cssSources) {
      for (const m of src.css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selector = m[1].trim();
        if (selector.startsWith('@')) continue;
        const line = lineOf(text, src.start + m.index + m[1].length);
        checkDeclarations(K, parseDecls(m[2], line), { file, line, where: selector }, selector, out);
      }
    }
  }
  // Inline styles
  for (const m of text.matchAll(/style\s*=\s*"([^"]*)"/g)) {
    const line = lineOf(text, m.index);
    checkDeclarations(K, parseDecls(m[1], line), { file, line, where: 'inline style' }, '', out);
  }
  // Tailwind classes: bg-<role> + text-<role> / border-<role> in one class list
  // In JSX/TSX/Vue/Svelte, class lists are often built in expressions (ternaries, clsx), so every string literal
  // that looks like a class list is checked; in HTML, the class attributes.
  const component = /\.(jsx|tsx|vue|svelte)$/.test(file);
  const classLists = component
    ? [...text.matchAll(/(["'`])((?:(?!\1)[^\\\n])*)\1/g)].filter((m) => /(^|\s)(bg|text|border|fill|stroke|outline|ring)-/.test(m[2])).map((m) => ({ index: m.index, list: m[2] }))
    : [...text.matchAll(/class\s*=\s*["']([^"']*)["']/g)].map((m) => ({ index: m.index, list: m[1] }));
  for (const m of classLists) {
    const line = lineOf(text, m.index);
    const cls = m.list.split(/\s+/).filter((c) => !c.includes(':'));
    const pick = (pre) => cls.filter((c) => c.startsWith(pre)).map((c) => K.byTw.get(c.slice(pre.length))).filter(Boolean)[0];
    const bg = pick('bg-'), fg = pick('text-');
    const tag = component ? '' : (/<([a-zA-Z0-9-]+)[^<]*$/.exec(text.slice(0, m.index)) ?? [])[1];
    if (tag === 'a' && cls.includes('no-underline')) out.push({ file, line, where: 'class "no-underline"', rule: 'CR-04', level: 'warning', message: 'Underline removed from a link — it is then told apart by colour only.', fix: 'Remove no-underline unless the link is navigation or looks like a button.' });
    for (const c of cls) {
      if (/^(bg|text|border|fill|stroke|outline|ring)-\[#|^(bg|text|border)-(red|green|blue|gray|slate|zinc|neutral|stone|orange|amber|yellow|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|black|white)(-\d+)?$/.test(c)) {
        out.push({ file, line, where: `class "${c}"`, rule: 'CR-01', level: 'error', message: `${c} is a raw colour, not a role.`, fix: 'Use a role class such as bg-bg-surface or text-fg-default.' });
      }
      if (/^(outline-none|focus:outline-none)$/.test(c) && !cls.some((x) => x.startsWith('focus-visible:'))) {
        out.push({ file, line, where: `class "${c}"`, rule: 'CR-09', level: 'error', message: 'Focus outline removed.', fix: 'Remove outline-none; the base layer draws the focus ring.' });
      }
    }
    if (fg && bg && !transparent(bg)) checkPair(K, fg, bg, { file, line, where: 'class list' }, out);
  }
  // Positive/negative shown without an arrow or sign (heuristic, warning only).
  // Finds elements that get fg.positive/negative from an inline style, a Tailwind class, or a CSS class rule.
  const cls = { positive: [], negative: [] };
  for (const src of cssSources) {
    for (const m of src.css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      for (const n of ['positive', 'negative']) {
        if (new RegExp(`(^|;)\\s*color\\s*:\\s*var\\(--${K.prefix}-color-fg-${n}\\)`).test(m[2])) {
          const last = m[1].trim().split(/[\s>+~,]+/).pop();
          cls[n].push(...[...last.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((x) => x[1]));
        }
      }
    }
  }
  for (const n of ['positive', 'negative']) {
    const names = [`text-fg-${n}`, ...cls[n]].map((x) => x.replace(/[-]/g, '\\-')).join('|');
    const re = new RegExp(`<[a-zA-Z][^>]*(?:style="[^"]*--${K.prefix}-color-fg-${n}[^"]*"|class(?:Name)?=["'\`][^"'\`]*\\b(?:${names})\\b[^"'\`]*["'\`])[^>]*>([^<]{0,60})`, 'g');
    for (const m of text.matchAll(re)) {
      const shown = m[1].trim();
      if (shown && !/[▲▼↑↓+−-]|\b(up|down|rose|fell|increase|decrease|higher|lower)\b/i.test(shown)) out.push({ file, line: lineOf(text, m.index), where: `fg.${n}`, rule: 'CR-04', level: 'warning', message: `A ${n} change shown by colour only: "${shown}"`, fix: 'Add ▲/▼ or +/− (or the words up/down) so the meaning does not rely on colour.' });
    }
  }
  return out;
}

const CHECKED = /\.(css|scss|html|htm|jsx|tsx|vue|svelte)$/;
// Files and folders → the files to check (folders are walked, skipping node_modules, build output and dot-folders).
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

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('color-lint.js')) {
  const args = process.argv.slice(2);
  const ci = args.indexOf('--contract');
  const contract = ci >= 0 ? args.splice(ci, 2)[1] : path.join(HERE, '../../out/default/ai/color.contract.json');
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
