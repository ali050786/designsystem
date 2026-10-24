export function Plans() {
  return (
    <section className="rounded-container p-inset-xs bg-bg-surface">
      <div className="rounded-[max(0px,var(--radius-container)-var(--spacing-inset-xs))] p-inset-sm">Pro plan</div>
      <div className="ds-join" role="group" aria-label="Billing period">
        <button className="rounded-control px-inset-md">Monthly</button>
        <button className="rounded-control px-inset-md">Yearly</button>
      </div>
      <span className="rounded-pill px-inset-sm">New</span>
      <input type="checkbox" className="rounded-mark" />
      <div className="rounded-s-control">Start</div>
    </section>
  );
}
