"use client";

import { useMemo, useState } from "react";
import { calculateProductEvidence, INVESTOR_DEMO_STEPS } from "@/lib/investor-demo";
import { useExecutiveStore } from "@/store/executive-store";

export function InvestorDemoDashboard({ onOpenCase }: { onOpenCase: (id: string) => void }) {
  const store = useExecutiveStore();
  const [step, setStep] = useState(0);
  const metrics = useMemo(() => calculateProductEvidence(store), [store.cases, store.projects, store.ideas, store.contextSources, store.contextEvidence, store.decisions, store.actions, store.executiveCycles, store.decisionWatches]);
  const launchCase = store.cases.find((item) => item.id === "demo-launch");

  if (store.demoMode !== "investor") {
    return <article className="executive-card mb-7 overflow-hidden p-6 md:p-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#0071e3]">Investor Demo · Product Evidence</div><h2 className="mt-2 text-2xl font-semibold tracking-[-.03em] md:text-3xl">Voir ExecutiveOS avec une entreprise déjà vivante</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[#667085]">Charge un portefeuille fictif de projets, d’idées et de dossiers exécutifs pour démontrer toute la boucle cognitive sans présenter ces chiffres comme des résultats clients réels.</p></div>
        <button onClick={store.loadInvestorDemo} className="executive-button executive-primary shrink-0 px-5 py-3">Charger la démo investisseur</button>
      </div>
    </article>;
  }

  const cards = [
    ["Projets", store.projects.length, `${metrics.projectsInFlight} engagés`],
    ["Idées", metrics.ideasInPipeline, `${metrics.promotedIdeas} promues`],
    ["Dossiers actifs", metrics.activeCases, "usage transversal"],
    ["Sources consolidées", metrics.sourcesConsolidated, "provenance conservée"],
    ["Preuves structurées", metrics.evidenceStructured, `${metrics.traceabilityRate}% traçables`],
    ["Décisions sourcées", metrics.decisionsSourced, "arbitrages explicables"],
    ["Actions pilotées", metrics.actionsPiloted, `${metrics.executionRate}% terminées`],
    ["Décisions rouvertes", metrics.decisionsReopened, "signaux détectés"],
    ["Divergences", metrics.divergencesDetected, "positions confrontées"]
  ] as const;

  return <section className="mb-8 space-y-5" aria-label="Démonstration investisseur">
    <article className="executive-card overflow-hidden p-6 md:p-8">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#0071e3]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-[#0071e3]">Démo investisseur</span><span className="rounded-full border border-[#d8d3c9] px-3 py-1 text-[10px] uppercase text-[#6e6e73]">Données fictives · v{store.demoVersion}</span></div><h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-.04em] md:text-5xl">De 40 signaux dispersés à une décision réévaluée.</h1><p className="mt-4 max-w-3xl text-base leading-7 text-[#667085]">ExecutiveOS agrège le contexte, orchestre le raisonnement, formalise la décision, pilote l’exécution et détecte quand le monde réel invalide l’hypothèse.</p></div>
        {launchCase && <button onClick={() => onOpenCase(launchCase.id)} className="executive-button executive-primary shrink-0 px-5 py-3">Ouvrir le scénario principal →</button>}
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-9">{cards.map(([label, value, detail]) => <div key={label} className="rounded-[20px] border border-[#dedad1] bg-white/70 p-4"><strong className="block text-2xl tracking-[-.04em] text-[#1d1d1f]">{value}</strong><span className="mt-2 block text-xs font-semibold text-[#3a3a3c]">{label}</span><span className="mt-1 block text-[10px] leading-4 text-[#86868b]">{detail}</span></div>)}</div>
      <p className="mt-4 text-[10px] leading-4 text-[#86868b]">Les volumes et taux ci-dessus sont recalculés depuis le dataset affiché. Le temps économisé est une estimation modélisée, pas une performance client observée.</p>
    </article>

    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <article className="executive-card p-5 md:p-6">
        <div className="flex items-end justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#0071e3]">Portefeuille stratégique</div><h2 className="mt-2 text-xl font-semibold">Des initiatives reliées aux décisions</h2></div><span className="text-xs text-[#86868b]">Valeur moyenne {metrics.portfolioValue}/100</span></div>
        <div className="mt-5 space-y-3">{store.projects.slice().sort((a,b) => b.expectedValue - a.expectedValue).slice(0,6).map((project) => <div key={project.id} className="rounded-[18px] border border-[#dedad1] bg-white/65 p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[#1d1d1f]">{project.title}</strong><span className="rounded-full bg-[#0071e3]/10 px-2 py-0.5 text-[9px] font-bold uppercase text-[#0071e3]">{project.horizon}</span></div><p className="mt-1 text-xs leading-5 text-[#667085]">{project.summary}</p></div><strong className="text-lg text-[#1d1d1f]">{project.expectedValue}</strong></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e7e3db]"><div className="h-full rounded-full bg-[#0071e3]" style={{width:`${project.progress}%`}} /></div><div className="mt-2 flex justify-between text-[10px] text-[#86868b]"><span>{project.owner} · {project.theme}</span><span>{project.progress}% · {project.caseIds.length} dossier(s)</span></div></div>)}</div>
      </article>
      <article className="executive-card p-5 md:p-6">
        <div><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#0071e3]">Pipeline d’idées</div><h2 className="mt-2 text-xl font-semibold">De l’intuition à l’investissement</h2></div>
        <div className="mt-5 space-y-3">{store.ideas.slice().sort((a,b) => (b.expectedValue+b.feasibility) - (a.expectedValue+a.feasibility)).slice(0,6).map((idea) => <div key={idea.id} className="rounded-[18px] border border-[#dedad1] bg-white/65 p-4"><div className="flex items-start justify-between gap-3"><div><strong className="text-sm text-[#1d1d1f]">{idea.title}</strong><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#667085]">{idea.proposition}</p></div><span className="rounded-full bg-[#f0ede7] px-2 py-1 text-[9px] font-bold uppercase text-[#6e6e73]">{idea.status}</span></div><div className="mt-3 flex gap-4 text-[10px] text-[#86868b]"><span>Valeur <b className="text-[#1d1d1f]">{idea.expectedValue}</b></span><span>Faisabilité <b className="text-[#1d1d1f]">{idea.feasibility}</b></span><span>{idea.author}</span></div></div>)}</div>
      </article>
    </div>

    <article className="executive-card p-5 md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#0071e3]">Parcours guidé · 5 minutes</div><h2 className="mt-2 text-xl font-semibold">{INVESTOR_DEMO_STEPS[step].label}</h2><p className="mt-1 text-sm text-[#667085]">{INVESTOR_DEMO_STEPS[step].detail}</p></div><div className="flex gap-2"><button disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="executive-button executive-ghost px-4 py-2 disabled:opacity-40">Précédent</button><button onClick={() => step === INVESTOR_DEMO_STEPS.length - 1 && launchCase ? onOpenCase(launchCase.id) : setStep((current) => Math.min(INVESTOR_DEMO_STEPS.length - 1, current + 1))} className="executive-button executive-primary px-4 py-2">{step === INVESTOR_DEMO_STEPS.length - 1 ? "Voir la décision" : "Suivant"}</button></div></div>
      <div className="mt-5 grid gap-2 md:grid-cols-5">{INVESTOR_DEMO_STEPS.map((item, index) => <button key={item.id} onClick={() => setStep(index)} aria-current={step === index ? "step" : undefined} className={`h-1.5 rounded-full transition ${index <= step ? "bg-[#0071e3]" : "bg-[#d8d3c9]"}`}><span className="sr-only">{item.label}</span></button>)}</div>
    </article>
  </section>;
}
