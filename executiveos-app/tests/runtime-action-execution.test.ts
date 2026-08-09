import test from "node:test";
import assert from "node:assert/strict";
import type { ActionRecord, CognitiveCase } from "../domain/canonical.ts";
import { defaultExecutiveAgents } from "../lib/agent-runtime.ts";
import { runRuntimeActionExecution } from "../lib/runtime-action-execution.ts";

const cognitiveCase: CognitiveCase = {
  id: "case-runtime-action",
  title: "Lancement pilote",
  objective: "Valider la valeur du pilote",
  workingHypothesis: "Le pilote améliore le temps de décision",
  context: "Le périmètre et le sponsor sont identifiés.",
  state: "execute",
  signals: { impact: 8, urgency: 7, confidence: 78, cognitiveCost: 4, risk: 3 }
};

const action: ActionRecord = {
  id: "action-runtime",
  caseId: cognitiveCase.id,
  title: "Préparer le protocole de validation du pilote",
  owner: "TURING",
  progress: 0,
  status: "todo",
  requiredCapability: "execution",
  assignedAgentId: "turing"
};

test("démarrer une action exécute un vrai cycle Kernel et produit un cadrage", () => {
  const execution = runRuntimeActionExecution({ phase: "prepare", action, cognitiveCase, agents: defaultExecutiveAgents, memories: [], knowledgeRecords: [] });
  assert.ok(execution.result.kernel.eventCount >= 5);
  assert.ok(execution.result.kernel.completedStages.includes("agents"));
  assert.ok(execution.result.agents.selectedAgentIds.length > 0);
  assert.match(execution.summary, /ORION recommande/);
  assert.match(execution.summary, /Prochaine étape/);
});

test("exécuter une action produit des sorties persistables au-delà du statut", () => {
  const execution = runRuntimeActionExecution({ phase: "execute", action: { ...action, status: "doing", progress: 35 }, cognitiveCase, agents: defaultExecutiveAgents, memories: [], knowledgeRecords: [] });
  assert.ok(execution.result.reasoning.length > 0);
  assert.ok(execution.result.memory.length > 0);
  assert.ok(execution.result.knowledge.length > 0);
  assert.ok(execution.result.kernelEvents.some((event) => event.type === "KernelCycleCompleted"));
  assert.ok(execution.summary.length > 120);
});
