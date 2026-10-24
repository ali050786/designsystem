// Border guide (Markdown) for people: the written version of the border foundation's chapters.
// The words are fixed; every value, table and example number is computed from the build, so the guide can't drift
// from the tokens. Regenerate it with the build; never edit the output by hand.
import { DENSITIES } from '../foundations/spacing.js';
import { BORDER_SCALE, BORDER_KEYS, BORDER_MIN, BORDER_MAX, borderWidths } from '../foundations/shape.js';
import { BORDER_CHAPTER } from './ai-border.js';
import { contrast } from '../color-math.js';

const code = (s) => `\`${s}\``;
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
const short = (p) => p.replace(/\./g, '/');
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m));
const slash = (x) => x.replace(/\b(space|border|focus|color|elevation)\.[a-z0-9.<>*-]*[a-z0-9>*]/g, (m) => (/^border\.(control|roles)$/.test(m) ? m : short(m)));
const fmt = (x) => (Math.round(x * 100) / 100).toFixed(2);

export const BORDER_CHAPTERS = ['Five principles', BORDER_CHAPTER.built, BORDER_CHAPTER.jobs, BORDER_CHAPTER.colour, BORDER_CHAPTER.states, BORDER_CHAPTER.focus,
  BORDER_CHAPTER.joined, BORDER_CHAPTER.forced, 'Choosing a boundary', 'Readers\' settings and products'];

export function borderGuideMd(sys, cfg, report, contract) {
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
  const jobs = contract.jobs.filter((j) => !j.product);
  const product = contract.jobs.filter((j) => j.product);
  const W = Object.fromEntries(contract.jobs.map((j) => [j.job, j.px]));
  const ratio = (fg, bg, m) => contrast(r(fg, { Color: m }).slice(0, 7), r(bg, { Color: m }).slice(0, 7));
  const both = (fg, bg = 'color.bg.surface') => `${fmt(ratio(fg, bg, 'Light'))} · ${fmt(ratio(fg, bg, 'Dark'))}`;
  const ring = contract.focus.reach;
  const mistake = (start) => contract.mistakes.find((m) => m.mistake.startsWith(start));

  let md = `# Border\n\n`;
  md += `*${sys.name} foundations · border · the written guide. Generated from the engine — ${contract.tokens.length} tokens, ${contract.jobs.length} jobs, control boundaries ${contract.control}px; ${report.checks.filter((c) => c.foundation === 'Border').every((c) => c.status !== 'fail') ? 'every border check passing' : 'SOME CHECKS FAILING'}. Do not edit by hand; change the engine config and build again.*\n\n`;
  md += `This guide explains how ${sys.name} draws lines: when a boundary needs one at all, the four jobs a line can do and the width each one gets, which colours may draw them, how states and focus rings show, how parts that touch share a line, and what survives when people switch on forced colours. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after ${see('Choosing a boundary')}; developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (${code('border.md')}, ${code('border.contract.json')}).\n\n`;
  md += `**Contents**\n\n${BORDER_CHAPTERS.map((c) => `- ${see(c)}`).join('\n')}\n`;

  // Five principles
  md += chapter('Five principles');
  md += `Five principles shape every line. Each one is checked by the build or the border audit, not left to taste.\n\n`;
  md += table(['Principle', 'What it means in practice'], [
    ['**A line needs a reason**', `Space groups things and a change of surface sets a region apart; a line is for when neither is enough, or when someone needs it to find a control. Fewer lines make the ones that matter easier to see.`],
    ['**Width says the job**', `Four jobs, four widths: structure ${W.line}px, a control's edge ${W.control}px, a state ${W.state}px, the current item ${W.indicator}px. Jobs that share a width are told apart by colour, and the focus ring stands off the element (B2: ${checks.get('B2').summary}).`],
    ['**The lines people need are seen**', `A control's edge, a state and the current-item bar reach 3:1 against every background they sit on, in Light and Dark (B3: ${checks.get('B3').summary}). Lines that only separate may be quieter.`],
    ['**A state changes shape, not just colour**', `Selected, invalid and current borders get wider, with a check mark, an icon or a message beside them — and the padding gives up the extra width, so nothing moves (B4: ${checks.get('B4').summary}).`],
    ['**Every cue survives forced colours**', `Boundaries and focus rings are borders and outlines, never box-shadow or a fill alone; tokens.css adds system-colour outlines for states (B6: ${checks.get('B6').summary}).`],
  ]);

  // How tokens are built
  md += chapter(BORDER_CHAPTER.built);
  md += `Border tokens live in two collections: the scale, and the jobs that pick from it.\n\n`;
  md += table(['Collection', 'Modes', 'Border tokens in it', 'Changes with'], [
    ['**Primitives**', 'one · hidden from publishing', `The scale: ${BORDER_KEYS.map((k) => code(`border/width/${k}`)).join(', ')}`, 'nothing — raw values'],
    ['**Border**', 'one', `The jobs (${jobs.map((j) => code(short(j.name))).join(', ')}) and the focus ring (${['focus.ring.width', 'focus.ring.offset', 'focus.ring.color'].map((x) => code(short(x))).join(', ')})`, `the product's control width (${code('border.control')}, now ${contract.control}px)`],
  ]);
  mark(BORDER_KEYS.map((k) => `border.width.${k}`));
  md += `\n**The scale.** ${BORDER_KEYS.length} whole pixels, ${BORDER_MIN} to ${BORDER_MAX}px. Nothing below a pixel: Chrome and Edge round a 0.5px "hairline" up to a full 1px on every screen, while Safari and Firefox can draw a single device pixel on high-density screens — the same token would look different from browser to browser, and on a 1× screen it is never thinner than 1px anyway. A quieter line is a quieter colour, not a thinner one. Nothing above ${BORDER_MAX}px: a thicker line reads as a bar or a block.\n\n`;
  md += table(['Primitive', 'Value', 'Used by'], BORDER_KEYS.map((k) => {
    const users = contract.jobs.filter((j) => j.px === BORDER_SCALE[k]).map((j) => code(short(j.name)));
    if (r('focus.ring.width') === BORDER_SCALE[k]) users.push(code('focus/ring/width'));
    return [code(`border/width/${k}`), `${BORDER_SCALE[k]}px`, users.join(' · ') || '— (free for product jobs)'];
  }));
  md += `\n**Reading a name.** ${code('border / width / control')} — category ${code('border')}, property ${code('width')}, job ${code('control')}. Jobs are named by what the line is for, never by how heavy it looks: "thin" and "strong" stop being true the day the product picks heavier controls; "control" doesn't.\n\n`;
  const eg = tok.get('border.width.control');
  md += `**One name, three places.**\n\n` + table(['Figma variable', 'CSS variable', 'Tailwind'], [[code(eg.figma), code(eg.cssVar), `${eg.tailwind.map(code).join(', ')} (and ${code('border-b-control')}, ${code('border-s-control')} …)`]]);
  md += `\n**Primitives are never used directly.** In Figma they are hidden from the stroke-weight picker; in code the checker flags ${code(`--${p}-border-width-1`)}…${code('-3')}. The jobs are scoped to stroke weight, so they appear only there.\n`;

  // Widths by job
  md += chapter(BORDER_CHAPTER.jobs);
  md += `Four jobs. Pick by what the line does; the width comes with the job.\n\n`;
  mark(jobs.map((j) => j.name));
  md += table(['Job', 'Width', 'Use it for', 'Drawn in'], jobs.map((j) => [code(short(j.name)), `${j.px}px`, tags(j.use), j.colors.map((c) => code(short(c.name))).join(', ')]));
  md += `\n**Why a state is wider than a control.** A field in error and a field at rest differ in more than colour: ${W.state}px against ${W.control}px. Many people can't tell a red line from a grey one (${see(BORDER_CHAPTER.states)}); everyone can tell a thicker line from a thinner one.\n\n`;
  md += `**Why the current-item bar is its own job.** The current tab or page is marked on one side only, so it needs more weight than a state outline to read at a glance: ${W.indicator}px, on the block-end edge of a tab or the inline-start edge of a navigation link.\n\n`;
  md += `**Why structure and controls are separate jobs.** Both are ${W.line === W.control ? `${W.line}px here` : `${W.line}px and ${W.control}px`}, but a product can make its controls heavier (${code('"border": { "control": 2 }')}) without making every divider heavier. States follow: always one pixel wider than a control.\n`;
  md += rules([['One job per line', `A card outline is ${code('border/width/line')} even when it's selected: selection makes it ${code('border/width/state')}, it doesn't make the card a control.`],
    ['Hover and press don\'t change width', `They change the fill (${code('color/bg/state-hover')} …). A border that thickens under the pointer moves things and looks like a selection.`],
    ['Width never changes with density', 'Density changes the space around lines, not the lines.']]);

  // Lines and colour
  md += chapter(BORDER_CHAPTER.colour);
  md += `A width is half a line; its colour is the other half. Each job names the colour roles that may draw it, and the build measures every pair. Ask one question: *would someone miss something if this line disappeared?*\n\n`;
  md += `- **No — it only separates or outlines** (dividers, card and table frames, menus): ${code('border/width/line')} in ${code('color/border/subtle')} or ${code('color/border/default')}. The content identifies itself, so these are decorative and may stay quiet.\n- **Yes — it shows where a control is, or what state something is in**: control, state and indicator lines, in colours that reach 3:1 (WCAG 1.4.11).\n\n`;
  md += table(['Job', 'Colour role', 'On bg/surface (Light · Dark)', 'Lowest of its pairs (Light · Dark)', 'Needs'], contract.jobs.flatMap((j) => j.colors.map((c) => [code(short(j.name)), code(short(c.name)), both(c.name), c.lowest.Light ? `${c.lowest.Light.ratio} · ${c.lowest.Dark.ratio}` : '—', j.identifies ? '3:1' : 'decorative'])));
  md += `\n*"Lowest of its pairs": the worst background the colour is checked on, among canvas, surfaces, hover and pressed rows and selected rows (C3).*\n\n`;
  const bad = mistake('A card-outline grey');
  md += `**The common slip.** ${bad.mistake}: ${bad.measured}. Use ${code('color/border/input')} — ${bad.fixValue}.\n\n`;
  md += `**Overlays.** Menus, popovers and dialogs keep a ${code('border/width/line')} outline in ${code('elevation/floating/border')} even though they have a shadow: shadows are removed in forced colours, and in dark mode they barely show.\n`;
  md += rules([['Colour and width travel together', `Pick the job, then one of its colours. ${code('color/border/subtle')} on a field's edge, or a 2px line in a card grey, is a mismatch the checker flags (BR-07).`],
    ['No custom greys for lines', 'A grey picked by eye is unchecked: it may pass on white and fail on a hovered row.']]);

  // State borders
  md += chapter(BORDER_CHAPTER.states);
  md += `A state border shows that something changed: an option is selected, a field is in error, a tab is current. Three rules make it work for everyone.\n\n`;
  md += `**More than colour (WCAG 1.4.1).** The border widens to its job and something else comes with it: a check mark on a selected card, an icon and a message under a field in error, bold text on the current tab.\n\n`;
  const err = mistake('An error shown only');
  md += `- ${err.mistake}: ${err.measured}.\n- With the state width: ${err.fixValue}.\n\n`;
  md += `**The content stays still.** A border that grows by a pixel pushes the label a pixel; in a list, every row jumps as the selection moves. The padding gives up what the border takes, written on the tokens so it follows density:\n\n`;
  md += table(['Case', 'Padding', ...DENSITIES.map((d) => (d === cfg.density.default ? `${d} (this product)` : d))], contract.compensation.table.map((x) => [x.case, code(x.css), ...DENSITIES.map((d) => `${x.left[d]}px`)]));
  md += `\n*Padding left after the border grows; at least ${contract.compensation.min}px in every density (B4).*\n\n`;
  md += `**The current-item bar.** Draw it only on the current item — a border there with the padding reduced by its width (navigation), or a ${code('::after')} along the block-end edge (tabs). Don't give every item a transparent bar and colour the current one: forced colours draw transparent borders, so every item would show a bar there.\n\n`;
  md += '```css\n' + `.tab[aria-selected="true"]::after {\n  content: ""; position: absolute; inset-inline: 0; inset-block-end: 0;\n  border-block-end: var(--${p}-border-width-indicator) solid var(--${p}-color-border-selected);\n}\n.nav a[aria-current="page"] {\n  border-inline-start: var(--${p}-border-width-indicator) solid var(--${p}-color-border-selected);\n  padding-inline-start: calc(var(--${p}-space-inset-md) - var(--${p}-border-width-indicator));\n}` + '\n```\n\n';
  md += `**Say it in the markup.** ${code('aria-selected')}, ${code('aria-current')}, ${code('aria-pressed')}, ${code('aria-checked')} and ${code('aria-invalid')} tell assistive technology what the border shows — and tokens.css uses the first four to draw the state in forced colours (${see(BORDER_CHAPTER.forced)}).\n`;
  md += rules([['Disabled keeps its outline', `${code('color/action/disabled/border')} at the control width — exempt from contrast, but the control is still there to be found. Forced colours turn it GrayText.`],
    ['Validation is a state', `Success, warning and danger outlines are ${code('border/width/state')} with an icon and words. Colour alone says nothing to a screen reader either.`]]);

  // Focus rings
  md += chapter(BORDER_CHAPTER.focus);
  md += `The focus ring shows where the keyboard is. It is not a border: it is an outline drawn outside the element, so it never moves layout, never replaces the element's own border, and is measured against the page rather than the element's fill.\n\n`;
  mark(['focus.ring.width', 'focus.ring.offset', 'focus.ring.color']);
  md += table(['Token', 'Value', 'What it does'], [
    [code('focus/ring/width'), `${r('focus.ring.width')}px`, 'The ring\'s thickness (WCAG 2.4.13 asks for at least 2px)'],
    [code('focus/ring/offset'), `${r('focus.ring.offset')}px`, 'The gap between the element and the ring: the ring stands off the element, so it never looks like a state border'],
    [code('focus/ring/color'), `${r('focus.ring.color', { Color: 'Light' })} / ${r('focus.ring.color', { Color: 'Dark' })}`, `Linked to ${code('color/border/focus')}: ${both('color.border.focus')} on bg/surface, ${both('color.border.focus', 'color.bg.canvas')} on the canvas`],
  ]);
  md += `\n**Drawn for you.** tokens.css puts the ring on ${code(':focus-visible')} — keyboard focus, not mouse clicks — as ${code(`outline: var(--${p}-focus-ring-width) solid var(--${p}-focus-ring-color); outline-offset: var(--${p}-focus-ring-offset)`)}. Nothing to add in components; never remove it (F2: ${checks.get('F2').summary}).\n\n`;
  md += `**It reaches ${ring}px out.** Offset plus width. Nothing may clip that band (no ${code('overflow: hidden')} on a container with focusable things at its edge), and a sticky header leaves that much room: tokens.css adds it to the scroll padding, so a focused element never sits with its ring under the header (WCAG 2.4.11).\n\n`;
  md += `**Inside, when there's no room outside.** A full-width list row or a table cell has no space around it; keep the outline and give it a negative offset (${code(`outline-offset: calc(-1 * var(--${p}-focus-ring-width))`)}) so it is drawn inside. Still an outline, so it survives forced colours.\n\n`;
  const sh = mistake('A focus ring drawn with box-shadow');
  md += `**Never box-shadow alone.** ${sh.mistake}: ${sh.measured}. If a design really needs a shadow ring, keep ${code(`outline: var(--${p}-focus-ring-width) solid transparent`)} beside it — invisible normally, drawn in forced colours.\n`;
  md += rules([['Restyle through the tokens', `A different ring is a change to ${code('color/border/focus')} or ${code('focus/ring/*')} in the engine, where contrast is checked — not ${code('outline: none')} and a custom shadow.`],
    ['Rings follow corners', 'Outlines follow border-radius by themselves; a ring drawn on its own layer takes the -focus radius (Radius foundation).']]);

  // Joined parts
  md += chapter(BORDER_CHAPTER.joined);
  md += `Parts that touch — a button group, a segmented control, an input with its button, stacked list items — read as one thing. Two bordered parts side by side would put two borders at the seam.\n\n`;
  const j = mistake('Two bordered buttons');
  md += table(['', 'Seam', 'What you see'], [
    ['Two parts with their own borders', `${2 * W.control}px`, `A double line${2 * W.control === W.state ? ' — exactly the width of a selected state' : ''}`],
    [`In ${code(`.${p}-join`)}`, `${W.control}px`, 'One line, like the outer edges'],
  ]);
  md += `\n${code(`.${p}-join`)} overlaps each part with the one before by one control border (${code(contract.join.overlap)}), squares the corners where parts meet (Radius foundation) and lifts the part that changes — hovered, pressed, selected, invalid — so its whole border shows over the overlap; the focused part goes on top of that, so its ring is never covered. ${j.fixValue.replace(/^./, (c) => c.toUpperCase())}.\n\n`;
  md += '```html\n' + `<div class="${p}-join" role="group" aria-label="View">\n  <button class="btn" aria-pressed="true">List</button>\n  <button class="btn" aria-pressed="false">Board</button>\n</div>` + '\n```\n\n';
  md += `**Tables.** Cells use ${code('border-collapse: collapse')}, or lines on one side only (${code('border-block-end')} on rows): the same "one line per seam" rule.\n`;
  md += rules([['No hand-made overlaps', `A ${code('margin-inline-start: -1px')} written by hand doesn't follow the control width and doesn't lift the selected part (BR-10).`],
    ['A gap means separate', 'Parts with space between them keep all four borders.']]);

  // Forced colours
  md += chapter(BORDER_CHAPTER.forced);
  md += `People with low vision, migraines or light sensitivity switch on a contrast theme in Windows (and other forced-colour modes). The browser then replaces every colour the page chose with a handful of system colours. What it keeps and what it drops decides what people can still see:\n\n`;
  md += table(['What the page drew', 'In forced colours'], [
    ['Text colour', 'the system text colour'],
    ['Background colours and images', 'replaced by the page colour (or the system\'s button colour)'],
    ['Borders and outlines — transparent ones too', 'kept, in the system text colour'],
    ['box-shadow', 'removed'],
    ['A state shown only by a fill (a selected row, a pressed toggle)', 'gone — every row looks the same'],
  ]);
  md += `\n**What tokens.css does.** ${contract.forcedColors.tokensCss.map((x) => x.replace(/^./, (c) => c.toUpperCase())).join('. ')}.\n\n`;
  md += `**What you do.**\n\n${contract.forcedColors.you.map((x) => `- ${x.replace(/^./, (c) => c.toUpperCase())}.`).join('\n')}\n\n`;
  const pb = mistake('A primary button with border: none');
  md += `**The filled button.** ${pb.mistake}: ${pb.measured}. Give it ${code(`border: var(--${p}-border-width-control) solid transparent`)} — ${pb.fixValue}.\n\n`;
  md += `**Test it.** On Windows: Settings → Accessibility → Contrast themes. In Chrome or Edge DevTools: Rendering → Emulate CSS media feature forced-colors. The border audit renders every page in forced colours and checks that controls keep a visible edge, focus rings show and states still differ (${code('npm run audit:border')}).\n`;
  md += rules([['Don\'t opt out', `${code('forced-color-adjust: none')} is for colour swatches and charts, where the colours are the content — never for controls.`],
    ['Real attributes, real borders', 'A state the system can\'t see (a class that only changes a fill) can\'t be shown in forced colours.']]);

  // Choosing a boundary
  md += chapter('Choosing a boundary');
  md += `Four questions get you to the right line — or to no line: *does it need a line at all?*, *what state is it showing?*, *does the state widen the border?* and *does it touch another part?* Then check focus.\n`;
  for (const d of contract.decisions) {
    md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [tags(w), slash(s).replace(/((border|color|focus|elevation|space)\/[a-z0-9/<>*-]+[a-z0-9>*])|calc\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)|\.ds-join|data-join="block"|:focus-visible|aria-current|aria-selected|border-collapse: collapse|border-block-end|outline-offset/g, (m) => code(m.replace(/--ds-/g, `--${p}-`).replace(/\.ds-/, `.${p}-`))).replace(/padding(-inline(-start)?)?: `/g, (m) => `\`${m.slice(0, -1)}`)]));
  }
  md += `\n**Worked example — a settings page with a plan picker.** One line at a time:\n\n`;
  md += table(['Part', 'Job and colour', 'Width', 'Why'], [
    ['The page sections', 'none — space', '—', 'A stack gap separates them; a line would add nothing.'],
    ['The settings card', `${code('border/width/line')} · ${code('color/border/default')}`, `${W.line}px`, 'Outlines a group; decorative.'],
    ['Rows inside the card', `${code('border/width/line')} · ${code('color/border/subtle')}`, `${W.line}px`, 'Separates items that sit close.'],
    ['The email field', `${code('border/width/control')} · ${code('color/border/input')}`, `${W.control}px`, 'Shows where to type; 3:1.'],
    ['The field in error', `${code('border/width/state')} · ${code('color/border/danger')}`, `${W.state}px`, 'Plus an icon and a message; padding gives up the extra.'],
    ['The plan picker', `${code(`.${p}-join`)} · ${code('border/width/control')}`, `${W.control}px seams`, 'One control in three parts.'],
    ['The selected plan', `${code('border/width/state')} · ${code('color/border/selected')}`, `${W.state}px`, 'With aria-pressed and a check mark.'],
    ['Keyboard focus anywhere', code('focus/ring/*'), `${r('focus.ring.width')}px, ${r('focus.ring.offset')}px out`, 'Drawn by tokens.css.'],
  ]);
  md += `\n**Do and avoid** (measured in this build)\n\n`;
  md += table(['Avoid', 'Measured', 'Do'], contract.mistakes.map((m) => [tags(slash(m.mistake)), tags(slash(m.measured)), `${/^(border|color|focus|calc|\.)/.test(m.fix) ? code(slash(m.fix).replace(/--ds-/g, `--${p}-`).replace(/\.ds-/, `.${p}-`)) : m.fix} — ${tags(slash(m.fixValue))}`]));

  // Readers' settings and products
  md += chapter('Readers\' settings and products');
  md += `People enlarge text, zoom, switch to dark mode or forced colours; products choose heavier controls or add lines of their own. Borders are built so none of that breaks.\n\n`;
  const rem = mistake('border-width: 0.0625rem');
  md += `**Bigger text (WCAG 1.4.4).** Widths are px: when text doubles, lines stay lines. Written in rem they would double too — ${rem.mistake.replace(/^border-width: /, '')}: ${rem.measured}.\n\n`;
  md += `**Zoom (WCAG 1.4.10).** Zoom scales everything, lines included: at 400% a ${W.line}px line is drawn ${4 * W.line} screen pixels wide, in proportion with everything around it.\n\n`;
  md += `**Dark mode.** Widths stay; colours change, and every pair is measured in both modes (${see(BORDER_CHAPTER.colour)}).\n\n`;
  md += `**Density.** Widths don't change with density; padding does, and the padding that gives way to a state border follows it (${see(BORDER_CHAPTER.states)}).\n\n`;
  md += `**Forced colours.** Contrast themes keep borders and outlines and drop fills and shadows; the whole of ${see(BORDER_CHAPTER.forced)} is about them.\n\n`;
  md += `**What the config changes**\n\n`;
  const w1 = borderWidths(1), w2 = borderWidths(2);
  md += table(['', 'line', 'control', 'state', 'indicator'], [[`${code('"border": { "control": 1 }')}${contract.control === 1 ? ' (this product)' : ''}`, ...['line', 'control', 'state', 'indicator'].map((k) => `${w1[k]}px`)], [`${code('"border": { "control": 2 }')}${contract.control === 2 ? ' (this product)' : ''}`, ...['line', 'control', 'state', 'indicator'].map((k) => `${w2[k]}px`)]]);
  md += `\n${code('"control": 2')} suits products whose people need fields to stand out (public services, forms filled in once a year). Structure lines stay at ${w1.line}px; states stay one pixel wider than controls.\n\n`;
  if (product.length) {
    mark(product.map((x) => x.name));
    md += `**Jobs added for this product** — defined in the engine config and checked like the built-in ones\n\n` + table(['Token', 'Width', 'Use it for', 'Drawn in'], product.map((x) => [code(short(x.name)), `${x.px}px${x.style !== 'solid' ? ` ${x.style}` : ''}`, tags(x.use), x.colors.map((c) => `${code(short(c.name))}${x.identifies ? ' (3:1)' : ''}`).join(', ')]));
    md += '\n';
  }
  md += `**Adding a job.** First check ${see('Choosing a boundary')} — most lines are one of the four. If a product needs another (a drop zone, a placeholder slot), name it by its job, give a width on the scale, one colour role, whether people need it to find something, and a style; the build refuses names by look ("thick", "hairline"), widths off the scale or below a pixel, colours that aren't border roles, and a job that identifies something in a colour under 3:1:\n\n`;
  md += '```json\n' + JSON.stringify({ border: { control: contract.control, roles: [{ name: 'border.width.drop-zone', width: 2, color: 'color.border.strong', identifies: true, style: 'dashed', description: 'The edge of an area files can be dropped on' }] } }, null, 2) + '\n```\n';

  // Reference
  md += `\n---\n\n## Accessibility reference\n\nWhat the build checks for borders, and the result for this build:\n\n`;
  md += table(['Check', 'What it checks', 'WCAG', 'Result'], report.checks.filter((c) => c.foundation === 'Border').map((c) => [c.id, c.title, `${c.wcag} (${c.level})`, `${c.status} · ${c.summary}`]));
  md += `\nColour pairs for every border colour are in C3 (colour guide). What the checkers look for in your own code and pages: the border checker (${code('npm run lint:border')}) reads CSS, HTML and JSX; the border audit (${code('npm run audit:border')}) renders a page normally and in forced colours, at 1280 and 320px and at 200% text, then checks widths, control edges and their contrast, doubled seams, content that moves when a state changes, and that every focus ring and every state still shows in forced colours. See the [handoff](HANDOFF.md).\n\n`;
  md += `**Glossary**\n\n`;
  md += table(['Term', 'Meaning'], [['Job', 'What a line is for (line, control, state, indicator); it decides the width and the colours allowed.'], ['Decorative line', 'A line that only separates or outlines; the content identifies itself, so it may be under 3:1.'],
    ['Hairline', 'A line thinner than a pixel; drawn differently on every screen, so ds has none.'], ['Focus ring', 'The outline that shows keyboard focus, drawn outside the element.'], ['Offset', 'The gap between an element and its focus ring.'],
    ['Seam', 'Where two joined parts meet.'], ['Forced colours', 'A browser mode (Windows contrast themes) that replaces the page\'s colours with system colours; borders and outlines survive, shadows and fills don\'t.'],
    ['Compensation', 'Taking a widened border\'s extra width off the padding, so the content doesn\'t move.']]);

  // Every built-in token documented exactly once.
  const all = contract.tokens.filter((t) => !t.product).map((t) => t.name);
  const missing = all.filter((n) => !documented.includes(n));
  const dupes = documented.filter((n, i) => documented.indexOf(n) !== i);
  if (missing.length || dupes.length) throw new Error(`guide: border tokens missing ${missing.join(', ')} / duplicated ${dupes.join(', ')}`);
  return md;
}
