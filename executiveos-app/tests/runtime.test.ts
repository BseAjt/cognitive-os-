import test from "node:test";
import assert from "node:assert/strict";
import { runConversationRuntime } from "../lib/conversation-runtime.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const cognitiveCase: CognitiveCase = {
  id: "1",
  title: "Test",
  objective: "Décider",
  workingHypothesis: "",
  context: "Contexte précédent",
  state: "explore",
  signals: {
    impact: 7,
    urgency: 5,
    confidence: 70,
    cognitiveCost: 5,
    risk: 4
  }
};

const decisionPhrases = [
  "Dois-je recruter un directeur commercial maintenant ?",
  "Devrais-je investir dans cette société ?",
  "Faut-il lancer le produit en septembre ?",
  "Est-ce que je dois augmenter nos prix ?",
  "Est-ce une bonne idée de signer ce partenariat ?",
  "Vaut-il mieux construire ou acheter ?",
  "Que choisir entre A et B ?",
  "Quel choix faire pour notre ERP ?",
  "Je dois décider si nous fermons ce bureau",
  "Should we hire a CFO now?"
];

for (const message of decisionPhrases) {
  test(`decision: ${message}`, () => {
    const result = runConversationRuntime(message, cognitiveCase);
    assert.equal(result.intent, "decision");
    assert.ok(result.decisionFrame);
    assert.equal(result.extractions[0].kind, "decision");
    assert.equal(result.casePatch.state, "decide");
    assert.ok(result.response.includes("Options comparées"));
    assert.equal(result.decisionFrame.options.length, 3);
  });
}

const intentCases: Array<[string, string]> = [
  ["J'ai une idée : créer une offre premium", "idea"],
  ["J’ai un problème de trésorerie", "problem"],
  ["Compte rendu de réunion : nous devons appeler le client", "meeting"],
  ["Reprendre là où j'en étais", "continue"],
  ["Le marché progresse de 10%", "general"]
];

for (const [message, intent] of intentCases) {
  test(`intent ${intent}`, () => {
    assert.equal(runConversationRuntime(message, cognitiveCase).intent, intent);
  });
}

test("risk raises risk", () => {
  const result = runConversationRuntime("Le risque de churn est élevé", cognitiveCase);
  assert.equal(result.extractions[0].kind, "risk");
  assert.equal(result.casePatch.signals?.risk, 6);
});

test("hypothesis lowers confidence", () => {
  const result = runConversationRuntime("Je pense que le marché est prêt", cognitiveCase);
  assert.equal(result.extractions[0].kind, "hypothesis");
  assert.equal(result.casePatch.signals?.confidence, 62);
});

test("action changes state", () => {
  const result = runConversationRuntime("Il faut appeler cinq clients avant vendredi", cognitiveCase);
  assert.equal(result.extractions[0].kind, "action");
  assert.equal(result.casePatch.state, "execute");
});

test("ordinary question remains a question", () => {
  const result = runConversationRuntime("Quel est notre taux de conversion ?", cognitiveCase);
  assert.equal(result.intent, "general");
  assert.equal(result.extractions[0].kind, "question");
});

test("empty input is safe", () => {
  const result = runConversationRuntime("   ", cognitiveCase);
  assert.equal(result.extractions.length, 0);
  assert.deepEqual(result.casePatch, {});
});

test("multi-sentence input extracts multiple cognitive kinds", () => {
  const result = runConversationRuntime(
    "Je pense que le marché est prêt. Le risque est le churn. Il faut tester avec 5 clients.",
    cognitiveCase
  );
  assert.deepEqual(result.extractions.map((item) => item.kind), ["hypothesis", "risk", "action"]);
});

test("hiring frame is specialized", () => {
  assert.equal(runConversationRuntime("Dois-je recruter un CTO ?", cognitiveCase).decisionFrame?.category, "hiring");
});

test("investment frame is specialized", () => {
  assert.equal(runConversationRuntime("Devrais-je investir 100k€ ?", cognitiveCase).decisionFrame?.category, "investment");
});

test("launch frame is specialized", () => {
  assert.equal(runConversationRuntime("Faut-il lancer une nouvelle offre ?", cognitiveCase).decisionFrame?.category, "launch");
});

test("pricing frame is specialized", () => {
  assert.equal(runConversationRuntime("Dois-je augmenter le prix ?", cognitiveCase).decisionFrame?.category, "pricing");
});

test("partnership frame is specialized", () => {
  assert.equal(runConversationRuntime("Faut-il signer ce partenariat ?", cognitiveCase).decisionFrame?.category, "partnership");
});
