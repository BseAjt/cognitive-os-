import test from "node:test";
import assert from "node:assert/strict";
import type { CognitiveCase, ContextEvidenceRecord, ContextSourceRecord } from "../domain/canonical.ts";
import {
  DEFAULT_ORION_MODEL,
  createOrionGenerationRunner,
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
  debates: [
    { criticId: "athena", targetId: "turing", objection: "Le chemin technique proposé retarde-t-il inutilement la preuve de valeur stratégique ?", objectionCitations: ["S1"], response: "L'instrumentation minimale protège la preuve de valeur sans retarder le pilote.", responseCitations: ["S1"], resolution: "resolved", unresolvedPoint: null },
    { criticId: "turing", targetId: "seneca", objection: "Le seuil de réversibilité est-il suffisamment observable pour être automatisé ?", objectionCitations: ["S1"], response: "Le seuil doit devenir un critère mesuré avant que le risque soit considéré comme levé.", responseCitations: ["S1"], resolution: "partial", unresolvedPoint: "La valeur exacte du seuil reste à mesurer." },
    { criticId: "seneca", targetId: "athena", objection: "La représentativité du pilote suffit-elle à justifier un engagement plus large ?", objectionCitations: ["S1"], response: "Non, l'extension restera conditionnée à la mesure des usages et du délai réellement gagné.", responseCitations: ["S1"], resolution: "unresolved", unresolvedPoint: "La représentativité des utilisateurs n'est pas démontrée." }
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

test("C1.2 runs ATHENA, TURING and SENECA independently before ORION synthesis", async () => {
  const started: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let calls = 0;
  const runner = createOrionGenerationRunner(DEFAULT_ORION_MODEL, {
    async analyze(agentId) {
      started.push(agentId);
      calls += 1;
      if (calls === 3) release();
      await gate;
      return output.contributions.find((item) => item.agentId === agentId)!;
    },
    async challenge(agentId, _input, target) {
      const debate = output.debates.find((item) => item.criticId === agentId && item.targetId === target.agentId)!;
      return { objection: debate.objection, citations: debate.objectionCitations };
    },
    async respond(agentId, _input, objection) {
      const debate = output.debates.find((item) => item.targetId === agentId && item.criticId === objection.criticId)!;
      return { response: debate.response, citations: debate.responseCitations, resolution: debate.resolution, unresolvedPoint: debate.unresolvedPoint };
    },
    async synthesize(input, contributions, debates) {
      assert.equal(input.objective, "Arbitrer le pilote");
      assert.deepEqual(contributions.map((item) => item.agentId), ["athena", "turing", "seneca"]);
      assert.deepEqual(debates, output.debates);
      return {
        synthesis: output.synthesis,
        recommendation: output.recommendation,
        assumptions: output.assumptions,
        missingEvidence: output.missingEvidence,
        confidence: output.confidence
      };
    }
  });

  assert.deepEqual(await runner.generate({ objective: "Arbitrer le pilote", cognitiveCase, sources, evidence }), output);
  assert.deepEqual(started.sort(), ["athena", "seneca", "turing"]);
});

test("C1.3 makes every specialist challenge and answer another specialist before synthesis", async () => {
  const events: string[] = [];
  const runner = createOrionGenerationRunner(DEFAULT_ORION_MODEL, {
    async analyze(agentId) {
      events.push(`analysis:${agentId}`);
      return output.contributions.find((item) => item.agentId === agentId)!;
    },
    async challenge(agentId, _input, target) {
      assert.equal(events.filter((event) => event.startsWith("analysis:")).length, 3);
      events.push(`challenge:${agentId}->${target.agentId}`);
      const debate = output.debates.find((item) => item.criticId === agentId)!;
      return { objection: debate.objection, citations: debate.objectionCitations };
    },
    async respond(agentId, _input, objection) {
      assert.equal(events.filter((event) => event.startsWith("challenge:")).length, 3);
      events.push(`response:${agentId}<-${objection.criticId}`);
      const debate = output.debates.find((item) => item.targetId === agentId)!;
      return { response: debate.response, citations: debate.responseCitations, resolution: debate.resolution, unresolvedPoint: debate.unresolvedPoint };
    },
    async synthesize(_input, specialistContributions, debates) {
      assert.equal(specialistContributions.length, 3);
      assert.equal(events.filter((event) => event.startsWith("response:")).length, 3);
      assert.deepEqual(debates.map(({ criticId, targetId }) => `${criticId}->${targetId}`), ["athena->turing", "turing->seneca", "seneca->athena"]);
      events.push("synthesis:orion");
      const { contributions: omittedContributions, debates: omittedDebates, ...synthesis } = output;
      assert.equal(omittedContributions.length, 3);
      assert.equal(omittedDebates.length, 3);
      return synthesis;
    }
  });

  assert.deepEqual(await runner.generate({ objective: "Arbitrer le pilote", cognitiveCase, sources, evidence }), output);
  assert.equal(events.at(-1), "synthesis:orion");
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
