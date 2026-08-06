import test from "node:test";
import assert from "node:assert/strict";
import { buildDecisionFrame } from "../lib/decision-room.ts";
import { assessContext, workforceRestructuringContextSeed } from "../lib/context-engine.ts";
import { buildScenarioPortfolio, scoreScenario } from "../lib/scenario-builder.ts";
import type { Challenge } from "../types/domain.ts";

const challenge: Challenge = {
  id: "scenario-test",
  title: "Restructuration",
  goal: "Décider",
  hypothesis: "",
  impact: 9,
  urgency: 8,
  confidence: 55,
  cognitiveCost: 8,
  risk: 8,
  context: "",
  state: "decide"
};

test("workforce restructuring portfolio contains three seeded scenarios", () => {
  const frame = buildDecisionFrame("Dois-je faire un plan social ?", challenge);
  const readiness = assessContext(workforceRestructuringContextSeed);
  const portfolio = buildScenarioPortfolio(frame, workforceRestructuringContextSeed, readiness);
  assert.equal(portfolio.scenarios.length, 3);
  assert.deepEqual(portfolio.scenarios.map((scenario) => scenario.id), ["cost-containment", "voluntary-mobility", "targeted-restructuring"]);
});

test("recommendation remains blocked while required context is missing", () => {
  const frame = buildDecisionFrame("Faut-il réduire les effectifs ?", challenge);
  const readiness = assessContext(workforceRestructuringContextSeed);
  const portfolio = buildScenarioPortfolio(frame, workforceRestructuringContextSeed, readiness);
  assert.equal(portfolio.recommendationAllowed, false);
  assert.equal(portfolio.recommendedScenarioId, null);
  assert.ok(portfolio.scenarios.every((scenario) => scenario.score === null));
});

test("seeded scenarios expose impacts, assumptions and exit conditions", () => {
  const frame = buildDecisionFrame("Faut-il engager un PSE ?", challenge);
  const readiness = assessContext(workforceRestructuringContextSeed);
  const portfolio = buildScenarioPortfolio(frame, workforceRestructuringContextSeed, readiness);
  for (const scenario of portfolio.scenarios) {
    assert.ok(scenario.impacts.length >= 4);
    assert.ok(scenario.assumptions.length >= 3);
    assert.ok(scenario.exitConditions.length >= 3);
    assert.ok(scenario.dependencies.length >= 3);
  }
});

test("scenario scoring works when no blocking reason remains", () => {
  const scenario = {
    id: "scorable",
    title: "Scorable",
    description: "",
    horizonMonths: 3,
    reversibility: "high" as const,
    legalRisk: "low" as const,
    peopleImpact: "low" as const,
    assumptions: [],
    impacts: [
      { domain: "financial" as const, label: "Savings", value: 2, unit: "M€", direction: "positive" as const, confidence: 80, source: "CFO" },
      { domain: "people" as const, label: "Jobs", value: 0, unit: "postes", direction: "positive" as const, confidence: 90, source: "HR" }
    ],
    exitConditions: [],
    dependencies: [],
    score: null,
    scoreConfidence: 0,
    blockedReasons: []
  };
  const result = scoreScenario(scenario, [
    { id: "financial", label: "Finance", weight: 60 },
    { id: "people", label: "People", weight: 40 }
  ]);
  assert.ok(result.score !== null);
  assert.ok((result.score ?? 0) > 50);
  assert.ok(result.scoreConfidence >= 80);
});
