// Spacing guide (Markdown) for people: the written version of the spacing foundation's chapters.
// The words are fixed; every value, table and example number is computed from the build, so the guide can't drift
// from the tokens. Regenerate it with the build; never edit the output by hand.
import { DENSITIES, SCALE, SPACE, BASE, FAMILIES, SIZE_ORDER, LABEL_FOR, TARGET_MIN, TARGET_ENHANCED, MIN_SPACE, LABEL_ROOM, GRID_FROM, px, shift } from '../foundations/spacing.js';
import { REFLOW_WIDTH } from '../foundations/layout.js';
import { SPACE_CHAPTER } from './ai-space.js';

const code = (s) => `\`${s}\``;
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
const short = (p) => p.replace(/\./g, '/');
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m));

export const SPACE_CHAPTERS = ['Five principles', 'The spacing scale', 'How tokens are built', SPACE_CHAPTER.inset, SPACE_CHAPTER.stack, SPACE_CHAPTER.inline,
  SPACE_CHAPTER.size, 'Density', 'Choosing and using space', 'Readers\' settings and products'];

export function spaceGuideMd(sys, cfg, report, contract) {
  const tok = new Map(contract.tokens.map((t) => [t.name, t]));
  const v = (path, d = 'default') => sys.resolve(path, { Density: d });
  const per = (path) => DENSITIES.map((d) => v(path, d)).join(' / ');
  const documented = [];
  const anchor = (title) => title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-');
  const see = (title) => `[${title}](#${anchor(title)})`;
  const chapter = (title) => `\n---\n\n## ${title}\n\n`;
  const rules = (items) => `\n**Rules**\n\n${items.map(([a, b]) => `- **${a}.** ${b}`).join('\n')}\n`;
  const dHead = DENSITIES.map((d) => (d === cfg.density.default ? `${d} (default mode)` : d));
  const tokenTable = (title, paths) => {
    documented.push(...paths);
    return `\n**${title}**\n\n` + table(['Token', 'Use it for', ...dHead], paths.map((p) => {
      const t = tok.get(p);
      if (!t) throw new Error(`guide: unknown token ${p}`);
      return [code(short(p)), tags(t.use) + (t.fixed ? ' · the same in every density' : ''), ...DENSITIES.map((d) => `${t.densities[d].px}`)];
    }));
  };
  const family = (f) => contract.tokens.filter((t) => t.family === f && !t.product).sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)).map((t) => t.name);
  const checks = new Map(report.checks.map((c) => [c.id, c]));
  const step = contract.densityRule.step;
  const steps = step === 1 ? 'one step' : `${['', 'one', 'two'][step] ?? step} steps`;
  const sizes = contract.tokens.filter((t) => t.kind === 'size');
  const ctl = (d) => v('size.control.height', d);
  const margin = sys.resolve('layout.margin', { Responsive: 'sm' });
  const ladderSizes = SIZE_ORDER.filter((s) => contract.tokens.some((t) => t.size === s && !t.product));
  const anyAt = (size) => contract.tokens.find((t) => t.size === size && !t.product).name;

  let md = `# Spacing\n\n`;
  md += `*${sys.name} foundations · spacing · the written guide. Generated from the engine — ${contract.tokens.length} tokens, ${DENSITIES.length} densities, density moves ${steps} along the scale; ${report.checks.filter((c) => c.foundation === 'Spacing').every((c) => c.status !== 'fail') ? 'every spacing check passing' : 'SOME CHECKS FAILING'}. Do not edit by hand; change the engine config and build again.*\n\n`;
  md += `This guide explains how space works in ${sys.name} and how to use it: the scale every value comes from, the three directions space runs in, how density changes a whole screen at once, and how targets stay big enough to hit. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after ${see('Choosing and using space')}; developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (${code('spacing.md')}, ${code('spacing.contract.json')}).\n\n`;
  md += `**Contents**\n\n${SPACE_CHAPTERS.map((c) => `- ${see(c)}`).join('\n')}\n`;

  // Five principles
  md += chapter('Five principles');
  md += `Five principles shape every spacing decision. Each one is checked by the build, not left to taste.\n\n`;
  md += table(['Principle', 'What it means in practice'], [
    ['**Closer means related**', `The more closely two things belong together, the smaller the space between them. Every family steps up from its smallest size to its largest, in every density (check S4).`],
    ['**One ladder, three directions**', `A size word means the same distance everywhere: ${code('inset/md')}, ${code('stack/md')} and ${code('inline/md')} are all ${v('space.inset.md')}px in default density. The family only says which way the space runs.`],
    ['**Density is one rule**', `Compact is ${steps} down the scale and comfortable ${steps} up, for every token (S3). Nothing ever collapses below ${MIN_SPACE}px (S5).`],
    ['**Targets stay big enough**', `Every pointer target is at least ${TARGET_MIN} × ${TARGET_MIN}px in every density (WCAG 2.5.8), and every control fits its label with room above and below (S1, S6).`],
    ['**The reader\'s text gets the room**', 'Spacing is px and heights are minimums. When people enlarge text, the text gets the extra room and boxes grow with it (S8).'],
  ]);

  // The spacing scale
  md += chapter('The spacing scale');
  md += `Every value comes from one scale of ${SCALE.length} values, from 0 to ${px(SCALE.at(-1))}px. The steps grow with the space: 2px apart up to ${GRID_FROM}px, 4px apart up to 24px, 8px apart up to 64px, then 16px. A 2px difference is easy to see between 4 and 6px and invisible between 60 and 62px, so the steps widen to stay visible. Every value from ${GRID_FROM}px up sits on the 4px grid, the same grid large type sizes use (check S7: ${checks.get('S7').summary}).\n\n`;
  md += `**Reading a primitive.** The number counts ${BASE}px units: ${code('space/4')} is ${px('4')}px and ${code('space/0-5')} is ${px('0-5')}px. These are the numbers Tailwind uses for its spacing scale, so they read the same in both.\n\n`;
  // Where each value is used, per density: the ladder slides along the scale as density changes.
  const usedIn = (k, d) => {
    const who = [...sys.tokens.values()].filter((t) => t.collection === 'Density' && t.values[d] === `{space.${k}}`);
    const fams = [...new Set(who.filter((t) => t.meta.spacing && !t.meta.product).map((t) => t.meta.size))];
    const rest = who.filter((t) => !t.meta.spacing).map((t) => code(short(t.path).replace(/^size\//, '')));
    return [...fams, ...rest].join(', ') || '—';
  };
  const links = (k) => [...sys.tokens.values()].filter((t) => ['Responsive', 'Border'].includes(t.collection) && Object.values(t.values).includes(`{space.${k}}`)).map((t) => code(short(t.path))).join(', ') || '—';
  documented.push(...SCALE.map((k) => `space.${k}`));
  md += `Where each value is used. Sizes are the ladder (the same in every family); notice how they slide one step along the scale from one density to the next:\n\n`;
  md += table(['Token', 'px', ...dHead, 'Also linked from'], SCALE.map((k) => [code(`space/${k}`), String(px(k)), ...DENSITIES.map((d) => usedIn(k, d)), links(k)]));
  md += rules([['Never use a primitive in a design', `${code('space/4')} doesn't change with density, so it stays put when the rest of the screen tightens. Use the semantic token for the job.`],
    ['Never add a value between steps', 'A 14px or 18px space isn\'t on the scale and isn\'t checked. If no token fits, add a token on a step (see the last chapter).']]);

  // How tokens are built
  md += chapter('How tokens are built');
  md += `Spacing comes in tiers, like colour and type. Each tier only points to the one below it.\n\n`;
  md += table(['Tier', 'In Figma', 'What it holds', 'Who touches it'], [
    ['**Primitives**', 'Primitives collection · one mode · hidden from publishing', `The scale: ${SCALE.length} values. No meaning.`, 'Nobody — the engine writes them'],
    ['**Semantic**', `Density collection · ${DENSITIES.join(', ')}`, `${contract.tokens.length} tokens named by job: spacing in three families and the sizes of things people press. Each points to a primitive per density.`, 'Everyone: designs and code use only this tier'],
    ['**Component**', 'Added with components', 'Points to semantic tokens, e.g. a button\'s padding.', 'Component authors (later phase)'],
  ]);
  md += `\n**Reading a name.** ${code('space / stack / md')} — category ${code('space')}, family ${code('stack')} (which way the space runs), size ${code('md')} (how much). Sizes come from one ladder, ${ladderSizes.map((s) => `${s} ${v(anyAt(s))}`).join(' · ')} px in default density, and mean the same distance in every family. Density is a mode, never part of a name.\n\n`;
  md += table(['Family', 'The space runs', 'CSS', 'Figma', 'Tailwind'], Object.entries(FAMILIES).map(([k, f]) => [code(k), f.about, f.css, f.figma, contract.families[k].tailwind.slice(0, 4).map((u) => code(`${u}-${k}-*`)).join(' ')]));
  const eg = tok.get('space.inset.md');
  md += `\n**One name, three places.** Designers and developers say the same word for the same space:\n\n`;
  md += table(['Figma variable', 'CSS variable', 'Tailwind'], [[code(eg.figma), code(eg.cssVar), eg.tailwind.slice(0, 2).map(code).join(', ')]]);
  md += `\nIn Figma, a frame's **Density** mode decides which values every variable inside it shows. In code, ${code('data-density')} on ${code('<html>')} or on any container does the same, and without it the page uses ${code(cfg.density.default)}.\n`;

  // Inset
  md += chapter(SPACE_CHAPTER.inset);
  md += `Inset is the padding between a container's edge and its content. Pick it by the size of the container: small things wrap tightly, big surfaces breathe.\n\n`;
  md += `- **The same on every side** by default. A card is ${code('inset/lg')} all round.\n- **Short labels are the exception.** A badge or chip takes ${code('inset/xs')} above and below and ${code('inset/sm')} at the sides, so the label doesn't look squeezed.\n- **Controls are the exception.** A button's or input's height comes from ${code('size/control/height')} as a minimum; its sides take ${code('inset/md')} and a small ${code('inset/xs')} above and below keeps a label that wraps off the edge. The label stays centred at every density and every text size.\n- **Inner is smaller than outer.** A panel inside a card gets a smaller inset than the card. Corners follow too: an inner radius is the outer radius minus the padding (Shape foundation).\n`;
  md += tokenTable('Inset tokens', family('inset'));
  md += rules([['Pad the container, not the child', 'Space between a container\'s edge and its content is the container\'s inset, not a margin on the first child.'],
    ['Inside is smaller than outside', 'A container\'s inset is smaller than the space around the container.']]);

  // Stack
  md += chapter(SPACE_CHAPTER.stack);
  md += `Stack is the space between things in a column. Pick it by how closely they belong together: parts of one thing get ${code('stack/xs')}, sections of a page ${code('stack/2xl')}.\n\n`;
  md += `A form field shows the whole ladder at work, in default density:\n\n`;
  md += table(['Between', 'Token', 'px'], [['A label and its field', code('stack/xs'), v('space.stack.xs')], ['A field and its help text', code('stack/xs'), v('space.stack.xs')], ['One field and the next', code('stack/lg'), v('space.stack.lg')],
    ['One group of fields and the next', code('stack/xl'), v('space.stack.xl')], ['The form and the next section', code('stack/2xl'), v('space.stack.2xl')]]);
  md += `\nBecause each pair sits closer to itself than to its neighbours, people see four fields in two groups without reading a word. Paragraphs are separated by ${code('stack/lg')} (${v('space.stack.lg')}px in default density), never by empty lines.\n`;
  md += tokenTable('Stack tokens', family('stack'));
  md += rules([['Inside a group is smaller than between groups', 'Equal spacing everywhere makes every element look unrelated.'],
    ['Put the gap on the parent', 'A column with row-gap (or an auto-layout gap in Figma) has one place to change; margins on every child have many.'],
    ['Group in the markup too', 'If spacing shows a group, wrap it in a list, a fieldset or a section with a heading, so screen-reader users get the same grouping.']]);

  // Inline
  md += chapter(SPACE_CHAPTER.inline);
  md += `Inline is the space between things side by side in a row: an icon and its text, buttons in a group, groups in a toolbar. The same ladder applies — the more closely two things belong together, the smaller the gap.\n\n`;
  md += `**Rows that wrap** take two tokens: stack for the space between lines, inline for the space between items. In CSS that is one declaration: ${code(`gap: var(${tok.get('space.stack.sm').cssVar}) var(${tok.get('space.inline.sm').cssVar})`)} (row gap first).\n\n`;
  md += `**Right-to-left languages.** Use column-gap and the logical margins (margin-inline-start and -end) so the space flips with the text direction.\n`;
  md += tokenTable('Inline tokens', family('inline'));
  md += rules([['Let rows wrap', 'When a row runs out of room, it wraps; never shrink the gap to make it fit.'],
    ['One gap per group', 'Buttons in one group share one gap; a bigger gap separates the next group.']]);

  // Controls and targets
  md += chapter(SPACE_CHAPTER.size);
  md += `Things people press need room for a finger, a shaking hand or a mouse that lands a little off. WCAG 2.5.8 asks for at least ${TARGET_MIN} × ${TARGET_MIN}px. ${sys.name} meets it in every density (check S1: ${checks.get('S1').summary}), and comfortable controls reach ${ctl('comfortable')}px, over the ${TARGET_ENHANCED}px of the stricter AAA criterion (S2: ${checks.get('S2').status}).\n`;
  md += tokenTable('Size tokens', sizes.filter((t) => !t.product).map((t) => t.name));
  md += `\n**Controls fit their label.** Each density's controls use a label style (Typography foundation), and the build checks the label has room above and below (S6):\n\n`;
  md += table(['Density', 'Control height', 'Label', 'Room above and below'], DENSITIES.map((d) => {
    const lab = sys.resolve(LABEL_FOR[d], { Responsive: 'sm' });
    return [d, `${ctl(d)}px`, `${code(short(LABEL_FOR[d]).replace('type/', ''))} ${lab.fontSize}/${lab.lineHeight}px`, `${(ctl(d) - lab.lineHeight) / 2}px`];
  }));
  md += `\n**Small marks get a hit area.** A checkbox can be drawn at 16px as long as the area that reacts to a click is at least ${code('size/target/min')} (${v('size.target.min')}px): add padding around it or make its label part of the target. The same goes for close icons and drag handles. Links inside a sentence are the one exception WCAG allows — their size comes from the line of text.\n`;
  md += rules([['Heights are minimums', `Use ${code('size/control/height')} as a minimum height. At 200% text a label line is twice as tall; a fixed height cuts it off.`],
    ['Icon-only buttons are square', `Minimum width and height both ${code('size/control/height')}: ${per('size.control.height')}px (comfortable / default / compact). Minimums, not fixed sizes: an icon drawn as a character grows with the text.`],
    ['Don\'t rely on gaps between small targets', 'WCAG accepts small targets with enough space around them; in ds every target is big enough on its own, so nothing depends on the gap.']]);

  // Density
  md += chapter('Density');
  md += `Density changes how much fits on a screen. It is a mode with three values and one rule: **compact is ${steps} down the scale, comfortable ${steps} up**, for every spacing token and control size. The target floor never moves. Check S3: ${checks.get('S3').summary}.\n\n`;
  md += `The rule applied to the ladder:\n\n`;
  md += table(['Size', ...dHead], ladderSizes.map((s) => [s, ...DENSITIES.map((d) => `${v(anyAt(s), d)}`)]));
  md += `\nThe same rule moves control heights (${per('size.control.height')}px) and the icon gap (${per('size.control.icon-gap')}px). Because every token moves together, the ladder holds in every density: the space inside a group is still smaller than the space around it.\n\n`;
  const dd = contract.decisions.find((x) => x.what.startsWith('How dense'));
  md += `**Which density?**\n\n` + table(['Screen', 'Density'], dd.answers.map(([w, s]) => [w, code(s.replace(/ on that container$/, '')) + (s.endsWith('on that container') ? ' on that container' : '')]));
  md += `\n**One part of a page.** A dense table inside a default page gets ${code('data-density="compact"')} on its container; everything inside it follows, and the rest of the page doesn't change. In Figma, set that frame's Density mode.\n\n`;
  md += `**Labels follow the density.** Comfortable controls use ${code('label/lg')}, default and compact ${code('label/md')} (Typography foundation).\n`;
  md += rules([['Choose density per screen or region', 'Not per component: a compact button next to a default one looks like a mistake.'],
    ['Never make compact by renaming tokens', `${code('inset/sm')} "for compact" moves one value ${steps} further than the rest of the screen and skips the checks. Set the mode.`]]);

  // Choosing and using space
  md += chapter('Choosing and using space');
  md += `Two questions get you to the right token almost every time: *which way does the space run?* (that's the family) and *how closely do these two things belong together?* (that's the size).\n`;
  for (const d of contract.decisions.filter((x) => !x.what.startsWith('How dense'))) {
    md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [w, s.split(', ').map((x) => code(short(x.replace(/ \(.*$/, '')))).join(', ') + (s.match(/ \((.*)\)$/) ? ` (${s.match(/ \((.*)\)$/)[1]})` : '')]));
  }
  md += `\n**Worked example — a settings card.** Spaced one question at a time, in default density:\n\n`;
  md += table(['Part', 'Token', 'px', 'Why'], [
    ['Card padding', code('inset/lg'), v('space.inset.lg'), 'A card.'], ['Title → its description', code('stack/xs'), v('space.stack.xs'), 'Parts of one thing.'],
    ['Description → first field', code('stack/md'), v('space.stack.md'), 'A heading and its content.'], ['Label → input, input → help', code('stack/xs'), v('space.stack.xs'), 'Parts of one field.'],
    ['Field → next field', code('stack/lg'), v('space.stack.lg'), 'Fields in a form.'], ['Fields → buttons', code('stack/xl'), v('space.stack.xl'), 'A new group.'],
    ['Button → button', code('inline/sm'), v('space.inline.sm'), 'Items of one group.'], ['Button height · sides', `${code('size/control/height')} · ${code('inset/md')}`, `${ctl('default')} · ${v('space.inset.md')}`, 'A control.'],
    ['Card → next card', code('stack/lg'), v('space.stack.lg'), 'Cards in a list.']]);
  md += `\n**Do and avoid** (measured in this build)\n\n`;
  const slash = (x) => x.replace(/\b(space|size|layout)\.[a-z0-9.-]*[a-z0-9]/g, (m) => short(m));
  md += table(['Avoid', 'Measured', 'Do'], contract.mistakes.map((m) => [slash(m.mistake), slash(m.measured), `${m.fix.split(' / ').map((x) => code(slash(x))).join(' / ')} — ${slash(m.fixValue)}`]));

  // Readers' settings and products
  md += chapter('Readers\' settings and products');
  md += `People change how text looks, and products change how dense their screens are. The system is built so neither breaks a screen.\n\n`;
  md += `**Bigger text (WCAG 1.4.4).** Spacing is px, so when someone sets a larger text size, the text gets the room. On a ${REFLOW_WIDTH}px phone at 200% text the page margins stay ${margin}px and the content keeps ${REFLOW_WIDTH - 2 * margin}px; margins in rem would double to ${2 * margin}px each and leave ${REFLOW_WIDTH - 4 * margin}px. Check S8: ${checks.get('S8').summary}.\n\n`;
  md += `**More spacing (WCAG 1.4.12).** Some readers add space after paragraphs (2 × the font size) and between lines. Boxes with a minimum height grow; boxes with a fixed height cut the text off. The type audit applies this override to a real page.\n\n`;
  md += `**Bigger targets.** Products whose people need bigger targets — touch screens, field work, people with tremors — can default to comfortable, or offer it as a setting: controls are then ${ctl('comfortable')}px.\n\n`;
  md += `**What the config changes**\n\n`;
  md += table(['Follows the config', 'Fixed on purpose'], [[`The default density (${code('density.default')}, now ${code(cfg.density.default)})`, 'The scale and the ladder'], [`How far density moves (${code('spacing.densityStep')}, now ${step})`, `The ${TARGET_MIN}px target floor and every check`], [`Tokens added for this product (${code('spacing.tokens')})`, 'Token names — nothing in designs or code is renamed']]);
  const two = (k) => px(shift(k, -2) ?? k);
  md += `\n**A bigger density step.** ${code('"densityStep": 2')} moves every token two steps. The checks show why it isn't the default: compact ${code('inset/xs')} would be ${two('1')}px (S5) and compact controls ${two('10')}px tall, leaving ${(two('10') - sys.resolve('type.label.md', { Responsive: 'sm' }).lineHeight) / 2}px around the label (S6). The build stops and says so.\n\n`;
  const product = contract.tokens.filter((t) => t.product);
  if (product.length) md += tokenTable('Tokens added for this product — defined in the engine config and checked like every other token', product.map((t) => t.name)) + '\n';
  md += `**Adding a token.** First check ${see('Choosing and using space')} — most needs already have a token. If none fits, add one to a family with a size from 2xs to 4xl and a base on the scale; the build works out compact and comfortable, checks that it sits in the ladder (bigger than the size below it, smaller than the size above, the same as that size in other families) and puts it in Figma, CSS, Tailwind, this guide and the AI contract at once.\n\n`;
  md += '```json\n' + JSON.stringify({ spacing: { tokens: [{ name: 'space.stack.3xl', base: '12', description: 'Sections of a long landing page' }] } }, null, 2) + '\n```\n\n';
  md += `The build refuses px values, families other than inset, stack and inline (space for one component belongs with that component), names that already exist and bases that aren't on the scale.\n\n`;
  md += `**Linked to layout.** Page gutters and margins point at the same scale, per breakpoint rather than density — change the scale and the grid follows:\n\n`;
  md += table(['Token', 'sm', 'md', 'lg', 'xl'], contract.layoutLinks.map((l) => [code(short(l.token)), ...['sm', 'md', 'lg', 'xl'].map((bp) => `${l.breakpoints[bp].px} (${code(short(l.breakpoints[bp].primitive))})`)]));

  // Reference
  md += `\n---\n\n## Accessibility reference\n\nWhat the build checks for spacing, and the result for this build:\n\n`;
  md += table(['Check', 'What it checks', 'WCAG', 'Result'], report.checks.filter((c) => c.foundation === 'Spacing').map((c) => [c.id, c.title, c.wcag === '—' ? '— (our rule)' : `${c.wcag} (${c.level})`, `${c.status} · ${c.summary}`]));
  md += `\nWhat the checkers look for in your own code and pages: the spacing checker (${code('npm run lint:space')}) reads CSS, HTML and JSX; the spacing audit (${code('npm run audit:space')}) renders a page in all three densities and measures every target, then checks controls at 200% text. See the [handoff](HANDOFF.md).\n\n`;
  md += `**Glossary**\n\n`;
  md += table(['Term', 'Meaning'], [['Inset', 'Padding between a container\'s edge and its content.'], ['Stack', 'The vertical gap between things in a column.'], ['Inline', 'The horizontal gap between things in a row.'],
    ['Ladder', `The sizes xs to 2xl, the same distance in every family.`], ['Step', 'One move along the scale: from 12px, one step down is 8px and one step up is 16px.'],
    ['Density', 'comfortable, default or compact — a mode that moves every token along the scale.'], ['Target', 'The area that reacts to a click or tap.'], ['Hit area', 'A target made bigger than what is drawn, with padding or an invisible layer.'],
    ['Primitive', 'A raw value on the scale, with no meaning; semantic tokens point at it.'], ['Mode', 'A set of values for every variable in a collection; switching it on a frame or container changes them all.']]);

  // Every built-in token documented exactly once.
  const all = [...SCALE.map((k) => `space.${k}`), ...contract.tokens.filter((t) => !t.product).map((t) => t.name)];
  const missing = all.filter((n) => !documented.includes(n));
  const dupes = documented.filter((n, i) => documented.indexOf(n) !== i && !contract.tokens.find((t) => t.name === n)?.product);
  if (missing.length || dupes.length) throw new Error(`guide: tokens missing ${missing.join(', ')} / duplicated ${dupes.join(', ')}`);
  return md;
}
