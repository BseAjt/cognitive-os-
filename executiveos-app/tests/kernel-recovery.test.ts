import test from "node:test";
import assert from "node:assert/strict";
import { planKernelRecovery } from "../lib/kernel-recovery.ts";
import { createExecutiveKernel } from "../lib/executive-kernel.ts";
import { runRuntimePipeline } from "../lib/runtime-pipeline.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const cognitiveCase: CognitiveCase = {
  id: "recovery-case",
  title: "Recovery test",
  objective: "Tester le retry Kernel",
  workingHypothesis: "",
  context: "",
  state: "explore",
  signals: { impact: 6, urgency: 5, confidence: 72, cognitiveCost: 4, risk: 4 }
};

const input = { message: "Analyse le dossier", cognitiveCase };

test("B6.6 recovery planner retries transient failures once", () => {
  assert.equal(planKernelRecovery(new Error("network timeout"), 1).disposition, "retry");
  assert.equal(planKernelRecovery(new Error("network timeout"), 2).disposition, "fail_fast");
});

test("B6.6 recovery planner fails fast on validation and policy errors", () => {
  assert.equal(planKernelRecovery(new Error("validation failed"), 1).disposition, "fail_fast");
  assert.equal(planKernelRecovery(new Error("policy forbidden"), 1).disposition, "fail_fast");
});

test("B6.6 Kernel recovers from one transient runtime failure", () => {
  let attempts = 0;
  let ids = 0;
  const kernel = createExecutiveKernel({
    runtime: (runtimeInput) => {
      attempts += 1;
      if (attempts === 1) throw new Error("503 temporary network failure");
      return runRuntimePipeline(runtimeInput);
    },
    idFactory: () => `retry-${++ids}`,
    now: () => "2026-08-08T00:00:00.000Z"
  });
  const execution = kernel.execute(input);
  assert.equal(attempts, 2);
  assert.equal(execution.transaction.attemptCount, 2);
  assert.equal(execution.transaction.recoveryDisposition, "retry");
  assert.ok(execution.events.some((event) => event.type === "KernelRetryScheduled"));
  assert.equal(execution.events.at(-1)?.type, "KernelCycleCompleted");
});

test("B6.6 Kernel never retries non-transient failures", () => {
  let attempts = 0;
  let ids = 0;
  const kernel = createExecutiveKernel({
    runtime: () => { attempts += 1; throw new Error("validation schema mismatch"); },
    idFactory: () => `fatal-${++ids}`,
    now: () => "2026-08-08T00:00:00.000Z"
  });
  assert.throws(() => kernel.execute(input), /validation schema mismatch/);
  assert.equal(attempts, 1);
});
