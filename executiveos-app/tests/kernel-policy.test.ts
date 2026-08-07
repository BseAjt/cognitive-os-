import test from "node:test";
import assert from "node:assert/strict";
import { evaluateKernelPolicy } from "../lib/kernel-policy.ts";
import { createExecutiveKernel } from "../lib/executive-kernel.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const baseCase: CognitiveCase = {
  id: "policy-case",
  title: "Policy test",
  objective: "Tester les garde-fous Kernel",
  workingHypothesis: "",
  context: "",
  state: "decide",
  signals: { impact: 7, urgency: 6, confidence: 70, cognitiveCost: 4, risk: 5 }
};

test("B6.5 allows ordinary cognitive cycles", () => {
  const result = evaluateKernelPolicy({ message: "Compare les options A et B", cognitiveCase: baseCase });
  assert.equal(result.decision, "allow");
  assert.equal(result.risk, "low");
});

test("B6.5 requires context for regulated workforce decisions", () => {
  const result = evaluateKernelPolicy({ message: "Faut-il lancer un PSE ?", cognitiveCase: baseCase });
  assert.equal(result.decision, "require_context");
  assert.equal(result.risk, "high");
  assert.ok(result.rules.includes("regulated_workforce_decision"));
});

test("B6.5 denies explicit destructive side effects", () => {
  const result = evaluateKernelPolicy({ message: "Supprime définitivement la base de production", cognitiveCase: baseCase });
  assert.equal(result.decision, "deny");
  assert.equal(result.risk, "critical");
  assert.ok(result.rules.includes("destructive_side_effect"));
});

test("B6.5 escalates high-risk low-confidence dossiers", () => {
  const cognitiveCase = { ...baseCase, signals: { ...baseCase.signals, risk: 9, confidence: 40 } };
  const result = evaluateKernelPolicy({ message: "Analyse la situation", cognitiveCase });
  assert.equal(result.decision, "require_context");
  assert.ok(result.rules.includes("high_risk_low_confidence"));
});

test("B6.5 Kernel persists policy outcome and emits it before runtime stage events", () => {
  let id = 0;
  const kernel = createExecutiveKernel({ idFactory: () => `policy-${++id}`, now: () => "2026-08-08T00:00:00.000Z" });
  const execution = kernel.execute({ message: "Faut-il lancer un PSE ?", cognitiveCase: baseCase });
  assert.equal(execution.events[2]?.type, "KernelPolicyEvaluated");
  assert.equal(execution.transaction.policyDecision, "require_context");
  assert.equal(execution.transaction.policyRisk, "high");
  assert.equal(execution.transaction.status, "blocked");
});
