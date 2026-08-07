"use client";

import { useMemo, useState } from "react";
import { ExecutiveWorkspace } from "@/components/executive-workspace";
import { entityCounts, executiveTwinSeed } from "@/lib/executive-twin-domain";

type View = "home" | "understand" | "decision" | "act" | "explore" | "settings";

const nav: Array<{ id: View; label: string; icon: string }> = [
  { id: "home", label: "Accueil", icon: "⌂" },
  { id: "understand", label: "Comprendre", icon: "◫" },
  { id: "decision", label: "Décider", icon: "◇" },
  { id: "act", label: "Agir", icon: "✓" },
  { id: "explore", label: "Explorer", icon: "⌘" },
  { id: "settings", label: "Paramètres", icon: "⚙" }
];

export function ExecutiveHomeV2() {
  const [view, setView] = useState<View>("home");
  const [prompt, setPrompt] = useState("");
  const [orion, setOrion] = useState("J’ai reconstitué ton contexte. Tu peux reprendre exactement là où tu t’étais arrêté.");
  const counts = useMemo(() => entityCounts(executiveTwinSeed), []);
  const briefing = executiveTwinSeed.briefing;

  const submit = () => {
    const clean = prompt.trim();
    if (!clean) return;
    setOrion(`ORION prépare « ${clean} » à partir de ton contexte actuel.`);
    setPrompt("");
  };

  return <div className="min-h-screen bg-[#07111f] text-white md:grid md:grid-cols-[248px_minmax(0,1fr)]">
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/[.07] bg-[#091321] px-4 py-5 md:flex">
      <button onClick={() => setView("home")} className="mb-8 flex items-center gap-3 px-2 text-left"><span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#9b82ff] to-[#5b39e7] text-sm font-black">EO</span><span><strong className="block text-[15px]">ExecutiveOS</strong><span className="text-[10px] uppercase tracking-[.12em] text-[#6f819e]">Cognitive OS</span></span></button>
      <nav className="space-y-1">{nav.map(item => <button key={item.id} onClick={() => setView(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${view === item.id ? "bg-white/[.08] text-white" : "text-[#8393ad] hover:bg-white/[.04]"}`}><span className="grid size-7 place-items-center text-xs">{item.icon}</span>{item.label}</button>)}</nav>
      <div className="mt-auto rounded-2xl border border-white/[.07] bg-white/[.025] p-3.5"><div className="flex items-center gap-2 text-xs text-[#a5b4c9]"><span className="size-2 rounded-full bg-[#42d59d]"/> ORION en ligne</div><p className="mt-2 text-[11px] leading-5 text-[#667995]">Mémoire, raisonnement et contexte synchronisés.</p></div>
    </aside>
    <div className="min-w-0">
      <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#07111f]/88 px-4 py-3 backdrop-blur-2xl md:px-7"><div className="mx-auto flex max-w-[1540px] items-center gap-3"><div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/[.08] bg-[#0d192b]/90 px-4 py-3"><span className="text-[#bfb2ff]">✦</span><input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }} placeholder="Que souhaites-tu accomplir aujourd’hui ?" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#65758f]"/></div><div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#d7cfff] to-[#8b73ef] text-xs font-black text-[#1b1239]">SH</div></div></header>
      <main className="mx-auto max-w-[1540px] p-4 md:p-7 xl:p-9">
        {view === "home" && <Home briefing={briefing} counts={counts} onView={setView} orion={orion}/>} 
        {view === "decision" && <ExecutiveWorkspace />}
        {view === "understand" && <Simple title="Tout le contexte utile, sans le bruit." text="Mémoire, faits, hypothèses et raisonnement sont consolidés ici."/>}
        {view === "act" && <Simple title="Exécuter ce qui compte maintenant." text="Les actions issues des décisions seront pilotées ici."/>}
        {view === "explore" && <Simple title="Explorer les connexions qui changent la compréhension." text="Le Knowledge Graph devient une navigation de contexte, pas un outil technique."/>}
        {view === "settings" && <Simple title="Configurer ExecutiveOS." text="Sources, préférences, sécurité et comportements d’ORION."/>}
      </main>
    </div>
  </div>;
}

function Home({ briefing, counts, onView, orion }: { briefing: typeof executiveTwinSeed.briefing; counts: Record<string, number>; onView: (v: View) => void; orion: string }) {
  const score = Math.min(100, Math.round(briefing.twinHealth + 8));
  return <>
    <section className="mb-6"><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">Executive Home · UX2.1</div><h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] md:text-5xl">Bonjour Sébastien.</h1><p className="mt-2 text-lg text-[#8fa0ba]">Tu n’as pas besoin de repartir de zéro.</p></section>
    <section className="grid gap-5 xl:grid-cols-[1.55fr_.72fr]">
      <article className="relative overflow-hidden rounded-[28px] border border-white/[.08] bg-[linear-gradient(145deg,rgba(19,31,51,.98),rgba(9,19,33,.98))] p-6 md:p-8"><span className="rounded-full bg-[#7c5cff]/13 px-2.5 py-1 text-[10px] font-black tracking-[.15em] text-[#baaaff]">REPRENDRE</span><h2 className="mt-5 text-3xl font-semibold tracking-[-.03em] md:text-5xl">Tu travaillais sur ExecutiveOS UX.</h2><p className="mt-4 max-w-3xl text-base leading-7 text-[#94a6c0]">UX1 est fusionné. Le shell est stable. ExecutiveOS te remet maintenant au bon endroit avec les éléments nouveaux et la prochaine action recommandée.</p><div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Change label="UX1" detail="fusionné dans main" tone="good"/><Change label="Vercel" detail="déploiement principal OK" tone="good"/><Change label="Connaissances" detail={`${briefing.newKnowledge} nouvelles`} tone="info"/><Change label="Décisions" detail={`${briefing.openDecisions} à arbitrer`} tone="watch"/></div><div className="mt-7 flex gap-3"><button onClick={() => onView("decision")} className="rounded-xl bg-[#7c5cff] px-5 py-3 text-sm font-bold">Continuer</button><button onClick={() => onView("understand")} className="rounded-xl border border-white/[.09] bg-white/[.035] px-5 py-3 text-sm text-[#bdc9da]">Voir le contexte complet</button></div></article>
      <article className="rounded-[28px] border border-white/[.08] bg-[#0d192b]/88 p-6"><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#9d83ff]">ORION</div><p className="mt-4 text-lg font-medium leading-8 text-[#dfe6f2]">{orion}</p><div className="mt-6 border-t border-white/[.07] pt-5"><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#6f819e]">Recommandation</div><p className="mt-2 text-sm leading-6 text-[#91a2bd]">Commence par valider la trajectoire UX2 avant d’ajouter de nouveaux moteurs.</p></div></article>
    </section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
      <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/78 p-6"><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#42d59d]">Executive Score</div><div className="mt-3 flex items-end gap-3"><strong className="text-6xl font-semibold">{score}</strong><span className="mb-2 rounded-full bg-[#42d59d]/10 px-2.5 py-1 text-xs text-[#7de5bd]">↑ +4</span></div><div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full bg-gradient-to-r from-[#7657ff] to-[#42d59d]" style={{ width: `${score}%` }}/></div><p className="mt-5 text-sm leading-6 text-[#91a2bd]">Ton contexte est cohérent. L’attention doit se concentrer sur les décisions ouvertes.</p><div className="mt-5 grid grid-cols-2 gap-2"><Mini label="Mémoire" value={counts.memory ?? 0}/><Mini label="Décisions" value={briefing.openDecisions}/><Mini label="Risques" value={briefing.criticalRisks}/><Mini label="Learnings" value={counts.learning ?? 0}/></div></article>
      <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/78 p-6"><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#ffbc57]">Aujourd’hui</div><h2 className="mt-2 text-xl font-semibold">Ce qui mérite ton attention</h2><div className="mt-4 divide-y divide-white/[.06]"><Priority n="01" action="Décider" title="Valider la trajectoire UX2" meta="Impact élevé · maintenant" onClick={() => onView("decision")}/><Priority n="02" action="Agir" title="Consolider le déploiement unique Vercel" meta="Technique · court terme" onClick={() => onView("act")}/><Priority n="03" action="Comprendre" title="Relier les signaux du Cognitive Twin" meta="Contexte enrichi" onClick={() => onView("understand")}/></div></article>
    </section>
  </>;
}

function Change({ label, detail, tone }: {label:string;detail:string;tone:"good"|"info"|"watch"}) { const c={good:"text-[#7de5bd]",info:"text-[#b8acf8]",watch:"text-[#ffd895]"}[tone]; return <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><strong className={`block text-sm ${c}`}>{label}</strong><span className="mt-1 block text-xs text-[#7587a2]">{detail}</span></div>; }
function Mini({label,value}:{label:string;value:number}) { return <div className="rounded-xl border border-white/[.06] bg-white/[.025] p-3"><span className="block text-[10px] uppercase text-[#667995]">{label}</span><strong className="mt-1 block text-lg">{value}</strong></div>; }
function Priority({n,action,title,meta,onClick}:{n:string;action:string;title:string;meta:string;onClick:()=>void}) { return <button onClick={onClick} className="grid w-full grid-cols-[42px_1fr_auto] items-center gap-3 py-4 text-left"><span className="font-mono text-xs text-[#53657f]">{n}</span><span><span className="text-[10px] font-black uppercase tracking-[.13em] text-[#9d83ff]">{action}</span><strong className="mt-1 block text-sm text-[#e8eef8] md:text-base">{title}</strong><span className="mt-1 block text-xs text-[#71839e]">{meta}</span></span><span className="text-[#53657f]">→</span></button>; }
function Simple({title,text}:{title:string;text:string}) { return <section className="mx-auto max-w-4xl py-12"><h1 className="text-4xl font-semibold tracking-[-.035em]">{title}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[#91a2bd]">{text}</p></section>; }
