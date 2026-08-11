import assert from "node:assert/strict";
import test from "node:test";
import { buildDecisionDoctrine, buildDecisionTwinSnapshot, predictDecisionOrientation } from "../lib/decision-twin.ts";
import type { CognitiveCase, CognitiveProfileRecord, DecisionRecord } from "../domain/canonical.ts";

const cognitiveCase = (id: string, context = "Un contexte documenté suffisamment long pour entraîner la doctrine."): CognitiveCase => ({
  id, title: id, objective: "Décider", workingHypothesis: "Tester", context, state: "learn",
  signals: { impact: 8, urgency: 5, confidence: 70, cognitiveCost: 4, risk: 6 }
});
const decision = (id: string): DecisionRecord => ({ id, caseId: id, recommendation: "Investir", outcome: "Investir", rationale: "Thèse", confidence: 75, createdAt: "2026-08-11T00:00:00.000Z" });

test("un jumeau sans historique indique le démarrage à froid", () => {
  const result = buildDecisionTwinSnapshot({ cases: [], decisions: [], profiles: [] });
  assert.equal(result.maturity, "initial");
  assert.equal(result.decisionCount, 0);
  assert.match(result.nextMilestone, /Importer 3 décisions/);
});

test("dix décisions documentées et une calibration produisent un jumeau calibré", () => {
  const cases = Array.from({ length: 10 }, (_, index) => cognitiveCase(`case-${index}`));
  const decisions = Array.from({ length: 10 }, (_, index) => decision(`case-${index}`));
  const profiles = [{ calibration: 82 }] as CognitiveProfileRecord[];
  const result = buildDecisionTwinSnapshot({ cases, decisions, profiles });
  assert.equal(result.maturity, "calibrated");
  assert.equal(result.doctrineCoverage, 100);
  assert.equal(result.calibration, 82);
});

test("la doctrine expose ses preuves et intègre une correction utilisateur", () => {
  const decisions = [
    { ...decision("case-1"), rationale: "La valeur doit être claire et validée par des preuves observables." },
    { ...decision("case-2"), rationale: "Nous exigeons un test et des résultats avant de déployer." }
  ];
  const sources = [{ title: "Doctrine corrigée:clarity", rawContent: "Je privilégie une valeur simple à expliquer au comité." }] as import("../domain/canonical.ts").ContextSourceRecord[];
  const doctrine = buildDecisionDoctrine({ decisions, profiles: [], sources });
  const clarity = doctrine.principles.find((item) => item.id === "clarity");
  assert.equal(clarity?.status, "corrected");
  assert.match(clarity?.statement ?? "", /comité/);
  assert.equal(clarity?.evidence.length, 1);
});

test("une prédiction reste indéterminée tant que l'historique est insuffisant", () => {
  const doctrine = buildDecisionDoctrine({ decisions: [decision("case-1")], profiles: [] });
  const prediction = predictDecisionOrientation({ cognitiveCase: cognitiveCase("new-case"), doctrine });
  assert.equal(prediction.orientation, "indéterminée");
  assert.ok(prediction.confidence <= 55);
});
