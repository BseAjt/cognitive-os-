import type { Challenge } from "@/types/domain";
import { challengeScore } from "@/lib/scheduler";

export function WorkspaceSidebar({ challenges, activeId, onSelect }: { challenges: Challenge[]; activeId: string; onSelect: (id: string) => void }) {
  return (
    <aside className="border-r border-white/10 bg-[#050b15]/90 p-5 max-md:hidden">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#9d83ff] to-[#5c39e8] font-black">E</div>
        <div><strong>ExecutiveOS</strong><span className="block text-xs text-[#91a2bd]">Cognitive workspace</span></div>
      </div>
      <div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">ACTIVE CHALLENGES</div>
      <div className="mt-3 grid gap-2">
        {challenges.map((challenge) => (
          <button
            key={challenge.id}
            onClick={() => onSelect(challenge.id)}
            aria-current={activeId === challenge.id ? "page" : undefined}
            className={`rounded-xl border p-3 text-left ${activeId === challenge.id ? "border-[#7c5cff]/50 bg-[#7c5cff]/10" : "border-white/10 bg-white/[.02]"}`}
          >
            <span className="block font-semibold">{challenge.title}</span>
            <span className="mt-1 block text-xs text-[#91a2bd]">Score {challengeScore(challenge)} · {challenge.state}</span>
          </button>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-4">
        <div className="text-xs font-black tracking-[.12em] text-[#8d7ce4]">RUNTIME STATUS</div>
        <div className="mt-3 grid gap-2 text-sm text-[#cfd8e8]"><span>● Context Engine</span><span>● Scheduler</span><span>● Decision Ledger</span><span>● Cognitive Graph</span></div>
      </div>
    </aside>
  );
}

export function WorkspaceHeader({ title, showGraph, onToggleGraph, onCriticalSignal }: { title: string; showGraph: boolean; onToggleGraph: () => void; onCriticalSignal: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-white/10 bg-[#07111f]/80 px-7 backdrop-blur">
      <div>ExecutiveOS / <strong>{title}</strong></div>
      <div className="flex gap-2">
        <button onClick={onToggleGraph} className="executive-button executive-ghost">{showGraph ? "Masquer" : "Afficher"} le graphe</button>
        <button onClick={onCriticalSignal} className="executive-button executive-ghost">Signal critique</button>
      </div>
    </header>
  );
}
