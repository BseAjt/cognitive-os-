"use client";

import { useMemo, useState } from "react";
import type { DecisionFrame } from "@/lib/decision-runtime";
import { useExecutiveStore } from "@/store/executive-store";
import type { ActionRecord, CognitiveCase, DecisionRecord } from "@/domain/canonical";

type CopilotMode = "missing" | "risks" | "changes" | "next";

type Props = {
  cognitiveCase: CognitiveCase;
  frame: DecisionFrame;
  decisions: DecisionRecord[];
  actions: ActionRecord[];
  onCreateAction: (title: string) => void;
};

const MODES: { id: CopilotMode; label: string }[] = [
  { id: "missing", label: "Que manque-t-il ?" },
  { id: "risks", label: "Quels risques ?" },
  { id: "changes", label: "Qu’est-ce qui a changé ?" },
  { id: "next", label: "Que faire maintenant ?" }
];

export function OrionDecisionCopilotV3({ cognitiveCase, frame, decisions, actions, onCreateAction }: Props) {
  const [mode, setMode] = useState<CopilotMode>("next");
  const revisions = useExecutiveStore((state) => state.reasoningRevisions).filter((item) => item.caseId === cognitiveCase.id);
  const latestDecision = decisions[0];

  const analysis = useMemo(() => {
    const openActions = actions.filter((action) => action.status !== "done");
    const missing = frame.missingInformation;
    const riskSignals = [
      cognitiveCase.signals.risk >= 7 ? `Risque global élevé (${cognitiveCase.signals.risk}/10).` : null,
      frame.requiresContext ? "Le contexte reste incomplet pour une décision irréversible." : null,
      frame.confidence !== null && frame.confidence < 70 ? `Confiance limitée (${frame.confidence}%).` : null,
      openActions.length > 3 ? `${openActions.length} actions ouvertes augmentent la charge d’exécution.` : null,
      latestDecision && frame.recommendation && !latestDecision.outcome.toLowerCase().includes(frame.recommendation.toLowerCase().slice(0, 18)) ? "La décision enregistrée et la recommandation actuelle semblent avoir divergé." : null
    ].filter(Boolean) as string[];

    const changedSteps = Array.from(new Set(revisions.map((revision) => revision.stepId)));
    const latestRevision = [...revisions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const nextAction = missing[0]
      ? `Obtenir : ${missing[0]}`
      : riskSignals[0]
        ? `Réduire le principal risque : ${riskSignals[0]}`
        : frame.recommendation
          ? `Transformer la recommandation en action : ${frame.recommendation}`
          : `Clarifier la décision : ${frame.question}`;

    return { missing, riskSignals, changedSteps, latestRevision, nextAction, openActions };
  }, [actions, cognitiveCase.signals.risk, frame, latestDecision, revisions]);

  const response = mode === "missing"
    ? buildMissingResponse(analysis.missing)
    : mode === "risks"
      ? buildRiskResponse(analysis.riskSignals)
      : mode === "changes"
        ? buildChangesResponse(analysis.changedSteps, analysis.latestRevision?.content)
        : buildNextResponse(analysis.nextAction, frame.recommendation);

  return (
    <section className="rounded-[26px] border border-[#7c5cff]/20 bg-[linear-gradient(145deg,rgba(25,20,55,.75),rgba(9,20,34,.96))] p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#b8a9ff]">ORION Decision Copilot · UX3.5</div>
          <h2 className="mt-2 text-2xl font-semibold">Interroger la décision, pas seulement les données.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8fa0b8]">ORION synthétise le Reasoning Flow, la Timeline, l’Impact Analysis et l’exécution pour t’aider à arbitrer.</p>
        </div>
        <div className="rounded-full border border-[#7c5cff]/20 bg-[#7c5cff]/10 px-3 py-1.5 text-xs text-[#c9c0ff]">Confiance {frame.confidence ?? cognitiveCase.signals.confidence}%</div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {MODES.map((item) => (
          <button key={item.id} onClick={() => setMode(item.id)} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${mode === item.id ? "border-[#9c8cff]/40 bg-[#7c5cff]/15 text-[#eeeaff]" : "border-white/[.07] bg-white/[.02] text-[#8192ab] hover:bg-white/[.04]"}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-2xl border border-white/[.08] bg-[#091422]/85 p-5">
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#9d83ff]">Réponse ORION</div>
          <h3 className="mt-2 text-xl font-semibold">{response.title}</h3>
          <p className="mt-3 text-sm leading-7 text-[#b6c1d1]">{response.summary}</p>
          <div className="mt-4 space-y-2">
            {response.items.map((item) => <div key={item} className="flex items-start gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#9d83ff]"/><span className="text-sm leading-5 text-[#c8d2df]">{item}</span></div>)}
          </div>
        </article>

        <article className="rounded-2xl border border-white/[.08] bg-[#091422]/85 p-5">
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#42d59d]">Prochaine meilleure action</div>
          <p className="mt-3 text-base leading-7 text-[#e2e8f1]">{analysis.nextAction}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniMetric label="Infos manquantes" value={String(analysis.missing.length)} />
            <MiniMetric label="Risques actifs" value={String(analysis.riskSignals.length)} />
            <MiniMetric label="Étapes révisées" value={String(analysis.changedSteps.length)} />
            <MiniMetric label="Actions ouvertes" value={String(analysis.openActions.length)} />
          </div>
          <button onClick={() => onCreateAction(analysis.nextAction)} className="mt-5 w-full rounded-xl bg-[#7c5cff] px-4 py-2.5 text-sm font-bold hover:bg-[#8b6dff]">Créer cette action</button>
        </article>
      </div>
    </section>
  );
}

function buildMissingResponse(missing: string[]) {
  return {
    title: missing.length ? `${missing.length} éléments empêchent encore une décision robuste` : "Le contexte est suffisamment complet",
    summary: missing.length ? "ORION recommande de réduire l’incertitude avant d’augmenter le niveau d’engagement." : "Aucune information critique n’est actuellement signalée comme manquante.",
    items: missing.length ? missing.slice(0, 5) : ["Les critères principaux sont renseignés.", "Le prochain enjeu est la qualité de l’arbitrage, pas la collecte d’information."]
  };
}

function buildRiskResponse(risks: string[]) {
  return {
    title: risks.length ? `${risks.length} signaux de risque à surveiller` : "Aucun signal de risque critique détecté",
    summary: risks.length ? "Ces points peuvent changer la recommandation ou rendre la décision plus coûteuse à exécuter." : "Le profil de risque actuel ne déclenche pas d’alerte majeure.",
    items: risks.length ? risks : ["Maintenir la surveillance des hypothèses clés.", "Réexaminer si le contexte ou la confiance évolue significativement."]
  };
}

function buildChangesResponse(steps: string[], latest?: string) {
  return {
    title: steps.length ? `${steps.length} zones du raisonnement ont évolué` : "Aucune révision enregistrée pour le moment",
    summary: latest ? `Dernier changement enregistré : ${latest}` : "La Decision Timeline reste sur son état initial.",
    items: steps.length ? steps.map((step) => `Étape révisée : ${step}`) : ["Ajoute une révision dans le Reasoning Flow pour construire l’historique décisionnel."]
  };
}

function buildNextResponse(nextAction: string, recommendation: string | null) {
  return {
    title: "ORION recommande une prochaine étape explicite",
    summary: recommendation ?? "La meilleure action consiste actuellement à réduire l’incertitude avant de verrouiller une décision.",
    items: [nextAction, "Rejouer la Decision Timeline après exécution.", "Réévaluer l’Impact Analysis si un signal important change."]
  };
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3"><span className="block text-[10px] uppercase tracking-[.1em] text-[#667995]">{label}</span><strong className="mt-1 block text-base text-[#eef2f8]">{value}</strong></div>;
}
