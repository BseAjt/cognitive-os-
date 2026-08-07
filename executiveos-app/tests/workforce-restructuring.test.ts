import test from "node:test";
import assert from "node:assert/strict";
import { runConversationRuntime } from "../lib/conversation-runtime.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const cognitiveCase: CognitiveCase = {
  id: "workforce",
  title: "Restructuration",
  objective: "Prendre une décision responsable",
  workingHypothesis: "",
  context: "Contexte incomplet",
  state: "explore",
  signals: {
    impact: 10,
    urgency: 8,
    confidence: 55,
    cognitiveCost: 9,
    risk: 9
  }
};

const phrases = [
  "Dois-je faire un plan social ?",
  "Faut-il lancer un PSE ?",
  "Devons-nous procéder à un licenciement économique ?",
  "Dois-je envisager des suppressions de postes ?",
  "Faut-il engager une réduction d’effectifs ?",
  "Est-ce qu'on devrait lancer une restructuration ?"
];

for (const message of phrases) {
  test(`detects protected workforce decision: ${message}`, () => {
    const result = runConversationRuntime(message, cognitiveCase);
    const frame = result.decisionFrame;
    assert.equal(frame?.category, "workforce_restructuring");
    assert.equal(frame?.requiresContext, true);
    assert.deepEqual(frame?.classifications, ["high-impact", "regulated", "human-sensitive"]);
    assert.deepEqual(frame?.requiredAgents, ["CFO", "DRH", "Legal", "Operations", "SENECA"]);
    assert.equal(frame?.recommendation, null);
    assert.equal(frame?.confidence, null);
    assert.ok(frame?.options.every((option) => option.score === null));
    assert.doesNotMatch(result.response, /tester à petite échelle/i);
    assert.doesNotMatch(result.response, /\/100/);
    assert.match(result.response, /contexte disponible est insuffisant/i);
    assert.match(result.response, /CFO, DRH, Legal, Operations, SENECA/);
  });
}

test("does not issue a recommendation before context is collected", () => {
  const result = runConversationRuntime("J’ai un problème : dois-je faire un plan social ou non ?", cognitiveCase);
  assert.equal(result.decisionFrame?.recommendation, null);
  assert.match(result.nextAction, /Documenter les informations bloquantes/);
  assert.doesNotMatch(result.response, /Recommandation :/);
});
