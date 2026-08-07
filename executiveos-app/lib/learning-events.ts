import type { LearningEventRecord, LearningEventType } from "../domain/canonical.ts";
import type { CognitiveChange, CognitiveDiffResult } from "./cognitive-diff-types.ts";

export function learningEventsFromDiff(caseId: string, diff: CognitiveDiffResult, createdAt = new Date().toISOString()): LearningEventRecord[] {
  const events: LearningEventRecord[] = [];

  const push = (type: LearningEventType, title: string, change: CognitiveChange) => {
    events.push({
      id: `learn-${caseId}-${events.length + 1}-${createdAt}`,
      caseId,
      type,
      title,
      detail: buildDetail(change),
      significance: diff.significance,
      confidence: change.confidence,
      source: "cognitive_diff",
      createdAt
    });
  };

  for (const change of diff.changes) {
    switch (change.kind) {
      case "hypothesis_added": push("BeliefAdded", "Nouvelle hypothèse", change); break;
      case "hypothesis_reinforced": push("BeliefReinforced", "Hypothèse renforcée", change); break;
      case "hypothesis_invalidated": push("BeliefInvalidated", "Hypothèse invalidée", change); break;
      case "confidence_changed": push("ConfidenceChanged", "Confiance ajustée", change); break;
      case "decision_changed": push("DecisionReversed", "Décision révisée", change); break;
      case "risk_added": push("RiskDetected", "Nouveau risque", change); break;
      case "risk_resolved": push("RiskResolved", "Risque résolu", change); break;
      case "contradiction_detected": push("ContradictionDetected", "Contradiction détectée", change); break;
      case "knowledge_added": push("KnowledgeLearned", "Nouvel apprentissage", change); break;
    }
  }

  return events;
}

function buildDetail(change: CognitiveChange): string {
  const transition = change.before || change.after
    ? [change.before ? `Avant: ${change.before}` : null, change.after ? `Après: ${change.after}` : null].filter(Boolean).join(" · ")
    : change.subject;
  const delta = typeof change.delta === "number" ? ` · Δ ${change.delta > 0 ? "+" : ""}${change.delta}` : "";
  return `${change.subject}${transition && transition !== change.subject ? ` · ${transition}` : ""}${delta}`;
}
