#!/usr/bin/env node
// Copies the generated colour, typography, spacing, layout, radius, border, elevation and motion docs and AI files from out/default into the product folders next to the engine.
// Run after `npm run build`. Overwrites in place (no deletes), so it works in folders where deleting is blocked.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../src/build.js';
import { toCss } from '../src/export/css.js';

const engine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(engine, 'out/default');
const product = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(engine, '..');
const copies = [
  ['docs/color/GUIDE.md', '02-foundations/color/GUIDE.md'],
  ['tokens.css', '02-foundations/color/demo/tokens.css'],
  ['ai/rules/color.md', '04-ai-layer/color/color.md'],
  ['ai/color.contract.json', '04-ai-layer/color/color.contract.json'],
  ['docs/typography/GUIDE.md', '02-foundations/typography/GUIDE.md'],
  ['tokens.css', '02-foundations/typography/demo/tokens.css'],
  ['ai/rules/typography.md', '04-ai-layer/typography/typography.md'],
  ['ai/typography.contract.json', '04-ai-layer/typography/typography.contract.json'],
  ['docs/spacing/GUIDE.md', '02-foundations/spacing/GUIDE.md'],
  ['tokens.css', '02-foundations/spacing/demo/tokens.css'],
  ['ai/rules/spacing.md', '04-ai-layer/spacing/spacing.md'],
  ['ai/spacing.contract.json', '04-ai-layer/spacing/spacing.contract.json'],
  ['docs/layout/GUIDE.md', '02-foundations/layout/GUIDE.md'],
  ['tokens.css', '02-foundations/layout/demo/tokens.css'],
  ['ai/rules/layout.md', '04-ai-layer/layout/layout.md'],
  ['ai/layout.contract.json', '04-ai-layer/layout/layout.contract.json'],
  ['docs/radius/GUIDE.md', '02-foundations/radius/GUIDE.md'],
  ['tokens.css', '02-foundations/radius/demo/tokens.css'],
  ['ai/rules/radius.md', '04-ai-layer/radius/radius.md'],
  ['ai/radius.contract.json', '04-ai-layer/radius/radius.contract.json'],
  ['docs/border/GUIDE.md', '02-foundations/border/GUIDE.md'],
  ['tokens.css', '02-foundations/border/demo/tokens.css'],
  ['ai/rules/border.md', '04-ai-layer/border/border.md'],
  ['ai/border.contract.json', '04-ai-layer/border/border.contract.json'],
  ['docs/elevation/GUIDE.md', '02-foundations/elevation/GUIDE.md'],
  ['tokens.css', '02-foundations/elevation/demo/tokens.css'],
  ['ai/rules/elevation.md', '04-ai-layer/elevation/elevation.md'],
  ['ai/elevation.contract.json', '04-ai-layer/elevation/elevation.contract.json'],
  ['docs/motion/GUIDE.md', '02-foundations/motion/GUIDE.md'],
  ['tokens.css', '02-foundations/motion/demo/tokens.css'],
  ['ai/rules/motion.md', '04-ai-layer/motion/motion.md'],
  ['ai/motion.contract.json', '04-ai-layer/motion/motion.contract.json'],
];
for (const [from, to] of copies) {
  const src = path.join(out, from), dst = path.join(product, to);
  if (!fs.existsSync(src)) { console.error(`Missing ${from} — run npm run build first.`); process.exit(1); }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, fs.readFileSync(src));
  console.log(`${from}  →  ${path.relative(engine, dst)}`);
}
// The border demo switches to a product built with heavier controls ("border": { "control": 2 }).
{
  const heavy = build({ border: { control: 2 } });
  const dst = path.join(product, '02-foundations/border/demo/tokens-control-2.css');
  fs.writeFileSync(dst, toCss(heavy.sys, heavy.cfg));
  console.log(`(control: 2 build)  →  ${path.relative(engine, dst)}`);
}
