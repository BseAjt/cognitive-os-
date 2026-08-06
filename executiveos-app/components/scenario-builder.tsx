"use client";

import { useMemo, useState } from "react";
import type { DecisionFrame } from "@/lib/decision-room";
import type { ContextItem, ContextReadiness } from "@/lib/context-engine";
import { buildScenarioPortfolio, type ScenarioCriterion } from "@/lib/scenario-builder";

interface ScenarioBuilderProps {
  frame: DecisionFrame;
  contextItems: ContextItem[];
  readiness: ContextReadiness;
  onCreateAction: (title: string) => void;
}

export function ScenarioBuilder({ frame, contextItems, readiness, onCreateAction }: ScenarioBuilderProps) {
  const [criteria, setCriteria] = useState<ScenarioCriterion[]>([
    { id: "financial", label: "Impact financier", weight: 25 },
    { id: "people", label: "Impact humain", weight: 20 },
    { id: "operations", label: "Continuité opérationnelle", weight: 20 },
    { id: "legal", label: "Risque juridique", weight: 15 },
    { id: "strategy", label: "Cohérence stratégique", weight: 15 },
    { id: "time", label: "Vitesse d'effet", weight: 5 }
  ]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const portfolio = useMemo(() => buildScenarioPortfolio(frame, contextItems, readiness, criteria), [frame, contextItems, readiness, criteria]);
  const selected = portfolio.scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? portfolio.scenarios[0];

  function updateWeight(id: ScenarioCriterion["id"], value: number) {
    setCriteria((current) => current.map((criterion) => criterion.id === id ? { ...criterion, weight: value } : criterion));
  }

  return (
    <article className="executive-card mt-5 overflow-hidden">
      <div className="border-b border-white/10 bg-[#0d192b] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black tracking-[.14em] text-[#42d59d]">SCENARIO BUILDER</div>
            <h3 className="mt-2 text-2xl font-semibold">Comparer les options dans leur contexte</h3>
            <p className="mt-2 max-w-3xl text-sm text-[#91a2bd]">Les scores restent bloqués tant que les données critiques sont manquantes. Les impacts, hypothèses, risques et conditions de sortie restent néanmoins visibles et modifiables.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs ${portfolio.recommendationAllowed ? "bg-[#42d59d]/15 text-[#7aefc2]" : "bg-[#ff7185]/15 text-[#ff9dab]"}`}>{portfolio.recommendationAllowed ? "Recommandation autorisée" : "Comparaison provisoire"}</span>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[.75fr_1.25fr]">
        <section className="grid content-start gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
            <div className="mb-3 flex items-center justify-between"><strong>Pondération des critères</strong><span className="text-xs text-[#91a2bd]">Total {criteria.reduce((sum, item) => sum + item.weight, 0)}</span></div>
            <div className="grid gap-3">{criteria.map((criterion) => <label key={criterion.id} className="grid gap-1"><div className="flex justify-between text-xs"><span>{criterion.label}</span><span>{criterion.weight}</span></div><input type="range" min="0" max="40" value={criterion.weight} onChange={(event) => updateWeight(criterion.id, Number(event.target.value))} /></label>)}</div>
          </div>

          <div className="grid gap-3">{portfolio.scenarios.map((scenario) => <button key={scenario.id} onClick={() => setSelectedScenarioId(scenario.id)} className={`rounded-2xl border p-4 text-left ${selected?.id === scenario.id ? "border-[#42d59d]/55 bg-[#42d59d]/8" : "border-white/10 bg-white/[.02]"}`}><div className="flex items-center justify-between gap-3"><strong>{scenario.title}</strong><span className="rounded-full bg-white/5 px-2 py-1 text-xs">{scenario.score === null ? "Non scoré" : `${scenario.score}/100`}</span></div><p className="mt-2 text-sm leading-6 text-[#aebbd0]">{scenario.description}</p><div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#91a2bd]"><span>{scenario.horizonMonths} mois</span><span>Réversibilité {scenario.reversibility}</span><span>Risque légal {scenario.legalRisk}</span><span>Impact humain {scenario.peopleImpact}</span></div>{scenario.blockedReasons.length > 0 && <p className="mt-3 text-xs text-[#ff9dab]">Bloqué : {scenario.blockedReasons.join(" · ")}</p>}</button>)}</div>
        </section>

        {selected && <section className="grid content-start gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-black tracking-[.12em] text-[#8d7ce4]">SCÉNARIO SÉLECTIONNÉ</div><h4 className="mt-2 text-xl font-semibold">{selected.title}</h4></div><span className="rounded-full bg-white/5 px-3 py-1 text-xs">Confiance {selected.scoreConfidence}%</span></div><p className="mt-3 text-sm leading-6 text-[#aebbd0]">{selected.description}</p></div>

          <div className="grid gap-3 md:grid-cols-2">{selected.impacts.map((impact) => <div key={`${impact.domain}-${impact.label}`} className="rounded-xl border border-white/10 bg-white/[.02] p-3"><div className="text-xs uppercase tracking-wide text-[#91a2bd]">{impact.domain}</div><strong className="mt-1 block">{impact.label}</strong><div className="mt-2 text-2xl">{impact.value} <span className="text-sm text-[#91a2bd]">{impact.unit}</span></div><p className="mt-2 text-[11px] text-[#91a2bd]">{impact.source} · confiance {impact.confidence}%</p></div>)}</div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><strong>Hypothèses</strong><div className="mt-3 grid gap-2">{selected.assumptions.map((item) => <div key={item.id} className="rounded-lg bg-white/[.03] p-2 text-sm"><span className="block text-[#d6dfed]">{item.label}</span><span className={`text-xs ${item.status === "verified" ? "text-[#7aefc2]" : item.status === "missing" ? "text-[#ff9dab]" : "text-[#ffda91]"}`}>{item.value} · {item.status}</span></div>)}</div></div>
            <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><strong>Conditions de sortie</strong><div className="mt-3 grid gap-2 text-sm text-[#aebbd0]">{selected.exitConditions.map((item) => <span key={item}>• {item}</span>)}</div></div>
            <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><strong>Dépendances</strong><div className="mt-3 grid gap-2 text-sm text-[#aebbd0]">{selected.dependencies.map((item) => <span key={item}>• {item}</span>)}</div></div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101b2f] p-4"><strong>Position du moteur</strong><p className="mt-2 text-sm leading-6 text-[#aebbd0]">{portfolio.rationale}</p><button onClick={() => onCreateAction(`Instruire le scénario : ${selected.title}`)} className="executive-button executive-primary mt-4">Créer le plan d'instruction</button></div>
        </section>}
      </div>
    </article>
  );
}
