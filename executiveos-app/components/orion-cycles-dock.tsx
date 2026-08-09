"use client";

import { useEffect, useMemo, useState } from "react";
import { buildDecisionToAction } from "@/lib/decision-to-action";
import { projectCognitiveEvents } from "@/lib/cognitive-events";
import { buildCognitiveReplay } from "@/lib/cognitive-replay";
import { buildDecisionDiffs } from "@/lib/decision-diff";
import { groupCognitiveEventsIntoOrionCycles, orionCycleProgress } from "@/lib/orion-cycles";
import { runOrionExecutiveCycle } from "@/lib/orion-executive-cycle";
import { buildTemporalCognitiveSnapshot, diffTemporalCognitiveSnapshots, temporalCursorPoints } from "@/lib/temporal-navigation";
import { useExecutiveStore } from "@/store/executive-store";

export function OrionCyclesDock() {
  const store = useExecutiveStore();
  const [open, setOpen] = useState(false);
  const [cursorIndex, setCursorIndex] = useState<number | null>(null);
  const [replayCycleId, setReplayCycleId] = useState<string | null>(null);
  const [replayFrameIndex, setReplayFrameIndex] = useState(0);
  const [objective, setObjective] = useState("");
  const [commandState, setCommandState] = useState("");
  const active = store.cases.find((item) => item.id === store.activeCaseId) ?? store.cases[0];

  const projection = useMemo(() => {
    if (!active) return { events: [], cycles: [], diffs: [], points: [] };
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
      events,
      cycles: groupCognitiveEventsIntoOrionCycles(events).reverse(),
      diffs: buildDecisionDiffs(active.id, store.reasoningRevisions, events).reverse(),
      points: temporalCursorPoints(active.id, events)
    };
  }, [active, store.messages, store.caseObjects, store.decisions, store.actions, store.learningEvents, store.reasoningRevisions, store.memories]);

  const { events, cycles, diffs, points } = projection;
  const safeCursor = points.length ? Math.min(cursorIndex ?? points.length - 1, points.length - 1) : 0;
  const selectedAt = points[safeCursor] ?? null;
  const currentAt = points.at(-1) ?? null;
  const selectedSnapshot = active && selectedAt ? buildTemporalCognitiveSnapshot(active.id, selectedAt, events) : null;
  const currentSnapshot = active && currentAt ? buildTemporalCognitiveSnapshot(active.id, currentAt, events) : null;
  const temporalDiff = selectedSnapshot && currentSnapshot ? diffTemporalCognitiveSnapshots(selectedSnapshot, currentSnapshot, events) : null;
  const replayCycle = replayCycleId ? cycles.find((cycle)=>cycle.id===replayCycleId) ?? null : null;
  const replay = active && replayCycle ? buildCognitiveReplay(active.id,replayCycle,events) : null;
  const replaySafeIndex = replay?.frames.length ? Math.min(replayFrameIndex,replay.frames.length-1) : 0;
  const replayFrame = replay?.frames[replaySafeIndex] ?? null;
  const executiveCycles = active ? store.executiveCycles.filter((cycle) => cycle.caseId === active.id) : [];
  const latestExecutiveCycle = executiveCycles[0];
  const activePlan = latestExecutiveCycle
    ? store.decisionActionPlans.find((plan) => plan.executiveCycleId === latestExecutiveCycle.id)
    : undefined;

  useEffect(() => {
    setObjective(active?.objective ?? "");
    setCommandState("");
  }, [active?.id, active?.objective]);

  function runExecutiveCycle() {
    if (!active) return;
    try {
      const cycle = runOrionExecutiveCycle({
        objective,
        cognitiveCase: active,
        agents: store.agents,
        sources: store.contextSources,
        evidence: store.contextEvidence
      });
      store.prependExecutiveCycle(cycle);
      setCommandState(cycle.status === "completed" ? "Cycle exécutif enregistré." : "Cycle enregistré : des preuves restent à compléter.");
    } catch (value) {
      setCommandState(value instanceof Error ? value.message : "Cycle ORION impossible.");
    }
  }

  function activateLatestPlan() {
    if (!active || !latestExecutiveCycle) return;
    try {
      store.activateDecisionActionPlan(buildDecisionToAction({ cognitiveCase: active, cycle: latestExecutiveCycle }));
      setCommandState("Plan activé : les actions sont maintenant disponibles dans le dossier.");
    } catch (value) {
      setCommandState(value instanceof Error ? value.message : "Plan d’exécution impossible.");
    }
  }

  if (!active) return null;
  if (!open) return <button onClick={() => setOpen(true)} className="fixed left-4 top-20 z-40 max-w-[calc(100vw-2rem)] rounded-xl border border-[#42d59d]/35 bg-[#0d2020]/95 px-4 py-3 text-sm font-semibold text-[#9de7cd] shadow-2xl backdrop-blur lg:bottom-4 lg:top-auto">↻ Cycles ORION · {cycles.length}</button>;

  return <aside role="dialog" aria-modal="true" aria-label="Cycles ORION" className="fixed inset-3 z-50 max-h-[calc(100dvh-1.5rem)] w-auto overflow-auto overscroll-contain rounded-[24px] sm:inset-auto sm:bottom-5 sm:left-5 sm:max-h-[84vh] sm:w-[min(640px,calc(100vw-2rem))] border border-[#42d59d]/30 bg-[#081823]/95 p-4 shadow-2xl backdrop-blur-xl">
    <div className="flex items-start justify-between gap-3">
      <div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#75d6b5]">B6.2 · TIMELINE COGNITIVE</div><strong className="mt-1 block text-sm">Cycles ORION · {active.title}</strong><p className="mt-1 text-[11px] text-[#71839e]">{cycles.length} cycle(s) · {diffs.length} révision(s) · {points.length} point(s) temporel(s).</p></div>
      <button onClick={() => setOpen(false)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-[#91a2bd]">Réduire</button>
    </div>

    <section className="mt-4 rounded-2xl border border-[#42d59d]/30 bg-[#42d59d]/[.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#75d6b5]">Commander ORION</div><strong className="mt-1 block text-sm">Faire avancer ce dossier maintenant</strong><p className="mt-1 text-[11px] leading-5 text-[#91a2bd]">Définissez l’arbitrage : ORION convoque les perspectives, produit une recommandation et peut la transformer en plan.</p></div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-[#9de7cd]">{executiveCycles.length} cycle(s) exécutif(s)</span>
      </div>
      <label htmlFor="orion-cycle-objective" className="mt-4 block text-[10px] font-bold uppercase tracking-[.12em] text-[#71839e]">Mandat du prochain cycle</label>
      <textarea id="orion-cycle-objective" value={objective} onChange={(event) => setObjective(event.target.value)} className="mt-2 min-h-20 w-full resize-none rounded-xl border border-white/10 bg-[#07131d] p-3 text-sm leading-6 outline-none focus:border-[#42d59d]/60" placeholder="Ex. Faut-il valider ce scénario et sous quelles conditions ?" />
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button onClick={runExecutiveCycle} disabled={!objective.trim()} className="rounded-xl bg-[#42b98d] px-4 py-3 text-sm font-bold text-[#071711] disabled:cursor-not-allowed disabled:opacity-35">Lancer un cycle ORION</button>
        {latestExecutiveCycle && !activePlan && <button onClick={activateLatestPlan} disabled={latestExecutiveCycle.status !== "completed"} className="rounded-xl border border-[#f4c76d]/35 bg-[#f4c76d]/10 px-4 py-3 text-sm font-bold text-[#f4c76d] disabled:cursor-not-allowed disabled:opacity-35">Transformer en plan d’action</button>}
        {activePlan && <span className="rounded-xl border border-[#42d59d]/20 bg-[#42d59d]/10 px-4 py-3 text-sm font-semibold text-[#9de7cd]">Plan actif · {activePlan.actionIds.length} actions</span>}
      </div>
      {latestExecutiveCycle && <div className="mt-3 rounded-xl border border-white/[.07] bg-[#07131d]/75 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-xs">Dernière synthèse</strong><span className="text-[10px] uppercase text-[#71839e]">{latestExecutiveCycle.status} · {latestExecutiveCycle.confidence}%</span></div><p className="mt-2 text-xs leading-5 text-[#b8c6d8]">{latestExecutiveCycle.synthesis}</p>{latestExecutiveCycle.recommendation && <p className="mt-2 text-xs font-semibold leading-5 text-[#8de4c3]">{latestExecutiveCycle.recommendation}</p>}</div>}
      {commandState && <p role="status" className="mt-3 text-xs leading-5 text-[#9de7cd]">{commandState}</p>}
    </section>

    {replay && replayFrame && <section className="mt-4 rounded-2xl border border-[#f4c76d]/30 bg-[#f4c76d]/[.055] p-4">
      <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#f4c76d]">B6.2.5 · Cognitive Replay</div><strong className="mt-1 block text-sm leading-5">{replay.title}</strong><p className="mt-1 text-[10px] text-[#8f8369]">{replay.summary}</p></div><button onClick={()=>{setReplayCycleId(null);setReplayFrameIndex(0);}} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-[#b6a98f]">Fermer replay</button></div>
      <div className="mt-4 flex items-center gap-2"><button disabled={replaySafeIndex===0} onClick={()=>setReplayFrameIndex((value)=>Math.max(0,value-1))} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] disabled:opacity-30">← Précédent</button><div className="min-w-0 flex-1"><div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-[#f4c76d]" style={{width:`${((replaySafeIndex+1)/replay.frames.length)*100}%`}}/></div><div className="mt-1 flex justify-between text-[9px] text-[#7f7561]"><span>Étape {replaySafeIndex+1}/{replay.frames.length}</span><span>{new Date(replayFrame.at).toLocaleString("fr-FR")}</span></div></div><button disabled={replaySafeIndex>=replay.frames.length-1} onClick={()=>setReplayFrameIndex((value)=>Math.min(replay.frames.length-1,value+1))} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] disabled:opacity-30">Suivant →</button></div>
      <article className="mt-4 rounded-xl border border-[#f4c76d]/20 bg-[#0c1720]/80 p-3"><div className="flex items-center justify-between gap-2"><span className="rounded-full bg-[#f4c76d]/10 px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-[#f4c76d]">{replayFrame.phase}</span>{replayFrame.after.confidence!==null && <span className="text-[10px] text-[#9c927d]">Confiance {replayFrame.after.confidence}%{replayFrame.confidenceDelta!==null ? ` (${replayFrame.confidenceDelta>=0?"+":""}${replayFrame.confidenceDelta})` : ""}</span>}</div><p className="mt-3 text-xs leading-5 text-[#ded4bd]">{replayFrame.narration}</p></article>
      <div className="mt-3 grid gap-2 sm:grid-cols-3"><ReplayList title="Ce qui était connu" items={replayFrame.known}/><ReplayList title="Ce qui était supposé" items={replayFrame.assumed}/><ReplayList title="Questions ouvertes" items={replayFrame.openQuestions}/></div>
      <div className="mt-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3"><span className="text-[9px] font-black uppercase tracking-[.1em] text-[#71839e]">État après cette étape</span><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"><Metric label="Événements" value={replayFrame.after.eventCount}/><Metric label="Hypothèses" value={replayFrame.after.hypotheses.length}/><Metric label="Risques" value={replayFrame.after.risks.length}/><Metric label="Mémoire" value={replayFrame.after.memories.length}/></div>{replayFrame.after.activeDecision && <p className="mt-2 text-[11px] leading-5 text-[#c8bddf]">Décision active : {replayFrame.after.activeDecision.summary}</p>}</div>
    </section>}

    {!replay && selectedSnapshot && currentSnapshot && <section className="mt-4 rounded-2xl border border-[#42d59d]/25 bg-[#42d59d]/[.05] p-4">
      <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#75d6b5]">B6.2.4 · Navigation temporelle</div><strong className="mt-1 block text-xs">État cognitif au {new Date(selectedSnapshot.at).toLocaleString("fr-FR")}</strong></div><button onClick={() => setCursorIndex(points.length - 1)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-[#9de7cd]">Aujourd’hui</button></div>
      <input aria-label="Curseur temporel" type="range" min={0} max={Math.max(0,points.length-1)} value={safeCursor} onChange={(event)=>setCursorIndex(Number(event.target.value))} className="mt-4 w-full accent-[#42d59d]" />
      <div className="mt-2 flex justify-between text-[9px] text-[#60748f]"><span>{points[0] ? new Date(points[0]).toLocaleDateString("fr-FR") : "—"}</span><span>{currentAt ? new Date(currentAt).toLocaleDateString("fr-FR") : "—"}</span></div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><Metric label="Événements connus" value={selectedSnapshot.eventCount}/><Metric label="Hypothèses" value={selectedSnapshot.hypotheses.length}/><Metric label="Risques" value={selectedSnapshot.risks.length}/><Metric label="Mémoire" value={selectedSnapshot.memories.length}/></div>
      <div className="mt-3 rounded-xl border border-white/[.07] bg-[#08131f]/75 p-3"><span className="text-[9px] font-black uppercase tracking-[.1em] text-[#667995]">Décision active à cet instant</span><p className="mt-1 text-xs leading-5 text-[#c3b9f5]">{selectedSnapshot.activeDecision?.summary ?? "Aucune décision formalisée à ce moment."}</p>{selectedSnapshot.confidence !== null && <span className="mt-1 block text-[10px] text-[#71839e]">Confiance disponible : {selectedSnapshot.confidence}%</span>}</div>
      {safeCursor < points.length - 1 && temporalDiff && <div className="mt-3 rounded-xl border border-[#7c5cff]/20 bg-[#7c5cff]/[.05] p-3"><span className="text-[9px] font-black uppercase tracking-[.1em] text-[#a995ff]">Depuis cet instant</span><p className="mt-1 text-[11px] leading-5 text-[#aab7ca]">{temporalDiff.added.length} nouvel(aux) événement(s) cognitif(s){temporalDiff.confidenceDelta !== null ? ` · confiance ${temporalDiff.confidenceDelta >= 0 ? "+" : ""}${temporalDiff.confidenceDelta} pts` : ""}.</p></div>}
    </section>}

    {!replay && diffs.length > 0 && <section className="mt-4 rounded-2xl border border-[#a995ff]/25 bg-[#7c5cff]/[.06] p-4"><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#b7a9ff]">B6.2.3 · Évolution des décisions</div><div className="mt-3 space-y-3">{diffs.slice(0,3).map((diff)=><article key={diff.id} className="rounded-xl border border-white/[.08] bg-[#08131f]/75 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-xs">Décision v{diff.from.version} → v{diff.to.version}</strong>{diff.confidenceDelta!==null && <span className="rounded-full bg-[#7c5cff]/10 px-2 py-1 text-[10px] text-[#b7a9ff]">{diff.confidenceDelta>=0?"+":""}{diff.confidenceDelta} pts confiance</span>}</div><p className="mt-2 text-[11px] leading-5 text-[#9fb0c4]">{diff.changeSummary}</p></article>)}</div></section>}

    {!replay && <div className="mt-4 space-y-3">{cycles.length ? cycles.slice(0,8).map((cycle,index)=><article key={cycle.id} className={`rounded-2xl border p-4 ${index===0 ? "border-[#42d59d]/35 bg-[#42d59d]/8" : "border-white/[.08] bg-white/[.025]"}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-[.12em] text-[#75d6b5]">Cycle #{cycle.sequence}</span><div className="flex gap-2"><button onClick={()=>{const pointIndex=points.findIndex((point)=>point===cycle.endedAt);if(pointIndex>=0)setCursorIndex(pointIndex);}} className="text-[10px] text-[#9d83ff]">Voir à cet instant</button><button onClick={()=>{setReplayCycleId(cycle.id);setReplayFrameIndex(0);}} className="rounded-lg border border-[#f4c76d]/25 bg-[#f4c76d]/[.06] px-2 py-1 text-[10px] font-bold text-[#f4c76d]">▶ Rejouer</button></div></div><strong className="mt-2 block text-sm leading-5">{cycle.trigger?.summary ?? cycle.title.replace(/^Cycle #\d+ · /,"")}</strong><div className="mt-3 flex flex-wrap items-center gap-1.5">{orionCycleProgress(cycle).map((step,stepIndex,steps)=><span key={`${cycle.id}:${step}`} className="contents"><span className="rounded-full border border-white/[.08] bg-white/[.04] px-2 py-1 text-[10px] text-[#a9b8ca]">{step}</span>{stepIndex<steps.length-1 && <span className="text-[10px] text-[#52647f]">→</span>}</span>)}</div><p className="mt-3 text-xs leading-5 text-[#9fb0c4]">{cycle.summary}</p></article>) : <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4 text-xs leading-5 text-[#91a2bd]">Aucun cycle cognitif disponible.</div>}</div>}
  </aside>;
}

function Metric({label,value}:{label:string;value:number}){return <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-2.5"><span className="text-[9px] uppercase text-[#667995]">{label}</span><strong className="mt-1 block text-lg">{value}</strong></div>}
function ReplayList({title,items}:{title:string;items:string[]}){return <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3"><span className="text-[9px] font-black uppercase tracking-[.1em] text-[#8b806b]">{title}</span><div className="mt-2 space-y-1">{items.length?items.map((item,index)=><p key={`${title}:${index}`} className="text-[10px] leading-4 text-[#b7ad99]">• {item}</p>):<p className="text-[10px] text-[#625c50]">Aucun élément.</p>}</div></div>}
