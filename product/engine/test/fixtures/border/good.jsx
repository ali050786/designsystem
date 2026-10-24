export function Settings() {
  return (
    <section className="rounded-container border-line border-border-default bg-bg-surface p-inset-lg">
      <ul className="divide-y-line divide-border-subtle">
        <li>Notifications</li>
        <li>Privacy</li>
      </ul>
      <label className="grid gap-stack-xs">
        Name
        <input className="min-h-control rounded-control border-control border-border-input px-inset-md" />
      </label>
      <nav className="grid">
        <a href="/" aria-current="page" className="border-s-indicator border-border-selected ps-[calc(var(--spacing-inset-md)-var(--ds-border-width-indicator))]">Home</a>
      </nav>
      <button className="min-h-control rounded-control border-control border-transparent bg-action-primary-bg text-action-primary-fg">Save</button>
    </section>
  );
}
