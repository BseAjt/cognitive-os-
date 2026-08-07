import type { CognitiveDiff, CognitiveDiffChange, DecisionChange, HypothesisChange } from "./cognitive-diff-types.ts";

export type LearningEventType =
  | "BeliefAdded"
  | "BeliefReinforced"
  | "BeliefInvalidated"
  | "ConfidenceChanged"
  | "DecisionReversed"
  | "DecisionUpdated"
  | "RiskDetected"
  | "RiskResolved"
  | "ContradictionDetected"
  | "KnowledgeLearned";

export interface LearningEventRecord {
  id: string;
  caseId: string;
  type: LearningEventType;
  title: string;
  detail: string;
  significance: CognitiveDiff["significance"];
  confidence?: number;
  source: "cognitive_diff";
  createdAt: string;
}

export function learningEventsFromDiff(caseId: string, diff: CognitiveDiff, createdAt = new Date().toISOString()): LearningEventRecord[] {
  const events: LearningEventRecord[] = [];
  const push = (type: LearningEventType, title: string, detail: string, confidence?: number) => {
    events.push({
      id: `learn-${caseId}-${events.length + 1}-${createdAt}`,
      caseId,
      type,
      title,
      detail,
      significance: diff.significance,
      confidence,
      source: "cognitive_diff",
      createdAt
    });
  };

  for (const change of diff.hypothesisChanges) addHypothesisEvent(push, change);
  for (const change of diff.confidenceChanges) push("ConfidenceChanged", "Confiance ajustée", `${change.label}: ${change.before}% → ${change.after}%`, change.after);
  for (const change of diff.decisionChanges) addDecisionEvent(push, change);
  for (const risk of diff.newRisks) push("RiskDetected", "Nouveau risque", risk.title, risk.confidence);
  for (const risk of diff.resolvedRisks) push("RiskResolved", "Risque résolu", risk.title, risk.confidence);
  for (const contradiction of diff.contradictions) push("ContradictionDetected", "Contradiction détectée", contradiction.detail, contradiction.confidence);
  for (const knowledge of diff.newKnowledge) push("KnowledgeLearned", "Nouvel apprentissage", knowledge.title, knowledge.confidence);

  return events;
}

function addHypothesisEvent(
  push: (type: LearningEventType, title: string, detail: string, confidence?: number) => void,
  change: HypothesisChange
) {
  if (change.change === "added") push("BeliefAdded", "Nouvelle hypothèse", change.current ?? change.previous ?? "Hypothèse ajoutée", change.confidenceAfter);
  if (change.change === "reinforced") push("BeliefReinforced", "Hypothèse renforcée", change.current ?? change.previous ?? "Hypothèse renforcée", change.confidenceAfter);
  if (change.change === "invalidated") push("BeliefInvalidated", "Hypothèse invalidée", change.previous ?? change.current ?? "Hypothèse invalidée", change.confidenceAfter);
}

function addDecisionEvent(
  push: (type: LearningEventType, title: string, detail: string, confidence?: number) => void,
  change: DecisionChange
) {
  const detail = [change.previous ? `Avant: ${change.previous}` : null, change.current ? `Après: ${change.current}` : null].filter(Boolean).join(" · ");
  if (change.change === "reversed") push("DecisionReversed", "Décision renversée", detail || "Décision renversée", change.confidenceAfter);
  else push("DecisionUpdated", "Décision mise à jour", detail || "Décision mise à jour", change.confidenceAfter);
}
