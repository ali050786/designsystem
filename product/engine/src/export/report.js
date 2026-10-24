// Self-contained HTML check report (the same checker later powers paid audits).
import { contrast } from '../color-math.js';
import { GRADES } from '../grades.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const textOn = (hex) => (contrast(hex.slice(0, 7), '#FFFFFF') >= contrast(hex.slice(0, 7), '#000000') ? '#FFFFFF' : '#000000');

function swatchRow(sys, hue) {
  return `<div class="ramp">${GRADES.map((g) => {
    const hex = sys.resolve(`color.${hue}.${g}`);
    return `<div class="sw" style="background:${hex};color:${textOn(hex)}" title="color.${hue}.${g} ${hex}"><b>${g}</b><span>${hex}</span></div>`;
  }).join('')}</div>`;
}

function itemLine(c, i) {
  if ('ratio' in i) {
    return `<tr class="${i.ok ? '' : 'bad'}"><td>${i.mode}</td><td><span class="chip" style="background:${i.bgHex ?? ''};color:${i.fgHex ?? ''};border-color:${i.fgHex ?? ''}">Aa</span> <code>${esc(i.fg)}</code> on <code>${esc(i.bg)}</code></td><td>${i.ratio}:1</td><td>≥ ${i.min}</td><td>${i.ok ? '✓' : '✗'}</td></tr>`;
  }
  if ('worst' in i) {
    return `<tr class="${i.ok ? '' : 'bad'}"><td>${i.mode}</td><td><span class="dot" style="background:${i.aHex}"></span><span class="dot" style="background:${i.bHex}"></span> <code>${esc(i.a.replace('color.data.', ''))}</code> vs <code>${esc(i.b.replace('color.data.', ''))}</code></td><td>${(+i.worst).toFixed(3)}</td><td>≥ ${i.min}</td><td>${i.ok ? '✓' : '✗'}</td></tr>`;
  }
  const label = i.token ?? i.item;
  const ctx = [i.bp, i.density, i.mode].filter(Boolean).join(' · ');
  const val = i.value ?? i.size ?? i.ratio ?? (i.large !== undefined ? (i.large ? 'large' : 'normal') : '');
  const lim = i.min !== undefined ? `≥ ${i.min}` : i.max !== undefined ? `≤ ${i.max}` : '';
  return `<tr class="${i.ok ? '' : 'bad'}"><td>${esc(ctx)}</td><td><code>${esc(label)}</code></td><td>${esc(val)}</td><td>${lim}</td><td>${i.ok ? '✓' : '✗'}</td></tr>`;
}

export function toReportHtml(sys, cfg, report) {
  const counts = { pass: 0, fail: 0, warn: 0, info: 0 };
  report.checks.forEach((c) => counts[c.status]++);
  const pairs = report.checks.filter((c) => ['C1', 'C3', 'C4'].includes(c.id)).reduce((n, c) => n + c.items.length, 0);
  const hues = ['brand', 'neutral', 'success', 'warning', 'danger', 'info'];

  const checksHtml = report.checks.map((c) => `
  <details class="check ${c.status}" ${c.status === 'fail' ? 'open' : ''}>
    <summary><span class="badge ${c.status}">${c.status}</span><b>${c.id}</b> ${esc(c.title)} <span class="meta">WCAG ${esc(c.wcag)} · ${c.level} · ${esc(c.foundation)} · ${esc(c.summary)}</span></summary>
    <div class="scroll"><table><thead><tr><th>Context</th><th>What</th><th>Value</th><th>Needs</th><th></th></tr></thead><tbody>${c.items.map((i) => itemLine(c, i)).join('')}</tbody></table></div>
  </details>`).join('');

  const preview = (m) => {
    const v = (p) => sys.resolve(p, { Color: m });
    return `<div class="preview" style="background:${v('color.bg.canvas')};color:${v('color.fg.default')}">
      <div class="card" style="background:${v('color.bg.surface')};border-color:${v('color.border.default')}">
        <div style="color:${v('color.fg.muted')};font-size:13px">${m} · Active users</div>
        <div style="font-size:28px;font-weight:600;font-variant-numeric:tabular-nums">12,480</div>
        <div style="font-variant-numeric:tabular-nums"><span style="color:${v('color.fg.positive')}">▲ +2.4% this week</span> &nbsp; <span style="color:${v('color.fg.negative')}">▲ +0.4 s load time</span></div>
        <div class="bars">${[1, 2, 3, 4, 5, 6, 7, 8].map((n, k) => `<i style="background:${v(`color.data.chart-${n}`)};height:${30 + ((k * 37) % 50)}px"></i>`).join('')}</div>
        <div class="row"><span class="btn" style="background:${v('color.bg.brand')};color:${v('color.fg.on-brand')}">Save</span>
        <span class="btn" style="background:${v('color.bg.danger')};color:${v('color.fg.on-danger')}">Delete</span>
        <span class="field" style="border-color:${v('color.border.input')};color:${v('color.fg.subtle')}">Project name</span>
        <span class="btn focus" style="background:${v('color.bg.surface')};color:${v('color.fg.default')};border:1px solid ${v('color.border.strong')};outline:2px solid ${v('color.border.focus')};outline-offset:2px">Focused</span></div>
        <div class="alert" style="background:${v('color.bg.warning-subtle')};color:${v('color.fg.default')}"><b style="color:${v('color.fg.warning')}">⚠ Storage almost full</b> — 92% of 50 GB used.</div>
      </div></div>`;
  };

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(sys.name)} check report</title>
<style>
:root{--bg:#fff;--fg:#1a1c21;--mut:#5b6170;--line:#e3e5ea;--pass:#0f7a3b;--fail:#b3261e;--warn:#8a5a00;--info:#2d5bd7}
@media (prefers-color-scheme:dark){:root{--bg:#15171b;--fg:#eceef2;--mut:#a5abb8;--line:#2b2f37;--pass:#5fd08a;--fail:#ff8a80;--warn:#f1c35b;--info:#8fb0ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 16px 64px}h1{font-size:26px;margin:0 0 4px}h2{font-size:18px;margin:36px 0 12px}
.sub{color:var(--mut)}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0}
.stat{border:1px solid var(--line);border-radius:10px;padding:12px}.stat b{display:block;font-size:24px}
.ok{color:var(--pass)}.no{color:var(--fail)}
.ramp{display:grid;grid-template-columns:repeat(19,1fr);gap:2px;margin:4px 0 10px;overflow-x:auto}
.sw{min-width:44px;height:58px;padding:4px;font-size:10px;display:flex;flex-direction:column;justify-content:space-between;border-radius:4px}.sw span{opacity:.85}
.hue{font-size:13px;color:var(--mut);margin-top:8px}
.previews{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px}
.preview{padding:16px;border-radius:12px}.card{border:1px solid;border-radius:10px;padding:16px;display:grid;gap:10px}
.bars{display:flex;align-items:flex-end;gap:6px;height:84px}.bars i{flex:1;border-radius:3px 3px 0 0}
.row{display:flex;flex-wrap:wrap;gap:8px}.btn,.field{padding:8px 14px;border-radius:4px;font-weight:500;font-size:14px}.field{border:1px solid;min-width:110px}
.alert{padding:10px 12px;border-radius:6px;font-size:14px}
details.check{border:1px solid var(--line);border-radius:10px;margin:8px 0;padding:10px 12px}
summary{cursor:pointer;display:flex;flex-wrap:wrap;gap:8px;align-items:baseline}.meta{color:var(--mut);font-size:13px;width:100%}
.badge{font-size:11px;text-transform:uppercase;font-weight:700;padding:2px 8px;border-radius:99px;border:1px solid}
.badge.pass{color:var(--pass)}.badge.fail{color:var(--fail)}.badge.warn{color:var(--warn)}.badge.info{color:var(--info)}
.scroll{overflow-x:auto;max-height:420px;overflow-y:auto;margin-top:8px}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{text-align:left;padding:5px 8px;border-bottom:1px solid var(--line);white-space:nowrap}
tr.bad td{color:var(--fail);font-weight:600}code{font-size:12px}
.chip{display:inline-block;padding:0 6px;border:1px solid;border-radius:4px;font-weight:600}.dot{display:inline-block;width:14px;height:14px;border-radius:50%;margin-right:2px;vertical-align:middle}
.notes li{margin:4px 0}
</style></head><body><main>
<h1>${esc(sys.name)} — accessibility check report</h1>
<div class="sub">Brand ${esc(cfg.color.brand.toUpperCase())} · generated ${new Date().toISOString().slice(0, 10)} · WCAG 2.2 AA target</div>
<div class="stats">
 <div class="stat"><b class="${report.ok ? 'ok' : 'no'}">${report.ok ? 'Pass' : 'Fail'}</b>Build result (A/AA)</div>
 <div class="stat"><b>${counts.pass}/${report.checks.length - counts.info}</b>Checks passing${counts.warn ? ` · ${counts.warn} warning` : ''}</div>
 <div class="stat"><b>${pairs}</b>Colour pairs tested</div>
 <div class="stat"><b>${sys.tokens.size}</b>Tokens generated</div>
</div>
<ul class="notes">${sys.notes.map((n) => `<li><b>${esc(n.foundation)}:</b> ${esc(n.text)}</li>`).join('')}</ul>
<h2>In use</h2><div class="previews">${preview('Light')}${preview('Dark')}</div>
<h2>Colour scales (contrast grades)</h2>
<p class="sub">Any two shades ≥ 50 grades apart pass 4.5:1; ≥ 40 apart pass 3:1 — in every hue.</p>
${hues.map((h) => `<div class="hue">${h}</div>${swatchRow(sys, h)}`).join('')}
<h2>Checks</h2>${checksHtml}
</main></body></html>`;
}
