"use client";

import { useMemo, useState } from "react";
import { projectCognitiveEvents } from "@/lib/cognitive-events";
import { buildDecisionDiffs } from "@/lib/decision-diff";
import { groupCognitiveEventsIntoOrionCycles, orionCycleProgress } from "@/lib/orion-cycles";
import { useExecutiveStore } from "@/store/executive-store";

export function OrionCyclesDock() {
  const store = useExecutiveStore();
  const [open, setOpen] = useState(false);
  const active = store.cases.find((item) => item.id === store.activeCaseId) ?? store.cases[0];

  const projection = useMemo(() => {
    if (!active) return { cycles: [], diffs: [] };
    const events = projectCognitiveEvents({
      caseId: active.id,
      messages: store.messages,
      caseObjects: store.caseObjects,
      decisions: store.decisions,
      actions: store.actions,
      learningEvents: store.learningEvents,
      reasoningRevisions: store.reasoningRevisions,
      memories: store.memories
    });
    return {
      cycles: groupCognitiveEventsIntoOrionCycles(events).reverse(),
      diffs: buildDecisionDiffs(active.id, store.reasoningRevisions, events).reverse()
    };
  }, [active, store.messages, store.caseObjects, store.decisions, store.actions, store.learningEvents, store.reasoningRevisions, store.memories]);

  const { cycles, diffs } = projection;
  if (!active) return null;
  if (!open) return <button onClick={() => setOpen(true)} className="fixed bottom-5 left-5 z-40 rounded-xl border border-[#42d59d]/35 bg-[#0d2020]/95 px-4 py-3 text-sm font-semibold text-[#9de7cd] shadow-2xl backdrop-blur">↻ Cycles ORION · {cycles.length}</button>;

  return <aside className="fixed bottom-5 left-5 z-40 max-h-[78vh] w-[min(560px,calc(100vw-2rem))] overflow-auto rounded-[24px] border border-[#42d59d]/30 bg-[#081823]/95 p-4 shadow-2xl backdrop-blur-xl">
    <div className="flex items-start justify-between gap-3">
      <div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#75d6b5]">B6.2 · TIMELINE COGNITIVE</div><strong className="mt-1 block text-sm">Cycles ORION · {active.title}</strong><p className="mt-1 text-[11px] text-[#71839e]">{cycles.length} cycle(s) · {diffs.length} révision(s) de décision comparée(s).</p></div>
      <button onClick={() => setOpen(false)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-[#91a2bd]">Réduire</button>
    </div>

    {diffs.length > 0 && <section className="mt-4 rounded-2xl border border-[#a995ff]/25 bg-[#7c5cff]/[.06] p-4">
      <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#b7a9ff]">B6.2.3 · Évolution des décisions</div>
      <div className="mt-3 space-y-3">{diffs.slice(0,3).map((diff) => <article key={diff.id} className="rounded-xl border border-white/[.08] bg-[#08131f]/75 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-xs">Décision v{diff.from.version} → v{diff.to.version}</strong>{diff.confidenceDelta !== null && <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${diff.confidenceDelta >= 0 ? "bg-[#42d59d]/10 text-[#8ce1c2]" : "bg-[#ff9b7b]/10 text-[#ffb39a]"}`}>{diff.confidenceDelta >= 0 ? "+" : ""}{diff.confidenceDelta} pts confiance</span>}</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-lg bg-white/[.025] p-2.5"><span className="text-[9px] font-black uppercase tracking-[.1em] text-[#667995]">Avant · v{diff.from.version}</span><p className="mt-1 text-[11px] leading-5 text-[#91a2bd]">{diff.from.content}</p></div><div className="rounded-lg border border-[#7c5cff]/15 bg-[#7c5cff]/[.05] p-2.5"><span className="text-[9px] font-black uppercase tracking-[.1em] text-[#a995ff]">Après · v{diff.to.version}</span><p className="mt-1 text-[11px] leading-5 text-[#c3b9f5]">{diff.to.content}</p></div></div>
        <p className="mt-2 text-[11px] leading-5 text-[#9fb0c4]">{diff.changeSummary}</p>
        {diff.drivers.length > 0 && <div className="mt-3"><span className="text-[9px] font-black uppercase tracking-[.1em] text-[#75d6b5]">Ce qui a probablement provoqué la révision</span><div className="mt-2 space-y-1.5">{diff.drivers.slice(0,3).map((driver) => <div key={driver.id} className="rounded-lg bg-white/[.025] px-2.5 py-2"><span className="text-[9px] uppercase text-[#71839e]">{driver.type} · {driver.impact}</span><p className="mt-0.5 text-[11px] leading-4 text-[#aab7ca]">{driver.summary}</p></div>)}</div></div>}
      </article>)}</div>
    </section>}

    <div className="mt-4 space-y-3">
      {cycles.length ? cycles.slice(0, 8).map((cycle, index) => <article key={cycle.id} className={`rounded-2xl border p-4 ${index === 0 ? "border-[#42d59d]/35 bg-[#42d59d]/8" : "border-white/[.08] bg-white/[.025]"}`}>
        <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[.12em] text-[#75d6b5]">Cycle #{cycle.sequence}</span><span className="text-[10px] text-[#71839e]">{new Date(cycle.startedAt).toLocaleString("fr-FR")}</span></div>
        <strong className="mt-2 block text-sm leading-5">{cycle.trigger?.summary ?? cycle.title.replace(/^Cycle #\d+ · /, "")}</strong>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">{orionCycleProgress(cycle).map((step, stepIndex, steps) => <span key={`${cycle.id}:${step}`} className="contents"><span className="rounded-full border border-white/[.08] bg-white/[.04] px-2 py-1 text-[10px] text-[#a9b8ca]">{step}</span>{stepIndex < steps.length - 1 && <span className="text-[10px] text-[#52647f]">→</span>}</span>)}</div>
        <p className="mt-3 text-xs leading-5 text-[#9fb0c4]">{cycle.summary}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[#71839e]"><span>{cycle.events.length} événement(s)</span><span>impact {cycle.impact}</span>{cycle.confidence !== null && <span>confiance {cycle.confidence}%</span>}<span>{cycle.isComplete ? "cycle consolidé" : "cycle ouvert"}</span></div>
        {cycle.outcome && <div className="mt-3 rounded-xl border border-[#7c5cff]/20 bg-[#7c5cff]/8 p-3"><span className="text-[9px] font-black uppercase tracking-[.12em] text-[#a995ff]">Issue du cycle</span><p className="mt-1 text-xs leading-5 text-[#c9c0ff]">{cycle.outcome}</p></div>}
      </article>) : <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4 text-xs leading-5 text-[#91a2bd]">Aucun cycle cognitif disponible. Une première interaction avec ORION créera le début de la timeline.</div>}
    </div>
  </aside>;
}
