#!/usr/bin/env node
// Spacing checker: finds spacing-rule breaks in CSS, HTML and Tailwind/JSX against the spacing contract.
// Usage: node src/lint/space-lint.js <files or folders...> [--contract out/default/ai/spacing.contract.json] [--json]
// Has no dependencies: copy this one file into any project and point --contract at the spacing.contract.json you ship.
// Exit code 1 when any error is found.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const loadContract = (file) => contractIndex(JSON.parse(fs.readFileSync(file, 'utf8')));

export function contractIndex(c) {
  const p = c.prefix;
  const byVar = new Map(c.tokens.map((t) => [t.cssVar, t]));
  const byTw = new Map();
  for (const t of c.tokens) for (const u of t.tailwind) byTw.set(u, t);
  const prims = new Set(c.scale.map((s) => s.cssVar));
  const twFamily = Object.fromEntries(Object.entries(c.families).map(([k, f]) => [k, f.tailwind]));
  return { c, p, byVar, byTw, prims, twFamily, densities: c.densities, min: c.limits.targetMin };
}

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
const SAFE = /^\s*(inherit|initial|unset|revert|revert-layer|auto)\s*$/;
// Things people press: a fixed height or a size under the target minimum matters here.
const CONTROL_SEL = /(^|[\s>+~,(])(button|input|select|textarea|summary)(?=$|[\s:.[,#>+~)])|\.(btn|button|icon-button|icon-btn|chip|tab|toggle|close|menu-item|checkbox|radio|switch|pill-button)\b|\[role=["']?(button|tab|checkbox|radio|switch|menuitem)/;
const DENSITY_CLASS = /\.(compact|dense|condensed|comfortable|cozy|is-compact|is-dense|density-[a-z]+|[a-z0-9-]+--(compact|dense|comfortable))\b/;
// Which families each spacing property takes. Shorthands are split by position below.
const PROP_FAMILY = {
  'padding-top': ['inset'], 'padding-right': ['inset'], 'padding-bottom': ['inset'], 'padding-left': ['inset'],
  'padding-block': ['inset'], 'padding-inline': ['inset'], 'padding-block-start': ['inset'], 'padding-block-end': ['inset'], 'padding-inline-start': ['inset'], 'padding-inline-end': ['inset'],
  'margin-top': ['stack'], 'margin-bottom': ['stack'], 'margin-block': ['stack'], 'margin-block-start': ['stack'], 'margin-block-end': ['stack'],
  'margin-left': ['inline'], 'margin-right': ['inline'], 'margin-inline': ['inline'], 'margin-inline-start': ['inline'], 'margin-inline-end': ['inline'],
  'row-gap': ['stack'], 'grid-row-gap': ['stack'], 'column-gap': ['inline'], 'grid-column-gap': ['inline'],
};
const SHORTHAND = {
  padding: () => ['inset', 'inset', 'inset', 'inset'],
  margin: (n) => (n === 1 ? ['stack|inline'] : n === 2 ? ['stack', 'inline'] : n === 3 ? ['stack', 'inline', 'stack'] : ['stack', 'inline', 'stack', 'inline']),
  gap: (n) => (n === 1 ? ['stack|inline'] : ['stack', 'inline']), 'grid-gap': (n) => (n === 1 ? ['stack|inline'] : ['stack', 'inline']),
};
const LENGTH = /(^|[\s(,*/+-])(-?\d*\.?\d+)(px|rem|em)\b/g;

/** Split a CSS value into its space-separated parts, keeping var(…) and calc(…) whole. */
function parts(value) {
  const out = []; let depth = 0, cur = '';
  for (const ch of value.trim()) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) { if (cur) out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

function checkPart(K, part, families, at, prop, out) {
  if (SAFE.test(part) || /^-?0(px|rem|em)?$/.test(part) || /^-?\d*\.?\d+(%|vw|vh|dvh|svh|lvh|vmin|vmax|ch)$/.test(part)) return;
  const vars = [...part.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]);
  const mine = vars.filter((v) => v.startsWith(`--${K.p}-space-`) || v.startsWith(`--${K.p}-size-`));
  const layout = vars.some((v) => v.startsWith(`--${K.p}-layout-`) || v.startsWith(`--${K.p}-focus-`) || v.startsWith(`--${K.p}-border-`) || v.startsWith(`--${K.p}-shape-`));
  for (const v of mine) {
    if (K.prims.has(v)) { out.push({ ...at, rule: 'SR-07', level: 'warning', message: `${v} is a primitive — it doesn't change with density.`, fix: 'Use the semantic token for the job (space.inset.*, space.stack.*, space.inline.*).' }); continue; }
    const t = K.byVar.get(v);
    if (!t) { out.push({ ...at, rule: 'SR-01', level: 'error', message: `${v} is not a spacing token in this system.`, fix: 'Pick a token with the decision guide (spacing.md).' }); continue; }
    if (t.kind === 'spacing' && families && !families.split('|').includes(t.family)) {
      const want = families.split('|');
      out.push({ ...at, rule: 'SR-02', level: 'error', message: `${t.name} is ${t.family} (${K.c.families[t.family].about.toLowerCase()}) but ${prop} needs ${want.join(' or ')}.`, fix: `Use space.${want[0]}.${t.size}${want[0] === 'inset' && !K.c.tokens.some((x) => x.name === `space.inset.${t.size}`) ? ' (add it in engine config if you need it)' : ''} — the same distance, the right direction.` });
    }
  }
  if (mine.length || layout) return; // calc() around a token (e.g. minus a 1px border) is fine
  const raw = [...part.matchAll(LENGTH)].filter((m) => Math.abs(+m[2]) > 1 || m[3] !== 'px'); // ±1px nudges for borders are allowed
  if (raw.length) out.push({ ...at, rule: 'SR-01', level: 'error', message: `Hand-set ${prop}: ${part}.`, fix: `Use a spacing token (${families ? families.split('|').map((f) => `space.${f}.*`).join(' or ') : 'space.*'}) — pick it with the decision guide.` });
}

function checkDeclarations(K, decls, where, selector, out) {
  const sel = selector ?? '';
  const control = CONTROL_SEL.test(sel);
  let spacingDecl = false;
  for (const d of decls) {
    const v = d.value.trim();
    const at = { ...where, line: d.line };
    if (d.prop.startsWith('--')) {
      if (new RegExp(`^--${K.p}-(space|size)-`).test(d.prop)) out.push({ ...at, rule: 'SR-08', level: 'error', message: `${d.prop} is redefined in app code.`, fix: 'Change spacing in the engine config and build, so the change is checked. To tighten a region, set data-density on it.' });
      continue;
    }
    const prop = d.prop;
    const sh = SHORTHAND[prop];
    if (sh) {
      const ps = parts(v);
      const fams = sh(ps.length);
      ps.forEach((x, i) => checkPart(K, x, fams[i] ?? fams[0], at, prop, out));
      spacingDecl = true;
    } else if (PROP_FAMILY[prop]) {
      for (const x of parts(v)) checkPart(K, x, PROP_FAMILY[prop].join('|'), at, prop, out);
      spacingDecl = true;
    } else if (/^(height|min-height|max-height|width|min-width)$/.test(prop)) {
      const usesCtl = v.includes(`--${K.p}-size-control-height`);
      const px = /^\s*(\d*\.?\d+)px\s*$/.exec(v)?.[1];
      const mark = /checkbox|radio|\.check\b|\[type=["']?(checkbox|radio)/.test(sel);
      if (control && px && +px < K.min && prop !== 'max-height' && mark) out.push({ ...at, rule: 'SR-05', level: 'warning', message: `${prop}: ${v} on ${sel.trim()} — a mark drawn under ${K.min}px.`, fix: `Fine if its hit area is at least ${K.min}px (its label, padding, or min-width/min-height: size.target.min). The spacing audit measures it.` });
      else if (control && px && +px < K.min && prop !== 'max-height') out.push({ ...at, rule: 'SR-05', level: 'error', message: `${prop}: ${v} on ${sel.trim()} — under the ${K.min}px target minimum.`, fix: `Use size.control.height (icon-only buttons: width and height), or give the mark a ${K.min}px hit area (size.target.min).` });
      else if (control && prop === 'min-height' && px && !mark) out.push({ ...at, rule: 'SR-05', level: 'warning', message: `min-height: ${v} on ${sel.trim()} is hand-set — it stays ${px}px in every density.`, fix: 'Use min-height: var(--…-size-control-height) so controls follow the density.' });
      else if (control && /^(height|width)$/.test(prop) && (usesCtl || px)) out.push({ ...at, rule: 'SR-06', level: 'error', message: `Fixed ${prop} on a control (${v}) — at 200% text its label no longer fits.`, fix: `Use min-${prop}: var(--…-size-control-height) so the control grows with its label (icon-only buttons too).` });
    }
  }
  if (spacingDecl && DENSITY_CLASS.test(sel)) out.push({ ...where, rule: 'SR-04', level: 'warning', message: `Density by class name (${sel.match(DENSITY_CLASS)[0]}) sets its own spacing.`, fix: 'Set data-density="compact|comfortable" on the container and keep the same tokens — they move together.' });
  if (spacingDecl && /\[data-density/.test(sel)) out.push({ ...where, rule: 'SR-04', level: 'warning', message: `${sel.trim()} swaps spacing per density by hand.`, fix: 'Remove it: data-density already moves every token one step. Keep one token per job.' });
}

function parseDecls(body, baseLine) {
  const out = [];
  let offset = 0;
  for (const part of body.split(';')) {
    const i = part.indexOf(':');
    if (i > 0) out.push({ prop: part.slice(0, i).trim().toLowerCase(), value: part.slice(i + 1), line: baseLine + body.slice(0, offset).split('\n').length - 1 + (part.match(/^\s*\n/) ? part.match(/^\s*/)[0].split('\n').length - 1 : 0) });
    offset += part.length + 1;
  }
  return out;
}

// Tailwind utilities that space things.
const TW_SPACE = /^-?(gap-x|gap-y|space-x|space-y|gap|px|py|pt|pr|pb|pl|ps|pe|p|mx|my|mt|mr|mb|ml|ms|me|m)-(.+)$/; // longest first
const TW_FOR = { p: 'inset', px: 'inset', py: 'inset', pt: 'inset', pr: 'inset', pb: 'inset', pl: 'inset', ps: 'inset', pe: 'inset',
  m: 'stack|inline', my: 'stack', mt: 'stack', mb: 'stack', mx: 'inline', ml: 'inline', mr: 'inline', ms: 'inline', me: 'inline',
  gap: 'stack|inline', 'gap-y': 'stack', 'space-y': 'stack', 'gap-x': 'inline', 'space-x': 'inline' };

export function lintText(K, text, file) {
  const ignored = new Set([...text.matchAll(/ds-lint-ignore:\s*([A-Z]{2}-\d{2}(?:[\s,]+[A-Z]{2}-\d{2})*)/g)].flatMap((m) => m[1].split(/[\s,]+/)));
  return lintCore(K, text, file).filter((x) => !ignored.has(x.rule));
}

function lintCore(K, text, file) {
  const out = [];
  const isTokens = /generated by ds-engine|Tailwind v4 theme for ds/.test(text.slice(0, 300));
  if (isTokens) return out;
  const cssSources = /\.(css|scss)$/.test(file) ? [{ css: text, start: 0 }] : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ({ css: m[1], start: m.index + m[0].indexOf(m[1]) }));
  for (const src of cssSources) {
    const css = src.css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = m[1].trim();
      if (selector.startsWith('@')) continue;
      const line = lineOf(text, src.start + m.index + m[1].length);
      checkDeclarations(K, parseDecls(m[2], line), { file, line, where: selector }, selector, out);
    }
  }
  // Inline styles: the element's tag decides whether it is a control.
  for (const m of text.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)\sstyle\s*=\s*"([^"]*)"/g)) {
    const role = /role=["']([a-z]+)/.exec(m[2])?.[1];
    const cls = /class(?:Name)?=["']([^"']*)/.exec(m[2])?.[1] ?? '';
    const sel = `${m[1].toLowerCase()}${role ? `[role=${role}]` : ''}${cls ? '.' + cls.trim().split(/\s+/).join('.') : ''}`;
    checkDeclarations(K, parseDecls(m[3], lineOf(text, m.index)), { file, line: lineOf(text, m.index), where: 'inline style' }, sel, out);
  }
  // data-density values
  for (const m of text.matchAll(/data-density\s*=\s*["']([^"']*)["']/g)) {
    if (!K.densities.includes(m[1])) out.push({ file, line: lineOf(text, m.index), where: 'data-density', rule: 'SR-04', level: 'error', message: `data-density="${m[1]}" is not a density in this system.`, fix: `Use ${K.densities.join(', ')}.` });
  }
  // Class lists: Tailwind spacing utilities and density class names.
  const component = /\.(jsx|tsx|vue|svelte)$/.test(file);
  // data-density values are modes, not class names: blank them out before reading class lists.
  const scan = text.replace(/data-density\s*=\s*(\{[^}]*\}|"[^"]*"|'[^']*')/g, (m) => m.replace(/[^\n]/g, ' '));
  const classLists = component
    ? [...scan.matchAll(/(["'`])((?:(?!\1)[^\\\n])*)\1/g)].filter((m) => /(^|\s)(-?(p|m|gap|space)[a-z-]*-|h-|w-|size-|min-[hw]-|compact|dense)/.test(m[2])).map((m) => ({ index: m.index, list: m[2] }))
    : [...scan.matchAll(/class\s*=\s*["']([^"']*)["']/g)].map((m) => ({ index: m.index, list: m[1] }));
  for (const m of classLists) {
    const line = lineOf(text, m.index);
    const cls = m.list.split(/\s+/).filter(Boolean).map((c) => c.replace(/^([a-z0-9-]+:)+/, ''));
    const tagM = /<([a-zA-Z][a-zA-Z0-9-]*)(?![^<]*>)[^<]*$/.exec(text.slice(0, m.index));
    const tag = tagM?.[1]?.toLowerCase();
    const openTag = tagM ? text.slice(tagM.index, text.indexOf('>', m.index) + 1) : '';
    const isControl = ['button', 'input', 'select', 'textarea', 'summary'].includes(tag) || /role=["'](button|tab|checkbox|radio|switch|menuitem)/.test(openTag);
    let spacing = false;
    for (const c of cls) {
      const w = { file, line, where: `class "${c}"` };
      const sm = TW_SPACE.exec(c);
      if (sm) {
        const [, util, val] = sm;
        spacing = true;
        if (/^(0|auto|px)$/.test(val)) continue; // resets, auto margins and 1px border nudges
        if (/^(margin|gutter)$/.test(val)) continue; // layout tokens: px-margin (page edges), gap-x-gutter (the page grid) — the layout checker owns them
        const t = K.byTw.get(c.replace(/^-/, ''));
        const arbVar = /^\[(var\(--[a-z0-9-]+\))\]$/.exec(val);
        if (arbVar) { checkPart(K, arbVar[1], TW_FOR[util], w, util, out); continue; }
        // A token minus a border width (the padding a widened state border gives up): calc on tokens only.
        const arbCalc = /^\[calc\((.+)\)\]$/.exec(val);
        if (arbCalc && new RegExp(`var\\(--(spacing-|${K.p}-space-)`).test(arbCalc[1]) && !/\d/.test(arbCalc[1].replace(/var\([^)]*\)/g, ''))) continue;
        if (/^(\d+(\.\d+)?|\[.+\])$/.test(val)) out.push({ ...w, rule: 'SR-01', level: 'error', message: `${c} is Tailwind's own spacing scale (or a hand-set value), not a ds token.`, fix: `Use a token utility such as ${util}-${TW_FOR[util].split('|')[0]}-md — pick the size with the decision guide.` });
        else if (/^(inset|stack|inline)-/.test(val)) {
          const fam = val.split('-')[0];
          const allowed = TW_FOR[util].split('|');
          if (!K.c.tokens.some((x) => x.name === `space.${val.replace('-', '.')}`)) out.push({ ...w, rule: 'SR-01', level: 'error', message: `${c} is not a spacing token in this system.`, fix: 'Pick a token with the decision guide (spacing.md).' });
          else if (!allowed.includes(fam)) out.push({ ...w, rule: 'SR-02', level: 'error', message: `${c} uses ${fam} for ${allowed.join(' or ')} space.`, fix: `Use ${util}-${allowed[0]}-${val.split('-').slice(1).join('-')} — the same distance, the right direction.` });
        } else if (!t && /^(icon|target|control|margin|gutter|header)$/.test(val) === false && !/^\[var\(/.test(val)) out.push({ ...w, rule: 'SR-01', level: 'error', message: `${c} is not a ds spacing utility.`, fix: 'Use p-inset-*, gap-y-stack-*, gap-x-inline-* (or the matching margin utilities).' });
      }
      const hm = /^(h|w|size|min-h|min-w)-(\d+(\.5)?|\[(\d+)px\])$/.exec(c);
      if (hm && isControl) {
        const pxv = hm[4] ? +hm[4] : +hm[2] * 4;
        if (pxv < K.min) out.push({ ...w, rule: 'SR-05', level: 'error', message: `${c} makes a control ${pxv}px — under the ${K.min}px target minimum.`, fix: 'Use min-h-control (icon-only buttons: min-w-control min-h-control), or a 24px hit area (min-w-target min-h-target).' });
        else if (hm[1] === 'h') out.push({ ...w, rule: 'SR-06', level: 'error', message: `${c} gives a control a fixed height — at 200% text its label no longer fits.`, fix: 'Use min-h-control so the control grows with its label.' });
      }
      if (/^(h|w|size)-control$/.test(c) && isControl) out.push({ ...w, rule: 'SR-06', level: 'error', message: `${c} fixes the size — at 200% text the label no longer fits.`, fix: 'Use min-h-control (icon-only buttons: min-w-control min-h-control).' });
    }
    const dens = cls.find((c) => /^(compact|dense|condensed|comfortable|is-compact|is-dense|density-[a-z]+)$/.test(c));
    if (dens) out.push({ file, line, where: `class "${dens}"`, rule: 'SR-04', level: 'warning', message: `Density by class name ("${dens}").`, fix: 'Use data-density="compact|comfortable" on the container; the tokens follow it.' });
    void spacing;
  }
  // JSX: a condition that swaps spacing tokens by density.
  for (const m of text.matchAll(/\b(\w*(?:dense|compact|comfortable|density)\w*)\s*\?\s*(['"`])([^'"`]*)\2\s*:\s*(['"`])([^'"`]*)\4/gi)) {
    if ([m[3], m[5]].some((s) => /(^|\s)-?(p|m|gap|space)[a-z-]*-(inset|stack|inline)-|var\(--[a-z]+-space-/.test(s))) out.push({ file, line: lineOf(text, m.index), where: `${m[1]} ? … : …`, rule: 'SR-04', level: 'warning', message: `Spacing swapped by token name when ${m[1]} is set.`, fix: 'Set data-density on the container instead and keep one token per job.' });
  }
  // Space made with empty elements.
  for (const m of text.matchAll(/(<br\s*\/?>\s*){2,}/g)) out.push({ file, line: lineOf(text, m.index), where: '<br><br>', rule: 'SR-09', level: 'warning', message: 'Space made with a run of <br> elements.', fix: 'Use space.stack.* on the elements (or a gap on their parent).' });
  for (const m of text.matchAll(/(&nbsp;\s*){2,}/g)) out.push({ file, line: lineOf(text, m.index), where: '&nbsp;', rule: 'SR-09', level: 'warning', message: 'Space made with &nbsp; characters.', fix: 'Use space.inline.* (a gap or a margin) instead.' });
  for (const m of text.matchAll(/<(div|span|li|p)\b([^>]*)>\s*<\/\1>/g)) {
    if (/class(?:Name)?=["'][^"']*\b(spacer|space|gap|vspace|hspace)\b|style=["'][^"']*\b(height|width|margin|padding)\s*:/.test(m[2])) out.push({ file, line: lineOf(text, m.index), where: `<${m[1]}${m[2].slice(0, 40)}>`, rule: 'SR-09', level: 'error', message: 'An empty element used as a spacer.', fix: 'Remove it and space its neighbours with a token (space.stack.* or space.inline.*), or a gap on the parent.' });
  }
  for (const m of text.matchAll(/<Spacer\b/g)) out.push({ file, line: lineOf(text, m.index), where: '<Spacer>', rule: 'SR-09', level: 'warning', message: 'A spacer component.', fix: 'Use a gap on the parent with a space.stack.* or space.inline.* token.' });
  return out;
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

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('space-lint.js')) {
  const args = process.argv.slice(2);
  const ci = args.indexOf('--contract');
  const contract = ci >= 0 ? args.splice(ci, 2)[1] : path.join(HERE, '../../out/default/ai/spacing.contract.json');
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
