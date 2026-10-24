// Elevation AI content: a machine-readable contract (JSON) and a rulebook (Markdown) for AI tools and the elevation checker.
// Both are generated from the engine, so they always match the shipped tokens.
import { cssName } from './css.js';
import { ELEVATION_JOB_ORDER, ELEVATION_JOBS, LAYER_ORDER, LAYER_STEP, EDGE_MIN, SURFACE_STEP_MIN, shadowEdgeAlpha, validateElevationConfig } from '../foundations/elevation.js';
import { contrast, composite } from '../color-math.js';

export const ELEVATION_CHAPTER = {
  built: 'How tokens are built', levels: 'Levels by job', shadows: 'Shadows', dark: 'Height in Dark', edges: 'Edges',
  stacking: 'The stacking order', modal: 'Dialogs and the scrim', moving: 'Lifting and dragging',
};
export const chapterOfElevationToken = (path) => (path.startsWith('layer.') ? ELEVATION_CHAPTER.stacking
  : path.endsWith('.shadow') ? ELEVATION_CHAPTER.shadows : path.endsWith('.border') ? ELEVATION_CHAPTER.edges
    : path.endsWith('.scrim') ? ELEVATION_CHAPTER.modal : ELEVATION_CHAPTER.levels);

export const ELEVATION_DECISIONS = [
  { what: 'Does it need height at all', question: 'What should set it apart?', answers: [
    ['Things that belong together, with room around them', 'space (Spacing: a bigger stack or inline gap) — no level'],
    ['A region of the page (a sidebar, a band, a well)', 'a surface change (color.bg.surface-sunken) or a border.width.line edge — no shadow'],
    ['Many cards side by side (a dashboard, a grid of results)', 'elevation.raised, or only a border.width.line outline: a page of shadows is noise'],
    ['Something that sits over other content', 'a level from the next table — the higher it sits, the more it interrupts']] },
  { what: 'Which level', question: 'Where does it sit, and what does it do to the page?', answers: [
    ['It is the page, or lies flat in it', 'elevation.page — the page surface, no shadow'],
    ['It groups content in the flow of the page (a card, a panel, a table frame)', 'elevation.raised (.ds-raised)'],
    ['It stays while content scrolls under it (the page header, a toolbar, a sticky table header)', 'elevation.sticky (.ds-sticky; data-stick="end" for a bar along the bottom)'],
    ['It opens over content and the page stays usable (a menu, popover, tooltip, toast, date picker, the navigation drawer)', 'elevation.floating (.ds-floating), opened as a popover so it sits in the top layer'],
    ['It must be answered or closed before the page can be used (a dialog, a sheet, a modal drawer)', 'elevation.modal (.ds-modal) on a <dialog> opened with showModal(): the scrim, the edge and the layer come with it'],
    ['It is being dragged', 'elevation.dragging (.ds-dragging) while it is held; back to its own level when dropped']] },
  { what: 'Stacking', question: 'What has to be on top?', answers: [
    ['A menu opened from the sticky header', 'nothing to do: layer.floating is above layer.sticky'],
    ['A menu, select or tooltip inside a dialog', 'open it as a popover (top layer: it goes above the dialog) — or keep it inside the dialog\'s own box; never a bigger z-index'],
    ['A menu inside a card or table that clips (overflow: hidden or auto)', 'a popover: the top layer is never clipped by a parent; a z-index can\'t escape overflow'],
    ['A toast while a dialog is open', 'layer.toast (.ds-floating data-layer="toast"), opened as popover="manual" after the dialog; it must not need an action, because the page outside the dialog is inert'],
    ['Something the system doesn\'t have a place for (a banner over sticky bars, a help panel)', 'a product layer in the config (elevation.layers, "above": the layer below it) — the number is computed']] },
  { what: 'Moving', question: 'Does it change while someone uses it?', answers: [
    ['Hover on something clickable (a card that is a link)', 'color.bg.surface-hover or a border colour — a bigger shadow may come with it, never alone'],
    ['Press', 'back to its resting level (never higher): it moves toward the page'],
    ['Keyboard focus', 'the focus ring (tokens.css draws it) — never a shadow'],
    ['Drag', 'elevation.dragging while held, plus a keyboard way to move it (buttons or arrow keys); back to its level on drop']] },
];

export const ELEVATION_RULES = [
  ['ER-01', 'Shadows come from a level: box-shadow is var(--ds-elevation-<job>-shadow) or none (Tailwind shadow-raised, shadow-sticky, shadow-floating, shadow-modal, shadow-dragging). No shadow written by hand, none of Tailwind\'s own (shadow-sm … shadow-2xl, drop-shadow-*), no filter: drop-shadow() on a surface.', 'A hand-made shadow belongs to no level: it doesn\'t grow with height, doesn\'t switch for Dark, and nobody can tell what sits on what.', '—'],
  ['ER-02', 'Never use the shadow colours or alpha primitives in a shadow (--ds-color-shadow-*, --ds-color-black-alpha-*). Pick the level.', 'They are the strengths the levels pick from; a shadow made from them by hand skips the order the build checks.', '—'],
  ['ER-03', 'A level\'s surface and shadow go together: the shadow of floating goes on the floating surface, never on a card\'s. Use the class (.ds-raised … .ds-dragging) to take the whole level.', 'In Dark the surface is what shows height; a floating shadow on a raised surface sits at one height and looks like another.', '—'],
  ['ER-04', 'Whatever floats has its edge: floating, modal and dragging draw border: var(--ds-border-width-line) solid var(--ds-elevation-<job>-border) on every side; a sticky bar draws its line on the side facing the content.', 'Forced colours remove every shadow, and in Dark a shadow barely shows: without a border a menu has no edge and its items run into the page.', '1.4.11'],
  ['ER-05', 'Stacking uses layers: z-index is var(--ds-layer-<job>) (Tailwind z-(--ds-layer-floating)). Raw numbers only -1, 0, 1 and 2, for order inside one component. Never 999 or 9999.', 'Stray numbers race each other: a dropdown at 9999 paints over an open dialog and its scrim, and a sticky header at 1000 covers the menu opened from it.', '2.4.11'],
  ['ER-06', 'A modal is modal: a <dialog> opened with showModal() (not the open attribute), its ::backdrop the scrim (var(--ds-elevation-modal-scrim)). A dialog built without <dialog> has role="dialog", aria-modal="true", a .ds-scrim behind it, focus moved in and held, the page behind made inert, Escape to close, and focus returned on close.', 'Without it, keyboard and screen-reader users walk out of the dialog into a page they can\'t see past the scrim.', '2.4.3, 4.1.2'],
  ['ER-07', 'Height in Dark comes from the tokens: never override shadows or level surfaces for dark mode ([data-theme="dark"] or prefers-color-scheme rules that set box-shadow or an elevation background).', 'The tokens already switch: Dark lifts surfaces (lighter as they rise) because a darker shadow on a near-black page measures almost nothing.', '—'],
  ['ER-08', 'Hover and press never lift alone: a :hover or :active rule that changes box-shadow also changes the fill (color.bg.surface-hover), a border colour or an outline. Press goes back down, never up.', 'A shadow change is removed in forced colours and barely shows in Dark: for many people nothing happens under the pointer.', '1.4.11'],
  ['ER-09', 'No glass: floating and modal surfaces are opaque — no backdrop-filter, no translucent background, no opacity on the surface.', 'Text contrast on a see-through surface depends on whatever scrolls behind it, so it can\'t be measured — and it fails exactly when the page behind is busy.', '1.4.3'],
  ['ER-10', 'Never redefine elevation or layer variables in app code (--ds-elevation-*, --ds-layer-*). Add a product layer in the engine config (elevation.layers) and build.', 'An overridden level skips the checks that keep edges visible, surfaces rising in Dark and layers in order.', '—'],
];

export const ELEVATION_CLASSES = [
  ['raised', 'Cards, panels, table frames in the flow of the page: raised surface and shadow', 'bg-elevation-raised-surface shadow-raised'],
  ['sticky', 'A bar that stays while content scrolls under it: sticky at the top, sticky layer, surface, shadow and a line on its bottom edge (data-stick="end": at the bottom, line on top)', 'sticky top-0 z-(--ds-layer-sticky) bg-elevation-sticky-surface shadow-sticky border-b-line border-elevation-sticky-border'],
  ['floating', 'Menus, popovers, tooltips, toasts, the navigation drawer: floating layer, surface, shadow and an edge on every side (data-layer="toast": the toast layer)', 'z-(--ds-layer-floating) bg-elevation-floating-surface shadow-floating border-line border-elevation-floating-border'],
  ['modal', 'Dialogs and sheets: modal layer, surface, shadow, edge; its ::backdrop is the scrim', 'z-(--ds-layer-modal) bg-elevation-modal-surface shadow-modal border-line border-elevation-modal-border backdrop:bg-elevation-modal-scrim'],
  ['scrim', 'The scrim for a modal that is not a <dialog>: fixed over the page, just before the dialog in the same layer', 'fixed inset-0 z-(--ds-layer-modal) bg-elevation-modal-scrim'],
  ['dragging', 'An item while it is dragged: the dragging layer, shadow and edge; it keeps its own surface', 'relative z-(--ds-layer-dragging) shadow-dragging border-line border-elevation-dragging-border'],
];

const code = (s) => `\`${s}\``;
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m)).replace(/``/g, '`');
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
const fmt = (x) => (Math.round(x * 100) / 100).toFixed(2);
const alphaOf = (hex) => (hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1);

/** How visible a level's shadow is just under its edge, on a background: the contrast of that pixel with the background. */
export function shadowPeak(sys, job, mode, bgPath = 'color.bg.canvas') {
  const s = sys.resolve(`elevation.${job}.shadow`, { Color: mode });
  const bg = sys.resolve(bgPath, { Color: mode }).slice(0, 7);
  const a = shadowEdgeAlpha(s, alphaOf(s.color));
  return contrast(composite('#000000', a, bg), bg);
}

/** Measured mistakes: what goes wrong, with the numbers from this build, and the token that fixes it. */
function mistakes(sys, cfg, lowestEdge) {
  const r = (p, ctx) => sys.resolve(p, ctx);
  const L = { Color: 'Light' }, D = { Color: 'Dark' };
  const op = (x) => x.slice(0, 7);
  const scrimOver = (m) => { const s = r('color.bg.scrim', { Color: m }); return composite('#000000', alphaOf(s), op(r('color.bg.canvas', { Color: m }))); };
  const stepDark = contrast(op(r('elevation.floating.surface', D)), op(r('elevation.page.surface', D)));
  const darkFloat = shadowPeak(sys, 'floating', 'Dark');
  const lightFloat = shadowPeak(sys, 'floating', 'Light');
  const rs = r('elevation.raised.shadow', D), ss = r('elevation.sticky.shadow', D);
  return [
    { mistake: 'A menu set apart from the page by its shadow alone', measured: `its shadow reaches ${fmt(lightFloat)}:1 against the page in Light and ${fmt(darkFloat)}:1 in Dark; forced colours remove it altogether — the menu's items run into the page`, fix: '.ds-floating', fixValue: `the edge ${code('elevation.floating.border')}: at least ${fmt(lowestEdge.floating.Light.ratio)}:1 (Light) and ${fmt(lowestEdge.floating.Dark.ratio)}:1 (Dark) against anything a menu can sit on, measured beside its own shadow, and kept in forced colours` },
    { mistake: 'Darker shadows for dark mode', measured: `even at ${Math.round(alphaOf(r('color.shadow.4', D).toString()) * 100)}% black, the modal shadow reaches ${fmt(shadowPeak(sys, 'modal', 'Dark'))}:1 on the Dark page — there is almost nothing left to darken`, fix: 'the level surfaces', fixValue: `in Dark the floating surface is ${fmt(stepDark)}:1 lighter than the page; the tokens switch by themselves` },
    { mistake: 'z-index: 9999 on a dropdown', measured: `it is above ${code('layer.modal')} (${r('layer.modal')}) and ${code('layer.dragging')} (${r('layer.dragging')}): left open, it paints over a dialog and its scrim`, fix: 'var(--ds-layer-floating)', fixValue: `${r('layer.floating')}: above sticky bars (${r('layer.sticky')}), below dialogs (${r('layer.modal')}); a popover sits in the top layer and is never clipped` },
    { mistake: 'A dialog on the card surface (color.bg.surface) in Dark', measured: `against the scrim over the page it reaches ${fmt(contrast(op(r('color.bg.surface', D)), scrimOver('Dark')))}:1, and it looks like one more card`, fix: '.ds-modal', fixValue: `${fmt(contrast(op(r('elevation.modal.surface', D)), scrimOver('Dark')))}:1 for the modal surface, plus its edge (${fmt(contrast(op(r('elevation.modal.border', D)), scrimOver('Dark')))}:1)` },
    { mistake: 'A card that shows hover only by a bigger shadow', measured: `in Dark the raised and sticky shadows reach ${fmt(shadowPeak(sys, 'raised', 'Dark'))}:1 and ${fmt(shadowPeak(sys, 'sticky', 'Dark'))}:1 (${rs.offsetY}/${rs.blur}px against ${ss.offsetY}/${ss.blur}px) — the change is close to invisible, and gone in forced colours`, fix: 'color.bg.surface-hover', fixValue: `${fmt(contrast(op(r('color.bg.surface-hover', L)), op(r('color.bg.surface', L))))}:1 against the card in Light; the shadow may change too, never alone` },
    { mistake: 'A frosted-glass menu (backdrop-filter: blur, translucent background)', measured: 'its text contrast depends on whatever scrolls behind it, so no build can measure it — it fails exactly when the page behind is busy', fix: 'elevation.floating.surface', fixValue: `opaque: every text colour measured on it (E5)` },
    { mistake: 'A <dialog> shown with the open attribute', measured: 'it opens without the top layer, the backdrop or an inert page: Tab walks out of the dialog into the page behind it', fix: 'dialog.showModal()', fixValue: 'top layer, ::backdrop scrim, page inert, Escape closes; return focus to the button that opened it' },
  ];
}

export function elevationContract(sys, cfg, report) {
  const p = cfg.prefix;
  const r = (path, ctx) => sys.resolve(path, ctx);
  const { layers: productLayers } = validateElevationConfig(cfg);
  const pair = (path) => Object.fromEntries(['Light', 'Dark'].map((m) => [m, r(path, { Color: m })]));
  const levels = ELEVATION_JOB_ORDER.map((job) => {
    const j = ELEVATION_JOBS[job];
    const has = (x) => sys.tokens.has(`elevation.${job}.${x}`);
    const shadow = has('shadow') ? { token: `elevation.${job}.shadow`, cssVar: cssName(p, `elevation.${job}.shadow`), tailwind: `shadow-${job}`, color: sys.get(`elevation.${job}.shadow`).values.Value.color.slice(1, -1), offsetY: r(`elevation.${job}.shadow`).offsetY, blur: r(`elevation.${job}.shadow`).blur, spread: r(`elevation.${job}.shadow`).spread, alpha: Object.fromEntries(['Light', 'Dark'].map((m) => [m, +alphaOf(r(`elevation.${job}.shadow`, { Color: m }).color).toFixed(2)])), peakOnPage: Object.fromEntries(['Light', 'Dark'].map((m) => [m, +shadowPeak(sys, job, m).toFixed(2)])) } : null;
    return {
      job, use: j.use, height: j.height, temporary: !!j.temporary, class: `${p}-${job === 'page' ? null : job}`.replace(`${p}-null`, ''),
      surface: has('surface') ? { token: `elevation.${job}.surface`, role: sys.get(`elevation.${job}.surface`).values.Value.slice(1, -1), cssVar: cssName(p, `elevation.${job}.surface`), ...pair(`elevation.${job}.surface`), stepOverPage: Object.fromEntries(['Light', 'Dark'].map((m) => [m, +contrast(r(`elevation.${job}.surface`, { Color: m }).slice(0, 7), r('elevation.page.surface', { Color: m }).slice(0, 7)).toFixed(2)])) } : null,
      shadow,
      edge: has('border') ? { token: `elevation.${job}.border`, role: sys.get(`elevation.${job}.border`).values.Value.slice(1, -1), cssVar: cssName(p, `elevation.${job}.border`), width: 'border.width.line', sides: j.edge === 'side' ? 'the side facing the content' : 'all', ...pair(`elevation.${job}.border`) } : null,
      scrim: has('scrim') ? { token: `elevation.${job}.scrim`, role: 'color.bg.scrim', cssVar: cssName(p, `elevation.${job}.scrim`), ...pair(`elevation.${job}.scrim`) } : null,
      layer: j.layer ? `layer.${j.layer}` : null,
    };
  });
  const layerTokens = sys.byPrefix('layer.').map((t) => ({ name: t.path, value: r(t.path), cssVar: cssName(p, t.path), tailwind: `z-(${cssName(p, t.path)})`, use: t.description, product: !!t.meta.product })).sort((a, b) => a.value - b.value);
  const e3 = report.checks.find((c) => c.id === 'E3')?.items ?? [];
  const lowestEdge = Object.fromEntries(['floating', 'modal', 'dragging'].map((job) => [job, Object.fromEntries(['Light', 'Dark'].map((m) => { const xs = e3.filter((x) => x.token === `elevation.${job}.border` && x.mode === m); const w = xs.reduce((a, b) => (a.ratio < b.ratio ? a : b)); return [m, { ratio: w.ratio, on: w.on }]; }))]));
  const tokens = [
    ...layerTokens.map((l) => ({ name: l.name, figma: null, cssVar: l.cssVar, tailwind: [l.tailwind], use: l.use, collection: 'Elevation', chapter: ELEVATION_CHAPTER.stacking, value: l.value, product: l.product })),
    ...[...sys.tokens.values()].filter((t) => t.path.startsWith('elevation.')).map((t) => ({
      name: t.path, figma: t.type === 'shadow' ? `elevation/${t.meta.job} (effect style)` : t.path.replace(/\./g, '/'), cssVar: cssName(p, t.path),
      tailwind: t.type === 'shadow' ? [`shadow-${t.meta.job}`] : [`bg-${t.path.replace(/\./g, '-')}`, `border-${t.path.replace(/\./g, '-')}`].filter((x) => (t.path.endsWith('.border') ? x.startsWith('border') : x.startsWith('bg'))),
      use: t.description, collection: 'Elevation', chapter: chapterOfElevationToken(t.path), type: t.type,
      ...(t.type === 'shadow' ? { value: r(t.path), color: t.values.Value.color.slice(1, -1) } : { role: t.values.Value.slice(1, -1), light: r(t.path, { Color: 'Light' }), dark: r(t.path, { Color: 'Dark' }) }), product: false,
    })),
  ];
  return {
    $schema: 'ds-elevation-contract/1', system: sys.name, prefix: p, standard: 'WCAG 2.2 AA',
    levels, layers: layerTokens, layerStep: LAYER_STEP,
    shadowFormula: 'offsetY = max(1, ceil(height / 2)), blur = max(3, 2 × height), spread = −floor(height / 4); colour = the level\'s color.shadow step',
    edges: { min: EDGE_MIN, color: 'color.border.floating', lowest: lowestEdge, rule: `The edge of whatever floats reaches ${EDGE_MIN}:1 against every surface it can sit on (page, raised, sticky, another floating surface) and against the scrim, in Light and Dark` },
    dark: { rule: `In Dark each rising level is lighter than the one below (≥ ${SURFACE_STEP_MIN}:1); floating and modal share the top surface and the scrim tells a modal apart`, steps: levels.filter((l) => l.surface).map((l) => ({ job: l.job, dark: l.surface.Dark, overPage: l.surface.stepOverPage.Dark })) },
    topLayer: {
      what: 'The browser\'s top layer sits above every z-index: a <dialog> opened with showModal() and an element with the popover attribute go there, in the order they opened. Layer numbers order everything else.',
      dialog: `<dialog class="${p}-modal" aria-labelledby="…"> … </dialog> opened with dialog.showModal(); its ::backdrop is the scrim; Escape closes it; return focus to the opener`,
      popover: `<div class="${p}-floating" popover id="menu"> … </div> with <button popovertarget="menu">: light dismiss, Escape, never clipped by a parent`,
      toast: `<div class="${p}-floating" data-layer="toast" popover="manual" role="status"> … </div>, shown after any open dialog`,
    },
    modal: {
      must: ['open with showModal() (or role="dialog" + aria-modal="true" + .ds-scrim when <dialog> can\'t be used)', 'a label: aria-labelledby pointing at the dialog\'s heading', 'focus moves into the dialog when it opens (the first field, or the dialog itself)', 'focus stays inside while it is open; the page behind is inert', 'Escape closes it (unless closing would lose work: then it asks)', 'focus returns to the control that opened it'],
      css: `.${p}-modal::backdrop { background: var(${cssName(p, 'elevation.modal.scrim')}); }`,
    },
    forcedColors: {
      what: 'Forced colours (Windows contrast themes) remove every box-shadow and replace surfaces with the system page colour: every level looks flat. Borders stay, drawn in the system text colour.',
      tokensCss: ['.ds-floating, .ds-modal and .ds-dragging draw a border on every side, .ds-sticky on the side facing the content', 'the drawer pane of .ds-shell draws its edge'],
      you: ['never remove the border of a floating level (ER-04)', 'show hover and press with something besides the shadow (ER-08)', 'keep focus rings on: a shadow is never a focus indicator'],
    },
    classes: ELEVATION_CLASSES.map(([name, use, tailwind]) => ({ class: `${p}-${name}`, use, tailwind: tailwind.replace(/--ds-/g, `--${p}-`) })),
    limits: { edgeMin: EDGE_MIN, surfaceStepMin: SURFACE_STEP_MIN, localZ: [-1, 0, 1, 2], layerStep: LAYER_STEP },
    build: { ok: report.ok, tokens: tokens.length, productLayers: productLayers.length, checks: report.checks.filter((c) => c.foundation === 'Elevation').map((c) => ({ id: c.id, title: c.title, status: c.status, summary: c.summary })) },
    rules: ELEVATION_RULES.map(([id, rule, why, wcag]) => ({ id, rule, why, wcag })),
    decisions: ELEVATION_DECISIONS,
    tokens,
    mistakes: mistakes(sys, cfg, lowestEdge),
  };
}

export function elevationRulesMd(c) {
  const P = (s) => s.replace(/--ds-/g, `--${c.prefix}-`).replace(/\.ds-/g, `.${c.prefix}-`);
  const f = (s) => P(s).replace(/(elevation\.[a-z]+(\.[a-z]+)?|layer\.[a-z-]+|color\.(border|bg)\.[a-z-]+|border\.width\.[a-z]+|space|\.[a-z]+-(raised|sticky|floating|modal|scrim|dragging)|data-(stick|layer)="[a-z]+"|popover(="manual")?|showModal\(\)|<dialog>|::backdrop|overflow: hidden|elevation\.layers)(?![a-z-])/g, (m) => code(m));
  let md = `# Elevation rules for AI tools — ${c.system}\n\n`;
  md += `Generated from the engine (${c.build.tokens} tokens; ${c.levels.length} levels, ${c.layers.length} layers; ${c.build.ok ? 'all checks pass' : 'SOME CHECKS FAIL'}). The same data in machine-readable form: ${code('elevation.contract.json')}.\n\n`;
  md += `## How to use this file\n1. Decide with the **Decision guide** whether it needs height at all, then which level — by what it does to the page, not by how strong a shadow you want.\n2. Take the whole level: the class (${code(`.${c.prefix}-floating`)} …) or its surface, shadow, edge and layer together.\n3. Follow the **Hard rules**. If a request conflicts with a rule, follow the rule and say which one.\n4. Before answering, run the **Self-check**.\n\n`;
  md += `## Hard rules\n` + table(['ID', 'Rule', 'Why', 'WCAG'], c.rules.map((x) => [x.id, P(tags(x.rule)), tags(x.why), x.wcag]));
  md += `\n## Decision guide\n`;
  for (const d of c.decisions) md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [tags(w), f(tags(s))]));
  md += `\n## Levels\nLowest first. Light shows height mostly by shadow (surfaces are white); Dark by lighter surfaces. "Shadow on the page" is how dark the shadow gets just under the surface's edge.\n\n`;
  md += table(['Level', 'Class', 'Surface (Light · Dark)', 'Shadow (y / blur / spread)', 'Shadow on the page (Light · Dark)', 'Edge', 'Layer', 'Use'], c.levels.map((l) => [code(`elevation.${l.job}`), l.class ? code(`.${l.class}`) : '—',
    l.surface ? `${code(l.surface.role)} ${l.surface.Light} · ${l.surface.Dark}` : 'its own', l.shadow ? `${l.shadow.offsetY} / ${l.shadow.blur} / ${l.shadow.spread}px, ${code(l.shadow.color)}` : '—',
    l.shadow ? `${fmt(l.shadow.peakOnPage.Light)} · ${fmt(l.shadow.peakOnPage.Dark)}` : '—', l.edge ? `${code(l.edge.role)}, ${l.edge.sides}` : '—', l.layer ? code(l.layer) : '—', tags(l.use)]));
  md += `\nShadows are computed from each level's height: ${c.shadowFormula}.\n`;
  md += `\n## Stacking order\n${c.topLayer.what}\n\n` + table(['Layer', 'z-index', 'CSS', 'Tailwind', 'What sits there'], c.layers.map((l) => [code(l.name), l.value, code(`var(${l.cssVar})`), code(l.tailwind), tags(l.use) + (l.product ? ' (added for this product)' : '')]));
  md += `\nRaw z-index numbers only for order inside one component: ${c.limits.localZ.join(', ')}.\n\n- Dialog: ${code(c.topLayer.dialog)}\n- Popover: ${code(c.topLayer.popover)}\n- Toast: ${code(c.topLayer.toast)}\n`;
  md += `\n## Edges\n${c.edges.rule}. Lowest measured: ${Object.entries(c.edges.lowest).map(([job, v]) => `${job} ${v.Light.ratio}:1 (Light, on ${v.Light.on}) · ${v.Dark.ratio}:1 (Dark, on ${v.Dark.on})`).join('; ')}.\n`;
  md += `\n## Dark mode\n${c.dark.rule}. Surfaces in Dark: ${c.dark.steps.map((s) => `${s.job} ${s.dark} (${fmt(s.overPage)}:1 over the page)`).join(' · ')}.\n`;
  md += `\n## Modal dialogs\n${c.modal.must.map((x) => `- ${tags(x)}`).join('\n')}\n- Scrim: ${code(c.modal.css)}\n`;
  md += `\n## Forced colours\n${c.forcedColors.what}\n\n**tokens.css already:** ${P(c.forcedColors.tokensCss.join('; '))}.\n\n**You:**\n${c.forcedColors.you.map((x) => `- ${x}`).join('\n')}\n`;
  md += `\n## Classes\n` + table(['Class', 'What it is', 'Tailwind equivalent'], c.classes.map((x) => [code(`.${x.class}`), tags(x.use), code(x.tailwind)]));
  md += `\n## Limits the build enforces\n` + table(['Limit', 'Value'], [
    ['Edges', `whatever floats has a border; ≥ ${c.limits.edgeMin}:1 against every surface it can sit on and the scrim, Light and Dark (E1, E3)`],
    ['Dark', `each rising level lighter than the one below, ≥ ${c.limits.surfaceStepMin}:1 (E2)`],
    ['Shadows', 'a higher level drops further, blurs wider and is at least as dark (E4)'],
    ['Text', 'every text colour measured on every level surface (E5)'],
    ['Layers', `${LAYER_ORDER.join(' < ')}, ${c.limits.layerStep} apart; product layers computed in between (E6)`],
  ]);
  md += `\n## Common mistakes (measured)\n` + table(['Mistake', 'Measured', 'Use instead'], c.mistakes.map((m) => [tags(m.mistake), tags(m.measured), `${code(P(m.fix))} — ${tags(m.fixValue)}`]));
  md += `\n## Self-check before answering\n- [ ] Each thing with height needs it (space, a surface change or a line didn't do the job), and its level says what it does: raised, sticky, floating, modal or dragging.\n- [ ] Every ${code('box-shadow')} is a ${code(`var(--${c.prefix}-elevation-<job>-shadow)`)} on the same level's surface (or the class); no hand-made shadows, no Tailwind ${code('shadow-sm')}…${code('shadow-2xl')}.\n- [ ] Floating, modal and dragging have a ${code('border.width.line')} edge in ${code('elevation.<job>.border')}; sticky bars a line toward the content.\n- [ ] Every ${code('z-index')} is a ${code(`var(--${c.prefix}-layer-<job>)`)} (or −1…2 inside one component); menus that could be clipped are popovers.\n- [ ] Dialogs are ${code('<dialog>')} opened with ${code('showModal()')}, labelled, scrim behind, focus in, held and returned.\n- [ ] No dark-mode shadow overrides, no glass, no hover shown by shadow alone.\n- [ ] No elevation or layer variables redefined.\n`;
  return md;
}
