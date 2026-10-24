// Radius AI content: a machine-readable contract (JSON) and a rulebook (Markdown) for AI tools and the radius checker.
// Both are generated from the engine, so they always match the shipped tokens.
import { cssName } from './css.js';
import { DENSITIES } from '../foundations/spacing.js';
import { RADIUS, RADIUS_KEYS, STYLE_NAMES, ROLE_ORDER, SHAPE_ROLES, MARK_SIZE, CORNER_SHARE, PILL_FROM, FOCUS, nestedRadius, insideCorner, validateRadiusConfig } from '../foundations/shape.js';

export const RADIUS_CHAPTER = {
  built: 'How tokens are built', roles: 'Roles by job', styles: 'Radius styles', nested: 'Nested corners', joined: 'Joined corners',
  focus: 'Focus rings', content: 'Corners and content',
};
export const chapterOfRadiusToken = (path) => (path.startsWith('radius.') ? RADIUS_CHAPTER.built : path.endsWith('-focus') ? RADIUS_CHAPTER.focus : RADIUS_CHAPTER.roles);

/** Gap between a parent's rounded corner and a child's, measured along the diagonal (equal padding p on both sides). */
export const cornerGap = (outer, padding, inner) => +((padding + inner) * Math.SQRT2 - inner - outer * (Math.SQRT2 - 1)).toFixed(1);
/** How far the outermost point of a child's corner sits outside a parent's rounded corner (negative: inside). */
export const pokesOut = (outer, padding, inner) => +(-cornerGap(outer, padding, inner)).toFixed(1);
/** Distance of a point (dx, dy) in from a corner to the rounded edge: positive inside, negative outside. */
export const insideBy = (r, dx, dy) => (dx >= r || dy >= r ? Math.min(dx, dy) : +(r - Math.hypot(r - dx, r - dy)).toFixed(1));

export const RADIUS_CLASSES = [
  ['join', 'Joined parts side by side (a button group, a segmented control, an input with its button): outer corners keep their role\'s radius, the edges where parts meet are square; logical corners, so it flips in right-to-left; a focused part is lifted above its neighbours', '— (use the class: it also lifts the focused part)'],
  ['join[data-join="block"]', 'The same, stacked: list items or accordion panels that touch', '—'],
];

export const RADIUS_DECISIONS = [
  { what: 'Which role', question: 'What is it?', answers: [
    ['A checkbox, a colour swatch, a keyboard key, inline code — a mark about the size of a line of text', 'shape.mark'],
    ['Something people press, type in or pick from: a button, an input, a select, a tab, a menu item, a chip', 'shape.control'],
    ['Something that holds content in the page or floats just above it: a card, a panel, a table frame, a menu, a popover, a tooltip, a toast', 'shape.container'],
    ['The largest shape, on top of everything: a dialog, a sheet, a drawer', 'shape.surface (a drawer or sheet attached to an edge: only the side facing the page)'],
    ['A badge, a counter, a toggle track, an avatar, a status dot — a label that never wraps', 'shape.pill'],
    ['A table and its cells, a full-bleed image or band, a divider', 'shape.none'],
    ['A button with a long or translated label, styled as a pill', 'shape.control — a pill whose label wraps cuts its text at the round ends']] },
  { what: 'Inside something rounded', question: 'How far is it from the parent\'s edge?', answers: [
    ['Inset by padding p smaller than the parent\'s radius (its corners sit in the parent\'s curve)', 'max(0px, parent − p): max(0px, var(--ds-shape-container) - var(--ds-space-inset-sm)) — follows density and style'],
    ['Inset by padding at least the parent\'s radius (a card in a padded section, tiles in a grid)', 'its own role — its corners are clear of the parent\'s curve'],
    ['Flush with the edge (a header, an image, a table at the top of a card)', 'the parent\'s radius on the corners it shares (p = 0), square elsewhere — not overflow: hidden on the parent'],
    ['A button, a badge or anything that doesn\'t fill the parent, even near a corner', 'its own role — the nested rule is for shapes that fill their parent']] },
  { what: 'Touching another part', question: 'Do the parts read as one shape?', answers: [
    ['Yes: a button group, a segmented control, an input with its button, stacked list items', '.ds-join (or data-join="block"): outer corners keep the role, shared edges square'],
    ['A drawer or sheet attached to the window edge', 'shape.surface on the corners facing the page only (logical corners: border-start-end-radius …)'],
    ['No: separate things side by side', 'each keeps its own role and a gap (Spacing)']] },
  { what: 'Focus', question: 'How is the ring drawn?', answers: [
    ['With outline (tokens.css does it on :focus-visible)', 'nothing to set: an outline follows the radius'],
    ['On a pseudo-element or another layer', 'shape.<role>-focus for the ring\'s radius'],
    ['Inside a container that scrolls or clips', 'padding ≥ focus.ring.offset + focus.ring.width between the container\'s edge and anything focusable, or an inset ring']] },
  { what: 'A different feel', question: 'What should change?', answers: [
    ['The whole product: sharper or rounder', 'radius.style in the engine config (sharp, default, round)'],
    ['One region, a preview or a theme picker', 'data-radius on that element (sharp, default or round)'],
    ['A shape the roles don\'t cover (a thumbnail, a map pin)', 'radius.roles in the engine config — a role named by job with a key per style']] },
];

export const RADIUS_RULES = [
  ['RR-01', 'Corners come from a shape role: border-radius is var(--ds-shape-*) (Tailwind rounded-none, -mark, -control, -container, -surface, -pill). No px, rem, em or % values; 0 only for the edges where joined parts meet.', 'A hard-coded radius doesn\'t follow the product\'s style: in sharp it stays round, in round it looks pinched, and nested radii computed from the role no longer match it.', '—'],
  ['RR-02', 'Never use radius primitives (--ds-radius-*) in components. Pick the role by job.', 'Primitives don\'t change with the style; a role does.', '—'],
  ['RR-03', 'In Tailwind use only the ds rounded utilities (rounded-none, -mark, -control, -container, -surface, -pill and their side and corner forms). Tailwind\'s own rounded, rounded-xs … rounded-4xl are removed in tailwind.theme.css; rounded-full is not a ds role (use rounded-pill).', 'Tailwind\'s scale is a second set of radii that no check covers.', '—'],
  ['RR-04', 'Pick the role by what the thing is, not by its size: marks (checkboxes, swatches) → shape.mark; things people press or type in → shape.control; content holders and menus → shape.container; dialogs, sheets, drawers → shape.surface; labels that never wrap → shape.pill. A checkbox never takes the control radius; a button that can wrap never takes the pill.', 'A checkbox with a round radius reads as a radio button; a pill whose label wraps at 200% text puts the first and last letters outside the shape, off the fill their contrast was measured on.', '1.4.3'],
  ['RR-05', 'Nested corners: a shape that fills a rounded parent (edge to edge inside its padding: a panel, a header, a menu item, a segment) with padding p smaller than the parent\'s radius takes max(0px, parent − p), written with the tokens: max(0px, var(--ds-shape-container) - var(--ds-space-inset-sm)), so it follows density and style. A flush child (p = 0) takes the parent\'s radius on the corners it shares. Never copy the parent\'s radius, never "one step smaller". With padding of at least the parent\'s radius the child is clear of the curve and keeps its own role.', 'Only parent − padding keeps the gap even all the way round the corner; a copied radius bulges at the corner (always 41% wider than the sides), and a square flush child pokes out of the rounded corner.', '—'],
  ['RR-06', 'Joined parts keep their outer corners and square the edges where they meet: use .ds-join, or logical corner properties (border-start-start-radius …; Tailwind rounded-s-, -e-, -ss-, -se-, -es-, -ee-). Never physical corners (border-top-left-radius, rounded-l-, rounded-tl-): they don\'t flip in right-to-left layouts.', 'In right-to-left the first part is on the right: with physical corners the seams come out rounded and the outer corners square.', '—'],
  ['RR-07', 'Focus rings are outlines (tokens.css draws them on :focus-visible), which follow the element\'s radius. A ring drawn on a pseudo-element or another layer takes --ds-shape-<role>-focus. The -focus tokens are for rings only.', 'A ring with the element\'s own radius, offset outwards, has corners tighter than the shape — the gap pinches at every corner.', '2.4.13'],
  ['RR-08', 'Don\'t round a container\'s content by clipping it: no overflow: hidden or clip on a rounded container that holds anything focusable. Give the flush child the container\'s radius instead (RR-05); clip an image itself, not its card. A container that scrolls keeps padding ≥ focus.ring.offset + focus.ring.width around focusable content.', 'Clipping cuts off the focus ring of anything within the ring\'s reach of the edge — the ring sits outside the element.', '2.4.7, 2.4.13'],
  ['RR-09', 'Radius never changes with state: no border-radius change on hover, focus, active, checked, selected or open. Show state with colour, the focus ring and text.', 'A shape that changes with state is a cue only some people notice, and it moves the focus ring and the nested corners with it.', '—'],
  ['RR-10', 'Never redefine shape or radius variables in app code (--ds-shape-*, --ds-radius-*). Change radius.style or radius.roles in the engine config and build; switch one region with data-radius.', 'An overridden radius skips the checks that keep roles in order, text inside the corners and rings hugging the shape.', '—'],
];

const code = (s) => `\`${s}\``;
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m));
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
const fmt = (v) => (v >= 9999 ? 'full' : `${v}`);

/** Measured mistakes: what goes wrong, with the numbers from this build, and the token that fixes it. */
function mistakes(sys, cfg) {
  const r = (p, ctx) => sys.resolve(p, ctx);
  const style = cfg.radius.style, D = { Density: cfg.density.default };
  const round = (j) => r(`shape.${j}`, { Shape: 'round' });
  const outer = round('container'), pad = r('space.inset.sm', D);
  const own = r(`shape.container`, { Shape: style });
  const ring = r('focus.ring.offset') + r('focus.ring.width');
  // A pill-shaped button whose label wraps to two lines at 200% text: the label's corner vs the round ends.
  const lab = r('type.label.md', { Responsive: 'sm' }), padX = r('space.inset.md', D), padY = r('space.inset.xs', D);
  const h2 = 2 * (2 * lab.lineHeight) + 2 * padY, R2 = h2 / 2, out2 = -insideBy(R2, padX, padY + (2 * lab.lineHeight - 2 * lab.fontSize) / 2);
  return [
    { mistake: `An inner radius copied from its parent (a ${outer}px card, ${pad}px padding, the child also ${outer}px)`, measured: `the gap is ${pad}px along the sides and ${cornerGap(outer, pad, outer)}px at the corner — the inner shape bulges away from the corner`, fix: 'max(0px, var(--ds-shape-container) - var(--ds-space-inset-sm))', fixValue: `${nestedRadius(outer, pad)}px in round, ${nestedRadius(own, pad)}px in ${style} — an even ${pad}px all the way round` },
    { mistake: `"One step smaller" for the inner radius (${outer}px → ${round('control')}px with ${pad}px padding)`, measured: `${cornerGap(outer, pad, round('control'))}px at the corner against ${pad}px along the sides; the right answer changes with the padding, which "one step" ignores`, fix: 'parent − padding', fixValue: `${nestedRadius(outer, pad)}px, and it follows density: ${DENSITIES.map((d) => `${d} ${nestedRadius(outer, r('space.inset.sm', { Density: d }))}px`).join(', ')}` },
    { mistake: `A square header flush with the top of a ${outer}px card`, measured: `its corners poke ${pokesOut(outer, 0, 0)}px out past the card's rounded corner`, fix: 'the card\'s radius on the header\'s top corners', fixValue: 'border-start-start-radius and border-start-end-radius: var(--ds-shape-container) — nothing pokes out, nothing is clipped' },
    { mistake: 'overflow: hidden on the card to hide those corners', measured: `the focus ring sits ${r('focus.ring.offset')}–${ring}px outside an element, so anything within ${ring}px of the card's edge loses its ring on that side`, fix: 'nested radius on the flush child', fixValue: 'no clipping: the ring shows on all four sides (the radius audit samples them)' },
    { mistake: `The control radius on a checkbox (round style: ${round('control')}px on a ${MARK_SIZE}px box)`, measured: `${round('control')}px is half of ${MARK_SIZE}px: the checkbox is a circle and reads as a radio button`, fix: 'shape.mark', fixValue: `${round('mark')}px in round (≤ ${MARK_SIZE * CORNER_SHARE}px in every style): a square with soft corners` },
    { mistake: 'A pill-shaped button whose label wraps (200% text on a phone)', measured: `two lines make it ${h2}px tall, so its ends are ${R2}px round; the label's first and last letters sit ${out2}px outside the shape, off the fill their contrast was measured on`, fix: 'shape.control', fixValue: `${r('shape.control', { Shape: style })}px: the button grows, the corners stay corners` },
    { mistake: 'border-top-left-radius: 0 on the second button of a group', measured: 'in a right-to-left layout the second button is on the left: its seam is rounded and its outer corner square', fix: '.ds-join', fixValue: 'logical corners (border-start-start-radius …): the join flips with the text direction' },
    { mistake: 'border-radius: 6px on a button', measured: `doesn't follow the style: in sharp it stays 6px — rounder than sharp's containers (${r('shape.container', { Shape: 'sharp' })}px) — and nested radii computed from shape.control no longer match`, fix: 'shape.control', fixValue: `${STYLE_NAMES.map((s) => `${s} ${r('shape.control', { Shape: s })}px`).join(', ')}` },
  ];
}

export function radiusContract(sys, cfg, report) {
  const p = cfg.prefix;
  const r = (path, ctx) => sys.resolve(path, ctx);
  const { style } = validateRadiusConfig(cfg);
  const roles = sys.byPrefix('shape.').filter((t) => t.meta.role);
  const rings = sys.byPrefix('shape.').filter((t) => t.meta.focusOf);
  const per = (t) => Object.fromEntries(STYLE_NAMES.map((s) => [s, { px: r(t.path, { Shape: s }), primitive: typeof t.values[s] === 'string' ? t.values[s].slice(1, -1) : null }]));
  const tokens = [
    ...RADIUS_KEYS.map((k) => ({ name: `radius.${k}`, figma: `radius/${k}`, cssVar: cssName(p, `radius.${k}`), tailwind: [], use: k === 'full' ? 'Round ends' : 'Primitive: feeds the roles; never used directly', collection: 'Primitives', chapter: RADIUS_CHAPTER.built, px: RADIUS[k], product: false })),
    ...roles.map((t) => ({ name: t.path, figma: t.path.replace(/\./g, '/'), cssVar: cssName(p, t.path), tailwind: [`rounded-${t.meta.role}`], use: t.description, collection: 'Shape', chapter: RADIUS_CHAPTER.roles, varies: 'style', styles: per(t), focus: sys.tokens.has(`${t.path}-focus`) ? `${t.path}-focus` : null, product: !!t.meta.product })),
    ...rings.map((t) => ({ name: t.path, figma: t.path.replace(/\./g, '/'), cssVar: cssName(p, t.path), tailwind: [], use: t.description, collection: 'Shape', chapter: RADIUS_CHAPTER.focus, varies: 'style', styles: per(t), of: `shape.${t.meta.focusOf}`, product: !!t.meta.product })),
  ];
  const insets = ['xs', 'sm', 'md', 'lg', 'xl'];
  const nested = ['container', 'surface'].map((j) => ({
    outer: `shape.${j}`,
    rows: [{ inset: 'flush (0)', token: null }, ...insets.map((s) => ({ inset: `space.inset.${s}`, token: `space.inset.${s}` }))].map((x) => ({
      inset: x.inset,
      css: x.token ? `max(0px, var(${cssName(p, `shape.${j}`)}) - var(${cssName(p, x.token)}))` : `var(${cssName(p, `shape.${j}`)})`,
      values: Object.fromEntries(STYLE_NAMES.map((s) => [s, Object.fromEntries(DENSITIES.map((d) => [d, nestedRadius(r(`shape.${j}`, { Shape: s }), x.token ? r(x.token, { Density: d }) : 0)]))])),
      // Padding ≥ the parent's radius: the child's corners are clear of the curve, so it keeps its own role.
      clear: Object.fromEntries(STYLE_NAMES.map((s) => [s, Object.fromEntries(DENSITIES.map((d) => [d, !!x.token && r(x.token, { Density: d }) >= r(`shape.${j}`, { Shape: s })]))])),
    })),
  }));
  return {
    $schema: 'ds-radius-contract/1', system: sys.name, prefix: p, standard: 'WCAG 2.2 AA',
    defaultStyle: style, styles: STYLE_NAMES,
    modeSwitching: {
      css: `The product's style (${style}) is on :root. data-radius="sharp|default|round" on <html> or any element switches the roles inside it.`,
      figma: `Set the Shape mode (${STYLE_NAMES.join(', ')}) on a frame; frames on Auto follow ${style}.`,
    },
    scale: RADIUS_KEYS.map((k) => ({ token: `radius.${k}`, px: RADIUS[k] })),
    roles: roles.map((t) => ({ name: t.path, job: t.meta.role, use: t.description, tailwind: `rounded-${t.meta.role}`, cssVar: cssName(p, t.path), styles: Object.fromEntries(STYLE_NAMES.map((s) => [s, r(t.path, { Shape: s })])), focus: sys.tokens.has(`${t.path}-focus`) ? `${t.path}-focus` : null, product: !!t.meta.product })),
    nested: {
      formula: 'inner radius = max(0, parent radius − padding), for a shape that fills its parent edge to edge inside the padding (a panel, a header, a menu item, a segment) when the padding is smaller than the parent\'s radius; a flush child (padding 0) takes the parent\'s radius on the corners it shares; with padding of at least the parent\'s radius the child is clear of the curve and keeps its own role',
      css: `border-radius: max(0px, var(${cssName(p, 'shape.container')}) - var(${cssName(p, 'space.inset.sm')}));`,
      tailwind: `rounded-[max(0px,var(--radius-container)-var(--spacing-inset-sm))]`,
      table: nested,
    },
    join: { class: `${p}-join`, markup: `<div class="${p}-join" role="group" aria-label="…"> <button>…</button> <button>…</button> </div> (data-join="block" for stacked parts)`, corners: 'border-start-start-radius, border-start-end-radius, border-end-start-radius, border-end-end-radius (Tailwind rounded-ss-, -se-, -es-, -ee-, rounded-s-, -e-)' },
    focus: { width: r('focus.ring.width'), offset: r('focus.ring.offset'), drawnWith: 'outline on :focus-visible (tokens.css) — it follows border-radius', ownLayer: 'shape.<role>-focus' },
    classes: RADIUS_CLASSES.map(([name, use, tailwind]) => ({ class: `${p}-${name}`, use, tailwind })),
    limits: { markSize: MARK_SIZE, cornerShare: CORNER_SHARE, pillFrom: PILL_FROM, ringReach: r('focus.ring.offset') + r('focus.ring.width'), smallestControl: Math.min(...DENSITIES.map((d) => r('size.control.height', { Density: d }))) },
    build: { ok: report.ok, tokens: tokens.length, checks: report.checks.filter((c) => c.foundation === 'Radius').map((c) => ({ id: c.id, title: c.title, status: c.status, summary: c.summary })) },
    rules: RADIUS_RULES.map(([id, rule, why, wcag]) => ({ id, rule, why, wcag })),
    decisions: RADIUS_DECISIONS,
    tokens,
    mistakes: mistakes(sys, cfg),
  };
}

export function radiusRulesMd(c) {
  const P = (s) => s.replace(/--ds-/g, `--${c.prefix}-`).replace(/\.ds-/g, `.${c.prefix}-`);
  let md = `# Radius rules for AI tools — ${c.system}\n\n`;
  md += `Generated from the engine (${c.build.tokens} tokens; roles checked in all ${c.styles.length} styles and every density; ${c.build.ok ? 'all checks pass' : 'SOME CHECKS FAIL'}). The same data in machine-readable form: ${code('radius.contract.json')}.\n\n`;
  md += `## How to use this file\n1. Pick each shape's role with the **Decision guide**, using token and class names exactly as written.\n2. Use the token itself — never copy its number into your own CSS. Nested radii are expressions on the tokens, never numbers.\n3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.\n4. Before answering, run the **Self-check**.\n\n`;
  md += `## Hard rules\n` + table(['ID', 'Rule', 'Why', 'WCAG'], c.rules.map((x) => [x.id, P(tags(x.rule)), tags(x.why), x.wcag]));
  md += `\n## Decision guide\n`;
  const f = (s) => P(s).replace(/(shape\.[a-z<>-]+[a-z>]|radius\.(style|roles)|space\.inset\.[a-z]+|focus\.ring\.[a-z]+|max\(0px, var\([^)]*\) - var\([^)]*\)\)|data-radius|data-join="block"|\.[a-z]+-join|overflow: hidden|border-start-end-radius)/g, (m) => code(m));
  for (const d of c.decisions) md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [tags(w), f(s)]));
  md += `\n## Roles\nThe product's style is **${c.defaultStyle}** (on ${code(':root')}). In code use the CSS variable or the Tailwind utility; in Figma the variable of the same name.\n\n`;
  md += table(['Role', 'CSS variable', 'Tailwind', ...c.styles.map((s) => (s === c.defaultStyle ? `${s} (this product)` : s)), 'Use'], c.roles.map((x) => [code(x.name), code(x.cssVar), code(x.tailwind), ...c.styles.map((s) => `${fmt(x.styles[s])}${x.styles[s] >= 9999 ? '' : 'px'}`), tags(x.use) + (x.product ? ' (added for this product)' : '')]));
  md += `\n**Switching style.** ${c.modeSwitching.css}\n`;
  md += `\n## Nested corners\n${c.nested.formula}.\n\n- CSS: ${code(c.nested.css)}\n- Tailwind: ${code(c.nested.tailwind)}\n\nComputed for the product's style (${c.defaultStyle}), per density:\n\n`;
  for (const n of c.nested.table) md += `\n**Inside ${code(n.outer)}**\n\n` + table(['Padding', ...DENSITIES, 'CSS'], n.rows.map((x) => [x.inset.startsWith('space') ? code(x.inset) : x.inset, ...DENSITIES.map((d) => (x.clear[c.defaultStyle][d] ? 'own role (clear)' : `${x.values[c.defaultStyle][d]}px`)), code(x.css)]));
  md += `\n"own role (clear)": the padding is at least the parent's radius, so the child's corners are clear of the curve.\n`;
  md += `\n## Joined parts and focus rings\n- ${code(`.${c.join.class}`)}: ${P(RADIUS_CLASSES[0][1])}. Markup: ${code(c.join.markup)}.\n- Corners by side are logical: ${c.join.corners}.\n- Focus: a ${c.focus.width}px ring, ${c.focus.offset}px outside the element, drawn as an outline (it follows the radius). A ring on its own layer: ${code('shape.<role>-focus')}.\n\n`;
  md += table(['Ring token', 'CSS variable', ...c.styles, 'For'], c.tokens.filter((t) => t.of).map((t) => [code(t.name), code(t.cssVar), ...c.styles.map((s) => `${t.styles[s].px}px`), code(t.of)]));
  md += `\n## Limits the build enforces\n` + table(['Limit', 'Value'], [
    ['Order', 'none < mark ≤ control ≤ container ≤ surface < pill in every style; each style rounder than the one before'],
    ['Corners stay corners', `a mark ≤ ${c.limits.cornerShare * 100}% of a ${c.limits.markSize}px checkbox (never a circle); a control ≤ ${c.limits.cornerShare * 100}% of the smallest control (${c.limits.smallestControl}px)`],
    ['Round ends', `a radius ≥ ${c.limits.pillFrom * 100}% of the short side makes round ends; anything larger draws the same`],
    ['Text inside the corners', 'the corner of every label\'s and content box sits inside its rounded shape, in every style and density'],
    ['Focus rings', `a ring reaches ${c.limits.ringReach}px outside its element: nothing clips it, and a ring on its own layer takes shape + ${c.focus.offset}px`],
  ]);
  md += `\n## Common mistakes (measured)\n` + table(['Mistake', 'Measured', 'Use instead'], c.mistakes.map((m) => [tags(m.mistake), tags(m.measured), `${code(P(m.fix))} — ${tags(m.fixValue)}`]));
  md += `\n## Self-check before answering\n- [ ] Every ${code('border-radius')} is a ${code(`var(--${c.prefix}-shape-*)`)} role or a nested expression on one (Tailwind ${code('rounded-<role>')}); no px, rem or %; no ${code(`--${c.prefix}-radius-*`)}.\n- [ ] Each role matches what the thing is (checkbox → mark, button → control, card or menu → container, dialog → surface, a label that never wraps → pill).\n- [ ] Every shape that fills a rounded parent (padding smaller than the parent's radius) uses ${code('max(0px, parent − padding)')}; flush children take the parent's radius on the shared corners.\n- [ ] Joined parts use ${code(`.${c.join.class}`)} or logical corners — no ${code('border-top-left-radius')}, ${code('rounded-l-')} or ${code('rounded-tl-')}.\n- [ ] No ${code('overflow: hidden')} on a rounded container that holds focusable content.\n- [ ] Focus rings are outlines; a ring on its own layer uses ${code('shape.<role>-focus')}.\n- [ ] No radius changes on hover, focus, active or selected.\n- [ ] No shape or radius variables redefined.\n`;
  return md;
}
