import type { ContextRecord } from "../domain/canonical.ts";
import type { ContextAssessment } from "./context-engine";
import type { DecisionFrame } from "./decision-runtime";

export type ScenarioImpactDomain = "financial" | "people" | "operations" | "legal" | "strategy" | "time";

export interface ScenarioImpact {
  domain: ScenarioImpactDomain;
  label: string;
  value: number;
  unit: string;
  direction: "positive" | "negative" | "neutral";
  confidence: number;
  source: string;
}

export interface ScenarioAssumption {
  id: string;
  label: string;
  value: string;
  status: "verified" | "estimated" | "missing";
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  horizonMonths: number;
  reversibility: "high" | "medium" | "low";
  legalRisk: "low" | "medium" | "high";
  peopleImpact: "low" | "medium" | "high";
  assumptions: ScenarioAssumption[];
  impacts: ScenarioImpact[];
  exitConditions: string[];
  dependencies: string[];
  score: number | null;
  scoreConfidence: number;
  blockedReasons: string[];
}

export interface ScenarioCriterion {
  id: ScenarioImpactDomain;
  label: string;
  weight: number;
}

export interface ScenarioPortfolio {
  scenarios: Scenario[];
  criteria: ScenarioCriterion[];
  recommendationAllowed: boolean;
  recommendedScenarioId: string | null;
  rationale: string;
}

const DEFAULT_CRITERIA: ScenarioCriterion[] = [
  { id: "financial", label: "Impact financier", weight: 25 },
  { id: "people", label: "Impact humain", weight: 20 },
  { id: "operations", label: "Continuité opérationnelle", weight: 20 },
  { id: "legal", label: "Risque juridique", weight: 15 },
  { id: "strategy", label: "Cohérence stratégique", weight: 15 },
  { id: "time", label: "Vitesse d'effet", weight: 5 }
];

function itemValue(items: ContextRecord[], key: string): string | undefined {
  return items.find((item) => item.key === key)?.value;
}

function numeric(items: ContextRecord[], key: string): number | null {
  const raw = itemValue(items, key);
  if (!raw) return null;
  const parsed = Number(String(raw).replace(",", ".").match(/-?\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildScenarioPortfolio(
  frame: DecisionFrame,
  contextItems: ContextRecord[],
  readiness: ContextAssessment,
  criteria: ScenarioCriterion[] = DEFAULT_CRITERIA
): ScenarioPortfolio {
  if (frame.category !== "workforce_restructuring") {
    return {
      scenarios: frame.options.map((option, index) => ({
        id: `scenario-${index + 1}`,
        title: option.title,
        description: option.description,
        horizonMonths: index + 1,
        reversibility: index === 0 ? "medium" : index === 1 ? "high" : "low",
        legalRisk: "low",
        peopleImpact: "medium",
        assumptions: [],
        impacts: [],
        exitConditions: [],
        dependencies: [],
        score: option.score,
        scoreConfidence: option.score === null ? 0 : 65,
        blockedReasons: []
      })),
      criteria,
      recommendationAllowed: !frame.requiresContext,
      recommendedScenarioId: frame.recommendation ? "scenario-2" : null,
      rationale: frame.recommendation ?? "Le contexte doit être complété avant toute recommandation."
    };
  }

  const runway = numeric(contextItems, "cash_runway_months");
  const revenueDecline = numeric(contextItems, "revenue_change_percent");
  const savingsTarget = numeric(contextItems, "target_savings_million");
  const affectedRoles = numeric(contextItems, "affected_roles_count");
  const contextBlocked = readiness.blockingItems.length > 0;

  const scenarios: Scenario[] = [
    {
      id: "cost-containment",
      title: "Réduction des coûts sans départs contraints",
      description: "Geler les recrutements, réduire les dépenses discrétionnaires, différer les investissements et accélérer les gains de productivité.",
      horizonMonths: 3,
      reversibility: "high",
      legalRisk: "low",
      peopleImpact: "low",
      assumptions: [
        assumption("savings", "Objectif d'économies", savingsTarget ? `${savingsTarget} M€` : "À définir", savingsTarget ? "estimated" : "missing"),
        assumption("runway", "Horizon de trésorerie", runway ? `${runway} mois` : "À confirmer", runway ? "verified" : "missing"),
        assumption("productivity", "Gains de productivité réalisables", "8 à 12 %", "estimated")
      ],
      impacts: [
        impact("financial", "Économies annuelles", savingsTarget ? Math.min(savingsTarget * 0.55, 3) : 1.8, "M€", "positive", savingsTarget ? 62 : 38, "Hypothèse CFO"),
        impact("people", "Postes supprimés", 0, "poste", "positive", 95, "Scénario"),
        impact("operations", "Risque de tension capacité", 35, "%", "negative", 55, "Operations"),
        impact("time", "Délai d'effet", 3, "mois", "neutral", 70, "Plan d'exécution")
      ],
      exitConditions: ["Économies inférieures à 70 % de la cible après 90 jours", "Trésorerie sous 5 mois", "Dégradation client critique"],
      dependencies: ["Validation CFO", "Plan de productivité", "Pilotage mensuel des économies"],
      score: null,
      scoreConfidence: 0,
      blockedReasons: savingsTarget ? [] : ["Objectif d'économies manquant"]
    },
    {
      id: "voluntary-mobility",
      title: "Départs volontaires et mobilité interne",
      description: "Combiner mobilité, non-remplacement, reclassement et départs volontaires avec accompagnement renforcé.",
      horizonMonths: 6,
      reversibility: "medium",
      legalRisk: "medium",
      peopleImpact: "medium",
      assumptions: [
        assumption("scope", "Périmètre de postes", affectedRoles ? `${affectedRoles} postes` : "À définir", affectedRoles ? "estimated" : "missing"),
        assumption("voluntary-rate", "Taux de volontariat", "45 %", "estimated"),
        assumption("critical-skills", "Compétences critiques protégées", "Liste partielle", "estimated")
      ],
      impacts: [
        impact("financial", "Économies annuelles", savingsTarget ? savingsTarget * 0.75 : 2.5, "M€", "positive", savingsTarget ? 58 : 35, "Modèle RH/CFO"),
        impact("people", "Départs estimés", affectedRoles ? affectedRoles * 0.45 : 45, "personnes", "negative", affectedRoles ? 60 : 32, "Hypothèse DRH"),
        impact("legal", "Risque contentieux", 35, "%", "negative", 52, "Legal"),
        impact("time", "Délai d'effet", 6, "mois", "neutral", 65, "DRH")
      ],
      exitConditions: ["Taux de volontariat inférieur à 30 %", "Perte de compétences critiques", "Coût d'accompagnement supérieur au budget"],
      dependencies: ["Cartographie des compétences", "Validation juridique", "Budget d'accompagnement"],
      score: null,
      scoreConfidence: 0,
      blockedReasons: affectedRoles ? [] : ["Périmètre des postes non documenté"]
    },
    {
      id: "targeted-restructuring",
      title: "Restructuration ciblée avec suppressions de postes",
      description: "Supprimer uniquement les postes durablement non alignés avec le modèle cible, après épuisement des alternatives.",
      horizonMonths: 9,
      reversibility: "low",
      legalRisk: "high",
      peopleImpact: "high",
      assumptions: [
        assumption("scope", "Périmètre de postes", affectedRoles ? `${affectedRoles} postes` : "À définir", affectedRoles ? "estimated" : "missing"),
        assumption("decline", "Baisse du chiffre d'affaires", revenueDecline ? `${revenueDecline} %` : "À confirmer", revenueDecline ? "verified" : "missing"),
        assumption("alternatives", "Alternatives épuisées", "Non démontré", "missing")
      ],
      impacts: [
        impact("financial", "Économies annuelles", savingsTarget ?? 4, "M€", "positive", savingsTarget ? 65 : 30, "Modèle CFO"),
        impact("people", "Postes supprimés", affectedRoles ?? 80, "postes", "negative", affectedRoles ? 70 : 25, "Périmètre DRH"),
        impact("operations", "Risque de rupture", 60, "%", "negative", 45, "Impact contesté"),
        impact("legal", "Risque juridique", 75, "%", "negative", 70, "Cadre français"),
        impact("time", "Délai d'effet", 9, "mois", "neutral", 65, "Calendrier social")
      ],
      exitConditions: ["Nécessité économique non démontrée", "Alternatives crédibles identifiées", "Risque opérationnel critique", "Avis juridique défavorable"],
      dependencies: ["Diagnostic économique", "Dialogue social", "Plan de continuité", "Validation du board"],
      score: null,
      scoreConfidence: 0,
      blockedReasons: [
        ...(affectedRoles ? [] : ["Périmètre des postes non documenté"]),
        ...(!savingsTarget ? ["Objectif d'économies manquant"] : []),
        "Alternatives non démontrées",
        ...readiness.blockingItems.map((item) => item.label)
      ]
    }
  ];

  const scored = scenarios.map((scenario) => scoreScenario(scenario, criteria, contextBlocked));
  const eligible = scored.filter((scenario) => scenario.score !== null);
  const best = eligible.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

  return {
    scenarios: scored,
    criteria,
    recommendationAllowed: !contextBlocked && eligible.length === scenarios.length,
    recommendedScenarioId: !contextBlocked && best ? best.id : null,
    rationale: contextBlocked
      ? `Recommandation bloquée : ${readiness.blockingItems.length} élément(s) contextuel(s) critique(s) restent à valider.`
      : best
        ? `${best.title} obtient le meilleur équilibre selon les critères pondérés et les données disponibles.`
        : "Les scénarios doivent être documentés avant comparaison."
  };
}

export function scoreScenario(scenario: Scenario, criteria: ScenarioCriterion[], forceBlocked = false): Scenario {
  const blockedReasons = [...scenario.blockedReasons];
  if (forceBlocked && !blockedReasons.includes("Contexte critique incomplet")) blockedReasons.push("Contexte critique incomplet");
  if (blockedReasons.length) return { ...scenario, score: null, scoreConfidence: Math.min(45, averageConfidence(scenario.impacts)), blockedReasons };

  const byDomain = new Map(scenario.impacts.map((item) => [item.domain, normalizeImpact(item)]));
  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  const weighted = criteria.reduce((sum, criterion) => sum + (byDomain.get(criterion.id) ?? 50) * criterion.weight, 0) / totalWeight;
  return { ...scenario, score: Math.round(weighted), scoreConfidence: averageConfidence(scenario.impacts), blockedReasons };
}

function normalizeImpact(item: ScenarioImpact): number {
  const base = item.direction === "positive" ? 75 : item.direction === "negative" ? 30 : 55;
  const confidenceAdjustment = (item.confidence - 50) * 0.15;
  return Math.max(0, Math.min(100, base + confidenceAdjustment));
}

function averageConfidence(impacts: ScenarioImpact[]): number {
  if (!impacts.length) return 0;
  return Math.round(impacts.reduce((sum, item) => sum + item.confidence, 0) / impacts.length);
}

function assumption(id: string, label: string, value: string, status: ScenarioAssumption["status"]): ScenarioAssumption {
  return { id, label, value, status };
}

function impact(domain: ScenarioImpactDomain, label: string, value: number, unit: string, direction: ScenarioImpact["direction"], confidence: number, source: string): ScenarioImpact {
  return { domain, label, value, unit, direction, confidence, source };
}
