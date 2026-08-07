import { describe, expect, it } from "vitest";
import { caseToChallenge, challengeToCase } from "./adapters";
import type { ActionRecord, DecisionRecord } from "./canonical";

const legacyChallenge = {
  id: "case-1",
  title: "Arbitrer une trajectoire",
  goal: "Décider avec moins d'incertitude",
  hypothesis: "Un pilote réduit le risque",
  impact: 8,
  urgency: 7,
  confidence: 72,
  cognitiveCost: 5,
  risk: 6,
  context: "Contexte courant",
  state: "decide" as const
};

describe("canonical ExecutiveOS domain", () => {
  it("round-trips the remaining legacy challenge through CognitiveCase", () => {
    const canonical = challengeToCase(legacyChallenge);
    expect(canonical.objective).toBe(legacyChallenge.goal);
    expect(canonical.signals.confidence).toBe(72);
    expect(caseToChallenge(canonical)).toEqual(legacyChallenge);
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
