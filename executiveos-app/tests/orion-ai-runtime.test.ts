import test from "node:test";
import assert from "node:assert/strict";
import type { CognitiveCase, ContextEvidenceRecord, ContextSourceRecord } from "../domain/canonical.ts";
import {
  DEFAULT_ORION_MODEL,
  generateOrionCycle,
  isOrionAIRuntimeConfigured,
  OrionAIRuntimeUnavailableError,
  probeOrionAIRuntime,
  type OrionGeneratedCycle
} from "../lib/orion-ai-runtime.ts";

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
  assumptions: ["Les utilisateurs du pilote sont représentatifs."],
  missingEvidence: ["Mesurer le temps de reprise avant et après ExecutiveOS."],
  confidence: 79
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
