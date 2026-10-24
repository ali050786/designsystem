export function Stat({ label, value, delta }) {
  return (
    <div className="rounded-container p-inset-lg">
      <p className="text-label-md text-fg-muted">{label}</p>
      <p className="text-numeric-lg tabular-nums">{value}</p>
      <p className={delta > 0 ? 'text-caption-md text-fg-positive' : 'text-caption-md text-fg-negative'}>{delta}</p>
      <code className="text-code-sm font-mono">ID-2041</code>
    </div>
  );
}
