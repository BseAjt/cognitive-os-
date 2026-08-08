"use client";

import { useMemo, useState } from "react";
import { DecisionCanvas } from "@/components/decision-canvas";
import { DecisionWorkbench } from "@/components/decision-workbench";
import { OrionExecutiveCyclePanel } from "@/components/orion-executive-cycle-panel";
import { DecisionWatchPanel } from "@/components/decision-watch-panel";
import { ReasoningGraph } from "@/components/reasoning-graph";
import { buildCognitiveRecall } from "@/lib/cognitive-recall";
import type { CognitiveExtraction } from "@/lib/conversation-runtime";
import { buildDecisionFrame, type DecisionFrame } from "@/lib/decision-runtime";
import { buildExecutiveCaseBrief } from "@/lib/executive-brief";
import { caseScore } from "@/lib/scheduler";
import { runUnifiedRuntime } from "@/lib/unified-runtime";
import { useExecutiveStore } from "@/store/executive-store";
import type { DossierObjectRecord } from "@/domain/canonical";

export function ExecutiveWorkspace() {
  const store = useExecutiveStore();
  const [input, setInput] = useState("");
  const [lastExtractions, setLastExtractions] = useState<CognitiveExtraction[]>([]);
  const [lastNextAction, setLastNextAction] = useState("");
  const [decisionFrame, setDecisionFrame] = useState<DecisionFrame | null>(null);
  const [showGraph, setShowGraph] = useState(false);

  const ranked = useMemo(() => [...store.cases].sort((a, b) => caseScore(b) - caseScore(a)), [store.cases]);
  const active = store.cases.find((item) => item.id === store.activeCaseId) ?? ranked[0];

  if (!active) {
    return <div className="grid min-h-[60vh] place-items-center text-[#91a2bd]">Aucun dossier cognitif disponible.</div>;
  }

  const messages = store.messages.filter((message) => message.caseId === active.id);
  const decisions = store.decisions.filter((decision) => decision.caseId === active.id);
  const actions = store.actions.filter((action) => action.caseId === active.id);
  const caseObjects = store.caseObjects.filter((item) => item.caseId === active.id);
  const brief = buildExecutiveCaseBrief({ cognitiveCase: active, decisions: store.decisions, actions: store.actions, caseObjects: store.caseObjects, learningEvents: store.learningEvents, reflections: store.reflections, contextSources:store.contextSources, contextEvidence:store.contextEvidence, executiveCycles:store.executiveCycles, decisionActionPlans:store.decisionActionPlans, decisionWatches:store.decisionWatches });
  const recall = buildCognitiveRecall({
    cognitiveCase: active,
    decisions: store.decisions,
    actions: store.actions,
    memories: store.memories,
    reasoningRevisions: store.reasoningRevisions,
    knowledgeEntities: store.knowledgeEntities,
    knowledgeRelations: store.knowledgeRelations,
    agentRuns: store.agentRuns
  });
  const effectiveFrame = decisionFrame ?? buildDecisionFrame(active.context || active.title, active);

  function processMessage(message: string) {
    const clean = message.trim();
    if (!clean) return;

    const result = runUnifiedRuntime({
      message: clean,
      cognitiveCase: active,
      agents: store.agents,
      memories: store.memories.filter((memory) => memory.caseId === active.id),
      knowledgeRecords: store.knowledgeRecords.filter((record) => record.caseId === active.id),
      recallSummary: store.contextSyntheses.find((item) => item.caseId === active.id)?.summary
        ? `${recall.summary}\n\nCONTEXTE SOURCÉ\n${store.contextSyntheses.find((item) => item.caseId === active.id)?.summary}`
        : recall.summary
    });
    store.applyRuntimeCycle({ caseId: active.id, userText: clean, result });

    setLastExtractions(result.conversation.extractions);
    setLastNextAction(result.nextAction);
    setDecisionFrame(result.conversation.decisionFrame ?? null);
    setInput("");
  }

  function createAction(title: string) {
    store.createAction({ caseId: active.id, title });
  }

  return (
    <div className="space-y-6 text-white">
      <OrionExecutiveCyclePanel caseId={active.id}/>
      <DecisionWatchPanel caseId={active.id}/>
      <article className={`executive-card p-5 ${brief.health === "critical" ? "border-red-400/30" : brief.health === "watch" ? "border-amber-300/25" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">EXECUTIVE BRIEF</div><p className="mt-1 text-xs text-[#71839e]">La situation du dossier en un regard, recalculée depuis les objets réels.</p></div>
          <span className="rounded-full border border-white/10 bg-white/[.025] px-3 py-1 text-xs uppercase text-[#a9b7ca]">{brief.health} · {brief.state}</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <BriefCard label="Objectif" value={brief.objective}/>
          <BriefCard label="Dernière décision" value={brief.latestDecision} meta={brief.decisionConfidence ? `${brief.decisionConfidence}% confiance` : undefined}/>
          <BriefCard label="Prochaine action" value={brief.nextAction}/>
          <BriefCard label="Dernier apprentissage" value={brief.latestLearning}/>
        </div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-[.12em] text-[#42d59d]">B7.6 · Synthèse exécutive sourcée</span><span className="text-[10px] uppercase text-[#71839e]">Watch {brief.watchStatus}</span></div><p className="mt-2 text-sm leading-6 text-[#d6dfed]">{brief.executiveSummary}</p>{brief.citedEvidence.length>0&&<div className="mt-3 grid gap-2 md:grid-cols-3">{brief.citedEvidence.map((item)=><div key={`${item.citation}:${item.claim}`} className="rounded-xl border border-white/[.07] bg-[#091422] p-3"><span className="rounded bg-[#7c5cff]/20 px-2 py-1 text-[10px] font-black text-[#c8c0ff]">{item.citation}</span><p className="mt-2 text-xs leading-5 text-[#a9b7ca]">{item.claim}</p><span className="mt-1 block text-[10px] text-[#667995]">{item.sourceTitle}</span></div>)}</div>}</div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <BriefList label="Blocages" values={brief.blockers} empty="Aucun blocage actif"/>
          <BriefList label="Risques critiques" values={brief.criticalRisks} empty="Aucun risque critique identifié"/>
          <div className="rounded-2xl border border-[#7c5cff]/25 bg-[#7c5cff]/10 p-4"><span className="text-[10px] font-black uppercase tracking-[.12em] text-[#b7a9ff]">Recommandation ORION</span><strong className="mt-2 block text-sm leading-6">{brief.recommendation}</strong></div>
        </div>
      </article>

      <article className="executive-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">ORION · CONVERSATION DU DOSSIER</div>
            <p className="mt-1 text-xs text-[#71839e]">Historique persistant · {messages.length} message(s) · contexte {active.title}</p>
          </div>
          <span className="rounded-full border border-[#7c5cff]/30 bg-[#7c5cff]/10 px-3 py-1 text-xs text-[#c5baff]">Recall {recall.confidence}%</span>
        </div>

        <div className="mt-4 max-h-[560px] min-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-[#091422] p-4">
          {messages.length ? messages.map((message) => (
            <div key={message.id} className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${message.role === "user" ? "bg-[#6b49df] text-white" : "border border-white/10 bg-[#16243c] text-[#e8edf6]"}`}>
                <div className="mb-1 text-[10px] font-black uppercase tracking-[.12em] opacity-60">{message.role === "user" ? "Vous" : "ORION"}</div>
                {message.text}
              </div>
            </div>
          )) : (
            <div className="grid min-h-[330px] place-items-center text-center text-[#91a2bd]">
              <div><strong className="block text-white">Ce dossier n’a pas encore de conversation.</strong><span className="mt-2 block text-sm">Pose la première question à ORION. Elle restera attachée à ce dossier.</span></div>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3 max-sm:flex-col">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                processMessage(input);
              }
            }}
            placeholder={`Continuer le dossier “${active.title}”…`}
            className="min-h-24 flex-1 resize-none rounded-2xl border border-white/10 bg-[#0d1727] p-4 text-sm outline-none placeholder:text-[#52647f]"
          />
          <button onClick={() => processMessage(input)} className="executive-button executive-primary self-end px-6 py-4">Envoyer à ORION</button>
        </div>
      </article>

      <article className="executive-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">OBJETS DU DOSSIER</div><p className="mt-1 text-xs text-[#71839e]">Ce que la conversation a réellement créé et structuré.</p></div>
          <span className="rounded-full border border-white/10 bg-white/[.025] px-3 py-1 text-xs text-[#a9b7ca]">{caseObjects.length} objet(s)</span>
        </div>
        {caseObjects.length ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {(["question", "hypothesis", "risk", "decision", "action", "goal", "context"] as const).map((type) => {
              const records = caseObjects.filter((item) => item.type === type).slice(0, 5);
              if (!records.length) return null;
              return <DossierObjectGroup key={type} type={type} records={records} />;
            })}
          </div>
        ) : <p className="mt-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm text-[#91a2bd]">Les questions, hypothèses, risques, décisions et actions apparaîtront ici dès le prochain échange avec ORION.</p>}
      </article>

      <article className="executive-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">LÀ OÙ TU EN ÉTAIS</div><p className="mt-1 text-xs text-[#71839e]">Le recall est reconstruit depuis l’historique du dossier.</p></div>
          <span className="rounded-full border border-white/10 bg-white/[.025] px-3 py-1 text-xs text-[#a9b7ca]">{recall.openActions.length} action(s) ouverte(s)</span>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
          <p className="whitespace-pre-line rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm leading-6 text-[#d6dfed]">{recall.summary}</p>
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><span className="text-xs text-[#91a2bd]">Prochaine meilleure action</span><strong className="mt-2 block text-sm leading-6">{lastNextAction || recall.nextBestAction}</strong></div>
        </div>
      </article>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">DECISION CANVAS</div><p className="mt-1 text-xs text-[#71839e]">La conversation et le canvas partagent le même dossier et le même état cognitif.</p></div>
          <button onClick={() => setShowGraph(!showGraph)} className="executive-button executive-ghost text-xs">{showGraph ? "Masquer" : "Afficher"} le raisonnement</button>
        </div>
        <DecisionCanvas cognitiveCase={active} frame={effectiveFrame} decisions={decisions} actions={actions} onCreateAction={createAction} />
      </section>

      {showGraph && (
        <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
          <article className="executive-card p-5">
            <div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">LIVE REASONING</div>
            <div className="mt-4 grid grid-cols-3 gap-3"><Metric label="Priority" value={caseScore(active)}/><Metric label="Confidence" value={`${active.signals.confidence}%`}/><Metric label="Risk" value={`${active.signals.risk}/10`}/></div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.025] p-4"><strong>Dernières extractions</strong><div className="mt-3 grid gap-2">{lastExtractions.length ? lastExtractions.map((item, index) => <div key={`${item.kind}-${index}`} className="rounded-xl border border-white/10 bg-white/[.025] p-3"><div className="text-xs font-black uppercase tracking-[.12em] text-[#9d83ff]">{item.kind} · {item.confidence}%</div><p className="mt-1 text-sm text-[#d6dfed]">{item.text}</p></div>) : <span className="text-sm text-[#91a2bd]">Les extractions du prochain échange apparaîtront ici.</span>}</div></div>
          </article>
          <ReasoningGraph cognitiveCase={active} entities={store.knowledgeEntities} relations={store.knowledgeRelations}/>
        </div>
      )}

      {decisionFrame && <DecisionWorkbench frame={decisionFrame} onContextSubmit={(summary) => processMessage(summary)} onCreateAction={createAction}/>} 
    </div>
  );
}

function BriefCard({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><span className="text-[10px] font-black uppercase tracking-[.12em] text-[#71839e]">{label}</span><strong className="mt-2 block text-sm leading-6">{value}</strong>{meta && <span className="mt-1 block text-[10px] text-[#8d7ce4]">{meta}</span>}</div>;
}

function BriefList({ label, values, empty }: { label: string; values: string[]; empty: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><span className="text-[10px] font-black uppercase tracking-[.12em] text-[#71839e]">{label}</span><div className="mt-2 space-y-1">{values.length ? values.map((value, index) => <p key={`${label}-${index}`} className="text-sm leading-5 text-[#d6dfed]">• {value}</p>) : <p className="text-sm text-[#71839e]">{empty}</p>}</div></div>;
}

function DossierObjectGroup({ type, records }: { type: DossierObjectRecord["type"]; records: DossierObjectRecord[] }) {
  const labels: Record<DossierObjectRecord["type"], string> = { question: "Questions", goal: "Objectifs", hypothesis: "Hypothèses", context: "Contexte", risk: "Risques", decision: "Décisions", action: "Actions" };
  return <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
    <div className="flex items-center justify-between"><strong className="text-sm">{labels[type]}</strong><span className="text-[10px] uppercase tracking-[.12em] text-[#8d7ce4]">{records.length}</span></div>
    <div className="mt-3 space-y-2">{records.map((record) => <div key={record.id} className="rounded-xl border border-white/[.07] bg-[#0d1727] p-3"><div className="flex justify-between gap-3"><p className="text-sm leading-5 text-[#d6dfed]">{record.title}</p><span className="shrink-0 text-[10px] text-[#71839e]">{record.confidence}%</span></div><span className="mt-1 block text-[10px] uppercase tracking-[.1em] text-[#667995]">{record.status}</span></div>)}</div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-white/10 bg-white/[.025] p-3"><span className="block text-xs text-[#91a2bd]">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>;
}
