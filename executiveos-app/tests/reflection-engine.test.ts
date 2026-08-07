import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildReflection } from "../lib/reflection-engine.ts";
import type { CognitiveDiffResult } from "../lib/cognitive-diff-types.ts";
import type { LearningEventRecord } from "../domain/canonical.ts";

const diff: CognitiveDiffResult = {
  caseId: "reflection-case",
  changes: [
    { kind: "hypothesis_invalidated", subject: "Le marché est prêt", before: "Le marché est prêt", after: "invalidée", confidence: 90, evidence: ["Les tests clients contredisent l'hypothèse."] },
    { kind: "decision_changed", subject: "Décision", before: "Lancer maintenant", after: "Reporter le lancement", confidence: 82, evidence: ["Le risque commercial augmente."] },
    { kind: "risk_added", subject: "Churn pilote", after: "Churn pilote", confidence: 84, evidence: ["Nouveau risque détecté."] }
  ],
  hypothesisChanges: [{ kind: "hypothesis_invalidated", subject: "Le marché est prêt", before: "Le marché est prêt", after: "invalidée", confidence: 90, evidence: ["Les tests clients contredisent l'hypothèse."] }],
  confidenceChanges: [],
  decisionChanges: [{ kind: "decision_changed", subject: "Décision", before: "Lancer maintenant", after: "Reporter le lancement", confidence: 82, evidence: ["Le risque commercial augmente."] }],
  newRisks: [{ kind: "risk_added", subject: "Churn pilote", after: "Churn pilote", confidence: 84, evidence: ["Nouveau risque détecté."] }],
  resolvedRisks: [], contradictions: [], newKnowledge: [], recommendedReflection: "Réévaluer l'hypothèse et le calendrier de lancement.", significance: "high"
};
const learningEvents: LearningEventRecord[] = [
  { id: "l1", caseId: "reflection-case", type: "BeliefInvalidated", title: "Hypothèse invalidée", detail: "Le marché est prêt", significance: "high", confidence: 90, source: "cognitive_diff", createdAt: "2026-08-07T14:00:00.000Z" },
  { id: "l2", caseId: "reflection-case", type: "DecisionReversed", title: "Décision renversée", detail: "Avant: Lancer maintenant · Après: Reporter le lancement", significance: "high", confidence: 82, source: "cognitive_diff", createdAt: "2026-08-07T14:00:00.000Z" },
  { id: "l3", caseId: "reflection-case", type: "RiskDetected", title: "Nouveau risque", detail: "Churn pilote", significance: "high", confidence: 84, source: "cognitive_diff", createdAt: "2026-08-07T14:00:00.000Z" }
];

test("reflection engine converts learning evolution into structured reflection", () => {
  const result = buildReflection({ caseId: "reflection-case", diff, learningEvents, createdAt: "2026-08-07T14:00:00.000Z" });
  assert.equal(result.caseId, "reflection-case"); assert.equal(result.significance, "high");
  assert.ok(result.whatChanged.some((item) => item.includes("hypothesis_invalidated")));
  assert.ok(result.whyItChanged.some((item) => item.includes("tests clients")));
  assert.ok(result.learned.some((item) => item.includes("marché")));
  assert.ok(result.uncertainties.some((item) => item.includes("Churn")));
  assert.ok(result.decisionsToReconsider.some((item) => item.includes("Reporter")));
  assert.match(result.summary, /Révision à envisager/); assert.ok(result.confidence >= 80);
});

const here = dirname(fileURLToPath(import.meta.url)); const root = resolve(here, ".."); const source = (path:string)=>readFileSync(resolve(root,path),"utf8");
const types=source("store/types.ts"), slices=source("store/slices.ts"), commands=source("store/commands.ts"), recall=source("lib/cognitive-recall.ts"), graph=source("lib/knowledge-graph-runtime.ts"), store=source("store/executive-store.ts");
for (const [name,file,expected] of [
  ["state exposes reflection records",types,"reflections: ReflectionRecord[]"],
  ["reflection slice is seeded",slices,"reflections: initialReflections"],
  ["runtime builds reflection from cognitive diff",commands,"buildReflection"],
  ["runtime persists reflection atomically",commands,"reflections: reflection ? [reflection, ...state.reflections]"],
  ["runtime emits reflection event",commands,"ReflectionPersisted"],
  ["recall consumes reflections",recall,"lastReflection"],
  ["graph projects reflection insight",graph,"reflection:${reflection.id}"],
  ["persistence schema migrates demo state to v14",store,"version: 14"]
] as const) test(name,()=>assert.ok(file.includes(expected),`Missing reflection contract: ${expected}`));
