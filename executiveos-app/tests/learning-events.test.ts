import test from "node:test";
import assert from "node:assert/strict";
import { learningEventsFromDiff } from "../lib/learning-events.ts";
import type { CognitiveDiffResult } from "../lib/cognitive-diff-types.ts";

const diff: CognitiveDiffResult = {
  caseId: "case-1",
  changes: [
    { kind: "hypothesis_reinforced", subject: "Le marché est prêt", before: "Le marché est prêt", after: "Le marché est prêt", confidence: 84, evidence: [] },
    { kind: "decision_changed", subject: "Décision", before: "Lancer", after: "Reporter", confidence: 91, evidence: [] },
    { kind: "risk_resolved", subject: "Risque budget", before: "Risque budget", after: "résolu", confidence: 88, evidence: [] },
    { kind: "knowledge_added", subject: "Le churn baisse", after: "Le churn baisse", confidence: 79, evidence: [] }
  ],
  hypothesisChanges: [], confidenceChanges: [], decisionChanges: [], newRisks: [], resolvedRisks: [], contradictions: [], newKnowledge: [],
  recommendedReflection: "Réévaluer la décision.",
  significance: "high"
};

test("cognitive diffs become persistent learning events", () => {
  const events = learningEventsFromDiff("case-1", diff, "2026-08-07T12:00:00.000Z");
  assert.deepEqual(events.map((event) => event.type), ["BeliefReinforced", "DecisionReversed", "RiskResolved", "KnowledgeLearned"]);
  assert.ok(events.every((event) => event.caseId === "case-1"));
  assert.ok(events.every((event) => event.significance === "high"));
  assert.match(events[1].detail, /Avant: Lancer/);
  assert.match(events[1].detail, /Après: Reporter/);
});
