import test from "node:test";
import assert from "node:assert/strict";
import type { CognitiveCase, DecisionRecord, KnowledgeRecord, MemoryRecord } from "../domain/canonical.ts";
import { buildCognitiveDiff } from "../lib/cognitive-diff.ts";
import { runUnifiedRuntime } from "../lib/unified-runtime.ts";

const cognitiveCase: CognitiveCase = {
  id: "learning-case",
  title: "Learning loop",
  objective: "Valider l'apprentissage explicite",
  workingHypothesis: "Le marché est prêt",
  context: "Pilote en cours",
  state: "learn",
  signals: { impact: 9, urgency: 7, confidence: 70, cognitiveCost: 5, risk: 6 }
};

const previousMemories: MemoryRecord[] = [
  { id: "m-h", caseId: cognitiveCase.id, kind: "hypothesis", content: "Le marché est prêt", confidence: 68, durable: true, source: "unified_runtime", createdAt: "2026-08-07T12:00:00.000Z" },
  { id: "m-r", caseId: cognitiveCase.id, kind: "risk", content: "Le churn est élevé", confidence: 80, durable: true, source: "unified_runtime", createdAt: "2026-08-07T12:01:00.000Z" }
];

const previousKnowledge: KnowledgeRecord[] = [
  { id: "k1", caseId: cognitiveCase.id, type: "context_item", title: "Pilote en cours", confidence: 88, source: "unified_runtime", createdAt: "2026-08-07T12:00:00.000Z" }
];

const previousDecision: DecisionRecord = {
  id: "d1",
  caseId: cognitiveCase.id,
  recommendation: "Poursuivre",
  outcome: "Lancer le pilote national",
  rationale: "Signal positif",
  confidence: 74,
  createdAt: "2026-08-07T12:02:00.000Z"
};

function cycle(message = "Je pense que le marché est prêt. Le risque principal est le budget.") {
  return runUnifiedRuntime({ message, cognitiveCase });
}

test("detects reinforced and new hypotheses without duplicating equivalent beliefs", () => {
  const currentCycle = cycle();
  currentCycle.memory = [
    { kind: "hypothesis", content: "Le marché est prêt", confidence: 86, durable: true },
    { kind: "hypothesis", content: "Le segment public est prioritaire", confidence: 76, durable: true }
  ];
  const diff = buildCognitiveDiff({
    cognitiveCase,
    currentMessage: "Je pense que le marché est prêt et que le segment public est prioritaire.",
    previousMemories,
    previousKnowledge,
    previousDecisions: [previousDecision],
    previousActions: [],
    currentCycle
  });
  assert.ok(diff.hypothesisChanges.some((item) => item.kind === "hypothesis_reinforced" && item.subject.includes("marché")));
  assert.ok(diff.hypothesisChanges.some((item) => item.kind === "hypothesis_added" && item.subject.includes("public")));
});

test("detects explicit hypothesis invalidation and marks the diff high significance", () => {
  const currentCycle = cycle("L'hypothèse sur le marché est fausse.");
  currentCycle.memory = [];
  const diff = buildCognitiveDiff({
    cognitiveCase,
    currentMessage: "L'hypothèse sur le marché est fausse et invalidée par les entretiens.",
    previousMemories,
    previousKnowledge,
    previousDecisions: [previousDecision],
    previousActions: [],
    currentCycle
  });
  assert.ok(diff.hypothesisChanges.some((item) => item.kind === "hypothesis_invalidated"));
  assert.equal(diff.significance, "high");
});

test("detects decision reversal and contradiction", () => {
  const currentCycle = cycle("Finalement nous abandonnons le lancement national.");
  currentCycle.decision = {
    outcome: "Limiter le pilote à deux clients",
    recommendation: "Réduire l'exposition",
    confidence: 82,
    rationale: "Le risque a augmenté"
  };
  const diff = buildCognitiveDiff({
    cognitiveCase,
    currentMessage: "Finalement nous revenons sur la décision précédente et abandonnons le lancement national.",
    previousMemories,
    previousKnowledge,
    previousDecisions: [previousDecision],
    previousActions: [],
    currentCycle
  });
  assert.equal(diff.decisionChanges.length, 1);
  assert.equal(diff.contradictions.length, 1);
  assert.equal(diff.significance, "high");
});

test("detects new and explicitly resolved risks", () => {
  const currentCycle = cycle();
  currentCycle.memory = [{ kind: "risk", content: "Le budget est insuffisant", confidence: 84, durable: true }];
  const diff = buildCognitiveDiff({
    cognitiveCase,
    currentMessage: "Le risque de churn est désormais résolu. Le budget est insuffisant.",
    previousMemories,
    previousKnowledge,
    previousDecisions: [previousDecision],
    previousActions: [],
    currentCycle
  });
  assert.ok(diff.newRisks.some((item) => item.subject.includes("budget")));
  assert.ok(diff.resolvedRisks.some((item) => item.subject.includes("churn")));
});

test("detects confidence movement and new knowledge", () => {
  const currentCycle = cycle();
  currentCycle.agents = { ...currentCycle.agents, confidence: 88 };
  currentCycle.knowledge = [{ type: "insight", title: "Les utilisateurs demandent une intégration calendrier", confidence: 91 }];
  const diff = buildCognitiveDiff({
    cognitiveCase,
    currentMessage: "Nouveau signal utilisateur.",
    previousRecall: {
      caseId: cognitiveCase.id,
      summary: "état précédent",
      openActions: [],
      durableMemories: previousMemories,
      latestReasoning: [],
      relevantKnowledge: [],
      nextBestAction: "Continuer",
      confidence: 70
    },
    previousMemories,
    previousKnowledge,
    previousDecisions: [previousDecision],
    previousActions: [],
    currentCycle
  });
  assert.equal(diff.confidenceChanges[0]?.delta, 18);
  assert.equal(diff.newKnowledge.length, 1);
  assert.match(diff.recommendedReflection, /Prochaine action/);
});
