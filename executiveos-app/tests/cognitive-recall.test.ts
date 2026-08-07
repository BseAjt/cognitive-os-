import test from "node:test";
import assert from "node:assert/strict";
import { buildCognitiveRecall } from "../lib/cognitive-recall.ts";
import type { ActionRecord, AgentRunRecord, CognitiveCase, DecisionRecord, KnowledgeEntity, MemoryRecord } from "../domain/canonical.ts";
import type { ReasoningRevision } from "../store/types.ts";

const cognitiveCase: CognitiveCase = {
  id: "case-recall",
  title: "Recall",
  objective: "Reprendre sans recommencer",
  workingHypothesis: "La mémoire cognitive réduit le coût de reprise",
  context: "Le runtime est en cours de validation",
  state: "decide",
  signals: { impact: 9, urgency: 6, confidence: 70, cognitiveCost: 8, risk: 5 }
};

const decisions: DecisionRecord[] = [
  { id: "d-old", caseId: "case-recall", recommendation: "old", outcome: "Ancienne décision", rationale: "", confidence: 70, createdAt: "2026-08-01T00:00:00.000Z" },
  { id: "d-new", caseId: "case-recall", recommendation: "new", outcome: "Dernière décision", rationale: "", confidence: 82, createdAt: "2026-08-07T00:00:00.000Z" }
];

const actions: ActionRecord[] = [
  { id: "a-done", caseId: "case-recall", title: "Terminé", owner: "ORION", progress: 100, status: "done" },
  { id: "a-open", caseId: "case-recall", title: "Valider le recall", owner: "TURING", progress: 25, status: "doing" }
];

const memories: MemoryRecord[] = [
  { id: "m1", caseId: "case-recall", kind: "hypothesis", content: "Hypothèse durable", confidence: 80, durable: true, source: "unified_runtime", createdAt: "2026-08-06T00:00:00.000Z" },
  { id: "m2", caseId: "case-recall", kind: "question", content: "Question temporaire", confidence: 80, durable: false, source: "unified_runtime", createdAt: "2026-08-07T00:00:00.000Z" }
];

const reasoningRevisions: ReasoningRevision[] = [
  { id: "r1", caseId: "case-recall", stepId: "hypothesis", version: 1, content: "H1", createdAt: "2026-08-05T00:00:00.000Z" },
  { id: "r2", caseId: "case-recall", stepId: "hypothesis", version: 2, content: "H2", createdAt: "2026-08-07T00:00:00.000Z" },
  { id: "r3", caseId: "case-recall", stepId: "objections", version: 1, content: "Risque", createdAt: "2026-08-06T00:00:00.000Z" }
];

const knowledgeEntities: KnowledgeEntity[] = [
  { id: "k1", organizationId: "executiveos", caseId: "case-recall", type: "risk", title: "Risque adoption", status: "active", createdAt: "2026-08-06T00:00:00.000Z", updatedAt: "2026-08-06T00:00:00.000Z" }
];

const agentRuns: AgentRunRecord[] = [{
  id: "run-1", caseId: "case-recall", orchestratorId: "orion", selectedAgentIds: ["seneca"], contributions: [], synthesis: "Réduire le risque avant engagement", confidence: 84, createdAt: "2026-08-07T00:00:00.000Z"
}];

test("recall reconstructs the latest useful state of a cognitive case", () => {
  const recall = buildCognitiveRecall({ cognitiveCase, decisions, actions, memories, reasoningRevisions, knowledgeEntities, knowledgeRelations: [], agentRuns });
  assert.equal(recall.lastDecision?.id, "d-new");
  assert.deepEqual(recall.openActions.map((item) => item.id), ["a-open"]);
  assert.deepEqual(recall.durableMemories.map((item) => item.id), ["m1"]);
  assert.equal(recall.latestReasoning.find((item) => item.stepId === "hypothesis")?.content, "H2");
  assert.equal(recall.lastAgentRun?.id, "run-1");
  assert.equal(recall.nextBestAction, "Valider le recall");
  assert.match(recall.summary, /Dernière décision/);
  assert.match(recall.summary, /Valider le recall/);
  assert.ok(recall.confidence > cognitiveCase.signals.confidence);
});
