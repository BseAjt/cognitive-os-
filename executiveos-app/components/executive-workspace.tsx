"use client";

import { useMemo, useState } from "react";
import { DecisionCanvas } from "@/components/decision-canvas";
import { DecisionWorkbench } from "@/components/decision-workbench";
import { ReasoningGraph } from "@/components/reasoning-graph";
import type { CognitiveExtraction } from "@/lib/conversation-runtime";
import { buildDecisionFrame, type DecisionFrame } from "@/lib/decision-runtime";
import { caseScore } from "@/lib/scheduler";
import { runUnifiedRuntime } from "@/lib/unified-runtime";
import { useExecutiveStore } from "@/store/executive-store";

export function ExecutiveWorkspace() {
  const store = useExecutiveStore();
  const [input, setInput] = useState("");
  const [lastExtractions, setLastExtractions] = useState<CognitiveExtraction[]>([]);
  const [lastNextAction, setLastNextAction] = useState("");
  const [decisionFrame, setDecisionFrame] = useState<DecisionFrame | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [mode, setMode] = useState<"canvas" | "conversation">("canvas");

  const ranked = useMemo(() => [...store.cases].sort((a, b) => caseScore(b) - caseScore(a)), [store.cases]);
  const active = store.cases.find((item) => item.id === store.activeCaseId) ?? ranked[0];

  if (!active) {
    return <div className="grid min-h-[60vh] place-items-center text-[#91a2bd]">Aucun dossier cognitif disponible.</div>;
  }

  const messages = store.messages.filter((message) => message.caseId === active.id);
  const decisions = store.decisions.filter((decision) => decision.caseId === active.id);
  const actions = store.actions.filter((action) => action.caseId === active.id);
  const effectiveFrame = decisionFrame ?? buildDecisionFrame(active.context || active.title, active);

  function processMessage(message: string) {
    const clean = message.trim();
    if (!clean) return;

    const result = runUnifiedRuntime({ message: clean, cognitiveCase: active });
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
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[.08] bg-[#07111f]/90 px-4 py-3 backdrop-blur-2xl md:px-7">
        <div className="mx-auto flex max-w-[1580px] flex-wrap items-center justify-between gap-3">
          <div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#7c92b2]">Decision Workspace · UX3.1</div><strong className="mt-1 block text-lg">{active.title}</strong></div>
          <div className="flex items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.025] p-1">
            <button onClick={() => setMode("canvas")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === "canvas" ? "bg-[#7c5cff] text-white" : "text-[#8393ad]"}`}>Decision Canvas</button>
            <button onClick={() => setMode("conversation")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === "conversation" ? "bg-[#7c5cff] text-white" : "text-[#8393ad]"}`}>Conversation</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1580px] p-4 md:p-7">
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {ranked.map((cognitiveCase) => <button key={cognitiveCase.id} onClick={() => { store.setActiveCase(cognitiveCase.id); setLastExtractions([]); setLastNextAction(""); setDecisionFrame(null); }} className={`shrink-0 rounded-xl border px-3 py-2 text-left text-xs ${active.id === cognitiveCase.id ? "border-[#7c5cff]/45 bg-[#7c5cff]/10 text-white" : "border-white/[.08] bg-white/[.02] text-[#8393ad]"}`}><strong className="block">{cognitiveCase.title}</strong><span className="mt-1 block text-[10px]">Score {caseScore(cognitiveCase)} · {cognitiveCase.state}</span></button>)}
        </div>

        {mode === "canvas" && (
          <DecisionCanvas cognitiveCase={active} frame={effectiveFrame} decisions={decisions} actions={actions} onCreateAction={createAction} />
        )}

        {mode === "conversation" && (
          <section className="space-y-5">
            <div className={`grid gap-5 ${showGraph ? "grid-cols-[1.15fr_.85fr] max-xl:grid-cols-1" : "grid-cols-1"}`}>
              <article className="executive-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">EXECUTIVE CONVERSATION</div><p className="mt-1 text-xs text-[#71839e]">Le dialogue alimente directement le Decision Canvas.</p></div><button onClick={() => setShowGraph(!showGraph)} className="executive-button executive-ghost text-xs">{showGraph ? "Masquer" : "Afficher"} le graphe</button></div>
                <div className="max-h-[520px] min-h-[420px] overflow-auto p-5">{messages.length ? messages.map((message) => <div key={message.id} className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 leading-7 ${message.role === "user" ? "bg-[#6b49df] text-white" : "border border-white/10 bg-[#16243c] text-[#e8edf6]"}`}>{message.text}</div></div>) : <div className="grid min-h-[380px] place-items-center text-[#91a2bd]">Commence par « Je dois prendre une décision ».</div>}</div>
                <div className="border-t border-white/10 p-4"><div className="flex gap-3 max-sm:flex-col"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); processMessage(input); } }} placeholder="Je dois prendre une décision…" className="min-h-24 flex-1 resize-none rounded-2xl border border-white/10 bg-[#0d1727] p-4 outline-none"/><button onClick={() => processMessage(input)} className="executive-button executive-primary self-end px-6 py-4">Analyser</button></div></div>
              </article>

              {showGraph && <div className="grid gap-5"><article className="executive-card p-5"><div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">LIVE REASONING</div><div className="mt-4 grid grid-cols-3 gap-3"><Metric label="Priority" value={caseScore(active)}/><Metric label="Confidence" value={`${active.signals.confidence}%`}/><Metric label="Risk" value={`${active.signals.risk}/10`}/></div><div className="mt-4 rounded-2xl border border-white/10 bg-white/[.025] p-4"><strong>Prochaine meilleure action</strong><p className="mt-2 text-[#d6dfed]">{lastNextAction || active.context}</p></div></article><ReasoningGraph cognitiveCase={active}/><article className="executive-card p-5"><div className="flex items-center justify-between"><div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">STRUCTURED OUTPUT</div><span className="text-xs text-[#91a2bd]">{lastExtractions.length} objets</span></div><div className="mt-3 grid gap-2">{lastExtractions.length ? lastExtractions.map((item, index) => <div key={`${item.kind}-${index}`} className="rounded-xl border border-white/10 bg-white/[.025] p-3"><div className="text-xs font-black uppercase tracking-[.12em] text-[#9d83ff]">{item.kind} · {item.confidence}%</div><p className="mt-1 text-sm text-[#d6dfed]">{item.text}</p></div>) : <span className="text-sm text-[#91a2bd]">Les extractions apparaîtront ici après ton message.</span>}</div></article></div>}
            </div>

            {decisionFrame && <DecisionWorkbench frame={decisionFrame} onContextSubmit={(summary) => processMessage(summary)} onCreateAction={createAction}/>} 
          </section>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-white/10 bg-white/[.025] p-3"><span className="block text-xs text-[#91a2bd]">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>; }
