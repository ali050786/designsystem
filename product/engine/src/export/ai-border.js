// Border AI content: a machine-readable contract (JSON) and a rulebook (Markdown) for AI tools and the border checker.
// Both are generated from the engine, so they always match the shipped tokens.
import { cssName } from './css.js';
import { DENSITIES, MIN_SPACE } from '../foundations/spacing.js';
import { BORDER_SCALE, BORDER_KEYS, BORDER_JOBS, BORDER_JOB_ORDER, BORDER_MIN, BORDER_MAX, BORDER_STYLES, validateBorderConfig } from '../foundations/shape.js';
import { contrast } from '../color-math.js';
import { distance } from '../cvd.js';

export const BORDER_CHAPTER = {
  built: 'How tokens are built', jobs: 'Widths by job', colour: 'Lines and colour', states: 'State borders',
  focus: 'Focus rings', joined: 'Joined parts', forced: 'Forced colours',
};
export const chapterOfBorderToken = (path) => (/^border\.width\.\d$/.test(path) ? BORDER_CHAPTER.built : path.startsWith('focus.') ? BORDER_CHAPTER.focus : BORDER_CHAPTER.jobs);

/** The padding left when a state widens a border by `extra` px, written on the tokens. */
export const compensated = (p, padToken, extra) => `calc(var(${cssName(p, padToken)}) - ${extra})`;

export const BORDER_DECISIONS = [
  { what: 'Does it need a line at all', question: 'What should the boundary do?', answers: [
    ['Group things that belong together, with room to spare', 'space (Spacing: a bigger stack or inline gap) — no line'],
    ['Set a region apart from the page (a sidebar, a header band, a well)', 'a surface change (color.bg.surface-sunken, an elevation level) — no line; in forced colours both surfaces become the page colour, so a region that holds controls or must be found keeps a border.width.line edge'],
    ['Separate items that sit close together (list rows, table rows, menu groups)', 'border.width.line with color.border.subtle'],
    ['Outline a card, a panel, a table frame or a menu', 'border.width.line with color.border.default (things that float: their level\'s edge, elevation.floating.border)'],
    ['Show where a control is (a field, a checkbox, a secondary button)', 'border.width.control with color.border.input (fields, checkboxes, radios) or color.action.secondary.border (buttons)']] },
  { what: 'Showing a state', question: 'What changed?', answers: [
    ['It is selected (an option, a card, a segment)', 'border.width.state with color.border.selected, plus a check mark or bold label'],
    ['It is in error, needs attention or passed', 'border.width.state with color.border.danger / warning / success, plus an icon and a message'],
    ['It is the current one (the tab, the page in the navigation, a row being edited)', 'border.width.indicator on one side (block-end for tabs, inline-start for navigation) with color.border.selected, and aria-current or aria-selected'],
    ['It has keyboard focus', 'nothing to set: tokens.css draws the focus ring on :focus-visible'],
    ['It is hovered or pressed', 'a fill (color.bg.state-hover, color.bg.item-hover) — not a border; the width stays the same'],
    ['It is disabled', 'color.action.disabled.border at the same width; tokens.css turns it GrayText in forced colours']] },
  { what: 'A state that widens the border', question: 'How do you keep the content still?', answers: [
    ['A control that turns selected or invalid', 'padding-inline: calc(var(--ds-space-inset-md) - (var(--ds-border-width-state) - var(--ds-border-width-control)))'],
    ['A card that turns selected', 'padding: calc(var(--ds-space-inset-lg) - (var(--ds-border-width-state) - var(--ds-border-width-line)))'],
    ['The current navigation item', 'padding-inline-start: calc(var(--ds-space-inset-md) - var(--ds-border-width-indicator))'],
    ['A tab', 'nothing: its bar is a ::after on the selected tab only (position: absolute along the block-end edge), so nothing moves']] },
  { what: 'Parts that touch', question: 'Do they read as one thing?', answers: [
    ['Yes: a button group, a segmented control, an input with its button, stacked list items', '.ds-join (or data-join="block"): parts overlap by one control border, so each seam is one line'],
    ['No: separate things side by side', 'a gap (Spacing), each with its own border'],
    ['Table cells', 'border-collapse: collapse, or lines on one side only (border-block-end on rows)']] },
  { what: 'Focus', question: 'How is the ring drawn?', answers: [
    ['On anything focusable', 'tokens.css draws it: an outline, focus.ring.width wide, focus.ring.offset away, focus.ring.color'],
    ['You need a different look (an inset ring on a full-width row)', 'keep the outline and change outline-offset (a negative offset draws it inside) — never box-shadow alone'],
    ['Removing the default ring', 'never without a replacement outline; box-shadow rings vanish in forced colours']] },
];

export const BORDER_RULES = [
  ['BR-01', 'Border widths come from a job: border-width is var(--ds-border-width-line), -control, -state or -indicator (Tailwind border-line, border-control, border-state, border-indicator and their side forms: border-b-line, border-s-indicator, divide-y-line). No px, rem or em numbers; 0 only to remove a side.', 'A hard-coded width doesn\'t follow the product\'s control width, and a 2px border in the wrong place reads as a selected state.', '—'],
  ['BR-02', 'Never use border width primitives (--ds-border-width-1, -2, -3) in components. Pick the job.', 'Primitives don\'t say what a line is for, and don\'t move when the product changes its control width.', '—'],
  ['BR-03', 'No hairlines and no text-relative widths: nothing below 1px (0.5px, thin, a 1px line scaled down with transform), and never rem or em widths.', 'Below a pixel a line looks different in every browser (Chrome and Edge round it up to 1px; Safari and Firefox can draw a single device pixel on high-density screens); rem widths double at 200% text, so every 1px line becomes 2px — the width of a state.', '1.4.11'],
  ['BR-04', 'In Tailwind use the ds widths (border-line … border-indicator), not border, border-2, border-[3px] or ring-* for boundaries.', 'Tailwind\'s numbers are a second set of widths no check covers, and ring-* draws with box-shadow, which forced colours remove.', '—'],
  ['BR-05', 'Never remove the focus ring: no outline: none or outline: 0 (Tailwind outline-none) on :focus or :focus-visible unless an outline replaces it. A box-shadow ring keeps a transparent outline beside it.', 'Keyboard users lose their place; a box-shadow ring is removed in forced colours, so the element has no ring there at all.', '2.4.7, 2.4.13'],
  ['BR-06', 'Boundaries that carry meaning are borders or outlines, never box-shadow or a background alone: a control without a visible border gets border: var(--ds-border-width-control) solid transparent.', 'Forced colours (Windows contrast themes) replace every fill with one system colour and remove shadows: a button or field shown only by its fill or a box-shadow disappears. A transparent border is drawn there in the system\'s text colour.', '1.4.11'],
  ['BR-07', 'The colour fits the job: control, state and indicator widths take a colour that reaches 3:1 (color.border.input, color.border.strong, color.action.secondary.border, color.border.selected, color.border.danger / warning / success). color.border.subtle and color.border.default are for lines that only separate or outline.', 'A decorative grey on a field\'s edge measures under 3:1: people with low vision can\'t find the field.', '1.4.11'],
  ['BR-08', 'A state never shows by border colour alone: a selected, invalid or current border also widens to its job (state, indicator) and comes with a check mark, an icon or a message.', 'A red 1px border next to a grey one differs mostly in hue; for many people with red-green colour blindness the two look alike.', '1.4.1'],
  ['BR-09', 'A state that widens a border takes the extra width off the padding, written on the tokens: calc(var(--ds-space-inset-md) - (var(--ds-border-width-state) - var(--ds-border-width-control))). The content must not move.', 'A wider border pushes the label sideways on every selection; in a list, every row\'s text jumps as the selection moves.', '—'],
  ['BR-10', 'Parts that touch use .ds-join (it overlaps their borders by one control width and lifts the part that changes); never two borders side by side, and never a hand-made negative margin.', 'Two 1px borders make a 2px seam — the width of a selected state — between parts that are meant to read as one.', '—'],
  ['BR-11', 'Never redefine border or focus variables in app code (--ds-border-width-*, --ds-focus-ring-*). Change border.control or border.roles in the engine config and build.', 'An overridden width skips the checks that keep jobs apart, colours at 3:1 and states from moving content.', '—'],
];

export const BORDER_CLASSES = [
  ['join', 'Parts that touch (a button group, a segmented control, an input with its button): borders overlap by one control width so each seam is one line; outer corners keep their radius; the hovered, selected and focused part is lifted', '— (use the class)'],
  ['join[data-join="block"]', 'The same, stacked: list items or accordion panels that touch', '—'],
];

const code = (s) => `\`${s}\``;
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m));
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
const fmt = (x) => (Math.round(x * 100) / 100).toFixed(2);

/** Measured mistakes: what goes wrong, with the numbers from this build, and the token that fixes it. */
function mistakes(sys, cfg) {
  const r = (p, ctx) => sys.resolve(p, ctx);
  const L = { Color: 'Light' }, D = { Density: cfg.density.default };
  const W = (j) => r(`border.width.${j}`);
  const inp = r('color.border.input', L), dan = r('color.border.danger', L), def = r('color.border.default', L), surf = r('color.bg.surface', L);
  const prot = distance(inp, dan, 'protanopia'), norm = distance(inp, dan, 'normal');
  const md = r('space.inset.md', D);
  return [
    { mistake: 'A 0.5px "hairline" divider', measured: 'Chromium (Chrome, Edge) rounds it up and draws a full 1px on every screen (measured: computed 1px at 1× and 2×); Safari and Firefox can draw a single device pixel on high-density screens — one token, two looks, and never thinner than 1px on a 1× screen', fix: 'border.width.line + color.border.subtle', fixValue: `${W('line')}px everywhere; quieter by colour (${fmt(contrast(r('color.border.subtle', L), surf))}:1 on bg/surface), not by width` },
    { mistake: 'A card-outline grey on a text field (color.border.default)', measured: `${fmt(contrast(def, surf))}:1 against bg/surface — under the 3:1 a field's edge needs`, fix: 'border.width.control + color.border.input', fixValue: `${fmt(contrast(inp, surf))}:1 in Light, ${fmt(contrast(r('color.border.input', { Color: 'Dark' }), r('color.bg.surface', { Color: 'Dark' })))}:1 in Dark` },
    { mistake: 'An error shown only by turning the field\'s border red', measured: `the red and the normal grey have the same lightness (${fmt(contrast(inp, dan))}:1 between them); with protanopia their difference drops from ${norm.toFixed(3)} to ${prot.toFixed(3)} (OKLab) — the two borders look nearly the same`, fix: 'border.width.state + color.border.danger', fixValue: `${W('state')}px against ${W('control')}px, so the change shows without colour; with an icon and a message` },
    { mistake: `Widening a selected control's border from ${W('control')}px to ${W('state')}px without touching its padding`, measured: `the label moves ${W('state') - W('control')}px sideways each time it is selected`, fix: compensated(cfg.prefix, 'space.inset.md', `(var(${cssName(cfg.prefix, 'border.width.state')}) - var(${cssName(cfg.prefix, 'border.width.control')}))`), fixValue: `${md - (W('state') - W('control'))}px of padding instead of ${md}px: the border grows inward, the label stays still` },
    { mistake: 'Two bordered buttons placed side by side', measured: `their two ${W('control')}px borders make a ${2 * W('control')}px seam${2 * W('control') === W('state') ? ' — the width of a selected state' : ''}`, fix: '.ds-join', fixValue: `parts overlap by ${W('control')}px: every seam is one ${W('control')}px line` },
    { mistake: 'A focus ring drawn with box-shadow and outline: none', measured: 'forced colours remove every box-shadow: the element has no ring at all there', fix: 'the outline tokens.css draws', fixValue: `${r('focus.ring.width')}px outline, ${r('focus.ring.offset')}px away; in forced colours it takes the system's Highlight` },
    { mistake: 'A primary button with border: none (its fill is its only edge)', measured: 'forced colours replace its fill with the page colour: only the label is left, with nothing to show it is a button', fix: 'border: var(--ds-border-width-control) solid transparent', fixValue: 'invisible in normal colours; drawn in the system text colour in forced colours' },
    { mistake: 'border-width: 0.0625rem (1px written in rem)', measured: 'at 200% text it becomes 2px — the width of a selected state — on every line in the product', fix: 'border.width.line', fixValue: `${W('line')}px at any text size` },
  ];
}

export function borderContract(sys, cfg, report) {
  const p = cfg.prefix;
  const r = (path, ctx) => sys.resolve(path, ctx);
  const { control } = validateBorderConfig(cfg);
  const jobs = sys.byPrefix('border.width.').filter((t) => t.meta.job);
  const c3 = report.checks.find((c) => c.id === 'C3')?.items ?? [];
  const lowest = (color) => Object.fromEntries(['Light', 'Dark'].map((m) => {
    const xs = c3.filter((x) => x.fg === color && x.mode === m);
    if (!xs.length) return [m, null];
    const w = xs.reduce((a, b) => (a.ratio < b.ratio ? a : b));
    return [m, { ratio: w.ratio, on: w.bg }];
  }));
  const onSurface = (color) => Object.fromEntries(['Light', 'Dark'].map((m) => [m, +contrast(r(color, { Color: m }).slice(0, 7), r('color.bg.surface', { Color: m }).slice(0, 7)).toFixed(2)]));
  const tokens = [
    ...BORDER_KEYS.map((k) => ({ name: `border.width.${k}`, figma: `border/width/${k}`, cssVar: cssName(p, `border.width.${k}`), tailwind: [], use: 'Primitive: feeds the jobs; never used directly', collection: 'Primitives', chapter: BORDER_CHAPTER.built, px: BORDER_SCALE[k], product: false })),
    ...jobs.map((t) => ({ name: t.path, figma: t.path.replace(/\./g, '/'), cssVar: cssName(p, t.path), tailwind: [`border-${t.meta.job}`], use: t.description, collection: 'Border', chapter: BORDER_CHAPTER.jobs, px: r(t.path), primitive: t.values.Value.slice(1, -1), colors: t.meta.colors, identifies: t.meta.identifies, style: t.meta.style, sides: t.meta.sides, product: !!t.meta.product })),
    ...['focus.ring.width', 'focus.ring.offset', 'focus.ring.color'].map((x) => { const t = sys.get(x); return { name: x, figma: x.replace(/\./g, '/'), cssVar: cssName(p, x), tailwind: [], use: t.description, collection: 'Border', chapter: BORDER_CHAPTER.focus, ...(t.type === 'color' ? { light: r(x, { Color: 'Light' }), dark: r(x, { Color: 'Dark' }) } : { px: r(x) }), product: false }; }),
  ];
  const W = Object.fromEntries(jobs.map((t) => [t.meta.job, r(t.path)]));
  const comp = [
    { case: 'A control that turns selected or invalid', pad: 'space.inset.md', property: 'padding-inline', extra: W.state - W.control, css: `padding-inline: ${compensated(p, 'space.inset.md', `(var(${cssName(p, 'border.width.state')}) - var(${cssName(p, 'border.width.control')}))`)}` },
    { case: 'A card that turns selected (its outline goes from line to state)', pad: 'space.inset.lg', property: 'padding', extra: W.state - W.line, css: `padding: ${compensated(p, 'space.inset.lg', `(var(${cssName(p, 'border.width.state')}) - var(${cssName(p, 'border.width.line')}))`)}` },
    { case: 'The current navigation item (a bar on its start edge)', pad: 'space.inset.md', property: 'padding-inline-start', extra: W.indicator, css: `padding-inline-start: ${compensated(p, 'space.inset.md', `var(${cssName(p, 'border.width.indicator')})`)}` },
  ].map((x) => ({ ...x, left: Object.fromEntries(DENSITIES.map((d) => [d, r(x.pad, { Density: d }) - x.extra])) }));
  return {
    $schema: 'ds-border-contract/1', system: sys.name, prefix: p, standard: 'WCAG 2.2 AA',
    control, scale: BORDER_KEYS.map((k) => ({ token: `border.width.${k}`, px: BORDER_SCALE[k] })),
    jobs: jobs.map((t) => ({ name: t.path, job: t.meta.job, px: r(t.path), use: t.description, cssVar: cssName(p, t.path), tailwind: `border-${t.meta.job}`, style: t.meta.style, sides: t.meta.sides, identifies: t.meta.identifies, product: !!t.meta.product,
      colors: t.meta.colors.map((c) => ({ name: c, light: r(c, { Color: 'Light' }), dark: r(c, { Color: 'Dark' }), onSurface: onSurface(c), lowest: lowest(c), min: t.meta.identifies ? 3 : null })) })),
    focus: { width: r('focus.ring.width'), offset: r('focus.ring.offset'), color: 'color.border.focus', reach: r('focus.ring.width') + r('focus.ring.offset'), drawnWith: `outline on :focus-visible (tokens.css): ${r('focus.ring.width')}px, ${r('focus.ring.offset')}px away; in forced colours outline-color Highlight`, onSurface: onSurface('color.border.focus') },
    compensation: { rule: 'A state that widens a border takes the extra width off the padding on the same side, so the content stays where it was', table: comp, min: MIN_SPACE },
    join: { class: `${p}-join`, overlap: `calc(-1 * var(${cssName(p, 'border.width.control')}))`, markup: `<div class="${p}-join" role="group" aria-label="…"> <button>…</button> <button>…</button> </div> (data-join="block" for stacked parts)`, lifted: ':hover, [aria-pressed="true"], [aria-selected="true"], [aria-current], :checked, [aria-invalid="true"] (z-index 1); :focus-visible, :focus-within (z-index 2)' },
    forcedColors: {
      what: 'Windows contrast themes (and other forced-colour modes) replace every colour with a few system colours, remove box-shadows and background images, and keep borders and outlines (drawn in the system text colour — transparent ones too).',
      tokensCss: ['the focus ring takes Highlight', 'ARIA states (aria-selected, aria-current, aria-pressed, aria-checked) and labels around a checked radio (segmented controls, choice cards) get an inside outline in SelectedItem, as wide as a state border', 'disabled controls and their borders turn GrayText'],
      you: ['give every control a border, transparent if the design shows none (BR-06)', 'never draw a ring or a boundary with box-shadow alone (BR-05, BR-06)', 'show selection with an attribute tokens.css knows (aria-selected, aria-current, aria-pressed, aria-checked), a label around a checked radio, or a real border — not a fill alone', 'don\'t set forced-color-adjust: none except on colour swatches and charts, where the colours are the content'],
    },
    classes: BORDER_CLASSES.map(([name, use, tailwind]) => ({ class: `${p}-${name}`, use, tailwind })),
    limits: { min: BORDER_MIN, max: BORDER_MAX, styles: BORDER_STYLES, nonText: 3, paddingLeft: MIN_SPACE },
    build: { ok: report.ok, tokens: tokens.length, checks: report.checks.filter((c) => c.foundation === 'Border').map((c) => ({ id: c.id, title: c.title, status: c.status, summary: c.summary })) },
    rules: BORDER_RULES.map(([id, rule, why, wcag]) => ({ id, rule, why, wcag })),
    decisions: BORDER_DECISIONS,
    tokens,
    mistakes: mistakes(sys, cfg),
  };
}

export function borderRulesMd(c) {
  const P = (s) => s.replace(/--ds-/g, `--${c.prefix}-`).replace(/\.ds-/g, `.${c.prefix}-`);
  let md = `# Border rules for AI tools — ${c.system}\n\n`;
  md += `Generated from the engine (${c.build.tokens} tokens; control boundaries ${c.control}px; ${c.build.ok ? 'all checks pass' : 'SOME CHECKS FAIL'}). The same data in machine-readable form: ${code('border.contract.json')}.\n\n`;
  md += `## How to use this file\n1. Decide with the **Decision guide** whether the boundary needs a line at all, then which job it is.\n2. Use the width token and its colour role together — never copy a number into your own CSS.\n3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.\n4. Before answering, run the **Self-check**.\n\n`;
  md += `## Hard rules\n` + table(['ID', 'Rule', 'Why', 'WCAG'], c.rules.map((x) => [x.id, P(tags(x.rule)), tags(x.why), x.wcag]));
  md += `\n## Decision guide\n`;
  const CALC = /((?:padding(?:-inline(?:-start)?)?: )?calc\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\))/g;
  const f = (s) => P(s).split(CALC).map((part, i) => (i % 2 ? code(part) : part.replace(/(border\.width\.[a-z-]+|color\.(border|bg|action)\.[a-z.-]+[a-z]|elevation\.[a-z]+\.border|focus\.ring\.[a-z]+|\.[a-z]+-join|data-join="block"|:focus-visible|aria-current|aria-selected|border-collapse: collapse|border-block-end|outline-offset)/g, (m) => code(m)))).join('');
  for (const d of c.decisions) md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [tags(w), f(s)]));
  md += `\n## Jobs\nIn code use the CSS variable or the Tailwind utility (sides: ${code('border-b-line')}, ${code('border-s-indicator')}, ${code('divide-y-line')}); in Figma the variable of the same name in the stroke-weight field. Each job lists the colours it may be drawn in.\n\n`;
  md += table(['Job', 'Width', 'CSS variable', 'Tailwind', 'Colours (lowest contrast, Light · Dark)', 'Use'], c.jobs.map((j) => [code(j.name), `${j.px}px${j.style !== 'solid' ? ` ${j.style}` : ''}`, code(j.cssVar), code(j.tailwind),
    j.colors.map((x) => `${code(x.name)} ${j.identifies ? (x.lowest.Light ? `${x.lowest.Light.ratio} · ${x.lowest.Dark.ratio}` : 'not measured') : '(decorative)'}`).join('<br>'), tags(j.use) + (j.product ? ' (added for this product)' : '')]));
  md += `\n## Focus ring\n${c.focus.drawnWith}. It reaches ${c.focus.reach}px outside the element: nothing may clip it, and sticky bars leave that much room (tokens.css adds it to the scroll padding). On ${code('bg/surface')} it measures ${c.focus.onSurface.Light}:1 in Light and ${c.focus.onSurface.Dark}:1 in Dark.\n`;
  md += `\n## State borders don't move content\n${c.compensation.rule}. Computed per density (padding left after the border grows):\n\n`;
  md += table(['Case', 'CSS', ...DENSITIES], c.compensation.table.map((x) => [x.case, code(x.css), ...DENSITIES.map((d) => `${x.left[d]}px`)]));
  md += `\n## Joined parts\n- ${code(`.${c.join.class}`)}: ${P(BORDER_CLASSES[0][1])}. Markup: ${code(c.join.markup)}.\n- Overlap: ${code(c.join.overlap)}. Lifted: ${c.join.lifted}.\n`;
  md += `\n## Forced colours\n${c.forcedColors.what}\n\n**tokens.css already:** ${c.forcedColors.tokensCss.join('; ')}.\n\n**You:**\n${c.forcedColors.you.map((x) => `- ${x}`).join('\n')}\n`;
  md += `\n## Limits the build enforces\n` + table(['Limit', 'Value'], [
    ['Widths', `whole pixels, ${c.limits.min}–${c.limits.max}px, px in code`],
    ['Jobs stay apart', 'a state is wider than the control it marks; jobs of the same width use different colours; the focus ring stands off the element'],
    ['Lines people need', `control, state and indicator colours ≥ ${c.limits.nonText}:1 on every background they are paired with, Light and Dark`],
    ['Content stays still', `a widened border comes off the padding, leaving ≥ ${c.limits.paddingLeft}px in every density`],
    ['Forced colours', 'the ring is an outline in Highlight; ARIA states get a SelectedItem outline; disabled is GrayText; overlays keep a border'],
  ]);
  md += `\n## Common mistakes (measured)\n` + table(['Mistake', 'Measured', 'Use instead'], c.mistakes.map((m) => [tags(m.mistake), tags(m.measured), `${code(P(m.fix))} — ${tags(m.fixValue)}`]));
  md += `\n## Self-check before answering\n- [ ] Each boundary needs a line (space or a surface change didn't do the job), and each line has a job: line, control, state or indicator.\n- [ ] Every ${code('border-width')} is a ${code(`var(--${c.prefix}-border-width-<job>)`)} (Tailwind ${code('border-<job>')}); no px, rem, em, 0.5px or ${code(`--${c.prefix}-border-width-<n>`)}.\n- [ ] Control, state and indicator lines use a 3:1 colour; subtle and default only separate or outline.\n- [ ] States widen the border and add a check mark, icon or message; the padding shrinks by the same amount.\n- [ ] Every control has a border (transparent if none shows); no boundary or ring is box-shadow alone; no ${code('outline: none')} without a replacement.\n- [ ] Parts that touch use ${code(`.${c.join.class}`)}.\n- [ ] No border or focus variables redefined.\n`;
  return md;
}
