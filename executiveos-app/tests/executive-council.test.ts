import test from "node:test";
import assert from "node:assert/strict";
import { assessContext, answerContextItem, workforceRestructuringContextSeed } from "../lib/context-engine.ts";
import { buildDecisionFrame } from "../lib/decision-room.ts";
import { buildScenarioPortfolio } from "../lib/scenario-builder.ts";
import { conveneExecutiveCouncil } from "../lib/executive-council.ts";
import type { Challenge } from "../types/domain.ts";

const challenge: Challenge = {
  id: "council-case",
  title: "Restructuration",
  goal: "Décider",
  hypothesis: "",
  impact: 9,
  urgency: 8,
  confidence: 55,
  cognitiveCost: 8,
  risk: 9,
  context: "",
  state: "decide"
};

function buildCouncil(items = workforceRestructuringContextSeed) {
  const frame = buildDecisionFrame("Dois-je faire un plan social ?", challenge);
  const readiness = assessContext(items);
  const portfolio = buildScenarioPortfolio(frame, items, readiness);
  return conveneExecutiveCouncil(items, readiness, portfolio);
}

test("council mobilizes all required executive perspectives", () => {
  const council = buildCouncil();
  assert.deepEqual(council.assessments.map((item) => item.agent), ["CFO", "DRH", "Legal", "Operations", "SENECA", "ATHENA"]);
});

test("seeded case suspends the final recommendation", () => {
  const council = buildCouncil();
  assert.equal(council.recommendationAllowed, false);
  assert.match(council.orionSynthesis, /suspend/i);
  assert.ok(council.nextActions.length > 0);
});

test("council exposes objections and divergences", () => {
  const council = buildCouncil();
  assert.ok(council.assessments.some((item) => item.findings.some((finding) => finding.type === "objection")));
  assert.ok(council.divergences.length > 0);
});

test("verified context increases actionable assessments", () => {
  const completed = workforceRestructuringContextSeed.map((item) => {
    if (item.status === "verified") return item;
    const values: Record<string, string> = {
      target_savings_million: "4 M€",
      affected_roles_count: "80 postes",
      critical_skills: "Architecture, support client et sécurité",
      alternatives_reviewed: "Gel des recrutements, CAPEX et mobilité analysés",
      operational_impact: "Capacité maintenue avec plan de continuité",
      social_dialogue_status: "Information-consultation planifiée"
    };
    return answerContextItem(item, values[item.key] ?? "Documenté");
  });
  const council = buildCouncil(completed);
  assert.ok(council.assessments.filter((item) => item.position !== "insufficient_context").length >= 5);
  assert.ok(council.consensusLevel >= 0);
});
