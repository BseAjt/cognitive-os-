import test from "node:test";
import assert from "node:assert/strict";
import type { CognitiveCase, ContextEvidenceRecord, ContextSourceRecord } from "../domain/canonical.ts";
import {
  DEFAULT_ORION_MODEL,
  createOrionGenerationRunner,
  generateOrionContinuityCycle,
  generateOrionCycle,
  isOrionAIRuntimeConfigured,
  OrionAIRuntimeUnavailableError,
  probeOrionAIRuntime,
  type OrionGeneratedCycle
} from "../lib/orion-ai-runtime.ts";

test("ORION defaults to the free-tier compatible GPT-5 Mini gateway model", () => {
  assert.equal(DEFAULT_ORION_MODEL, "openai/gpt-5-mini");
});

const cognitiveCase: CognitiveCase = {
  id: "case-c1",
  title: "Lancement ExecutiveOS",
  objective: "Valider un positionnement investisseur",
  workingHypothesis: "La mémoire décisionnelle réduit le temps perdu",
  context: "Un pilote doit être présenté au COMEX.",
  state: "decide",
  signals: { impact: 9, urgency: 7, confidence: 68, cognitiveCost: 6, risk: 5 }
};
const sources: ContextSourceRecord[] = [{ id: "src-1", caseId: cognitiveCase.id, type: "note", title: "Pilote", origin: "COMEX", status: "ready", rawContent: "Le pilote réduit le délai.", summary: "Gain de temps observé.", wordCount: 5, createdAt: "2026-08-09T08:00:00.000Z" }];
const evidence: ContextEvidenceRecord[] = [{ id: "ev-1", caseId: cognitiveCase.id, sourceId: "src-1", claim: "Le délai diminue.", excerpt: "réduit le délai", confidence: 88, position: 0, createdAt: "2026-08-09T08:00:00.000Z" }];
const output: OrionGeneratedCycle = {
  synthesis: "Les trois perspectives convergent vers un pilote mesuré et réversible.",
  recommendation: "Lancer un pilote de quatre semaines avec un critère d'arrêt explicite.",
  contributions: [
    { agentId: "athena", position: "support", analysis: "Le pilote soutient directement la preuve de valeur recherchée.", confidence: 82, citations: ["S1"] },
    { agentId: "turing", position: "conditional", analysis: "Instrumenter le délai et la qualité avant le démarrage du pilote.", confidence: 78, citations: ["S1"] },
    { agentId: "seneca", position: "challenge", analysis: "Définir un seuil d'échec évite de transformer le pilote en engagement implicite.", confidence: 76, citations: ["S1"] }
  ],
  debates: [
    { criticId: "athena", targetId: "turing", objection: "Le chemin technique proposé retarde-t-il inutilement la preuve de valeur stratégique ?", objectionCitations: ["S1"], response: "L'instrumentation minimale protège la preuve de valeur sans retarder le pilote.", responseCitations: ["S1"], resolution: "resolved", unresolvedPoint: null },
    { criticId: "turing", targetId: "seneca", objection: "Le seuil de réversibilité est-il suffisamment observable pour être automatisé ?", objectionCitations: ["S1"], response: "Le seuil doit devenir un critère mesuré avant que le risque soit considéré comme levé.", responseCitations: ["S1"], resolution: "partial", unresolvedPoint: "La valeur exacte du seuil reste à mesurer." },
    { criticId: "seneca", targetId: "athena", objection: "La représentativité du pilote suffit-elle à justifier un engagement plus large ?", objectionCitations: ["S1"], response: "Non, l'extension restera conditionnée à la mesure des usages et du délai réellement gagné.", responseCitations: ["S1"], resolution: "unresolved", unresolvedPoint: "La représentativité des utilisateurs n'est pas démontrée." }
  ],
  assumptions: ["Les utilisateurs du pilote sont représentatifs."],
  missingEvidence: ["Mesurer le temps de reprise avant et après ExecutiveOS."],
  confidence: 79,
  decisionMemo: {
    status: "conditional",
    rationale: [{
      claim: "Le pilote mesuré constitue l'option la plus réversible pour établir la preuve de valeur.",
      citations: ["S1"],
      agentIds: ["athena", "turing", "seneca"]
    }],
    conditions: ["Mesurer le délai de reprise et fixer un seuil d'arrêt avant le lancement."],
    confidenceExplanation: "La preuve existante soutient le pilote, mais la représentativité et le seuil d'arrêt restent à établir."
  }
};

test("C1.1 detects AI Gateway and Vercel OIDC configuration", () => {
  assert.equal(isOrionAIRuntimeConfigured({ AI_GATEWAY_API_KEY: "key" }), true);
  assert.equal(isOrionAIRuntimeConfigured({ VERCEL_OIDC_TOKEN: "token" }), true);
  assert.equal(isOrionAIRuntimeConfigured({ VERCEL: "1" }), true);
  assert.equal(isOrionAIRuntimeConfigured({}), false);
});

test("C1.1 probes request-context OIDC instead of relying on an environment variable", async () => {
  let probes = 0;
  assert.equal(await probeOrionAIRuntime({ env: { VERCEL: "1" }, probe: async () => { probes += 1; } }), true);
  assert.equal(probes, 1);
  assert.equal(await probeOrionAIRuntime({ env: {}, probe: async () => { throw new Error("must not run"); } }), false);
  assert.equal(await probeOrionAIRuntime({ env: { VERCEL: "1" }, probe: async () => { throw new Error("unauthorized"); } }), false);
});

test("C1.1 generates a typed and observable ORION result through an injected runner", async () => {
  const dates = [new Date("2026-08-09T09:00:00.000Z"), new Date("2026-08-09T09:00:01.250Z")];
  const result = await generateOrionCycle(
    { objective: "  Arbitrer le pilote  ", cognitiveCase, sources, evidence },
    { runner: { generate: async (input) => { assert.equal(input.objective, "Arbitrer le pilote"); return output; } }, now: () => dates.shift()!, model: DEFAULT_ORION_MODEL }
  );
  assert.deepEqual(result.output, output);
  assert.equal(result.runtime, "ai_gateway");
  assert.equal(result.model, DEFAULT_ORION_MODEL);
  assert.equal(result.durationMs, 1250);
  assert.deepEqual(result.trace.stages.map((item) => item.stage), ["analysis", "challenge", "response", "synthesis"]);
  assert.deepEqual(result.trace.evidenceManifest, [{ citation: "S1", evidenceId: "ev-1", sourceId: "src-1", sourceTitle: "Pilote", confidence: 88 }]);
  assert.match(result.trace.cycleId, /^[0-9a-f-]{36}$/i);
});

test("C1.1 refuses a silent deterministic fallback when AI is not configured", async () => {
  await assert.rejects(
    generateOrionCycle({ objective: "Arbitrer", cognitiveCase, sources, evidence }, { env: {} }),
    OrionAIRuntimeUnavailableError
  );
});

test("C1.1 validates the model output contract", async () => {
  await assert.rejects(
    generateOrionCycle(
      { objective: "Arbitrer", cognitiveCase, sources, evidence },
      { runner: { generate: async () => ({ ...output, confidence: 140 }) as OrionGeneratedCycle } }
    ),
    /Too big|less than or equal to 100/i
  );
});

test("C1.2 condenses the complete ATHENA, TURING, SENECA and ORION council into one generation", async () => {
  let calls = 0;
  const runner = createOrionGenerationRunner(DEFAULT_ORION_MODEL, { async generate(input) { calls += 1; assert.equal(input.objective, "Arbitrer le pilote"); return output; } });
  const generated = await runner.generate({ objective: "Arbitrer le pilote", cognitiveCase, sources, evidence });
  assert.equal(calls, 1);
  assert.deepEqual(generated.contributions.map((item) => item.agentId), ["athena", "turing", "seneca"]);
  assert.deepEqual(generated.debates.map(({ criticId, targetId }) => `${criticId}->${targetId}`), ["athena->turing", "turing->seneca", "seneca->athena"]);
});

test("C1.3 continuity mode produces a complete actionable cycle when the gateway is rate limited", () => {
  const result = generateOrionContinuityCycle({ objective: "Arbitrer le pilote", cognitiveCase, sources, evidence }, "rate_limited", { now: () => new Date("2026-08-10T15:00:00.000Z") });
  assert.equal(result.runtime, "continuity_fallback");
  assert.equal(result.degraded?.reason, "rate_limited");
  assert.equal(result.output.contributions.length, 3);
  assert.equal(result.output.debates.length, 3);
  assert.equal(result.output.decisionMemo.status, "conditional");
  assert.ok(result.output.recommendation);
});

test("C1.3 rejects debate citations that do not exist in the dossier", async () => {
  await assert.rejects(
    generateOrionCycle(
      { objective: "Arbitrer", cognitiveCase, sources, evidence },
      { runner: { generate: async () => ({
        ...output,
        debates: output.debates.map((item, index) => index === 0 ? { ...item, objectionCitations: ["S99"] } : item)
      }) } }
    ),
    /Citation ORION invalide : S99/
  );
});

test("C1.4 produces a sourced decision memo and rejects an unauditable rationale", async () => {
  const result = await generateOrionCycle(
    { objective: "Arbitrer", cognitiveCase, sources, evidence },
    { runner: { generate: async () => output } }
  );
  assert.equal(result.output.decisionMemo.status, "conditional");
  assert.deepEqual(result.output.decisionMemo.rationale[0]?.agentIds, ["athena", "turing", "seneca"]);
  await assert.rejects(
    generateOrionCycle(
      { objective: "Arbitrer", cognitiveCase, sources, evidence },
      { runner: { generate: async () => ({
        ...output,
        decisionMemo: { ...output.decisionMemo, rationale: [{ ...output.decisionMemo.rationale[0]!, citations: [] }] }
      }) } }
    ),
    /exige une preuve citée/i
  );
  await assert.rejects(
    generateOrionCycle(
      { objective: "Arbitrer", cognitiveCase, sources, evidence },
      { runner: { generate: async () => ({
        ...output,
        decisionMemo: { ...output.decisionMemo, rationale: [{ ...output.decisionMemo.rationale[0]!, citations: ["S42"] }] }
      }) } }
    ),
    /Citation ORION invalide : S42/
  );
});

test("C1.4 allows ORION to hold a decision honestly when the dossier has no evidence", async () => {
  const heldOutput: OrionGeneratedCycle = {
    ...output,
    recommendation: null,
    confidence: 20,
    contributions: output.contributions.map((item) => ({ ...item, citations: [] })),
    debates: output.debates.map((item) => ({ ...item, objectionCitations: [], responseCitations: [] })),
    decisionMemo: {
      status: "hold",
      rationale: [{ claim: "Aucune preuve exploitable ne permet encore d'arbitrer le lancement du pilote.", citations: [], agentIds: ["seneca"] }],
      conditions: ["Ajouter une mesure vérifiée du délai de reprise avant de relancer le cycle."],
      confidenceExplanation: "La confiance est faible car le dossier ne contient aucune preuve exploitable."
    }
  };
  const result = await generateOrionCycle(
    { objective: "Arbitrer", cognitiveCase, sources: [], evidence: [] },
    { runner: { generate: async () => heldOutput } }
  );
  assert.equal(result.output.decisionMemo.status, "hold");
  assert.deepEqual(result.trace.evidenceManifest, []);
});
