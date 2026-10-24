// Build test, React + Tailwind: a team switcher menu with a search field, team avatars, a "New" badge and a footer action.
// Shape table: menu = container; search field fills the menu inset by inset-xs → nested; items fill the menu → nested;
// avatar = pill (grows with its initials); badge = pill; checkbox = mark; footer button = control.
export function TeamSwitcher({ teams, current, onPick }) {
  return (
    <div className="grid gap-y-stack-xs p-inset-xs min-w-0 max-w-full rounded-container border border-border-subtle bg-bg-surface-overlay shadow-3">
      <label className="grid gap-y-stack-xs">
        <span className="sr-only">Search teams</span>
        <input type="search" placeholder="Search teams"
          className="min-h-control px-inset-md py-inset-xs border border-border-input bg-bg-surface text-fg-default rounded-[max(0px,var(--radius-container)-var(--spacing-inset-xs))]" />
      </label>
      <ul className="grid gap-y-stack-xs m-0 p-0 list-none" role="listbox" aria-label="Teams">
        {teams.map((t) => (
          <li key={t.id} role="option" aria-selected={t.id === current}>
            <button type="button" onClick={() => onPick(t.id)}
              className="flex items-center gap-x-inline-sm w-full min-h-control px-inset-sm text-fg-default hover:bg-bg-item-hover rounded-[max(0px,var(--radius-container)-var(--spacing-inset-xs))]">
              <span aria-hidden="true" className="inline-grid place-content-center min-w-control min-h-control aspect-square p-inset-xs rounded-pill bg-bg-selected text-label-md">{t.initials}</span>
              <span className="min-w-0 text-body-md">{t.name}</span>
              {t.isNew && <span className="px-inset-sm py-inset-xs rounded-pill bg-bg-brand-subtle text-fg-brand text-label-sm whitespace-nowrap">New</span>}
            </button>
          </li>
        ))}
      </ul>
      <label className="flex items-center gap-x-inline-sm min-h-target px-inset-sm text-body-md">
        <input type="checkbox" className="rounded-mark accent-[var(--ds-color-action-primary-bg)]" /> Remember my choice
      </label>
      <button type="button" className="min-h-control px-inset-md py-inset-xs rounded-control bg-action-primary-bg text-action-primary-fg text-label-md">Create a team</button>
    </div>
  );
}
