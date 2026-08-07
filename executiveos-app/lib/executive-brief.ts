import type { ActionRecord, CognitiveCase, DecisionRecord, DossierObjectRecord, LearningEventRecord, ReflectionRecord } from "../domain/canonical.ts";

export interface ExecutiveCaseBrief {
  objective: string;
  state: CognitiveCase["state"];
  latestDecision: string;
  decisionConfidence?: number;
  nextAction: string;
  blockers: string[];
  criticalRisks: string[];
  latestLearning: string;
  recommendation: string;
  health: "stable" | "watch" | "critical";
}

export function buildExecutiveCaseBrief(input: {
  cognitiveCase: CognitiveCase;
  decisions: DecisionRecord[];
  actions: ActionRecord[];
  caseObjects: DossierObjectRecord[];
  learningEvents: LearningEventRecord[];
  reflections: ReflectionRecord[];
}): ExecutiveCaseBrief {
  const { cognitiveCase } = input;
  const decisions = input.decisions.filter((item) => item.caseId === cognitiveCase.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const actions = input.actions.filter((item) => item.caseId === cognitiveCase.id);
  const objects = input.caseObjects.filter((item) => item.caseId === cognitiveCase.id);
  const learningEvents = input.learningEvents.filter((item) => item.caseId === cognitiveCase.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reflections = input.reflections.filter((item) => item.caseId === cognitiveCase.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const latestDecision = decisions[0];
  const openActions = actions.filter((item) => item.status !== "done");
  const blockedActions = openActions.filter((item) => item.status === "blocked");
  const nextAction = openActions.find((item) => item.status === "doing") ?? openActions.find((item) => item.status === "todo") ?? openActions[0];
  const risks = objects.filter((item) => item.type === "risk" && item.status !== "resolved").sort((a, b) => b.confidence - a.confidence);
  const latestLearning = learningEvents[0]?.detail ?? reflections[0]?.summary ?? "Aucun apprentissage consolidé pour le moment.";
  const blockers = blockedActions.map((item) => item.blockedReason ? `${item.title} — ${item.blockedReason}` : item.title);
  const criticalRisks = risks.filter((item) => item.confidence >= 70).slice(0, 3).map((item) => item.title);
  const health: ExecutiveCaseBrief["health"] = cognitiveCase.signals.risk >= 8 || blockers.length > 0 ? "critical" : cognitiveCase.signals.risk >= 6 || criticalRisks.length > 0 ? "watch" : "stable";
  const recommendation = blockers.length
    ? `Lever le blocage « ${blockers[0]} » avant d'élargir l'exécution.`
    : nextAction
      ? `Faire avancer « ${nextAction.title} » et mesurer son résultat.`
      : latestDecision
        ? "Transformer la décision actuelle en prochaine action observable."
        : "Clarifier la question de décision et comparer les options avant engagement.";

  return {
    objective: cognitiveCase.objective,
    state: cognitiveCase.state,
    latestDecision: latestDecision?.outcome ?? "Aucune décision formalisée",
    decisionConfidence: latestDecision?.confidence,
    nextAction: nextAction?.title ?? "Aucune action ouverte",
    blockers,
    criticalRisks,
    latestLearning,
    recommendation,
    health
  };
}
