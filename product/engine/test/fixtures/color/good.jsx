export function Stat() {
  return (
    <div className="bg-bg-surface text-fg-default border border-border-subtle rounded-lg p-4">
      <p className="bg-bg-surface text-fg-muted">Active users</p>
      <span className="text-fg-positive">▲ +2.4%</span>
      <button className="bg-action-primary-bg text-action-primary-fg hover:bg-action-primary-bg-hover">Save</button>
    </div>
  );
}
