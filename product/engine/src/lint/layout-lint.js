#!/usr/bin/env node
// Layout checker: finds layout-rule breaks in CSS, HTML and Tailwind/JSX against the layout contract.
// Usage: node src/lint/layout-lint.js <files or folders...> [--contract out/default/ai/layout.contract.json] [--json]
// Has no dependencies: copy this one file into any project and point --contract at the layout.contract.json you ship.
// Exit code 1 when any error is found. `ds-lint-ignore: LR-xx` anywhere in a file switches a rule off for that file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const loadContract = (file) => contractIndex(JSON.parse(fs.readFileSync(file, 'utf8')));

export function contractIndex(c) {
  const p = c.prefix;
  const bpEm = c.breakpoints.filter((b) => b.minPx > 0).map((b) => b.em);
  const panes = c.panes.map((x) => ({ job: x.name.split('.')[2], side: x.side }));
  return { c, p, bpEm, bpNames: c.breakpoints.filter((b) => b.minPx > 0).map((b) => b.name), panes, reflow: c.limits.reflowWidth, sm: c.breakpoints[0], measurePx: c.measure.px };
}

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
const toPx = (n, unit) => (unit === 'px' ? n : unit === 'rem' || unit === 'em' ? n * 16 : null);
// Selectors that are a page's frame: their side padding is the page edge.
const PAGE_SEL = /(^|[\s>+~,])(main|body)(?=$|[\s:.[,#>+~)])|\.(page|container|wrapper|wrap|content|main|layout|site|app|shell)(?=$|[\s:.[,#>+~)])|\[data-shell=["']?main/;
// Selectors that hold running text.
const TEXT_SEL = /(^|[\s>+~,])(p|article|blockquote|li|dd|figcaption)(?=$|[\s:.[,#>+~)])|\.(prose|copy|text|body-text|description|lead|markdown|post|article|intro|summary|help)(?=$|[\s:.[,#>+~)-])/;
const ROOT_SEL = /^\s*(html|body|:root|html\s*,\s*body|body\s*,\s*html)\s*$/;
const TABLE_SEL = /(^|[\s>+~,])table(?=$|[\s:.[,#>+~)])|\.(table|data-table|grid-table)\b/;
const SAFE = /^\s*(inherit|initial|unset|revert|revert-layer|auto|none|0|100%|fit-content|max-content|min-content)\s*$/;

/** Split a CSS value into its top-level comma- or space-separated parts, keeping (…) whole. */
function parts(value, sep = /\s/) {
  const out = []; let depth = 0, cur = '';
  for (const ch of value.trim()) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (sep.test(ch) && depth === 0) { if (cur) out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/** Tracks of a grid-template-columns value, with repeat() expanded once. */
function tracks(value) {
  const out = [];
  for (const t of parts(value.replace(/\[[^\]]*\]/g, ' '))) {
    const rep = /^repeat\(\s*([^,]+),(.*)\)$/.exec(t);
    if (rep) { const n = /^\d+$/.test(rep[1].trim()) ? +rep[1] : 2; const inner = parts(rep[2]); for (let i = 0; i < n; i++) out.push(...inner.map((x) => ({ t: x, auto: !/^\d+$/.test(rep[1].trim()) }))); }
    else out.push({ t, auto: false });
  }
  return out;
}

function checkDeclarations(K, decls, where, selector, out, ctx) {
  const sel = selector ?? '';
  const page = PAGE_SEL.test(sel), text = TEXT_SEL.test(sel), root = ROOT_SEL.test(sel), table = TABLE_SEL.test(sel);
  const v = (d) => d.value.trim().replace(/\s*!important\s*$/, '');
  const has = (prop) => decls.find((d) => d.prop === prop);
  const sticky = decls.some((d) => d.prop === 'position' && /\b(sticky|fixed)\b/.test(d.value)) && decls.some((d) => (d.prop === 'top' && /^\s*0(px)?\s*$/.test(d.value)) || (d.prop === 'inset' && /^\s*0(px)?(\s|$)/.test(d.value)) || (d.prop === 'inset-block-start' && /^\s*0/.test(d.value)));
  if (sticky) ctx.sticky.push({ ...where, sel });
  for (const d of decls) {
    const val = v(d);
    const at = { ...where, line: d.line };
    const prop = d.prop;
    if (prop.startsWith('--')) {
      if (new RegExp(`^--${K.p}-(layout|breakpoint)-`).test(prop)) out.push({ ...at, rule: 'LR-10', level: 'error', message: `${prop} is redefined in app code.`, fix: 'Change the engine config (layout.nav, layout.aside, layout.tile, layout.panes) and build, so the change is checked.' });
      continue;
    }
    const usesLayout = val.includes(`--${K.p}-layout-`);
    // LR-01: page edges
    if (page && /^(padding|padding-left|padding-right|padding-inline|padding-inline-start|padding-inline-end)$/.test(prop)) {
      const ps = parts(val);
      const sides = prop === 'padding' ? (ps.length === 1 ? [ps[0]] : ps.length <= 3 ? [ps[1]] : [ps[1], ps[3]]) : ps;
      const bad = sides.filter((x) => !SAFE.test(x) && !x.includes(`--${K.p}-layout-margin`));
      if (bad.length && !(bad.every((x) => /^0(px)?$/.test(x)))) out.push({ ...at, rule: 'LR-01', level: 'error', message: `The page edge on ${sel.trim()} is ${bad.join(' ')}.`, fix: `Use layout.margin (padding-inline: var(--${K.p}-layout-margin), or the .${K.p}-page class) — it follows the breakpoint and keeps ${K.reflow - 2 * K.sm.margin}px of content at ${K.reflow}px.` });
    }
    // LR-02 / LR-08: fixed widths
    if (/^(width|min-width|inline-size|min-inline-size|flex-basis)$/.test(prop)) {
      if (/\b100vw\b/.test(val)) out.push({ ...at, rule: 'LR-08', level: 'error', message: `${prop}: ${val} — 100vw includes the scrollbar, so the page scrolls sideways on screens with one.`, fix: 'Use 100% (or nothing: block boxes fill their container).' });
      else {
        const m = /^(-?\d*\.?\d+)(px|rem|em)$/.exec(val);
        const px = m ? toPx(+m[1], m[2]) : null;
        if (px !== null && px > K.reflow && !usesLayout) {
          if (table && prop === 'min-width') out.push({ ...at, rule: 'LR-02', level: 'warning', message: `${prop}: ${val} on ${sel.trim()} forces ${px}px.`, fix: 'Fine only inside a scrolling container (overflow-x: auto, tabindex="0", an accessible name) — never on the page.' });
          else out.push({ ...at, rule: 'LR-02', level: 'error', message: `${prop}: ${val} on ${sel.trim()} — wider than a ${K.reflow}px screen, so the page scrolls ${px - K.reflow}px sideways there (and at 400% zoom).`, fix: `Use max-width with a layout token (layout.container.max, layout.measure.reading, a pane width) and let it fill the space below that.` });
        }
      }
    }
    // LR-02: a page cap of its own
    if (page && !text && (prop === 'max-width' || prop === 'max-inline-size') && /^(\d*\.?\d+)(px|rem|em)$/.test(val)) out.push({ ...at, rule: 'LR-02', level: 'warning', message: `max-width: ${val} on ${sel.trim()} — a page width of its own.`, fix: `Use layout.container.max (the .${K.p}-page class adds the margins and centres it).` });
    // LR-03: running text width
    if (prop === 'max-width' || prop === 'max-inline-size') {
      const m = /^(\d*\.?\d+)(px|rem|em|ch)$/.exec(val);
      if (text) {
        if (val.includes(`--${K.p}-layout-container-max`)) out.push({ ...at, rule: 'LR-03', level: 'error', message: `Running text (${sel.trim()}) takes the page width.`, fix: `Use layout.measure.reading (max-width: var(--${K.p}-layout-measure-reading), or .${K.p}-measure).` });
        else if (m && m[2] === 'px') out.push({ ...at, rule: 'LR-03', level: 'error', message: `max-width: ${val} on running text (${sel.trim()}) — px doesn't follow the text size: at 200% text the line halves.`, fix: `Use layout.measure.reading (max-width: var(--${K.p}-layout-measure-reading)) — rem, about ${K.c.measure.charsAtBody} characters at any text size.` });
        else if (m) out.push({ ...at, rule: 'LR-03', level: 'warning', message: `max-width: ${val} on running text is hand-set.`, fix: `Use layout.measure.reading so every text block has the same, checked measure.` });
      }
    }
    // LR-04: scroll padding and sticky heights
    if (prop === 'scroll-padding-top' || prop === 'scroll-padding' || prop === 'scroll-padding-block-start' || prop === 'scroll-padding-block') {
      ctx.scrollPadding = true;
      if (!val.includes(`--${K.p}-layout-scroll-padding-top`)) out.push({ ...at, rule: 'LR-04', level: 'error', message: `${prop}: ${val} — not the header's height, so focused items can land under the sticky header.`, fix: `Remove it (tokens.css sets scroll-padding-top: var(--${K.p}-layout-scroll-padding-top) on <html>), or add your extra sticky bar to it: calc(var(--${K.p}-layout-scroll-padding-top) + <bar height>).` });
    }
    if (sticky && (prop === 'height' || prop === 'block-size') && !/auto/.test(val)) out.push({ ...at, rule: 'LR-04', level: 'warning', message: `A sticky bar with ${prop}: ${val} — at 200% text its content no longer fits, and the scroll padding no longer matches it.`, fix: `Use min-height: var(--${K.p}-layout-header-height) for the header.` });
    if (sticky && prop === 'min-height' && /^\d/.test(val)) out.push({ ...at, rule: 'LR-04', level: 'warning', message: `A sticky bar with min-height: ${val} hand-set — the scroll padding won't match it in other densities.`, fix: `Use min-height: var(--${K.p}-layout-header-height).` });
    // LR-05 and LR-09: grid tracks
    if (prop === 'grid-template-columns' || prop === 'grid-template') {
      const cols = prop === 'grid-template' ? (val.split('/')[1] ?? '') : val;
      if (cols && !/^\s*(none|subgrid|masonry)\s*$/.test(cols)) {
        const ts = tracks(cols);
        const bare = ts.filter((x) => /^\d*\.?\d*fr$/.test(x.t));
        const fixed = ts.filter((x) => /^\d*\.?\d+(px|rem|em)$/.test(x.t));
        const hardCount = /repeat\(\s*(\d+)\s*,/.exec(cols);
        if (bare.length) out.push({ ...at, rule: 'LR-05', level: ts.length > 1 ? 'error' : 'warning', message: `grid-template-columns: ${cols.trim()} — a bare fr track never gets narrower than its longest word, URL or table.`, fix: 'Use minmax(0, 1fr) for content tracks (the .ds-grid and .ds-tiles classes do).'.replace(/\.ds-/g, `.${K.p}-`) });
        if (fixed.length >= 2 && !ts.some((x) => /fr|minmax|auto|%/.test(x.t))) out.push({ ...at, rule: 'LR-09', level: 'error', message: `grid-template-columns: ${cols.trim()} — fixed tracks add up to a width that doesn't fit the next breakpoint.`, fix: `Use the page grid (.${K.p}-grid: span columns) or the tile grid (.${K.p}-tiles).` });
        else if (fixed.length === 1 && ts.length > 1 && !usesLayout) out.push({ ...at, rule: 'LR-09', level: 'warning', message: `A ${fixed[0].t} track — a hand-set pane width.`, fix: `Use a pane token (var(--${K.p}-layout-pane-nav), …-aside) or the .${K.p}-shell, which also handles smaller screens.` });
        for (const mm of cols.matchAll(/minmax\(\s*(\d*\.?\d+)(px|rem|em)\s*,/g)) {
          const px = toPx(+mm[1], mm[2]);
          if (/auto-(fill|fit)/.test(cols) && px > K.reflow - 2 * K.sm.margin) out.push({ ...at, rule: 'LR-09', level: 'error', message: `minmax(${mm[1]}${mm[2]}, …) in an auto-fill grid — wider than the ${K.reflow - 2 * K.sm.margin}px a ${K.reflow}px screen has, so it overflows.`, fix: `Use minmax(min(100%, var(--${K.p}-layout-tile-min)), 1fr) — the .${K.p}-tiles class.` });
          else if (/auto-(fill|fit)/.test(cols) && !/min\(\s*100%/.test(cols)) out.push({ ...at, rule: 'LR-09', level: 'warning', message: `minmax(${mm[1]}${mm[2]}, 1fr) — a hand-set tile width.`, fix: `Use minmax(min(100%, var(--${K.p}-layout-tile-min)), 1fr) — the .${K.p}-tiles class.` });
        }
        if (hardCount && +hardCount[1] >= 2 && !usesLayout && fixed.length < 2 && !bare.length) out.push({ ...at, rule: 'LR-09', level: 'warning', message: `repeat(${hardCount[1]}, …) — a hand-set column count stays ${hardCount[1]} at every width.`, fix: `Use layout.columns (repeat(var(--${K.p}-layout-columns), minmax(0, 1fr)) or .${K.p}-grid) and span columns.` });
      }
    }
    // LR-07: visual order
    if (prop === 'order' && !/^\s*0\s*$/.test(val)) out.push({ ...at, rule: 'LR-07', level: 'warning', message: `order: ${val} moves ${sel.trim()} away from its place in the code.`, fix: 'Change the DOM order instead — keyboard and screen-reader users follow the code, not the picture.' });
    if ((prop === 'flex-direction' || prop === 'flex-flow') && /reverse/.test(val)) out.push({ ...at, rule: 'LR-07', level: 'warning', message: `${prop}: ${val} shows ${sel.trim()}'s children in reverse of the code.`, fix: 'Change the DOM order instead.' });
    if (prop === 'grid-auto-flow' && /dense/.test(val)) out.push({ ...at, rule: 'LR-07', level: 'warning', message: 'grid-auto-flow: dense fills gaps by moving items out of order.', fix: 'Remove dense, or order the items in the code the way they should read.' });
    // LR-08: hidden overflow on the page
    if (root && /^(overflow|overflow-x)$/.test(prop) && /hidden|clip/.test(val)) out.push({ ...at, rule: 'LR-08', level: 'error', message: `${prop}: ${val} on ${sel.trim()} hides what doesn't fit instead of reflowing it — content past the edge can't be reached.`, fix: 'Remove it and fix the element that is too wide (the layout audit names it).' });
  }
  void has;
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

function checkQuery(K, prelude, at, out) {
  const kind = prelude.startsWith('@container') ? 'container' : 'media';
  if (kind === 'media' && !/(min|max)-width|width\s*[<>]/.test(prelude)) return; // print, prefers-*, orientation …
  if (/max-width|width\s*</.test(prelude)) out.push({ ...at, rule: 'LR-06', level: 'error', message: `${prelude.trim()} — a max-width (desktop-first) query.`, fix: `Write the small layout first and add min-width queries at ${K.bpNames.map((b, i) => `${b} (${K.bpEm[i]}em)`).join(', ')}.` });
  for (const m of prelude.matchAll(/min-width\s*:\s*(\d*\.?\d+)(px|em|rem)|width\s*>=?\s*(\d*\.?\d+)(px|em|rem)/g)) {
    const n = +(m[1] ?? m[3]), unit = m[2] ?? m[4];
    const em = unit === 'px' ? n / 16 : n;
    const sys = K.bpEm.includes(em);
    if (kind === 'container') { out.push({ ...at, rule: 'LR-09', level: 'warning', message: `${prelude.trim()} — a container query of your own.`, fix: `A .${K.p}-grid inside a region already follows the region's width; use the system breakpoints (${K.bpEm.join(', ')}em) if you need more.` }); continue; }
    if (unit === 'px' && sys) out.push({ ...at, rule: 'LR-06', level: 'error', message: `${prelude.trim()} — the right width, in px.`, fix: `Use ${em}em: em breakpoints follow the reader's text size (and match Tailwind's).` });
    else if (!sys) out.push({ ...at, rule: 'LR-06', level: 'error', message: `${prelude.trim()} — not a system breakpoint, so it makes a layout no check covers.`, fix: `Use ${K.bpNames.map((b, i) => `${b} (min-width: ${K.bpEm[i]}em)`).join(', ')}.` });
  }
}

export function lintText(K, text, file) {
  const ignored = new Set([...text.matchAll(/ds-lint-ignore:\s*([A-Z]{2}-\d{2}(?:[\s,]+[A-Z]{2}-\d{2})*)/g)].flatMap((m) => m[1].split(/[\s,]+/)));
  return lintCore(K, text, file).filter((x) => !ignored.has(x.rule));
}

const TW_FIXED_W = /^(min-w|w|basis)-(\d+(\.5)?|\[(\d*\.?\d+)(px|rem|em)\])$/;

function lintCore(K, text, file) {
  const out = [];
  if (/generated by ds-engine|Tailwind v4 theme for ds/.test(text.slice(0, 300))) return out;
  const ctx = { sticky: [], scrollPadding: false };
  const isPage = /<html[\s>]|<head[\s>]/i.test(text);
  const cssSources = /\.(css|scss)$/.test(file) ? [{ css: text, start: 0 }] : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ({ css: m[1], start: m.index + m[0].indexOf(m[1]) }));
  for (const src of cssSources) {
    const css = src.css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
    for (const m of css.matchAll(/@(media|container)\s*([^{]*)\{/g)) checkQuery(K, `@${m[1]} ${m[2]}`, { file, line: lineOf(text, src.start + m.index), where: `@${m[1]}` }, out);
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = m[1].trim();
      if (selector.startsWith('@')) continue;
      const line = lineOf(text, src.start + m.index + m[1].length);
      checkDeclarations(K, parseDecls(m[2], line), { file, line, where: selector }, selector, out, ctx);
    }
  }
  // Inline styles: the element's tag and classes stand in for the selector.
  for (const m of text.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)\sstyle\s*=\s*"([^"]*)"/g)) {
    const cls = /class(?:Name)?=["']([^"']*)/.exec(m[2])?.[1] ?? '';
    const shell = /data-shell=["']([a-z-]+)/.exec(m[2])?.[1];
    const sel = `${m[1].toLowerCase()}${cls ? '.' + cls.trim().split(/\s+/).join('.') : ''}${shell ? `[data-shell="${shell}"]` : ''}`;
    checkDeclarations(K, parseDecls(m[3], lineOf(text, m.index)), { file, line: lineOf(text, m.index), where: 'inline style' }, sel, out, ctx);
  }
  // JS media queries
  for (const m of text.matchAll(/matchMedia\(\s*(['"`])([^'"`]+)\1/g)) checkQuery(K, `@media ${m[2]}`, { file, line: lineOf(text, m.index), where: 'matchMedia' }, out);
  // Class lists: Tailwind utilities.
  const component = /\.(jsx|tsx|vue|svelte)$/.test(file);
  const classLists = component
    ? [...text.matchAll(/(["'`])((?:(?!\1)[^\\\n])*)\1/g)].filter((m) => /(^|\s)([a-z0-9-]+:)*(-?(w|min-w|max-w|basis|order|flex|grid|overflow|sticky|fixed|top|scroll|px|p|h|min-h)\b|sm:|2xl:|max-|min-\[)/.test(m[2]) && !/^[./@]|\s=>\s|^https?:/.test(m[2])).map((m) => ({ index: m.index, list: m[2] }))
    : [...text.matchAll(/class\s*=\s*["']([^"']*)["']/g)].map((m) => ({ index: m.index, list: m[1] }));
  for (const m of classLists) {
    const line = lineOf(text, m.index);
    const all = m.list.split(/\s+/).filter(Boolean);
    const tagM = /<([a-zA-Z][a-zA-Z0-9-]*)(?![^<]*>)[^<]*$/.exec(text.slice(0, m.index));
    const tag = tagM?.[1]?.toLowerCase() ?? '';
    const openTag = tagM ? text.slice(tagM.index, text.indexOf('>', m.index) + 1) : '';
    const base = all.map((c) => c.replace(/^([a-z0-9@[\]_-]+:)+/, ''));
    const isText = /^(p|article|blockquote|li|dd|figcaption)$/.test(tag) || base.some((c) => /^(prose|text-body|ds-type-body)/.test(c));
    const isPageEl = tag === 'main' || /data-shell=["']main/.test(openTag) || base.some((c) => /^(container|page|wrapper|content)$/.test(c));
    const stickyTop = base.some((c) => /^(sticky|fixed)$/.test(c)) && base.some((c) => /^(top-0|inset-0|inset-x-0)$/.test(c));
    if (stickyTop) {
      ctx.sticky.push({ file, line, where: `class "${m.list.slice(0, 40)}"` });
      for (const c of base.filter((x) => /^h-(\d+|\[.+\])$/.test(x))) out.push({ file, line, where: `class "${c}"`, rule: 'LR-04', level: 'warning', message: `${c} fixes a sticky bar's height — at 200% text its content no longer fits, and the scroll padding won't match.`, fix: 'Use min-h-header.' });
    }
    for (const [i, c] of base.entries()) {
      const raw = all[i];
      const w = { file, line, where: `class "${raw}"` };
      const variant = raw.slice(0, raw.length - c.length);
      // LR-06 breakpoints
      if (/(^|:)(sm|2xl):$/.test(variant) || /(^|:)(sm|2xl):/.test(variant)) out.push({ ...w, rule: 'LR-06', level: 'error', message: `${raw} — Tailwind's own ${variant.match(/(sm|2xl):/)[1]} breakpoint, switched off in ds.`, fix: `No prefix is the sm layout; use ${K.bpNames.map((b) => `${b}:`).join(', ')}.` });
      if (/(^|:)(max-[a-z0-9[\]-]+|min-\[[^\]]+\]):/.test(variant)) out.push({ ...w, rule: 'LR-06', level: 'error', message: `${raw} — a breakpoint of its own (${variant.match(/(max-[a-z0-9[\]-]+|min-\[[^\]]+\]):/)[1]}).`, fix: `Write the small layout first, then ${K.bpNames.map((b) => `${b}:`).join(', ')}.` });
      if (/(^|:)@[a-z0-9[\]-]+:/.test(variant)) out.push({ ...w, rule: 'LR-09', level: 'warning', message: `${raw} — Tailwind's container sizes aren't the ds breakpoints.`, fix: `Use .${K.p}-grid inside a region: it follows the region's width with the system breakpoints.` });
      // LR-02 / LR-08 widths
      const fw = TW_FIXED_W.exec(c);
      if (fw) {
        const px = fw[4] ? toPx(+fw[4], fw[5]) : +fw[2] * 4;
        if (px > K.reflow) out.push({ ...w, rule: 'LR-02', level: tag === 'table' && fw[1] === 'min-w' ? 'warning' : 'error', message: `${raw} makes it ${px}px wide — wider than a ${K.reflow}px screen.`, fix: 'Use a max-width token (max-w-page, max-w-reading) or a pane width (w-nav, w-aside), and let it fill the space below that.' });
      }
      if (/^(w|min-w)-screen$/.test(c)) out.push({ ...w, rule: 'LR-08', level: 'error', message: `${raw} is 100vw — it includes the scrollbar, so the page scrolls sideways.`, fix: 'Use w-full.' });
      if ((tag === 'html' || tag === 'body') && /^overflow(-x)?-(hidden|clip)$/.test(c)) out.push({ ...w, rule: 'LR-08', level: 'error', message: `${raw} on <${tag}> hides what doesn't fit instead of reflowing it.`, fix: 'Remove it and fix the element that is too wide (the layout audit names it).' });
      // LR-03 text width
      if (isText && /^max-w-/.test(c) && c !== 'max-w-reading' && c !== 'max-w-none' && c !== 'max-w-full') {
        const arb = /^max-w-\[(\d*\.?\d+)(px|rem|ch)\]$/.exec(c);
        out.push({ ...w, rule: 'LR-03', level: arb?.[2] === 'px' || c === 'max-w-page' ? 'error' : 'warning', message: `${raw} on running text${c === 'max-w-prose' ? ' (65ch, not the checked measure)' : ''}.`, fix: 'Use max-w-reading (layout.measure.reading).' });
      } else if (/^max-w-(\d?xl|[3-7]xl|screen-[a-z0-9]+|\[\d+px\])$/.test(c) && !isText) {
        out.push({ ...w, rule: 'LR-02', level: 'warning', message: `${raw} — a width from Tailwind's own scale, not a ds layout width.`, fix: 'Use max-w-page for page content or max-w-reading for text (or .ds-page).'.replace(/\.ds-/g, `.${K.p}-`) });
      }
      // LR-01 page edges
      if (isPageEl && /^(px|p|ps|pe|pl|pr)-/.test(c) && !/^(px|p|ps|pe|pl|pr)-(margin|0)$/.test(c) && !/^(py|pt|pb)-/.test(c)) out.push({ ...w, rule: 'LR-01', level: 'error', message: `${raw} sets the page edge on <${tag}>.`, fix: `Use px-margin (layout.margin), or the .${K.p}-page class.` });
      // LR-04 scroll padding
      if (/^scroll-p[ty]?-/.test(c)) { ctx.scrollPadding = true; if (!/^scroll-pt-header$/.test(c)) out.push({ ...w, rule: 'LR-04', level: 'error', message: `${raw} — not the header's height.`, fix: 'Remove it (tokens.css sets the scroll padding on <html>) or use scroll-pt-header.' }); }
      // LR-05 / LR-09 grids
      const gc = /^grid-cols-\[(.+)\]$/.exec(c);
      if (gc) {
        const ts = tracks(gc[1].replace(/_/g, ' '));
        if (ts.some((x) => /^\d*\.?\d*fr$/.test(x.t))) out.push({ ...w, rule: 'LR-05', level: 'error', message: `${raw} — a bare fr track never gets narrower than its longest word.`, fix: 'Use minmax(0,1fr) tracks — grid-cols-N already does.' });
        else if (ts.filter((x) => /^\d*\.?\d+(px|rem)$/.test(x.t)).length >= 2) out.push({ ...w, rule: 'LR-09', level: 'error', message: `${raw} — fixed tracks don't fit the next breakpoint.`, fix: `Use the .${K.p}-grid or .${K.p}-tiles class.` });
      }
      // LR-07 order
      if (/^-?order-(?!none$|0$)/.test(c) || /^(flex-row-reverse|flex-col-reverse|grid-flow-dense|grid-flow-row-dense|grid-flow-col-dense)$/.test(c)) out.push({ ...w, rule: 'LR-07', level: 'warning', message: `${raw} shows things in a different order from the code.`, fix: 'Change the DOM order instead.' });
      // LR-08 scroll containers
      if (/^overflow(-x)?-(auto|scroll)$/.test(c) && !component) {
        const focusable = /tabindex=["']?0/.test(openTag), named = /aria-label(ledby)?=/.test(openTag);
        if (!focusable || !named) out.push({ ...w, rule: 'LR-08', level: 'warning', message: `A scrolling container${focusable ? '' : ' keyboard users may not be able to reach'}${!named ? ' without a name' : ''}.`, fix: 'Add tabindex="0", role="region" and an aria-label (or aria-labelledby) so it can be focused, scrolled and announced.' });
      }
    }
  }
  // HTML: inline-style scroll containers also need focus and a name.
  if (!component) for (const m of text.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*style\s*=\s*"[^"]*overflow(-x)?\s*:\s*(auto|scroll)[^"]*"[^>]*)>/g)) {
    if (!/tabindex=["']?0/.test(m[2]) || !/aria-label(ledby)?=/.test(m[2])) out.push({ file, line: lineOf(text, m.index), where: `<${m[1]} style>`, rule: 'LR-08', level: 'warning', message: 'A scrolling container without tabindex="0" and a name.', fix: 'Add tabindex="0", role="region" and an aria-label (or aria-labelledby).' });
  }
  // LR-07: shell regions in DOM order (header, start panes, main, end panes).
  const order = ['header', ...K.panes.filter((x) => x.side === 'start').map((x) => x.job), 'main', ...K.panes.filter((x) => x.side === 'end').map((x) => x.job)];
  // Only markup counts: blank out <style> and <script> bodies (selectors and queries name regions too).
  const markup = text.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/g, (m) => m.replace(/[^\n]/g, ' '));
  const attrs = [...markup.matchAll(/<[a-zA-Z][^<>]*?\sdata-shell=["']([a-z-]+)["']/g)].map((m) => ({ name: m[1], line: lineOf(text, m.index) }));
  const seen = attrs.filter((x) => order.includes(x.name));
  for (let i = 1; i < seen.length; i++) {
    if (order.indexOf(seen[i].name) < order.indexOf(seen[i - 1].name)) out.push({ file, line: seen[i].line, where: `data-shell="${seen[i].name}"`, rule: 'LR-07', level: 'error', message: `data-shell="${seen[i].name}" comes after data-shell="${seen[i - 1].name}" in the code, but before it on screen.`, fix: `Put the regions in this order: ${order.join(', ')}.` });
  }
  for (const x of attrs) {
    if (!order.includes(x.name)) out.push({ file, line: x.line, where: `data-shell="${x.name}"`, rule: 'LR-09', level: 'error', message: `data-shell="${x.name}" is not a region in this system.`, fix: `Use ${order.join(', ')} — or add the pane in the engine config (layout.panes).` });
  }
  // LR-04: a page with a sticky top bar needs the scroll padding (tokens.css sets it).
  if (ctx.sticky.length && isPage && !ctx.scrollPadding && !/tokens\.css/.test(text)) out.push({ ...ctx.sticky[0], rule: 'LR-04', level: 'warning', message: 'A sticky top bar, and this page neither loads tokens.css nor sets scroll-padding-top.', fix: `Load tokens.css (it sets scroll-padding-top: var(--${K.p}-layout-scroll-padding-top) on <html>).` });
  if (ctx.sticky.length > 1) out.push({ ...ctx.sticky[1], rule: 'LR-04', level: 'warning', message: `${ctx.sticky.length} sticky top bars — the scroll padding covers only the header.`, fix: `Add the others' heights: scroll-padding-top: calc(var(--${K.p}-layout-scroll-padding-top) + <bar height>) — and keep one bar on small screens if you can.` });
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

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('layout-lint.js')) {
  const args = process.argv.slice(2);
  const ci = args.indexOf('--contract');
  const contract = ci >= 0 ? args.splice(ci, 2)[1] : path.join(HERE, '../../out/default/ai/layout.contract.json');
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
