// Colour guide (Markdown) for people: the written version of the colour foundation's chapters.
// The words are fixed; every number, hex value and table is computed from the build, so the guide can't drift
// from the tokens. Regenerate it with the build; never edit the output by hand.
import { build } from '../build.js';
import { contrast } from '../color-math.js';
import { GRADES, gradeOf } from '../grades.js';
import { distance, CVD_TYPES } from '../cvd.js';
import { flatten } from '../checks/index.js';

const code = (s) => `\`${s}\``;
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
const short = (p) => p.replace(/^color\./, '').replace(/\./g, '/');
const fmt = (n) => n.toFixed(2);
// 'color.bg.state-hover / color.bg.state-pressed (translucent tint)' → `bg/state-hover` or `bg/state-pressed` (translucent tint)
const roles = (r) => r.split(' / ').map((x) => { const m = /^(\S+)(\s.*)?$/.exec(x); return code(short(m[1])) + (m[2] ?? ''); }).join(' or ');

export const SAMPLE_BRANDS = [['Blue', '#2D5BD7'], ['Green', '#00A86B'], ['Navy', '#0B2E6B'], ['Orange', '#FF6B00']];
const HUES = ['brand', 'neutral', 'success', 'warning', 'danger', 'info'];
const TEXT_BGS = ['canvas', 'surface', 'surface-raised', 'surface-overlay', 'surface-sunken', 'surface-hover', 'surface-pressed', 'selected'];

const CHAPTERS = [
  ['01', 'Five principles'], ['02', 'Contrast grades'], ['03', 'How tokens are built'], ['04', 'Shade scales'],
  ['05', 'Surfaces and depth'], ['06', 'Text, icons and outlines'], ['07', 'Actions and states'], ['08', 'Status and data'],
  ['09', 'What goes on what'], ['10', 'Choosing and using colour'], ['11', 'Modes and brands'],
];

// Role groups per chapter, in reading order (every role appears exactly once; checked below).
const STATUSES = ['success', 'warning', 'danger', 'info'];
const GROUPS = {
  '05': [['Surfaces', ['bg.canvas', 'bg.surface', 'bg.surface-sunken', 'bg.surface-raised', 'bg.surface-overlay', 'bg.selected', 'bg.scrim']],
    ['Shadows', ['shadow.1', 'shadow.2', 'shadow.3', 'shadow.4']]],
  '06': [['Text and icons', ['fg.default', 'fg.muted', 'fg.subtle', 'fg.brand', 'fg.link', 'fg.link-hover', 'fg.disabled', 'fg.icon', 'fg.icon-subtle']],
    ['Outlines', ['border.subtle', 'border.default', 'border.floating', 'border.strong', 'border.input']]],
  '07': [['Actions', ['primary', 'secondary', 'ghost', 'danger', 'disabled'].flatMap((k) => (k === 'disabled' ? ['bg', 'fg', 'border'] : ['bg', 'bg-hover', 'bg-pressed', 'fg', ...(k === 'secondary' ? ['border'] : [])]).map((p) => `action.${k}.${p}`))],
    ['States', ['bg.surface-hover', 'bg.surface-pressed', 'bg.state-hover', 'bg.state-pressed', 'bg.item-hover', 'bg.item-pressed', 'bg.disabled', 'border.focus', 'border.selected']],
    ['Brand fills', ['bg.brand', 'bg.brand-hover', 'bg.brand-pressed', 'bg.brand-subtle', 'fg.on-brand']]],
  '08': [['Status', STATUSES.flatMap((s) => [`bg.${s}`, `bg.${s}-hover`, `bg.${s}-pressed`, `bg.${s}-subtle`, `fg.${s}`, `fg.on-${s}`, `border.${s}`])],
    ['Data', ['fg.positive', 'fg.negative', 'data.positive', 'data.negative', 'data.neutral', 'data.axis', 'data.gridline', ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `data.chart-${n}`)]]],
};

export function colorGuideMd(sys, cfg, report, contract) {
  const R = (p, m = 'Light', over) => { const v = sys.resolve(p, { Color: m }); return over ? flatten(v, sys.resolve(over, { Color: m })) : v; };
  const hex = (p, m) => R(p, m).slice(0, 7);
  const ratio = (a, b, m) => contrast(hex(a, m), hex(b, m));
  const role = new Map(contract.roles.map((r) => [r.name, r]));
  const aliasOf = (p, m) => { const v = sys.get(p).values[m]; const x = /^\{color\.([a-z-]+)\.(\d+)\}$/.exec(v); return x ? `${x[1]} ${x[2]}` : String(v).replace(/[{}]/g, '').replace(/^color\./, ''); };
  const pairsBy = {};
  for (const p of contract.pairs) pairsBy[`${p.fg}|${p.bg}|${p.over ?? ''}`] = p;
  const pr = (fg, bg, over = '') => pairsBy[`color.${fg}|color.${bg}|${over ? `color.${over}` : ''}`];
  const nPrim = [...sys.tokens.values()].filter((t) => t.collection === 'Primitives' && t.type === 'color').length;
  const documented = [];
  const roleTable = (title, paths) => {
    documented.push(...paths.map((p) => `color.${p}`));
    return `\n**${title}**\n\n` + table(['Role', 'Use it for', 'Light', 'Dark'], paths.map((p) => {
      const r = role.get(`color.${p}`);
      if (!r) throw new Error(`guide: unknown role color.${p}`);
      return [code(short(r.name)), r.use + (r.exempt && !/exempt/i.test(r.use) ? ' *Exempt from contrast.*' : ''), `${code(r.light)} · ${aliasOf(r.name, 'Light')}`, `${code(r.dark)} · ${aliasOf(r.name, 'Dark')}`];
    }));
  };
  const rules = (items) => `\n**Rules**\n\n${items.map(([t, b]) => `- **${t}.** ${b}`).join('\n')}\n`;
  const chapter = (n) => { const t = CHAPTERS.find(([x]) => x === n)[1]; return `\n---\n\n## ${t}\n\n`; };
  const see = (n) => { const t = CHAPTERS.find(([x]) => x === n)[1]; return `[${t}](#${t.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-')})`; };

  const minText = Math.min(...contract.pairs.filter((p) => p.kind === 'text').flatMap((p) => [p.light, p.dark]));

  let md = `# Colour\n\n`;
  md += `*${sys.name} foundations · colour · the written guide. Generated from the engine — brand ${code(cfg.color.brand)}, ${contract.roles.length} roles, ${contract.pairs.length} pairs each measured in Light and Dark, ${report.ok ? 'none failing' : 'SOME FAILING'}. Do not edit by hand; change the engine config and build again.*\n\n`;
  md += `This guide explains how colour works in ${sys.name} and how to use it: what the shades are, how roles are named, what may sit on what, and how Light, Dark and your brand fit in. It follows the same chapters as the Figma file, so you can read either one. Designers can stop after ${see('10')}; developers should also read the [handoff](HANDOFF.md). AI tools get the same rules as a rulebook and a machine-readable contract in the AI layer (${code('rules/color.md')}, ${code('color.contract.json')}).\n\n`;
  md += `**Contents**\n\n${CHAPTERS.map(([n]) => `- ${see(n)}`).join('\n')}\n`;

  // 01
  md += chapter('01');
  md += `Five principles shape every colour decision. Each one is something you can check, not just a belief.\n\n`;
  md += table(['Principle', 'What it means in practice'], [
    ['**Accessible by construction**', 'Every shade is solved so its contrast is known before anyone uses it. A pair that would fail is never generated.'],
    ['**Roles, not shades**', `Designs and code use named roles like ${code('bg/surface')}. A role carries its Light and Dark values and a promise about what it may sit on. A raw shade carries neither.`],
    ['**Never colour alone**', 'Anything colour says is also said by words, an icon, an underline or an arrow, so it reaches people who see colour differently.'],
    ['**Remapped, not inverted**', 'Dark mode points each role at a different shade chosen for the same contrast. Nothing is flipped by formula.'],
    ['**Measured, not assumed**', `${contract.pairs.length} allowed pairs are measured in both modes on every build. If one fails, the build stops — nobody has to remember to check.`],
  ]);

  // 02
  md += chapter('02');
  md += `Every shade has a **grade** from 0 (white) to 100 (black). A grade is measured darkness — how much contrast the shade has against white — not hue or saturation. The engine solves each shade so its brightness lands exactly on its grade, in every hue.\n\n`;
  md += `**Subtract to check a pair.** Take the darker grade minus the lighter one. The gap tells you the contrast, whatever the hues:\n\n`;
  md += table(['Gap', 'Contrast', 'Good enough for'], [
    ['40 or more', '≥ 3 : 1', 'Icons, input outlines, focus rings, chart marks, large text (24px+, or 18.7px bold)'],
    ['50 or more', '≥ 4.5 : 1', 'All text, at any size'],
    ['70 or more', '≥ 7 : 1', 'Enhanced contrast (AAA). Body text on the main surfaces already reaches it.'],
  ]);
  md += `\nWhy it works: grade *g* is defined as the brightness that gives a contrast of 21^(g/100) against white, so any two grades *a* and *b* have a contrast of 21^((b − a)/100). A gap of 50 gives 21^0.5 = 4.58 : 1.\n\n`;
  const ex = [['neutral.90', 'white', 'Body text on a white card', 4.5], ['brand.60', 'neutral.10', 'Brand text on a sunken well', 4.5], ['neutral.55', 'white', 'Input outline on white', 3], ['brand.40', 'brand.10', 'Brand 40 on brand 10', 4.5]];
  md += table(['Pair', 'Grades', 'Gap', 'Measured', 'Result'], ex.map(([a, b, label, min]) => {
    const ga = a === 'white' ? 0 : +a.split('.')[1], gb = b === 'white' ? 0 : +b.split('.')[1];
    const r = contrast(hex(`color.${a}`), hex(`color.${b}`));
    return [label, `${a} on ${b}`, String(ga - gb), `${fmt(r)} : 1`, r >= min ? `passes ${min} : 1` : `**fails** ${min} : 1 — gap too small`];
  }));
  md += `\n**The same gap in every hue.** Grade 10 against grade 60 in all six scales:\n\n`;
  md += table(HUES.map((h) => h[0].toUpperCase() + h.slice(1)), [HUES.map((h) => `${fmt(contrast(hex(`color.${h}.10`), hex(`color.${h}.60`)))} : 1`)]);
  md += `\nThe numbers barely move because every hue is solved to the same grades. That is what lets you reason about contrast without a checker.\n`;

  // 03
  md += chapter('03');
  md += `Colour comes in three tiers. Each tier only points to the one below it, so a change at the bottom flows all the way up.\n\n`;
  md += table(['Tier', 'In Figma', 'What it holds', 'Who touches it'], [
    ['**Shades** (primitives)', 'Primitives collection · one mode · hidden from publishing', 'Raw values from the engine. No meaning, no modes.', 'Nobody — the engine writes them'],
    ['**Roles**', 'Color collection · Light and Dark', 'Named by job. Each role points to a shade, per mode.', 'Everyone: designs and code use only this tier'],
    ['**Component colours**', 'Added with components', 'Point to roles, e.g. a button\'s fill.', 'Component authors (later phase)'],
  ]);
  md += `\nThis build has ${nPrim} shade variables and ${contract.roles.length} roles.\n\n`;
  md += `**Reading a name.** General to specific: category, group, role, and sometimes a state.\n\n`;
  md += `${code('color / fg / muted')} — category ${code('color')}, group ${code('fg')}, role ${code('muted')}.  \n${code('color / action / primary / bg-hover')} — group ${code('action')}, role ${code('primary / bg')}, state ${code('hover')}.\n\n`;
  md += `Role names say what something *does* (surface, muted, primary), never what colour it is. A role called "blue" would be wrong the day the brand changes.\n\n`;
  md += table(['Group', 'Paints', 'Shows in the Figma picker for', 'Explained in'], [
    [code('bg'), 'Pages, containers, fills', 'Frame and shape fills', 'Surfaces · Actions · Status'],
    [code('fg'), 'Text and icons', 'Text fills, icon shapes', 'Text · Actions · Status'],
    [code('border'), 'Outlines, dividers, focus', 'Strokes', 'Text · Actions · Status'],
    [code('action'), 'Buttons and their states', 'Fills, text, strokes', 'Actions and states'],
    [code('data'), 'Charts, trends, good and bad change', 'Shape fills, strokes', 'Status and data'],
    [code('shadow'), 'Shadow strengths the elevation levels pick from', 'Effects', 'Surfaces and depth'],
  ]);
  md += `\n**One name, three places.** Designers and developers say the same word for the same colour:\n\n`;
  const eg = role.get('color.fg.muted');
  md += table(['Figma variable', 'CSS', 'Tailwind'], [[code(eg.figma), code(`var(${eg.css})`), code(eg.tailwind)]]);

  // 04
  md += chapter('04');
  md += `The raw shades every role is built from: six hues, ${GRADES.length} grades each. They are hidden from publishing — you meet them through roles, never directly.\n\n`;
  md += `- **Brand** — built around your brand's hue. Saturation peaks mid-scale and tapers towards white and black.\n- **Neutral** — your brand hue at very low saturation, so greys feel related to the brand without looking tinted.\n- **Status** — success, warning, danger and info keep fixed hues, so their meaning never shifts with a rebrand.\n- **Extras** — chart shades tuned for colour-blind readers, and see-through blacks and whites for shadows and hover tints.\n\n`;
  md += table(['Grade', ...HUES, 'vs white', 'vs black'], GRADES.map((g) => [String(g), ...HUES.map((h) => code(hex(`color.${h}.${g}`))),
    `${fmt(contrast(hex(`color.neutral.${g}`), '#FFFFFF'))}`, `${fmt(contrast(hex(`color.neutral.${g}`), '#000000'))}`]));
  md += `\nContrast columns are measured on the neutral scale; other hues sit within a few hundredths of the same values.\n`;
  md += rules([['Never use a shade in a design', `${code('brand/60')} has no Light/Dark pair and no list of safe backgrounds. Pick the role that points to it.`],
    ['Never edit a shade by hand', 'Shades are solved for contrast. Change the brand in the engine config and every shade is solved again.']]);

  // 05
  md += chapter('05');
  md += `Surfaces say what belongs together and what sits on top. Use the lowest surface that does the job, and let elevation — not extra colours — show that something floats.\n\n`;
  md += table(['Surface', 'What goes on it'], [
    [code('bg/canvas'), 'The page. Everything else sits on it.'], [code('bg/surface'), 'Cards, panels, tables — the default home for content.'],
    [code('bg/surface-sunken'), 'Set back inside a surface: table heads, wells, code blocks.'], [code('bg/surface-raised'), 'Stays above scrolling content: sticky headers, toolbars.'],
    [code('bg/surface-overlay'), 'Opens on top: menus, popovers, dialogs.'], [code('bg/selected'), 'The chosen item, together with a check or bold label.'],
  ]);
  md += `\n**Elevation is surface + shadow + outline** (the levels are named by job in the Elevation foundation). In Light the upper surfaces are white, so shadow and outline separate them; in Dark, higher surfaces are also lighter. Using all three means depth still reads when one fails — shadows are hard to see on dark backgrounds, and a slight change of surface is hard to see for some people.\n\n`;
  md += table(['Level', 'Surface', 'Shadow', 'Outline'], [
    ['Page', code('bg/canvas'), '—', '—'], ['Raised: cards', code('bg/surface'), code('shadow/1'), 'optional'],
    ['Sticky: headers, toolbars', code('bg/surface-raised'), code('shadow/2'), `${code('border/subtle')}, toward the content`], ['Floating: menus, popovers, toasts', code('bg/surface-overlay'), code('shadow/3'), code('border/floating')],
    ['Modal: dialogs', code('bg/surface-overlay'), code('shadow/4'), `${code('border/floating')} + ${code('bg/scrim')} behind`],
  ]);
  for (const [t, ps] of GROUPS['05']) md += roleTable(t, ps);
  md += rules([['Use the lowest surface that works', `Most content belongs on ${code('bg/surface')}. Raised and overlay are for things that truly sit above the page.`],
    ['Overlays always get an outline', `Menus, popovers and dialogs use ${code('bg/surface-overlay')} with ${code('border/floating')} — never a shadow alone. The levels themselves are in the Elevation foundation.`],
    ['Dim the page behind modal dialogs', `${code('bg/scrim')} sits between the page and the dialog so attention stays on the dialog.`]]);

  // 06
  md += chapter('06');
  md += `Three text levels are enough for almost any screen. Icons get the weight of the text beside them. Outlines come in two kinds: the ones that only separate, and the ones that show where a control is.\n\n`;
  const t3 = [['fg.default', 'Main content and headings. If in doubt, use this.'], ['fg.muted', 'Supporting details people read after the main line.'], ['fg.subtle', 'Timestamps, captions, placeholders — still 4.5 : 1.'], ['fg.link', 'Links — always underlined.']];
  md += table(['Role', 'Use it for', 'On bg/surface (Light · Dark)'], t3.map(([p, use]) => [code(short(`color.${p}`)), use, `${fmt(ratio(`color.${p}`, 'color.bg.surface', 'Light'))} · ${fmt(ratio(`color.${p}`, 'color.bg.surface', 'Dark'))}`]));
  md += `\n**Icons** need 3 : 1 against their background. Use ${code('fg/icon')} beside a label, ${code('fg/icon-subtle')} for chevrons and decoration, the intent colour (${code('fg/success')} …) for status icons, and the button's own ${code('action/…/fg')} inside a button.\n\n`;
  md += `**Two kinds of outline.** Ask one question: *would someone miss the control if this line disappeared?*\n\n`;
  md += `- **No — it only separates content** (dividers, card edges): ${code('border/subtle')} or ${code('border/default')}. Decorative, so exempt from contrast.\n- **Yes — it shows where a control is** (inputs, checkboxes, secondary buttons): ${code('border/input')} or ${code('border/strong')}. These must reach 3 : 1 — ${code('border/input')} on ${code('bg/surface')} measures ${fmt(ratio('color.border.input', 'color.bg.surface', 'Light'))} : 1 in Light and ${fmt(ratio('color.border.input', 'color.bg.surface', 'Dark'))} : 1 in Dark.\n`;
  for (const [t, ps] of GROUPS['06']) md += roleTable(t, ps);
  md += rules([['No custom greys', `A lighter grey for "less important" is unchecked and often fails on hover or selected rows. Use ${code('fg/muted')} or ${code('fg/subtle')}.`],
    ['Placeholders are not labels', `They vanish when people type. Keep a visible label in ${code('fg/default')}.`],
    ['Brand text is for short emphasis', `Long passages in ${code('fg/brand')} tire the eye and look like links.`]]);

  // 07
  md += chapter('07');
  md += `Buttons are named by importance, not colour. Every interactive state has its own role, and states move in the direction that keeps the label readable.\n\n`;
  md += table(['Kind', 'Use for', 'Label on fill (Light · Dark)'], [['primary', 'The main action — one per view'], ['secondary', 'An alternative to the main action'], ['ghost', 'Quiet actions, toolbars, actions inside cards'], ['danger', 'Deleting, or anything that can\'t be undone']].map(([k, u]) => {
    const bg = k === 'ghost' ? 'color.bg.surface' : `color.action.${k}.bg`;
    return [code(`action/${k}`), u, `${fmt(ratio(`color.action.${k}.fg`, bg, 'Light'))} · ${fmt(ratio(`color.action.${k}.fg`, bg, 'Dark'))}${k === 'ghost' ? ' (on surface)' : ''}`];
  }));
  md += `\n**How states are made.** A fill at grade 50 or darker takes white labels; a lighter fill takes black labels. Hover and pressed step the fill along its scale — usually darker, or lighter when the fill is already near the end of its range — and the label keeps a gap of 50 or more at every step. The four sample brands:\n\n`;
  md += table(['Brand', 'Hex', 'Brand grade', 'Fill grade', 'Label', 'Default · Hover · Pressed'], SAMPLE_BRANDS.map(([label, h]) => {
    const b = build({ color: { brand: h } }).sys; const B = (p) => b.resolve(p, { Color: 'Light' });
    const on = B('color.fg.on-brand');
    return [label, code(h), (+gradeOf(h)).toFixed(1), String(Math.round(gradeOf(B('color.bg.brand')))), on === '#FFFFFF' ? 'white' : 'black',
      ['color.bg.brand', 'color.bg.brand-hover', 'color.bg.brand-pressed'].map((p) => `${fmt(contrast(on, B(p)))}`).join(' · ')];
  }));
  md += `\n**Hover on any surface.** Low surfaces (${code('bg/canvas')}, ${code('bg/surface')}, ${code('bg/surface-sunken')}) take the translucent tints ${code('bg/state-hover')} and ${code('bg/state-pressed')}. Inside menus, popovers, dialogs and raised cards use the solid ${code('bg/item-hover')} and ${code('bg/item-pressed')} instead. Why: in Dark, lifting a menu or dialog surface even slightly closes the gap to the text on it — brand text measured 2.8 : 1 when we tried a tint there. Rows on a plain surface can also use the solid ${code('bg/surface-hover')} and ${code('bg/surface-pressed')}.\n\n`;
  md += `**Three states people confuse.**\n\n- **Selected** — the chosen one, until changed: ${code('bg/selected')} plus a check or bold label; a selected option or card also gets a ${code('border/selected')} outline, one pixel wider than a control's (Border foundation).\n- **Focused** — where the keyboard is: a 2px ${code('border/focus')} ring with a 2px gap. Never removed.\n- **Disabled** — exempt from contrast, so explain nearby why it's disabled; never hide information in disabled text.\n`;
  for (const [t, ps] of GROUPS['07']) md += roleTable(t, ps);
  md += rules([['One primary per view', 'Two primary buttons make people choose between equals. Make the second one secondary.'],
    ['Ghost buttons don\'t go in sunken wells', `Brand text on a tinted well lands right on 4.5 : 1 — move the button or use secondary.`],
    ['Never remove the focus ring', `Keyboard users lose their place. Restyle it only through ${code('border/focus')}.`]]);

  // 08
  md += chapter('08');
  md += `Four intents say what happened. Data has its own roles for good and bad change and for chart series, tuned so they read for everyone — including people with colour-blindness.\n\n`;
  md += table(['Intent', 'Means', 'Typical words'], [['success', 'Something finished as expected.', 'Saved · Sent · Verified'], ['warning', 'Needs attention soon; nothing is broken yet.', 'Expires soon · Almost full · Pending'],
    ['danger', 'Something failed, or can\'t be undone.', 'Failed · Rejected · Delete'], ['info', 'Neutral news people may want.', 'New · Updated · Tip']].map(([i, m, w]) => [code(i), m, w]));
  md += `\n**Messages** use the tinted background (${code('bg/success-subtle')} …), an icon in the intent colour (${code('fg/success')} …) and normal text (${code('fg/default')}, ${code('fg/muted')}). **Badges** use the solid fill (${code('bg/success')} …) with its partner ${code('fg/on-success')} … and a word, not just a dot.\n\n`;
  md += `**Good and bad change.** Colour says whether a change is good or bad; the arrow says which way it went. They are separate questions: a falling error rate is good news, so it is ${code('fg/positive')} with ▼. Decide good or bad per metric, then add the arrow or sign.\n\n`;
  md += `The engine keeps positive and negative far enough apart for every common type of colour vision (OKLab distance, minimum 0.10):\n\n`;
  md += table(['Mode', ...CVD_TYPES], ['Light', 'Dark'].map((m) => [m, ...CVD_TYPES.map((t) => distance(hex('color.data.positive', m), hex('color.data.negative', m), t).toFixed(3))]));
  const chartMin = (m) => { let lo = Infinity; const c = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => hex(`color.data.chart-${n}`, m)); for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) for (const t of CVD_TYPES.slice(1)) lo = Math.min(lo, distance(c[i], c[j], t)); return lo; };
  md += `\n**Chart series.** Use the eight series in order (${code('data/chart-1')}, ${code('data/chart-2')} …). Every pair stays at least 0.07 apart for the three common colour-vision types — the worst pair measures ${chartMin('Light').toFixed(3)} in Light and ${chartMin('Dark').toFixed(3)} in Dark (for comparison, the widely used Okabe-Ito palette scores 0.076) — and every mark keeps 3 : 1 on the surface. Still label series directly or with a legend.\n`;
  for (const [t, ps] of GROUPS['08']) md += roleTable(t, ps);
  md += rules([['Words first, colour second', 'Write the status in words, then add colour and an icon. Never the other way round.'],
    ['Changes always carry an arrow or sign', 'Red and green look alike to about 1 in 12 men. The arrow makes the change readable — and it shows direction, which colour doesn\'t.'],
    ['Decide good or bad per metric', `Fewer errors, lower cost and faster load are good news: ${code('fg/positive')} with ▼. Pick the role by meaning, not by direction.`],
    ['Brand is not an intent', 'Brand colour means "this is us", not "this worked".']]);

  // 09
  md += chapter('09');
  md += `Every text, icon and outline role lists the backgrounds it may sit on, and every listed pair is measured in both modes. **If a pair isn't listed, it isn't supported.** Each cell shows Light · Dark; — means not allowed.\n\n`;
  const lr = (p) => (p ? `${fmt(p.light)} · ${fmt(p.dark)}` : '—');
  const matrix = (fgs) => table(['', ...TEXT_BGS.map((b) => code(`bg/${b}`))], fgs.map((f) => [code(short(`color.${f}`)), ...TEXT_BGS.map((b) => lr(pr(f, `bg.${b}`)))]));
  md += `**Text** (needs 4.5 : 1)\n\n` + matrix(['fg.default', 'fg.muted', 'fg.subtle', 'fg.brand', 'fg.link', 'fg.success', 'fg.warning', 'fg.danger', 'fg.info', 'fg.positive', 'fg.negative']);
  md += `\n**Icons** (needs 3 : 1)\n\n` + matrix(['fg.icon', 'fg.icon-subtle']);
  md += `\n**Outlines that show a control** (needs 3 : 1)\n\n` + matrix(['border.input', 'border.strong', 'border.focus', 'border.selected', 'border.danger']);
  md += `\n**Solid fills** take their partner on- colour and nothing else:\n\n`;
  md += table(['Fill', 'Text on it', 'Light · Dark'], [...['brand', ...STATUSES].map((s) => [`bg.${s}`, `fg.on-${s}`]), ...['primary', 'danger'].map((k) => [`action.${k}.bg`, `action.${k}.fg`])]
    .map(([b, f]) => [code(short(`color.${b}`)), code(short(`color.${f}`)), lr(pr(f, b))]));
  md += `\n**Tints over surfaces.** Hover and pressed tints are measured on top of each surface they're allowed on:\n\n`;
  md += table(['Tint', 'Over', 'fg/default', 'fg/muted', 'fg/brand'], ['state-hover', 'state-pressed'].flatMap((t) => ['canvas', 'surface', 'surface-sunken'].map((o) => [code(`bg/${t}`), code(`bg/${o}`),
    ...['fg.default', 'fg.muted', 'fg.brand'].map((f) => lr(pr(f, `bg.${t}`, `bg.${o}`)))])));
  md += `\nThe lowest text ratio anywhere in the contract is ${fmt(minText)} : 1.\n\n`;
  md += `**Not allowed** — pairs outside the contract, measured. Each fails in at least one mode, and each has a role that fixes it:\n\n`;
  md += table(['Mistake', 'Pair', 'Light', 'Dark', 'Use instead'], contract.notAllowed.map((b) => [b.label, `${code(short(b.fg))} on ${code(short(b.bg))}`, `${b.light} : 1`, `${b.dark} : 1`, code(short(b.fix))]));
  md += rules([['Solid fills take their on- colour', `On ${code('bg/brand')}, ${code('bg/danger')} and the other solids, text is always the matching ${code('fg/on-*')}.`],
    ['Unlisted means unsupported', `If you need a pair that isn't here, it's a new role or a new pair — see ${see('11')}.`]]);

  // 10
  md += chapter('10');
  md += `Two questions get you to the right role almost every time: *what are you colouring?* and *what is its job?* Then check your choice against ${see('09')}.\n`;
  for (const d of contract.decisions) md += `\n**${d.what}** — ${d.question}\n\n` + table(['When', 'Use'], d.answers.map(([w, r]) => [w, roles(r)]));
  md += `\n**Worked example — a project row.** Coloured one decision at a time:\n\n`;
  md += table(['Part', 'Role', 'Why'], [['The row', code('bg/surface'), 'It sits on a card.'], ['Project name', code('fg/default'), 'It is the main content.'], ['Team and size', code('fg/muted'), 'They support the name.'],
    ['"▲ 8 done this week"', `${code('fg/positive')} + ▲`, 'A good change — colour plus arrow.'], ['Divider', code('border/subtle'), 'It only separates rows.'], ['"+ New"', code('action/ghost'), 'A quiet action inside a card.']]);
  md += `\n**Do and avoid**\n\n`;
  md += table(['Do', 'Avoid', 'Why it matters'], [
    ['Show change with an arrow: ▲ +2.4%', 'Colour alone: +2.4% in green', 'Red and green look alike to many people. The arrow carries the meaning.'],
    ['Underline links', 'Links shown by colour only', 'Without an underline, a link is just blue text to anyone who can\'t tell blue from black.'],
    [`${code('action/primary/fg')} on the primary fill`, `${code('fg/brand')} on the brand fill`, `Brand text on the brand fill is ${fmt(ratio('color.fg.brand', 'color.bg.brand', 'Light'))} : 1 — the label disappears.`],
    [`Inputs use ${code('border/input')}`, `Inputs with ${code('border/subtle')}`, 'If people can\'t see a field\'s edge, they can\'t find where to type.'],
  ]);

  // 11
  md += chapter('11');
  md += `Dark mode is remapped, not inverted, and your brand is one input to the engine. Design once with roles; the mode and the brand do the rest.\n\n`;
  md += `**How roles move between modes.** In Light, text points to dark shades (high grades) and backgrounds to light ones; in Dark it's the other way round. The gap between them stays 50 or more either way.\n\n`;
  md += table(['Role', 'Light points to', 'Dark points to'], ['bg.canvas', 'bg.surface', 'bg.surface-raised', 'bg.surface-overlay', 'fg.default', 'fg.muted', 'fg.subtle', 'fg.brand', 'border.input', 'border.focus']
    .map((p) => [code(short(`color.${p}`)), aliasOf(`color.${p}`, 'Light'), aliasOf(`color.${p}`, 'Dark')]));
  md += `\n**Switching modes.** In Figma, set the frame's Color mode in the right panel. In code, set ${code('data-theme="dark"')} (or ${code('"light"')}) on ${code('<html>')}; without it the page follows the system setting.\n\n`;
  md += `**Checking a design in Dark** — four checks before handoff:\n\n- **Switch the frame, not the colours.** Change the mode; don't swap role names.\n- **Look for anything that didn't change.** It's a raw hex or a shade — replace it with a role.\n- **Check images.** White backgrounds inside images glow in Dark. Use transparent images or put a surface behind them.\n- **Don't trust shadows.** Shadows fade on dark surfaces; floating things also need their lighter surface and an outline.\n\n`;
  md += `**What a brand change touches**\n\n`;
  md += table(['Follows your brand', 'Fixed on purpose'], [['The brand scale and every brand role', 'Success, warning, danger and info hues'], ['Primary buttons, links, selection, focus', 'Positive and negative change'],
    ['Neutral greys, tinted slightly towards your hue', 'The chart palette'], ['The label colour on the brand fill', 'Every contrast rule and check']]);
  md += `\n**Changing the brand.** Set ${code('color.brand')} in the engine config, build, read the report, then import the new variables into Figma and ship the new ${code('tokens.css')}. Nothing in designs or code needs renaming.\n\n`;
  const product = contract.roles.filter((r) => r.chapter === 'Product roles');
  if (product.length) {
    md += `**Roles added for this product** — defined in the engine config (${code('color.roles')}) and measured like every other role:\n`;
    md += roleTable('Product roles', product.map((r) => r.name.replace(/^color\./, '')));
    md += `\nTheir pairs:\n\n` + table(['Foreground', 'Background', 'Needs', 'Light · Dark'], contract.pairs.filter((p) => product.some((r) => r.name === p.fg || r.name === p.bg))
      .map((p) => [code(short(p.fg)), code(short(p.bg)), `${p.min} : 1`, `${fmt(p.light)} · ${fmt(p.dark)}`])) + '\n';
  }
  md += `**Adding a role.** First check ${see('10')} — most needs already have a role. If none fits, name the new role by its job, not its colour, pick its Light and Dark grades with the gap rule against everything it will touch, and add it to the engine config. The build measures every pair and stops if one fails; when it passes, the role is in Figma, CSS, Tailwind, this guide and the AI contract at once. Wanting a one-off colour is the signal to add a role — never to use a shade.\n\n`;
  md += '```json\n' + JSON.stringify({ color: { roles: [
    { name: 'color.bg.highlight', light: 'warning.5', dark: 'warning.90', description: 'Highlights a new or changed row for a few seconds', carries: ['color.fg.default', 'color.fg.muted', 'color.fg.link'] },
    { name: 'color.border.highlight', light: 'warning.45', dark: 'warning.40', description: 'Outline of a highlighted row', on: ['color.bg.surface', 'color.bg.canvas'] }] } }, null, 2) + '\n```\n\n';
  md += `A background lists the roles it ${code('carries')}; a text, icon, outline or data colour lists the backgrounds it sits ${code('on')}. Shades are written as ${code('hue.grade')} (or ${code('white')} / ${code('black')}) — never hex; the engine solves the colour.\n`;

  // Reference
  md += `\n---\n\n## Accessibility reference\n\nWhat the build checks for colour, and the result for this build:\n\n`;
  md += table(['Check', 'What it checks', 'WCAG', 'Result'], report.checks.filter((c) => c.foundation === 'Colour' || ['F2', 'E1', 'X1'].includes(c.id)).map((c) => [c.id, c.title, c.wcag === '—' ? '—' : `${c.wcag} (${c.level})`, `${c.status} · ${c.summary}`]));
  md += `\n**Glossary**\n\n`;
  md += table(['Term', 'Meaning'], [['Grade', 'A shade\'s darkness from 0 (white) to 100 (black), defined by its contrast with white.'], ['Shade / primitive', 'A raw colour value such as brand 60. Hidden; never used directly.'],
    ['Role', 'A named job such as bg/surface that points to a shade per mode.'], ['Pair', 'A foreground role and a background role that are allowed together, with a minimum ratio.'],
    ['On- colour', 'The text role made for a solid fill, such as fg/on-brand on bg/brand.'], ['Tint', 'A see-through layer (hover, pressed, scrim) measured over the surface below it.'],
    ['Mode', 'Light or Dark. Switching mode changes which shade each role points to.'], ['Exempt', 'A role WCAG doesn\'t require contrast for: disabled colours and purely decorative lines.']]);

  // Every role documented exactly once.
  const all = contract.roles.map((r) => r.name);
  const missing = all.filter((n) => !documented.includes(n));
  const dupes = documented.filter((n, i) => documented.indexOf(n) !== i);
  if (missing.length || dupes.length) throw new Error(`guide: roles missing ${missing.join(', ')} / duplicated ${dupes.join(', ')}`);
  return md;
}
