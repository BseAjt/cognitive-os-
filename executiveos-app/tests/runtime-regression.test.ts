import test from "node:test";
import assert from "node:assert/strict";
import { runConversationRuntime } from "../lib/conversation-runtime.ts";
import type { Challenge } from "../types/domain.ts";

const challenge: Challenge = {
  id: "regression",
  title: "Regression suite",
  goal: "Tester le runtime",
  hypothesis: "",
  impact: 7,
  urgency: 5,
  confidence: 70,
  cognitiveCost: 5,
  risk: 4,
  context: "Contexte précédent",
  state: "explore"
};

const indirectDecisionPhrases = [
  "Est-ce qu'on devrait ouvrir un bureau à Lyon ?",
  "Est-ce qu’on devrait changer de CRM ?",
  "Est-il pertinent de racheter ce concurrent ?",
  "Est-il préférable de garder ce client ?",
  "Je me demande si nous devons externaliser le support",
  "Quelle option devons-nous retenir ?",
  "Quel scénario choisir pour la migration ?",
  "Nous devons choisir entre construire et acheter",
  "Dois je recruter maintenant ?",
  "FAUT-IL AUGMENTER LES PRIX ?",
  "I need to decide whether we should expand to Germany",
  "Would it be better to hire or outsource?"
];

for (const message of indirectDecisionPhrases) {
  test(`indirect decision: ${message}`, () => {
    const result = runConversationRuntime(message, challenge);
    assert.equal(result.intent, "decision");
    assert.ok(result.decisionFrame);
    assert.ok(result.response.includes("Décision cadrée"));
  });
}

const nonDecisionQuestions = [
  "Quel est notre chiffre d'affaires ?",
  "Combien de clients avons-nous ?",
  "Quand commence la réunion ?",
  "Qui est responsable du projet ?",
  "Pourquoi le churn augmente-t-il ?",
  "Comment fonctionne notre CRM ?"
];

for (const message of nonDecisionQuestions) {
  test(`non decision question: ${message}`, () => {
    const result = runConversationRuntime(message, challenge);
    assert.notEqual(result.intent, "decision");
    assert.equal(result.extractions[0].kind, "question");
    assert.equal(result.decisionFrame, undefined);
  });
}

test("decision wording has precedence over idea wording", () => {
  const result = runConversationRuntime("Est-ce une bonne idée de signer ce partenariat ?", challenge);
  assert.equal(result.intent, "decision");
  assert.equal(result.decisionFrame?.category, "partnership");
});

test("meeting containing an explicit choice still frames the decision", () => {
  const result = runConversationRuntime("Réunion du COMEX : faut-il fermer le bureau de Lille ?", challenge);
  assert.equal(result.intent, "decision");
  assert.ok(result.decisionFrame);
});

test("line breaks produce stable extraction", () => {
  const result = runConversationRuntime("Je pense que le marché est prêt.\nLe risque est le budget.\nIl faut tester demain.", challenge);
  assert.ok(result.extractions.some((item) => item.kind === "hypothesis"));
  assert.ok(result.extractions.some((item) => item.kind === "risk"));
  assert.ok(result.extractions.some((item) => item.kind === "action"));
});

test("whitespace-only input is safe", () => {
  const result = runConversationRuntime("\n\t  ", challenge);
  assert.equal(result.intent, "general");
  assert.equal(result.extractions.length, 0);
  assert.deepEqual(result.challengePatch, {});
});

test("risk remains bounded at ten", () => {
  const highRisk = { ...challenge, risk: 10 };
  const result = runConversationRuntime("Le risque critique est majeur", highRisk);
  assert.equal(result.challengePatch.risk, 10);
});

test("urgency remains bounded at ten", () => {
  const urgent = { ...challenge, urgency: 10 };
  const result = runConversationRuntime("Il faut agir avant vendredi", urgent);
  assert.equal(result.challengePatch.urgency, 10);
});

test("confidence never drops below thirty-five", () => {
  const uncertain = { ...challenge, confidence: 35 };
  const result = runConversationRuntime("Je pense que cette hypothèse est probable", uncertain);
  assert.equal(result.challengePatch.confidence, 35);
});

test("generic decision always has three options and missing information", () => {
  const result = runConversationRuntime("Doit-on changer notre modèle opérationnel ?", challenge);
  assert.equal(result.decisionFrame?.options.length, 3);
  assert.ok((result.decisionFrame?.missingInformation.length ?? 0) >= 3);
  assert.ok(result.decisionFrame?.reviewTrigger);
});
