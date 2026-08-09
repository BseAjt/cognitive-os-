"use client";

import { useMemo, useState } from "react";
import { consolidateLiveKnowledge } from "@/lib/live-memory";
import { buildCrossCaseLinks } from "@/lib/cross-case-memory";
import { buildReusableExperiences } from "@/lib/experience-reuse";
import { detectCrossCaseContradictions } from "@/lib/cross-case-contradictions";
import { buildKnowledgeSuggestions } from "@/lib/knowledge-suggestions";
import { buildLivingKnowledgeGraph, graphSummary } from "@/lib/living-knowledge-graph";
import { useExecutiveStore } from "@/store/executive-store";

export function LiveMemoryDock() {
  const store = useExecutiveStore();
  const [open, setOpen] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const active = store.cases.find((item) => item.id === store.activeCaseId) ?? store.cases[0];

  const intelligence = useMemo(() => {
    if (!active) return null;
    const knowledgeByCase = Object.fromEntries(store.cases.map((cognitiveCase) => [cognitiveCase.id, consolidateLiveKnowledge({
      cognitiveCase,
      caseObjects: store.caseObjects,
      memories: store.memories,
      knowledgeRecords: store.knowledgeRecords,
      learningEvents: store.learningEvents
    })]));
    const links = buildCrossCaseLinks({ activeCase: active, cases: store.cases, knowledgeByCase });
    const experiences = buildReusableExperiences({
      activeCase: active,
      cases: store.cases,
      links,
      decisions: store.decisions,
      caseObjects: store.caseObjects,
      learningEvents: store.learningEvents
    });
    const contradictions = detectCrossCaseContradictions({
      cases: store.cases,
      decisions: store.decisions,
      caseObjects: store.caseObjects,
      learningEvents: store.learningEvents
    });
    const suggestions = buildKnowledgeSuggestions({
      activeCase: active,
      liveKnowledge: knowledgeByCase[active.id] ?? [],
      links,
      reusableExperiences: experiences,
      contradictions
    });
    const graph = buildLivingKnowledgeGraph({ cases: store.cases, links, reusableExperiences: experiences, contradictions });
    return { knowledge: knowledgeByCase[active.id] ?? [], links, experiences, contradictions, suggestions, graph };
  }, [active, store.cases, store.caseObjects, store.memories, store.knowledgeRecords, store.learningEvents, store.decisions]);

  if (!active || !intelligence) return null;

  if (!open) {
    return <button onClick={() => setOpen(true)} className="fixed bottom-20 right-4 z-40 max-w-[calc(100vw-2rem)] rounded-xl border border-[#7c5cff]/40 bg-[#17152e]/95 px-4 py-3 text-sm font-semibold text-[#c9c0ff] shadow-2xl backdrop-blur">✦ Mémoire vivante</button>;
  }

  return <aside role="dialog" aria-modal="true" aria-label="Mémoire vivante" className="fixed inset-3 z-50 max-h-[calc(100dvh-1.5rem)] w-auto overflow-auto overscroll-contain rounded-[24px] sm:inset-auto sm:bottom-20 sm:right-5 sm:max-h-[75vh] sm:w-[min(440px,calc(100vw-2rem))] border border-[#7c5cff]/35 bg-[#0b1526]/95 p-4 shadow-2xl backdrop-blur-xl">
    <div className="flex items-start justify-between gap-3">
      <div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#a995ff]">ORION · MÉMOIRE VIVANTE</div><strong className="mt-1 block text-sm">{active.title}</strong><p className="mt-1 text-[11px] text-[#71839e]">{intelligence.knowledge.length} connaissance(s) consolidée(s) · {intelligence.links.length} dossier(s) connexe(s)</p></div>
      <button onClick={() => setOpen(false)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-[#91a2bd]">Réduire</button>
    </div>

    <div className="mt-4 space-y-2">
      {intelligence.suggestions.length ? intelligence.suggestions.slice(0, 4).map((item, index) => <div key={item.id} className={`rounded-2xl border p-3 ${index === 0 ? "border-[#7c5cff]/35 bg-[#7c5cff]/10" : "border-white/[.08] bg-white/[.025]"}`}>
        <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[.12em] text-[#9d83ff]">{label(item.type)}</span><span className="text-[10px] text-[#71839e]">priorité {item.priority}</span></div>
        <strong className="mt-1 block text-sm leading-5">{item.title}</strong>
        <p className="mt-1 text-xs leading-5 text-[#a5b4c9]">{item.detail}</p>
        <p className="mt-1 text-[10px] leading-4 text-[#65758f]">Pourquoi : {item.reason}</p>
      </div>) : <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-3 text-xs leading-5 text-[#91a2bd]">Aucun signal mémoire prioritaire. ORION continuera à consolider les apprentissages de ce dossier.</div>}
    </div>

    <button onClick={() => setShowGraph(!showGraph)} className="mt-3 w-full rounded-xl border border-white/[.08] bg-white/[.03] px-3 py-2 text-left text-xs font-semibold text-[#c9c0ff]">
      {showGraph ? "Masquer" : "Voir"} le Knowledge Graph vivant · {graphSummary(intelligence.graph)}
    </button>

    {showGraph && <div className="mt-3 rounded-2xl border border-white/[.08] bg-[#091422] p-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <GraphMetric label="Dossiers" value={intelligence.graph.nodes.filter((n) => n.type === "case").length}/>
        <GraphMetric label="Expériences" value={intelligence.graph.nodes.filter((n) => n.type === "experience").length}/>
        <GraphMetric label="Conflits" value={intelligence.graph.nodes.filter((n) => n.type === "contradiction").length}/>
      </div>
      <div className="mt-3 space-y-2">{intelligence.graph.edges.slice(0, 8).map((edge) => <div key={edge.id} className="rounded-xl border border-white/[.06] bg-white/[.025] p-2.5"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black text-[#9d83ff]">{edge.type}</span><span className="text-[10px] text-[#71839e]">{edge.weight}</span></div><p className="mt-1 text-[11px] leading-4 text-[#a5b4c9]">{edge.rationale}</p></div>)}</div>
    </div>}
  </aside>;
}

function label(type: string): string {
  if (type === "review_contradiction") return "Contradiction";
  if (type === "reuse_experience") return "Expérience réutilisable";
  if (type === "related_case") return "Dossier connexe";
  return "À valider";
}
function GraphMetric({ label, value }: { label:string; value:number }) {
  return <div className="rounded-xl border border-white/[.06] bg-white/[.025] p-2"><strong className="block text-lg">{value}</strong><span className="text-[9px] uppercase tracking-[.1em] text-[#71839e]">{label}</span></div>;
}
