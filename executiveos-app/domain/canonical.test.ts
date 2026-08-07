import test from "node:test";
import assert from "node:assert/strict";
import type { ActionRecord, CognitiveCase, DecisionRecord } from "./canonical.ts";

const cognitiveCase: CognitiveCase = {
  id: "case-1",
  title: "Arbitrer une trajectoire",
  objective: "Décider avec moins d'incertitude",
  workingHypothesis: "Un pilote réduit le risque",
  context: "Contexte courant",
  state: "decide",
  signals: {
    impact: 8,
    urgency: 7,
    confidence: 72,
    cognitiveCost: 5,
    risk: 6
  }
};

test("canonical case is represented directly without legacy adapters", () => {
  assert.equal(cognitiveCase.objective, "Décider avec moins d'incertitude");
  assert.equal(cognitiveCase.workingHypothesis, "Un pilote réduit le risque");
  assert.equal(cognitiveCase.signals.confidence, 72);
});

test("decision and action records use canonical caseId", () => {
  const decision: DecisionRecord = {
    id: "d1",
    caseId: "case-1",
    recommendation: "Tester",
    outcome: "Pilote",
    rationale: "Réversible",
    confidence: 80,
    createdAt: "2026-08-07T10:00:00.000Z"
  };
  const action: ActionRecord = {
    id: "a1",
    caseId: "case-1",
    title: "Lancer le pilote",
    owner: "CEO",
    progress: 0,
    status: "todo"
  };

  assert.equal(decision.caseId, "case-1");
  assert.equal(decision.outcome, "Pilote");
  assert.equal(action.caseId, "case-1");
});
