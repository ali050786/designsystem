// Build-with-colour test, metric cards — React + Tailwind v4 (with tokens.css and tailwind.theme.css loaded).
// Request: three metric cards (active users up 2.4% — good; error rate down 0.9% — good; load time up 0.4 s — bad),
// each with a small bar trend, a "Details" ghost button and a card menu; plus a filter chip row with one chip selected.

const metrics = [
  { label: 'Active users', value: '12,480', change: '▲ +2.4%', good: true, bars: [40, 52, 48, 61, 66, 70, 74] },
  { label: 'Error rate', value: '0.8%', change: '▼ −0.9%', good: true, bars: [70, 64, 60, 52, 47, 41, 38] },
  { label: 'Load time', value: '1.9 s', change: '▲ +0.4 s', good: false, bars: [30, 34, 33, 41, 46, 52, 58] },
];

export function StatCards({ selected = 'Last 7 days' }) {
  return (
    <section className="bg-bg-canvas p-6">
      <div role="group" aria-label="Period" className="flex gap-2 mb-4">
        {['Today', 'Last 7 days', 'Last 30 days'].map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={p === selected}
            className={p === selected
              ? 'bg-bg-selected text-fg-default border border-border-strong rounded-full px-3 py-1 font-semibold'
              : 'bg-bg-surface text-fg-muted border border-border-strong rounded-full px-3 py-1 hover:bg-bg-surface-hover'}
          >
            {p === selected ? `✓ ${p}` : p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map((m) => (
          <article key={m.label} className="bg-bg-surface text-fg-default border border-border-subtle rounded-xl p-5">
            <p className="bg-bg-surface text-fg-muted text-sm">{m.label}</p>
            <p className="text-fg-default text-3xl font-semibold tabular-nums">{m.value}</p>
            <p className={m.good ? 'text-fg-positive font-semibold' : 'text-fg-negative font-semibold'}>
              {m.change} <span className="text-fg-muted font-normal">this week</span>
            </p>
            <div className="flex items-end gap-1 h-12 mt-3" aria-hidden="true">
              {m.bars.map((h, i) => (
                <span key={i} className={m.good ? 'fill-data-positive bg-data-positive w-3 rounded-sm' : 'bg-data-negative w-3 rounded-sm'} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-4">
              <button type="button" className="bg-action-ghost-bg text-action-ghost-fg hover:bg-action-ghost-bg-hover active:bg-action-ghost-bg-pressed rounded px-2 py-1 font-semibold">
                Details
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
