"use client";

import { useMemo, useState } from "react";
import { ExecutiveWorkspace } from "@/components/executive-workspace";
import { entityCounts, executiveTwinSeed } from "@/lib/executive-twin-domain";

type View = "home" | "understand" | "decision" | "act" | "explore" | "settings";
type Priority = {
  id: string;
  action: string;
  title: string;
  impact: number;
  urgency: number;
  risk: number;
  dependency: number;
  target: View;
  reason: string;
};

const NAV: Array<{ id: View; label: string; icon: string }> = [
  { id: "home", label: "Accueil", icon: "⌂" },
  { id: "understand", label: "Comprendre", icon: "◫" },
  { id: "decision", label: "Décider", icon: "◇" },
  { id: "act", label: "Agir", icon: "✓" },
  { id: "explore", label: "Explorer", icon: "⌘" },
  { id: "settings", label: "Paramètres", icon: "⚙" }
];

export function ExecutiveHomeV3() {
  const [view, setView] = useState<View>("home");
  const [prompt, setPrompt] = useState("");
  const counts = useMemo(() => entityCounts(executiveTwinSeed), []);
  const briefing = executiveTwinSeed.briefing;

  const components = useMemo(() => {
    const memory = Math.min(100, 72 + (counts.memory ?? 0) * 4 + (counts.learning ?? 0) * 2);
    const reasoning = Math.max(0, 92 - briefing.invalidatedHypotheses * 10);
    const decisions = Math.max(0, 94 - briefing.openDecisions * 8);
    const execution = Math.max(0, 90 - briefing.dueCommitments * 6);
    const risk = Math.max(0, 96 - briefing.criticalRisks * 14);
    return [
      { label: "Mémoire", score: memory, detail: "Contexte disponible et relié" },
      { label: "Raisonnement", score: reasoning, detail: briefing.invalidatedHypotheses ? "Hypothèse à réévaluer" : "Raisonnement cohérent" },
      { label: "Décisions", score: decisions, detail: `${briefing.openDecisions} arbitrage(s) ouvert(s)` },
      { label: "Exécution", score: execution, detail: `${briefing.dueCommitments} engagement(s) à échéance` },
      { label: "Risque", score: risk, detail: `${briefing.criticalRisks} risque(s) critique(s)` }
    ];
  }, [briefing, counts]);

  const executiveScore = Math.round(components.reduce((sum, item) => sum + item.score, 0) / components.length);
  const previousScore = Math.max(0, executiveScore - 4);

  const priorities = useMemo<Priority[]>(() => {
    const items: Priority[] = [
      { id: "ux", action: "Décider", title: "Valider la trajectoire UX2", impact: 5, urgency: 5, risk: 3, dependency: 5, target: "decision", reason: "Cette décision débloque UX2.4 et UX2.5." },
      { id: "vercel", action: "Agir", title: "Nettoyer le doublon Vercel", impact: 3, urgency: 4, risk: 4, dependency: 2, target: "act", reason: "Réduit le bruit de déploiement et sécurise la source de vérité." },
      { id: "hypothesis", action: "Comprendre", title: "Réévaluer les hypothèses enrichies", impact: 4, urgency: 3, risk: Math.min(5, 2 + briefing.invalidatedHypotheses), dependency: 3, target: "understand", reason: "De nouvelles connaissances peuvent modifier une position existante." },
      { id: "graph", action: "Explorer", title: "Examiner les nouvelles connexions du graphe", impact: 2, urgency: 2, risk: 1, dependency: 1, target: "explore", reason: "Utile pour enrichir le contexte, sans bloquer l’exécution." }
    ];
    return items.sort((a, b) => priorityScore(b) - priorityScore(a));
  }, [briefing.invalidatedHypotheses]);

  const submit = () => {
    if (!prompt.trim()) return;
    setPrompt("");
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/[.07] bg-[#091321] px-4 py-5 md:flex">
        <button onClick={() => setView("home")} className="mb-8 flex items-center gap-3 px-2 text-left"><span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#9b82ff] to-[#5b39e7] text-sm font-black">EO</span><span><strong className="block text-[15px]">ExecutiveOS</strong><span className="text-[10px] uppercase tracking-[.12em] text-[#6f819e]">Cognitive OS</span></span></button>
        <nav className="space-y-1">{NAV.map(item => <button key={item.id} onClick={() => setView(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${view === item.id ? "bg-white/[.08] text-white" : "text-[#8393ad] hover:bg-white/[.04]"}`}><span className="grid size-7 place-items-center text-xs">{item.icon}</span>{item.label}</button>)}</nav>
        <div className="mt-auto rounded-2xl border border-white/[.07] bg-white/[.025] p-3.5"><div className="flex items-center gap-2 text-xs text-[#a5b4c9]"><span className="size-2 rounded-full bg-[#42d59d]"/> ORION en ligne</div><p className="mt-2 text-[11px] leading-5 text-[#667995]">Contexte synchronisé · score recalculé.</p></div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#07111f]/88 px-4 py-3 backdrop-blur-2xl md:px-7"><div className="mx-auto flex max-w-[1540px] items-center gap-3"><div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/[.08] bg-[#0d192b]/90 px-4 py-3"><span className="text-[#bfb2ff]">✦</span><input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }} placeholder="Que souhaites-tu accomplir aujourd’hui ?" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#65758f]"/></div><div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#d7cfff] to-[#8b73ef] text-xs font-black text-[#1b1239]">SH</div></div></header>

        <main className="mx-auto max-w-[1540px] p-4 md:p-7 xl:p-9">
          {view === "home" && <Home score={executiveScore} previousScore={previousScore} components={components} priorities={priorities} briefing={briefing} onView={setView} />}
          {view === "decision" && <ExecutiveWorkspace />}
          {view === "understand" && <Simple title="Comprendre avant d’arbitrer." text="Mémoire, hypothèses, preuves et évolutions du raisonnement sont regroupées ici." />}
          {view === "act" && <Simple title="Exécuter ce qui débloque le système." text="Les actions sont ordonnées selon leur effet sur les décisions et objectifs en cours." />}
          {view === "explore" && <Simple title="Explorer sans perdre le fil." text="Les nouvelles connexions restent reliées aux sujets, décisions et objectifs qui leur donnent du sens." />}
          {view === "settings" && <Simple title="Configurer ExecutiveOS." text="Sources, sécurité, comportements d’ORION et préférences de travail." />}
        </main>
      </div>
    </div>
  );
}

function Home({ score, previousScore, components, priorities, briefing, onView }: { score:number; previousScore:number; components:Array<{label:string;score:number;detail:string}>; priorities:Priority[]; briefing:typeof executiveTwinSeed.briefing; onView:(view:View)=>void }) {
  const delta = score - previousScore;
  return <>
    <section className="mb-6"><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">Executive Home · UX2.3</div><h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] md:text-5xl">Bonjour Sébastien.</h1><p className="mt-2 text-lg text-[#8fa0ba]">Voici ton état exécutif et ce qui doit passer en premier.</p></section>

    <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <article className="rounded-[28px] border border-white/[.08] bg-[linear-gradient(145deg,rgba(19,31,51,.98),rgba(9,19,33,.98))] p-6 md:p-8">
        <div className="flex items-start justify-between gap-6"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#42d59d]">Executive Score</div><div className="mt-3 flex items-end gap-3"><strong className="text-7xl font-semibold tracking-[-.06em]">{score}</strong><span className="mb-3 rounded-full bg-[#42d59d]/10 px-2.5 py-1 text-xs text-[#7de5bd]">↑ +{delta}</span></div></div><span className="rounded-full bg-[#42d59d]/10 px-3 py-1 text-xs text-[#7de5bd]">Stable</span></div>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[#91a2bd]">Le score synthétise mémoire, qualité du raisonnement, décisions ouvertes, exécution et risques. Il n’est pas une note de performance : il indique la santé du contexte décisionnel.</p>
        <div className="mt-6 space-y-4">{components.map(item => <ScoreRow key={item.label} {...item} />)}</div>
      </article>

      <article className="rounded-[28px] border border-white/[.08] bg-[#0d192b]/88 p-6 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#ffbc57]">Priorités intelligentes</div><h2 className="mt-2 text-2xl font-semibold">Ce qui doit passer en premier</h2></div><span className="text-xs text-[#667995]">impact · urgence · risque · dépendances</span></div>
        <div className="mt-5 divide-y divide-white/[.06]">{priorities.map((item, index) => <PriorityRow key={item.id} index={index + 1} item={item} onClick={() => onView(item.target)} />)}</div>
      </article>
    </section>

    <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/78 p-6">
        <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#9d83ff]">Pourquoi le score a changé</div>
        <div className="mt-4 grid gap-3 md:grid-cols-3"><Reason tone="good" title="Déploiement stabilisé" detail="Le build Vercel de référence est au vert." delta="+3"/><Reason tone="good" title="Continuité améliorée" detail="UX2.1 et UX2.2 réduisent la perte de contexte." delta="+2"/><Reason tone="watch" title="Décisions ouvertes" detail={`${briefing.openDecisions} arbitrage(s) réduisent la clarté exécutive.`} delta="−1"/></div>
      </article>
      <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/78 p-6"><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#8fb7ff]">ORION</div><h2 className="mt-3 text-xl font-semibold">Recommandation</h2><p className="mt-3 text-sm leading-7 text-[#91a2bd]">Valide d’abord la trajectoire UX2. C’est la priorité avec le meilleur effet combiné sur la progression, les dépendances et la réduction d’incertitude.</p><button onClick={() => onView("decision")} className="mt-5 rounded-xl bg-[#7c5cff] px-4 py-2.5 text-sm font-bold">Ouvrir la décision →</button></article>
    </section>
  </>;
}

function priorityScore(item: Priority) { return item.impact * 0.35 + item.urgency * 0.3 + item.risk * 0.2 + item.dependency * 0.15; }

function ScoreRow({ label, score, detail }: {label:string;score:number;detail:string}) { const tone = score >= 85 ? "bg-[#42d59d]" : score >= 70 ? "bg-[#8f82ff]" : "bg-[#ffbc57]"; return <div><div className="flex items-center justify-between gap-4"><div><strong className="text-sm">{label}</strong><span className="ml-2 text-xs text-[#71839e]">{detail}</span></div><span className="font-mono text-xs text-[#aebbd0]">{score}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className={`h-full rounded-full ${tone}`} style={{width:`${score}%`}}/></div></div>; }

function PriorityRow({ index, item, onClick }: {index:number;item:Priority;onClick:()=>void}) { const score = priorityScore(item); return <button onClick={onClick} className="grid w-full gap-3 py-4 text-left md:grid-cols-[42px_minmax(0,1fr)_180px_auto] md:items-center"><span className="font-mono text-xs text-[#53657f]">{String(index).padStart(2,"0")}</span><span><span className="text-[10px] font-black uppercase tracking-[.13em] text-[#9d83ff]">{item.action}</span><strong className="mt-1 block text-sm text-[#e8eef8] md:text-base">{item.title}</strong><span className="mt-1 block text-xs leading-5 text-[#71839e]">{item.reason}</span></span><span className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-[#71839e]"><span>Impact {item.impact}/5</span><span>Urgence {item.urgency}/5</span><span>Risque {item.risk}/5</span><span>Dépend. {item.dependency}/5</span></span><span className="flex items-center gap-2"><span className="rounded-lg bg-white/[.04] px-2 py-1 font-mono text-xs text-[#9faec2]">{score.toFixed(1)}</span><span className="text-[#53657f]">→</span></span></button>; }

function Reason({tone,title,detail,delta}:{tone:"good"|"watch";title:string;detail:string;delta:string}) { const cls=tone==="good"?"text-[#7de5bd] bg-[#42d59d]/10":"text-[#ffd895] bg-[#ffbc57]/10"; return <div className="rounded-2xl border border-white/[.07] bg-white/[.02] p-4"><span className={`rounded-full px-2 py-1 text-[10px] font-black ${cls}`}>{delta}</span><strong className="mt-3 block text-sm">{title}</strong><p className="mt-2 text-xs leading-5 text-[#71839e]">{detail}</p></div>; }
function Simple({title,text}:{title:string;text:string}) { return <section className="mx-auto max-w-4xl py-12"><h1 className="text-4xl font-semibold tracking-[-.035em]">{title}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#91a2bd]">{text}</p></section>; }
