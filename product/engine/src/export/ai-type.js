// Typography AI content: a machine-readable contract (JSON) and a rulebook (Markdown) for AI tools.
// Both are generated from the engine, so they always match the shipped styles.
import { cssName } from './css.js';
import { BREAKPOINTS, WEIGHTS, TRACKING, MIN_SIZE, READING_LH, MIN_LH, TRACK_FROM, FONT_STYLE } from '../foundations/typography.js';
import { BREAKPOINT_MIN } from '../foundations/layout.js';

// Default element → style mapping drawn by tokens.css (the base layer). Utilities and classes still win.
export const HTML_DEFAULTS = { body: 'type.body.md', h1: 'type.heading.lg', h2: 'type.heading.md', h3: 'type.heading.sm', h4: 'type.title.lg', h5: 'type.title.md', h6: 'type.title.md' };

// Which chapter of the typography foundation documents each style (mirrors the Figma file and the guide).
export function chapterOfStyle(path) {
  const role = path.split('.')[1];
  if (['display', 'heading'].includes(role)) return 'Headings and display';
  if (['title', 'label'].includes(role)) return 'Titles and labels';
  if (['body', 'caption', 'code'].includes(role)) return 'Reading text';
  if (role === 'numeric') return 'Numbers and data';
  return 'Product styles';
}

export const TYPE_DECISIONS = [
  { what: 'Text that names something', question: 'What does it name?', answers: [
    ['The page\'s one big statement (landing, welcome, empty page)', 'type.display.lg / type.display.md / type.display.sm'],
    ['The page itself — its title (the h1)', 'type.heading.lg'], ['A section of the page', 'type.heading.md'], ['A subsection', 'type.heading.sm'],
    ['A dialog or side panel', 'type.title.lg'], ['A card or panel', 'type.title.md'], ['An item in a dense list, menu or table group', 'type.title.sm']] },
  { what: 'Text people read', question: 'Where does it sit?', answers: [
    ['The intro under a page or section title', 'type.body.lg'], ['A paragraph or description', 'type.body.md'],
    ['Dense screens, text in table cells, secondary paragraphs', 'type.body.sm'], ['Help under a field, a timestamp, a footnote, chart labels', 'type.caption.md']] },
  { what: 'Text people act on', question: 'How dense is the screen?', answers: [
    ['Buttons, field labels, tabs, menu items', 'type.label.md'], ['The same in comfortable density', 'type.label.lg'], ['Badges, chips, compact controls', 'type.label.sm']] },
  { what: 'A number', question: 'Will people compare it with others?', answers: [
    ['Yes — a column in a table, a list of totals, a timer', 'type.numeric.md (type.numeric.sm in compact tables)'], ['The headline figure on a metric card', 'type.numeric.lg'],
    ['No — a number inside a sentence', 'the sentence\'s own style (body …)']] },
  { what: 'Code', question: 'What is around it?', answers: [
    ['A code block, or inline code in body text', 'type.code.md'], ['Inline code in small text; IDs and keys in tables', 'type.code.sm']] },
  { what: 'A heading tag', question: 'Where is it in the page outline?', answers: [
    ['Pick h1–h6 by the outline (never skip a level); pick the style by how much it should stand out', 'any heading tag + any heading or title style'],
    ['A title that is not a heading (a card label, a button)', 'no heading tag; use the style on a div/span/button']] },
];

export const TYPE_RULES = [
  ['TR-01', 'Use a text style for every piece of text. Never set font size, line height or letter-spacing by hand.', 'Styles carry the sizes for every breakpoint and line heights that are checked; a hand-set 15px carries neither.', '—'],
  ['TR-02', 'Choose the style by what the text is, not by the size you want.', 'The size of a style changes with the screen; its job doesn\'t. Pick by job and the sizes follow.', '—'],
  ['TR-03', `Nothing smaller than ${MIN_SIZE}px. Paragraphs, help text and code use reading styles (body, caption, code), which keep line height at ${READING_LH} or more.`, 'Small or cramped text is the first thing people with low vision or dyslexia lose.', '1.4.12, 1.4.8'],
  ['TR-04', 'Numbers people compare — table columns, totals, metrics, timers — use tabular numerals: type.numeric.* or tabular-nums.', 'Proportional digits have different widths, so columns don\'t line up and values jump while they update.', '—'],
  ['TR-05', 'Heading tags follow the page outline; styles follow the visual weight. Never skip a level (h2 → h4) to get a size.', 'Screen-reader users move through a page by heading level.', '1.3.1, 2.4.6'],
  ['TR-06', 'At most one display style per view, and never for an app\'s page title (use type.heading.lg).', 'A second display competes with the first and flattens the hierarchy.', '—'],
  ['TR-07', 'Never give text a fixed height. If you must truncate, the full text stays available (expand, tooltip on hover and focus, or a details view).', 'People enlarge text to 200% and override line and letter spacing; fixed boxes clip it.', '1.4.4, 1.4.12'],
  ['TR-08', 'Keep running text within layout.measure.reading (about 70 characters a line).', 'On long lines readers lose their place when jumping to the next line.', '1.4.8'],
  ['TR-09', 'Never block zoom (user-scalable=no, maximum-scale below 2) and never size text in px in code.', 'Zoom and the browser\'s text size are how many people read; px text ignores the text-size setting.', '1.4.4'],
  ['TR-10', 'Emphasise with <strong> (semibold) or <em>. Underline is only for links; colour alone never carries emphasis.', 'Underlined words look like links; colour-only emphasis is invisible to some readers.', '1.4.1'],
  ['TR-11', 'Capitals only for short labels (three words or fewer), using a style made for them (it adds letter-spacing). Never for sentences.', 'All-caps text is slower to read and loses word shapes.', '—'],
  ['TR-12', 'Left-align running text (start-align in right-to-left languages). Never justify it.', 'Justified text leaves uneven gaps that make lines hard to follow.', '1.4.8'],
  ['TR-13', 'Fonts come only from font.family.sans and font.family.mono. Never set a font-family in a component.', 'The family tokens carry a tested fallback stack, so text stays readable while fonts load; one place to change a brand font.', '—'],
  ['TR-14', 'Design once with styles; the breakpoint changes the sizes (Responsive mode in Figma, media queries in code). Never swap to a "mobile" style by name.', 'The styles already shrink on small screens; swapping names breaks the hierarchy at other widths.', '—'],
];

const code = (s) => `\`${s}\``;
// HTML tags in prose would be swallowed by Markdown renderers: show them as code.
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m));
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;

/** Measured mistakes: what goes wrong, with the numbers, and the style that fixes it. */
function mistakes(sys) {
  const body = sys.resolve('type.body.md', { Responsive: 'md' });
  const cap = sys.resolve('type.caption.md', { Responsive: 'md' });
  const lab = sys.resolve('type.label.md', { Responsive: 'md' });
  const title = sys.resolve('type.title.md', { Responsive: 'md' });
  return [
    { mistake: 'Paragraph left at the browser\'s line height', measured: `${body.fontSize}px text, line height ~1.2 (${+(body.fontSize * 1.2).toFixed(1)}px) — below ${READING_LH}`, fix: 'type.body.md', fixValue: `${body.fontSize}/${body.lineHeight}px (${+(body.lineHeight / body.fontSize).toFixed(2)})` },
    { mistake: '11px meta text', measured: `11px — below the ${MIN_SIZE}px floor`, fix: 'type.caption.md', fixValue: `${cap.fontSize}/${cap.lineHeight}px` },
    { mistake: 'Negative tracking on a button label', measured: `−0.02em on ${lab.fontSize}px = −${(0.02 * lab.fontSize).toFixed(2)}px a letter — letters crowd at small sizes`, fix: 'type.label.md', fixValue: `${lab.fontSize}px, letter-spacing 0` },
    { mistake: 'Card title in a fixed 40px-high box', measured: `at 200% text size one line of ${title.fontSize}px text needs ${2 * title.lineHeight}px, so the box cuts it off`, fix: 'type.title.md', fixValue: 'no fixed height: the box grows with the text' },
    { mistake: 'Caption style for a paragraph of instructions', measured: `${cap.fontSize}px over many lines — tiring to read`, fix: 'type.body.sm', fixValue: `${sys.resolve('type.body.sm', { Responsive: 'md' }).fontSize}px, or type.body.md for longer text` },
    { mistake: 'Amounts in a column with proportional digits', measured: '1 is narrower than 0 in most fonts, so totals don\'t line up', fix: 'type.numeric.md', fixValue: 'every digit the same width (or add tabular-nums)' },
  ];
}

export function typeContract(sys, cfg, report) {
  const p = cfg.prefix;
  const styles = sys.byPrefix('type.').map((t) => {
    const n = cssName(p, t.path);
    const tail = t.path.split('.').slice(1).join('-');
    const per = Object.fromEntries(BREAKPOINTS.map((bp) => {
      const v = sys.resolve(t.path, { Responsive: bp });
      return [bp, { size: v.fontSize, lineHeight: v.lineHeight, ratio: +(v.lineHeight / v.fontSize).toFixed(3), letterSpacingEm: v.letterSpacing, letterSpacingPx: +(v.letterSpacing * v.fontSize).toFixed(2), large: t.meta.large[bp] }];
    }));
    const md = sys.resolve(t.path, { Responsive: 'md' });
    const weightName = Object.keys(WEIGHTS).find((k) => WEIGHTS[k] === md.fontWeight);
    return {
      name: t.path, figma: t.path.replace(/\./g, '/'), cssClass: `${p}-${t.path.replace(/\./g, '-')}`, tailwind: `text-${tail}`,
      cssVars: { fontFamily: `${n}-font-family`, fontSize: `${n}-font-size`, fontWeight: `${n}-font-weight`, lineHeight: `${n}-line-height`, letterSpacing: `${n}-letter-spacing` },
      role: t.meta.role, variant: t.meta.variant, kind: t.meta.kind, chapter: t.meta.product ? 'Product styles' : chapterOfStyle(t.path), use: t.description,
      family: aliasName(t.values.md.fontFamily), weight: weightName, weightValue: md.fontWeight, figmaFontStyle: FONT_STYLE[weightName],
      reading: !!t.meta.reading, tabular: !!t.meta.tabular, upper: !!t.meta.upper, scales: !!t.meta.scales, product: !!t.meta.product,
      html: Object.entries(HTML_DEFAULTS).filter(([, s]) => s === t.path).map(([h]) => h),
      breakpoints: per,
    };
  });
  return {
    $schema: 'ds-type-contract/1', system: sys.name, prefix: p, standard: 'WCAG 2.2 AA',
    breakpoints: BREAKPOINTS.map((bp) => ({ name: bp, minWidth: BREAKPOINT_MIN[bp], ratio: cfg.typography.ratio[bp] })),
    modeSwitching: { css: 'media queries on min-width (no attribute needed)', figma: 'Set the Responsive collection mode (sm, md, lg, xl) on a frame' },
    base: { size: cfg.typography.baseSize, families: { sans: cfg.typography.sans, mono: cfg.typography.mono }, weights: WEIGHTS, letterSpacingEm: TRACKING },
    limits: { minSize: MIN_SIZE, readingLineHeight: READING_LH, minLineHeight: MIN_LH, negativeTrackingFrom: TRACK_FROM, measurePx: sys.resolve('layout.measure.reading') },
    build: { ok: report.ok, styles: styles.length, checks: report.checks.filter((c) => c.foundation === 'Typography' || c.id === 'L1').map((c) => ({ id: c.id, title: c.title, status: c.status, summary: c.summary })) },
    rules: TYPE_RULES.map(([id, rule, why, wcag]) => ({ id, rule, why, wcag })),
    decisions: TYPE_DECISIONS,
    htmlDefaults: HTML_DEFAULTS,
    styles,
    mistakes: mistakes(sys),
    primitives: {
      fontFamily: { [cssName(p, 'font.family.sans')]: 'sans', [cssName(p, 'font.family.mono')]: 'mono' },
      fontWeight: Object.fromEntries(Object.keys(WEIGHTS).map((k) => [cssName(p, `font.weight.${k}`), k])),
      fontSize: sys.byPrefix('font.size.').map((t) => cssName(p, t.path)),
      letterSpacing: Object.keys(TRACKING).map((k) => cssName(p, `font.letter-spacing.${k}`)),
    },
  };
}

const aliasName = (v) => String(v).replace(/^\{font\.family\.(.+)\}$/, '$1');

export function typeRulesMd(c) {
  const bpHead = c.breakpoints.map((b) => `${b.name} (≥${b.minWidth}px)`);
  let md = `# Typography rules for AI tools — ${c.system}\n\n`;
  md += `Generated from the engine (${c.build.styles} styles, every one checked at all ${c.breakpoints.length} breakpoints; ${c.build.ok ? 'all checks pass' : 'SOME CHECKS FAIL'}). The same data in machine-readable form: ${code('typography.contract.json')}.\n\n`;
  md += `## How to use this file\n1. Pick a style for every piece of text with the **Decision guide**, using style names exactly as written.\n2. Use the style whole — its class, Tailwind utility or Figma text style. Never copy its numbers into your own CSS.\n3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.\n4. Before answering, run the **Self-check**.\n\n`;
  md += `## Hard rules\n` + table(['ID', 'Rule', 'Why', 'WCAG'], c.rules.map((r) => [r.id, tags(r.rule), tags(r.why), r.wcag]));
  md += `\n## Decision guide\n`;
  for (const d of c.decisions) md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [w, s.startsWith('type.') ? s.split(' / ').map((x) => code(x.replace(/ \(.*$/, ''))).join(' / ') + (s.match(/ \(.*\)$/)?.[0] ?? '') : s]));
  md += `\n## Styles\nSize / line height in px at each breakpoint. **L** = large text for contrast (WCAG: 24px+, or 18.66px+ bold), so 3 : 1 would be enough — but every ${c.system} colour pair already meets 4.5 : 1. In code use the class (or the Tailwind utility); in Figma the text style of the same name.\n`;
  for (const ch of ['Headings and display', 'Titles and labels', 'Reading text', 'Numbers and data', 'Product styles']) {
    const ss = c.styles.filter((s) => s.chapter === ch);
    if (!ss.length) continue;
    md += `\n### ${ch === 'Product styles' ? 'Styles added for this product' : ch}\n` + table(['Style', 'Class · Tailwind', ...bpHead, 'Weight', 'Use'], ss.map((s) => [
      code(s.name), `${code(`.${s.cssClass}`)} · ${code(s.tailwind)}${s.family === 'mono' ? ' + `font-mono`' : ''}${s.tabular ? ' + `tabular-nums`' : ''}${s.upper ? ' + `uppercase`' : ''}`,
      ...c.breakpoints.map((b) => { const v = s.breakpoints[b.name]; return `${v.size}/${v.lineHeight}${v.large ? ' L' : ''}`; }),
      `${s.weight} ${s.weightValue}`, tags(s.use) + (s.html.length ? ` (default for ${s.html.map((h) => code(`<${h}>`)).join(', ')})` : '') + (s.reading ? ' · reading text' : '') + (s.tabular ? ' · tabular numerals' : ''),
    ]));
  }
  md += `\n## What tokens.css already does\n- ${Object.entries(c.htmlDefaults).map(([h, s]) => `${code(`<${h}>`)} → ${code(s)}`).join(', ')} — as defaults in the ${code('base')} layer; any class or utility wins.\n- ${code('td')}, ${code('th')}, ${code('output')} and ${code('data')} get tabular numerals.\n- Buttons, inputs, selects and text areas inherit the page font (browsers otherwise shrink them).\n- ${code('code')}, ${code('kbd')}, ${code('samp')}, ${code('pre')} use the mono family; ${code('strong')} and ${code('b')} are semibold.\n`;
  md += `\n## Limits the build enforces\n` + table(['Limit', 'Value'], [
    ['Smallest text', `${c.limits.minSize}px`], ['Reading text line height', `≥ ${c.limits.readingLineHeight}`], ['Any style\'s line height', `≥ ${c.limits.minLineHeight}`],
    ['Negative letter-spacing', `only from ${c.limits.negativeTrackingFrom}px, never tighter than −0.02em`], ['Running text width', `${code('layout.measure.reading')} = ${c.limits.measurePx / 16}rem (${c.limits.measurePx}px at the default text size, about 70 characters)`],
    ['Fonts', `sans = ${c.base.families.sans}; mono = ${c.base.families.mono}`],
  ]);
  md += `\n## Common mistakes (measured)\n` + table(['Mistake', 'Measured', 'Use instead'], c.mistakes.map((m) => [m.mistake, m.measured, `${code(m.fix)} — ${m.fixValue}`]));
  md += `\n## Self-check before answering\n- [ ] No font-size, line-height or letter-spacing values in the output — only styles (classes, Tailwind ${code('text-<style>')} utilities, Figma text styles).\n- [ ] Every style name exists in the Styles tables.\n- [ ] Paragraphs and help text use body, caption or code styles; nothing under ${c.limits.minSize}px.\n- [ ] Compared numbers use tabular numerals.\n- [ ] Heading tags follow the outline with no skipped levels; at most one display style.\n- [ ] No fixed heights on text; truncated text stays available.\n- [ ] No font-family outside the family tokens; no blocked zoom; no justified or all-caps sentences.\n`;
  return md;
}

