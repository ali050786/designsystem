export function Stat({ label, value }) {
  return (
    <div className="h-10 overflow-hidden">
      <p className="text-sm leading-tight">{label}</p>
      <p className="text-[11px] tracking-tight">{value}</p>
      <p className="text-numeric-lg">{value}</p>
      <span className="font-light uppercase text-body-md">A sentence in capitals</span>
      <span className="truncate">A long project name</span>
    </div>
  );
}
