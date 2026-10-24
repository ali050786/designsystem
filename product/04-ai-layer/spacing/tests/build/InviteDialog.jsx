// Invite dialog, React + Tailwind v4 with ds tokens (tokens.css + tailwind.theme.css loaded).
// Spacing plan: dialog inset.xl · title → description stack.xs · head → fields stack.xl · field → field stack.lg ·
// label → input → help stack.xs · buttons inline.sm · controls min-h-control · close button 24px hit area.
export function InviteDialog({ onClose, onSend }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="invite-title" className="grid gap-y-stack-xl p-inset-xl max-w-[28rem] bg-[var(--ds-elevation-4-surface)] rounded-[var(--ds-shape-surface)] shadow-4 border border-[var(--ds-elevation-4-border)]">
      <div className="flex items-start gap-x-inline-md">
        <div className="grid gap-y-stack-xs grow">
          <h2 id="invite-title" className="text-title-lg">Invite people</h2>
          <p className="text-body-sm text-fg-muted">They get an email with a link that works for 7 days.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="min-w-target min-h-target inline-flex items-center justify-center rounded-[var(--ds-shape-control)] text-fg-icon hover:bg-bg-state-hover">×</button>
      </div>
      <form className="grid gap-y-stack-lg" onSubmit={(e) => { e.preventDefault(); onSend(); }}>
        <div className="grid gap-y-stack-xs">
          <label htmlFor="invite-emails" className="text-label-md">Email addresses</label>
          <textarea id="invite-emails" rows={3} aria-describedby="invite-help" className="text-body-md min-h-control px-inset-md py-inset-xs border border-border-input rounded-[var(--ds-shape-control)] bg-bg-surface" />
          <span id="invite-help" className="text-caption-md text-fg-muted">Separate addresses with commas.</span>
        </div>
        <fieldset className="grid gap-y-stack-sm">
          <legend className="text-label-md mb-stack-xs">Role</legend>
          <label className="inline-flex items-center gap-x-inline-sm min-h-target text-body-md"><input type="radio" name="role" defaultChecked /> Member</label>
          <label className="inline-flex items-center gap-x-inline-sm min-h-target text-body-md"><input type="radio" name="role" /> Admin</label>
        </fieldset>
        <div className="flex flex-wrap gap-x-inline-sm gap-y-stack-sm mt-stack-sm">
          <button type="submit" className="text-label-md min-h-control px-inset-md py-inset-xs gap-icon inline-flex items-center rounded-[var(--ds-shape-control)] bg-action-primary-bg text-action-primary-fg hover:bg-action-primary-bg-hover">Send invites</button>
          <button type="button" onClick={onClose} className="text-label-md min-h-control px-inset-md py-inset-xs inline-flex items-center rounded-[var(--ds-shape-control)] border border-action-secondary-border bg-action-secondary-bg text-action-secondary-fg hover:bg-action-secondary-bg-hover">Cancel</button>
        </div>
      </form>
    </div>
  );
}
