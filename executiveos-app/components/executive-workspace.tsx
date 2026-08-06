"use client";

import { useMemo, useState } from "react";
import { challengeScore, explainPriority } from "@/lib/scheduler";
import { useExecutiveStore } from "@/store/executive-store";
import { ReasoningGraph } from "@/components/reasoning-graph";

type View = "room" | "graph" | "ledger" | "events";

export function ExecutiveWorkspace() {
  const [view, setView] = useState<View>("room");
  const store = useExecutiveStore();

  const ranked = useMemo(
    () => [...store.challenges].sort((a, b) => challengeScore(b) - challengeScore(a)),
    [store.challenges]
  );

  const active = store.challenges.find((challenge) => challenge.id === store.activeChallengeId) ?? ranked[0];
  const activeDecisions = store.decisions.filter((decision) => decision.challengeId === active.id);
  const activeActions = store.actions.filter((action) => action.challengeId === active.id);

  function acceptRecommendation() {
    const finalDecision = active.confidence < 55 || active.risk >= 8
      ? "Réduire le périmètre et lancer un test utilisateur immédiat."
      : "Poursuivre le Challenge avec un jalon de validation court.";

    store.addDecision({
      id: crypto.randomUUID(),
      challengeId: active.id,
      recommendation: "Concentrer l’attention sur l’hypothèse la plus risquée.",
      finalDecision,
      rationale: "Le Scheduler privilégie le meilleur ratio impact, urgence, confiance et coût cognitif.",
      confidence: active.confidence,
      createdAt: new Date().toISOString()
    });

    store.addActions([
      { id: crypto.randomUUID(), challengeId: active.id, title: "Définir le test de validation", owner: "Chief of Staff", progress: 0, status: "todo" },
      { id: crypto.randomUUID(), challengeId: active.id, title: "Conduire cinq entretiens dirigeants", owner: "Founder", progress: 0, status: "todo" }
    ]);

    store.addEvent("DecisionCommitted", finalDecision);
    setView("ledger");
  }

  return (
    <div className="grid min-h-screen grid-cols-[280px_1fr] max-md:grid-cols-1">
      <aside className="border-r border-white/10 bg-[#050b15]/90 p-5 max-md:hidden">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#9d83ff] to-[#5c39e8] font-black">E</div>
          <div><strong>ExecutiveOS</strong><span className="block text-xs text-[#91a2bd]">Decision Operating System</span></div>
        </div>

        <nav className="grid gap-1">
          {[["room", "Executive Room"], ["graph", "Reasoning Graph"], ["ledger", "Decision Ledger"], ["events", "Cognitive Bus"]].map(([id, label]) => (
            <button key={id} onClick={() => setView(id as View)} className={`rounded-xl px-3 py-3 text-left ${view === id ? "bg-[#7c5cff]/15 text-white" : "text-[#91a2bd]"}`}>
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-8 text-xs font-bold tracking-[.14em] text-[#8d7ce4]">CHALLENGES</div>
        <div className="mt-3 grid gap-2">
          {ranked.map((challenge) => (
            <button key={challenge.id} onClick={() => store.setActiveChallenge(challenge.id)} className={`rounded-xl border px-3 py-3 text-left ${active.id === challenge.id ? "border-[#7c5cff]/50 bg-[#7c5cff]/10" : "border-white/10 bg-white/[.02]"}`}>
              <span className="block font-semibold">{challenge.title}</span>
              <span className="text-xs text-[#91a2bd]">Score {challengeScore(challenge)}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-white/10 bg-[#07111f]/80 px-7 backdrop-blur">
          <div>ExecutiveOS / <strong>{labelFor(view)}</strong></div>
          <button onClick={store.runCriticalSimulation} className="executive-button executive-ghost">Simuler un changement critique</button>
        </header>

        <section className="mx-auto max-w-[1450px] p-7">
          {view === "room" && (
            <>
              <div className="mb-6">
                <div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">EXECUTIVE ROOM</div>
                <h1 className="mt-2 text-4xl font-bold">{active.title}</h1>
                <p className="mt-2 text-[#91a2bd]">{active.goal}</p>
              </div>

              <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
                <Metric label="Priority score" value={challengeScore(active)} />
                <Metric label="Confidence" value={`${active.confidence}%`} />
                <Metric label="Risk" value={`${active.risk}/10`} />
                <Metric label="Open actions" value={activeActions.filter((action) => action.status !== "done").length} />
              </div>

              <div className="mt-5 grid grid-cols-[1.15fr_.85fr] gap-5 max-xl:grid-cols-1">
                <article className="executive-card p-6">
                  <div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">WHAT CHANGED</div>
                  <h2 className="mt-2 text-2xl font-semibold">{active.context}</h2>
                  <div className="mt-6 grid gap-3">
                    {explainPriority(active).map((reason) => <div key={reason} className="rounded-xl border border-white/10 bg-white/[.025] p-3 text-[#d7dfec]">{reason}</div>)}
                  </div>
                </article>

                <article className="executive-card p-6">
                  <div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">EXECUTIVEOS RECOMMENDS</div>
                  <h2 className="mt-2 text-2xl font-semibold">{active.confidence < 55 || active.risk >= 8 ? "Réduire le périmètre et valider l’hypothèse critique." : "Continuer avec un jalon de validation court."}</h2>
                  <p className="mt-4 text-[#91a2bd]">Hypothèse principale : {active.hypothesis}</p>
                  <button onClick={acceptRecommendation} className="executive-button executive-primary mt-6 w-full">Transformer en décision</button>
                </article>
              </div>
            </>
          )}

          {view === "graph" && <><h1 className="mb-5 text-4xl font-bold">Reasoning Graph</h1><ReasoningGraph challenge={active} /></>}

          {view === "ledger" && (
            <><h1 className="mb-5 text-4xl font-bold">Decision Ledger</h1><div className="grid gap-4">
              {activeDecisions.length ? activeDecisions.map((decision) => <article key={decision.id} className="executive-card p-5"><div className="text-xs font-black tracking-[.14em] text-[#42d59d]">DECISION</div><h2 className="mt-2 text-2xl font-semibold">{decision.finalDecision}</h2><p className="mt-3 text-[#91a2bd]">{decision.rationale}</p><div className="mt-4 text-sm text-[#91a2bd]">Confidence {decision.confidence}% · {new Date(decision.createdAt).toLocaleString("fr-FR")}</div></article>) : <Empty text="Aucune décision enregistrée pour ce Challenge." />}
            </div></>
          )}

          {view === "events" && (
            <><h1 className="mb-5 text-4xl font-bold">Cognitive Bus</h1><div className="grid gap-3">
              {store.events.length ? store.events.map((event) => <article key={event.id} className="executive-card border-l-4 border-l-[#7c5cff] p-4"><strong>{event.type}</strong><p className="mt-1 text-[#d7dfec]">{event.detail}</p><span className="text-xs text-[#91a2bd]">{new Date(event.createdAt).toLocaleString("fr-FR")}</span></article>) : <Empty text="Aucun événement enregistré." />}
            </div></>
          )}
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <article className="executive-card p-5"><span className="text-sm text-[#91a2bd]">{label}</span><strong className="mt-2 block text-3xl">{value}</strong></article>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-[#91a2bd]">{text}</div>;
}

function labelFor(view: View) {
  return { room: "Executive Room", graph: "Reasoning Graph", ledger: "Decision Ledger", events: "Cognitive Bus" }[view];
}
