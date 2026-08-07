import test from "node:test";
import assert from "node:assert/strict";
import { createExecutiveKernel } from "../lib/executive-kernel.ts";
import { runUnifiedRuntime } from "../lib/unified-runtime.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const cognitiveCase: CognitiveCase = {
  id: "kernel-case",
  title: "Executive Kernel",
  objective: "Centraliser l'orchestration cognitive",
  workingHypothesis: "Le Kernel doit devenir le point d'entrée unique",
  context: "B6.2 est stable",
  state: "explore",
  signals: { impact: 9, urgency: 7, confidence: 82, cognitiveCost: 5, risk: 4 }
};

test("Unified Runtime compatibility facade executes through the Executive Kernel", () => {
  const result = runUnifiedRuntime({ message: "Il faut analyser l'architecture puis créer un plan.", cognitiveCase });
  assert.equal(result.kernel.caseId, cognitiveCase.id);
  assert.equal(result.kernel.status, "completed");
  assert.deepEqual(result.kernel.completedStages, result.trace.filter((item) => item.status === "completed").map((item) => item.stage));
  assert.equal(result.kernelEvents[0]?.type, "KernelCycleStarted");
  assert.equal(result.kernelEvents.at(-1)?.type, "KernelCycleCompleted");
  assert.equal(result.kernelEvents.filter((event) => event.type === "KernelStageTransitioned").length, result.trace.length);
});

test("Kernel transaction exposes blocked decision stages without discarding the cycle", () => {
  const result = runUnifiedRuntime({ message: "Faut-il engager un PSE ?", cognitiveCase });
  assert.equal(result.kernel.status, "blocked");
  assert.ok(result.kernel.blockedStages.includes("decision"));
  assert.ok(result.kernelEvents.some((event) => event.type === "KernelCycleBlocked" && event.stage === undefined));
  assert.equal(result.trace.find((item) => item.stage === "decision")?.status, "blocked");
});

test("Kernel transactions are isolated and receive unique transaction ids", () => {
  let sequence = 0;
  const kernel = createExecutiveKernel({ idFactory: () => `id-${++sequence}`, now: () => "2026-08-08T10:00:00.000Z" });
  const first = kernel.execute({ message: "Quel est le contexte ?", cognitiveCase });
  const second = kernel.execute({ message: "Quel est le risque ?", cognitiveCase: { ...cognitiveCase, id: "kernel-case-2" } });
  assert.notEqual(first.transaction.id, second.transaction.id);
  assert.ok(first.events.every((event) => event.caseId === "kernel-case" && event.transactionId === first.transaction.id));
  assert.ok(second.events.every((event) => event.caseId === "kernel-case-2" && event.transactionId === second.transaction.id));
});

test("Kernel emits a failure event when an internal runtime service throws", () => {
  const kernel = createExecutiveKernel({
    runtime: () => { throw new Error("runtime unavailable"); },
    idFactory: (() => { let sequence = 0; return () => `failure-${++sequence}`; })(),
    now: () => "2026-08-08T10:00:00.000Z"
  });
  assert.throws(
    () => kernel.execute({ message: "Test failure", cognitiveCase }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      const enriched = error as Error & { kernelEvents?: Array<{ type: string; status: string }> };
      assert.equal(enriched.message, "runtime unavailable");
      assert.equal(enriched.kernelEvents?.at(-1)?.type, "KernelCycleFailed");
      assert.equal(enriched.kernelEvents?.at(-1)?.status, "failed");
      return true;
    }
  );
});
