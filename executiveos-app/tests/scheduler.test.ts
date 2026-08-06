import test from "node:test";
import assert from "node:assert/strict";
import { challengeScore, explainPriority } from "../lib/scheduler.ts";
import type { Challenge } from "../types/domain.ts";

const base: Challenge = {
  id: "scheduler",
  title: "Scheduler",
  goal: "Tester le classement",
  hypothesis: "",
  impact: 7,
  urgency: 5,
  confidence: 70,
  cognitiveCost: 5,
  risk: 4,
  context: "",
  state: "explore"
};

test("challenge score is deterministic", () => {
  assert.equal(challengeScore(base), challengeScore({ ...base }));
});

test("higher impact increases priority", () => {
  assert.ok(challengeScore({ ...base, impact: 10 }) > challengeScore({ ...base, impact: 3 }));
});

test("higher urgency increases priority", () => {
  assert.ok(challengeScore({ ...base, urgency: 10 }) > challengeScore({ ...base, urgency: 2 }));
});

test("higher cognitive cost lowers priority", () => {
  assert.ok(challengeScore({ ...base, cognitiveCost: 2 }) > challengeScore({ ...base, cognitiveCost: 9 }));
});

test("zero cognitive cost is handled safely", () => {
  assert.ok(Number.isFinite(challengeScore({ ...base, cognitiveCost: 0 })));
});

test("priority explanation exposes low confidence warning", () => {
  const reasons = explainPriority({ ...base, confidence: 40 });
  assert.ok(reasons.some((reason) => reason.includes("confiance insuffisante")));
});

test("priority explanation exposes critical risk warning", () => {
  const reasons = explainPriority({ ...base, risk: 9 });
  assert.ok(reasons.some((reason) => reason.includes("Risque critique")));
});
