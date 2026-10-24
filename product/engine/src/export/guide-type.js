// Typography guide (Markdown) for people: the written version of the typography foundation's chapters.
// The words are fixed; every size, line height, ratio and table is computed from the build, so the guide can't
// drift from the tokens. Regenerate it with the build; never edit the output by hand.
import { BREAKPOINTS, KINDS, TRACKING, WEIGHTS, MIN_SIZE, READING_LH, TRACK_FROM, GRID4_FROM, sizeAt } from '../foundations/typography.js';
import { BREAKPOINT_MIN } from '../foundations/layout.js';

const code = (s) => `\`${s}\``;
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
const short = (p) => p.replace(/\./g, '/');
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m));

export const TYPE_CHAPTERS = ['Five principles', 'The type scale', 'How tokens are built', 'Fonts, weights and spacing', 'Headings and display', 'Titles and labels',
  'Reading text', 'Numbers and data', 'Across screen sizes', 'Choosing and using type', 'Readers\' settings and brands'];

// Styles per chapter, in reading order (every style appears exactly once; checked below).
export const TYPE_GROUPS = {
  'Headings and display': [['Display', ['display.lg', 'display.md', 'display.sm']], ['Headings', ['heading.lg', 'heading.md', 'heading.sm']]],
  'Titles and labels': [['Titles', ['title.lg', 'title.md', 'title.sm']], ['Labels', ['label.lg', 'label.md', 'label.sm']]],
  'Reading text': [['Body', ['body.lg', 'body.md', 'body.sm']], ['Captions and code', ['caption.md', 'code.md', 'code.sm']]],
  'Numbers and data': [['Numbers', ['numeric.lg', 'numeric.md', 'numeric.sm']]],
};

export function typeGuideMd(sys, cfg, report, contract) {
  const t = cfg.typography;
  const style = new Map(contract.styles.map((s) => [s.name, s]));
  const bpHead = BREAKPOINTS.map((bp) => `${bp} (≥${BREAKPOINT_MIN[bp]}px)`);
  const v = (path, bp = 'md') => style.get(path).breakpoints[bp];
  const documented = [];
  const anchor = (title) => title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-');
  const see = (title) => `[${title}](#${anchor(title)})`;
  const chapter = (title) => `\n---\n\n## ${title}\n\n`;
  const rules = (items) => `\n**Rules**\n\n${items.map(([a, b]) => `- **${a}.** ${b}`).join('\n')}\n`;
  const styleTable = (title, paths) => {
    documented.push(...paths.map((p) => `type.${p}`));
    return `\n**${title}**\n\n` + table(['Style', 'Use it for', ...bpHead, 'Weight'], paths.map((p) => {
      const s = style.get(`type.${p}`);
      if (!s) throw new Error(`guide: unknown style type.${p}`);
      const cells = BREAKPOINTS.map((bp) => { const x = s.breakpoints[bp]; return `${x.size}/${x.lineHeight}${x.large ? ' · L' : ''}`; });
      return [code(short(s.name)), tags(s.use) + (s.html.length ? ` (default for ${s.html.map((h) => code(`<${h}>`)).join(', ')})` : ''), ...cells, `${s.weight} ${s.weightValue}`];
    }));
  };
  const checks = new Map(report.checks.map((c) => [c.id, c]));
  const nScale = contract.styles.filter((s) => s.scales).length;
  const nFixed = contract.styles.length - nScale;
  const measure = sys.resolve('layout.measure.reading');
  const chars = (size) => Math.round(measure / (size * (t.charWidth ?? 0.48)));

  let md = `# Typography\n\n`;
  md += `*${sys.name} foundations · typography · the written guide. Generated from the engine — ${contract.styles.length} styles, ${BREAKPOINTS.length} breakpoints, base ${t.baseSize}px, ratios ${BREAKPOINTS.map((bp) => `${bp} ${t.ratio[bp]}`).join(' · ')}; ${report.checks.filter((c) => c.foundation === 'Typography').every((c) => c.status !== 'fail') ? 'every typography check passing' : 'SOME CHECKS FAILING'}. Do not edit by hand; change the engine config and build again.*\n\n`;
  md += `This guide explains how type works in ${sys.name} and how to use it: where the sizes come from, what each style is for, how styles change with the screen, and how text survives the settings readers choose. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after ${see('Choosing and using type')}; developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (${code('typography.md')}, ${code('typography.contract.json')}).\n\n`;
  md += `**Contents**\n\n${TYPE_CHAPTERS.map((c) => `- ${see(c)}`).join('\n')}\n`;

  // Five principles
  md += chapter('Five principles');
  md += `Five principles shape every type decision. Each one is checked by the build, not left to taste.\n\n`;
  md += table(['Principle', 'What it means in practice'], [
    ['**Readable by construction**', `Reading styles keep a line height of ${READING_LH} or more and nothing is smaller than ${MIN_SIZE}px, at every breakpoint. A style that breaks either rule can't be generated.`],
    ['**Roles, not sizes**', `Designs and code use named styles like ${code('type/body/md')}. A style carries its size, line height, letter-spacing and weight for every screen width; a number like 15px carries none of that.`],
    ['**Headings move, text stays**', `Only display and heading styles change with the screen (${nScale} of ${contract.styles.length}). Text people read and operate keeps one size everywhere, so forms, tables and buttons look the same on every device.`],
    ['**Numbers line up**', 'Number styles use tabular numerals, and table cells get them by default, so columns align and live values don\'t jitter.'],
    ['**Survives the reader\'s settings**', 'Sizes are rem, line heights have no unit and letter-spacing is in em, so text follows the browser\'s text size. Pages are checked with text at 200% and with the WCAG text-spacing override.'],
  ]);

  // The type scale
  md += chapter('The type scale');
  md += `Every size comes from one rule: **base × ratio^step**. The base is ${t.baseSize}px (step 0). Each step up multiplies by the ratio, each step down divides by it. The ratio depends on the screen width, so the same step is bigger on a wider screen.\n\n`;
  md += `**Rounding.** Below ${GRID4_FROM}px a size is rounded to a whole even pixel; from ${GRID4_FROM}px up, to the 4px grid. Even sizes centre cleanly in controls, and large sizes land on the same grid as spacing. (The 4px grid starts at ${GRID4_FROM}px because below that it is too coarse: two neighbouring steps would round to the same size.)\n\n`;
  const steps = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8];
  const usedBy = (step, scales) => contract.styles.filter((s) => !s.product && (sys.get(s.name).meta.step === step) && s.scales === scales).map((s) => code(short(s.name).replace(/^type\//, ''))).join(', ');
  md += table(['Step', ...bpHead, 'Styles that stay (sm size everywhere)', 'Styles that move'], steps.map((st) => [String(st), ...BREAKPOINTS.map((bp) => `${sizeAt(t.baseSize, t.ratio[bp], st)}`), usedBy(st, false) || '—', usedBy(st, true) || '—']));
  md += `\nTwo kinds of style read this table differently:\n\n- **Styles that move** (display, heading) take the ratio of the current breakpoint: ${BREAKPOINTS.map((bp) => `${bp} ${t.ratio[bp]}`).join(', ')}.\n- **Styles that stay** (everything else) always use the small-screen ratio, ${t.ratio.sm}, so a button label is the same size on a phone and on a desktop.\n\n`;
  md += `Why the ratio grows with the screen: on a phone, a page title can only be a little bigger than a paragraph or it won't fit; on a desktop there is room for a clearer hierarchy. ${t.ratio.lg === t.ratio.xl ? 'Large and extra-large share a ratio: past 1024px, wider screens get more columns and margin, not bigger headings — the reading width is capped anyway.' : ''}\n\n`;
  md += `**Line height** comes from what the text is for. Each kind has a minimum ratio; the line height is size × ratio rounded *up* to the next even pixel, so it never falls below the minimum:\n\n`;
  md += table(['Kind', 'Minimum ratio', 'For', 'Example'], Object.entries(KINDS).map(([k, x]) => {
    const ex = contract.styles.find((s) => s.kind === k && !s.product);
    return [k, x.lh.toFixed(2), x.about, ex ? `${code(short(ex.name))} at lg: ${v(ex.name, 'lg').size}/${v(ex.name, 'lg').lineHeight} (${v(ex.name, 'lg').ratio.toFixed(2)})` : '—'];
  }));
  md += rules([['Never add a size between steps', 'A 15px or 17px text breaks the rhythm and isn\'t checked. If no style fits, add a style on a step (see the last chapter).'],
    ['Pick a style, not a step', 'Steps are how styles are made. Designs and code use the styles.']]);

  // How tokens are built
  md += chapter('How tokens are built');
  md += `Type comes in two tiers, like colour. Each tier only points to the one below it.\n\n`;
  md += table(['Tier', 'In Figma', 'What it holds', 'Who touches it'], [
    ['**Primitives**', 'Primitives collection · one mode · hidden from publishing', `Families, weights, sizes (${sys.byPrefix('font.size.').length}), letter-spacings. No meaning.`, 'Nobody — the engine writes them'],
    ['**Styles**', 'Responsive collection · sm, md, lg, xl · plus one text style each', `${contract.styles.length} styles named by job. Each holds family, size, weight, line height and letter-spacing for every breakpoint.`, 'Everyone: designs and code use only this tier'],
    ['**Component text**', 'Added with components', 'Points to styles, e.g. a button\'s label.', 'Component authors (later phase)'],
  ]);
  md += `\n**Reading a name.** ${code('type / body / md')} — category ${code('type')}, role ${code('body')}, size ${code('md')}. Sizes are always ${code('sm')}, ${code('md')}, ${code('lg')} *within a role*: ${code('body/sm')} is the small body text, not "body on small screens". The screen size is a mode, never part of a name.\n\n`;
  md += `**What a style holds.** Five values per breakpoint, plus two switches for some styles:\n\n`;
  md += table(['Property', 'Points to', 'In code'], [
    ['Family', code('font/family/sans') + ' or ' + code('font/family/mono'), 'font-family'], ['Size', code('font/size/<px>'), 'font-size in rem'], ['Weight', code('font/weight/<name>'), 'font-weight'],
    ['Line height', 'computed per breakpoint (px in Figma)', 'line-height with no unit'], ['Letter-spacing', code('font/letter-spacing/<name>'), 'letter-spacing in em'],
    ['Tabular numerals', 'number styles only', 'font-variant-numeric: tabular-nums'], ['Upper case', 'only styles made for capitals', 'text-transform: uppercase'],
  ]);
  const eg = style.get('type.body.md');
  md += `\n**One name, four places.** Designers and developers say the same word for the same style:\n\n`;
  md += table(['Figma text style', 'CSS class', 'CSS variables', 'Tailwind'], [[code(eg.figma), code(`.${eg.cssClass}`), `${code(eg.cssVars.fontSize)} …`, code(eg.tailwind)]]);
  md += `\nIn Figma, a frame's **Responsive** mode decides which sizes every text style inside it shows. In code, the same switch happens with media queries at ${BREAKPOINTS.slice(1).map((bp) => `${BREAKPOINT_MIN[bp]}px`).join(', ')} — nothing to set.\n`;

  // Fonts, weights and spacing
  md += chapter('Fonts, weights and spacing');
  md += `The raw material every style is made from: two families, four weights, ${sys.byPrefix('font.size.').length} sizes and four letter-spacings. Like colour shades, they are hidden from publishing — you meet them through styles.\n\n`;
  md += `**Families.** Each is a stack: the font you designed with first, then fonts that look close, then the system's generic family. While a web font loads — or if it never does — the next font in the stack is used, so text is always readable.\n\n`;
  md += table(['Family', 'Stack', 'Used by'], [['sans', code(t.sans), 'every style except code'], ['mono', code(t.mono), code('code/*') + ' only']]);
  md += `\nNumbers stay in the sans family: tabular numerals line digits up without switching to a code font.\n\n`;
  md += `**Weights.** Four, named for what they are, so "bold" really means 700 — which matters for the large-text rule (bold text counts as large from 18.66px).\n\n`;
  const wUse = { regular: 'body, caption, code, numbers', medium: 'labels', semibold: 'titles, headings, the big metric figure, emphasis in text', bold: 'display' };
  md += table(['Weight', 'Value', 'Used by'], Object.entries(WEIGHTS).map(([k, x]) => [code(`font/weight/${k}`), String(x), wUse[k]]));
  md += `\n**Letter-spacing** is in em, so it follows the size it is applied to. Text below ${TRACK_FROM}px is never tightened; large text is tightened slightly so letters don't look loose; capitals are spaced out.\n\n`;
  const lsUse = { normal: `Everything below ${TRACK_FROM}px`, tight: `Headings from ${TRACK_FROM}px`, tighter: 'Display and headings from 44px', caps: 'Upper-case label styles (none built in)' };
  const pxAt = (em, size) => `${em === 0 ? '0' : `${em > 0 ? '+' : '−'}${Math.abs(em * size).toFixed(2)}`}px at ${size}px`;
  const emTxt = (em) => (em === 0 ? '0' : `${em < 0 ? '−' : '+'}${Math.abs(em)}em`);
  md += table(['Token', 'Value', 'Used for', 'For example'], Object.entries(TRACKING).map(([k, em]) => [code(`font/letter-spacing/${k}`), emTxt(em), lsUse[k], pxAt(em, k === 'normal' ? 16 : k === 'tight' ? 32 : k === 'tighter' ? 68 : 12)]));
  md += `\n**Sizes** used by the styles, with the rem value code uses:\n\n`;
  md += table(['Token', 'px', 'rem'], sys.byPrefix('font.size.').map((x) => [code(short(x.path)), String(x.values.Value), `${x.values.Value / 16}`]));
  md += rules([['Never use a primitive in a design', `${code('font/size/16')} has no line height, no letter-spacing and doesn't change with the screen. Use the style.`],
    ['Never set a font family in a component', 'Change fonts once, in the engine config; the fallback stack comes with it.']]);

  // Headings and display
  md += chapter('Headings and display');
  md += `Display and heading styles name the page and its parts. They are the only styles that change with the screen.\n\n`;
  md += `- **Display** is for statements, not structure: the one big line on a landing, welcome or empty page. At most one per view.\n- **Headings** build the page outline: the page title, its sections and subsections.\n\n`;
  md += `**Tag by outline, style by weight.** The heading *tag* (h1–h6) comes from where the text sits in the page's outline; the *style* comes from how much it should stand out. ${code('tokens.css')} gives each tag a sensible default (${['h1', 'h2', 'h3', 'h4', 'h5'].map((h) => `${code(`<${h}>`)} → ${code(short(contract.htmlDefaults[h]).replace('type/', ''))}`).join(', ')}), and any class overrides it. A settings page, for example:\n\n`;
  md += table(['Text', 'Tag', 'Style'], [['Settings', 'h1', code('heading/lg')], ['Notifications', 'h2', code('heading/md')], ['Email (a card)', 'h3', code('title/md')], ['Weekly summary (a row in the card)', '— (a label, not a heading)', code('label/md')]]);
  md += `\n**L** in the tables marks large text for contrast (WCAG: 24px and up, or 18.66px and up in bold). ${sys.name} colour pairs meet 4.5 : 1 for all text, so the larger allowance is never needed with ${sys.name} colours.\n`;
  for (const [title, ps] of TYPE_GROUPS['Headings and display']) md += styleTable(title, ps);
  md += rules([['One display per view', 'A second display competes with the first; use a heading for everything else.'],
    ['Page titles are headings', `An app screen's title is ${code('heading/lg')}, never display.`], ['Never skip a level', 'Screen-reader users move by heading level; h2 → h4 makes them think something is missing. Change the style, not the tag.']]);

  // Titles and labels
  md += chapter('Titles and labels');
  md += `Titles name components; labels are the text people act on. Both keep one size at every breakpoint, so a card or a button looks the same on every screen.\n\n`;
  md += `**Title or heading?** A heading names a part of the *page* and belongs in the outline. A title names a *component* — a card, a dialog, a panel — and is a heading only when the component is a section of the page. Use the title style either way.\n\n`;
  md += `**Labels follow the density.** Match the label to the density the screen uses (see the Spacing foundation):\n\n`;
  md += table(['Density', 'Control height', 'Label'], [['comfortable', `${sys.resolve('size.control.height', { Density: 'comfortable' })}px`, code('label/lg')], ['default', `${sys.resolve('size.control.height', { Density: 'default' })}px`, code('label/md')], ['compact', `${sys.resolve('size.control.height', { Density: 'compact' })}px`, code('label/md')], ['badges and chips (any density)', '—', code('label/sm')]]);
  for (const [title, ps] of TYPE_GROUPS['Titles and labels']) md += styleTable(title, ps);
  md += rules([['Labels may wrap; never clip them', 'A translated or enlarged label is longer. Let the control grow rather than cutting the text.'],
    ['Field labels stay visible', `Placeholders vanish when people type. Keep a ${code('label/md')} label above the field.`], ['Capitals only through a style made for them', 'A caps style adds letter-spacing; typing in capitals or adding text-transform by hand doesn\'t.']]);

  // Reading text
  md += chapter('Reading text');
  md += `Paragraphs, help text and code are read line by line, so they get the most space between lines: ${READING_LH} or more at every breakpoint. The build checks it (${checks.get('T2').summary}).\n\n`;
  md += `**Line length.** Running text stops at ${code('layout.measure.reading')} — ${measure / 16}rem, which is ${measure}px at the default text size. That is about ${chars(v('type.body.md').size)} characters of ${code('body/md')} and ${chars(v('type.body.lg').size)} of ${code('body/lg')} — inside the 45–75 range that is comfortable to read. Because it is in rem, the width grows when people enlarge text, and the characters per line stay the same.\n\n`;
  md += `**Paragraph spacing.** Separate paragraphs with ${code('space/stack/lg')} (${sys.resolve('space.stack.lg', { Density: 'default' })}px in default density — one line of ${code('body/md')} text is ${v('type.body.md').size}px), never with empty lines.\n\n`;
  md += `**Captions are short.** ${code('caption/md')} is ${v('type.caption.md').size}px — fine for a line or two of help, a timestamp or a chart label. Anything longer belongs in ${code('body/sm')}.\n\n`;
  md += `**Code.** Mono fonts look bigger than sans at the same size, so inline code goes one step down: ${code('code/md')} inside ${code('body/md')}, ${code('code/sm')} inside ${code('body/sm')} and captions.\n`;
  for (const [title, ps] of TYPE_GROUPS['Reading text']) md += styleTable(title, ps);
  md += rules([['Left-align running text', 'Justified text opens uneven gaps between words that make lines hard to follow.'], ['Don\'t use caption for instructions', `Steps people must follow need ${code('body/sm')} or ${code('body/md')}.`],
    ['Emphasis is weight or italics', `${code('<strong>')} gives semibold; underline means a link; colour alone is not emphasis.`]]);

  // Numbers and data
  md += chapter('Numbers and data');
  md += `Numbers that people compare must line up. **Tabular numerals** give every digit the same width, so 1,111.11 and 8,888.88 take exactly the same space and a column of totals reads as a column. Many interface fonts draw a narrow 1 by default: in Inter, ten 1s are about two-thirds the width of ten 0s until tabular numerals are on (measured in Chromium).\n\n`;
  md += `- Number styles turn tabular numerals on.\n- ${code('tokens.css')} turns them on for ${code('td')}, ${code('th')}, ${code('output')} and ${code('data')}, so tables need no class.\n- Anywhere else, use a number style or add ${code('tabular-nums')}.\n\n`;
  md += `**In a table column:** right-align numbers, keep the same number of decimals, put the unit in the header, and write negatives with a real minus sign (−, not -). Changes also carry an arrow or sign — colour tells good from bad, the arrow tells direction (see the Colour foundation).\n\n`;
  md += `**On a metric card:** the figure in ${code('numeric/lg')}, its name in ${code('label/md')}, and the context ("▲ 2.4% this week") in ${code('caption/md')}.\n`;
  for (const [title, ps] of TYPE_GROUPS['Numbers and data']) md += styleTable(title, ps);
  md += rules([['Right-align numbers in columns', 'Digits of the same place value then sit under each other.'], ['Don\'t use mono for numbers', 'Mono is for code. Tabular numerals align digits without changing the font.'],
    ['Don\'t animate digits rolling', 'Highlight a changed value briefly instead (see the Motion foundation).']]);

  // Across screen sizes
  md += chapter('Across screen sizes');
  md += `Type shares its four breakpoints with Layout. ${nScale} styles move with the screen; the other ${nFixed} stay put.\n\n`;
  md += table(['Breakpoint', 'From', 'Ratio', 'Page title', 'Section', 'Largest display'], BREAKPOINTS.map((bp) => [bp, `${BREAKPOINT_MIN[bp]}px`, String(t.ratio[bp]), `${v('type.heading.lg', bp).size}px`, `${v('type.heading.md', bp).size}px`, `${v('type.display.lg', bp).size}px`]));
  md += `\n**Fits a phone.** At 320px wide the largest display is ${v('type.display.lg', 'sm').size}px, small enough that headings wrap onto more lines instead of running off the screen (check L1: ${checks.get('L1').status}). ${code('tokens.css')} also lets a very long word break rather than force sideways scrolling.\n\n`;
  md += `**Large text changes too.** A style can be normal text on a phone and large text on a desktop. Where that happens:\n\n`;
  const flips = contract.styles.filter((s) => new Set(BREAKPOINTS.map((bp) => s.breakpoints[bp].large)).size > 1);
  md += flips.length ? table(['Style', ...bpHead], flips.map((s) => [code(short(s.name)), ...BREAKPOINTS.map((bp) => (s.breakpoints[bp].large ? 'large' : 'normal'))])) : 'No style changes class between breakpoints.\n';
  md += `\n**The hierarchy holds at every width.** Inside each role the sizes always step up, headings always stay above titles and display above headings (check T7: ${checks.get('T7').summary}).\n`;
  md += rules([['Design at sm and lg at least', 'Switch the frame\'s Responsive mode in Figma and look again; long headings wrap on phones.'],
    ['Never swap styles for mobile', `${code('heading/lg')} already shrinks on a phone. Choosing ${code('heading/sm')} "for mobile" makes it shrink twice and break the order.`]]);

  // Choosing and using type
  md += chapter('Choosing and using type');
  md += `One question gets you to the right style almost every time: *what is this text?* Then let the tag follow the outline.\n`;
  for (const d of contract.decisions) md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [w, s.startsWith('type.') ? s.split(' / ').map((x) => code(short(x.replace(/ \(.*$/, '')))).join(' or ') + (s.match(/ \((.*)\)$/) ? ` (${s.match(/ \((.*)\)$/)[1].replace(/type\.[a-z.]+/g, (m) => code(short(m)))})` : '') : s]));
  md += `\n**What follows what.** Text comes in stacks; these keep a clear step between neighbours:\n\n`;
  md += table(['Above', 'Below', 'Where'], [[code('heading/lg'), code('body/lg'), 'Page title and its intro'], [code('heading/md'), code('body/md'), 'A section and its first paragraph'], [code('title/md'), `${code('body/sm')} or ${code('caption/md')}`, 'A card and its description'],
    [code('label/md'), code('caption/md'), 'A field label and its help text'], [code('numeric/lg'), code('caption/md'), 'A metric and its context']]);
  md += `\n**Worked example — a project card.** Styled one question at a time:\n\n`;
  md += table(['Part', 'Style', 'Why'], [['"Website redesign"', code('title/md'), 'It names the card.'], ['"Marketing · 12 tasks"', code('caption/md'), 'Short supporting detail.'], ['Description', code('body/sm'), 'A sentence or two people read.'],
    ['"1,248 hours"', code('numeric/md'), 'Compared with other cards.'], ['"Open project"', code('label/md'), 'A button people press.'], ['"Beta"', code('label/sm'), 'A badge.']]);
  md += `\n**Do and avoid**\n\n`;
  md += table(['Do', 'Avoid', 'Why it matters'], [
    [`${code('body/md')} for paragraphs`, '16px with the browser\'s line height', `Browsers default to about 1.2; ${code('body/md')} is ${v('type.body.md').size}/${v('type.body.md').lineHeight} (${v('type.body.md').ratio.toFixed(2)}).`],
    [`${code('caption/md')} at ${v('type.caption.md').size}px for meta text`, '11px "fine print"', `Nothing in ${sys.name} is smaller than ${MIN_SIZE}px.`],
    ['h1 → h2 → h3, styled as needed', 'h1 → h4 because h4 "looks right"', 'Headings are how screen-reader users move through a page.'],
    ['Let boxes grow with their text', 'A fixed 40px-high card title', `At 200% text size one line of ${code('title/md')} needs ${2 * v('type.title.md').lineHeight}px.`],
    [`${code('numeric/md')} in a column of amounts`, 'Proportional digits', 'Totals drift left and right and are hard to compare.'],
  ]);

  // Readers' settings and brands
  md += chapter('Readers\' settings and brands');
  md += `People change how text looks — bigger text, more spacing, zoom — and products change fonts. The system is built so neither breaks a screen.\n\n`;
  md += `**Bigger text (WCAG 1.4.4).** Sizes are rem and line heights have no unit, so when someone sets a larger default text size in the browser, every style grows and keeps its proportions. Zoom must never be blocked: no ${code('user-scalable=no')}, no ${code('maximum-scale')}. Check T1: ${checks.get('T1').summary}.\n\n`;
  md += `**More spacing (WCAG 1.4.12).** Some readers apply their own spacing: line height 1.5×, paragraph spacing 2×, letter-spacing 0.12em and word spacing 0.16em of the font size. Reading styles already meet the line-height part. What breaks under the rest is layout: fixed heights, ${code('white-space: nowrap')} with hidden overflow, and text inside fixed-size boxes. Let boxes grow instead.\n\n`;
  md += `**Narrow screens (WCAG 1.4.10).** At 320px wide nothing should need sideways scrolling except data tables, which scroll inside their own container. The largest text fits (see ${see('Across screen sizes')}).\n\n`;
  md += `**While fonts load.** Load web fonts with ${code('font-display: swap')} so text shows straight away in the next font of the stack, and preload the regular and semibold files. Text must never be invisible while fonts download.\n\n`;
  md += `**What a font change touches**\n\n`;
  md += table(['Follows the config', 'Fixed on purpose'], [['The sans and mono families in every style', 'The scale, line heights and letter-spacing'], ['The fallback stacks', 'The minimum sizes and every check'], ['', 'Style names — nothing in designs or code is renamed']]);
  md += `\n**Changing fonts.** Set ${code('typography.sans')} (and ${code('typography.mono')}) in the engine config, build, read the report, and load the font files in the product. Before choosing a font, check three things the engine can't: it has tabular numerals, its digits and letters are easy to tell apart (1 l I, 0 O), and its average character width — set ${code('typography.charWidth')} so the line-length check stays honest (Inter measures ${t.charWidth ?? 0.48} em).\n\n`;
  md += `**Changing the scale.** ${code('typography.baseSize')} (even px) and ${code('typography.ratio')} per breakpoint are the only other choices. The checks set the limits: the small-screen ratio must keep the largest display at 40px or less (L1), and ratios that are too flat make neighbouring styles collide (T7). The build stops and says which.\n\n`;
  const product = contract.styles.filter((s) => s.product);
  if (product.length) {
    md += `**Styles added for this product** — defined in the engine config (${code('typography.styles')}) and checked like every other style:\n`;
    md += styleTable('Product styles', product.map((s) => s.name.replace(/^type\./, '')));
    md += '\n';
  }
  md += `**Adding a style.** First check ${see('Choosing and using type')} — most needs already have a style. If none fits, name the new style by its job, pick a step on the scale, a kind (which sets the line height) and a weight, and add it to the engine config. The build computes the sizes, refuses anything under ${MIN_SIZE}px or identical to an existing style, and checks it with the rest; when it passes, the style is in Figma, CSS, Tailwind, this guide and the AI contract at once.\n\n`;
  md += '```json\n' + JSON.stringify({ typography: { styles: [{ name: 'type.overline.sm', step: -2, kind: 'label', weight: 'semibold', case: 'upper', description: 'Short upper-case label above a section title' }] } }, null, 2) + '\n```\n\n';
  md += `Steps run from −2 to 9. ${code('kind')} is one of ${Object.keys(KINDS).map(code).join(', ')}; only display and heading kinds may set ${code('"scales": true')}; only labels and titles may be upper case; ${code('"tabular": true')} turns on tabular numerals.\n`;

  // Reference
  md += `\n---\n\n## Accessibility reference\n\nWhat the build checks for typography, and the result for this build:\n\n`;
  md += table(['Check', 'What it checks', 'WCAG', 'Result'], report.checks.filter((c) => c.foundation === 'Typography' || c.id === 'L1').map((c) => [c.id, c.title, c.wcag === '—' ? '— (our rule)' : `${c.wcag} (${c.level})`, `${c.status} · ${c.summary}`]));
  md += `\nWhat the checkers look for in your own code and pages: the type checker (${code('npm run lint:type')}) reads CSS, HTML and JSX; the type audit (${code('npm run audit:type')}) renders a page and measures sizes, line heights and line lengths, then applies the text-spacing override and 200% text and reports anything that gets cut off. See the [handoff](HANDOFF.md).\n\n`;
  md += `**Glossary**\n\n`;
  md += table(['Term', 'Meaning'], [['Style', 'A named job such as type/body/md that holds family, size, weight, line height and letter-spacing per breakpoint.'], ['Step', 'A position on the scale; 0 is the base size.'],
    ['Ratio', 'How much bigger each step is than the one below; it depends on the breakpoint.'], ['Reading text', `Text read line by line — body, caption, code — which keeps a line height of ${READING_LH} or more.`],
    ['Large text', 'WCAG\'s term for text from 24px, or from 18.66px in bold; it may use 3 : 1 contrast instead of 4.5 : 1.'], ['Tabular numerals', 'Digits that all have the same width, so columns line up.'],
    ['Measure', 'The width of a line of running text.'], ['Mode', 'sm, md, lg or xl. Switching mode changes which sizes every style shows.']]);

  // Every built-in style documented exactly once.
  const all = contract.styles.filter((s) => !s.product).map((s) => s.name);
  const missing = all.filter((n) => !documented.includes(n));
  const dupes = documented.filter((n, i) => documented.indexOf(n) !== i);
  if (missing.length || dupes.length) throw new Error(`guide: styles missing ${missing.join(', ')} / duplicated ${dupes.join(', ')}`);
  return md;
}

