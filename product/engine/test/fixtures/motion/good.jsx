export function Toolbar({ saving, count }) {
  return (
    <div className="flex gap-x-sm">
      <button className="transition-colors hover:bg-action-secondary-bg-hover">Save</button>
      <div className="transition-[opacity,translate] duration-(--ds-motion-change-duration) ease-change motion-safe:translate-y-(--ds-motion-change-distance)">Panel</div>
      {saving && <svg className="ds-loading" aria-hidden="true" />}
      <output className="ds-highlight">{count}</output>
      <div className="motion-safe:scroll-smooth overflow-auto">List</div>
    </div>
  );
}
