import { describe, expect, it } from "vitest";
import type { ActionRecord, CognitiveCase, DecisionRecord } from "./canonical";

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

describe("canonical ExecutiveOS domain", () => {
  it("represents cognitive cases directly without legacy adapters", () => {
    expect(cognitiveCase.objective).toBe("Décider avec moins d'incertitude");
    expect(cognitiveCase.workingHypothesis).toBe("Un pilote réduit le risque");
    expect(cognitiveCase.signals.confidence).toBe(72);
  });

  it("uses canonical decision and action records directly", () => {
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

    expect(decision.caseId).toBe("case-1");
    expect(decision.outcome).toBe("Pilote");
    expect(action.caseId).toBe("case-1");
  });
});
