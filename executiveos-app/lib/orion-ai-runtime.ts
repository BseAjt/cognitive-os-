import { gateway, Output, ToolLoopAgent } from "ai";
import { z } from "zod";
import type { CognitiveCase, ContextEvidenceRecord, ContextSourceRecord } from "../domain/canonical.ts";

export const DEFAULT_ORION_MODEL = "openai/gpt-5.6-sol";

const contributionSchema = z.object({
  agentId: z.enum(["athena", "turing", "seneca"]),
  position: z.enum(["support", "conditional", "challenge"]),
  analysis: z.string().min(20).max(2_500),
  confidence: z.number().int().min(0).max(100),
  citations: z.array(z.string().min(1).max(30)).max(8)
});

export const orionGenerationSchema = z.object({
  synthesis: z.string().min(30).max(4_000),
  recommendation: z.string().min(20).max(2_000).nullable(),
  contributions: z.array(contributionSchema).min(1).max(3),
  assumptions: z.array(z.string().min(5).max(500)).max(12),
  missingEvidence: z.array(z.string().min(5).max(500)).max(12),
  confidence: z.number().int().min(0).max(100)
});

export type OrionGeneratedCycle = z.infer<typeof orionGenerationSchema>;

export interface OrionAIGenerationInput {
  objective: string;
  cognitiveCase: CognitiveCase;
  sources: ContextSourceRecord[];
  evidence: ContextEvidenceRecord[];
}

export interface OrionAIGenerationResult {
  output: OrionGeneratedCycle;
  runtime: "ai_gateway";
  model: string;
  generatedAt: string;
  durationMs: number;
}

export interface OrionGenerationRunner {
  generate(input: OrionAIGenerationInput): Promise<OrionGeneratedCycle>;
}

export class OrionAIRuntimeUnavailableError extends Error {
  constructor() {
    super("ORION AI Runtime indisponible : configurez AI_GATEWAY_API_KEY ou l'identité OIDC Vercel.");
    this.name = "OrionAIRuntimeUnavailableError";
  }
}

export function isOrionAIRuntimeConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  // On Vercel, OIDC is delivered in the request context (`x-vercel-oidc-token`)
  // and is resolved lazily by @vercel/oidc. It is therefore not guaranteed to
  // exist in process.env even though the Gateway is correctly configured.
  return Boolean(env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN || env.VERCEL);
}

export async function probeOrionAIRuntime(
  options: { env?: NodeJS.ProcessEnv; probe?: () => Promise<unknown> } = {}
): Promise<boolean> {
  if (!isOrionAIRuntimeConfigured(options.env)) return false;

  try {
    await (options.probe ?? (() => gateway.getAvailableModels()))();
    return true;
  } catch {
    return false;
  }
}

export function createOrionGenerationRunner(model = process.env.ORION_AI_MODEL ?? DEFAULT_ORION_MODEL): OrionGenerationRunner {
  const agent = new ToolLoopAgent({
    model,
    instructions: [
      "Tu es ORION, orchestrateur exécutif d'ExecutiveOS.",
      "Tu produis une analyse décisionnelle concise, contradictoire et exploitable en français.",
      "Tu n'inventes jamais de preuve : cite uniquement les identifiants fournis.",
      "ATHENA traite la stratégie, TURING la faisabilité et SENECA les risques.",
      "Une recommandation doit rester nulle lorsque les preuves sont insuffisantes.",
      "Toute incertitude devient une hypothèse ou une preuve manquante explicite."
    ].join(" "),
    output: Output.object({ schema: orionGenerationSchema })
  });

  return {
    async generate(input) {
      const { output } = await agent.generate({ prompt: buildOrionPrompt(input) });
      return output;
    }
  };
}

export async function generateOrionCycle(
  input: OrionAIGenerationInput,
  options: { runner?: OrionGenerationRunner; now?: () => Date; model?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<OrionAIGenerationResult> {
  const objective = input.objective.trim();
  if (!objective) throw new Error("Le mandat du cycle ORION est requis.");
  if (!options.runner && !isOrionAIRuntimeConfigured(options.env)) throw new OrionAIRuntimeUnavailableError();

  const now = options.now ?? (() => new Date());
  const startedAt = now();
  const model = options.model ?? process.env.ORION_AI_MODEL ?? DEFAULT_ORION_MODEL;
  const output = orionGenerationSchema.parse(await (options.runner ?? createOrionGenerationRunner(model)).generate({ ...input, objective }));
  const completedAt = now();

  return {
    output,
    runtime: "ai_gateway",
    model,
    generatedAt: completedAt.toISOString(),
    durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime())
  };
}

function buildOrionPrompt(input: OrionAIGenerationInput): string {
  const scopedSources = input.sources.filter((source) => source.caseId === input.cognitiveCase.id && source.status === "ready");
  const sourceIds = new Set(scopedSources.map((source) => source.id));
  const scopedEvidence = input.evidence.filter((evidence) => evidence.caseId === input.cognitiveCase.id && sourceIds.has(evidence.sourceId));
  const evidence = scopedEvidence.slice(0, 20).map((item, index) => ({
    citation: `S${index + 1}`,
    sourceId: item.sourceId,
    claim: item.claim,
    excerpt: item.excerpt,
    confidence: item.confidence
  }));

  return JSON.stringify({
    mandate: input.objective.trim(),
    dossier: {
      title: input.cognitiveCase.title,
      objective: input.cognitiveCase.objective,
      workingHypothesis: input.cognitiveCase.workingHypothesis,
      context: input.cognitiveCase.context,
      state: input.cognitiveCase.state,
      signals: input.cognitiveCase.signals
    },
    sources: scopedSources.slice(0, 12).map((source) => ({ id: source.id, title: source.title, origin: source.origin, summary: source.summary })),
    evidence,
    outputRules: {
      allowedCitations: evidence.map((item) => item.citation),
      recommendationRequiresEvidence: true,
      requiredPerspectives: ["athena", "turing", "seneca"]
    }
  });
}
