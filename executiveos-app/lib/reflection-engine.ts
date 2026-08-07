import type { LearningEventRecord, ReflectionRecord } from "../domain/canonical.ts";
import type { CognitiveDiffResult } from "./cognitive-diff-types.ts";

export function buildReflection(input: {
  caseId: string;
  diff: CognitiveDiffResult;
  learningEvents: LearningEventRecord[];
  createdAt?: string;
}): ReflectionRecord {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const whatChanged = input.diff.changes.map((change) => `${change.kind}: ${change.subject}`);
  const whyItChanged = unique(input.diff.changes.flatMap((change) => change.evidence)).slice(0, 8);
  const learned = unique(input.learningEvents.map((event) => event.detail)).slice(0, 8);
  const uncertainties = input.learningEvents
    .filter((event) => event.type === "ConfidenceChanged" || event.type === "ContradictionDetected" || event.type === "RiskDetected")
    .map((event) => event.detail);
  const decisionsToReconsider = input.learningEvents
    .filter((event) => event.type === "DecisionReversed" || event.type === "BeliefInvalidated" || event.type === "ContradictionDetected")
    .map((event) => event.detail);
  const confidence = reflectionConfidence(input.diff, input.learningEvents);
  const summary = buildSummary(input.diff, learned, uncertainties, decisionsToReconsider);

  return {
    id: crypto.randomUUID(),
    caseId: input.caseId,
    summary,
    whatChanged,
    whyItChanged,
    learned,
    uncertainties,
    decisionsToReconsider,
    confidence,
    significance: input.diff.significance,
    source: "reflection_engine",
    createdAt
  };
}

function buildSummary(diff: CognitiveDiffResult, learned: string[], uncertainties: string[], reconsider: string[]): string {
  if (diff.significance === "none") return "Aucune évolution cognitive significative détectée sur ce cycle.";
  const parts = [
    `Changements détectés: ${diff.changes.length}.`,
    learned.length ? `Apprentissage principal: ${learned[0]}` : null,
    uncertainties.length ? `Incertitude principale: ${uncertainties[0]}` : null,
    reconsider.length ? `Révision à envisager: ${reconsider[0]}` : null,
    `Réflexion recommandée: ${diff.recommendedReflection}`
  ].filter((item): item is string => Boolean(item));
  return parts.join(" ");
}

function reflectionConfidence(diff: CognitiveDiffResult, events: LearningEventRecord[]): number {
  if (diff.significance === "none") return 70;
  const eventConfidence = events.map((event) => event.confidence).filter((value): value is number => typeof value === "number");
  if (!eventConfidence.length) return diff.significance === "high" ? 80 : 72;
  return Math.round(eventConfidence.reduce((sum, value) => sum + value, 0) / eventConfidence.length);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
