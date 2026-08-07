import test from "node:test";
import assert from "node:assert/strict";
import { evaluateKernelAutonomy } from "../lib/kernel-autonomy.ts";
import { runRuntimePipeline } from "../lib/runtime-pipeline.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const cognitiveCase: CognitiveCase = {
  id: "autonomy-case",
  title: "Autonomy test",
  objective: "Tester une autonomie contrôlée",
  workingHypothesis: "",
  context: "",
  state: "execute",
  signals: { impact: 8, urgency: 7, confidence: 75, cognitiveCost: 4, risk: 4 }
};

const result = runRuntimePipeline({ message: "Construis un plan de lancement", cognitiveCase });

test("B6.7 guarded cycles always require human intervention", () => {
  const autonomy = evaluateKernelAutonomy({ result, priority: "high", policyDecision: "require_context", attemptCount: 1 });
  assert.equal(autonomy.decision, "requires_human");
  assert.equal(autonomy.trigger, "policy_guardrail");
  assert.equal(autonomy.suggestedPrompt, undefined);
});

test("B6.7 blocked runtime cycles never self-continue", () => {
  const blocked = { ...result, trace: [{ ...result.trace[0]!, status: "blocked" as const }] };
  const autonomy = evaluateKernelAutonomy({ result: blocked, priority: "critical", policyDecision: "allow", attemptCount: 1 });
  assert.equal(autonomy.decision, "requires_human");
  assert.equal(autonomy.trigger, "blocked_cycle");
});

test("B6.7 recovered cycles suggest a robustness follow-up without executing it", () => {
  const autonomy = evaluateKernelAutonomy({ result, priority: "high", policyDecision: "allow", attemptCount: 2 });
  assert.equal(autonomy.decision, "suggest_followup");
  assert.equal(autonomy.trigger, "recovery_used");
  assert.match(autonomy.suggestedPrompt ?? "", /robustesse/i);
});

test("B6.7 high priority successful cycles can suggest the next action", () => {
  const autonomy = evaluateKernelAutonomy({ result, priority: "high", policyDecision: "allow", attemptCount: 1 });
  assert.equal(autonomy.decision, "suggest_followup");
  assert.equal(autonomy.trigger, "high_priority_followup");
  assert.equal(autonomy.suggestedPrompt, result.nextAction);
});

test("B6.7 ordinary successful cycles remain observation-only", () => {
  const autonomy = evaluateKernelAutonomy({ result, priority: "normal", policyDecision: "allow", attemptCount: 1 });
  assert.equal(autonomy.decision, "observe");
  assert.equal(autonomy.trigger, "none");
});
