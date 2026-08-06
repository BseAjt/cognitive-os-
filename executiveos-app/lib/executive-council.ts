import type { ContextItem, ContextReadiness } from "./context-engine";
import type { ScenarioPortfolio, Scenario } from "./scenario-builder";

export type CouncilAgentId = "CFO" | "DRH" | "Legal" | "Operations" | "SENECA" | "ATHENA" | "ORION";
export type CouncilPosition = "support" | "oppose" | "conditional" | "insufficient_context";

export interface CouncilFinding {
  type: "fact" | "risk" | "opportunity" | "objection" | "question";
  text: string;
  severity: "low" | "medium" | "high" | "critical";
  evidenceKeys: string[];
}

export interface AgentAssessment {
  agent: CouncilAgentId;
  role: string;
  position: CouncilPosition;
  preferredScenarioId: string | null;
  confidence: number;
  findings: CouncilFinding[];
  requiredInputs: string[];
  conditions: string[];
}

export interface CouncilDivergence {
  topic: string;
  agents: CouncilAgentId[];
  description: string;
  resolutionNeeded: string;
}

export interface ExecutiveCouncilResult {
  assessments: AgentAssessment[];
  divergences: CouncilDivergence[];
  consensusLevel: number;
  recommendationAllowed: boolean;
  orionSynthesis: string;
  provisionalDirection: string | null;
  nextActions: string[];
}

const has = (items: ContextItem[], key: string) => items.find((item) => item.key === key);
const valid = (items: ContextItem[], key: string) => {
  const item = has(items, key);
  return Boolean(item && item.value.trim() && item.status === "verified");
};

export function conveneExecutiveCouncil(
  contextItems: ContextItem[],
  readiness: ContextReadiness,
  portfolio: ScenarioPortfolio
): ExecutiveCouncilResult {
  const scenarios = new Map(portfolio.scenarios.map((scenario) => [scenario.id, scenario]));
  const assessments: AgentAssessment[] = [
    assessCfo(contextItems, scenarios),
    assessDrh(contextItems, scenarios),
    assessLegal(contextItems, scenarios),
    assessOperations(contextItems, scenarios),
    assessSeneca(contextItems, scenarios),
    assessAthena(contextItems, scenarios)
  ];

  const divergences = detectDivergences(assessments);
  const actionable = assessments.filter((assessment) => assessment.position !== "insufficient_context");
  const preferred = actionable.map((assessment) => assessment.preferredScenarioId).filter(Boolean);
  const dominant = mode(preferred as string[]);
  const consensusLevel = actionable.length
    ? Math.round((preferred.filter((scenarioId) => scenarioId === dominant).length / actionable.length) * 100)
    : 0;
  const recommendationAllowed = readiness.recommendationAllowed && portfolio.recommendationAllowed && divergences.length === 0;
  const nextActions = unique([
    ...assessments.flatMap((assessment) => assessment.requiredInputs.map((input) => `Documenter : ${input}`)),
    ...divergences.map((divergence) => divergence.resolutionNeeded)
  ]).slice(0, 6);

  return {
    assessments,
    divergences,
    consensusLevel,
    recommendationAllowed,
    provisionalDirection: recommendationAllowed ? dominant : dominant ? `Direction provisoire : ${scenarios.get(dominant)?.title ?? dominant}` : null,
    orionSynthesis: buildOrionSynthesis(readiness, portfolio, assessments, divergences, dominant, recommendationAllowed),
    nextActions
  };
}

function assessCfo(items: ContextItem[], scenarios: Map<string, Scenario>): AgentAssessment {
  const missing = [!valid(items, "target_savings_million") && "objectif d'économies", !valid(items, "cash_runway_months") && "horizon de trésorerie"].filter(Boolean) as string[];
  const preferred = scenarios.has("cost-containment") ? "cost-containment" : null;
  return assessment("CFO", "Viabilité financière et coût total", missing.length ? "insufficient_context" : "conditional", preferred, missing.length ? 42 : 72,
    [finding("risk", "Le dossier ne chiffre pas encore complètement le besoin d'économies et le coût de chaque option.", missing.length ? "critical" : "medium", ["target_savings_million", "cash_runway_months"])],
    missing,
    ["Fixer une cible d'économies nette", "Comparer économies brutes et coûts de mise en œuvre"]);
}

function assessDrh(items: ContextItem[], scenarios: Map<string, Scenario>): AgentAssessment {
  const missing = [!valid(items, "affected_roles_count") && "périmètre des postes", !valid(items, "critical_skills") && "cartographie des compétences critiques", !valid(items, "alternatives_reviewed") && "alternatives RH étudiées"].filter(Boolean) as string[];
  return assessment("DRH", "Impact humain, compétences et alternatives", missing.length ? "insufficient_context" : "support", scenarios.has("voluntary-mobility") ? "voluntary-mobility" : null, missing.length ? 38 : 76,
    [finding("opportunity", "La mobilité interne et les départs volontaires peuvent réduire l'impact humain si les compétences critiques sont protégées.", "high", ["critical_skills", "alternatives_reviewed"])],
    missing,
    ["Protéger explicitement les compétences critiques", "Évaluer le volontariat avant toute mesure contrainte"]);
}

function assessLegal(items: ContextItem[], scenarios: Map<string, Scenario>): AgentAssessment {
  const missing = [!valid(items, "legal_jurisdiction") && "juridiction applicable", !valid(items, "social_dialogue_status") && "état du dialogue social"].filter(Boolean) as string[];
  return assessment("Legal", "Conformité, calendrier social et contentieux", missing.length ? "insufficient_context" : "conditional", scenarios.has("voluntary-mobility") ? "voluntary-mobility" : null, missing.length ? 35 : 68,
    [finding("risk", "Une restructuration contrainte reste juridiquement risquée sans diagnostic économique et dialogue social documentés.", "critical", ["legal_jurisdiction", "social_dialogue_status"])],
    missing,
    ["Valider le fondement économique", "Sécuriser le calendrier et les consultations"]);
}

function assessOperations(items: ContextItem[], scenarios: Map<string, Scenario>): AgentAssessment {
  const impact = has(items, "operational_impact");
  const contested = !impact || impact.status === "contested" || !impact.value.trim();
  return assessment("Operations", "Continuité d'activité et capacité d'exécution", contested ? "insufficient_context" : "conditional", scenarios.has("cost-containment") ? "cost-containment" : null, contested ? 30 : 70,
    [finding("objection", "L'impact opérationnel est contesté : une réduction d'effectifs pourrait dégrader le service ou les engagements clients.", "critical", ["operational_impact"])],
    contested ? ["impact opérationnel validé"] : [],
    ["Construire un plan de continuité", "Tester la capacité résiduelle par fonction"]);
}

function assessSeneca(items: ContextItem[], scenarios: Map<string, Scenario>): AgentAssessment {
  const alternatives = valid(items, "alternatives_reviewed");
  return assessment("SENECA", "Biais, contradictions et conséquences de second ordre", alternatives ? "conditional" : "oppose", scenarios.has("cost-containment") ? "cost-containment" : null, alternatives ? 66 : 74,
    [finding("objection", "Le risque d'ancrage sur le PSE est élevé tant que les alternatives n'ont pas été démontrées comme insuffisantes.", "high", ["alternatives_reviewed"])],
    alternatives ? [] : ["preuve d'épuisement des alternatives"],
    ["Rendre explicites les scénarios rejetés", "Documenter les effets irréversibles"]);
}

function assessAthena(items: ContextItem[], scenarios: Map<string, Scenario>): AgentAssessment {
  const objective = valid(items, "strategic_objective");
  return assessment("ATHENA", "Cohérence stratégique et modèle cible", objective ? "conditional" : "insufficient_context", scenarios.has("voluntary-mobility") ? "voluntary-mobility" : null, objective ? 69 : 40,
    [finding("question", "La décision doit préserver les capacités nécessaires au modèle opérationnel cible, pas seulement réduire les coûts à court terme.", "high", ["strategic_objective", "critical_skills"])],
    objective ? [] : ["objectif stratégique explicite"],
    ["Relier chaque scénario au modèle cible", "Identifier les capacités à préserver"]);
}

function assessment(agent: CouncilAgentId, role: string, position: CouncilPosition, preferredScenarioId: string | null, confidence: number, findings: CouncilFinding[], requiredInputs: string[], conditions: string[]): AgentAssessment {
  return { agent, role, position, preferredScenarioId, confidence, findings, requiredInputs, conditions };
}

function finding(type: CouncilFinding["type"], text: string, severity: CouncilFinding["severity"], evidenceKeys: string[]): CouncilFinding {
  return { type, text, severity, evidenceKeys };
}

function detectDivergences(assessments: AgentAssessment[]): CouncilDivergence[] {
  const preferences = new Map<string, CouncilAgentId[]>();
  assessments.forEach((assessment) => {
    if (!assessment.preferredScenarioId || assessment.position === "insufficient_context") return;
    preferences.set(assessment.preferredScenarioId, [...(preferences.get(assessment.preferredScenarioId) ?? []), assessment.agent]);
  });
  if (preferences.size <= 1) return [];
  return [{
    topic: "Scénario privilégié",
    agents: [...preferences.values()].flat(),
    description: [...preferences.entries()].map(([scenario, agents]) => `${agents.join(", ")} privilégient ${scenario}`).join(" ; "),
    resolutionNeeded: "Arbitrer la tension entre vitesse financière, protection humaine et continuité opérationnelle"
  }];
}

function buildOrionSynthesis(readiness: ContextReadiness, portfolio: ScenarioPortfolio, assessments: AgentAssessment[], divergences: CouncilDivergence[], dominant: string | null, allowed: boolean): string {
  const blockedAgents = assessments.filter((assessment) => assessment.position === "insufficient_context").map((assessment) => assessment.agent);
  if (!allowed) {
    return `ORION suspend toute recommandation définitive. Le contexte est prêt à ${readiness.readiness} %, ${portfolio.scenarios.filter((scenario) => scenario.score === null).length} scénario(s) restent non scorés et ${blockedAgents.length} agent(s) demandent des informations complémentaires${divergences.length ? ". Une divergence explicite doit aussi être arbitrée" : ""}.`;
  }
  return `ORION constate un consensus exploitable autour de ${dominant ?? "la direction dominante"}. La décision peut être proposée au dirigeant, sous réserve des conditions formulées par le Conseil.`;
}

function mode(values: string[]): string | null {
  if (!values.length) return null;
  const counts = values.reduce<Record<string, number>>((acc, value) => ({ ...acc, [value]: (acc[value] ?? 0) + 1 }), {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
