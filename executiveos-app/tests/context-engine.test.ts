import test from "node:test";
import assert from "node:assert/strict";
import {
  answerContextItem,
  assessContext,
  buildAdaptiveQuestions,
  workforceRestructuringContextSeed
} from "../lib/context-engine.ts";

test("seeded restructuring context blocks premature recommendation", () => {
  const assessment = assessContext(workforceRestructuringContextSeed);
  assert.equal(assessment.recommendationAllowed, false);
  assert.ok(assessment.readiness > 0 && assessment.readiness < 100);
  assert.ok(assessment.missingRequired.some((item) => item.key === "target_savings"));
  assert.ok(assessment.contested.some((item) => item.key === "operational_impact"));
});

test("adaptive questions prioritize required missing context", () => {
  const questions = buildAdaptiveQuestions(workforceRestructuringContextSeed);
  assert.ok(questions.length > 0);
  assert.equal(questions[0].requirement, "required");
  assert.match(questions[0].rationale, /bloquante/);
});

test("answering a context item records provenance and verification", () => {
  const missing = workforceRestructuringContextSeed.find((item) => item.key === "target_savings");
  assert.ok(missing);
  const answered = answerContextItem(missing!, "2 500 000 €", "Budget CFO août 2026");
  assert.equal(answered.status, "verified");
  assert.equal(answered.source, "Budget CFO août 2026");
  assert.ok(answered.capturedAt);
  assert.ok(answered.confidence >= 70);
});

test("recommendation becomes possible only when every required item is verified", () => {
  const complete = workforceRestructuringContextSeed.map((item) => ({
    ...item,
    value: item.value || "Information documentée",
    status: "verified" as const,
    confidence: Math.max(item.confidence, 80)
  }));
  const assessment = assessContext(complete);
  assert.equal(assessment.recommendationAllowed, true);
  assert.equal(assessment.missingRequired.length, 0);
  assert.equal(assessment.contested.length, 0);
});
