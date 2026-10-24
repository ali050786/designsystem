#!/usr/bin/env node
// Usage: node src/cli.js [config.json] [outDir]
// Builds every output. Exits with code 1 if any A/AA check fails (outputs are still written for inspection).
import fs from 'node:fs';
import path from 'node:path';
import { build } from './build.js';
import { toTokensJson, toFigmaFiles } from './export/dtcg.js';
import { toCss, toTailwindTheme } from './export/css.js';
import { toAiFiles } from './export/ai.js';
import { toReportHtml } from './export/report.js';
import { colorContract } from './export/ai-color.js';
import { colorGuideMd } from './export/guide-color.js';
import { typeContract } from './export/ai-type.js';
import { typeGuideMd } from './export/guide-type.js';
import { spaceContract } from './export/ai-space.js';
import { spaceGuideMd } from './export/guide-space.js';
import { layoutContract } from './export/ai-layout.js';
import { layoutGuideMd } from './export/guide-layout.js';
import { radiusContract } from './export/ai-radius.js';
import { radiusGuideMd } from './export/guide-radius.js';
import { borderContract } from './export/ai-border.js';
import { borderGuideMd } from './export/guide-border.js';
import { elevationContract } from './export/ai-elevation.js';
import { elevationGuideMd } from './export/guide-elevation.js';
import { motionContract } from './export/ai-motion.js';
import { motionGuideMd } from './export/guide-motion.js';

export function writeAll(userConfig, outDir) {
  const { cfg, sys, report } = build(userConfig);
  const write = (rel, content) => {
    const f = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`);
  };
  try { fs.rmSync(outDir, { recursive: true, force: true }); } catch { /* no delete permission: overwrite in place */ }
  write('tokens.json', toTokensJson(sys));
  for (const [name, json] of Object.entries(toFigmaFiles(sys))) write(`figma/${name}`, json);
  write('tokens.css', toCss(sys, cfg));
  write('tailwind.theme.css', toTailwindTheme(sys, cfg));
  for (const [name, md] of Object.entries(toAiFiles(sys, cfg, report))) write(`ai/${name}`, md);
  write('docs/color/GUIDE.md', colorGuideMd(sys, cfg, report, colorContract(sys, cfg, report)));
  write('docs/typography/GUIDE.md', typeGuideMd(sys, cfg, report, typeContract(sys, cfg, report)));
  write('docs/spacing/GUIDE.md', spaceGuideMd(sys, cfg, report, spaceContract(sys, cfg, report)));
  write('docs/layout/GUIDE.md', layoutGuideMd(sys, cfg, report, layoutContract(sys, cfg, report)));
  write('docs/radius/GUIDE.md', radiusGuideMd(sys, cfg, report, radiusContract(sys, cfg, report)));
  write('docs/border/GUIDE.md', borderGuideMd(sys, cfg, report, borderContract(sys, cfg, report)));
  write('docs/elevation/GUIDE.md', elevationGuideMd(sys, cfg, report, elevationContract(sys, cfg, report)));
  write('docs/motion/GUIDE.md', motionGuideMd(sys, cfg, report, motionContract(sys, cfg, report)));
  write('report.html', toReportHtml(sys, cfg, report));
  write('report.json', { name: sys.name, brand: cfg.color.brand, ok: report.ok, blocking: report.blocking, notes: sys.notes, checks: report.checks });
  return { cfg, sys, report };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('cli.js')) {
  const [cfgPath, outDir = 'out'] = process.argv.slice(2);
  const userConfig = cfgPath ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
  let built;
  try { built = writeAll(userConfig, outDir); } catch (e) {
    // Config mistakes (refused roles or styles, bad scales) are messages for people, not crashes.
    if (/^(typography|color|spacing|layout|radius|border|elevation|motion)[.: ]/.test(e.message)) { console.error(`✕ Config refused — ${e.message}`); process.exit(2); }
    throw e;
  }
  const { sys, report } = built;
  for (const c of report.checks) console.log(`${c.status.padEnd(4)}  ${c.id.padEnd(3)} ${c.summary.padEnd(12)} ${c.title}`);
  console.log(`\n${sys.name}: ${sys.tokens.size} tokens → ${outDir}/  ·  ${report.ok ? 'PASS' : `FAIL (${report.blocking.join(', ')})`}`);
  process.exit(report.ok ? 0 : 1);
}
