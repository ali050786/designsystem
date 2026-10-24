// A project page in React + Tailwind, laid out with ds layout classes and utilities.
export function ProjectPage({ projects }) {
  return (
    <div className="ds-shell">
      <header data-shell="header" className="flex flex-wrap items-center gap-x-inline-md gap-y-stack-sm px-margin min-h-header">
        <button type="button" data-shell-toggle="nav" aria-expanded="false" aria-controls="nav" className="min-h-control px-inset-md">Menu</button>
        <span className="min-w-0">Projects</span>
      </header>
      <nav data-shell="nav" id="nav" aria-label="Sections" className="p-inset-lg">
        <a href="#all">All projects</a>
      </nav>
      <main data-shell="main">
        <div className="ds-page">
          <h1 id="all">Projects</h1>
          <p className="max-w-reading">Every project you can see.</p>
          <ul className="ds-tiles">
            {projects.map((p) => <li key={p.id} className="min-w-0 p-inset-lg">{p.name}</li>)}
          </ul>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-gutter">
            <section className="min-w-0 lg:col-span-2">Activity</section>
            <section className="min-w-0">Storage</section>
          </div>
        </div>
      </main>
      <aside data-shell="aside" aria-label="Details" className="p-inset-lg">Details</aside>
    </div>
  );
}
