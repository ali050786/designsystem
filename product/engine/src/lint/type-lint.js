#!/usr/bin/env node
// Type checker: finds typography-rule breaks in CSS, HTML and Tailwind/JSX against the typography contract.
// Usage: node src/lint/type-lint.js <files or folders...> [--contract out/default/ai/typography.contract.json] [--json]
// Has no dependencies: copy this one file into any project and point --contract at the typography.contract.json you ship.
// Exit code 1 when any error is found.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const loadContract = (file) => contractIndex(JSON.parse(fs.readFileSync(file, 'utf8')));

export function contractIndex(c) {
  const p = c.prefix;
  const byName = new Map(c.styles.map((s) => [s.name, s]));
  const byClass = new Map(c.styles.map((s) => [s.cssClass, s]));
  const byTw = new Map(c.styles.map((s) => [s.tailwind, s]));
  const byVar = new Map(c.styles.flatMap((s) => Object.entries(s.cssVars).map(([k, v]) => [v, { style: s, prop: k }])));
  const roles = [...new Set(c.styles.map((s) => s.role))];
  return { c, p, byName, byClass, byTw, byVar, roles, min: c.limits.minSize, reading: c.limits.readingLineHeight };
}

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
// Selectors for text people read in lines. A raw line height under the reading minimum there is TR-03.
const READING_SEL = /(^|[\s>+~,(])(p|li|dd|dt|blockquote|figcaption|article|main|body)(?=$|[\s:.[,#>+~)])|\.(prose|description|desc|help|hint|intro|lead|message|content|copy|paragraph|caption|note|summary|article|post|comment|bio)\b/;
const NUMBER_SEL = /(^|[\s>+~,(])(td|th|table|output|data)(?=$|[\s:.[,#>+~)])|\.(amount|price|total|count|metric|stat|kpi|value|number|balance|qty|quantity)\b/;
const toPx = (v) => {
  const m = /^\s*(-?[\d.]+)(px|rem|em|pt|%)?\s*$/.exec(v);
  if (!m) return null;
  const n = +m[1];
  return { px: { px: n, rem: n * 16, em: n * 16, pt: (n * 4) / 3, '%': (n / 100) * 16 }[m[2] ?? 'px'], unit: m[2] ?? '' };
};
const KEYWORD_SIZE = /^\s*(xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|smaller|larger)\s*$/;
const SAFE = /^\s*(inherit|initial|unset|revert|revert-layer)\s*$/;
// Tailwind's own scales, which bypass ds styles.
const TW_SIZE = /^text-(xs|sm|base|lg|xl|[2-9]xl)$/;
const TW_LEADING = { none: 1, tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625, loose: 2 };

function varsIn(value) { return [...value.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]); }

function checkStyleVar(K, v, d, where, out) {
  // A --ds-type-* variable that doesn't belong to a style, or a font primitive used where a style belongs.
  if (v.startsWith(`--${K.p}-type-`) && !K.byVar.has(v)) out.push({ ...where, line: d.line, rule: 'TR-02', level: 'error', message: `${v} is not a text style in this system.`, fix: 'Pick a style with the decision guide (typography.md).' });
}

function checkDeclarations(K, decls, where, selector, out) {
  const sel = selector ?? '';
  const reading = READING_SEL.test(sel);
  let fixedHeight = false, hidden = false, ellipsis = false, sizePx = null;
  for (const d of decls) {
    const v = d.value.trim();
    const vars = varsIn(v);
    for (const x of vars) checkStyleVar(K, x, d, where, out);
    const at = { ...where, line: d.line };
    const usesStyleVar = (prop) => vars.some((x) => K.byVar.get(x)?.prop === prop);
    if (d.prop.startsWith('--')) continue; // custom property definitions are checked where they are used
    if (d.prop === 'font-size') {
      if (usesStyleVar('fontSize') || SAFE.test(v) || /^\s*(1em|100%)\s*$/.test(v)) continue;
      if (vars.some((x) => x.startsWith(`--${K.p}-font-size-`))) { out.push({ ...at, rule: 'TR-01', level: 'error', message: `${vars[0]} is a raw size, not a text style.`, fix: 'Use the style\'s class or its --…-type-<style>-font-size variable (with its line height and letter-spacing).' }); continue; }
      const px = toPx(v);
      if (px) sizePx = px.px;
      if (px && px.px < K.min) out.push({ ...at, rule: 'TR-03', level: 'error', message: `font-size ${v} is ${+px.px.toFixed(1)}px — below the ${K.min}px floor.`, fix: 'Use type.caption.md or type.label.sm (12px) at the smallest.' });
      else out.push({ ...at, rule: 'TR-01', level: 'error', message: `Hand-set font size: ${v}${px?.unit === 'px' || px?.unit === '' ? ' (px ignores the reader\'s text size)' : ''}.`, fix: 'Use a text style (class .…-type-<style> or text-<style>) — pick it with the decision guide.' });
    } else if (d.prop === 'font') {
      if (SAFE.test(v) || /^\s*var\(/.test(v)) continue;
      if (/\d(px|rem|em|pt|%)|\b(small|medium|large)\b/.test(v)) out.push({ ...at, rule: 'TR-01', level: 'error', message: `Hand-set font shorthand: ${v}.`, fix: 'Use a text style; use font: inherit only to reset controls.' });
    } else if (d.prop === 'line-height') {
      if (usesStyleVar('lineHeight') || SAFE.test(v)) continue;
      const n = /^\s*([\d.]+)\s*$/.exec(v)?.[1];
      const px = /px\s*$/.test(v) ? toPx(v)?.px : null;
      const ratio = v.trim() === 'normal' ? 1.2 : n ? +n : px && sizePx ? px / sizePx : null;
      if (reading && (ratio === null || ratio < K.reading)) out.push({ ...at, rule: 'TR-03', level: 'error', message: `Reading text with line height ${v}${ratio ? ` (${ratio.toFixed(2)})` : ''} — needs ${K.reading} or more.`, fix: 'Use a reading style: type.body.*, type.caption.md or type.code.*.' });
      else out.push({ ...at, rule: 'TR-01', level: reading ? 'error' : 'warning', message: `Hand-set line height: ${v}${px ? ' (px line heights don\'t follow the font size)' : ''}.`, fix: 'Use the text style\'s line height (it is part of the style).' });
    } else if (d.prop === 'letter-spacing') {
      if (usesStyleVar('letterSpacing') || vars.some((x) => x.startsWith(`--${K.p}-font-letter-spacing-`)) || SAFE.test(v) || /^\s*(0|normal)\s*$/.test(v)) continue;
      const neg = /^\s*-/.test(v);
      out.push({ ...at, rule: 'TR-01', level: neg && (sizePx === null || sizePx < 24) ? 'error' : 'warning', message: `Hand-set letter-spacing: ${v}${neg ? ' — negative tracking crowds text below 24px' : ''}.`, fix: 'Leave letter-spacing to the text style (it follows the size).' });
    } else if (d.prop === 'font-family') {
      if (vars.some((x) => x.startsWith(`--${K.p}-font-family-`) || K.byVar.get(x)?.prop === 'fontFamily') || SAFE.test(v)) continue;
      out.push({ ...at, rule: 'TR-13', level: 'error', message: `Font family set in a component: ${v}.`, fix: 'Remove it (the style sets the family) or use var(--…-font-family-sans / -mono).' });
    } else if (d.prop === 'font-weight') {
      if (vars.length || SAFE.test(v)) continue;
      if (/^\s*(100|200|300|lighter)\s*$/.test(v)) out.push({ ...at, rule: 'TR-01', level: 'error', message: `Light weight ${v} — thin strokes are hard to read at text sizes and aren't in the system.`, fix: 'Use the style\'s weight; for emphasis var(--…-font-weight-semibold).' });
      else if (/^\s*(800|900|bolder)\s*$/.test(v)) out.push({ ...at, rule: 'TR-01', level: 'warning', message: `Weight ${v} isn't in the system (regular 400, medium 500, semibold 600, bold 700).`, fix: 'Use a style, or var(--…-font-weight-*) for emphasis.' });
    } else if (d.prop === 'text-transform' && /uppercase/.test(v) && reading) {
      out.push({ ...at, rule: 'TR-11', level: 'warning', message: 'Upper case on reading text — capitals are slow to read in sentences.', fix: 'Keep sentences in normal case; capitals only for short labels.' });
    } else if (d.prop === 'text-align' && /justify/.test(v)) {
      out.push({ ...at, rule: 'TR-12', level: 'warning', message: 'Justified text leaves uneven gaps between words.', fix: 'Use text-align: start.' });
    } else if (d.prop === 'font-variant-numeric' && /normal|proportional-nums/.test(v) && NUMBER_SEL.test(sel)) {
      out.push({ ...at, rule: 'TR-04', level: 'warning', message: `Numbers in ${sel.trim()} set to proportional digits — columns won't line up.`, fix: 'Remove it (tables get tabular numerals by default) or use type.numeric.*.' });
    } else if (/^(height|max-height)$/.test(d.prop) && /^\s*[\d.]+(px|rem|em)\s*$/.test(v)) fixedHeight = true;
    else if (/^overflow(-y)?$/.test(d.prop) && /hidden|clip/.test(v)) hidden = true;
    else if (d.prop === 'text-overflow' && /ellipsis/.test(v)) ellipsis = true;
  }
  const srOnly = /\.(sr-only|visually-hidden|screen-reader-only)\b/.test(sel); // screen-reader text is clipped on purpose
  if (fixedHeight && hidden && !srOnly) out.push({ ...where, rule: 'TR-07', level: 'warning', message: 'Fixed height with hidden overflow — text gets cut off when people enlarge it or increase spacing.', fix: 'Use min-height, or let the box grow with its text.' });
  else if (ellipsis) out.push({ ...where, rule: 'TR-07', level: 'warning', message: 'Truncated text (ellipsis).', fix: 'Make sure the full text is available: a title/tooltip on hover and focus, an expand control, or a details view.' });
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

const NUMERIC_TEXT = /^[−+\-–]?\s?[$€£¥₹]?\s?\d[\d,.\s:]*\d?\s?(%|[kKmMbB]|ms|s|h)?$/;

export function lintText(K, text, file) {
  // A file can opt out of named rules with a comment such as  <!-- ds-lint-ignore: TR-06 -->  (e.g. a specimen page).
  const ignored = new Set([...text.matchAll(/ds-lint-ignore:\s*([A-Z]{2}-\d{2}(?:[\s,]+[A-Z]{2}-\d{2})*)/g)].flatMap((m) => m[1].split(/[\s,]+/)));
  return lintCore(K, text, file).filter((x) => !ignored.has(x.rule));
}

function lintCore(K, text, file) {
  const out = [];
  const isTokens = /generated by ds-engine|Tailwind v4 theme for ds/.test(text.slice(0, 300));
  const cssSources = /\.(css|scss)$/.test(file) ? [{ css: text, start: 0 }] : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ({ css: m[1], start: m.index + m[0].indexOf(m[1]) }));
  const tabularClasses = new Set();
  if (!isTokens) {
    for (const src of cssSources) {
      const css = src.css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
      for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selector = m[1].trim();
        if (selector.startsWith('@')) continue; // @font-face and friends
        const line = lineOf(text, src.start + m.index + m[1].length);
        checkDeclarations(K, parseDecls(m[2], line), { file, line, where: selector }, selector, out);
        if (/font-variant-numeric\s*:\s*[^;]*tabular-nums/.test(m[2]) || /var\(--[a-z0-9-]+-type-numeric-/.test(m[2])) for (const c of selector.matchAll(/\.([a-zA-Z0-9_-]+)/g)) tabularClasses.add(c[1]);
      }
    }
  }
  // Inline styles
  for (const m of text.matchAll(/style\s*=\s*"([^"]*)"/g)) checkDeclarations(K, parseDecls(m[1], lineOf(text, m.index)), { file, line: lineOf(text, m.index), where: 'inline style' }, '', out);

  // Zoom must never be blocked.
  for (const m of text.matchAll(/<meta[^>]+name=["']viewport["'][^>]*>/gi)) {
    const c = /content=["']([^"']*)["']/i.exec(m[0])?.[1] ?? '';
    const max = /maximum-scale\s*=\s*([\d.]+)/.exec(c)?.[1];
    if (/user-scalable\s*=\s*(no|0)/.test(c) || (max && +max < 2)) out.push({ file, line: lineOf(text, m.index), where: 'meta viewport', rule: 'TR-09', level: 'error', message: `Zoom is blocked (${c}).`, fix: 'Use content="width=device-width, initial-scale=1" — never user-scalable=no or maximum-scale.' });
  }

  // Class lists: ds style classes and Tailwind utilities.
  const component = /\.(jsx|tsx|vue|svelte)$/.test(file);
  const classLists = component
    ? [...text.matchAll(/(["'`])((?:(?!\1)[^\\\n])*)\1/g)].filter((m) => /(^|\s)(text-|leading-|tracking-|font-|uppercase|truncate|line-clamp|h-\d|h-\[|overflow-hidden|[a-z]+-type-)/.test(m[2])).map((m) => ({ index: m.index, list: m[2] }))
    : [...text.matchAll(/class\s*=\s*["']([^"']*)["']/g)].map((m) => ({ index: m.index, list: m[1] }));
  let displayCount = 0;
  for (const m of classLists) {
    const line = lineOf(text, m.index);
    const cls = m.list.split(/\s+/).filter(Boolean).map((c) => c.replace(/^[a-z0-9-]+:/, '')); // drop variants (md:, hover:)
    const at = { file, line };
    // The element the class list belongs to: the last tag opened before it and not yet closed with ">".
    const tagM = /<([a-zA-Z][a-zA-Z0-9-]*)(?![^<]*>)[^<]*$/.exec(text.slice(0, m.index));
    const tag = tagM?.[1];
    const openTag = tagM ? text.slice(tagM.index, text.indexOf('>', m.index) + 1) : '';
    const style = cls.map((c) => K.byClass.get(c) ?? K.byTw.get(c)).find(Boolean);
    const readingEl = ['p', 'li', 'dd', 'blockquote', 'figcaption'].includes(tag) || (style && style.reading && style.role !== 'numeric');
    for (const c of cls) {
      const w = { ...at, where: `class "${c}"` };
      if (new RegExp(`^${K.p}-type-`).test(c) && !K.byClass.has(c)) out.push({ ...w, rule: 'TR-02', level: 'error', message: `.${c} is not a text style in this system.`, fix: 'Pick a style with the decision guide.' });
      else if (new RegExp(`^text-(${K.roles.join('|')})-[a-z0-9]+$`).test(c) && !K.byTw.has(c)) out.push({ ...w, rule: 'TR-02', level: 'error', message: `${c} is not a text style in this system.`, fix: 'Pick a style with the decision guide.' });
      if (TW_SIZE.test(c)) out.push({ ...w, rule: 'TR-01', level: 'error', message: `${c} is Tailwind's own size scale, not a ds text style.`, fix: 'Use a style utility such as text-body-md or text-label-md.' });
      const arb = /^text-\[([\d.]+(px|rem|em))\]$/.exec(c);
      if (arb) { const px = toPx(arb[1]).px; out.push({ ...w, rule: px < K.min ? 'TR-03' : 'TR-01', level: 'error', message: px < K.min ? `${c} is ${+px.toFixed(1)}px — below the ${K.min}px floor.` : `${c} is a hand-set size.`, fix: 'Use a style utility such as text-caption-md or text-body-sm.' }); }
      const lead = /^leading-(.+)$/.exec(c);
      if (lead) {
        const r = TW_LEADING[lead[1]] ?? (/^\[?[\d.]+\]?$/.test(lead[1]) ? +lead[1].replace(/[[\]]/g, '') : null);
        if (readingEl && (r === null || r < K.reading)) out.push({ ...w, rule: 'TR-03', level: 'error', message: `Reading text with ${c}${r ? ` (${r})` : ''} — needs ${K.reading} or more.`, fix: 'Remove it: reading styles already set their line height.' });
        else out.push({ ...w, rule: 'TR-01', level: 'warning', message: `${c} hand-sets the line height.`, fix: 'Remove it: the text style sets the line height.' });
      }
      if (/^tracking-/.test(c)) out.push({ ...w, rule: 'TR-01', level: /^tracking-(tight|tighter)$/.test(c) && !(style && style.breakpoints.sm.size >= 24) ? 'error' : 'warning', message: `${c} hand-sets letter-spacing${/tight/.test(c) ? ' — negative tracking crowds text below 24px' : ''}.`, fix: 'Remove it: letter-spacing is part of the text style.' });
      if (/^font-(thin|extralight|light)$/.test(c)) out.push({ ...w, rule: 'TR-01', level: 'error', message: `${c} — thin strokes are hard to read at text sizes and aren't in the system.`, fix: 'Use the style\'s weight; font-semibold for emphasis.' });
      if (/^font-(serif|\[.+\])$/.test(c)) out.push({ ...w, rule: 'TR-13', level: 'error', message: `${c} sets a font family in a component.`, fix: 'Remove it; use font-sans or font-mono (both map to the family tokens).' });
      if (c === 'text-justify') out.push({ ...w, rule: 'TR-12', level: 'warning', message: 'Justified text leaves uneven gaps between words.', fix: 'Remove text-justify.' });
      if (c === 'uppercase' && readingEl) out.push({ ...w, rule: 'TR-11', level: 'warning', message: 'Upper case on reading text — capitals are slow to read in sentences.', fix: 'Keep sentences in normal case.' });
      if ((c === 'truncate' || /^line-clamp-\d+$/.test(c)) && !/\btitle\s*=/.test(openTag)) out.push({ ...w, rule: 'TR-07', level: 'warning', message: `Truncated text (${c}).`, fix: 'Make sure the full text is available: a title/tooltip on hover and focus, an expand control, or a details view.' });
    }
    if (style) {
      if (style.role === 'display') displayCount++;
      if (style.family === 'mono' && K.byTw.has(cls.find((c) => K.byTw.get(c) === style)) && !cls.includes('font-mono')) out.push({ ...at, where: 'class list', rule: 'TR-01', level: 'warning', message: `${style.tailwind} without font-mono shows code in the sans font.`, fix: `Add font-mono, or use .${style.cssClass}.` });
      if (style.tabular && K.byTw.has(cls.find((c) => K.byTw.get(c) === style)) && !cls.includes('tabular-nums')) out.push({ ...at, where: 'class list', rule: 'TR-04', level: 'warning', message: `${style.tailwind} without tabular-nums — digits won't line up.`, fix: `Add tabular-nums, or use .${style.cssClass}.` });
    }
    if (cls.some((c) => /^h-(\d|\[)/.test(c)) && cls.includes('overflow-hidden')) out.push({ ...at, where: 'class list', rule: 'TR-07', level: 'warning', message: 'Fixed height with hidden overflow — text gets cut off when people enlarge it or increase spacing.', fix: 'Use min-h-*, or let the box grow with its text.' });
  }
  if (displayCount > 1) out.push({ file, line: 1, where: 'file', rule: 'TR-06', level: 'warning', message: `${displayCount} display styles in one view — they compete with each other.`, fix: 'Keep one display style; use heading styles for the rest.' });

  // Heading levels must follow the outline.
  let prev = 0;
  for (const m of text.matchAll(/<h([1-6])\b/g)) {
    const lv = +m[1];
    if (prev && lv > prev + 1) out.push({ file, line: lineOf(text, m.index), where: `<h${lv}>`, rule: 'TR-05', level: 'warning', message: `Heading level skips from h${prev} to h${lv}.`, fix: `Use h${prev + 1} and give it the style you want — the tag follows the outline, the style the look.` });
    prev = lv;
  }
  // Numbers that look compared but have proportional digits (heuristic, warning only).
  for (const m of text.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>([^<]{2,24})</g)) {
    const [, tag, attrs, inner] = m;
    const shown = inner.trim();
    if (!NUMERIC_TEXT.test(shown) || (shown.match(/\d/g) ?? []).length < 3) continue;
    if (['td', 'th', 'output', 'data', 'code', 'kbd', 'samp', 'pre', 'time', 'option', 'title', 'script', 'style'].includes(tag)) continue;
    const before = text.slice(0, m.index);
    if (before.lastIndexOf('<td') > before.lastIndexOf('</td>') || before.lastIndexOf('<th') > before.lastIndexOf('</th>')) continue;
    const cl = /class(?:Name)?\s*=\s*["'`{]([^"'`}]*)/.exec(attrs)?.[1] ?? '';
    const cs = cl.split(/\s+/);
    if (cs.includes('tabular-nums') || cs.some((c) => K.byClass.get(c)?.tabular || K.byTw.get(c)?.tabular || tabularClasses.has(c)) || /tabular-nums|type-numeric-/.test(attrs)) continue;
    if (!NUMBER_SEL.test(`.${cs.join(' .')}`) && !/\b(stat|metric|kpi|amount|price|total|count|value|balance)/.test(cl)) continue;
    out.push({ file, line: lineOf(text, m.index), where: `<${tag}> "${shown}"`, rule: 'TR-04', level: 'warning', message: `A compared number with proportional digits: "${shown}".`, fix: 'Use type.numeric.* (or add tabular-nums) so digits line up and don\'t jump when the value updates.' });
  }
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

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('type-lint.js')) {
  const args = process.argv.slice(2);
  const ci = args.indexOf('--contract');
  const contract = ci >= 0 ? args.splice(ci, 2)[1] : path.join(HERE, '../../out/default/ai/typography.contract.json');
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
