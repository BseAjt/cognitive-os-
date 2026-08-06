import type { ContextReadiness } from "./context-engine";
import type { ExecutiveCouncilResult } from "./executive-council";
import type { ScenarioPortfolio } from "./scenario-builder";

export type DecisionStatus = "draft" | "blocked" | "ready" | "decided" | "under_review";

export interface DecisionGate {
  id: string;
  label: string;
  status: "passed" | "blocked" | "warning";
  detail: string;
}

export interface DecisionTrigger {
  id: string;
  label: string;
  metric: string;
  operator: "below" | "above" | "equals" | "changes";
  threshold: string;
  owner: string;
}

export interface DecisionCockpitState {
  status: DecisionStatus;
  decisionAllowed: boolean;
  readiness: number;
  consensus: number;
  selectedScenarioId: string | null;
  recommendedScenarioId: string | null;
  gates: DecisionGate[];
  conditions: string[];
  dissentingViews: string[];
  reviewTriggers: DecisionTrigger[];
  outcomeMetrics: Array<{ label: string; target: string; owner: string }>;
  rationale: string;
}

export function buildDecisionCockpit(
  readiness: ContextReadiness,
  portfolio: ScenarioPortfolio,
  council: ExecutiveCouncilResult,
  selectedScenarioId?: string | null
): DecisionCockpitState {
  const selected = selectedScenarioId ?? portfolio.recommendedScenarioId ?? null;
  const selectedScenario = portfolio.scenarios.find((scenario) => scenario.id === selected);
  const gates: DecisionGate[] = [
    {
      id: "context",
      label: "Contexte critique vérifié",
      status: readiness.recommendationAllowed ? "passed" : "blocked",
      detail: readiness.recommendationAllowed
        ? "Les informations obligatoires sont disponibles et vérifiées."
        : `${readiness.blockingItems.length} élément(s) critique(s) restent manquants, contestés ou obsolètes.`
    },
    {
      id: "scenarios",
      label: "Scénarios comparables",
      status: portfolio.recommendationAllowed ? "passed" : "blocked",
      detail: portfolio.recommendationAllowed
        ? "Tous les scénarios disposent d'un score exploitable."
        : `${portfolio.scenarios.filter((scenario) => scenario.score === null).length} scénario(s) restent non scorés.`
    },
    {
      id: "council",
      label: "Conseil exécutable",
      status: council.recommendationAllowed ? "passed" : council.consensusLevel >= 60 ? "warning" : "blocked",
      detail: council.recommendationAllowed
        ? "Le Conseil ne présente plus de divergence bloquante."
        : `Consensus ${council.consensusLevel}% et ${council.divergences.length} divergence(s) à arbitrer.`
    },
    {
      id: "selection",
      label: "Scénario explicitement sélectionné",
      status: selectedScenario ? "passed" : "blocked",
      detail: selectedScenario ? selectedScenario.title : "Aucun scénario n'a été retenu par le dirigeant."
    }
  ];

  const decisionAllowed = gates.every((gate) => gate.status === "passed");
  const status: DecisionStatus = decisionAllowed ? "ready" : "blocked";
  const conditions = unique([
    ...(selectedScenario?.dependencies ?? []),
    ...council.assessments.flatMap((assessment) => assessment.conditions),
    ...readiness.blockingItems.map((item) => `Vérifier : ${item.label}`)
  ]).slice(0, 10);
  const dissentingViews = council.assessments
    .filter((assessment) => assessment.position === "oppose" || assessment.position === "insufficient_context")
    .map((assessment) => `${assessment.agent} — ${assessment.findings[0]?.text ?? assessment.position}`);

  return {
    status,
    decisionAllowed,
    readiness: readiness.readiness,
    consensus: council.consensusLevel,
    selectedScenarioId: selected,
    recommendedScenarioId: portfolio.recommendedScenarioId,
    gates,
    conditions,
    dissentingViews,
    reviewTriggers: seededReviewTriggers(),
    outcomeMetrics: [
      { label: "Économies nettes réalisées", target: "À définir par le CFO", owner: "CFO" },
      { label: "Compétences critiques préservées", target: "100 % des rôles critiques", owner: "DRH" },
      { label: "Continuité des engagements clients", target: "Aucune rupture critique", owner: "Operations" },
      { label: "Conformité du processus", target: "Aucune non-conformité majeure", owner: "Legal" }
    ],
    rationale: decisionAllowed
      ? `Le dossier est prêt pour arbitrage. ${selectedScenario?.title ?? "Le scénario sélectionné"} peut être soumis à décision avec les conditions listées.`
      : `La décision reste suspendue. ${gates.filter((gate) => gate.status !== "passed").map((gate) => gate.label).join(" ; ")}.`
  };
}

export function serializeDecisionRecord(
  question: string,
  cockpit: DecisionCockpitState,
  scenarioTitle: string,
  rationale: string,
  owner: string,
  deadline: string
): string {
  return [
    `Dossier de décision : ${question}`,
    `Statut : ${cockpit.decisionAllowed ? "prêt à décider" : "brouillon bloqué"}`,
    `Scénario retenu : ${scenarioTitle}`,
    `Décideur : ${owner || "à préciser"}`,
    `Échéance : ${deadline || "à préciser"}`,
    `Rationale dirigeant : ${rationale || "non renseignée"}`,
    `Préparation contextuelle : ${cockpit.readiness}%`,
    `Consensus du Conseil : ${cockpit.consensus}%`,
    `Conditions : ${cockpit.conditions.join(" | ")}`,
    `Dissensions conservées : ${cockpit.dissentingViews.join(" | ") || "aucune"}`,
    `Déclencheurs de révision : ${cockpit.reviewTriggers.map((trigger) => `${trigger.metric} ${trigger.operator} ${trigger.threshold}`).join(" | ")}`
  ].join("\n");
}

function seededReviewTriggers(): DecisionTrigger[] {
  return [
    { id: "runway", label: "Tension de trésorerie", metric: "Horizon de trésorerie", operator: "below", threshold: "5 mois", owner: "CFO" },
    { id: "revenue", label: "Dégradation commerciale", metric: "Chiffre d'affaires", operator: "below", threshold: "-25 % vs N-1", owner: "CFO" },
    { id: "skills", label: "Perte de capacité critique", metric: "Couverture des compétences critiques", operator: "below", threshold: "90 %", owner: "DRH" },
    { id: "service", label: "Rupture opérationnelle", metric: "SLA clients critiques", operator: "below", threshold: "98 %", owner: "Operations" },
    { id: "legal", label: "Évolution du risque juridique", metric: "Avis juridique", operator: "changes", threshold: "défavorable", owner: "Legal" }
  ];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
