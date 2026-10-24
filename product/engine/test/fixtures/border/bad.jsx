export function Card() {
  return (
    <div className="border border-gray-300 rounded-container">
      <input className="border-2 border-border-input" />
      <hr className="border-t-[0.5px]" />
      <div className="border-[0.0625rem]" />
      <button className="ring-1 ring-border-input outline-none focus:ring-2" />
      <div className="-ml-px" />
      <button className="border-0 bg-action-primary-bg" />
      <div className="border-[var(--ds-border-width-3)]" />
    </div>
  );
}
