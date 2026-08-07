"use client";

import { useMemo, useState } from "react";
import type { DecisionFrame } from "@/lib/decision-runtime";
import type { ActionRecord, CognitiveCase, DecisionRecord } from "@/domain/canonical";

type ImpactAnalysisProps = {
  cognitiveCase: CognitiveCase;
  frame: DecisionFrame;
  decisions: DecisionRecord[];
  actions: ActionRecord[];
};

type ImpactDimension = {
  id: string;
  label: string;
  score: number;
  direction: "positive" | "negative" | "mixed";
  explanation: string;
};

export function ImpactAnalysisV3({ cognitiveCase, frame, decisions, actions }: ImpactAnalysisProps) {
  const optionScores = useMemo(() => frame.options.map((option, index) => {
    const base = option.score ?? Math.max(45, 72 - index * 7);
    const riskPenalty = Math.round(cognitiveCase.signals.risk * (index === 0 ? 2.6 : index === 1 ? 1.4 : .8));
    const confidenceBonus = Math.round((frame.confidence ?? cognitiveCase.signals.confidence) * (index === 1 ? .16 : .09));
    const reversibilityBonus = index === 1 ? 12 : index === 2 ? 7 : 2;
    const impactBonus = Math.round(cognitiveCase.signals.impact * (index === 0 ? 1.2 : index === 1 ? 1 : .5));
    const adjusted = Math.max(0, Math.min(100, base - riskPenalty + confidenceBonus + reversibilityBonus + impactBonus));
    return { ...option, adjusted, index };
  }), [cognitiveCase, frame]);

  const recommendedIndex = optionScores.reduce((best, item, index, all) => item.adjusted > all[best].adjusted ? index : best, 0);
  const [selectedIndex, setSelectedIndex] = useState(recommendedIndex);
  const selected = optionScores[selectedIndex] ?? optionScores[0];

  const dimensions = useMemo<ImpactDimension[]>(() => {
    const selectedRisk = Math.max(1, Math.min(10, cognitiveCase.signals.risk + (selectedIndex === 0 ? 1 : selectedIndex === 1 ? -1 : -2)));
    const executionLoad = Math.max(1, Math.min(10, cognitiveCase.signals.urgency + (selectedIndex === 0 ? 1 : selectedIndex === 1 ? 0 : -2)));
    const reversibility = selectedIndex === 1 ? 9 : selectedIndex === 2 ? 7 : 4;
    const goalAlignment = Math.max(1, Math.min(10, Math.round(cognitiveCase.signals.impact * (selectedIndex === 2 ? .65 : selectedIndex === 1 ? .95 : 1))));
    return [
      { id: "goal", label: "Objectif", score: goalAlignment, direction: goalAlignment >= 8 ? "positive" : "mixed", explanation: selectedIndex === 2 ? "Protège les ressources mais ralentit l’objectif principal." : "Contribue directement à l’objectif du dossier." },
      { id: "risk", label: "Risque", score: selectedRisk, direction: selectedRisk >= 7 ? "negative" : selectedRisk <= 4 ? "positive" : "mixed", explanation: selectedRisk >= 7 ? "Expose fortement le système si l’hypothèse est fausse." : "Le niveau de risque reste contrôlable avec des jalons de revue." },
      { id: "execution", label: "Exécution", score: executionLoad, direction: executionLoad >= 8 ? "negative" : "mixed", explanation: executionLoad >= 8 ? "Charge d’exécution élevée et dépendances nombreuses." : "Charge compatible avec une exécution progressive." },
      { id: "reversibility", label: "Réversibilité", score: reversibility, direction: reversibility >= 8 ? "positive" : reversibility <= 4 ? "negative" : "mixed", explanation: reversibility >= 8 ? "Permet d’apprendre avant un engagement difficile à inverser." : "Crée rapidement des coûts de sortie ou de retour arrière." }
    ];
  }, [cognitiveCase, selectedIndex]);

  const overall = Math.round((selected.adjusted + dimensions[0].score * 10 + (10 - dimensions[1].score) * 10 + dimensions[3].score * 10) / 4);
  const dependencies = [
    `${frame.criteria.length} critères d’arbitrage à préserver`,
    `${frame.missingInformation.length} informations encore manquantes`,
    `${actions.filter((action) => action.status !== "done").length} actions ouvertes liées au contexte`,
    `${decisions.length} décision${decisions.length > 1 ? "s" : ""} déjà enregistrée${decisions.length > 1 ? "s" : ""}`
  ];

  const orion = selectedIndex === recommendedIndex
    ? `ORION privilégie « ${selected.title} » : c’est actuellement le meilleur compromis entre impact, risque et réversibilité.`
    : `Ce scénario est viable, mais ORION estime que « ${optionScores[recommendedIndex]?.title} » conserve un meilleur profil risque / apprentissage.`;

  return (
    <section className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/82 p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#42d59d]">Impact Analysis · UX3.4</div>
          <h2 className="mt-2 text-2xl font-semibold">Mesurer les conséquences avant de décider</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8192ab]">Compare les scénarios sur leur impact, leur risque, leur charge d’exécution et leur réversibilité avant l’arbitrage final.</p>
        </div>
        <div className="rounded-2xl border border-[#42d59d]/15 bg-[#42d59d]/[.04] px-4 py-3 text-right"><div className="text-[10px] uppercase tracking-[.12em] text-[#7aa897]">Impact score</div><strong className="text-2xl text-[#8aebc5]">{overall}</strong><span className="text-xs text-[#69847a]"> / 100</span></div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        {optionScores.map((option, index) => (
          <button key={option.title} onClick={() => setSelectedIndex(index)} className={`rounded-2xl border p-4 text-left transition ${index === selectedIndex ? "border-[#7c5cff]/45 bg-[#7c5cff]/[.08] ring-2 ring-[#7c5cff]/15" : "border-white/[.07] bg-white/[.02] hover:bg-white/[.04]"}`}>
            <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[.12em] text-[#778aa5]">Scénario {index + 1}</span><span className="font-mono text-sm text-[#d5ddea]">{option.adjusted}</span></div>
            <h3 className="mt-3 font-semibold text-[#edf2f9]">{option.title}</h3>
            <p className="mt-2 text-xs leading-5 text-[#8192ab]">{option.description}</p>
            {index === recommendedIndex && <span className="mt-3 inline-flex rounded-full bg-[#42d59d]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#7de5bd]">Meilleur profil</span>}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-2xl border border-white/[.07] bg-[#091422] p-5">
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#8fb7ff]">Carte d’impact · {selected.title}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {dimensions.map((dimension) => <ImpactCard key={dimension.id} {...dimension} />)}
          </div>
        </article>

        <article className="rounded-2xl border border-white/[.07] bg-[#091422] p-5">
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#9d83ff]">ORION · Analyse des dépendances</div>
          <p className="mt-3 text-sm leading-7 text-[#d3dcea]">{orion}</p>
          <div className="mt-5 space-y-2">{dependencies.map((dependency) => <div key={dependency} className="flex items-start gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7c5cff]"/><span className="text-xs leading-5 text-[#9eacbf]">{dependency}</span></div>)}</div>
          <div className="mt-5 rounded-xl border border-[#ffbc57]/12 bg-[#ffbc57]/[.035] p-4"><div className="text-[10px] font-black uppercase tracking-[.12em] text-[#ffcb77]">Point de vigilance</div><p className="mt-2 text-xs leading-5 text-[#c9bda9]">{frame.missingInformation.length ? `Ne pas considérer l’analyse comme définitive avant de compléter : ${frame.missingInformation.slice(0, 2).join(" · ")}.` : "Aucune information critique manquante détectée dans le cadre actuel."}</p></div>
        </article>
      </div>
    </section>
  );
}

function ImpactCard({ label, score, direction, explanation }: ImpactDimension) {
  const tone = direction === "positive" ? "text-[#7de5bd] bg-[#42d59d]/8" : direction === "negative" ? "text-[#ff9e9e] bg-[#ff6b6b]/8" : "text-[#ffd895] bg-[#ffbc57]/8";
  return <div className="rounded-2xl border border-white/[.06] bg-white/[.02] p-4"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-[#cbd5e2]">{label}</span><span className={`rounded-lg px-2 py-1 font-mono text-xs ${tone}`}>{score}/10</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full bg-current opacity-60" style={{ width: `${score * 10}%` }} /></div><p className="mt-3 text-xs leading-5 text-[#7f91aa]">{explanation}</p></div>;
}
