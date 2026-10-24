#!/usr/bin/env node
// Border checker: finds border-rule breaks in CSS, HTML and Tailwind/JSX against the border contract.
// Usage: node src/lint/border-lint.js <files or folders...> [--contract out/default/ai/border.contract.json] [--json]
// Has no dependencies: copy this one file into any project and point --contract at the border.contract.json you ship.
// Exit code 1 when any error is found. `ds-lint-ignore: BR-xx` anywhere in a file switches a rule off for that file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const loadContract = (file) => contractIndex(JSON.parse(fs.readFileSync(file, 'utf8')));

export function contractIndex(c) {
  const jobs = c.jobs.map((j) => j.job);
  const identifies = new Set(c.jobs.filter((j) => j.identifies).map((j) => j.job));
  const decorative = ['subtle', 'default', 'floating'];
  return { c, p: c.prefix, jobs, known: new Set(jobs), identifies, decorative, prims: c.scale.map((s) => s.token.split('.').pop()) };
}

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
const BORDER_PROP = /^border(-(top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end))?(-width)?$/;
const OUTLINE_PROP = /^outline(-width|-style)?$/;
const FOCUS = /:(focus|focus-visible|focus-within)(?![\w-])/;
const STATE = /:(invalid|user-invalid|checked)(?![\w-])|\[(aria-(invalid|selected|current|pressed|checked)|data-state|data-selected|data-invalid)\b|\.(is-[a-z-]+|selected|active|current|invalid|error|has-error|checked|pressed)(?=$|[\s:.[,#>+~)])/;
const CONTROL_SEL = /(^|[\s>+~,(])(input|select|textarea|button|\.btn|\.button|\.field|\.input|\.select|\[role="?(checkbox|radio|switch|combobox|textbox|button)"?\])(?=$|[\s:.[,#>+~)])/;
const OLD = { default: 'line (structure) or control (a control\'s edge)', input: 'control', strong: 'state' };

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

/** What a border or outline value is made of: width tokens by job, primitives, raw lengths, keywords, colour roles. */
function readValue(K, value) {
  const jobs = [...value.matchAll(new RegExp(`--${K.p}-border-width-([a-z][a-z-]*)`, 'g'))].map((m) => m[1]);
  const prims = [...value.matchAll(new RegExp(`--${K.p}-border-width-(\\d)\\b`, 'g'))].map((m) => m[1]);
  const colors = [...value.matchAll(new RegExp(`--${K.p}-color-border-([a-z-]+)`, 'g'))].map((m) => m[1]);
  const stripped = value.replace(/var\(\s*--[a-z0-9-]+\s*(,[^()]*)?\)/gi, ' ').replace(/calc\([^)]*\)/gi, ' ').replace(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)/gi, ' ');
  const lengths = [...stripped.matchAll(/(^|[\s(,])(-?\d*\.?\d+)(px|rem|em)?(?=$|[\s),])/g)].map((m) => ({ n: +m[2], unit: m[3] ?? (m[2] === '0' ? '' : 'px'), text: m[2] + (m[3] ?? '') }));
  const keyword = /(^|\s)(thin|medium|thick)(\s|$)/.exec(stripped)?.[2] ?? null;
  const none = /^\s*(none|0|0px|hidden)\s*$/.test(value);
  const style = /(^|\s)(solid|dashed|dotted|double|groove|ridge|inset|outset)(\s|$)/.test(stripped);
  const transparent = /\btransparent\b/.test(value);
  return { jobs: jobs.filter((j) => !/^\d/.test(j)), prims, colors, lengths, keyword, none, style, transparent };
}

/** A box-shadow layer that draws a line: no blur, and a spread (Tailwind ring-*, `0 0 0 2px`) or a small offset (`inset 0 -1px 0`). */
const shadowLine = (value) => value.split(/,(?![^(]*\))/).some((x) => { const n = x.replace(/rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-f]+|var\([^)]*\)|inset/gi, ' ').trim().split(/\s+/).filter(Boolean).map(parseFloat); if (n.length < 3 || n.some(Number.isNaN)) return false; const [x0, y0, blur = 0, spread = 0] = n; return blur === 0 && (spread > 0 || (Math.abs(x0) <= 4 && Math.abs(y0) <= 4 && (x0 !== 0 || y0 !== 0))); });

function checkBorder(K, prop, value, sel, at, out) {
  const v = readValue(K, value);
  const jobList = K.jobs.map((j) => `--${K.p}-border-width-${j}`).join(', ');
  if (v.none) return v;
  for (const pr of v.prims) out.push({ ...at, rule: 'BR-02', level: 'error', message: `${prop}: ${value} uses a border width primitive (--${K.p}-border-width-${pr}).`, fix: `Pick the job: ${jobList}.` });
  for (const j of v.jobs) if (!K.known.has(j)) out.push({ ...at, rule: 'BR-01', level: 'error', message: `--${K.p}-border-width-${j} is not a border job in this system${OLD[j] ? ' (renamed)' : ''}.`, fix: OLD[j] ? `Use --${K.p}-border-width-${OLD[j].split(' ')[0]}${OLD[j].includes(' or ') ? ` or -${OLD[j].split(' or ')[1].split(' ')[0]}` : ''}: ${OLD[j]}.` : `Use ${jobList} — or add a job in the engine config (border.roles).` });
  const widths = v.lengths.filter((l) => l.n !== 0);
  for (const l of widths) {
    if (l.unit === 'rem' || l.unit === 'em') out.push({ ...at, rule: 'BR-03', level: 'error', message: `${prop}: ${value} — a width in ${l.unit} grows with the reader's text: at 200% text every 1px line becomes 2px, the width of a state.`, fix: `Use a job in px: ${jobList}.` });
    else if (l.n < 1) out.push({ ...at, rule: 'BR-03', level: 'error', message: `${prop}: ${value} is a hairline — Chrome and Edge round it up to 1px, Safari and Firefox can draw one device pixel: it looks different in every browser.`, fix: `Use --${K.p}-border-width-line with a quieter colour (--${K.p}-color-border-subtle).` });
    else out.push({ ...at, rule: 'BR-01', level: 'error', message: `${prop}: ${value} is hard-coded (${l.text}).`, fix: `Use the job: ${jobList}${CONTROL_SEL.test(sel) ? ` (a control's edge: --${K.p}-border-width-control)` : ''}.` });
  }
  if (v.keyword) out.push({ ...at, rule: 'BR-03', level: 'error', message: `${prop}: ${value} — "${v.keyword}" is a browser-chosen width (thin can be under a pixel; medium is 3px).`, fix: `Use a job: ${jobList}.` });
  // A shorthand with a style but no width draws "medium" (3px).
  if (/^border(-[a-z-]+)?$/.test(prop) && !/-width$/.test(prop) && v.style && !v.jobs.length && !v.prims.length && !widths.length && !v.keyword && !/var\(/.test(value)) out.push({ ...at, rule: 'BR-01', level: 'error', message: `${prop}: ${value} has no width — browsers draw "medium" (3px).`, fix: `Add the job's width: ${jobList}.` });
  // Colour fits the job.
  const job = v.jobs.find((j) => K.known.has(j));
  if (job && K.identifies.has(job) && v.colors.some((c) => K.decorative.includes(c))) out.push({ ...at, rule: 'BR-07', level: 'error', message: `${prop}: ${value} — a ${job} line drawn in a decorative colour (border.${v.colors.find((c) => K.decorative.includes(c))}), under 3:1.`, fix: job === 'control' ? `Use --${K.p}-color-border-input (fields, checkboxes) or --${K.p}-color-border-strong.` : `Use --${K.p}-color-border-selected or a status border colour (danger, warning, success).` });
  if (job === 'line' && CONTROL_SEL.test(sel) && !/::?(before|after)|::placeholder/.test(sel) && !v.transparent) out.push({ ...at, rule: 'BR-07', level: 'warning', message: `${sel.trim()} is a control but takes the line width — the product's control width (border.control) won't reach it.`, fix: `Use --${K.p}-border-width-control.` });
  return v;
}

export function lintText(K, text, file) {
  const ignored = new Set([...text.matchAll(/ds-lint-ignore:\s*([A-Z]{2}-\d{2}(?:[\s,]+[A-Z]{2}-\d{2})*)/g)].flatMap((m) => m[1].split(/[\s,]+/)));
  return lintCore(K, text, file).filter((x) => !ignored.has(x.rule));
}

function lintCore(K, text, file) {
  const out = [];
  if (/generated by ds-engine|Tailwind v4 theme for ds/.test(text.slice(0, 300))) return out;
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
  // The border each selector has outside any state, to compare state rules with.
  const base = new Map();
  for (const r of rules) {
    if (STATE.test(r.selector) || FOCUS.test(r.selector)) continue;
    for (const s of r.selector.split(',')) for (const d of r.decls) if (BORDER_PROP.test(d.prop)) base.set(s.replace(/\s+/g, ' ').trim(), d.value);
  }
  // Classes used on form controls in this file's markup: a .pay rule on a <button class="pay"> is a control rule.
  const ctrlClasses = new Set([...text.matchAll(/<(button|input|select|textarea)\b[^>]*\bclass(?:Name)?=["']([^"']*)["']/g)].flatMap((m) => m[2].split(/\s+/)).filter(Boolean));
  const isControl = (sel) => CONTROL_SEL.test(sel) || sel.split(',').some((x) => { const c = /\.([a-zA-Z][\w-]*)\s*$/.exec(x.trim().replace(/:[a-z-]+(\([^)]*\))?$/g, ''))?.[1]; return c && ctrlClasses.has(c); });
  for (const r of rules) {
    const at0 = { file, where: r.selector.slice(0, 60) };
    const sels = r.selector.split(',').map((s) => s.trim());
    let widened = null;
    for (const d of r.decls) {
      const at = { ...at0, line: d.line };
      if (d.prop.startsWith('--')) {
        if (new RegExp(`^--${K.p}-(border-width|focus-ring)-`).test(d.prop)) out.push({ ...at, rule: 'BR-11', level: 'error', message: `${d.prop} is redefined in app code.`, fix: 'Change border.control or border.roles in the engine config and build, so the change is checked.' });
        continue;
      }
      if (BORDER_PROP.test(d.prop)) {
        const v = checkBorder(K, d.prop, d.value, r.selector, at, out);
        // A control whose fill is its edge: forced colours replace the fill, so it needs a (transparent) border.
        // Solid fills only: an item the colour of its menu or card is found by its text, like a link.
        const filled = r.decls.some((x) => /^background(-color)?$/.test(x.prop) && /action-(primary|secondary|danger)-bg|bg-(brand|success|warning|danger|info)(?![a-z-]*subtle)|#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i.test(x.value));
        if (v.none && filled && isControl(r.selector) && !STATE.test(r.selector) && !FOCUS.test(r.selector) && !/-(top|right|bottom|left|block|inline)/.test(d.prop)) out.push({ ...at, rule: 'BR-06', level: 'warning', message: `${r.selector.trim()} has a fill but no border — in forced colours (Windows contrast themes) the fill is replaced by the page colour and nothing shows where it is.`, fix: `border: var(--${K.p}-border-width-control) solid transparent — invisible here, drawn in the system text colour there.` });
        if (v.jobs.some((j) => j === 'state' || j === 'indicator')) widened = v.jobs.find((j) => j === 'state' || j === 'indicator');
      }
      if (d.prop === 'box-shadow' && shadowLine(d.value) && !FOCUS.test(r.selector)) out.push({ ...at, rule: 'BR-06', level: 'warning', message: `${r.selector.trim()} draws a line with box-shadow (${d.value}) — forced colours remove box-shadows, so the line disappears.`, fix: `Use a border (--${K.p}-border-width-<job>) or an outline with a negative offset.` });
      if (/^margin(-inline-start|-inline|-left|-block-start|-top)?$/.test(d.prop) && /^-\s*(1px|var\(--[a-z0-9-]*border-width)/.test(d.value)) out.push({ ...at, rule: 'BR-10', level: 'warning', message: `${r.selector.trim()} overlaps its neighbour by hand (${d.prop}: ${d.value}).`, fix: `Use .${K.p}-join: it overlaps by the control width, squares the seams and lifts the part that changes.` });
    }
    // Hover and press change the fill, never the width: a wider border under the pointer moves the content.
    const hoverSel = sels.find((x) => /:(hover|active)(?![\w-])/.test(x));
    if (hoverSel) {
      const hb = hoverSel.replace(/:(hover|active)(?![\w-])/g, '').replace(/\s+/g, ' ').trim();
      const was = base.get(hb);
      for (const d of r.decls.filter((x) => BORDER_PROP.test(x.prop) && /width|^border(-[a-z-]+)?$/.test(x.prop))) {
        const nowW = readValue(K, d.value), wasW = was ? readValue(K, was) : null;
        const key = (x) => [...x.jobs, ...x.lengths.map((l) => l.text)].join();
        if ((nowW.jobs.length || nowW.lengths.length) && (!wasW || key(nowW) !== key(wasW))) out.push({ file, line: d.line, where: r.selector.slice(0, 60), rule: 'BR-09', level: 'warning', message: `${hoverSel} changes the border width on ${/active/.test(hoverSel) ? 'press' : 'hover'} — the content moves and it looks like a selection.`, fix: 'Change the fill instead (color.bg.state-hover, the action hover colours); keep the width.' });
      }
    }
    // Focus: never removed without a replacement; never box-shadow alone.
    const outlineOff = r.decls.find((d) => OUTLINE_PROP.test(d.prop) && /^\s*(none|0|0px|hidden)\s*$/.test(d.value));
    const outlineOn = r.decls.find((d) => OUTLINE_PROP.test(d.prop) && !/^\s*(none|0|0px|hidden)\s*$/.test(d.value) && d.prop !== 'outline-style');
    const shadow = r.decls.find((d) => d.prop === 'box-shadow' && !/^\s*none\s*$/.test(d.value));
    const removesRing = outlineOff && !outlineOn && (FOCUS.test(r.selector) || /(^|[\s,])(\*|a|button|input|select|textarea|summary|\[tabindex[^\]]*\]|:focus)(?=$|[\s,:.[])/.test(r.selector));
    if (removesRing) {
      // In a forced-colours block outline: none is the author's own choice for that mode — still a lost ring.
      out.push({ file, line: outlineOff.line, where: r.selector.slice(0, 60), rule: 'BR-05', level: 'error', message: `${r.selector.trim()} removes the focus ring (${outlineOff.prop}: ${outlineOff.value})${shadow && FOCUS.test(r.selector) ? ' and draws one with box-shadow, which forced colours remove' : ''}.`, fix: shadow && FOCUS.test(r.selector) ? 'Keep an outline: outline: var(--ds-focus-ring-width) solid transparent beside the shadow — or remove both and let tokens.css draw the ring.'.replace(/--ds-/g, `--${K.p}-`) : 'Remove it: tokens.css draws the ring on :focus-visible (and only there, so mouse clicks don\'t show it).' });
    }
    // State rules: not colour alone; a wider border comes off the padding.
    // Marks drawn on a pseudo-element (a check mark) and checked boxes (the mark is the cue) are not state borders.
    const stateSel = sels.find((s) => STATE.test(s) && !/::?(before|after)\b/.test(s));
    if (stateSel && !FOCUS.test(stateSel)) {
      const colourOnly = r.decls.filter((d) => /^border(-[a-z-]+)?-color$/.test(d.prop) || (BORDER_PROP.test(d.prop) && readValue(K, d.value).colors.length && !readValue(K, d.value).jobs.length && !readValue(K, d.value).lengths.length));
      const baseSel = stateSel.replace(/\[(aria|data)-[a-z-]+(=[^\]]*)?\]/g, '').replace(new RegExp(STATE.source, 'g'), '').replace(/\s+/g, ' ').trim();
      const was = base.get(baseSel);
      const bar = was && readValue(K, was).transparent && readValue(K, was).jobs.some((j) => j === 'state' || j === 'indicator');
      if (colourOnly.length && bar) out.push({ file, line: colourOnly[0].line, where: r.selector.slice(0, 60), rule: 'BR-08', level: 'warning', message: `${stateSel} colours a transparent ${readValue(K, was).jobs[0]} border that every item has — in forced colours transparent borders are drawn, so every item shows the bar.`, fix: `Draw the bar only on the current item: a border there with the padding reduced by its width, or a ::after with border-block-end: var(--${K.p}-border-width-indicator) solid var(--${K.p}-color-border-selected).` });
      else if (colourOnly.length && !widened && !/:checked/.test(stateSel) && !r.decls.some((d) => /^(outline|box-shadow)/.test(d.prop))) out.push({ file, line: colourOnly[0].line, where: r.selector.slice(0, 60), rule: 'BR-08', level: 'warning', message: `${stateSel} shows its state by border colour alone.`, fix: `Widen it to --${K.p}-border-width-state (and take the extra width off the padding), and add a check mark, icon or message.` });
      const pad = r.decls.find((d) => /^padding/.test(d.prop));
      const compensated = pad && /calc\(/.test(pad.value) && /border-width/.test(pad.value);
      if (widened && !compensated && !(was && readValue(K, was).jobs.includes(widened))) out.push({ file, line: r.line, where: r.selector.slice(0, 60), rule: 'BR-09', level: 'warning', message: `${stateSel} widens the border to ${widened} without taking the extra width off the padding — the content moves when the state changes.`, fix: `padding-inline: calc(var(--${K.p}-space-inset-md) - (var(--${K.p}-border-width-${widened}) - var(--${K.p}-border-width-control))) — or the padding the element has, less the difference.` });
    }
  }
  // Inline styles: the tag and classes stand in for the selector.
  for (const m of text.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)\sstyle\s*=\s*"([^"]*)"/g)) {
    const cls = /class(?:Name)?=["']([^"']*)/.exec(m[2])?.[1] ?? '';
    const sel = `${m[1].toLowerCase()}${cls ? '.' + cls.trim().split(/\s+/).join('.') : ''}`;
    for (const d of parseDecls(m[3], lineOf(text, m.index))) {
      const at = { file, line: lineOf(text, m.index), where: 'inline style' };
      if (new RegExp(`^--${K.p}-(border-width|focus-ring)-`).test(d.prop)) out.push({ ...at, rule: 'BR-11', level: 'error', message: `${d.prop} is redefined inline.`, fix: 'Change the engine config and build.' });
      else if (BORDER_PROP.test(d.prop)) checkBorder(K, d.prop, d.value, sel, at, out);
      else if (OUTLINE_PROP.test(d.prop) && /^\s*(none|0)\s*$/.test(d.value)) out.push({ ...at, rule: 'BR-05', level: 'error', message: `<${m[1]}> removes its focus ring inline (${d.prop}: ${d.value}).`, fix: 'Remove it: tokens.css draws the ring on :focus-visible.' });
      else if (d.prop === 'box-shadow' && shadowLine(d.value)) out.push({ ...at, rule: 'BR-06', level: 'warning', message: `<${m[1]}> draws a line with box-shadow — forced colours remove it.`, fix: 'Use a border with a job width.' });
    }
  }
  // Class lists: Tailwind border, ring and outline utilities.
  const component = /\.(jsx|tsx|vue|svelte)$/.test(file);
  const classLists = component
    ? [...text.matchAll(/(["'`])((?:(?!\1)[^\\\n])*)\1/g)].filter((m) => /(^|\s|:)(border|ring|outline|divide|-m[lstx]?-px)/.test(m[2]) && !/^[./@]|\s=>\s|^https?:/.test(m[2])).map((m) => ({ index: m.index, list: m[2] }))
    : [...text.matchAll(/class\s*=\s*["']([^"']*)["']/g)].map((m) => ({ index: m.index, list: m[1] }));
  const SIDE = '(?:-(?:x|y|t|r|b|l|s|e|bs|be))?';
  const TW_BW = new RegExp(`^(border|divide)${SIDE}(?:-(.+))?$`);
  for (const m of classLists) {
    const line = lineOf(text, m.index);
    const all = m.list.split(/\s+/).filter(Boolean);
    const base = all.map((c) => c.replace(/^([a-z0-9@[\]_&=-]+:)+/, '').replace(/^!/, ''));
    const tagM = /<([a-zA-Z][a-zA-Z0-9-]*)(?![^<]*>)[^<]*$/.exec(text.slice(0, m.index));
    const tag = tagM?.[1]?.toLowerCase() ?? '';
    const hasOutline = all.some((c) => /(^|:)outline(-\d|-\[|-(solid|dashed|dotted|double)|$)/.test(c) && !/outline-(none|hidden|0)$/.test(c));
    for (const [i, c] of base.entries()) {
      const raw = all[i], w = { file, line, where: `class "${raw}"` };
      if ((tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') && /^border-(0|none)$/.test(c) && base.some((x) => /^bg-(action-(primary|secondary|danger)-bg|bg-(brand|success|warning|danger|info)$)/.test(x))) out.push({ ...w, rule: 'BR-06', level: 'warning', message: `${raw} on a filled <${tag}> — in forced colours its fill is replaced and nothing shows where it is.`, fix: 'Use border-control border-transparent: invisible here, drawn in the system text colour in forced colours.' });
      const t = TW_BW.exec(c);
      if (t) {
        const [, kind, val] = t;
        if (kind === 'divide' && val === undefined) { out.push({ ...w, rule: 'BR-04', level: 'error', message: `${raw} — Tailwind's own width.`, fix: `Use ${raw.replace(/divide(-[xy])?/, (x) => `${x}-line`)}.` }); continue; }
        if (val === undefined) { out.push({ ...w, rule: 'BR-04', level: 'error', message: `${raw} — Tailwind's own 1px width, which doesn't follow the product's control width.`, fix: `Use ${raw}-line (structure) or ${raw}-control (a control's edge).` }); continue; }
        if (val === '0' || val === 'none' || val === 'solid' || val === 'dashed' || val === 'dotted' || val === 'collapse' || val === 'separate' || val === 'transparent' || val === 'current' || val === 'inherit' || val === 'reverse') continue;
        if (/^(line|control|state|indicator)$/.test(val) || K.known.has(val)) continue;
        if (/^0?\.\d+$/.test(val)) { out.push({ ...w, rule: 'BR-03', level: 'error', message: `${raw} is a hairline (${val}px).`, fix: `Use ${raw.replace(/-[\d.]+$/, '-line')} with a quieter colour.` }); continue; }
        if (/^\d+$/.test(val)) { out.push({ ...w, rule: 'BR-04', level: 'error', message: `${raw} — Tailwind's own ${val}px width.`, fix: `Use the job: ${K.jobs.map((j) => raw.replace(/-\d+$/, `-${j}`)).join(', ')}.` }); continue; }
        if (val.startsWith('[') || val.startsWith('(')) {
          const inner = val.slice(1, -1).replace(/_/g, ' ').replace(/^length:/, '');
          if (/^(#|rgb|hsl|oklch|color:|var\(--[a-z0-9-]*color)/.test(inner)) continue;
          if (new RegExp(`--${K.p}-border-width-(\\d)\\b`).test(inner)) out.push({ ...w, rule: 'BR-02', level: 'error', message: `${raw} uses a border width primitive.`, fix: `Use ${raw.replace(/-[[(].*$/, '-<job>')} (${K.jobs.join(', ')}).` });
          else if (/^\d*\.?\d+(rem|em)$/.test(inner)) out.push({ ...w, rule: 'BR-03', level: 'error', message: `${raw} — a width in ${inner.replace(/[\d.]/g, '')} grows with text.`, fix: `Use ${raw.replace(/-[[(].*$/, '-line')} or another job.` });
          else if (/^0?\.\d+px$/.test(inner)) out.push({ ...w, rule: 'BR-03', level: 'error', message: `${raw} is a hairline.`, fix: `Use ${raw.replace(/-[[(].*$/, '-line')}.` });
          else if (/^\d*\.?\d+px$/.test(inner) || /^(thin|medium|thick)$/.test(inner)) out.push({ ...w, rule: 'BR-04', level: 'error', message: `${raw} is hard-coded.`, fix: `Use the job: ${K.jobs.map((j) => raw.replace(/-[[(].*$/, `-${j}`)).join(', ')}.` });
          continue;
        }
        // Anything else is a colour (border-border-input, border-gray-300): the colour checker's job.
        continue;
      }
      if (/^ring(-inset)?$|^ring-(\d+|\[[^\]]*\])$|^inset-ring(-\d+)?$/.test(c)) out.push({ ...w, rule: /(^|:)(focus|focus-visible|focus-within)/.test(raw) ? 'BR-05' : 'BR-04', level: 'error', message: `${raw} draws with box-shadow — forced colours remove it${/(focus)/.test(raw) ? ', so the element has no focus ring there' : ''}.`, fix: /(focus)/.test(raw) ? 'Remove it and the outline-none beside it: tokens.css draws the ring on :focus-visible.' : `Use a border with a job width (border-${K.jobs.join(', border-')}).` });
      if (/^outline-(none|hidden|0)$/.test(c) && !hasOutline) out.push({ ...w, rule: 'BR-05', level: 'error', message: `${raw} removes the focus ring${all.some((x) => /ring/.test(x)) ? ' (the ring-* beside it is a box-shadow, removed in forced colours)' : ''}.`, fix: 'Remove it: tokens.css draws the ring on :focus-visible.' });
      if (/^-(m[lstxy]?|space-[xy])-px$/.test(c)) out.push({ ...w, rule: 'BR-10', level: 'warning', message: `${raw} overlaps neighbours by hand.`, fix: `Use .${K.p}-join.` });
    }
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

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('border-lint.js')) {
  const args = process.argv.slice(2);
  const ci = args.indexOf('--contract');
  const contract = ci >= 0 ? args.splice(ci, 2)[1] : path.join(HERE, '../../out/default/ai/border.contract.json');
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
