// Layout guide (Markdown) for people: the written version of the layout foundation's chapters.
// The words are fixed; every value, table and example number is computed from the build, so the guide can't drift
// from the tokens. Regenerate it with the build; never edit the output by hand.
import { BREAKPOINTS } from '../foundations/typography.js';
import { DENSITIES } from '../foundations/spacing.js';
import { BREAKPOINT_MIN, REFLOW_WIDTH, REFLOW_HEIGHT, MIN_COLUMN, HEADER_ROOM, STICKY_SHARE, STICKY_FROM_EM, DRAWER_STRIP, MEASURE_REM, LIMITS, SPANS, narrowest } from '../foundations/layout.js';
import { LAYOUT_CHAPTER, charsPerLine } from './ai-layout.js';

const code = (s) => `\`${s}\``;
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
const short = (p) => p.replace(/\./g, '/');
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m));
const slash = (x) => x.replace(/\b(space|size|layout|breakpoint)\.[a-z0-9.-]*[a-z0-9](\.\*)?/g, (m) => short(m));

export const LAYOUT_CHAPTERS = ['Five principles', LAYOUT_CHAPTER.breakpoints, 'How tokens are built', LAYOUT_CHAPTER.grid, LAYOUT_CHAPTER.width,
  LAYOUT_CHAPTER.pane, LAYOUT_CHAPTER.header, 'Choosing a layout', 'Readers\' settings and products'];

export function layoutGuideMd(sys, cfg, report, contract) {
  const p = cfg.prefix;
  const tok = new Map(contract.tokens.map((t) => [t.name, t]));
  const r = (path, ctx) => sys.resolve(path, ctx);
  const documented = [];
  const anchor = (title) => title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-');
  const see = (title) => `[${title}](#${anchor(title)})`;
  const chapter = (title) => `\n---\n\n## ${title}\n\n`;
  const rules = (items) => `\n**Rules**\n\n${items.map(([a, b]) => `- **${a}.** ${b}`).join('\n')}\n`;
  const checks = new Map(report.checks.map((c) => [c.id, c]));
  const mark = (paths) => { for (const x of paths) { if (!tok.has(x)) throw new Error(`guide: unknown token ${x}`); documented.push(x); } };
  const cw = cfg.typography.charWidth;
  const body = r('type.body.md', { Responsive: 'sm' }).fontSize;
  const measure = r('layout.measure.reading');
  const container = r('layout.container.max');
  const dHead = DENSITIES.map((d) => (d === cfg.density.default ? `${d} (default mode)` : d));
  const bpHead = BREAKPOINTS.map((bp) => `${bp} (≥ ${BREAKPOINT_MIN[bp]}px)`);
  const shells = contract.shell.atBreakpoints;
  const builtIn = contract.panes.filter((x) => !x.product);
  const product = contract.panes.filter((x) => x.product);
  const job = (name) => name.split('.')[2];
  const lg = shells.find((s) => s.breakpoint === 'lg');

  let md = `# Layout\n\n`;
  md += `*${sys.name} foundations · layout · the written guide. Generated from the engine — ${contract.tokens.length} tokens, ${BREAKPOINTS.length} breakpoints, ${contract.panes.length} panes; ${report.checks.filter((c) => c.foundation === 'Layout').every((c) => c.status !== 'fail') ? 'every layout check passing' : 'SOME CHECKS FAILING'}. Do not edit by hand; change the engine config and build again.*\n\n`;
  md += `This guide explains how ${sys.name} lays out a screen: the breakpoints, the page grid, the widths each kind of content gets, the regions of an app and when its panes sit beside the content, and the header that stays on screen. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after ${see('Choosing a layout')}; developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (${code('layout.md')}, ${code('layout.contract.json')}).\n\n`;
  md += `**Contents**\n\n${LAYOUT_CHAPTERS.map((c) => `- ${see(c)}`).join('\n')}\n`;

  // Five principles
  md += chapter('Five principles');
  md += `Five principles shape every layout decision. Each one is checked by the build, not left to taste.\n\n`;
  md += table(['Principle', 'What it means in practice'], [
    ['**The measure follows the text**', `Running text stops at ${code('layout/measure/reading')}, ${MEASURE_REM}rem — about ${contract.measure.charsAtBody} characters of body text at every breakpoint and every text size. A wider screen gives wider margins, not longer lines (check T9: ${checks.get('T9').summary}).`],
    ['**Sizes add up**', `A pane sits beside the content only at a breakpoint where the main region still holds a full reading line and its grid keeps columns of at least ${MIN_COLUMN}px. The build adds the widths up at the narrowest width of every breakpoint (L2: ${checks.get('L2').summary}, L3: ${checks.get('L3').summary}).`],
    ['**Grids follow their region**', `A grid takes the columns of the space it actually has: the window for a full page, the main region beside an open pane. One rule, so nothing breaks when a pane opens.`],
    ['**Linked, not copied**', `Gutters and margins point at the spacing scale; type and layout share one set of breakpoints; the header follows density like the controls it holds; the space between sections is spacing's ${code('stack/2xl')}.`],
    ['**Nothing scrolls sideways**', `Every page works at ${REFLOW_WIDTH} × ${REFLOW_HEIGHT}px — a 1280 × 1024 window at 400% zoom — in every density, and a sticky header never hides the item that has focus (L1: ${checks.get('L1').summary}, L4: ${checks.get('L4').summary}).`],
  ]);

  // Breakpoints
  md += chapter(LAYOUT_CHAPTER.breakpoints);
  md += `A breakpoint is the window width where the layout changes. ${sys.name} has ${BREAKPOINTS.length}, shared by type and layout, so headings grow and columns appear at the same moments. They are minimum widths: each one lasts until the next begins, and ${code('sm')} starts at 0, so every window — a 280px folded phone included — has a layout.\n\n`;
  mark(BREAKPOINTS.map((bp) => `breakpoint.${bp}`));
  md += table(['Token', 'From', 'Checked at', 'Media query', 'Tailwind', 'What it is for'], BREAKPOINTS.map((bp) => [code(`breakpoint/${bp}`), `${BREAKPOINT_MIN[bp]}px`, `${narrowest(bp)}px`, BREAKPOINT_MIN[bp] ? code(`(min-width: ${BREAKPOINT_MIN[bp] / 16}em)`) : 'none — the default', BREAKPOINT_MIN[bp] ? code(`${bp}:`) : 'no prefix',
    { sm: 'Phones, and any window at 400% zoom', md: 'Large phones on their side, small tablets', lg: 'Tablets on their side, laptops — the navigation pane opens', xl: 'Desktops — the supporting pane opens; the page reaches its widest' }[bp]]));
  md += `\n**Checked at the narrowest width.** A layout that works where its breakpoint begins works across it, because every width inside is wider. So the build checks each one at its first pixel — ${code('sm')} at ${REFLOW_WIDTH}px, the width WCAG 1.4.10 tests reflow at.\n\n`;
  md += `**In em, not px.** Media queries are written in em (Tailwind uses the same numbers in rem). They follow the reader's default text size: someone who sets 32px text gets the ${code('md')} layout up to ${2 * BREAKPOINT_MIN.lg - 1}px, with twice the room per character, instead of a desktop layout with cramped columns. At the default size, 1em is 16px and nothing changes.\n\n`;
  md += `**Mobile first.** Write the ${code('sm')} layout with no query, then add what changes at ${code('md')}, ${code('lg')} and ${code('xl')}. Tailwind's own ${code('sm:')} and ${code('2xl:')} are switched off in ${code('tailwind.theme.css')} (check L5: ${checks.get('L5').summary}).\n`;
  md += rules([['No breakpoints of your own', 'A 768px breakpoint is a fifth layout nobody designed or checked. If content breaks between two breakpoints, fix the content (let it wrap, let the grid follow its region) rather than adding a width.'],
    ['min-width only', 'Desktop-first max-width queries leave the smallest screens with the most overrides and the most bugs.']]);

  // How tokens are built
  md += chapter('How tokens are built');
  md += `Layout tokens live in four collections. Each holds one kind of value and changes with one kind of mode.\n\n`;
  md += table(['Collection', 'Modes', 'Layout tokens in it', 'Changes with'], [
    ['**Primitives**', 'one · hidden from publishing', `The breakpoints, and the spacing scale that gutters and margins point at`, 'nothing — raw values'],
    ['**Responsive**', BREAKPOINTS.join(', '), `${code('layout/columns')}, ${code('layout/gutter')}, ${code('layout/margin')} (and every type style)`, 'the breakpoint'],
    ['**Layout**', 'one', `Widths named by job: ${contract.tokens.filter((t) => t.collection === 'Layout').map((t) => code(short(t.name))).join(', ')}`, 'nothing — one value each, checked against every breakpoint'],
    ['**Density**', DENSITIES.join(', '), `${code('layout/header/height')}, ${code('layout/scroll-padding/top')} (and every spacing token)`, 'the density'],
  ]);
  md += `\n**Reading a name.** ${code('layout / pane / nav')} — category ${code('layout')}, kind ${code('pane')}, job ${code('nav')}. Widths are named by what they hold (reading, page, nav), never by size or side: "left" becomes "right" in right-to-left languages, and "wide" stops being true the day the value changes.\n\n`;
  const eg = tok.get('layout.measure.reading');
  md += `**One name, three places.**\n\n` + table(['Figma variable', 'CSS variable', 'Tailwind'], [[code(eg.figma), code(eg.cssVar), eg.tailwind.map(code).join(', ')]]);
  md += `\n**Modes on frames.** In Figma, a page frame set to a Responsive mode shows that breakpoint's columns, gutter, margin and type. A region frame — the main region beside an open pane — sets its own mode for its own width, exactly as a grid inside it does in code. In code, ${code(':root')} takes the window's breakpoint, and a ${code(`.${p}-grid`)} inside a region takes the region's.\n`;

  // The page grid
  md += chapter(LAYOUT_CHAPTER.grid);
  md += `The page grid divides the content into columns so that things on different parts of a page line up. Three tokens make it, all per breakpoint. Gutters and margins point at the spacing scale, so a change to spacing moves the grid with it.\n\n`;
  mark(['layout.columns', 'layout.gutter', 'layout.margin']);
  md += table(['Token', 'Use it for', ...bpHead], ['layout.columns', 'layout.gutter', 'layout.margin'].map((n) => {
    const t = tok.get(n);
    return [code(short(n)), tags(t.use), ...BREAKPOINTS.map((bp) => `${t.breakpoints[bp].value}${t.breakpoints[bp].primitive ? ` (${code(short(t.breakpoints[bp].primitive))})` : ''}`)];
  }));
  md += `\n**At the narrowest width of each breakpoint** (check L2), columns stay at least ${MIN_COLUMN}px wide and gutters take no more than a third of the row:\n\n`;
  md += table(['Breakpoint', 'Window', 'Content', 'Columns', 'Column width', 'Gutters\' share'], contract.grids.map((g) => [code(g.bp), `${g.width}px`, `${g.content}px`, r('layout.columns', { Responsive: g.bp }), `${g.column}px`, `${Math.round(g.share * 100)}%`]));
  md += `\n**Margins are the page's edges.** ${code('layout/margin')} is the space between the screen edge and the content — the side padding of a page. It is px and follows the breakpoint, not density: a compact table keeps the same page edges as the rest of the product.\n\n`;
  md += `**Grids follow their region.** At ${BREAKPOINT_MIN.lg}px the window has the ${code('lg')} grid, but beside the open navigation pane the main region is only ${lg.mainPx}px wide. Twelve columns there would be ${contract.mistakes.find((m) => m.mistake.startsWith('Twelve')).measured.match(/of ([\d.]+)px/)[1]}px each. So a grid inside a region takes the grid of the region's own width — ${lg.mainPx}px is ${code(lg.regionGrid)}: ${lg.columns} columns of ${lg.columnPx}px. In code the shell's regions are size containers and ${code(`.${p}-grid`)} reads them; in Figma the region frame sets its own Responsive mode.\n`;
  md += `\n**Spans by fraction.** Items say how much of the grid they take — half, a third, two thirds, a quarter, the full row — and the classes turn that into whole columns for the grid they are in, so a third stays a third beside an open pane too. On the smallest grid everything but a quarter takes the full row:\n\n`;
  md += table(['Grid', ...SPANS.map((x) => code(`.${p}-span-${x}`))], BREAKPOINTS.map((bp) => [`${code(bp)} (${r('layout.columns', { Responsive: bp })} columns)`, ...SPANS.map((x) => contract.spans[bp][x])]));
  md += rules([['Span columns, don\'t set widths', `A card is ${code(`.${p}-span-third`)}; it is never 320px wide. On the next breakpoint it spans what fits.`],
    ['Let items shrink', `Grid tracks are ${code('minmax(0, 1fr)')} and items have ${code('min-width: 0')}, so one long URL can't push the page sideways. The ${code(`.${p}-grid`)} class does both.`],
    ['Full width is still inside the margins', 'A band can run edge to edge; its content stays inside the page margins.']]);

  // Widths named by job
  md += chapter(LAYOUT_CHAPTER.width);
  md += `Not everything should be as wide as the page. Each kind of content gets the width that serves it, and each width has a name that says what it is for.\n\n`;
  mark(['layout.container.max', 'layout.measure.reading', 'layout.tile.min']);
  md += table(['Token', 'Use it for', 'Value'], ['layout.container.max', 'layout.measure.reading', 'layout.tile.min'].map((n) => {
    const t = tok.get(n);
    return [code(short(n)), tags(t.use), t.rem ? `${t.rem}rem (${t.px}px at 16px)` : `${t.px}px`];
  }));
  const dw = contract.decisions.find((d) => d.what === 'How wide content gets');
  md += `\n**Which width?**\n\n` + table(['Content', 'Width'], dw.answers.map(([w, s]) => [w, slash(s).replace(/(layout\/[a-z/-]+[a-z])|max-width: 100%/g, (m) => code(m))]));
  md += `\n**The page stops growing where ${code('xl')} begins.** ${code('layout/container/max')} is computed: ${BREAKPOINT_MIN.xl} − 2 × ${r('layout.margin', { Responsive: 'xl' })} = ${container}px. Below ${BREAKPOINT_MIN.xl}px the content fills the window minus its margins; above it, the content stays ${container}px and the margins grow. The ${code(`.${p}-page`)} class does this.\n\n`;
  md += `**The reading width is in rem.** ${MEASURE_REM}rem holds about ${contract.measure.charsAtBody} characters of ${body}px body text, inside the 45–75 most guidance recommends and under WCAG 1.4.8's 80. Because it is rem, it grows with the reader's text size and keeps the same characters per line:\n\n`;
  md += table(['Text size', 'Reading width', 'Characters per line'], [[`${body}px (default)`, `${measure}px`, `about ${charsPerLine(measure, body, cw)}`], [`${2 * body}px (200%)`, `${2 * measure}px`, `about ${charsPerLine(2 * measure, 2 * body, cw)}`], [`${body}px, if it were a px width growing to 640px`, '640px', `about ${charsPerLine(640, body, cw)} — too long`]]);
  const tile = r('layout.tile.min');
  const tilesAt = (content, gap) => Math.max(1, Math.floor((content + gap) / (tile + gap)));
  const gapD = r('space.inline.lg', { Density: cfg.density.default });
  md += `\n**Tiles fit what the row holds.** A tile grid places as many columns of at least ${tile}px as fit, and drops to one full-width tile when even one doesn't (${code(`.${p}-tiles`)}: ${code(`repeat(auto-fill, minmax(min(100%, ${tile}px), 1fr))`)}). No breakpoints needed; the gaps follow density. Tiles per row across a full page, in ${cfg.density.default} density:\n\n`;
  md += table(['Breakpoint', 'Page content', 'Tiles per row'], contract.grids.map((g) => [code(g.bp), `${g.content}px`, tilesAt(g.content, gapD)]));
  md += rules([['Text never takes the page width', 'Paragraphs, help and forms stop at the reading width even on a 2560px screen.'],
    ['Data takes the room it needs', 'Tables and boards use the region\'s full width; a table wider than that scrolls inside its own container (focusable, with a name), not the page.'],
    ['Never a fixed width on a container', `${code('max-width')} with a token, never ${code('width')} in px: a 1200px box scrolls 880px sideways on a 320px screen.`]]);

  // Regions and panes
  md += chapter(LAYOUT_CHAPTER.pane);
  md += `An app screen has a few regions with fixed jobs. Knowing the job tells you where something goes and what happens to it on a smaller screen.\n\n`;
  md += table(['Region', 'Job', 'In code', 'On smaller screens'], [
    ['Header', 'Product name, search, account, global actions', code('data-shell="header"'), 'Stays at the top (see the next chapter)'],
    ...builtIn.map((x) => [x.name === 'layout.pane.nav' ? 'Navigation pane' : 'Supporting pane', x.use.split(';')[0], code(`data-shell="${job(x.name)}"`), x.below === 'drawer' ? `Below ${x.from}: a drawer the app opens` : `Below ${x.from}: under the main content`]),
    ['Main region', 'The task the screen is for — it always keeps priority', code('data-shell="main"'), 'Never shrinks below one reading line while a pane is open'],
    ['Overlays', 'A short task on top of the page: a dialog, a sheet, a menu', 'Elevation foundation', 'Not a pane: it covers the page and gives focus back when it closes'],
  ]);
  mark(builtIn.map((x) => x.name));
  md += `\n` + table(['Token', 'Use it for', 'Width', 'Beside the content from', 'Below that'], builtIn.map((x) => [code(short(x.name)), tags(x.use.split(';')[0]), `${x.width}px`, `${code(x.from)} (≥ ${BREAKPOINT_MIN[x.from]}px)`, x.below === 'drawer' ? 'a drawer' : 'below the main content']));
  md += `\n**When a pane goes inline.** At the narrowest width of each breakpoint the build subtracts the inline panes and the margins, and checks what the main region keeps (L3):\n\n`;
  md += table(['Breakpoint', 'Window', 'Beside the content', 'Main region', 'Main content', 'Grid inside main'], shells.map((s) => [code(s.breakpoint), `${s.checkedAt}px`, s.inline.length ? s.inline.map((n) => code(short(n))).join(' + ') : '—', `${s.mainPx}px`, `${s.mainContentPx}px ${s.inline.length ? `(≥ ${measure}px)` : ''}`.trim(), `${s.regionGrid}: ${s.columns} × ${s.columnPx}px`]));
  const navShell = shells.find((s) => s.inline.length && s.inline.length === 1);
  md += `\nThat is why the supporting pane waits until ${code(sys.get('layout.pane.aside').meta.from)}: at ${BREAKPOINT_MIN.lg}px, both panes would leave ${contract.mistakes.find((m) => m.mistake.startsWith('Navigation and')).measured.match(/= (\d+)px/)[1]}px for the main content — less than one reading line.${navShell ? '' : ''}\n\n`;
  md += `**The drawer.** Below its breakpoint the navigation pane is a drawer: hidden, and out of the tab order, until a button opens it. It leaves at least ${DRAWER_STRIP}px of the page visible on a ${REFLOW_WIDTH}px screen, so people can see where they are. The button has ${code('aria-expanded')} and ${code('aria-controls')}; Escape closes the drawer and focus returns to the button.\n\n`;
  md += `**Order.** In the code the regions come in one order — header, navigation, main, supporting — and the layout never contradicts it. A screen-reader or keyboard user meets them in the same order a sighted user sees them, at every width (WCAG 1.3.2, 2.4.3).\n\n`;
  md += '```html\n' + `<div class="${p}-shell">\n  <header data-shell="header">…</header>\n  <nav data-shell="nav" id="nav" aria-label="Sections">…</nav>\n  <main data-shell="main"><div class="${p}-page">…</div></main>\n  <aside data-shell="aside" aria-label="Details">…</aside>\n</div>` + '\n```\n';
  md += rules([['The main region keeps priority', 'When space runs out, panes move — under the content or into a drawer — before the main region gives up its reading line.'],
    ['Panes by job, not by side', `A pane is ${code('nav')} or ${code('aside')}, not "left" or "right"; start and end flip in right-to-left languages.`],
    ['Never reorder visually', `No ${code('order')} or ${code('row-reverse')} to move a pane: change the DOM order instead.`]]);

  // The header and scrolling
  md += chapter(LAYOUT_CHAPTER.header);
  md += `The header stays at the top while the page scrolls, so search and navigation are always one step away. Because it holds controls, its height follows density like they do — one step along the spacing scale.\n\n`;
  mark(['layout.header.height', 'layout.scroll-padding.top']);
  md += table(['Token', 'Use it for', ...dHead], ['layout.header.height', 'layout.scroll-padding.top'].map((n) => {
    const t = tok.get(n);
    return [code(short(n)), tags(t.use), ...DENSITIES.map((d) => `${t.densities[d].px}`)];
  }));
  md += `\n**It holds its controls and leaves the page room** (check L4):\n\n`;
  const tall = STICKY_FROM_EM * 16;
  md += table(['Density', 'Header', 'Control', 'Room', `Share of a ${tall}px-tall window`], DENSITIES.map((d) => {
    const h = r('layout.header.height', { Density: d }), c = r('size.control.height', { Density: d });
    return [d, `${h}px`, `${c}px`, `${h - c}px (≥ ${HEADER_ROOM})`, `${Math.round((h / tall) * 100)}% (≤ ${STICKY_SHARE * 100}%)`];
  }));
  md += `\n**It sticks only where there is room.** The header stays at the top in windows at least ${STICKY_FROM_EM}em tall (${tall}px at the default text size). In shorter ones it scrolls away with the page: at 400% zoom the screen is ${REFLOW_WIDTH} × ${REFLOW_HEIGHT}px and a sticky header would take a fifth of it, and at 200% text a header that wraps onto a second line would grow past its scroll padding and cover the item that has focus. Because the limit is in em, at 200% text the header sticks only in windows at least ${2 * tall}px tall.\n`;
  md += `\n**Focus is never hidden under it (WCAG 2.4.11).** When someone tabs to a link near the top of the visible page — usually tabbing backwards — the browser scrolls it into view, right to the top edge, where the sticky header covers it. ${code('scroll-padding-top')} tells the browser to stop that far below the edge. ${code('tokens.css')} sets it on ${code('<html>')} from ${code('layout/scroll-padding/top')}, which points at the header height, so the two can't drift apart; it adds the focus ring's reach (${code('focus.ring.offset')} + ${code('focus.ring.width')}), so the ring above a focused item clears the header too (found by the radius audit). In code it is ${code(`max(header height, ${r('layout.header.height', { Density: cfg.density.default }) / 16}rem)`)}: when a reader enlarges text, the header's labels grow and the padding grows faster, so it always clears the real header (found by the layout audit: at 200% text a 56px padding left a focused radio button under a 75px header).\n\n`;
  md += `**More sticky bars, more padding.** A sticky toolbar under the header adds its own height: ${code(`scroll-padding-top: calc(var(${tok.get('layout.scroll-padding.top').cssVar}) + <toolbar height>)`)}. Sticky footers need ${code('scroll-padding-bottom')} the same way.\n`;
  md += rules([['Minimum height, not height', `${code('min-height')}: at 200% text the header grows instead of cutting off its labels.`],
    ['One sticky bar if you can', `Every sticky bar takes height from the page. A second one sticks under the same ${STICKY_FROM_EM}em condition and adds its height to the scroll padding.`],
    ['A header that can wrap', 'If a header can wrap even in a tall window, measure it in the browser and set the scroll padding from its real height (the handoff shows how).']]);

  // Choosing a layout
  md += chapter('Choosing a layout');
  md += `Four questions get you to the right layout: *how wide should this be?*, *where does it go?*, *how do I divide the space?* and *when does it change?*\n`;
  for (const d of contract.decisions.filter((x) => x.what !== 'How wide content gets')) {
    md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [tags(w), slash(s).replace(/((layout|breakpoint|space)\/[a-z0-9/*-]+[a-z0-9*])|(data-[a-z-]+="[a-z]+")|\b(md|lg|xl):/g, (m) => code(m))]));
  }
  md += `\n**Worked example — a project settings screen.** Laid out one question at a time:\n\n`;
  md += table(['Part', 'Decision', 'Token or class', 'Why'], [
    ['The frame', 'Header, navigation, main, supporting help', `${code(`.${p}-shell`)}`, 'An app screen with sections and help.'],
    ['Section links', 'Navigation pane', `${code('layout/pane/nav')}`, `Moving between sections: beside the content from ${sys.get('layout.pane.nav').meta.from}, a drawer below.`],
    ['The settings form', 'Main region, one column', `${code(`.${p}-page`)} + ${code('layout/measure/reading')}`, 'A form reads like text: one column, never wider than a reading line.'],
    ['Usage cards above the form', 'A tile grid', `${code('layout/tile/min')}`, 'Cards of one kind that wrap.'],
    ['Help for the current section', 'Supporting pane', `${code('layout/pane/aside')}`, `Supports the task: beside the content from ${sys.get('layout.pane.aside').meta.from}, below it before that.`],
    ['Between the cards and the form', 'Spacing', code('space/stack/2xl'), 'Sections of a page.'],
  ]);
  md += `\n**Do and avoid** (measured in this build)\n\n`;
  md += table(['Avoid', 'Measured', 'Do'], contract.mistakes.map((m) => [slash(m.mistake), tags(slash(m.measured)), `${m.fix.split(' / ').map((x) => code(slash(x))).join(' / ')} — ${tags(slash(m.fixValue))}`]));

  // Readers' settings and products
  md += chapter('Readers\' settings and products');
  md += `People zoom, enlarge text and pick denser screens; products add panes of their own. The layout is built so none of that breaks a screen.\n\n`;
  md += `**Zoom (WCAG 1.4.10).** At 400% zoom a 1280 × 1024 window is ${REFLOW_WIDTH} × ${REFLOW_HEIGHT}px — the ${code('sm')} layout. Every page has to work there without scrolling sideways; the margins stay ${r('layout.margin', { Responsive: 'sm' })}px and the content keeps ${REFLOW_WIDTH - 2 * r('layout.margin', { Responsive: 'sm' })}px (L1: ${checks.get('L1').summary}).\n\n`;
  md += `**Bigger text (WCAG 1.4.4).** Breakpoints are in em and the reading width in rem, so at 200% text a window gets the layout of one half as wide, and lines keep their length. Margins and gutters are px, so the text gets the extra room.\n\n`;
  md += `**Density.** Compact, default and comfortable change the header (${DENSITIES.map((d) => r('layout.header.height', { Density: d })).join(' / ')}px) and the gaps in tile grids; columns, margins and widths stay put. Reflow is checked in every density.\n\n`;
  md += `**What the config changes**\n\n`;
  md += table(['Follows the config', 'Fixed on purpose'], [
    [`The navigation pane's width (${code('layout.nav')}, now ${r('layout.pane.nav')}px; ${LIMITS.nav[0]}–${LIMITS.nav[1]}px)`, `The breakpoints, the columns and the reading width`],
    [`The supporting pane's width (${code('layout.aside')}, now ${r('layout.pane.aside')}px; ${LIMITS.aside[0]}–${LIMITS.aside[1]}px)`, `The page cap — computed from the xl margin`],
    [`The tile width (${code('layout.tile')}, now ${tile}px; ${LIMITS.tile[0]}–${LIMITS.tile[1]}px)`, 'Every check'],
    [`Panes added for this product (${code('layout.panes')})`, 'Token names — nothing in designs or code is renamed'],
  ]);
  if (product.length) {
    mark(product.map((x) => x.name));
    md += `\n**Panes added for this product** — defined in the engine config and checked like the built-in ones\n\n` + table(['Token', 'Use it for', 'Width', 'Beside the content from', 'Below that'], product.map((x) => [code(short(x.name)), tags(x.use), `${x.width}px`, `${code(x.from)} (≥ ${BREAKPOINT_MIN[x.from]}px)`, x.below === 'drawer' ? 'a drawer' : 'below the main content']));
  }
  const xl = shells.find((x) => x.breakpoint === 'xl');
  const room = xl.mainContentPx - measure;
  md += `\n**Adding a pane.** First check ${see('Choosing a layout')} — supporting content usually belongs in ${code('aside')}. If a product needs another pane, name it by its job, give a width in px and the breakpoint where it goes inline. The build assumes every pane can be open at once, adds them up at every breakpoint from there, and fails if the main region would lose its reading line or its grid (L3); a pane passes, and it appears in Figma, CSS, Tailwind, this guide and the AI contract at once. With the built-in panes open at ${code('xl')}, the main content keeps ${xl.mainContentPx}px — room for one more pane of up to ${room}px beside a ${measure}px reading line. An outline of a long page fits:\n\n`;
  md += '```json\n' + JSON.stringify({ layout: { panes: [{ name: 'layout.pane.outline', width: 192, from: 'xl', side: 'end', description: 'Headings of a long page, to jump between them' }] } }, null, 2) + '\n```\n\n';
  md += `A 288px inspector at ${code('xl')} would leave ${xl.mainContentPx - 288}px and fails L3; narrow the supporting pane (${code('layout.aside')}) or the new pane until they add up. A page that leaves a pane out gets no empty column — the shell sizes each column by the pane in it.\n\n`;
  md += `The build refuses widths that aren't px multiples of 8 or fall outside ${LIMITS.pane[0]}–${LIMITS.pane[1]}px, names that say where or how big ("left", "wide"), a pane inline on ${code('sm')}, and names that already exist. An end pane sits below the main content on narrower screens; a start pane becomes a drawer.\n`;

  // Reference
  md += `\n---\n\n## Accessibility reference\n\nWhat the build checks for layout, and the result for this build:\n\n`;
  md += table(['Check', 'What it checks', 'WCAG', 'Result'], report.checks.filter((c) => c.foundation === 'Layout' || c.id === 'T9').map((c) => [c.id, c.title, `${c.wcag} (${c.level})`, `${c.status} · ${c.summary}`]));
  md += `\nWhat the checkers look for in your own code and pages: the layout checker (${code('npm run lint:layout')}) reads CSS, HTML and JSX; the layout audit (${code('npm run audit:layout')}) renders a page at the narrowest width of every breakpoint in every density, then checks sideways scrolling, line length, focus under sticky bars and reading order. See the [handoff](HANDOFF.md).\n\n`;
  md += `**Glossary**\n\n`;
  md += table(['Term', 'Meaning'], [['Breakpoint', 'The window width where the layout changes; each lasts until the next begins.'], ['Column', 'One of the equal divisions of the page grid.'], ['Gutter', 'The space between two columns.'], ['Margin', 'The space between the screen edge and the content.'],
    ['Measure', 'The length of a line of text, in characters.'], ['Region', 'A part of the screen with one job: header, navigation, main, supporting.'], ['Pane', 'A region that sits beside the main region when there is room.'], ['Drawer', 'A pane that slides over the page when there is no room for it beside the content.'],
    ['Reflow', 'Content that rearranges into one column instead of scrolling sideways (WCAG 1.4.10).'], ['Mode', 'A set of values for every variable in a collection; switching it on a frame or container changes them all.']]);

  // Every built-in token documented exactly once.
  const all = contract.tokens.filter((t) => !t.product).map((t) => t.name);
  const missing = all.filter((n) => !documented.includes(n));
  const dupes = documented.filter((n, i) => documented.indexOf(n) !== i);
  if (missing.length || dupes.length) throw new Error(`guide: layout tokens missing ${missing.join(', ')} / duplicated ${dupes.join(', ')}`);
  return md;
}
