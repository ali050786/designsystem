// Layout AI content: a machine-readable contract (JSON) and a rulebook (Markdown) for AI tools and the layout checker.
// Both are generated from the engine, so they always match the shipped tokens.
import { cssName, layoutTw } from './css.js';
import { BREAKPOINTS } from '../foundations/typography.js';
import { DENSITIES } from '../foundations/spacing.js';
import {
  BREAKPOINT_MIN, REFLOW_WIDTH, REFLOW_HEIGHT, MIN_COLUMN, MAX_GUTTER_SHARE, HEADER_ROOM, STICKY_SHARE, STICKY_FROM_EM, DRAWER_STRIP,
  MEASURE_REM, narrowest, panesOf, validateLayoutConfig, shellAt, gridAt, spansFor, SPANS,
} from '../foundations/layout.js';

export const LAYOUT_CHAPTER = {
  breakpoints: 'Breakpoints', grid: 'The page grid', width: 'Widths named by job', pane: 'Regions and panes', header: 'The header and scrolling',
};
export const chapterOfLayoutToken = (path) => (path.startsWith('breakpoint.') ? LAYOUT_CHAPTER.breakpoints
  : /^layout\.(columns|gutter|margin)$/.test(path) ? LAYOUT_CHAPTER.grid
    : path.startsWith('layout.pane.') ? LAYOUT_CHAPTER.pane
      : /^layout\.(header|scroll-padding)/.test(path) ? LAYOUT_CHAPTER.header : LAYOUT_CHAPTER.width);

// The classes tokens.css ships (prefix added at use).
export const LAYOUT_CLASSES = [
  ['page', 'Page content: capped at layout.container.max, padded with layout.margin, centred', '— (use the class: it adds the margin to the cap; px-margin alone sets the padding)'],
  ['grid', 'The page grid: layout.columns columns of minmax(0, 1fr), layout.gutter between them; items can shrink; inside a region it takes the region\'s grid', '— (use the class: utilities can\'t follow the region)'],
  ['span-half, span-third, span-two-thirds, span-quarter, span-full', 'A grid item\'s width as a fraction of the grid it is in, in whole columns (see Spans); follows the region like the grid does', '— (use the classes)'],
  ['measure', 'Running text: no wider than layout.measure.reading', 'max-w-reading'],
  ['tiles', 'Cards that wrap: as many layout.tile.min columns as fit, one full-width tile on the smallest screens; gaps follow density', '— (use the class)'],
  ['region', 'A size container: a grid inside takes the grid of the region\'s width (shell regions are regions already)', '— (use the class; Tailwind\'s @container sizes are not the ds breakpoints)'],
  ['shell', 'The app shell: children data-shell="header", the start panes, "main", the end panes; panes go inline at their breakpoint', '— (use the class)'],
];

export const LAYOUT_DECISIONS = [
  { what: 'How wide content gets', question: 'What is it?', answers: [
    ['Running text: paragraphs, articles, help, long descriptions', 'layout.measure.reading'],
    ['A form: one column of fields', 'layout.measure.reading'],
    ['The content of a page', 'layout.container.max (with layout.margin around it)'],
    ['Data people compare across: tables, boards, timelines', 'the full width of the region — a table wider than that scrolls inside its own container'],
    ['Cards of the same kind that wrap: a dashboard, a gallery', 'layout.tile.min (a tile grid)'],
    ['An image or video', 'the full width of its column, never more (max-width: 100%)']] },
  { what: 'Where something goes', question: 'What job does it do?', answers: [
    ['The task the screen is for', 'the main region (data-shell="main")'],
    ['Moving between the product\'s sections', 'layout.pane.nav — inline from its breakpoint, a drawer below it'],
    ['Supporting the task: details, filters, help, a preview', 'layout.pane.aside — inline from its breakpoint, below the main content below it'],
    ['Product name, search, account, global actions', 'the header (layout.header.height, sticky)'],
    ['A short task on top of the page: confirm, edit one thing', 'an overlay (a dialog or sheet — Elevation), not a pane']] },
  { what: 'How to divide space', question: 'What are you lining up?', answers: [
    ['Parts of a page that must line up with each other', 'layout.columns and layout.gutter (the page grid): span columns, never set px widths'],
    ['Items of the same kind that should wrap', 'layout.tile.min (a tile grid)'],
    ['A few things side by side that may wrap', 'flex-wrap with space.inline.* and space.stack.* gaps (Spacing)'],
    ['Sections of a page, one under another', 'space.stack.2xl between them (Spacing)']] },
  { what: 'When the layout changes', question: 'What changes it?', answers: [
    ['The window gets wider', 'breakpoint.md, breakpoint.lg, breakpoint.xl — min-width media queries in em (Tailwind md:, lg:, xl:); nothing for sm'],
    ['A pane opens beside the content', 'nothing: a grid inside a region follows the region\'s width'],
    ['The screen is dense (a table, an admin tool)', 'data-density="compact" on the region (Spacing)'],
    ['The reader enlarges text', 'nothing: breakpoints are in em, so the layout of a narrower screen takes over']] },
];

export const LAYOUT_RULES = [
  ['LR-01', 'Page edges are layout.margin: the side padding of the page content (or the main region\'s page) uses layout.margin — the .ds-page class or px-margin. Never a spacing inset token, px, rem or vw.', 'The margin follows the breakpoint and is linked to the spacing scale; the reflow check counts on it (288px of content at 320px).', '1.4.10'],
  ['LR-02', 'No fixed widths on containers. Containers take max-width with a layout token (layout.container.max, layout.measure.reading, a pane width) or a fluid value; never width in px, rem or vw above the smallest screen, and never min-width that forces a wide layout.', 'A 1200px box on a 320px screen scrolls 880px sideways; at 400% zoom every desktop becomes that screen.', '1.4.10'],
  ['LR-03', 'Running text stays within layout.measure.reading (the .ds-measure class, max-w-reading). Never a px max-width on text, and never a width that grows with the screen.', 'Past about 75 characters readers lose the next line; a px width shrinks the line at 200% text and grows it on wide screens.', '1.4.8'],
  ['LR-04', 'A sticky or fixed header is layout.header.height tall (as min-height), sticks only in windows at least 30em tall (the .ds-shell header does both), and the page keeps scroll-padding-top: layout.scroll-padding.top (tokens.css sets it on <html>). Every other sticky bar adds its own height to the scroll padding. Never set scroll-padding-top to anything else.', 'When the browser scrolls to a focused item or an anchor, it stops at the scroll padding — without it the item lands under the header. In short windows (400% zoom, 200% text on a laptop) a header that wraps would outgrow its padding, so there it scrolls away.', '2.4.11'],
  ['LR-05', 'Grid and flex items that hold content can shrink: grid tracks are minmax(0, 1fr) (never a bare 1fr or auto for content columns) and flex children that hold text or tables get min-width: 0.', 'A 1fr track never gets narrower than its longest word, URL or table, so one long value pushes the whole page sideways.', '1.4.10'],
  ['LR-06', 'Layouts change only at the system breakpoints: min-width media queries at breakpoint.md, .lg and .xl in em (37.5em, 64em, 90em), or Tailwind md:, lg:, xl:. No other widths, no max-width (desktop-first) queries, no px breakpoints, no Tailwind sm: or 2xl:.', 'Every breakpoint is designed and checked at its narrowest width; a 768px breakpoint creates a layout nobody checked, and px breakpoints don\'t move when readers enlarge text.', '1.4.4, 1.4.10'],
  ['LR-07', 'Visual order follows DOM order. Don\'t reorder content people read or tab through with order, row-reverse, column-reverse or grid placement; the shell keeps header, start panes, main, end panes.', 'Keyboard and screen-reader users follow the DOM: a sidebar moved before the content visually but after it in the code sends focus somewhere they can\'t see.', '1.3.2, 2.4.3'],
  ['LR-08', 'The page never scrolls sideways. Use width: 100%, not 100vw (it includes the scrollbar); never hide overflow on <html> or <body> to mask it. A wide table scrolls inside its own container, which is focusable and named (tabindex="0" and an accessible name).', 'Hiding overflow cuts content off instead of reflowing it; a scrolling region keyboard users can\'t focus can\'t be scrolled.', '1.4.10, 2.1.1'],
  ['LR-09', 'Page columns come from layout.columns and layout.gutter (.ds-grid): span columns with the .ds-span-* classes, never fixed px tracks or spans set by window media queries. Cards that wrap use the tile grid (layout.tile.min); a pane uses its pane token. Inside a pane or region the grid follows the region — never add breakpoints for it.', 'Fixed tracks don\'t fit the next breakpoint; a grid that keeps 12 columns next to an open pane gets columns too thin for content.', '1.4.10'],
  ['LR-10', 'Never redefine a layout token in app code (--ds-layout-*, --ds-breakpoint-*). Change the engine config (layout.nav, layout.aside, layout.tile, layout.panes) and build, so the change is checked.', 'An overridden width skips the checks that prove panes and grids fit.', '—'],
];

const code = (s) => `\`${s}\``;
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m));
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;

/** Characters per line of a font size in a width (estimate from the font's average character width). */
export const charsPerLine = (widthPx, fontPx, charWidth) => Math.round(widthPx / (fontPx * charWidth));

/** Measured mistakes: what goes wrong, with the numbers from this build, and the token that fixes it. */
function mistakes(sys, cfg, shells) {
  const r = (p, ctx) => sys.resolve(p, ctx);
  const cw = cfg.typography.charWidth;
  const body = r('type.body.md', { Responsive: 'sm' }).fontSize;
  const measure = r('layout.measure.reading');
  const lgMargin = r('layout.margin', { Responsive: 'lg' }), lgGutter = r('layout.gutter', { Responsive: 'lg' });
  const nav = r('layout.pane.nav'), aside = r('layout.pane.aside');
  const lg = shells.find((s) => s.bp === 'lg');
  const lgCols = r('layout.columns', { Responsive: 'lg' });
  const keep12 = { column: +((lg.content - (lgCols - 1) * lgGutter) / lgCols).toFixed(1), share: Math.round(((lgCols - 1) * lgGutter / lg.content) * 100) };
  const three = BREAKPOINT_MIN.lg - nav - aside - 2 * lgMargin;
  const header = r('layout.header.height', { Density: cfg.density.default });
  const asideFrom = sys.get('layout.pane.aside').meta.from;
  return [
    { mistake: 'Reading width in px that grows with the screen (640px from lg)', measured: `about ${charsPerLine(640, body, cw)} characters a line of ${body}px text — past 75; at 200% text about ${charsPerLine(640, 2 * body, cw)}`, fix: 'layout.measure.reading', fixValue: `${MEASURE_REM}rem: about ${charsPerLine(measure, body, cw)} characters at every breakpoint and every text size` },
    { mistake: 'A container with width: 1200px', measured: `on a ${REFLOW_WIDTH}px screen (or 400% zoom) the page scrolls ${1200 - REFLOW_WIDTH}px sideways`, fix: 'layout.container.max', fixValue: `as max-width (.${cfg.prefix}-page): ${r('layout.container.max')}px at most, the screen width below that` },
    { mistake: 'Twelve columns kept beside an open navigation pane', measured: `at ${BREAKPOINT_MIN.lg}px the main region keeps ${lg.content}px: ${lgCols} columns of ${keep12.column}px, gutters ${keep12.share}% of the row`, fix: 'layout.columns', fixValue: `in a region (.${cfg.prefix}-grid inside the shell): the region is ${lg.main}px, so it takes the ${lg.mode} grid — ${lg.columns} columns of ${lg.column}px` },
    { mistake: 'Navigation and supporting panes both inline at lg', measured: `${BREAKPOINT_MIN.lg} − ${nav} − ${aside} − 2 × ${lgMargin} = ${three}px for the main content, under one reading line (${measure}px)`, fix: 'layout.pane.aside', fixValue: `inline from ${asideFrom} (≥ ${BREAKPOINT_MIN[asideFrom]}px); below the main content before that` },
    { mistake: 'A sticky header without scroll padding', measured: `tabbing back up the page, each focused item scrolls to the top edge — under the ${header}px header`, fix: 'layout.scroll-padding.top', fixValue: 'on <html> (tokens.css sets it): the browser stops that far below the top' },
    { mistake: 'A breakpoint at 768px in px', measured: `a fifth layout, between md (${BREAKPOINT_MIN.md}px) and lg (${BREAKPOINT_MIN.lg}px) that no check covers; at 200% text it still switches at 768px`, fix: 'breakpoint.md / breakpoint.lg', fixValue: `${BREAKPOINT_MIN.md / 16}em / ${BREAKPOINT_MIN.lg / 16}em (Tailwind md: / lg:)` },
    { mistake: 'grid-template-columns: repeat(3, 1fr) with a long URL in one card', measured: 'a 1fr track never shrinks below its longest word, so that column pushes the page sideways', fix: 'minmax(0, 1fr)', fixValue: `the .${cfg.prefix}-grid and .${cfg.prefix}-tiles classes do it; flex children get min-width: 0` },
  ];
}

export function layoutContract(sys, cfg, report) {
  const p = cfg.prefix;
  const r = (path, ctx) => sys.resolve(path, ctx);
  const panes = panesOf(validateLayoutConfig(cfg));
  const gridOf = (mode) => ({ columns: r('layout.columns', { Responsive: mode }), gutterPx: r('layout.gutter', { Responsive: mode }) });
  const shells = BREAKPOINTS.map((bp) => shellAt(bp, panes, r('layout.margin', { Responsive: bp }), gridOf, r('layout.measure.reading')));
  const containerPx = r('layout.container.max');
  const tw = (path) => {
    const l = layoutTw(path);
    if (!l) return [];
    if (l.theme === 'spacing') return path === 'layout.header.height' ? ['min-h-header', 'scroll-pt-header'] : path === 'layout.margin' ? ['px-margin', 'mx-margin'] : ['gap-x-gutter'];
    return path.startsWith('layout.pane.') ? [`w-${l.name}`] : path === 'layout.tile.min' ? [] : [`max-w-${l.name}`];
  };
  const layoutTokens = [...sys.tokens.values()].filter((t) => t.path.startsWith('layout.') || t.path.startsWith('breakpoint.'));
  const tokens = layoutTokens.map((t) => {
    const base = { name: t.path, figma: t.path.replace(/\./g, '/'), cssVar: cssName(p, t.path), tailwind: tw(t.path), use: t.description, collection: t.collection, chapter: chapterOfLayoutToken(t.path), product: !!t.meta.product };
    if (t.collection === 'Responsive') return { ...base, varies: 'breakpoint', breakpoints: Object.fromEntries(BREAKPOINTS.map((bp) => [bp, { value: r(t.path, { Responsive: bp }), primitive: typeof t.values[bp] === 'string' ? t.values[bp].slice(1, -1) : null }])) };
    if (t.collection === 'Density') return { ...base, varies: 'density', densities: Object.fromEntries(DENSITIES.map((d) => [d, { px: r(t.path, { Density: d }) }])) };
    const v = r(t.path);
    const out = { ...base, varies: 'none', px: v };
    if (t.meta.rem) out.rem = v / 16;
    if (t.path.startsWith('breakpoint.')) { out.em = v / 16; out.media = v ? `@media (min-width: ${v / 16}em)` : 'no query: the default'; out.tailwind = v ? [`${t.path.split('.')[1]}:`] : ['(no prefix)']; }
    if (t.meta.layout === 'pane') Object.assign(out, { from: t.meta.from, side: t.meta.side, below: t.meta.below, inlineFromPx: BREAKPOINT_MIN[t.meta.from], dataShell: t.path.split('.')[2] });
    return out;
  });
  return {
    $schema: 'ds-layout-contract/1', system: sys.name, prefix: p, standard: 'WCAG 2.2 AA',
    breakpoints: BREAKPOINTS.map((bp) => ({ name: bp, minPx: BREAKPOINT_MIN[bp], em: BREAKPOINT_MIN[bp] / 16, checkedAt: narrowest(bp), columns: r('layout.columns', { Responsive: bp }), gutter: r('layout.gutter', { Responsive: bp }), margin: r('layout.margin', { Responsive: bp }) })),
    modeSwitching: {
      css: 'Breakpoints: min-width media queries in em on :root (tokens.css); a grid inside a region (.ds-region or a shell region) follows the region\'s width. Density: data-density on <html> or any container.',
      figma: 'Set the Responsive mode (sm, md, lg, xl) on a frame — on a page frame for the window, on a region frame for the region\'s own width; set the Density mode for the header height',
    },
    containerPx, measure: { rem: MEASURE_REM, px: r('layout.measure.reading'), charsAtBody: charsPerLine(r('layout.measure.reading'), r('type.body.md', { Responsive: 'sm' }).fontSize, cfg.typography.charWidth) },
    classes: LAYOUT_CLASSES.map(([name, use, tailwind]) => ({ class: name.split(', ').map((n) => `${p}-${n}`).join(', '), use, tailwind })),
    spans: Object.fromEntries(BREAKPOINTS.map((bp) => [bp, spansFor(r('layout.columns', { Responsive: bp }))])),
    shell: {
      markup: `<div class="${p}-shell"> <header data-shell="header"> <nav data-shell="nav"> <main data-shell="main"> <aside data-shell="aside"> </div> — in this order`,
      drawer: `Below its breakpoint a start pane is hidden until the app sets data-open on it (a button with aria-expanded and aria-controls toggles it; Escape closes it and focus returns to the button). [data-shell-toggle="<pane>"] is hidden from the pane's breakpoint.`,
      atBreakpoints: shells.map((s) => ({ breakpoint: s.bp, checkedAt: s.width, inline: s.inline, mainPx: s.main, mainContentPx: s.content, regionGrid: s.mode, columns: s.columns, columnPx: s.column })),
    },
    panes: panes.map((x) => ({ name: x.name, width: x.width, from: x.from, side: x.side, below: x.below, use: x.use, product: !!x.product })),
    limits: { reflowWidth: REFLOW_WIDTH, reflowHeight: REFLOW_HEIGHT, minColumn: MIN_COLUMN, maxGutterShare: MAX_GUTTER_SHARE, headerRoom: HEADER_ROOM, stickyShare: STICKY_SHARE, stickyFromEm: STICKY_FROM_EM, drawerStrip: DRAWER_STRIP, maxCharsPerLine: 80 },
    build: { ok: report.ok, tokens: tokens.length, checks: report.checks.filter((c) => c.foundation === 'Layout').map((c) => ({ id: c.id, title: c.title, status: c.status, summary: c.summary })) },
    rules: LAYOUT_RULES.map(([id, rule, why, wcag]) => ({ id, rule, why, wcag })),
    decisions: LAYOUT_DECISIONS,
    tokens,
    grids: BREAKPOINTS.map((bp) => gridAt(bp, { columns: r('layout.columns', { Responsive: bp }), gutterPx: r('layout.gutter', { Responsive: bp }), marginPx: r('layout.margin', { Responsive: bp }), containerPx })),
    mistakes: mistakes(sys, cfg, shells),
  };
}

export function layoutRulesMd(c) {
  const bpHead = c.breakpoints.map((b) => `${b.name} (≥ ${b.minPx}px)`);
  let md = `# Layout rules for AI tools — ${c.system}\n\n`;
  md += `Generated from the engine (${c.build.tokens} tokens; every grid and pane checked at the narrowest width of every breakpoint; ${c.build.ok ? 'all checks pass' : 'SOME CHECKS FAIL'}). The same data in machine-readable form: ${code('layout.contract.json')}.\n\n`;
  md += `## How to use this file\n1. Decide each width, region and breakpoint with the **Decision guide**, using token and class names exactly as written.\n2. Use the token or class itself — never copy its number into your own CSS.\n3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.\n4. Before answering, run the **Self-check**.\n\n`;
  md += `## Hard rules\n` + table(['ID', 'Rule', 'Why', 'WCAG'], c.rules.map((r) => [r.id, tags(r.rule).replace(/\.ds-/g, `.${c.prefix}-`), tags(r.why), r.wcag]));
  md += `\n## Decision guide\n`;
  const fmt = (s) => s.replace(/(layout\.[a-z.-]+[a-z]|breakpoint\.[a-z]+|space\.[a-z0-9-]+\.(?:\*|[a-z0-9-]+)|data-[a-z]+="[a-z]+"|max-width: 100%|md:|lg:|xl:)/g, (m) => code(m));
  for (const d of c.decisions) md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [tags(w), fmt(s)]));
  md += `\n## Breakpoints\nMobile first: write the sm layout with no query, then add ${code('min-width')} queries in em. Each breakpoint is checked at its narrowest width (sm at ${c.limits.reflowWidth}px, the WCAG reflow width).\n\n`;
  md += table(['Breakpoint', 'From', 'Media query', 'Tailwind', 'Columns', 'Gutter', 'Margin'], c.breakpoints.map((b) => [code(b.name), `${b.minPx}px`, b.minPx ? code(`@media (min-width: ${b.em}em)`) : 'none — the default', b.minPx ? code(`${b.name}:`) : 'no prefix', b.columns, `${b.gutter}px`, `${b.margin}px`]));
  md += `\n## Tokens\nIn code use the CSS variable, Tailwind utility or class; in Figma the variable of the same name.\n`;
  const groups = [['Breakpoints', (t) => t.name.startsWith('breakpoint.')], ['The page grid — per breakpoint', (t) => t.varies === 'breakpoint'], ['Widths named by job', (t) => t.varies === 'none' && !t.name.startsWith('breakpoint.') && !t.name.startsWith('layout.pane.')], ['Panes', (t) => t.name.startsWith('layout.pane.')], ['The header — per density', (t) => t.varies === 'density']];
  for (const [title, f] of groups) {
    const list = c.tokens.filter(f);
    if (!list.length) continue;
    md += `\n### ${title}\n`;
    if (title.startsWith('The page grid')) md += table(['Token', 'CSS variable', 'Tailwind', ...bpHead, 'Use'], list.map((t) => [code(t.name), code(t.cssVar), t.tailwind.map(code).join(' ') || '—', ...c.breakpoints.map((b) => `${t.breakpoints[b.name].value}`), tags(t.use)]));
    else if (title.startsWith('The header')) md += table(['Token', 'CSS variable', 'Tailwind', ...Object.keys(list[0].densities), 'Use'], list.map((t) => [code(t.name), code(t.cssVar), t.tailwind.map(code).join(' ') || '—', ...Object.values(t.densities).map((x) => `${x.px}`), tags(t.use)]));
    else if (title === 'Panes') md += table(['Token', 'CSS variable', 'Tailwind', 'px', 'Inline from', 'Below that', 'data-shell', 'Use'], list.map((t) => [code(t.name), code(t.cssVar), t.tailwind.map(code).join(' '), t.px, `${t.from} (≥ ${t.inlineFromPx}px)`, t.below === 'drawer' ? 'a drawer' : 'below the main content', code(t.dataShell), tags(t.use.replace(/\. Inline from .*$/, '')) + (t.product ? ' (added for this product)' : '')]));
    else md += table(['Token', 'CSS variable', 'Tailwind', 'Value', 'Use'], list.map((t) => [code(t.name), code(t.cssVar), t.tailwind.map(code).join(' ') || '—', t.rem ? `${t.rem}rem (${t.px}px at the default text size)` : t.name.startsWith('breakpoint.') ? `${t.px}px · ${t.em}em` : `${t.px}px`, tags(t.use)]));
  }
  md += `\n## Classes in tokens.css\nThey work with or without Tailwind. Single values also have utilities: ${['max-w-reading', 'max-w-page', 'px-margin', 'gap-x-gutter', 'min-h-header', 'scroll-pt-header', 'w-nav', 'w-aside'].map(code).join(', ')}.\n\n` + table(['Class', 'What it does', 'In Tailwind'], c.classes.map((x) => [x.class.split(', ').map((n) => code(`.${n}`)).join(' '), tags(x.use), x.tailwind.startsWith('—') ? x.tailwind : code(x.tailwind)]));
  md += `\n**Spans.** Columns each fraction takes, per grid (a grid in a region uses the region's breakpoint):\n\n` + table(['Grid', ...SPANS.map((s) => code(`.${c.prefix}-span-${s}`))], c.breakpoints.map((b) => [`${b.name} (${b.columns} columns)`, ...SPANS.map((s) => `${c.spans[b.name][s]}`)]));
  md += `\n## The app shell\n${code(c.shell.markup)}\n\n${c.shell.drawer}\n\n`;
  md += table(['Breakpoint', 'Checked at', 'Inline panes', 'Main region', 'Main content', 'Grid inside main'], c.shell.atBreakpoints.map((s) => [code(s.breakpoint), `${s.checkedAt}px`, s.inline.length ? s.inline.map((n) => code(n)).join(' + ') : '—', `${s.mainPx}px`, `${s.mainContentPx}px`, `${s.regionGrid}: ${s.columns} columns of ${s.columnPx}px`]));
  md += `\n## Limits the build enforces\n` + table(['Limit', 'Value'], [
    ['Reflow', `every page works at ${c.limits.reflowWidth} × ${c.limits.reflowHeight}px (a 1280 × 1024 window at 400% zoom) without scrolling sideways`],
    ['Columns', `at least ${c.limits.minColumn}px wide and gutters at most a third of the row, at the narrowest width of every breakpoint — inside an open pane's main region too`],
    ['Panes', `inline only where the main region keeps one reading line (${c.measure.px}px) beside them; a drawer leaves ${c.limits.drawerStrip}px of the page visible at ${c.limits.reflowWidth}px`],
    ['Sticky header', `holds a control with ${c.limits.headerRoom}px to spare in every density; sticks only in windows at least ${c.limits.stickyFromEm}em (${c.limits.stickyFromEm * 16}px) tall, where it takes at most ${c.limits.stickyShare * 100}% of the height — at 400% zoom it scrolls with the page; the scroll padding is its height`],
    ['Reading width', `${c.measure.rem}rem: about ${c.measure.charsAtBody} characters of body text (WCAG 1.4.8 asks for ${c.limits.maxCharsPerLine} or fewer)`],
    ['Page content', `at most ${c.containerPx}px; wider screens get wider margins`],
  ]);
  md += `\n## Common mistakes (measured)\n` + table(['Mistake', 'Measured', 'Use instead'], c.mistakes.map((m) => [m.mistake, tags(m.measured), `${m.fix.split(' / ').map(code).join(' / ')} — ${tags(m.fixValue)}`]));
  md += `\n## Self-check before answering\n- [ ] Page edges use ${code('layout.margin')} (${code(`.${c.prefix}-page`)} or ${code('px-margin')}); no container has a fixed width.\n- [ ] Running text and forms stay within ${code('layout.measure.reading')}.\n- [ ] Every media query is a system breakpoint, min-width, in em (or Tailwind ${code('md:')} ${code('lg:')} ${code('xl:')}); none inside panes or regions.\n- [ ] Grid tracks are ${code('minmax(0, 1fr)')} or come from ${code(`.${c.prefix}-grid`)} / ${code(`.${c.prefix}-tiles`)}; flex children that hold text have ${code('min-width: 0')}.\n- [ ] Panes use ${code('data-shell')} in DOM order (header, start panes, main, end panes); nothing is reordered with ${code('order')} or ${code('*-reverse')}.\n- [ ] A sticky header uses ${code('layout.header.height')} as min-height and nothing overrides ${code('scroll-padding-top')}.\n- [ ] Nothing scrolls sideways at ${c.limits.reflowWidth}px; wide tables scroll inside a focusable, named container; no ${code('100vw')}, no hidden overflow on ${code('<html>')} or ${code('<body>')}.\n- [ ] No layout variables redefined.\n`;
  return md;
}
