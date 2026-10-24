// Spacing AI content: a machine-readable contract (JSON) and a rulebook (Markdown) for AI tools and the spacing checker.
// Both are generated from the engine, so they always match the shipped tokens.
import { cssName, SIZE_TW } from './css.js';
import { DENSITIES, SCALE, SPACE, BASE, FAMILIES, SIZE_ORDER, LADDER, LABEL_FOR, TARGET_MIN, TARGET_ENHANCED, MIN_SPACE, LABEL_ROOM, GRID_FROM, px } from '../foundations/spacing.js';
import { REFLOW_WIDTH } from '../foundations/layout.js';

export const SPACE_CHAPTER = { inset: 'Inset: padding', stack: 'Stack: vertical gaps', inline: 'Inline: horizontal gaps', size: 'Controls and targets', scale: 'The spacing scale' };
export const chapterOfToken = (path) => (path.startsWith('size.') ? SPACE_CHAPTER.size : SPACE_CHAPTER[path.split('.')[1]] ?? SPACE_CHAPTER.scale);

// Tailwind utilities that take each family (the checker holds code to these).
export const TW_FAMILY = {
  inset: ['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl', 'ps', 'pe'],
  stack: ['gap-y', 'space-y', 'mt', 'mb', 'my'],
  inline: ['gap-x', 'space-x', 'ml', 'mr', 'mx', 'ms', 'me'],
};

export const SPACE_DECISIONS = [
  { what: 'Space inside something (padding)', question: 'What is the container?', answers: [
    ['A badge, tag or small chip — above and below its label (the sides take space.inset.sm)', 'space.inset.xs'], ['A menu item, list row, tooltip, or a cell in a dense table', 'space.inset.sm'],
    ['The sides of a button or input; a table cell, popover or toast', 'space.inset.md'], ['A card or panel', 'space.inset.lg'], ['A dialog, sheet, large card or empty state', 'space.inset.xl'], ['A band across the page; the space above and below a page\'s content', 'space.inset.2xl']] },
  { what: 'Space between things above and below each other', question: 'How closely do they belong together?', answers: [
    ['Parts of one thing: a label and its field, a field and its help text, a title and its subtitle', 'space.stack.xs'],
    ['Items of one group: options in a checkbox group, rows of a simple list, menu items', 'space.stack.sm'],
    ['A heading and the content under it; items inside a card', 'space.stack.md'], ['Paragraphs, fields in a form, cards in a list', 'space.stack.lg'],
    ['Groups in a form or panel; blocks inside a large card', 'space.stack.xl'], ['Sections of a page or panel', 'space.stack.2xl']] },
  { what: 'Space between things side by side', question: 'How closely do they belong together?', answers: [
    ['An icon and its text in content; a value and its unit', 'space.inline.xs'], ['Items of one group: buttons in a button group, chips, tags', 'space.inline.sm'], ['A checkbox or radio and its label (a native box has no space of its own)', 'space.inline.sm'],
    ['Fields side by side; a title and its actions in a header', 'space.inline.md'], ['Columns of content in a card or panel; filters next to a search box', 'space.inline.lg'],
    ['Groups in a toolbar or action bar', 'space.inline.xl']] },
  { what: 'Something people press', question: 'What is it?', answers: [
    ['A button, input, select or tab', 'size.control.height (as min-height)'], ['An icon-only button', 'size.control.height (min-width and min-height)'],
    ['An icon next to the label inside a control', 'size.control.icon-gap'], ['A small mark people click: a checkbox, a close icon, a drag handle', 'size.target.min (its hit area)']] },
  { what: 'How dense the screen is', question: 'What kind of screen is it?', answers: [
    ['Tables, dashboards, admin tools — people scan a lot at once', 'data-density="compact"'], ['Most product screens', 'data-density="default"'],
    ['Touch-first screens, onboarding, people who need bigger targets', 'data-density="comfortable"'],
    ['One dense part of a page, such as a table in a default page', 'data-density="compact" on that container']] },
];

export const SPACE_RULES = [
  ['SR-01', 'Use a spacing token for every padding, margin and gap. Never px, rem or em values, and never Tailwind\'s own numeric scale (p-4, gap-2, mt-[13px]).', 'Tokens follow the density and stay on the scale; a hand-set 12px does neither and is never checked.', '—'],
  ['SR-02', 'Pick the family by direction: space.inset.* for padding, space.stack.* for vertical gaps (row-gap, margin-top and -bottom), space.inline.* for horizontal gaps (column-gap, margin-left and -right).', 'A size word is the same distance in every family, so the family only records which way the space runs. That is what reviews and the checker read.', '—'],
  ['SR-03', 'Pick the size by relationship: the more closely two things belong together, the smaller the space between them; space inside a group is always smaller than the space around it. When spacing shows a group, the markup groups it too (a list, a fieldset, a section with a heading).', 'People read grouping from distance before they read borders or headings. Screen-reader users get the same grouping only from the markup.', '1.3.1'],
  ['SR-04', 'Density is a mode: set data-density on <html> or on a container (a dense table inside a default page). Never swap token names or write a .compact class to make something tighter.', 'The mode moves every token together and keeps targets and labels safe; a swapped name moves one value and breaks the ladder.', '—'],
  ['SR-05', 'Every pointer target is at least 24×24px in every density. Controls use size.control.height; icon-only buttons are at least that square (min-width and min-height); small marks (a checkbox, a close icon, a drag handle) get a hit area of at least size.target.min.', 'People with tremors, on a moving bus or using a thumb miss small targets. 24px is the WCAG minimum.', '2.5.8'],
  ['SR-06', 'Heights are minimums. Anything that holds text uses min-height (min-height: var(--…-size-control-height), Tailwind min-h-control), never height.', 'At 200% text a label needs twice its line height; a fixed 32px box cuts it off.', '1.4.4, 1.4.12'],
  ['SR-07', 'Never use a primitive (space.4, --…-space-4) in a component. Use the semantic token for the job.', 'Primitives don\'t change with density, so that one space stays put when the rest of the screen tightens.', '—'],
  ['SR-08', 'Never redefine a spacing token in app code (--…-space-inset-md: 10px). Change the engine config and build, so the change is checked.', 'An overridden variable skips every check and silently changes every component that uses it.', '—'],
  ['SR-09', 'Never make space with empty elements: spacer divs, runs of <br> or &nbsp;.', 'They don\'t follow density, and screen readers may announce empty lines as "blank".', '—'],
];

const code = (s) => `\`${s}\``;
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m)).replace(/&nbsp;/g, code('&nbsp;'));
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
const per = (sys, path) => Object.fromEntries(DENSITIES.map((d) => [d, sys.resolve(path, { Density: d })]));
const fmt = (o) => DENSITIES.map((d) => o[d]).join(' / ');

/** Measured mistakes: what goes wrong, with the numbers from this build, and the token that fixes it. */
function mistakes(sys) {
  const md = per(sys, 'space.inset.md'), sm = per(sys, 'space.inset.sm');
  const ctl = per(sys, 'size.control.height');
  const lab = sys.resolve('type.label.md', { Responsive: 'sm' });
  const margin = sys.resolve('layout.margin', { Responsive: 'sm' });
  const xs = sys.resolve('space.stack.xs', { Density: 'default' }), lg = sys.resolve('space.stack.lg', { Density: 'default' }), smd = sys.resolve('space.stack.md', { Density: 'default' });
  return [
    { mistake: 'Padding written as 12px', measured: `stays 12px in every density; ${code('space.inset.md')} is ${fmt(md)}px (comfortable / default / compact)`, fix: 'space.inset.md', fixValue: 'follows the density' },
    { mistake: 'Compact made by swapping names (inset.md → inset.sm in a .compact class)', measured: `inside a compact screen that gives ${sm.compact}px — two steps from default while everything else moves one`, fix: 'data-density="compact"', fixValue: `on the container: ${code('space.inset.md')} becomes ${md.compact}px and every other token moves with it` },
    { mistake: 'Icon-only button drawn 20 × 20px', measured: `20px is below the ${TARGET_MIN}px minimum (WCAG 2.5.8)`, fix: 'size.control.height', fixValue: `as min-width and min-height: ${fmt(ctl)}px square` },
    { mistake: 'Button with height: 32px', measured: `at 200% text a ${code('label.md')} line is ${2 * lab.lineHeight}px, so a fixed 32px box cuts the label off`, fix: 'size.control.height', fixValue: 'as min-height — the button grows with its label' },
    { mistake: 'Page margins in rem (1rem)', measured: `at 200% text on a ${REFLOW_WIDTH}px phone each margin becomes 32px: ${REFLOW_WIDTH - 64}px of content, under 272px`, fix: 'layout.margin', fixValue: `${margin}px (px, linked to spacing): ${REFLOW_WIDTH - 2 * margin}px of content` },
    { mistake: 'The same space between everything (stack.md everywhere)', measured: `a label is ${smd}px from its own field and ${smd}px from the next field's label, so pairs don't read as pairs`, fix: 'space.stack.xs / space.stack.lg', fixValue: `xs inside a field (${xs}px), lg between fields (${lg}px)` },
  ];
}

export function spaceContract(sys, cfg, report) {
  const p = cfg.prefix;
  const density = [...sys.tokens.values()].filter((t) => t.collection === 'Density' && /^(space|size)\./.test(t.path)); // layout.header.* live in the layout contract
  const tw = (t) => {
    if (SIZE_TW[t.path]) {
      const n = SIZE_TW[t.path];
      return t.path === 'size.control.height' ? [`min-h-${n}`, `min-w-${n}`] : t.path === 'size.target.min' ? [`min-w-${n}`, `min-h-${n}`] : [`gap-${n}`];
    }
    const tail = t.path.split('.').slice(1).join('-');
    return TW_FAMILY[t.meta.family].map((u) => `${u}-${tail}`);
  };
  const tokens = density.map((t) => ({
    name: t.path, figma: t.path.replace(/\./g, '/'), cssVar: cssName(p, t.path), tailwind: tw(t),
    kind: t.meta.spacing ? 'spacing' : 'size', family: t.meta.family ?? null, size: t.meta.size ?? null, use: t.description, product: !!t.meta.product,
    fixed: !!t.meta.fixed, target: !!t.meta.target, chapter: chapterOfToken(t.path),
    densities: Object.fromEntries(DENSITIES.map((d) => [d, { px: sys.resolve(t.path, { Density: d }), primitive: t.values[d].slice(1, -1) }])),
  }));
  const step = SCALE.indexOf(tokens.find((t) => t.name === 'size.control.height').densities.comfortable.primitive.replace('space.', '')) - SCALE.indexOf(tokens.find((t) => t.name === 'size.control.height').densities.default.primitive.replace('space.', ''));
  return {
    $schema: 'ds-space-contract/1', system: sys.name, prefix: p, standard: 'WCAG 2.2 AA',
    densities: DENSITIES, defaultDensity: cfg.density.default,
    modeSwitching: { css: 'data-density="comfortable|default|compact" on <html> or on any container; without it, the default density', figma: 'Set the Density collection mode (comfortable, default, compact) on a frame' },
    densityRule: { step, text: `Compact is ${step === 1 ? 'one step' : 'two steps'} down the scale from default and comfortable ${step === 1 ? 'one step' : 'two steps'} up, for every token; size.target.min never moves.` },
    scale: SCALE.map((k) => ({ token: `space.${k}`, key: k, px: px(k), cssVar: cssName(p, `space.${k}`), units: SPACE[k] })),
    base: BASE,
    families: Object.fromEntries(Object.entries(FAMILIES).map(([k, v]) => [k, { ...v, tailwind: TW_FAMILY[k] }])),
    ladder: Object.fromEntries(Object.entries(LADDER).map(([size, key]) => [size, px(key)])),
    labelFor: LABEL_FOR,
    limits: { targetMin: TARGET_MIN, targetEnhanced: TARGET_ENHANCED, minSpace: MIN_SPACE, labelRoom: LABEL_ROOM, gridFrom: GRID_FROM, units: 'px' },
    build: { ok: report.ok, tokens: tokens.length, checks: report.checks.filter((c) => c.foundation === 'Spacing').map((c) => ({ id: c.id, title: c.title, status: c.status, summary: c.summary })) },
    rules: SPACE_RULES.map(([id, rule, why, wcag]) => ({ id, rule, why, wcag })),
    decisions: SPACE_DECISIONS,
    tokens,
    mistakes: mistakes(sys),
    layoutLinks: ['layout.gutter', 'layout.margin'].map((l) => ({ token: l, breakpoints: Object.fromEntries(['sm', 'md', 'lg', 'xl'].map((bp) => [bp, { px: sys.resolve(l, { Responsive: bp }), primitive: sys.get(l).values[bp].slice(1, -1) }])) })),
    headerLink: { token: 'layout.header.height', densities: Object.fromEntries(DENSITIES.map((d) => [d, sys.resolve('layout.header.height', { Density: d })])) },
  };
}

export function spaceRulesMd(c) {
  const dh = c.densities.map((d) => `${d}${d === c.defaultDensity ? ' (default mode)' : ''}`);
  let md = `# Spacing rules for AI tools — ${c.system}\n\n`;
  md += `Generated from the engine (${c.build.tokens} tokens, every one checked in all ${c.densities.length} densities; ${c.build.ok ? 'all checks pass' : 'SOME CHECKS FAIL'}). The same data in machine-readable form: ${code('spacing.contract.json')}.\n\n`;
  md += `## How to use this file\n1. Pick a token for every padding, margin and gap with the **Decision guide**, using token names exactly as written.\n2. Use the token itself — its CSS variable, Tailwind utility or Figma variable. Never copy its number into your own CSS.\n3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.\n4. Before answering, run the **Self-check**.\n\n`;
  md += `## Hard rules\n` + table(['ID', 'Rule', 'Why', 'WCAG'], c.rules.map((r) => [r.id, tags(r.rule), tags(r.why), r.wcag]));
  md += `\n## Decision guide\n`;
  for (const d of c.decisions) md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [w, /^(space|size)\./.test(s) ? s.split(', ').map((x) => code(x.replace(/ \(.*$/, '')) + (x.match(/ \(.*\)$/)?.[0] ?? '')).join(', ') : code(s.replace(/ on that container$/, '')) + (s.endsWith('on that container') ? ' on that container' : '')]));
  md += `\n## Density\n${c.densityRule.text} Set it with ${code('data-density')} on ${code('<html>')}, or on any container — everything inside follows. In Figma, set the frame's **Density** mode.\n`;
  md += `\n## Tokens\npx in each density. In code use the CSS variable (or the Tailwind utility); in Figma the variable of the same name.\n`;
  const fam = (title, list) => {
    if (!list.length) return '';
    return `\n### ${title}\n` + table(['Token', 'CSS variable', 'Tailwind', ...dh, 'Use'], list.map((t) => [code(t.name), code(t.cssVar), t.tailwind.slice(0, 3).map(code).join(' '), ...c.densities.map((d) => `${t.densities[d].px}`), tags(t.use) + (t.product ? ' (added for this product)' : '') + (t.fixed ? ' · the same in every density' : '')]));
  };
  for (const [k, v] of Object.entries(c.families)) md += fam(`${k} — ${v.about.toLowerCase()} (${v.css})`, c.tokens.filter((t) => t.family === k).sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)));
  md += fam('Sizes of things people press', c.tokens.filter((t) => t.kind === 'size'));
  md += `\n## The scale (primitives — never in components)\n${c.scale.map((s) => `${code(s.token)} ${s.px}`).join(' · ')} (px). The number is the Tailwind number: × ${c.base}px. Semantic tokens point at these; designs and code use the semantic tokens.\n`;
  md += `\n## Linked to layout\nPage gutters and margins point at the same scale, per breakpoint (not density):\n\n` + table(['Token', 'sm', 'md', 'lg', 'xl'], c.layoutLinks.map((l) => [code(l.token), ...['sm', 'md', 'lg', 'xl'].map((bp) => `${l.breakpoints[bp].px}`)]));
  md += `\n## Limits the build enforces\n` + table(['Limit', 'Value'], [
    ['Smallest pointer target', `${c.limits.targetMin} × ${c.limits.targetMin}px in every density (comfortable controls ${c.tokens.find((t) => t.name === 'size.control.height').densities.comfortable.px}px, over the ${c.limits.targetEnhanced}px AAA size)`],
    ['Smallest space', `${c.limits.minSpace}px in every density — nothing collapses to 0`], ['Room around a control\'s label', `at least ${c.limits.labelRoom}px above and below, in every density`],
    ['Ladder', `${Object.entries(c.ladder).map(([s, v]) => `${s} ${v}`).join(' · ')} px in default density, the same in every family`],
    ['Units in code', 'px — when readers enlarge text, the text gets the room, not the margins'],
  ]);
  md += `\n## Common mistakes (measured)\n` + table(['Mistake', 'Measured', 'Use instead'], c.mistakes.map((m) => [m.mistake, m.measured, `${code(m.fix)} — ${m.fixValue}`]));
  md += `\n## Self-check before answering\n- [ ] No px, rem or em values in padding, margin or gap — only spacing tokens (CSS variables, Tailwind ${code('p-inset-*')} / ${code('gap-y-stack-*')} / ${code('gap-x-inline-*')} utilities, Figma variables).\n- [ ] Every token name exists in the Tokens tables; no primitives (${code('space.4')}) in components.\n- [ ] Padding uses inset, vertical gaps stack, horizontal gaps inline.\n- [ ] Space inside a group is smaller than the space around it, and the markup groups what the spacing groups.\n- [ ] Density is set with ${code('data-density')}, never by swapping token names or a .compact class.\n- [ ] Every target is at least ${c.limits.targetMin}px; controls use min-height, never height.\n- [ ] No spacer elements, ${code('<br>')} runs or ${code('&nbsp;')} for space; no spacing variables redefined.\n`;
  return md;
}
