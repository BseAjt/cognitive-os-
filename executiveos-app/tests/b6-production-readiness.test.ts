import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createExecutiveKernel } from "../lib/executive-kernel.ts";
import { assessKernelHealth } from "../lib/kernel-health.ts";
import { evaluateKernelAutonomy } from "../lib/kernel-autonomy.ts";
import { runRuntimePipeline } from "../lib/runtime-pipeline.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const cognitiveCase: CognitiveCase = {
  id: "b6-readiness",
  title: "B6 Production Readiness",
  objective: "Valider le Kernel de bout en bout",
  workingHypothesis: "Le Kernel peut orchestrer des cycles observables, contrôlés et récupérables.",
  context: "UAT finale B6.",
  state: "execute",
  signals: { impact: 9, urgency: 8, confidence: 78, cognitiveCost: 5, risk: 5 }
};

function deterministicKernel() {
  let id = 0;
  let tick = 0;
  return createExecutiveKernel({
    idFactory: () => `b6-${++id}`,
    now: () => `2026-08-08T00:00:${String(tick++).padStart(2, "0")}.000Z`
  });
}

test("B6.8 UAT traverses scheduler, policy, runtime and observability metadata", () => {
  const execution = deterministicKernel().execute({ message: "Construis et exécute un plan de lancement", cognitiveCase });
  assert.equal(execution.transaction.status, "completed");
  assert.equal(execution.transaction.lane, "execution");
  assert.ok(execution.transaction.priority === "high" || execution.transaction.priority === "critical");
  assert.equal(execution.transaction.policyDecision, "allow");
  assert.equal(execution.transaction.attemptCount, 1);
  assert.equal(execution.events[0]?.type, "KernelCycleStarted");
  assert.equal(execution.events[1]?.type, "KernelCycleScheduled");
  assert.equal(execution.events[2]?.type, "KernelPolicyEvaluated");
  assert.equal(execution.events.at(-1)?.type, "KernelCycleCompleted");
});

test("B6.8 UAT proves bounded recovery then healthy completion", () => {
  let attempts = 0;
  let id = 0;
  const kernel = createExecutiveKernel({
    runtime: (input) => {
      attempts += 1;
      if (attempts === 1) throw new Error("503 temporary timeout");
      return runRuntimePipeline(input);
    },
    idFactory: () => `recovery-${++id}`,
    now: () => "2026-08-08T00:10:00.000Z"
  });
  const execution = kernel.execute({ message: "Construis le plan", cognitiveCase });
  assert.equal(attempts, 2);
  assert.equal(execution.transaction.attemptCount, 2);
  assert.ok(execution.events.some((event) => event.type === "KernelRetryScheduled"));
  const autonomy = evaluateKernelAutonomy({ result: execution.result, priority: execution.transaction.priority ?? "normal", policyDecision: execution.transaction.policyDecision ?? "allow", attemptCount: execution.transaction.attemptCount ?? 1 });
  assert.equal(autonomy.decision, "suggest_followup");
  assert.equal(autonomy.trigger, "recovery_used");
});

test("B6.8 production health detects healthy traces and integrity corruption", () => {
  const execution = deterministicKernel().execute({ message: "Construis un plan de lancement", cognitiveCase });
  const healthy = assessKernelHealth([execution.transaction], execution.events);
  assert.equal(healthy.status, "healthy");
  assert.equal(healthy.completedRate, 100);
  assert.deepEqual(healthy.integrityErrors, []);

  const corrupted = assessKernelHealth([execution.transaction], execution.events.slice(1));
  assert.equal(corrupted.status, "critical");
  assert.ok(corrupted.integrityErrors.some((item) => item.startsWith("event_count:")));
  assert.ok(corrupted.integrityErrors.some((item) => item.startsWith("missing_start:")));
});

test("B6.8 guarded decisions remain blocked and cannot autonomously continue", () => {
  const execution = deterministicKernel().execute({ message: "Faut-il lancer un PSE ?", cognitiveCase });
  assert.equal(execution.transaction.status, "blocked");
  assert.equal(execution.transaction.policyDecision, "require_context");
  const autonomy = evaluateKernelAutonomy({ result: execution.result, priority: execution.transaction.priority ?? "normal", policyDecision: execution.transaction.policyDecision ?? "allow", attemptCount: execution.transaction.attemptCount ?? 1 });
  assert.equal(autonomy.decision, "requires_human");
});

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const store = readFileSync(resolve(root, "store/executive-store.ts"), "utf8");
const commands = readFileSync(resolve(root, "store/commands.ts"), "utf8");
const runtimePanel = readFileSync(resolve(root, "components/executive-runtime-panel.tsx"), "utf8");

test("B6.8 production contracts preserve Kernel persistence and user-visible observability", () => {
  assert.ok(store.includes("version: 17"));
  assert.ok(store.includes("kernelTransactions"));
  assert.ok(store.includes("kernelEvents"));
  assert.ok(commands.includes("kernelTransactions:"));
  assert.ok(commands.includes("kernelEvents:"));
  assert.ok(runtimePanel.includes("Executive Kernel · Observability"));
  assert.ok(runtimePanel.includes("transaction.caseId === activeCaseId"));
});
