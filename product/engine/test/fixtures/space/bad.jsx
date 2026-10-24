export function Toolbar({ compact }) {
  return (
    <div className={compact ? 'p-inset-sm gap-x-inline-xs' : 'p-inset-md gap-x-inline-sm'}>
      <div className="p-4 gap-2 mt-[13px] space-y-3">
        <button className="h-5 w-5" aria-label="Close">×</button>
        <button className="h-10 px-inset-md">Save</button>
        <span className="p-stack-md gap-y-inline-sm">Mixed</span>
      </div>
      <Spacer size={24} />
    </div>
  );
}
