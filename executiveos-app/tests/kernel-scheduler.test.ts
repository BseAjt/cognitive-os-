import test from "node:test";
import assert from "node:assert/strict";
import { scheduleKernelCycle } from "../lib/kernel-scheduler.ts";
import { createExecutiveKernel } from "../lib/executive-kernel.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const baseCase: CognitiveCase = {
  id: "scheduler-case",
  title: "Prioriser un dossier",
  objective: "Tester le scheduler Kernel",
  workingHypothesis: "",
  context: "",
  state: "decide",
  signals: { impact: 8, urgency: 7, confidence: 62, cognitiveCost: 4, risk: 7 }
};

test("B6.4 scheduler classifies decision cycles before runtime", () => {
  const schedule = scheduleKernelCycle({ message: "Dois-je lancer maintenant ?", cognitiveCase: baseCase });
  assert.equal(schedule.lane, "decision");
  assert.ok(["high", "critical"].includes(schedule.priority));
  assert.ok(schedule.score >= 60);
  assert.ok(schedule.reasons.some((item) => item.includes("urgence")));
});

test("B6.4 scheduler differentiates execution and learning lanes", () => {
  assert.equal(scheduleKernelCycle({ message: "Construis le plan et exécute la roadmap", cognitiveCase: baseCase }).lane, "execution");
  assert.equal(scheduleKernelCycle({ message: "Quel apprentissage tirer du retour terrain ?", cognitiveCase: baseCase }).lane, "learning");
});

test("B6.4 lower signal dossiers can be scheduled in background", () => {
  const cognitiveCase = { ...baseCase, signals: { impact: 1, urgency: 1, confidence: 95, cognitiveCost: 9, risk: 1 } };
  const schedule = scheduleKernelCycle({ message: "Archive cette note", cognitiveCase });
  assert.equal(schedule.priority, "background");
});

test("B6.4 Kernel emits scheduling metadata before stage transitions", () => {
  let id = 0;
  const kernel = createExecutiveKernel({ idFactory: () => `id-${++id}`, now: () => "2026-08-08T00:00:00.000Z" });
  const execution = kernel.execute({ message: "Dois-je lancer maintenant ?", cognitiveCase: baseCase });
  assert.equal(execution.events[0]?.type, "KernelCycleStarted");
  assert.equal(execution.events[1]?.type, "KernelCycleScheduled");
  assert.equal(execution.transaction.lane, "decision");
  assert.ok(execution.transaction.priority);
  assert.ok(typeof execution.transaction.scheduleScore === "number");
});
