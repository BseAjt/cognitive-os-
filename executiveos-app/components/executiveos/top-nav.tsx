"use client";

export type ExecutiveOSView = "home" | "decision" | "memory" | "graph";

const NAV_ITEMS: Array<[ExecutiveOSView, string]> = [
  ["home", "ExecutiveOS"],
  ["decision", "Decision Room"],
  ["memory", "Organizational Memory"],
  ["graph", "Enterprise Graph"]
];

export function ExecutiveOSTopNav({ view, onView }: { view: ExecutiveOSView; onView: (view: ExecutiveOSView) => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07111f]/90 px-6 py-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4">
        <button onClick={() => onView("home")} className="flex items-center gap-3" aria-label="Ouvrir l'accueil ExecutiveOS">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#9d83ff] to-[#5c39e8] font-black">EO</span>
          <span className="text-left">
            <strong className="block">ExecutiveOS</strong>
            <span className="text-xs text-[#91a2bd]">Cognitive Operating System</span>
          </span>
        </button>
        <nav className="flex flex-wrap gap-2" aria-label="Navigation principale">
          {NAV_ITEMS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => onView(id)}
              aria-current={view === id ? "page" : undefined}
              className={`rounded-xl px-4 py-2 text-sm ${view === id ? "bg-white/10 text-white" : "text-[#91a2bd] hover:bg-white/5"}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
