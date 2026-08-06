"use client";

import { useMemo, useState } from "react";
import { ExecutiveWorkspace } from "@/components/executive-workspace";
import { entityCounts, executiveTwinSeed } from "@/lib/executive-twin-domain";

type View = "home" | "decision" | "memory" | "graph";

export function ExecutiveTwinHome() {
  const [view, setView] = useState<View>("home");
  const counts = useMemo(() => entityCounts(executiveTwinSeed), []);
  const briefing = executiveTwinSeed.briefing;

  if (view === "decision") {
    return <div><TopNav view={view} onView={setView} /><ExecutiveWorkspace /></div>;
  }

  return (
    <div className="min-h-screen bg-[#07111f]">
      <TopNav view={view} onView={setView} />
      <main className="mx-auto max-w-[1500px] p-6 md:p-8">
        {view === "home" && <Home briefing={briefing} counts={counts} onDecision={() => setView("decision")} onMemory={() => setView("memory")} onGraph={() => setView("graph")} />}
        {view === "memory" && <MemoryView />}
        {view === "graph" && <GraphView />}
      </main>
    </div>
  );
}

function TopNav({ view, onView }: { view: View; onView: (view: View) => void }) {
  const items: Array<[View, string]> = [["home", "ExecutiveOS"], ["decision", "Decision Room"], ["memory", "Organizational Memory"], ["graph", "Enterprise Graph"]];
  return <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07111f]/90 px-6 py-4 backdrop-blur-xl"><div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4"><button onClick={() => onView("home")} className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#9d83ff] to-[#5c39e8] font-black">EO</span><span className="text-left"><strong className="block">ExecutiveOS</strong><span className="text-xs text-[#91a2bd]">Cognitive Operating System</span></span></button><nav className="flex flex-wrap gap-2">{items.map(([id, label]) => <button key={id} onClick={() => onView(id)} className={`rounded-xl px-4 py-2 text-sm ${view === id ? "bg-white/10 text-white" : "text-[#91a2bd] hover:bg-white/5"}`}>{label}</button>)}</nav></div></header>;
}

function Home({ briefing, counts, onDecision, onMemory, onGraph }: { briefing: typeof executiveTwinSeed.briefing; counts: Record<string, number>; onDecision: () => void; onMemory: () => void; onGraph: () => void }) {
  return <>
    <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <article className="executive-card overflow-hidden p-7 md:p-9">
        <div className="text-xs font-black tracking-[.18em] text-[#9d83ff]">EXECUTIVEOS BRIEFING</div>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">Bonjour Sébastien.<br/><span className="text-[#9eabc1]">Voici ce qui nécessite ton attention.</span></h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[#b8c4d6]">ExecutiveOS consolide le contexte, la mémoire organisationnelle et les décisions ouvertes. Il ne recommande aucune action irréversible tant que les preuves critiques sont incomplètes.</p>
        <div className="mt-8 flex flex-wrap gap-3"><button onClick={onDecision} className="executive-button executive-primary px-6 py-3">Ouvrir la Decision Room</button><button onClick={onMemory} className="executive-button executive-ghost px-6 py-3">Explorer la mémoire</button></div>
      </article>
      <article className="executive-card p-6"><div className="flex items-start justify-between"><div><span className="text-xs font-black tracking-[.14em] text-[#42d59d]">SYSTEM HEALTH</span><strong className="mt-3 block text-6xl">{briefing.twinHealth}%</strong></div><span className="rounded-full bg-[#ffbc57]/10 px-3 py-1 text-xs text-[#ffd895]">En apprentissage</span></div><div className="mt-6 h-3 overflow-hidden rounded-full bg-white/5"><div className="h-full bg-gradient-to-r from-[#7c5cff] to-[#42d59d]" style={{ width: `${briefing.twinHealth}%` }} /></div><p className="mt-5 text-sm leading-6 text-[#91a2bd]">Bonne couverture stratégique et financière. Les domaines humain, juridique et opérationnel doivent encore être consolidés.</p></article>
    </section>

    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Metric label="Décisions ouvertes" value={briefing.openDecisions} tone="violet" />
      <Metric label="Risques critiques" value={briefing.criticalRisks} tone="red" />
      <Metric label="Hypothèse invalidée" value={briefing.invalidatedHypotheses} tone="amber" />
      <Metric label="Engagements à échéance" value={briefing.dueCommitments} tone="blue" />
      <Metric label="Nouvelles connaissances" value={briefing.newKnowledge} tone="green" />
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
      <article className="executive-card p-6"><div className="text-xs font-black tracking-[.14em] text-[#ffbc57]">RECOMMANDATION EXECUTIVEOS</div><h2 className="mt-3 text-2xl font-semibold">{briefing.recommendation}</h2><p className="mt-3 leading-7 text-[#91a2bd]">Le dossier de transformation est actif. Les scénarios existent, mais la cible d’économies, le périmètre de postes, les alternatives et l’impact opérationnel doivent encore être vérifiés.</p><button onClick={onDecision} className="executive-button executive-primary mt-5">Continuer l’analyse</button></article>
      <article className="executive-card p-6"><div className="flex items-center justify-between"><div className="text-xs font-black tracking-[.14em] text-[#42d59d]">ORGANIZATIONAL MEMORY</div><button onClick={onGraph} className="text-xs text-[#b8acf8]">Voir le graphe →</button></div><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4"><SmallMetric label="Objets" value={executiveTwinSeed.entities.length} /><SmallMetric label="Relations" value={executiveTwinSeed.relations.length} /><SmallMetric label="Mémoires" value={counts.memory ?? 0} /><SmallMetric label="Learnings" value={counts.learning ?? 0} /></div><div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-4"><strong>Dernier apprentissage</strong><p className="mt-2 text-sm leading-6 text-[#aebbd0]">Protéger les compétences critiques avant toute réorganisation et rendre explicite le coût opérationnel des économies.</p></div></article>
    </section>
  </>;
}

function MemoryView() {
  const memories = executiveTwinSeed.entities.filter((item) => ["memory", "learning", "context_item"].includes(item.type));
  return <section><div className="mb-6"><div className="text-xs font-black tracking-[.16em] text-[#42d59d]">ORGANIZATIONAL MEMORY</div><h1 className="mt-2 text-4xl font-semibold">La mémoire du raisonnement</h1><p className="mt-2 text-[#91a2bd]">Les faits, hypothèses, apprentissages et décisions restent reliés à leurs sources et à leur contexte.</p></div><div className="grid gap-4 md:grid-cols-2">{memories.map((item) => <article key={item.id} className="executive-card p-5"><div className="flex justify-between gap-3"><span className="text-xs font-black uppercase tracking-wide text-[#9d83ff]">{item.type.replaceAll("_", " ")}</span><span className="text-xs text-[#91a2bd]">{item.status}</span></div><h2 className="mt-3 text-xl font-semibold">{item.title}</h2><p className="mt-3 text-sm text-[#91a2bd]">Source : {item.source}</p></article>)}</div></section>;
}

function GraphView() {
  return <section><div className="mb-6"><div className="text-xs font-black tracking-[.16em] text-[#8d7ce4]">ENTERPRISE KNOWLEDGE GRAPH</div><h1 className="mt-2 text-4xl font-semibold">Le contexte relié</h1><p className="mt-2 text-[#91a2bd]">Projection du graphe canonique d’ExecutiveOS.</p></div><div className="executive-card overflow-auto p-5"><div className="grid min-w-[900px] grid-cols-[.8fr_1.2fr_1fr] gap-4">{executiveTwinSeed.relations.map((edge) => { const source = executiveTwinSeed.entities.find((item) => item.id === edge.sourceId); const target = executiveTwinSeed.entities.find((item) => item.id === edge.targetId); return <div key={edge.id} className="contents"><div className="rounded-xl border border-white/10 bg-white/[.025] p-3 text-sm">{source?.title}</div><div className="grid place-items-center rounded-xl border border-[#7c5cff]/20 bg-[#7c5cff]/5 p-3 text-xs font-black text-[#b7a9ff]">{edge.relationType}<span className="font-normal text-[#91a2bd]">{edge.confidence}% · {edge.provenance}</span></div><div className="rounded-xl border border-white/10 bg-white/[.025] p-3 text-sm">{target?.title}</div></div>; })}</div></div></section>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) { const classes: Record<string, string> = { violet: "text-[#b8acf8]", red: "text-[#ff9dab]", amber: "text-[#ffd895]", blue: "text-[#8fc6ff]", green: "text-[#7aefc2]" }; return <article className="executive-card p-5"><span className="text-xs text-[#91a2bd]">{label}</span><strong className={`mt-2 block text-4xl ${classes[tone]}`}>{value}</strong></article>; }
function SmallMetric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-white/10 bg-white/[.025] p-3"><span className="block text-xs text-[#91a2bd]">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>; }
