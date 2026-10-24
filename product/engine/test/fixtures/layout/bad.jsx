// A dashboard in React + Tailwind with layout mistakes.
import { useEffect, useState } from 'react';

export function Dashboard({ cards }) {
  const [wide, setWide] = useState(false);
  useEffect(() => { setWide(window.matchMedia('(min-width: 768px)').matches); }, []);
  return (
    <div className="w-screen">
      <header className="sticky top-0 h-16 scroll-pt-20">Dashboard</header>
      <main className="mx-auto max-w-7xl px-6">
        <p className="max-w-[720px]">A summary of every project.</p>
        <div className="grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-2 2xl:grid-cols-4">
          {cards.map((c) => <section key={c.id} className="w-[400px]">{c.title}</section>)}
        </div>
        <div className="flex flex-row-reverse max-md:flex-col">
          <aside className="order-first">Filters</aside>
        </div>
      </main>
    </div>
  );
}
