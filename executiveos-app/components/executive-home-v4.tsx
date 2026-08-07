"use client";

import { useMemo, useState } from "react";
import { ExecutiveWorkspace } from "@/components/executive-workspace";
import { entityCounts, executiveTwinSeed } from "@/lib/executive-twin-domain";

type View = "home" | "understand" | "decision" | "act" | "explore" | "settings";
type BrainNode = {
  id: string;
  label: string;
  kind: string;
  status: "stable" | "active" | "watch";
  score: number;
  summary: string;
  detail: string;
  target: View;
  x: number;
  y: number;
};

const NAV: Array<{ id: View; label: string }> = [
  { id: "home", label: "Accueil" },
  { id: "understand", label: "Comprendre" },
  { id: "decision", label: "Décider" },
  { id: "act", label: "Agir" },
  { id: "explore", label: "Explorer" },
  { id: "settings", label: "Paramètres" },
];

export function ExecutiveHomeV4() {
  const [view, setView] = useState<View>("home");
  const [selectedId, setSelectedId] = useState("decisions");
  const [prompt, setPrompt] = useState("");
  const counts = useMemo(() => entityCounts(executiveTwinSeed), []);
  const briefing = executiveTwinSeed.briefing;

  const nodes = useMemo<BrainNode[]>(() => [
    { id: "goals", label: "Objectifs", kind: "Direction", status: "stable", score: 88, summary: "Cap global cohérent", detail: "Les objectifs prioritaires restent compatibles avec la trajectoire UX actuelle.", target: "act", x: 18, y: 30 },
    { id: "decisions", label: "Décisions", kind: "Arbitrage", status: "active", score: Math.max(55, 90 - briefing.openDecisions * 7), summary: `${briefing.openDecisions} décision(s) ouverte(s)`, detail: "Les décisions ouvertes concentrent la majorité de l’incertitude actuelle.", target: "decision", x: 46, y: 18 },
    { id: "actions", label: "Actions", kind: "Exécution", status: "active", score: Math.max(60, 92 - briefing.dueCommitments * 6), summary: `${briefing.dueCommitments} engagement(s) à échéance`, detail: "L’exécution est saine mais dépend encore de plusieurs arbitrages.", target: "act", x: 74, y: 32 },
    { id: "memory", label: "Mémoire", kind: "Contexte", status: "stable", score: Math.min(96, 76 + (counts.memory ?? 0) * 4), summary: "Contexte disponible", detail: "Les mémoires et learnings utiles sont reliés aux sujets actifs.", target: "understand", x: 31, y: 67 },
    { id: "risk", label: "Risques", kind: "Vigilance", status: briefing.criticalRisks ? "watch" : "stable", score: Math.max(45, 96 - briefing.criticalRisks * 16), summary: `${briefing.criticalRisks} risque(s) critique(s)`, detail: "Les risques critiques doivent rester visibles avant tout engagement irréversible.", target: "understand", x: 64, y: 68 },
  ], [briefing, counts]);

  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const executiveScore = Math.round(nodes.reduce((sum, node) => sum + node.score, 0) / nodes.length);

  function submit() {
    if (!prompt.trim()) return;
    setPrompt("");
  }

  return <div className="min-h-screen bg-[#07111f] text-white md:grid md:grid-cols-[248px_minmax(0,1fr)]">
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/[.07] bg-[#091321] px-4 py-5 md:flex">
      <button onClick={() => setView("home")} className="mb-8 flex items-center gap-3 px-2 text-left"><span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#9b82ff] to-[#5b39e7] text-sm font-black">EO</span><span><strong className="block text-[15px]">ExecutiveOS</strong><span className="text-[10px] uppercase tracking-[.12em] text-[#6f819e]">Cognitive OS</span></span></button>
      <nav className="space-y-1">{NAV.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={`w-full rounded-xl px-3 py-2.5 text-left text-sm ${view === item.id ? "bg-white/[.08] text-white" : "text-[#8393ad] hover:bg-white/[.04]"}`}>{item.label}</button>)}</nav>
      <div className="mt-auto rounded-2xl border border-white/[.07] bg-white/[.025] p-3.5"><div className="flex items-center gap-2 text-xs text-[#a5b4c9]"><span className="size-2 rounded-full bg-[#42d59d]"/> ORION en ligne</div><p className="mt-2 text-[11px] leading-5 text-[#667995]">Executive Brain synchronisé.</p></div>
    </aside>

    <div className="min-w-0">
      <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#07111f]/88 px-4 py-3 backdrop-blur-2xl md:px-7"><div className="mx-auto flex max-w-[1540px] items-center gap-3"><div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/[.08] bg-[#0d192b]/90 px-4 py-3"><span className="text-[#bfb2ff]">✦</span><input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="Que souhaites-tu accomplir aujourd’hui ?" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#65758f]"/></div><div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#d7cfff] to-[#8b73ef] text-xs font-black text-[#1b1239]">SH</div></div></header>

      <main className="mx-auto max-w-[1540px] p-4 md:p-7 xl:p-9">
        {view === "home" && <Home nodes={nodes} selected={selected} selectedId={selectedId} onSelect={setSelectedId} score={executiveScore} onView={setView} />}
        {view === "decision" && <ExecutiveWorkspace />}
        {view === "understand" && <Simple title="Comprendre le contexte vivant." text="Mémoire, preuves, hypothèses et risques sont reliés ici."/>}
        {view === "act" && <Simple title="Transformer l’arbitrage en exécution." text="Les actions restent reliées aux décisions et objectifs qui les justifient."/>}
        {view === "explore" && <Simple title="Explorer le graphe sans perdre le fil." text="Les connexions servent le raisonnement au lieu d’être une fin en soi."/>}
        {view === "settings" && <Simple title="Configurer ExecutiveOS." text="Sources, sécurité, préférences et comportements d’ORION."/>}
      </main>
    </div>
  </div>;
}

function Home({ nodes, selected, selectedId, onSelect, score, onView }: { nodes: BrainNode[]; selected: BrainNode; selectedId: string; onSelect:(id:string)=>void; score:number; onView:(view:View)=>void }) {
  return <>
    <section className="mb-6"><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">Executive Home · UX2.4</div><h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] md:text-5xl">Executive Brain</h1><p className="mt-2 max-w-3xl text-lg text-[#8fa0ba]">Une carte vivante de ce qui est stable, actif ou à surveiller. Clique sur un nœud pour comprendre son contexte et agir.</p></section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(330px,.6fr)]">
      <article className="rounded-[28px] border border-white/[.08] bg-[linear-gradient(145deg,rgba(19,31,51,.98),rgba(9,19,33,.98))] p-5 md:p-7">
        <div className="flex items-center justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#9d83ff]">Contexte vivant</div><h2 className="mt-2 text-2xl font-semibold">Executive Brain</h2></div><div className="rounded-2xl border border-white/[.07] bg-white/[.03] px-4 py-2 text-right"><span className="block text-[10px] uppercase tracking-[.14em] text-[#667995]">Executive Score</span><strong className="text-2xl">{score}</strong></div></div>

        <div className="relative mt-6 h-[430px] overflow-hidden rounded-[22px] border border-white/[.07] bg-[#08121f]">
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,rgba(124,92,255,.35)_0,transparent_1.5px)] [background-size:28px_28px]" />
          <svg className="absolute inset-0 size-full" aria-hidden="true">
            <line x1="18%" y1="30%" x2="46%" y2="18%" stroke="rgba(124,92,255,.35)" strokeWidth="1.5"/>
            <line x1="46%" y1="18%" x2="74%" y2="32%" stroke="rgba(124,92,255,.35)" strokeWidth="1.5"/>
            <line x1="46%" y1="18%" x2="31%" y2="67%" stroke="rgba(124,92,255,.24)"/>
            <line x1="74%" y1="32%" x2="64%" y2="68%" stroke="rgba(255,188,87,.3)"/>
            <line x1="31%" y1="67%" x2="64%" y2="68%" stroke="rgba(66,213,157,.25)"/>
            <line x1="18%" y1="30%" x2="31%" y2="67%" stroke="rgba(66,213,157,.2)"/>
          </svg>
          {nodes.map((node) => <BrainNodeButton key={node.id} node={node} active={selectedId === node.id} onClick={() => onSelect(node.id)} />)}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-[#71839e]"><Legend dot="bg-[#42d59d]" label="Stable"/><Legend dot="bg-[#8f82ff]" label="Actif"/><Legend dot="bg-[#ffbc57]" label="À surveiller"/></div>
      </article>

      <aside className="rounded-[28px] border border-white/[.08] bg-[#0d192b]/88 p-6">
        <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#6f819e]">{selected.kind}</div><h2 className="mt-2 text-2xl font-semibold">{selected.label}</h2></div><StatusBadge status={selected.status}/></div>
        <div className="mt-6 flex items-end justify-between"><div><span className="text-[10px] uppercase tracking-[.13em] text-[#667995]">Santé du nœud</span><strong className="mt-1 block text-5xl">{selected.score}</strong></div><span className="text-sm text-[#8fa0ba]">/100</span></div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full bg-gradient-to-r from-[#7657ff] to-[#42d59d]" style={{width:`${selected.score}%`}}/></div>
        <div className="mt-6 rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="text-[10px] font-black uppercase tracking-[.15em] text-[#7f91ab]">Lecture ORION</div><strong className="mt-2 block text-base">{selected.summary}</strong><p className="mt-2 text-sm leading-6 text-[#91a2bd]">{selected.detail}</p></div>
        <button onClick={() => onView(selected.target)} className="mt-5 w-full rounded-xl bg-[#7c5cff] px-4 py-3 text-sm font-bold">Ouvrir le contexte →</button>
      </aside>
    </section>
  </>;
}

function BrainNodeButton({ node, active, onClick }: {node:BrainNode;active:boolean;onClick:()=>void}) {
  const tone = node.status === "stable" ? "#42d59d" : node.status === "watch" ? "#ffbc57" : "#8f82ff";
  return <button onClick={onClick} style={{left:`${node.x}%`, top:`${node.y}%`, borderColor:active ? tone : "rgba(255,255,255,.1)", boxShadow:active ? `0 0 0 4px ${tone}18, 0 14px 44px rgba(0,0,0,.35)` : undefined}} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-[#0e1b2e]/95 px-4 py-3 text-left transition hover:scale-[1.03]"><div className="flex items-center gap-2"><span className="size-2 rounded-full" style={{background:tone, boxShadow:`0 0 16px ${tone}`}}/><strong className="text-sm">{node.label}</strong></div><span className="mt-1 block text-[10px] uppercase tracking-[.12em] text-[#6d7f9a]">{node.score}/100</span></button>;
}

function StatusBadge({status}:{status:BrainNode["status"]}) { const map={stable:"Stable",active:"Actif",watch:"À surveiller"}; const cls=status==="stable"?"bg-[#42d59d]/10 text-[#7de5bd]":status==="watch"?"bg-[#ffbc57]/10 text-[#ffd895]":"bg-[#7c5cff]/12 text-[#c5bbff]"; return <span className={`rounded-full px-3 py-1 text-xs ${cls}`}>{map[status]}</span>; }
function Legend({dot,label}:{dot:string;label:string}) { return <span className="flex items-center gap-2"><span className={`size-2 rounded-full ${dot}`}/>{label}</span>; }
function Simple({title,text}:{title:string;text:string}) { return <section className="mx-auto max-w-4xl py-12"><h1 className="text-4xl font-semibold tracking-[-.035em]">{title}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#91a2bd]">{text}</p></section>; }
