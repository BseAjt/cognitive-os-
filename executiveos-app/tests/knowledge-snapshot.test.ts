import test from "node:test";
import assert from "node:assert/strict";
import { entityCounts, executiveKnowledgeSeed, validateKnowledgeSnapshot } from "../lib/knowledge-snapshot.ts";

test("seeded knowledge graph is structurally valid", () => {
  assert.deepEqual(validateKnowledgeSnapshot(executiveKnowledgeSeed), []);
  assert.ok(executiveKnowledgeSeed.entities.length >= 10);
  assert.ok(executiveKnowledgeSeed.relations.length >= 10);
});

test("decision case is connected to context and scenarios", () => {
  const edges = executiveKnowledgeSeed.relations.filter((edge) => edge.sourceId === "decision-workforce");
  assert.ok(edges.some((edge) => edge.relationType === "USES_CONTEXT"));
  assert.ok(edges.some((edge) => edge.relationType === "CONSIDERS"));
  assert.ok(edges.some((edge) => edge.relationType === "CREATES"));
});

test("seed includes organizational memory and learning", () => {
  const counts = entityCounts(executiveKnowledgeSeed);
  assert.equal(counts.memory, 1);
  assert.equal(counts.learning, 1);
  assert.ok(executiveKnowledgeSeed.briefing.newKnowledge > 0);
});
