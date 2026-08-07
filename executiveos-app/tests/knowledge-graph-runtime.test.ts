import test from "node:test";
import assert from "node:assert/strict";
import { projectKnowledgeGraph } from "../lib/knowledge-graph-runtime.ts";
import type { ActionRecord, CognitiveCase, DecisionRecord, KnowledgeRecord, MemoryRecord } from "../domain/canonical.ts";

const cognitiveCase: CognitiveCase = {
  id: "case-1",
  title: "Lancer ExecutiveOS",
  objective: "Valider le produit",
  workingHypothesis: "Le cockpit réduit le temps de décision",
  context: "Pilote en cours",
  state: "decide",
  signals: { impact: 9, urgency: 8, confidence: 72, cognitiveCost: 5, risk: 6 }
};

const knowledgeRecords: KnowledgeRecord[] = [
  { id: "k1", caseId: "case-1", type: "context_item", title: "Pilote en cours", confidence: 88, source: "unified_runtime", createdAt: "2026-08-07T13:00:00.000Z" },
  { id: "k2", caseId: "case-1", type: "risk", title: "Adoption incertaine", confidence: 83, source: "unified_runtime", createdAt: "2026-08-07T13:00:00.000Z" },
  { id: "k3", caseId: "case-1", type: "decision", title: "Lancer un pilote", confidence: 91, source: "unified_runtime", createdAt: "2026-08-07T13:00:00.000Z" },
  { id: "k4", caseId: "case-1", type: "action", title: "Préparer le pilote", confidence: 87, source: "unified_runtime", createdAt: "2026-08-07T13:00:00.000Z" }
];

const memories: MemoryRecord[] = [
  { id: "m1", caseId: "case-1", kind: "hypothesis", content: "Le cockpit réduit le temps de décision", confidence: 79, durable: true, source: "unified_runtime", createdAt: "2026-08-07T13:00:00.000Z" },
  { id: "m2", caseId: "case-1", kind: "question", content: "Quel segment tester ?", confidence: 90, durable: false, source: "unified_runtime", createdAt: "2026-08-07T13:00:00.000Z" }
];

const decision: DecisionRecord = {
  id: "d1",
  caseId: "case-1",
  recommendation: "Pilote limité",
  outcome: "Lancer un pilote",
  rationale: "Réduire l'incertitude",
  confidence: 91,
  createdAt: "2026-08-07T13:00:00.000Z"
};

const actions: ActionRecord[] = [{
  id: "a1",
  caseId: "case-1",
  title: "Préparer le pilote",
  owner: "À assigner",
  progress: 0,
  status: "todo",
  requiredCapability: "analysis"
}];

test("projection creates a case-centered living graph", () => {
  const graph = projectKnowledgeGraph({
    cognitiveCase,
    knowledgeRecords,
    memories,
    decision,
    actions,
    createdAt: "2026-08-07T13:00:00.000Z"
  });

  assert.ok(graph.entities.some((entity) => entity.id === "case:case-1" && entity.type === "decision_case"));
  assert.ok(graph.entities.some((entity) => entity.id === "knowledge:k1" && entity.type === "context_item"));
  assert.ok(graph.entities.some((entity) => entity.id === "knowledge:k2" && entity.type === "risk"));
  assert.ok(graph.entities.some((entity) => entity.id === "memory:m1" && entity.type === "memory"));
  assert.equal(graph.entities.some((entity) => entity.id === "memory:m2"), false);
});

test("decision and action entities use canonical records instead of flat knowledge duplicates", () => {
  const graph = projectKnowledgeGraph({ cognitiveCase, knowledgeRecords, memories, decision, actions, createdAt: "2026-08-07T13:00:00.000Z" });
  assert.ok(graph.entities.some((entity) => entity.id === "decision:d1"));
  assert.ok(graph.entities.some((entity) => entity.id === "action:a1"));
  assert.equal(graph.entities.some((entity) => entity.id === "knowledge:k3"), false);
  assert.equal(graph.entities.some((entity) => entity.id === "knowledge:k4"), false);
});

test("projection creates semantic relations for risk, memory, decision and action", () => {
  const graph = projectKnowledgeGraph({ cognitiveCase, knowledgeRecords, memories, decision, actions, createdAt: "2026-08-07T13:00:00.000Z" });
  assert.ok(graph.relations.some((relation) => relation.sourceId === "knowledge:k2" && relation.relationType === "AFFECTS"));
  assert.ok(graph.relations.some((relation) => relation.sourceId === "memory:m1" && relation.relationType === "DERIVED_FROM"));
  assert.ok(graph.relations.some((relation) => relation.sourceId === "case:case-1" && relation.targetId === "decision:d1" && relation.relationType === "SELECTS"));
  assert.ok(graph.relations.some((relation) => relation.sourceId === "decision:d1" && relation.targetId === "action:a1" && relation.relationType === "CREATES"));
});

test("every projected graph item stays scoped to the cognitive case", () => {
  const graph = projectKnowledgeGraph({ cognitiveCase, knowledgeRecords, memories, decision, actions, createdAt: "2026-08-07T13:00:00.000Z" });
  assert.ok(graph.entities.every((entity) => entity.caseId === "case-1"));
  assert.ok(graph.relations.every((relation) => relation.caseId === "case-1"));
});
