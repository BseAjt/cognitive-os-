import test from "node:test";
import assert from "node:assert/strict";
import {
  createDecisionContext,
  evaluateDecisionContext,
  runDecisionRuntime
} from "../lib/decision-runtime.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const cognitiveCase: CognitiveCase = {
  id: "decision-runtime",
  title: "Decision runtime",
  objective: "Tester le moteur de décision",
  workingHypothesis: "",
  context: "",
  state: "decide",
  signals: {
    impact: 8,
    urgency: 6,
    confidence: 72,
    cognitiveCost: 5,
    risk: 5
  }
};

test("generic decision runtime returns scored options and recommendation", () => {
  const result = runDecisionRuntime("Faut-il lancer une nouvelle offre ?", cognitiveCase);
  assert.equal(result.frame.category, "launch");
  assert.equal(result.frame.options.length, 3);
  assert.ok(result.frame.options.every((option) => option.score !== null));
  assert.equal(result.recommendation, result.frame.recommendation);
  assert.equal(result.recommendationAllowed, true);
});

test("regulated workforce decision blocks recommendation while context is incomplete", () => {
  const result = runDecisionRuntime("Faut-il lancer un plan social ?", cognitiveCase);
  assert.equal(result.frame.category, "workforce_restructuring");
  assert.equal(result.frame.requiresContext, true);
  assert.equal(result.recommendationAllowed, false);
  assert.equal(result.recommendation, null);
  assert.ok(result.assessment.missingRequired.length > 0);
  assert.match(result.nextAction, /Documenter les informations bloquantes/);
});

test("decision context can be evaluated independently from UI", () => {
  const initial = runDecisionRuntime("Faut-il recruter un CTO ?", cognitiveCase);
  const completed = createDecisionContext(initial.frame).map((item) => ({
    ...item,
    value: "Documenté",
    confidence: 90,
    status: "verified" as const
  }));
  const evaluated = evaluateDecisionContext(initial.frame, completed);
  assert.equal(evaluated.assessment.missingRequired.length, 0);
  assert.equal(evaluated.recommendationAllowed, true);
});
