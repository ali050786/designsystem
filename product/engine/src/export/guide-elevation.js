// Elevation guide (Markdown) for people: the written version of the elevation foundation's chapters.
// The words are fixed; every value, table and example number is computed from the build, so the guide can't drift
// from the tokens. Regenerate it with the build; never edit the output by hand.
import { ELEVATION_CHAPTER } from './ai-elevation.js';
import { LAYER_ORDER, LAYER_STEP, EDGE_MIN, SURFACE_STEP_MIN } from '../foundations/elevation.js';
import { contrast, composite } from '../color-math.js';

const code = (s) => `\`${s}\``;
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
const short = (p) => p.replace(/\./g, '/');
const tags = (s) => s.replace(/<\/?[a-z][a-z0-9]*>/g, (m) => code(m)).replace(/``/g, '`');
const slash = (x) => x.replace(/\b(space|border|color|elevation|layer)\.[a-z0-9.<>*-]*[a-z0-9>*]/g, (m) => (m === 'elevation.layers' ? m : short(m)));
const fmt = (x) => (Math.round(x * 100) / 100).toFixed(2);

export const ELEVATION_CHAPTERS = ['Five principles', ELEVATION_CHAPTER.built, ELEVATION_CHAPTER.levels, ELEVATION_CHAPTER.shadows, ELEVATION_CHAPTER.dark,
  ELEVATION_CHAPTER.edges, ELEVATION_CHAPTER.stacking, ELEVATION_CHAPTER.modal, ELEVATION_CHAPTER.moving, 'Choosing a level', 'Readers\' settings and products'];

export function elevationGuideMd(sys, cfg, report, contract) {
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
  const L = (job) => contract.levels.find((l) => l.job === job);
  const op = (x) => x.slice(0, 7);
  const alphaOf = (hex) => (hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1);
  const scrimOver = (m) => composite('#000000', alphaOf(r('elevation.modal.scrim', { Color: m })), op(r('elevation.page.surface', { Color: m })));
  const mistake = (start) => contract.mistakes.find((m) => m.mistake.startsWith(start));

  let md = `# Elevation\n\n`;
  md += `*${sys.name} foundations · elevation · the written guide. Generated from the engine — ${contract.tokens.length} tokens, ${contract.levels.length} levels, ${contract.layers.length} layers; ${report.checks.filter((c) => c.foundation === 'Elevation').every((c) => c.status !== 'fail') ? 'every elevation check passing' : 'SOME CHECKS FAILING'}. Do not edit by hand; change the engine config and build again.*\n\n`;
  md += `This guide explains how ${sys.name} shows what sits on top of what: when something needs height at all, the six levels named by what they do, how shadows are computed, how Dark mode shows height without them, the edge everything that floats keeps, the stacking order, and how dialogs, menus and dragged items behave. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after ${see('Choosing a level')}; developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (${code('elevation.md')}, ${code('elevation.contract.json')}).\n\n`;
  md += `**Contents**\n\n${ELEVATION_CHAPTERS.map((c) => `- ${see(c)}`).join('\n')}\n`;

  // Five principles
  md += chapter('Five principles');
  md += `Five principles shape every level. Each one is checked by the build or the elevation audit, not left to taste.\n\n`;
  md += table(['Principle', 'What it means in practice'], [
    ['**Height is a last resort**', 'Space groups things, a surface change sets a region apart, a line separates. A level is for something that really sits over something else — the higher it sits, the more it interrupts.'],
    ['**A level says what it does**', `Six levels named by job — page, raised, sticky, floating, modal, dragging — not by number. "Floating" tells you a menu goes there; "level 3" tells you nothing, and a number changes meaning the day a level is added.`],
    ['**Whatever floats keeps an edge**', `Floating, modal and dragging draw a border on every side, sticky bars a line toward the content. Forced colours remove shadows and Dark barely shows them, so the edge is what's left (E1: ${checks.get('E1').summary}; E3: ${checks.get('E3').summary}).`],
    ['**Dark shows height by surface**', `A black shadow on a near-black page has almost nothing to darken. In Dark each level is lighter than the one below (E2: ${checks.get('E2').summary}).`],
    ['**One stacking order**', `${LAYER_ORDER.join(' < ')}, as layer tokens with room between them; dialogs and menus use the browser's top layer. No z-index races (E6: ${checks.get('E6').summary}).`],
  ]);

  // How tokens are built
  md += chapter(ELEVATION_CHAPTER.built);
  md += `Elevation tokens live in one collection and point into Colour for everything you see.\n\n`;
  md += table(['Collection', 'Modes', 'Elevation tokens in it', 'Changes with'], [
    ['**Elevation**', 'one', `Per level: a surface (${code('elevation/<job>/surface')}), a shadow (${code('elevation/<job>/shadow')}, an effect style in Figma), an edge (${code('elevation/<job>/border')}) and, for modal, the scrim; the stacking order (${code('layer/*')}, code only)`, `Colour's Light and Dark modes (every surface, edge and shadow colour is a link), and the product's own layers (${code('elevation.layers')})`],
    ['**Color** (Colour foundation)', 'Light, Dark', `What the levels link to: ${code('color/bg/canvas')}, ${code('surface')}, ${code('surface-raised')}, ${code('surface-overlay')}, ${code('color/border/floating')}, ${code('color/border/subtle')}, ${code('color/bg/scrim')} and the shadow strengths ${code('color/shadow/1')}…${code('4')}`, 'the theme'],
  ]);
  md += `\n**Reading a name.** ${code('elevation / floating / border')} — category ${code('elevation')}, level ${code('floating')}, part ${code('border')}. Levels are named by what they do. The shadow strengths in Colour stay numbered (${code('color/shadow/1')}…${code('4')}): they are a scale the levels pick from, like the border widths, not places people choose.\n\n`;
  const eg = tok.get('elevation.floating.border');
  md += `**One name, three places.**\n\n` + table(['Figma', 'CSS variable', 'Tailwind'], [[code(eg.figma), code(eg.cssVar), code(eg.tailwind[0])], [code('elevation/floating (effect style)'), code(tok.get('elevation.floating.shadow').cssVar), code('shadow-floating')], ['— (code only)', code(tok.get('layer.floating').cssVar), code(tok.get('layer.floating').tailwind[0])]]);
  md += `\n**Take the whole level.** Each level is a class in tokens.css — ${contract.classes.filter((c) => c.class !== `${p}-scrim`).map((c) => code(`.${c.class}`)).join(', ')} — carrying surface, shadow, edge and layer together, so a component can't take the shadow and forget the edge. In Figma, surfaces are scoped to fills, edges to strokes, and the shadow is an effect style whose colour is bound to the Colour variable, so a frame in Dark mode shows the Dark shadow.\n`;

  // Levels by job
  md += chapter(ELEVATION_CHAPTER.levels);
  md += `Six levels, lowest first. Pick by what the thing does to the page; the surface, shadow, edge and layer come with the level.\n\n`;
  mark(contract.levels.filter((l) => l.surface).map((l) => l.surface.token));
  md += table(['Level', 'Use it for', 'Surface (Light · Dark)', 'Shadow', 'Edge', 'Layer'], contract.levels.map((l) => [code(`elevation/${l.job}`), tags(l.use), l.surface ? `${code(short(l.surface.token))} = ${code(short(l.surface.role))}<br>${l.surface.Light} · ${l.surface.Dark}` : 'keeps its own', l.shadow ? `${l.height}px up` : 'none', l.edge ? (l.edge.sides === 'all' ? 'every side' : 'toward the content') : '—', l.layer ? code(short(l.layer)) : 'in the flow']));
  md += `\n**Floating and modal share a surface.** Both are ${code(short(L('floating').surface.role))}. What makes a dialog a dialog is the scrim behind it and the page going still, not a different grey; a menu opened inside a dialog still reads, because of its edge (${see(ELEVATION_CHAPTER.edges)}).\n\n`;
  md += `**Dragging is a state, not a place.** An item takes ${code('elevation/dragging')} while it is held and goes back to its own level when it is dropped. It keeps its own surface.\n`;
  md += rules([['Lowest level that works', 'A card that is a link is still raised; a settings panel is a card, not a dialog. Every step up interrupts more.'],
    ['Not for emphasis', 'A level says where something sits, not how important it is: emphasis is type, colour and position. Raising every sibling flattens them all.'],
    ['Layout first', 'If a page feels muddled, fix the grouping and spacing before adding height; height on a weak layout makes it louder, not clearer.']]);

  // Shadows
  md += chapter(ELEVATION_CHAPTER.shadows);
  md += `Each level's shadow is computed from its height: ${contract.shadowFormula}. A higher level drops further, blurs wider and is at least as dark (E4: ${checks.get('E4').summary}).\n\n`;
  const shadowed = contract.levels.filter((l) => l.shadow);
  mark(shadowed.map((l) => l.shadow.token));
  md += table(['Shadow', 'Height', 'Offset / blur / spread', 'Colour (alpha Light · Dark)', 'Just under the edge, on the page (Light · Dark)'], shadowed.map((l) => [code(`elevation/${l.job}/shadow`), `${l.height}px`, `0 ${l.shadow.offsetY}px ${l.shadow.blur}px ${l.shadow.spread}px`, `${code(short(l.shadow.color))} (${l.shadow.alpha.Light} · ${l.shadow.alpha.Dark})`, `${fmt(l.shadow.peakOnPage.Light)} · ${fmt(l.shadow.peakOnPage.Dark)}`]));
  md += `\n*"Just under the edge": the contrast between the page and the darkest pixel of the shadow, in the middle of the surface's bottom edge — computed here and measured in Chromium by the elevation audit.*\n\n`;
  md += `**Why one shadow, pulled in.** The negative spread keeps a large shadow from spreading sideways past the surface, so it reads as height, not as a smudge around the box. One shadow per level keeps a single, checkable number for each.\n\n`;
  md += `**What a shadow can't do.** Look at the last column: even the strongest shadow is a faint change against the page. That is fine for showing height in Light — and it is why a shadow is never the only thing that separates a surface from what is under it.\n`;
  md += rules([['Shadow and surface together', `The floating shadow goes on the floating surface. On a raised card it would say one height and show another (ER-03).`],
    ['No shadows by hand', `Every ${code('box-shadow')} is a level's shadow or none; Tailwind's own ${code('shadow-sm')}…${code('shadow-2xl')} are removed from the theme (ER-01).`]]);

  // Height in Dark
  md += chapter(ELEVATION_CHAPTER.dark);
  const steps = contract.levels.filter((l) => l.surface);
  md += `In Light, surfaces are white and the shadow shows height. In Dark that stops working: a black shadow on a near-black page reaches ${fmt(L('modal').shadow.peakOnPage.Dark)}:1 at most. So in Dark each level is a lighter surface than the one below it — the page is darkest, and things get lighter as they come toward you.\n\n`;
  md += table(['Level', 'Dark surface', 'Against the page', 'Against the level below'], steps.map((l, i) => [code(`elevation/${l.job}`), `${code(short(l.surface.role))} ${l.surface.Dark}`, i ? `${fmt(l.surface.stepOverPage.Dark)}:1` : '—', i ? (l.surface.role === steps[i - 1].surface.role ? 'same surface (the scrim tells it apart)' : `${fmt(contrast(op(l.surface.Dark), op(steps[i - 1].surface.Dark)))}:1`) : '—']));
  md += `\n*Each step is at least ${SURFACE_STEP_MIN}:1 lighter than the level below it (E2). The shadows still draw in Dark; they just don't carry the meaning.*\n\n`;
  const dk = mistake('Darker shadows');
  md += `**The common slip.** ${dk.mistake}: ${dk.measured}. Instead: ${dk.fixValue}.\n`;
  md += rules([['No dark-mode overrides', `The tokens switch by themselves. A ${code('[data-theme="dark"]')} rule that sets a shadow or a surface skips the check that keeps surfaces rising (ER-07).`],
    ['Text is measured on every level', `Each level surface is a background every text colour is measured on, in both modes (E5: ${checks.get('E5').summary}).`]]);

  // Edges
  md += chapter(ELEVATION_CHAPTER.edges);
  md += `Whatever floats over content draws a ${code('border/width/line')} edge on every side; a sticky bar draws one line, on the side that faces the content scrolling under it. The edge does the work the shadow can't: it is there in Dark, in forced colours, and over a busy page.\n\n`;
  mark(contract.levels.filter((l) => l.edge).map((l) => l.edge.token));
  md += table(['Edge', 'Colour', 'Light · Dark', 'Sides', 'Lowest against what it sits on (Light · Dark)'], contract.levels.filter((l) => l.edge).map((l) => [code(`elevation/${l.job}/border`), code(short(l.edge.role)), `${l.edge.Light} · ${l.edge.Dark}`, l.edge.sides, contract.edges.lowest[l.job] ? `${contract.edges.lowest[l.job].Light.ratio}:1 on ${contract.edges.lowest[l.job].Light.on} · ${contract.edges.lowest[l.job].Dark.ratio}:1 on ${contract.edges.lowest[l.job].Dark.on}` : 'decorative']));
  md += `\n**${code('color/border/floating')} is computed.** It sits far enough from every surface a floating thing can land on — the page, a card, a sticky bar, another floating surface (a menu over a menu, a select in a dialog) and the scrim — to reach ${EDGE_MIN}:1 against all of them, in both modes (E3). Darker than the page in Light; lighter than the top surface in Dark. It is decorative (the menu's items identify themselves), so it doesn't need 3:1 — but it is never too faint to see.\n\n`;
  const sh = mistake('A menu set apart');
  md += `**The common slip.** ${sh.mistake}: ${sh.measured}. With ${code(`.${p}-floating`)}: ${sh.fixValue}.\n`;
  md += rules([['Never remove the edge', `Not for a "cleaner" look: the edge is the only thing that survives forced colours (ER-04).`],
    ['Cards don\'t need one', `A raised card sits in the flow; its content identifies it. Give it a ${code('border/width/line')} outline in ${code('color/border/default')} when many cards sit together (Border foundation).`]]);

  // The stacking order
  md += chapter(ELEVATION_CHAPTER.stacking);
  md += `Two mechanisms decide what is drawn on top. The browser's **top layer** is above everything: a ${code('<dialog>')} opened with ${code('showModal()')} and an element with the ${code('popover')} attribute go there, the most recently opened on top, and nothing can clip them. For everything else — sticky bars, a drawer, a dragged item, a modal that can't be a ${code('<dialog>')} — the **layer tokens** set the z-index.\n\n`;
  mark(contract.layers.map((l) => l.name));
  md += table(['Layer', 'z-index', 'What sits there', 'Tailwind'], contract.layers.map((l) => [code(short(l.name)), String(l.value), tags(l.use) + (l.product ? ' (added for this product)' : ''), code(l.tailwind)]));
  md += `\n**Why ${LAYER_STEP} apart.** So a product can put a layer between two of them without renumbering anything; the build computes its number (${see('Readers\' settings and products')}). Inside one component, raw ${contract.limits.localZ.join(', ')} are fine for local order (a lifted part of a joined group); anything else is a layer.\n\n`;
  const z = mistake('z-index: 9999');
  md += `**The common slip.** ${z.mistake}: ${z.measured}. Use ${code(z.fix.replace(/--ds-/g, `--${p}-`))} — ${z.fixValue}.\n\n`;
  md += `**Menus that get clipped.** A menu inside a card or a table with ${code('overflow: hidden')} or ${code('auto')} is cut off at the parent's edge whatever its z-index. Open it as a popover: the top layer is never clipped.\n`;
  md += rules([['A menu above its header', `${code('layer/floating')} is above ${code('layer/sticky')}, so a menu opened from the header is never cut by it.`],
    ['Focus is never hidden under a bar', `Sticky bars sit above the content, so a focused field scrolled under one would be hidden (WCAG 2.4.11): tokens.css adds the header and the focus ring to the scroll padding (Layout foundation), and the elevation audit tabs through each page to check.`]]);

  // Dialogs and the scrim
  md += chapter(ELEVATION_CHAPTER.modal);
  md += `A modal stops the page until it is answered or closed. The scrim dims the page to say so; the page behind must also stop working for the keyboard and screen readers.\n\n`;
  mark(['elevation.modal.scrim']);
  md += table(['Token', 'Light · Dark', 'What it does'], [[code('elevation/modal/scrim'), `${r('elevation.modal.scrim', { Color: 'Light' })} · ${r('elevation.modal.scrim', { Color: 'Dark' })}`, `Linked to ${code('color/bg/scrim')}. The dialog surface measures ${fmt(contrast(op(r('elevation.modal.surface', { Color: 'Light' })), scrimOver('Light')))}:1 (Light) and ${fmt(contrast(op(r('elevation.modal.surface', { Color: 'Dark' })), scrimOver('Dark')))}:1 (Dark) against the dimmed page`]]);
  md += `\n**Use ${code('<dialog>')} with ${code('showModal()')}.** The browser then puts the dialog in the top layer, draws the scrim as its ${code('::backdrop')}, makes the rest of the page inert and closes it on Escape. ${code(`.${p}-modal`)} supplies the surface, shadow, edge and scrim.\n\n`;
  md += '```html\n' + `<button id="open-delete">Delete project</button>\n<dialog class="${p}-modal" aria-labelledby="delete-title">\n  <h2 id="delete-title">Delete this project?</h2>\n  …\n  <button value="cancel" formmethod="dialog">Cancel</button>\n</dialog>\n<script>\n  const d = document.querySelector('dialog'), opener = document.getElementById('open-delete');\n  opener.addEventListener('click', () => d.showModal());\n  d.addEventListener('close', () => opener.focus());\n</script>` + '\n```\n\n';
  md += `**Every modal must:**\n\n${contract.modal.must.map((x) => `- ${tags(x.replace(/\.ds-/g, `.${p}-`))}`).join('\n')}\n\n`;
  const op2 = mistake('A <dialog> shown');
  md += `**The common slip.** ${tags(op2.mistake)}: ${op2.measured}.\n\n`;
  const ds = mistake('A dialog on the card surface');
  md += `**Not the card surface.** ${ds.mistake}: ${ds.measured}. With ${code(`.${p}-modal`)}: ${ds.fixValue}.\n`;
  md += rules([['No scrim without a dialog', 'The scrim goes with the dialog and leaves with it; it is never a background for content.'],
    ['Toasts and dialogs', `A toast shown while a dialog is open sits in ${code('layer/toast')} (opened as ${code('popover="manual"')} after the dialog) so it is never behind the scrim — and it must not need an action, because everything outside the dialog is inert.`]]);

  // Lifting and dragging
  md += chapter(ELEVATION_CHAPTER.moving);
  md += `Things can change height while someone uses them. The change is always temporary, and never the only sign that something happened.\n\n`;
  md += table(['Interaction', 'What changes', 'Never'], ELEVATION_DECISIONS_MOVING().map((x) => x));
  const hv = mistake('A card that shows hover');
  md += `\n**The common slip.** ${hv.mistake}: ${hv.measured}. Use ${code(short(hv.fix))} — ${hv.fixValue}.\n\n`;
  md += `**Dragging needs a second way.** Dragging is a pointer gesture; WCAG 2.5.7 asks for a way to do the same with a single click or the keyboard (move-up and move-down buttons, or arrow keys on the focused item). While it is held, the item takes ${code(`.${p}-dragging`)}; ${code('aria-grabbed')} is obsolete, so say what happened in a live region ("Moved to position 3 of 8").\n`;
  md += rules([['Press goes down', 'A pressed card moves toward the page (back to its resting shadow), never further up.'],
    ['Focus is a ring', 'Keyboard focus is the focus ring tokens.css draws (Border foundation) — never a shadow.']]);

  // Choosing a level
  md += chapter('Choosing a level');
  md += `Four questions: *does it need height at all?*, *which level?*, *what has to be on top?* and *does it change while someone uses it?*\n`;
  for (const d of contract.decisions) {
    md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, s]) => [tags(w), tags(slash(s).replace(/\.ds-/g, `.${p}-`)).replace(/((elevation|layer|color|border|space)\/[a-z0-9/<>*-]+[a-z0-9>*]|\.[a-z]+-(raised|sticky|floating|modal|scrim|dragging)|data-(stick|layer)="[a-z]+"|popover="manual"|showModal\(\)|elevation\.layers)/g, (m) => code(m))]));
  }
  md += `\n**Worked example — a project page.** One part at a time:\n\n`;
  md += table(['Part', 'Level', 'Why'], [
    ['The page', code('elevation/page'), 'The ground everything sits on.'],
    ['The page header', `${code('elevation/sticky')} · ${code(`.${p}-sticky`)}`, 'Stays while the list scrolls under it; a line on its bottom edge.'],
    ['Project cards', `${code('elevation/raised')} · ${code(`.${p}-raised`)}`, 'Group each project in the flow of the page.'],
    ['The card\'s "more" menu', `${code('elevation/floating')} · a popover`, 'Opens over the cards without blocking the page; never clipped by the card.'],
    ['"Delete project?"', `${code('elevation/modal')} · ${code('<dialog>')} + ${code('showModal()')}`, 'Must be answered: scrim, focus held, Escape closes.'],
    ['"Project deleted" toast', `${code('elevation/floating')} · ${code('layer/toast')}`, 'Shows above anything; needs no action.'],
    ['Reordering cards', `${code('elevation/dragging')} while held`, 'Back to raised on drop; move buttons for the keyboard.'],
  ]);
  md += `\n**Do and avoid** (measured in this build)\n\n`;
  md += table(['Avoid', 'Measured', 'Do'], contract.mistakes.map((m) => [tags(slash(m.mistake)), tags(slash(m.measured)), `${/^(elevation|layer|color|var|\.|dialog)/.test(m.fix) ? code(slash(m.fix).replace(/--ds-/g, `--${p}-`).replace(/\.ds-/, `.${p}-`)) : m.fix} — ${tags(slash(m.fixValue))}`]));

  // Readers' settings and products
  md += chapter('Readers\' settings and products');
  md += `People switch to dark mode or forced colours, zoom and enlarge text; products add places of their own to the stacking order. Levels are built so none of that breaks.\n\n`;
  md += `**Dark mode.** Height comes from lighter surfaces and the edge (${see(ELEVATION_CHAPTER.dark)}).\n\n`;
  md += `**Forced colours.** ${contract.forcedColors.what} tokens.css: ${contract.forcedColors.tokensCss.map((x) => x.replace(/\.ds-/g, `.${p}-`)).join('; ')}. The elevation audit renders every page in Chromium's real forced colours and checks that every floating thing keeps its edge.\n\n`;
  md += `**Zoom and bigger text (WCAG 1.4.4, 1.4.10).** Shadows and edges are px and scale with zoom like everything else. A sticky bar that grows with bigger text eats the screen: in short windows the shell header stops sticking (Layout foundation), and a dialog scrolls inside itself rather than running off the screen.\n\n`;
  md += `**Reduced motion.** Menus, popovers, toasts and dialogs open and close with the Motion foundation's floating and modal jobs, ready in tokens.css; with reduced motion they only fade.\n\n`;
  const prod = contract.layers.filter((l) => l.product);
  if (prod.length) md += `**Layers added for this product**\n\n` + table(['Layer', 'z-index', 'What sits there'], prod.map((l) => [code(short(l.name)), String(l.value), tags(l.use)])) + '\n';
  md += `**Adding a layer.** Most things fit one of the ${LAYER_ORDER.length}. If a product needs another place (a banner that sits over sticky bars, a help panel), name it by what sits there and say which layer it sits just above; the build computes its number, keeps the order, and refuses numbers, names by position ("top", "z-50") and two layers claiming the same spot:\n\n`;
  md += '```json\n' + JSON.stringify({ elevation: { layers: [{ name: 'layer.banner', above: 'sticky', description: 'A site-wide banner that stays above sticky bars' }] } }, null, 2) + '\n```\n\n';
  md += `Levels, surfaces, shadows and edges are not config choices: they are computed, so every product gets the same checked order.\n`;

  // Reference
  md += `\n---\n\n## Accessibility reference\n\nWhat the build checks for elevation, and the result for this build:\n\n`;
  md += table(['Check', 'What it checks', 'WCAG', 'Result'], report.checks.filter((c) => c.foundation === 'Elevation').map((c) => [c.id, c.title, `${c.wcag} (${c.level})`, `${c.status} · ${c.summary}`]));
  md += `\nWhat the checkers look for in your own code and pages: the elevation checker (${code('npm run lint:elevation')}) reads CSS, HTML and JSX; the elevation audit (${code('npm run audit:elevation')}) renders a page in Light, Dark and forced colours at 1280 and 320px, measures every shadow, surface step and edge against what is really behind it, opens menus and dialogs, checks what is on top, tabs through dialogs and checks that focus is never hidden under a sticky bar. See the [handoff](HANDOFF.md).\n\n`;
  md += `**Glossary**\n\n`;
  md += table(['Term', 'Meaning'], [['Level', 'Where something sits and what it does to the page (page, raised, sticky, floating, modal, dragging); it decides surface, shadow, edge and layer.'], ['Edge', 'The border a floating level keeps on every side, so it shows without its shadow.'],
    ['Scrim', 'The dimming behind a modal dialog.'], ['Top layer', 'A browser layer above every z-index, for dialogs opened with showModal() and popovers.'], ['Layer', 'A place in the stacking order (z-index), named by what sits there.'],
    ['Inert', 'Part of the page that can\'t be focused, clicked or read by a screen reader while a dialog is open.'], ['Forced colours', 'A browser mode (Windows contrast themes) that replaces the page\'s colours and removes shadows; borders survive.']]);

  // Every built-in token documented exactly once.
  const all = contract.tokens.filter((t) => !t.product).map((t) => t.name);
  const missing = all.filter((n) => !documented.includes(n));
  const dupes = documented.filter((n, i) => documented.indexOf(n) !== i);
  if (missing.length || dupes.length) throw new Error(`guide: elevation tokens missing ${missing.join(', ')} / duplicated ${dupes.join(', ')}`);
  return md;

  function ELEVATION_DECISIONS_MOVING() {
    return [
      ['Hover on something clickable', `the fill (${code('color/bg/surface-hover')}) or a border colour; the shadow may grow one level with it`, 'a shadow alone (ER-08)'],
      ['Press', 'back to the resting shadow', 'higher than at rest'],
      ['Keyboard focus', 'the focus ring', 'a shadow as the focus indicator'],
      ['Drag', `${code(`.${p}-dragging`)} while held; a live-region message; back on drop`, 'dragging as the only way to move it (WCAG 2.5.7)'],
      ['Open a menu or dialog', `the floating or modal level appears; with reduced motion it only fades`, 'a card that turns into a dialog in place'],
    ];
  }
}
