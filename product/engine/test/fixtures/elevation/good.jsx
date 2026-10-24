export function Card({ children }) {
  return (
    <div className="bg-elevation-raised-surface shadow-raised rounded-container hover:bg-surface-hover hover:shadow-sticky">
      <ul className="z-(--ds-layer-floating) bg-elevation-floating-surface shadow-floating border-line border-elevation-floating-border">{children}</ul>
      <div className="ds-floating shadow-floating">menu</div>
      <span className="relative z-1">badge</span>
      <div className="shadow-none">flat</div>
    </div>
  );
}
