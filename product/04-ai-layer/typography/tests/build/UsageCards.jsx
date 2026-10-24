// Usage cards for the billing page (React + Tailwind v4 with ds tailwind.theme.css).
const change = (delta, unit, higherIsBetter) => {
  const up = delta > 0;
  const good = up === higherIsBetter;
  return { text: `${up ? '▲' : '▼'} ${Math.abs(delta)}${unit} since last month`, cls: good ? 'text-fg-positive' : 'text-fg-negative' };
};

export function UsageCards({ items }) {
  return (
    <section aria-labelledby="usage-h">
      <h2 id="usage-h" className="mb-stack-lg">Usage this month</h2>
      <ul className="grid gap-inline-md grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
        {items.map((it) => {
          const c = change(it.delta, it.unit, it.higherIsBetter);
          return (
            <li key={it.name} className="bg-bg-surface border border-border-subtle rounded-container p-inset-lg grid gap-stack-xs">
              <span className="text-label-md text-fg-muted">{it.name}</span>
              <span className="text-numeric-lg tabular-nums text-fg-default">{it.value}</span>
              <span className={`text-caption-md ${c.cls}`}>{c.text}</span>
              {it.note && <p className="text-body-sm text-fg-muted">{it.note}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function InvoiceId({ id }) {
  return <code className="text-code-sm font-mono">{id}</code>;
}
