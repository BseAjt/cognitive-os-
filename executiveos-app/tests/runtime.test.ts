import test from "node:test";
import assert from "node:assert/strict";
import { runConversationRuntime } from "../lib/conversation-runtime.ts";
import type { Challenge } from "../types/domain.ts";

const challenge: Challenge = {
  id: "1",
  title: "Test",
  goal: "Décider",
  hypothesis: "",
  impact: 7,
  urgency: 5,
  confidence: 70,
  cognitiveCost: 5,
  risk: 4,
  context: "Contexte précédent",
  state: "explore"
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
    const result = runConversationRuntime(message, challenge);
    assert.equal(result.intent, "decision");
    assert.ok(result.decisionFrame);
    assert.equal(result.extractions[0].kind, "decision");
    assert.equal(result.challengePatch.state, "decide");
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
    assert.equal(runConversationRuntime(message, challenge).intent, intent);
  });
}

test("risk raises risk", () => {
  const result = runConversationRuntime("Le risque de churn est élevé", challenge);
  assert.equal(result.extractions[0].kind, "risk");
  assert.equal(result.challengePatch.risk, 6);
});

test("hypothesis lowers confidence", () => {
  const result = runConversationRuntime("Je pense que le marché est prêt", challenge);
  assert.equal(result.extractions[0].kind, "hypothesis");
  assert.equal(result.challengePatch.confidence, 62);
});

test("action changes state", () => {
  const result = runConversationRuntime("Il faut appeler cinq clients avant vendredi", challenge);
  assert.equal(result.extractions[0].kind, "action");
  assert.equal(result.challengePatch.state, "execute");
});

test("ordinary question remains a question", () => {
  const result = runConversationRuntime("Quel est notre taux de conversion ?", challenge);
  assert.equal(result.intent, "general");
  assert.equal(result.extractions[0].kind, "question");
});

test("empty input is safe", () => {
  const result = runConversationRuntime("   ", challenge);
  assert.equal(result.extractions.length, 0);
  assert.deepEqual(result.challengePatch, {});
});

test("multi-sentence input extracts multiple cognitive kinds", () => {
  const result = runConversationRuntime(
    "Je pense que le marché est prêt. Le risque est le churn. Il faut tester avec 5 clients.",
    challenge
  );
  assert.deepEqual(result.extractions.map((item) => item.kind), ["hypothesis", "risk", "action"]);
});

test("hiring frame is specialized", () => {
  assert.equal(runConversationRuntime("Dois-je recruter un CTO ?", challenge).decisionFrame?.category, "hiring");
});

test("investment frame is specialized", () => {
  assert.equal(runConversationRuntime("Devrais-je investir 100k€ ?", challenge).decisionFrame?.category, "investment");
});

test("launch frame is specialized", () => {
  assert.equal(runConversationRuntime("Faut-il lancer une nouvelle offre ?", challenge).decisionFrame?.category, "launch");
});

test("pricing frame is specialized", () => {
  assert.equal(runConversationRuntime("Dois-je augmenter le prix ?", challenge).decisionFrame?.category, "pricing");
});

test("partnership frame is specialized", () => {
  assert.equal(runConversationRuntime("Faut-il signer ce partenariat ?", challenge).decisionFrame?.category, "partnership");
});
