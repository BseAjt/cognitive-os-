import test from "node:test";
import assert from "node:assert/strict";
import { caseScore, explainPriority } from "../lib/scheduler.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const base: CognitiveCase = {
  id: "scheduler",
  title: "Scheduler",
  objective: "Tester le classement",
  workingHypothesis: "",
  context: "",
  state: "explore",
  signals: {
    impact: 7,
    urgency: 5,
    confidence: 70,
    cognitiveCost: 5,
    risk: 4
  }
};

function withSignals(patch: Partial<CognitiveCase["signals"]>): CognitiveCase {
  return { ...base, signals: { ...base.signals, ...patch } };
}

test("case score is deterministic", () => {
  assert.equal(caseScore(base), caseScore({ ...base, signals: { ...base.signals } }));
});

test("higher impact increases priority", () => {
  assert.ok(caseScore(withSignals({ impact: 10 })) > caseScore(withSignals({ impact: 3 })));
});

test("higher urgency increases priority", () => {
  assert.ok(caseScore(withSignals({ urgency: 10 })) > caseScore(withSignals({ urgency: 2 })));
});

test("higher cognitive cost lowers priority", () => {
  assert.ok(caseScore(withSignals({ cognitiveCost: 2 })) > caseScore(withSignals({ cognitiveCost: 9 })));
});

test("zero cognitive cost is handled safely", () => {
  assert.ok(Number.isFinite(caseScore(withSignals({ cognitiveCost: 0 }))));
});

test("priority explanation exposes low confidence warning", () => {
  const reasons = explainPriority(withSignals({ confidence: 40 }));
  assert.ok(reasons.some((reason) => reason.includes("confiance insuffisante")));
});

test("priority explanation exposes critical risk warning", () => {
  const reasons = explainPriority(withSignals({ risk: 9 }));
  assert.ok(reasons.some((reason) => reason.includes("Risque critique")));
});
