"use client";

import { useMemo, useState } from "react";
import { consolidateLiveKnowledge } from "@/lib/live-memory";
import { buildCrossCaseLinks } from "@/lib/cross-case-memory";
import { buildReusableExperiences } from "@/lib/experience-reuse";
import { detectCrossCaseContradictions } from "@/lib/cross-case-contradictions";
import { buildKnowledgeSuggestions } from "@/lib/knowledge-suggestions";
import { useExecutiveStore } from "@/store/executive-store";

export function LiveMemoryDock() {
  const store = useExecutiveStore();
  const [open, setOpen] = useState(true);
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
    return { knowledge: knowledgeByCase[active.id] ?? [], links, experiences, contradictions, suggestions };
  }, [active, store.cases, store.caseObjects, store.memories, store.knowledgeRecords, store.learningEvents, store.decisions]);

  if (!active || !intelligence) return null;

  if (!open) {
    return <button onClick={() => setOpen(true)} className="fixed bottom-20 right-5 z-40 rounded-xl border border-[#7c5cff]/40 bg-[#17152e]/95 px-4 py-3 text-sm font-semibold text-[#c9c0ff] shadow-2xl backdrop-blur">✦ Mémoire vivante</button>;
  }

  return <aside className="fixed bottom-20 right-5 z-40 w-[min(420px,calc(100vw-2rem))] rounded-[24px] border border-[#7c5cff]/35 bg-[#0b1526]/95 p-4 shadow-2xl backdrop-blur-xl">
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
  </aside>;
}

function label(type: string): string {
  if (type === "review_contradiction") return "Contradiction";
  if (type === "reuse_experience") return "Expérience réutilisable";
  if (type === "related_case") return "Dossier connexe";
  return "À valider";
}
