// Radius guide (Markdown) for people: the written version of the radius foundation's chapters.
// The words are fixed; every value, table and example number is computed from the build, so the guide can't drift
// from the tokens. Regenerate it with the build; never edit the output by hand.
import { DENSITIES } from '../foundations/spacing.js';
import { RADIUS, RADIUS_KEYS, STYLE_NAMES, ROLE_ORDER, MARK_SIZE, CORNER_SHARE, PILL_FROM, nestedRadius } from '../foundations/shape.js';
import { RADIUS_CHAPTER, cornerGap, pokesOut } from './ai-radius.js';

const code = (s) => `\`${s}\``;
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
const short = (p) => p.replace(/\./g, '/');
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m));
const slash = (x) => x.replace(/\b(space|shape|radius|focus)\.[a-z0-9.<>*-]*[a-z0-9>*]/g, (m) => (/^radius\.(style|roles)$/.test(m) ? m : short(m)));
const px = (v) => (v >= 9999 ? 'full' : `${v}px`);
const an = (n) => (/^(8|11|18|80)(\D|$)/.test(String(n)) ? 'an' : 'a');
const fixCode = (s) => (/^(shape[./]|\.|max\(|parent|data-)/.test(s) ? code(s) : s);

export const RADIUS_CHAPTERS = ['Five principles', RADIUS_CHAPTER.built, RADIUS_CHAPTER.roles, RADIUS_CHAPTER.styles, RADIUS_CHAPTER.nested, RADIUS_CHAPTER.joined,
  RADIUS_CHAPTER.focus, RADIUS_CHAPTER.content, 'Choosing a shape', 'Readers\' settings and products'];

export function radiusGuideMd(sys, cfg, report, contract) {
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
  const style = contract.defaultStyle;
  const sHead = STYLE_NAMES.map((s) => (s === style ? `${s} (this product)` : s));
  const at = (path, s) => r(path, { Shape: s });
  const D = { Density: cfg.density.default };
  const builtIn = contract.roles.filter((x) => !x.product);
  const product = contract.roles.filter((x) => x.product);
  const ring = r('focus.ring.offset') + r('focus.ring.width');

  let md = `# Radius\n\n`;
  md += `*${sys.name} foundations · radius · the written guide. Generated from the engine — ${contract.tokens.length} tokens, ${contract.roles.length} roles, ${STYLE_NAMES.length} styles; ${report.checks.filter((c) => c.foundation === 'Radius').every((c) => c.status !== 'fail') ? 'every radius check passing' : 'SOME CHECKS FAILING'}. Do not edit by hand; change the engine config and build again.*\n\n`;
  md += `This guide explains how ${sys.name} rounds corners: the roles a shape can take, the three styles a product chooses between, how corners behave when shapes sit inside or against each other, and how focus rings and text stay clear of them. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after ${see('Choosing a shape')}; developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (${code('radius.md')}, ${code('radius.contract.json')}).\n\n`;
  md += `**Contents**\n\n${RADIUS_CHAPTERS.map((c) => `- ${see(c)}`).join('\n')}\n`;

  // Five principles
  md += chapter('Five principles');
  md += `Five principles shape every corner. Each one is checked by the build, not left to taste.\n\n`;
  md += table(['Principle', 'What it means in practice'], [
    ['**Shape follows the job**', `A shape's radius comes from what it is — a mark, a control, a container, a surface, a pill — never from how big it is or what looks nice next to it. Six roles cover every shape; the same kind of thing has the same corners everywhere.`],
    ['**One style, chosen once**', `A product picks sharp, default or round in its config, and every role follows. Roles keep their order in every style (R1: ${checks.get('R1').summary}), so a dialog is never sharper than the card under it.`],
    ['**Inner is outer minus padding**', `A shape inside a rounded one takes the parent's radius minus the padding between them — the only rule that keeps the gap even all the way round. It is an expression on the tokens, so it follows density and style by itself.`],
    ['**Corners stay corners**', `A radius is limited by the size of what it rounds: a checkbox never turns into a circle that reads as a radio, a control never into a pill, and text never runs out past a rounded edge (R2: ${checks.get('R2').summary}, R3: ${checks.get('R3').summary}).`],
    ['**Nothing cuts the ring**', `Focus rings follow the shape they surround (R4: ${checks.get('R4').summary}), and no rounded container clips them. Joined parts use logical corners, so they also work right to left.`],
  ]);

  // How tokens are built
  md += chapter(RADIUS_CHAPTER.built);
  md += `Radius tokens live in two collections: the scale, and the roles that pick from it per style.\n\n`;
  md += table(['Collection', 'Modes', 'Radius tokens in it', 'Changes with'], [
    ['**Primitives**', 'one · hidden from publishing', `The scale: ${RADIUS_KEYS.map((k) => code(`radius/${k}`)).join(', ')}`, 'nothing — raw values'],
    ['**Shape**', `${STYLE_NAMES.join(', ')} — ${style} first, so frames on Auto use it`, `The roles (${builtIn.map((x) => code(short(x.name))).join(', ')}) and the focus-ring radii (${contract.tokens.filter((t) => t.of && !t.product).map((t) => code(short(t.name))).join(', ')})`, 'the radius style'],
  ]);
  mark(RADIUS_KEYS.map((k) => `radius.${k}`));
  md += `\n**The scale.** ${RADIUS_KEYS.length} steps, named by twos like the spacing scale is by fours (${code('radius/4')} is 8px). Steps are 2px apart up to 8px, where a pixel still shows, then 4px; ${code('radius/full')} draws round ends on anything.\n\n`;
  md += table(['Primitive', 'Value', 'Used by'], RADIUS_KEYS.map((k) => {
    const users = builtIn.filter((x) => STYLE_NAMES.some((s) => sys.get(x.name).values[s] === `{radius.${k}}`)).map((x) => `${code(short(x.name))} (${STYLE_NAMES.filter((s) => sys.get(x.name).values[s] === `{radius.${k}}`).join(', ')})`);
    return [code(`radius/${k}`), px(RADIUS[k]), users.join(' · ') || '— (free for product roles)'];
  }));
  md += `\n**Reading a name.** ${code('shape / container')} — category ${code('shape')}, role ${code('container')}. Roles are named by job, never by size or look: "rounded-lg" stops being true the day the style changes; "container" doesn't.\n\n`;
  const eg = tok.get('shape.container');
  md += `**One name, three places.**\n\n` + table(['Figma variable', 'CSS variable', 'Tailwind'], [[code(eg.figma), code(eg.cssVar), eg.tailwind.map(code).join(', ')]]);
  md += `\n**Primitives are never used directly.** In Figma they are hidden from the radius picker; in code the checker flags ${code(`--${p}-radius-*`)}. Only the roles change with the style.\n`;

  // Roles by job
  md += chapter(RADIUS_CHAPTER.roles);
  md += `Six roles, from square to round. Pick by what the thing is; the style decides how round that is.\n\n`;
  mark(builtIn.map((x) => x.name));
  md += table(['Role', 'Use it for', ...sHead], builtIn.map((x) => [code(short(x.name)), tags(x.use), ...STYLE_NAMES.map((s) => px(x.styles[s]))]));
  md += `\n**Why a mark is its own role.** Checkboxes and radio buttons are told apart by shape: square and round. A ${MARK_SIZE}px checkbox with the control radius of the round style (${at('shape.control', 'round')}px) is a circle. ${code('shape/mark')} stays at most ${MARK_SIZE * CORNER_SHARE}px — a quarter of the box — in every style (R2).\n\n`;
  md += `**Why controls stay below a quarter of their height.** The smallest control is ${contract.limits.smallestControl}px tall (compact density); its radius stays at most ${contract.limits.smallestControl * CORNER_SHARE}px, so a button keeps corners and never reads as a badge. A radius of half the height or more draws round ends — that is ${code('shape/pill')}'s job.\n\n`;
  md += `**Pills are for labels that never wrap.** Round ends grow with the height: a badge stays one line and stays a pill. A button can wrap — a long translation, 200% text on a phone — and a two-line pill cuts its first and last letters off its fill (see ${see(RADIUS_CHAPTER.content)}). Buttons use ${code('shape/control')}.\n`;
  md += rules([['Same thing, same corners', 'Every button has the control radius, in every size, state and screen. A primary button is not rounder than a secondary one.'],
    ['Square where it meets', `${code('shape/none')} is for shapes that run edge to edge or meet other shapes: tables, full-bleed images, dividers, the shared edges of joined parts.`],
    ['Radius never changes with state', 'Hover, press, focus, selected and open change colour and the ring, never the corners.']]);

  // Radius styles
  md += chapter(RADIUS_CHAPTER.styles);
  md += `A style is the product's feel, chosen once: ${STYLE_NAMES.map(code).join(', ')}. It moves every role together and keeps their order, so screens stay consistent whichever is picked. This product uses **${style}**.\n\n`;
  md += table(['Role', ...sHead], ['mark', 'control', 'container', 'surface'].map((j) => [code(`shape/${j}`), ...STYLE_NAMES.map((s) => px(at(`shape.${j}`, s)))]));
  md += `\n${code('shape/none')} and ${code('shape/pill')} are the same in every style.\n\n`;
  md += `**Choosing.** ${code('sharp')} suits dense tools and data — corners barely soften, containers and controls look alike. ${code('default')} separates the roles clearly. ${code('round')} is friendlier and roomier; it pairs well with comfortable density. All three pass every check (R1–R4).\n\n`;
  md += `**Switching.** In the config: ${code('"radius": { "style": "round" }')}, then build. In code, ${code('data-radius="sharp|default|round"')} on ${code('<html>')} or on any element switches the roles inside it — a preview, a theme picker. In Figma, set the frame's Shape mode: one card, three modes, three styles.\n`;
  md += rules([['One style per product', 'Mixing styles on one screen undoes the point of roles. Use data-radius for previews, not for decoration.'],
    ['Change the style, not the roles', `A rounder card is a style change, not a new value for ${code('shape/container')} in app code.`]]);

  // Nested corners
  md += chapter(RADIUS_CHAPTER.nested);
  md += `When a rounded shape sits inside another with its corners in the other's corners — a panel filling a card, an item in a menu, a segment in a segmented control — the two curves should run side by side with the same gap all the way round. Only one rule does that: **inner radius = outer radius − padding**, never below zero.\n\n`;
  const R = at('shape.container', 'round'), pd = r('space.inset.sm', D);
  md += table(['Inner radius', `Gap along the sides`, 'Gap at the corner', 'What you see'], [
    [`${nestedRadius(R, pd)}px (${R} − ${pd})`, `${pd}px`, `${cornerGap(R, pd, nestedRadius(R, pd))}px`, 'An even band — the inner shape follows the outer one'],
    [`${at('shape.control', 'round')}px ("one step smaller")`, `${pd}px`, `${cornerGap(R, pd, at('shape.control', 'round'))}px`, 'The band widens at the corner'],
    [`${R}px (copied)`, `${pd}px`, `${cornerGap(R, pd, R)}px`, 'The inner shape bulges away from the corner'],
  ]);
  md += `\n*A ${R}px container (round style) with ${pd}px padding.*\n\n`;
  md += `**Written on the tokens, not as a number.** The padding changes with density and the outer radius with the style, so the inner radius is an expression: ${code(contract.nested.css)} — in Tailwind ${code(contract.nested.tailwind)}. In Figma, set the inner frame's radius to the computed value for the frame's modes (the table below).\n\n`;
  for (const n of contract.nested.table) {
    md += `**Inside ${code(short(n.outer))}** (${style} style)\n\n` + table(['Padding', ...DENSITIES.map((d) => (d === cfg.density.default ? `${d} (default mode)` : d))], n.rows.map((x) => [x.inset.startsWith('space') ? code(short(x.inset)) : x.inset, ...DENSITIES.map((d) => (x.clear[style][d] ? 'own role' : `${x.values[style][d]}px`))]));
    md += '\n';
  }
  md += `"Own role": the padding is at least the parent's radius, so the child's corners are clear of the curve — it keeps its own role (a card in a padded section, tiles in a grid).\n\n`;
  md += `**Flush children.** A header, image or table that touches the container's edge has no padding: it takes the container's radius on the corners it shares and stays square elsewhere. A square header in a ${R}px card would poke ${pokesOut(R, 0, 0)}px out past each rounded corner. Don't hide that with ${code('overflow: hidden')} on the card — clipping cuts off focus rings (see ${see(RADIUS_CHAPTER.focus)}).\n`;
  md += rules([['Only near the corners', 'The rule is for shapes whose corners sit inside the parent\'s corner. A button in the middle of a card keeps its own role.'],
    ['Only inside the curve', `The rule applies while the padding is smaller than the parent's radius. Inside ${an(at('shape.container', style))} ${at('shape.container', style)}px card with ${code('space/inset/lg')} padding, a code block is clear of the card's curve and keeps its own role.`]]);

  // Joined corners
  md += chapter(RADIUS_CHAPTER.joined);
  md += `Parts that touch — a button group, a segmented control, an input with its button, stacked list items — read as one shape. The outer corners keep the role's radius; the edges where parts meet are square.\n\n`;
  md += table(['Pattern', 'Outer corners', 'Where parts meet', 'In code'], [
    ['Side by side', 'the role (control for buttons)', 'square', code(`.${p}-join`)],
    ['Stacked', 'the role (container for list items)', 'square', code(`.${p}-join[data-join="block"]`)],
    ['A drawer or sheet attached to the window edge', `${code('shape/surface')} on the side facing the page`, 'square on the side touching the edge', 'logical corners: ' + code('border-start-end-radius') + ', ' + code('border-end-end-radius')],
  ]);
  md += `\n**Logical corners.** Corners are named by the text direction, not by left and right: ${code('border-start-start-radius')} is top-left in English and top-right in Arabic or Hebrew. With physical corners (${code('border-top-left-radius')}, Tailwind ${code('rounded-l-')}), a joined group turns inside out in a right-to-left layout: rounded seams, square ends. ${code(`.${p}-join`)} uses logical corners.\n\n`;
  md += `**The focused part comes forward.** In a group, the next part is painted after the focused one and can cover its ring where they meet. ${code(`.${p}-join`)} lifts the focused part above its neighbours.\n\n`;
  md += '```html\n' + `<div class="${p}-join" role="group" aria-label="View">\n  <button class="btn" aria-pressed="true">List</button>\n  <button class="btn" aria-pressed="false">Board</button>\n  <button class="btn" aria-pressed="false">Calendar</button>\n</div>` + '\n```\n';
  md += rules([['One shape, one role', 'All outer corners of a joined group use the same role. A group of buttons is control on every outer corner.'],
    ['A gap means separate', 'If the parts have a gap between them, they are separate shapes and each keeps all four corners.']]);

  // Focus rings
  md += chapter(RADIUS_CHAPTER.focus);
  md += `Every focusable element shows a ${r('focus.ring.width')}px ring ${r('focus.ring.offset')}px outside it (Border foundation). The ring is part of the shape: it should hug the corners, and nothing should cut it off.\n\n`;
  md += `**Outlines follow the radius.** ${code('tokens.css')} draws the ring as an outline on ${code(':focus-visible')}; browsers draw outlines along ${code('border-radius')}, offset included. Nothing to set.\n\n`;
  md += `**A ring on its own layer needs the -focus radius.** Some designs draw the ring on a pseudo-element or another layer (a ring around a group, a ring inside a custom control). Offset outwards, it needs a larger radius to stay parallel to the shape: the shape's radius plus the offset (R4).\n\n`;
  const rings = contract.tokens.filter((t) => t.of && !t.product);
  mark(rings.map((t) => t.name));
  md += table(['Token', 'For', ...sHead], rings.map((t) => [code(short(t.name)), code(short(t.of)), ...STYLE_NAMES.map((s) => `${t.styles[s].px}px`)]));
  md += `\n**Nothing clips the ring.** The ring reaches ${ring}px outside its element. A rounded container with ${code('overflow: hidden')} — the usual trick to round a card's image or header — cuts the ring of anything within ${ring}px of its edge. Give flush children the nested radius instead (${see(RADIUS_CHAPTER.nested)}), and if something must be clipped, clip that child. A container that scrolls keeps at least ${ring}px of padding around focusable content.\n\n`;
  md += `**Checked in the browser.** The radius audit tabs through a page and samples each focus ring on all four sides, in every style, so a ring that is clipped or covered by a neighbour shows up as a failure with the element that cut it.\n`;
  md += rules([['Outline, not box-shadow', 'Outlines follow the radius and survive forced-colours mode; box-shadow rings disappear there (Border foundation).'],
    ['-focus tokens only for rings', `${code('shape/container-focus')} is not a rounder card.`]]);

  // Corners and content
  md += chapter(RADIUS_CHAPTER.content);
  md += `Text's contrast is measured against the fill behind it. A rounded corner removes fill: if text reaches into the corner, its edge sits on whatever is behind the shape instead. The build checks that the corner of every label's and content box sits inside its rounded shape, for every role in every style and density (R3):\n\n`;
  const r3 = checks.get('R3').items.filter((i) => i.style === style && i.density === cfg.density.default);
  md += table(['Case (' + style + ', ' + cfg.density.default + ')', 'Radius and the text box\'s corner', 'Inside'], r3.map((i) => { const [what, rest] = i.item.replace(/^[a-z]+ · [a-z]+ · /, '').split(': '); return [what, rest, i.ok ? '✓' : '✕']; }));
  md += `\nThe tightest case is the badge: a pill's round ends come closest to its label. The badge's padding (${code('space/inset/xs')} above and below, ${code('space/inset/sm')} at the sides) is what keeps the label clear in compact density.\n\n`;
  const pill = contract.mistakes.find((m) => m.mistake.startsWith('A pill-shaped button'));
  md += `**Pills and wrapping text.** ${pill.mistake}: ${pill.measured}. Round ends are for labels that stay on one line; a button that can wrap uses ${code('shape/control')}. The radius audit renders pages at 200% text and flags any text that crosses its shape's edge.\n\n`;
  md += `**Radius and size.** A radius of ${PILL_FROM * 100}% of the short side or more draws round ends, and CSS draws anything larger the same — so ${code('radius/full')} is a pill on anything. Below that, the same radius looks rounder on a smaller shape: ${at('shape.control', 'round')}px is a soft corner on a ${r('size.control.height', { Density: 'comfortable' })}px button and half a circle on a ${MARK_SIZE}px checkbox. That is why marks and controls have their own roles.\n`;
  md += rules([['Padding before radius', 'If text needs to go closer to the edge, the radius gets smaller (a nested radius or a smaller role) — the text doesn\'t move into the corner.'],
    ['Icons count as content', 'An icon in a pill or round button stays inside the shape like text does.']]);

  // Choosing a shape
  md += chapter('Choosing a shape');
  md += `Four questions get you to the right corners: *what is it?*, *is it inside something rounded?*, *does it touch another part?* and *how is its focus ring drawn?*\n`;
  for (const d of contract.decisions) {
    md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [tags(w), slash(s).replace(/((shape|space|focus)\/[a-z0-9/<>*-]+[a-z0-9>*])|radius\.(style|roles)|data-radius|data-join="block"|\.ds-join|overflow: hidden|max\(0px, var\([^)]*\) - var\([^)]*\)\)/g, (m) => code(m.replace(/\.ds-/, `.${p}-`)))]));
  }
  md += `\n**Worked example — a settings card with a header image and a plan picker.** One question at a time:\n\n`;
  const cont = at('shape.container', style), xs = r('space.inset.xs', D);
  md += table(['Part', 'Role or rule', 'Value here', 'Why'], [
    ['The card', code('shape/container'), `${cont}px`, 'Holds content in the page.'],
    ['The header image, flush with the top', 'flush child', `${cont}px on the top corners, square below`, 'Shares the card\'s top corners; no overflow: hidden.'],
    ['The plan picker (three options side by side)', `${code(`.${p}-join`)} + ${code('shape/control')}`, `${at('shape.control', style)}px outside, square seams`, 'One control in three parts.'],
    ['A highlighted panel inset by ' + code('space/inset/xs'), 'nested', `${nestedRadius(cont, xs)}px (${cont} − ${xs})`, 'Its corners sit in the card\'s corners.'],
    ['The "Pro" badge', code('shape/pill'), 'round ends', 'A one-word label that never wraps.'],
    ['The "I agree" checkbox', code('shape/mark'), `${at('shape.mark', style)}px`, 'A mark — square, so it never reads as a radio.'],
  ]);
  md += `\n**Do and avoid** (measured in this build)\n\n`;
  md += table(['Avoid', 'Measured', 'Do'], contract.mistakes.map((m) => [tags(slash(m.mistake)), tags(slash(m.measured)), `${fixCode(slash(m.fix).replace(/\.ds-/, `.${p}-`))} — ${tags(slash(m.fixValue))}`]));

  // Readers' settings and products
  md += chapter('Readers\' settings and products');
  md += `People enlarge text, switch to forced colours and read right to left; products add shapes of their own. Corners are built so none of that breaks.\n\n`;
  md += `**Bigger text (WCAG 1.4.4).** Radii are px: when text doubles, shapes grow around it and corners stay the same size, so more of each shape is straight edge. Pills are the exception — their ends grow with their height, which is why their labels must not wrap.\n\n`;
  md += `**Density.** Radii don't change with density; padding does. Nested radii follow automatically, because they are written as parent − padding on the tokens: inside ${an(cont)} ${cont}px container with ${code('space/inset/xs')}, ${DENSITIES.map((d) => `${d} ${nestedRadius(cont, r('space.inset.xs', { Density: d }))}px`).join(', ')}.\n\n`;
  md += `**Forced colours and high contrast.** Windows' contrast themes keep borders and outlines and drop backgrounds and box-shadows. Corners survive; rings drawn as outlines survive. A shape that is visible only by its fill disappears — the Border foundation gives every control an outline.\n\n`;
  md += `**Right to left.** Joined groups, drawers and sheets use logical corners, so they flip with the text direction (${see(RADIUS_CHAPTER.joined)}).\n\n`;
  md += `**What the config changes**\n\n`;
  md += table(['Follows the config', 'Fixed on purpose'], [
    [`The style (${code('radius.style')}, now ${style}: ${STYLE_NAMES.join(', ')})`, 'The scale and the six roles'],
    [`Roles added for this product (${code('radius.roles')})`, 'The nested rule, the ring radii and the limits — computed and checked'],
  ]);
  if (product.length) {
    mark(product.map((x) => x.name));
    md += `\n**Roles added for this product** — defined in the engine config and checked like the built-in ones\n\n` + table(['Token', 'Use it for', ...sHead], product.map((x) => [code(short(x.name)), tags(x.use), ...STYLE_NAMES.map((s) => px(x.styles[s]))]));
    const pr = contract.tokens.filter((t) => t.of && t.product);
    if (pr.length) { mark(pr.map((t) => t.name)); md += `\nTheir focus-ring radii: ${pr.map((t) => `${code(short(t.name))} (${STYLE_NAMES.map((s) => `${t.styles[s].px}px`).join(' / ')})`).join(', ')}.\n`; }
  }
  md += `\n**Adding a role.** First check ${see('Choosing a shape')} — most shapes are one of the six. If a product needs another (a thumbnail, a map marker), name it by its job and give a key on the scale for each style; the build refuses names by look or size ("rounded", "lg"), keys off the scale, radii that shrink from sharp to round, and ${code('full')} (that is ${code('shape/pill')}). A role that passes appears in Figma, CSS, Tailwind, this guide and the AI contract at once, with its focus-ring radius computed:\n\n`;
  md += '```json\n' + JSON.stringify({ radius: { style, roles: [{ name: 'shape.thumbnail', sharp: '1', default: '3', round: '4', description: 'Image previews in lists and pickers' }] } }, null, 2) + '\n```\n';

  // Reference
  md += `\n---\n\n## Accessibility reference\n\nWhat the build checks for radius, and the result for this build:\n\n`;
  md += table(['Check', 'What it checks', 'WCAG', 'Result'], report.checks.filter((c) => c.foundation === 'Radius' || c.id === 'F2').map((c) => [c.id, c.title, `${c.wcag} (${c.level})`, `${c.status} · ${c.summary}`]));
  md += `\nWhat the checkers look for in your own code and pages: the radius checker (${code('npm run lint:radius')}) reads CSS, HTML and JSX; the radius audit (${code('npm run audit:radius')}) renders a page in every style, at 1280 and 320px and at 200% text, then checks radii that ignore the style, nested corners, text outside its shape, joined groups in both text directions and every focus ring on all four sides. See the [handoff](HANDOFF.md).\n\n`;
  md += `**Glossary**\n\n`;
  md += table(['Term', 'Meaning'], [['Radius', 'How far a corner\'s curve reaches along each edge.'], ['Role', 'A radius named by what a shape is (control, container …); it changes with the style.'], ['Style', 'The product\'s feel — sharp, default or round — chosen once in the config; a mode of the Shape collection.'],
    ['Nested radius', 'The radius of a shape inside another: the outer radius minus the padding between them.'], ['Flush', 'Touching the parent\'s edge, with no padding.'], ['Joined', 'Parts that touch and read as one shape; only the outer corners are rounded.'],
    ['Logical corner', 'A corner named by text direction (start, end) instead of left and right.'], ['Round ends', 'What a radius of half the short side or more draws: a pill or a circle.'], ['Mode', 'A set of values for every variable in a collection; switching it on a frame or element changes them all.']]);

  // Every built-in token documented exactly once.
  const all = contract.tokens.filter((t) => !t.product).map((t) => t.name);
  const missing = all.filter((n) => !documented.includes(n));
  const dupes = documented.filter((n, i) => documented.indexOf(n) !== i);
  if (missing.length || dupes.length) throw new Error(`guide: radius tokens missing ${missing.join(', ')} / duplicated ${dupes.join(', ')}`);
  return md;
}
