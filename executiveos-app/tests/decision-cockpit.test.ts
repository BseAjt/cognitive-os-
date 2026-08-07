import test from "node:test";
import assert from "node:assert/strict";
import { assessContext, workforceRestructuringContextSeed } from "../lib/context-engine.ts";
import { buildScenarioPortfolio } from "../lib/scenario-builder.ts";
import { conveneExecutiveCouncil } from "../lib/executive-council.ts";
import { buildDecisionCockpit, serializeDecisionRecord } from "../lib/decision-cockpit.ts";
import { buildDecisionFrame } from "../lib/decision-runtime.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const cognitiveCase: CognitiveCase = {
  id: "cockpit",
  title: "Restructuration",
  objective: "Décider",
  workingHypothesis: "",
  context: "",
  state: "decide",
  signals: { impact: 9, urgency: 8, confidence: 55, cognitiveCost: 8, risk: 9 }
};

function setup() {
  const frame = buildDecisionFrame("Dois-je faire un plan social ?", cognitiveCase);
  const readiness = assessContext(workforceRestructuringContextSeed);
  const portfolio = buildScenarioPortfolio(frame, workforceRestructuringContextSeed, readiness);
  const council = conveneExecutiveCouncil(workforceRestructuringContextSeed, readiness, portfolio);
  return { frame, readiness, portfolio, council };
}

test("cockpit blocks decision while critical gates fail", () => {
  const { readiness, portfolio, council } = setup();
  const cockpit = buildDecisionCockpit(readiness, portfolio, council, "cost-containment");
  assert.equal(cockpit.decisionAllowed, false);
  assert.equal(cockpit.status, "blocked");
  assert.ok(cockpit.gates.some((gate) => gate.status === "blocked"));
});

test("cockpit preserves dissent and conditions", () => {
  const { readiness, portfolio, council } = setup();
  const cockpit = buildDecisionCockpit(readiness, portfolio, council, "voluntary-mobility");
  assert.ok(cockpit.conditions.length > 0);
  assert.ok(cockpit.dissentingViews.some((view) => view.includes("SENECA") || view.includes("Operations")));
});

test("cockpit is seeded with review triggers and outcome metrics", () => {
  const { readiness, portfolio, council } = setup();
  const cockpit = buildDecisionCockpit(readiness, portfolio, council, "cost-containment");
  assert.ok(cockpit.reviewTriggers.length >= 4);
  assert.ok(cockpit.outcomeMetrics.length >= 4);
  assert.ok(cockpit.reviewTriggers.some((trigger) => trigger.metric.includes("trésorerie")));
});

test("decision record is explicit and auditable", () => {
  const { readiness, portfolio, council } = setup();
  const cockpit = buildDecisionCockpit(readiness, portfolio, council, "cost-containment");
  const record = serializeDecisionRecord("Dois-je restructurer ?", cockpit, "Réduction des coûts", "Préserver les compétences", "CEO", "2026-09-30");
  assert.match(record, /Statut : brouillon bloqué/);
  assert.match(record, /Dissensions conservées/);
  assert.match(record, /Déclencheurs de révision/);
});
