"use client";

import { useMemo, useState } from "react";
import { DecisionWorkbench } from "@/components/decision-workbench";
import { ReasoningGraph } from "@/components/reasoning-graph";
import { runConversationRuntime, type CognitiveExtraction } from "@/lib/conversation-runtime";
import type { DecisionFrame } from "@/lib/decision-room";
import { challengeScore } from "@/lib/scheduler";
import { useExecutiveStore } from "@/store/executive-store";

export function ExecutiveWorkspace() {
  const store = useExecutiveStore();
  const [input, setInput] = useState("");
  const [lastExtractions, setLastExtractions] = useState<CognitiveExtraction[]>([]);
  const [lastNextAction, setLastNextAction] = useState("");
  const [decisionFrame, setDecisionFrame] = useState<DecisionFrame | null>(null);
  const [showGraph, setShowGraph] = useState(true);

  const ranked = useMemo(() => [...store.challenges].sort((a, b) => challengeScore(b) - challengeScore(a)), [store.challenges]);
  const active = store.challenges.find((item) => item.id === store.activeChallengeId) ?? ranked[0];
  const messages = store.messages.filter((message) => message.challengeId === active.id);
  const decisions = store.decisions.filter((decision) => decision.challengeId === active.id);
  const actions = store.actions.filter((action) => action.challengeId === active.id);

  function processMessage(message: string) {
    const clean = message.trim();
    if (!clean) return;
    const result = runConversationRuntime(clean, active);
    const now = new Date().toISOString();

    store.updateChallenge({ ...active, ...result.challengePatch });
    store.addMessages([
      { id: crypto.randomUUID(), challengeId: active.id, role: "user", text: clean, createdAt: now },
      { id: crypto.randomUUID(), challengeId: active.id, role: "assistant", text: result.response, createdAt: now }
    ]);
    store.addEvent("ConversationParsed", `${result.intent} · ${result.extractions.length} objets détectés`);

    const decision = result.extractions.find((item) => item.kind === "decision");
    if (decision) {
      store.addDecision({ id: crypto.randomUUID(), challengeId: active.id, recommendation: result.nextAction, finalDecision: decision.text, rationale: "Décision extraite de la conversation.", confidence: decision.confidence, createdAt: now });
      store.addEvent("DecisionCaptured", decision.text);
    }

    const action = result.extractions.find((item) => item.kind === "action");
    if (action) createAction(action.text);

    setLastExtractions(result.extractions);
    setLastNextAction(result.nextAction);
    setDecisionFrame(result.decisionFrame ?? null);
    setInput("");
  }

  function createAction(title: string) {
    store.addActions([{ id: crypto.randomUUID(), challengeId: active.id, title, owner: "À assigner", progress: 0, status: "todo" }]);
    store.addEvent("ActionCreated", title);
  }

  return (
    <div className="grid min-h-screen grid-cols-[270px_1fr] max-md:grid-cols-1">
      <aside className="border-r border-white/10 bg-[#050b15]/90 p-5 max-md:hidden">
        <div className="mb-8 flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#9d83ff] to-[#5c39e8] font-black">E</div><div><strong>ExecutiveOS</strong><span className="block text-xs text-[#91a2bd]">Cognitive workspace</span></div></div>
        <div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">ACTIVE CHALLENGES</div>
        <div className="mt-3 grid gap-2">
          {ranked.map((challenge) => <button key={challenge.id} onClick={() => { store.setActiveChallenge(challenge.id); setLastExtractions([]); setLastNextAction(""); setDecisionFrame(null); }} className={`rounded-xl border p-3 text-left ${active.id === challenge.id ? "border-[#7c5cff]/50 bg-[#7c5cff]/10" : "border-white/10 bg-white/[.02]"}`}><span className="block font-semibold">{challenge.title}</span><span className="mt-1 block text-xs text-[#91a2bd]">Score {challengeScore(challenge)} · {challenge.state}</span></button>)}
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="text-xs font-black tracking-[.12em] text-[#8d7ce4]">RUNTIME STATUS</div><div className="mt-3 grid gap-2 text-sm text-[#cfd8e8]"><span>● Context Engine</span><span>● Scheduler</span><span>● Decision Ledger</span><span>● Cognitive Graph</span></div></div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-white/10 bg-[#07111f]/80 px-7 backdrop-blur"><div>ExecutiveOS / <strong>{active.title}</strong></div><div className="flex gap-2"><button onClick={() => setShowGraph(!showGraph)} className="executive-button executive-ghost">{showGraph ? "Masquer" : "Afficher"} le graphe</button><button onClick={store.runCriticalSimulation} className="executive-button executive-ghost">Signal critique</button></div></header>

        <section className="mx-auto max-w-[1550px] p-6">
          <div className="mb-5"><div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">EXECUTIVE CONVERSATION</div><h1 className="mt-2 text-4xl font-bold">Que souhaites-tu résoudre aujourd’hui ?</h1><p className="mt-2 text-[#91a2bd]">Parle naturellement. ExecutiveOS structure le raisonnement et ouvre un espace de travail interactif pour les décisions.</p></div>

          <div className={`grid gap-5 ${showGraph ? "grid-cols-[1.15fr_.85fr] max-xl:grid-cols-1" : "grid-cols-1"}`}>
            <article className="executive-card overflow-hidden">
              <div className="max-h-[560px] min-h-[500px] overflow-auto p-5">{messages.length ? messages.map((message) => <div key={message.id} className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 leading-7 ${message.role === "user" ? "bg-[#6b49df] text-white" : "border border-white/10 bg-[#16243c] text-[#e8edf6]"}`}>{message.text}</div></div>) : <div className="grid min-h-[430px] place-items-center text-[#91a2bd]">Commence par « J’ai une idée », « J’ai un problème » ou « Je dois prendre une décision ».</div>}</div>
              <div className="border-t border-white/10 p-4"><div className="flex gap-3 max-sm:flex-col"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); processMessage(input); } }} placeholder="J’ai une idée…" className="min-h-24 flex-1 resize-none rounded-2xl border border-white/10 bg-[#0d1727] p-4 outline-none"/><button onClick={() => processMessage(input)} className="executive-button executive-primary self-end px-6 py-4">Analyser</button></div><div className="mt-3 flex flex-wrap gap-2">{["J’ai une idée", "Je dois prendre une décision", "J’ai un problème", "Reprendre là où j’en étais"].map((prompt) => <button key={prompt} onClick={() => setInput(prompt + " : ")} className="rounded-full border border-white/10 px-3 py-2 text-xs text-[#91a2bd]">{prompt}</button>)}</div></div>
            </article>

            {showGraph && <div className="grid gap-5"><article className="executive-card p-5"><div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">LIVE REASONING</div><div className="mt-4 grid grid-cols-3 gap-3"><Metric label="Priority" value={challengeScore(active)}/><Metric label="Confidence" value={`${active.confidence}%`}/><Metric label="Risk" value={`${active.risk}/10`}/></div><div className="mt-4 rounded-2xl border border-white/10 bg-white/[.025] p-4"><strong>Prochaine meilleure action</strong><p className="mt-2 text-[#d6dfed]">{lastNextAction || active.context}</p></div></article><ReasoningGraph challenge={active}/><article className="executive-card p-5"><div className="flex items-center justify-between"><div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">STRUCTURED OUTPUT</div><span className="text-xs text-[#91a2bd]">{lastExtractions.length} objets</span></div><div className="mt-3 grid gap-2">{lastExtractions.length ? lastExtractions.map((item, index) => <div key={`${item.kind}-${index}`} className="rounded-xl border border-white/10 bg-white/[.025] p-3"><div className="text-xs font-black uppercase tracking-[.12em] text-[#9d83ff]">{item.kind} · {item.confidence}%</div><p className="mt-1 text-sm text-[#d6dfed]">{item.text}</p></div>) : <span className="text-sm text-[#91a2bd]">Les extractions apparaîtront ici après ton message.</span>}</div></article></div>}
          </div>

          {decisionFrame && <DecisionWorkbench frame={decisionFrame} onContextSubmit={(summary) => processMessage(summary)} onCreateAction={createAction}/>} 

          <div className="mt-5 grid grid-cols-2 gap-5 max-lg:grid-cols-1"><article className="executive-card p-5"><div className="text-xs font-black tracking-[.14em] text-[#42d59d]">DECISION LEDGER</div><div className="mt-3 grid gap-3">{decisions.length ? decisions.slice(0, 3).map((decision) => <div key={decision.id} className="rounded-xl border border-white/10 p-3"><strong>{decision.finalDecision}</strong><p className="mt-1 text-sm text-[#91a2bd]">{decision.rationale}</p></div>) : <span className="text-sm text-[#91a2bd]">Aucune décision détectée.</span>}</div></article><article className="executive-card p-5"><div className="text-xs font-black tracking-[.14em] text-[#ffbc57]">OPEN ACTIONS</div><div className="mt-3 grid gap-3">{actions.length ? actions.slice(0, 4).map((action) => <div key={action.id} className="rounded-xl border border-white/10 p-3"><strong>{action.title}</strong><p className="mt-1 text-sm text-[#91a2bd]">{action.owner} · {action.status}</p></div>) : <span className="text-sm text-[#91a2bd]">Aucune action détectée.</span>}</div></article></div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-white/10 bg-white/[.025] p-3"><span className="block text-xs text-[#91a2bd]">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>; }
