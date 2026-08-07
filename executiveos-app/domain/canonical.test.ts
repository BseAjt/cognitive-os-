import { describe, expect, it } from "vitest";
import { caseToChallenge, challengeToCase, decisionToCanonical, actionToCanonical } from "./adapters";

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
  it("round-trips a legacy challenge through CognitiveCase", () => {
    const canonical = challengeToCase(legacyChallenge);
    expect(canonical.objective).toBe(legacyChallenge.goal);
    expect(canonical.signals.confidence).toBe(72);
    expect(caseToChallenge(canonical)).toEqual(legacyChallenge);
  });

  it("maps legacy decisions and actions to canonical case-linked records", () => {
    const decision = decisionToCanonical({
      id: "d1",
      challengeId: "case-1",
      recommendation: "Tester",
      finalDecision: "Pilote",
      rationale: "Réversible",
      confidence: 80,
      createdAt: "2026-08-07T10:00:00.000Z"
    });
    const action = actionToCanonical({
      id: "a1",
      challengeId: "case-1",
      title: "Lancer le pilote",
      owner: "CEO",
      progress: 0,
      status: "todo"
    });

    expect(decision.caseId).toBe("case-1");
    expect(decision.outcome).toBe("Pilote");
    expect(action.caseId).toBe("case-1");
  });
});
