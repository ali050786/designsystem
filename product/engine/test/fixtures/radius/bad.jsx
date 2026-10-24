export function Plans() {
  return (
    <section className="rounded-xl p-4 overflow-hidden bg-bg-surface">
      <div className="rounded-xl p-2">Pro plan</div>
      <button className="rounded-full px-4">Choose Pro</button>
      <button className="rounded-control hover:rounded-pill">Compare</button>
      <div className="rounded-l-control rounded-[10px]">Monthly</div>
      <span className="rounded-badge">New</span>
      <input type="checkbox" className="rounded-control" />
      <div className="rounded-container p-inset-sm"><div className="rounded-container">Copied</div></div>
    </section>
  );
}
