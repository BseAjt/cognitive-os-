"use client";

import { useMemo, useState } from "react";
import { calculateProductEvidence, INVESTOR_DEMO_STEPS } from "@/lib/investor-demo";
import { useExecutiveStore } from "@/store/executive-store";

export function InvestorDemoDashboard({ onOpenCase }: { onOpenCase: (id: string) => void }) {
  const store = useExecutiveStore();
  const [step, setStep] = useState(0);
  const metrics = useMemo(() => calculateProductEvidence(store), [store.cases, store.contextSources, store.contextEvidence, store.decisions, store.actions, store.executiveCycles, store.decisionWatches]);
  const launchCase = store.cases.find((item) => item.id === "demo-launch");

  if (store.demoMode !== "investor") {
    return <article className="executive-card mb-7 overflow-hidden p-6 md:p-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#0071e3]">Investor Demo · Product Evidence</div><h2 className="mt-2 text-2xl font-semibold tracking-[-.03em] md:text-3xl">Voir ExecutiveOS avec une entreprise déjà vivante</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[#667085]">Charge cinq dossiers fictifs, clairement identifiés, pour démontrer toute la boucle cognitive sans présenter ces chiffres comme des résultats clients réels.</p></div>
        <button onClick={store.loadInvestorDemo} className="executive-button executive-primary shrink-0 px-5 py-3">Charger la démo investisseur</button>
      </div>
    </article>;
  }

  const cards = [
    ["Dossiers actifs", metrics.activeCases, "usage transversal"],
    ["Sources consolidées", metrics.sourcesConsolidated, "provenance conservée"],
    ["Preuves structurées", metrics.evidenceStructured, `${metrics.traceabilityRate}% traçables`],
    ["Décisions sourcées", metrics.decisionsSourced, "arbitrages explicables"],
    ["Actions pilotées", metrics.actionsPiloted, `${metrics.executionRate}% terminées`],
    ["Décisions rouvertes", metrics.decisionsReopened, "signaux détectés"],
    ["Divergences", metrics.divergencesDetected, "positions confrontées"],
    ["Temps modélisé", `${metrics.estimatedHoursSaved} h`, "estimation de démo"]
  ] as const;

  return <section className="mb-8 space-y-5" aria-label="Démonstration investisseur">
    <article className="executive-card overflow-hidden p-6 md:p-8">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#0071e3]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-[#0071e3]">Démo investisseur</span><span className="rounded-full border border-[#d8d3c9] px-3 py-1 text-[10px] uppercase text-[#6e6e73]">Données fictives · v{store.demoVersion}</span></div><h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-.04em] md:text-5xl">De 40 signaux dispersés à une décision réévaluée.</h1><p className="mt-4 max-w-3xl text-base leading-7 text-[#667085]">ExecutiveOS agrège le contexte, orchestre le raisonnement, formalise la décision, pilote l’exécution et détecte quand le monde réel invalide l’hypothèse.</p></div>
        {launchCase && <button onClick={() => onOpenCase(launchCase.id)} className="executive-button executive-primary shrink-0 px-5 py-3">Ouvrir le scénario principal →</button>}
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">{cards.map(([label, value, detail]) => <div key={label} className="rounded-[20px] border border-[#dedad1] bg-white/70 p-4"><strong className="block text-2xl tracking-[-.04em] text-[#1d1d1f]">{value}</strong><span className="mt-2 block text-xs font-semibold text-[#3a3a3c]">{label}</span><span className="mt-1 block text-[10px] leading-4 text-[#86868b]">{detail}</span></div>)}</div>
      <p className="mt-4 text-[10px] leading-4 text-[#86868b]">Les volumes et taux ci-dessus sont recalculés depuis le dataset affiché. Le temps économisé est une estimation modélisée, pas une performance client observée.</p>
    </article>

    <article className="executive-card p-5 md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#0071e3]">Parcours guidé · 5 minutes</div><h2 className="mt-2 text-xl font-semibold">{INVESTOR_DEMO_STEPS[step].label}</h2><p className="mt-1 text-sm text-[#667085]">{INVESTOR_DEMO_STEPS[step].detail}</p></div><div className="flex gap-2"><button disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="executive-button executive-ghost px-4 py-2 disabled:opacity-40">Précédent</button><button onClick={() => step === INVESTOR_DEMO_STEPS.length - 1 && launchCase ? onOpenCase(launchCase.id) : setStep((current) => Math.min(INVESTOR_DEMO_STEPS.length - 1, current + 1))} className="executive-button executive-primary px-4 py-2">{step === INVESTOR_DEMO_STEPS.length - 1 ? "Voir la décision" : "Suivant"}</button></div></div>
      <div className="mt-5 grid gap-2 md:grid-cols-5">{INVESTOR_DEMO_STEPS.map((item, index) => <button key={item.id} onClick={() => setStep(index)} aria-current={step === index ? "step" : undefined} className={`h-1.5 rounded-full transition ${index <= step ? "bg-[#0071e3]" : "bg-[#d8d3c9]"}`}><span className="sr-only">{item.label}</span></button>)}</div>
    </article>
  </section>;
}
