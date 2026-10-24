// Built with the "Build with layout" prompt — React + Tailwind.
// What to build: "A reports dashboard: headline numbers, a chart and a short explanation side by side, the list of
// recent reports, and a panel with help about the selected report."
// Frame: header (product, menu, New report) · nav (sections) · main (page: title, headline tiles, chart + explanation on
// the page grid, the report list in a scrolling container) · aside (help). Widths by job; no breakpoints of its own.
import { useEffect, useRef, useState } from 'react';

export function ReportsDashboard({ figures, reports }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <div className="ds-shell">
      <header data-shell="header" className="flex items-center gap-x-inline-md px-margin lg:px-inset-xl min-h-header bg-bg-surface-raised">
        <button ref={toggle} type="button" data-shell-toggle="nav" aria-expanded={open} aria-controls="nav" aria-label="Sections"
          onClick={() => setOpen(!open)} className="inline-flex items-center justify-center min-h-control min-w-control">☰</button>
        <span className="me-auto ds-type-title-md">Atlas</span>
        <a href="#new" className="box-border inline-flex items-center min-h-control px-inset-md py-inset-xs rounded-control bg-action-primary-bg text-action-primary-fg">New report</a>
      </header>
      <nav data-shell="nav" id="nav" aria-label="Sections" data-open={open || undefined} className="p-inset-md">
        <ul className="grid gap-y-stack-xs">
          <li><a href="#overview">Overview</a></li>
          <li><a href="#reports" aria-current="page">Reports</a></li>
          <li><a href="#settings">Settings</a></li>
        </ul>
      </nav>
      <main data-shell="main" id="main">
        <div className="ds-page grid gap-y-stack-2xl py-inset-2xl">
          <div className="grid gap-y-stack-md min-w-0">
            <h1>Reports</h1>
            <p className="max-w-reading text-fg-muted">What changed across your projects this month, and the reports you sent.</p>
          </div>
          <ul className="ds-tiles">
            {figures.map((f) => (
              <li key={f.label} className="grid gap-y-stack-sm min-w-0 p-inset-lg rounded-container bg-bg-surface">
                <span className="text-fg-muted">{f.label}</span>
                <span className="ds-type-numeric-lg">{f.value}</span>
              </li>
            ))}
          </ul>
          <section aria-labelledby="month" className="ds-grid gap-y-stack-lg">
            <h2 id="month" className="ds-span-full">This month</h2>
            <figure className="ds-span-two-thirds m-0 p-inset-lg rounded-container bg-bg-surface">
              <figcaption className="text-fg-muted">Files added per week</figcaption>
            </figure>
            <p className="ds-span-third max-w-reading">Most of the change came from two projects. The chart counts files added each week; archived projects are left out.</p>
          </section>
          <section aria-labelledby="recent" className="grid gap-y-stack-md min-w-0">
            <h2 id="recent">Recent reports</h2>
            <div tabIndex={0} role="region" aria-labelledby="recent" className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th scope="col">Report</th><th scope="col">Sent</th><th scope="col">To</th></tr></thead>
                <tbody>{reports.map((r) => <tr key={r.id}><td>{r.name}</td><td>{r.sent}</td><td>{r.to}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      <aside data-shell="aside" aria-label="Help" className="grid content-start gap-y-stack-md px-margin xl:px-inset-xl py-inset-2xl">
        <h2 className="ds-type-title-lg">About this report</h2>
        <p className="max-w-reading">Reports are sent on the first working day of the month to everyone who follows the project.</p>
      </aside>
    </div>
  );
}
