export function Settings({ dense }) {
  return (
    <section className="p-inset-lg grid gap-y-stack-md" data-density={dense ? 'compact' : 'default'}>
      <h2 className="mb-stack-xs">Notifications</h2>
      <div className="flex flex-wrap gap-x-inline-sm gap-y-stack-sm">
        <button className="min-h-control px-inset-md gap-icon inline-flex items-center">Save</button>
        <button className="min-w-control min-h-control" aria-label="More">⋯</button>
      </div>
      <label className="min-w-target min-h-target inline-flex items-center gap-x-inline-xs"><input type="checkbox" /> Weekly summary</label>
      <div className="mx-auto p-0 -mt-px">Footer</div>
    </section>
  );
}
