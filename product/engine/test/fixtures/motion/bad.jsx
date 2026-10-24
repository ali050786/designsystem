export function Promo({ open }) {
  return (
    <div className="transition-all duration-300 ease-in-out hover:scale-105">
      <span className="animate-bounce">New</span>
      <svg className="animate-spin" aria-hidden="true" />
      <div className="scroll-smooth overflow-auto">List</div>
      <div className="motion-reduce:translate-y-2 transition-transform duration-(--ds-motion-change-duration)">Panel</div>
      <div style={{ transition: 'opacity .3s' }}>Fade</div>
    </div>
  );
}
