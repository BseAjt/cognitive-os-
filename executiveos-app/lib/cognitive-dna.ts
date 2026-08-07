import type { CognitiveProfileRecord, DecisionRecord, LearningEventRecord, ReflectionRecord } from "../domain/canonical.ts";

export function buildCognitiveProfile(input: {
  caseId: string;
  decisions: DecisionRecord[];
  learningEvents: LearningEventRecord[];
  reflections: ReflectionRecord[];
  previous?: CognitiveProfileRecord;
  createdAt?: string;
}): CognitiveProfileRecord {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const decisions = input.decisions.filter((item) => item.caseId === input.caseId);
  const events = input.learningEvents.filter((item) => item.caseId === input.caseId);
  const reflections = input.reflections.filter((item) => item.caseId === input.caseId);
  const confidenceEvents = events.filter((item) => item.type === "ConfidenceChanged");
  const reversals = events.filter((item) => item.type === "DecisionReversed");
  const reinforced = events.filter((item) => item.type === "BeliefReinforced");
  const invalidated = events.filter((item) => item.type === "BeliefInvalidated");
  const risks = events.filter((item) => item.type === "RiskDetected");
  const resolvedRisks = events.filter((item) => item.type === "RiskResolved");
  const contradictions = events.filter((item) => item.type === "ContradictionDetected");
  const learned = events.filter((item) => item.type === "KnowledgeLearned");

  const avgDecisionConfidence = average(decisions.map((item) => item.confidence), 70);
  const confidenceVolatility = average(confidenceEvents.map((item) => Math.abs(parseConfidenceDelta(item.detail))), 0);
  const calibration = clamp(Math.round(avgDecisionConfidence - Math.min(25, confidenceVolatility * 0.5) - contradictions.length * 3));
  const beliefBase = reinforced.length + invalidated.length;
  const beliefStability = clamp(Math.round(beliefBase ? (reinforced.length / beliefBase) * 100 : 70));
  const revisionRate = clamp(Math.round((reversals.length + invalidated.length + reflections.filter((item) => item.decisionsToReconsider.length).length) / Math.max(1, decisions.length + events.length) * 100));
  const riskDiscipline = clamp(Math.round(risks.length ? Math.min(100, 55 + (resolvedRisks.length / risks.length) * 45) : 70));
  const learningQuality = clamp(Math.round(Math.min(100, 45 + learned.length * 6 + reflections.filter((item) => item.learned.length > 0).length * 7 - contradictions.length * 2)));

  const dominantPatterns: string[] = [];
  if (beliefStability >= 75) dominantPatterns.push("Croyances relativement stables après validation");
  if (revisionRate >= 20) dominantPatterns.push("Révision fréquente lorsque le contexte évolue");
  if (riskDiscipline >= 80) dominantPatterns.push("Bonne fermeture des risques détectés");
  if (learningQuality >= 80) dominantPatterns.push("Capitalisation active des apprentissages");
  if (calibration >= 80) dominantPatterns.push("Confiance globalement bien calibrée");

  const biasSignals: string[] = [];
  if (avgDecisionConfidence >= 85 && contradictions.length >= 2) biasSignals.push("Surconfiance potentielle face aux contradictions");
  if (beliefBase >= 3 && invalidated.length === 0) biasSignals.push("Faible taux d'invalidation des croyances");
  if (risks.length >= 3 && resolvedRisks.length === 0) biasSignals.push("Accumulation de risques sans fermeture observée");
  if (revisionRate < 5 && reversals.length === 0 && decisions.length >= 3) biasSignals.push("Inertie décisionnelle potentielle");

  return {
    id: input.previous?.id ?? `cognitive-profile:${input.caseId}`,
    caseId: input.caseId,
    calibration,
    beliefStability,
    revisionRate,
    riskDiscipline,
    learningQuality,
    dominantPatterns,
    biasSignals,
    sampleSize: decisions.length + events.length + reflections.length,
    source: "cognitive_dna",
    createdAt: input.previous?.createdAt ?? createdAt,
    updatedAt: createdAt
  };
}

function average(values: number[], fallback: number): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : fallback;
}
function clamp(value: number): number { return Math.max(0, Math.min(100, value)); }
function parseConfidenceDelta(detail: string): number {
  const values = [...detail.matchAll(/(\d+)%/g)].map((match) => Number(match[1]));
  return values.length >= 2 ? values[values.length - 1] - values[0] : 0;
}
