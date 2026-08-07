import test from "node:test";
import assert from "node:assert/strict";
import {
  createDecisionContext,
  evaluateDecisionContext,
  runDecisionRuntime
} from "../lib/decision-runtime.ts";
import type { Challenge } from "../types/domain.ts";

const challenge: Challenge = {
  id: "decision-runtime",
  title: "Decision runtime",
  goal: "Tester le moteur de décision",
  hypothesis: "",
  impact: 8,
  urgency: 6,
  confidence: 72,
  cognitiveCost: 5,
  risk: 5,
  context: "",
  state: "decide"
};

test("generic decision runtime returns scored options and recommendation", () => {
  const result = runDecisionRuntime("Faut-il lancer une nouvelle offre ?", challenge);
  assert.equal(result.frame.category, "launch");
  assert.equal(result.frame.options.length, 3);
  assert.ok(result.frame.options.every((option) => option.score !== null));
  assert.equal(result.recommendation, result.frame.recommendation);
  assert.equal(result.recommendationAllowed, true);
});

test("regulated workforce decision blocks recommendation while context is incomplete", () => {
  const result = runDecisionRuntime("Faut-il lancer un plan social ?", challenge);
  assert.equal(result.frame.category, "workforce_restructuring");
  assert.equal(result.frame.requiresContext, true);
  assert.equal(result.recommendationAllowed, false);
  assert.equal(result.recommendation, null);
  assert.ok(result.assessment.missingRequired.length > 0);
  assert.match(result.nextAction, /Documenter les informations bloquantes/);
});

test("decision context can be evaluated independently from UI", () => {
  const initial = runDecisionRuntime("Faut-il recruter un CTO ?", challenge);
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
