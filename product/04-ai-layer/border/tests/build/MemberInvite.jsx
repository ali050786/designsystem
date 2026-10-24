// Built from the "Build with borders" prompt: an invite form with a role picker and the pending invites list.
export function MemberInvite({ error, role, setRole, pending }) {
  const roles = ['Member', 'Admin', 'Viewer'];
  return (
    <section className="grid gap-stack-lg rounded-container border-line border-border-default bg-bg-surface p-inset-lg">
      <h2 className="text-title-md">Invite people</h2>
      <div className="grid gap-stack-xs">
        <label htmlFor="invite-email" className="font-semibold">Email</label>
        <div className="ds-join">
          <input
            id="invite-email"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'invite-error' : undefined}
            className={[
              'min-h-control flex-1 rounded-control bg-bg-surface text-fg-default', // .ds-join lets parts shrink
              error
                ? 'border-state border-border-danger px-[calc(var(--spacing-inset-md)-(var(--ds-border-width-state)-var(--ds-border-width-control)))]'
                : 'border-control border-border-input px-inset-md',
            ].join(' ')}
          />
          <button type="submit" className="min-h-control rounded-control border-control border-action-secondary-border bg-action-secondary-bg px-inset-md text-action-secondary-fg">Invite</button>
        </div>
        {error && <p id="invite-error" className="flex gap-inline-xs text-fg-danger"><span aria-hidden="true">⚠</span><span>{error}</span></p>}
      </div>
      <div className="ds-join" role="group" aria-label="Role">
        {roles.map((r) => (
          <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)}
            className={['min-h-control rounded-control border-control border-action-secondary-border px-inset-md', role === r ? 'bg-bg-selected font-semibold text-fg-default' : 'bg-action-secondary-bg text-action-secondary-fg'].join(' ')}>{r}</button>
        ))}
      </div>
      <ul className="divide-y-line divide-border-subtle">
        {pending.map((p) => (
          <li key={p.email} className="flex justify-between gap-inline-md py-inset-sm"><span>{p.email}</span><span className="text-fg-muted">{p.role}</span></li>
        ))}
      </ul>
    </section>
  );
}
