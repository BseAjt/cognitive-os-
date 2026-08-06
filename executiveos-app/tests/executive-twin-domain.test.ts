import test from "node:test";
import assert from "node:assert/strict";
import { entityCounts, executiveTwinSeed, validateExecutiveTwinSeed } from "../lib/executive-twin-domain.ts";

test("seeded Executive Twin domain graph is structurally valid", () => {
  assert.deepEqual(validateExecutiveTwinSeed(executiveTwinSeed), []);
  assert.ok(executiveTwinSeed.entities.length >= 10);
  assert.ok(executiveTwinSeed.relations.length >= 10);
});

test("decision case is connected to context and scenarios", () => {
  const edges = executiveTwinSeed.relations.filter((edge) => edge.sourceId === "decision-workforce");
  assert.ok(edges.some((edge) => edge.relationType === "USES_CONTEXT"));
  assert.ok(edges.some((edge) => edge.relationType === "CONSIDERS"));
  assert.ok(edges.some((edge) => edge.relationType === "CREATES"));
});

test("seed includes organizational memory and learning", () => {
  const counts = entityCounts(executiveTwinSeed);
  assert.equal(counts.memory, 1);
  assert.equal(counts.learning, 1);
  assert.ok(executiveTwinSeed.briefing.newKnowledge > 0);
});
