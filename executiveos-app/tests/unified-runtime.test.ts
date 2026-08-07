import test from "node:test";
import assert from "node:assert/strict";
import { runUnifiedRuntime } from "../lib/unified-runtime.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const cognitiveCase: CognitiveCase = {
  id: "runtime-cycle",
  title: "Runtime cycle",
  objective: "Tester l'orchestration ExecutiveOS",
  workingHypothesis: "",
  context: "Contexte initial",
  state: "explore",
  signals: {
    impact: 8,
    urgency: 6,
    confidence: 72,
    cognitiveCost: 5,
    risk: 4
  }
};

test("unified runtime exposes the complete ordered cognitive cycle", () => {
  const result = runUnifiedRuntime({ message: "Le risque est le budget. Il faut analyser la trésorerie.", cognitiveCase });
  assert.deepEqual(result.trace.map((item) => item.stage), ["recall", "context", "reasoning", "agents", "decision", "action", "memory", "knowledge"]);
  assert.equal(result.trace[0].status, "skipped");
  assert.ok(result.reasoning.length >= 2);
  assert.equal(result.trace.find((item) => item.stage === "agents")?.status, "completed");
  assert.ok(result.agents.selectedAgentIds.length >= 1);
  assert.equal(result.actions.length, 1);
  assert.equal(result.actions[0].requiredCapability, "finance");
  assert.ok(result.memory.some((item) => item.durable));
  assert.ok(result.knowledge.some((item) => item.type === "risk"));
  assert.ok(result.knowledge.some((item) => item.type === "action"));
});

test("recall summary is injected before new reasoning", () => {
  const result = runUnifiedRuntime({
    message: "Et maintenant ?",
    cognitiveCase,
    recallSummary: "Dernière décision: lancer le pilote. Prochaine meilleure action: mesurer l'adoption."
  });
  assert.equal(result.trace[0].stage, "recall");
  assert.equal(result.trace[0].status, "completed");
  assert.ok(result.reasoning.some((item) => item.content.startsWith("Recall —")));
});

test("ordinary decision creates a decision proposal", () => {
  const result = runUnifiedRuntime({ message: "Faut-il lancer une nouvelle offre ?", cognitiveCase });
  assert.equal(result.conversation.intent, "decision");
  assert.ok(result.decision);
  assert.equal(result.conversation.decisionFrame?.category, "launch");
  assert.equal(result.trace.find((item) => item.stage === "decision")?.status, "completed");
  assert.match(result.decision?.rationale ?? "", /Decision Runtime/);
});

test("regulated workforce decision stays blocked until context is complete", () => {
  const result = runUnifiedRuntime({ message: "Faut-il engager un PSE ?", cognitiveCase });
  assert.equal(result.conversation.decisionFrame?.category, "workforce_restructuring");
  assert.equal(result.conversation.decisionFrame?.recommendation, null);
  assert.equal(result.trace.find((item) => item.stage === "decision")?.status, "blocked");
});

test("questions are captured but not promoted as durable memory", () => {
  const result = runUnifiedRuntime({ message: "Quel est notre taux de conversion ?", cognitiveCase });
  assert.equal(result.memory[0].kind, "question");
  assert.equal(result.memory[0].durable, false);
  assert.equal(result.knowledge[0].type, "insight");
});

test("reasoning proposals map cognitive objects and agent reviews onto reasoning steps", () => {
  const result = runUnifiedRuntime({
    message: "Je pense que le marché est prêt. Le risque est le churn. Il faut tester avec cinq clients.",
    cognitiveCase
  });
  assert.ok(result.reasoning.some((item) => item.stepId === "hypothesis"));
  assert.ok(result.reasoning.some((item) => item.stepId === "objections"));
  assert.ok(result.reasoning.some((item) => item.stepId === "consequences"));
  assert.ok(result.reasoning.some((item) => item.content.includes("ORION")));
});
