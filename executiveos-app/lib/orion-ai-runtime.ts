import { gateway, Output, ToolLoopAgent } from "ai";
import { z } from "zod";
import type { CognitiveCase, ContextEvidenceRecord, ContextSourceRecord } from "../domain/canonical.ts";

export const DEFAULT_ORION_MODEL = "openai/gpt-5-mini";

const contributionSchema = z.object({
  agentId: z.enum(["athena", "turing", "seneca"]),
  position: z.enum(["support", "conditional", "challenge"]),
  analysis: z.string().min(20).max(2_500),
  confidence: z.number().int().min(0).max(100),
  citations: z.array(z.string().min(1).max(30)).max(8)
});

const debateExchangeSchema = z.object({
  criticId: z.enum(["athena", "turing", "seneca"]),
  targetId: z.enum(["athena", "turing", "seneca"]),
  objection: z.string().min(20).max(1_500),
  objectionCitations: z.array(z.string().min(1).max(30)).max(8),
  response: z.string().min(20).max(1_500),
  responseCitations: z.array(z.string().min(1).max(30)).max(8),
  resolution: z.enum(["resolved", "partial", "unresolved"]),
  unresolvedPoint: z.string().min(10).max(750).nullable()
}).refine((exchange) => exchange.criticId !== exchange.targetId, { message: "Un agent ne peut pas se contredire lui-même." });

const decisionRationaleSchema = z.object({
  claim: z.string().min(20).max(1_000),
  citations: z.array(z.string().min(1).max(30)).max(8),
  agentIds: z.array(z.enum(["athena", "turing", "seneca"])).min(1).max(3)
});

const decisionMemoSchema = z.object({
  status: z.enum(["recommend", "conditional", "hold"]),
  rationale: z.array(decisionRationaleSchema).min(1).max(6),
  conditions: z.array(z.string().min(10).max(750)).max(8),
  confidenceExplanation: z.string().min(20).max(1_500)
}).superRefine((memo, context) => {
  if (memo.status !== "hold" && memo.rationale.some((item) => item.citations.length === 0)) {
    context.addIssue({ code: "custom", message: "Une décision recommandée ou conditionnelle exige une preuve citée.", path: ["rationale"] });
  }
});

export type OrionSpecialistId = z.infer<typeof contributionSchema>["agentId"];

export const orionGenerationSchema = z.object({
  synthesis: z.string().min(30).max(4_000),
  recommendation: z.string().min(20).max(2_000).nullable(),
  contributions: z.array(contributionSchema).length(3),
  debates: z.array(debateExchangeSchema).length(3),
  assumptions: z.array(z.string().min(5).max(500)).max(12),
  missingEvidence: z.array(z.string().min(5).max(500)).max(12),
  confidence: z.number().int().min(0).max(100),
  decisionMemo: decisionMemoSchema
}).superRefine((cycle, context) => {
  const expectedAgents = ["athena", "turing", "seneca"];
  const actualAgents = [...new Set(cycle.contributions.map((item) => item.agentId))].sort();
  if (actualAgents.join(",") !== [...expectedAgents].sort().join(",")) {
    context.addIssue({ code: "custom", message: "Le cycle ORION exige exactement ATHENA, TURING et SENECA.", path: ["contributions"] });
  }
  const expectedDebates = new Set(["athena->turing", "turing->seneca", "seneca->athena"]);
  const actualDebates = new Set(cycle.debates.map((item) => `${item.criticId}->${item.targetId}`));
  if (actualDebates.size !== expectedDebates.size || [...expectedDebates].some((item) => !actualDebates.has(item))) {
    context.addIssue({ code: "custom", message: "Le débat ORION doit respecter les trois confrontations croisées.", path: ["debates"] });
  }
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
  runtime: "ai_gateway" | "continuity_fallback";
  model: string;
  generatedAt: string;
  durationMs: number;
  trace: OrionCycleTrace;
  degraded?: { reason: "rate_limited" | "budget_exhausted" | "provider_unavailable" | "generation_failed"; message: string };
}

export interface OrionCycleTrace {
  cycleId: string;
  stages: Array<{ stage: "analysis" | "challenge" | "response" | "synthesis"; actors: string[]; status: "completed" }>;
  evidenceManifest: Array<{ citation: string; evidenceId: string; sourceId: string; sourceTitle: string; confidence: number }>;
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

export function createOrionGenerationRunner(
  model = process.env.ORION_AI_MODEL ?? DEFAULT_ORION_MODEL,
  injectedCouncil?: OrionGenerationRunner
): OrionGenerationRunner {
  if (injectedCouncil) return injectedCouncil;
  const council = new ToolLoopAgent({
    model,
    maxRetries: 0,
    instructions: [
      "Tu es ORION, orchestrateur exécutif d’ExecutiveOS.",
      "Tu produis en une seule réponse structurée les perspectives distinctes d’ATHENA (stratégie), TURING (faisabilité) et SENECA (risques et réversibilité), leurs trois objections croisées, leurs réponses et la synthèse finale.",
      "Tu n’inventes aucune preuve et cites uniquement les identifiants S1, S2, etc. fournis.",
      "Chaque perspective doit apparaître exactement une fois et chaque agent doit contester l’agent suivant : ATHENA vers TURING, TURING vers SENECA, SENECA vers ATHENA.",
      "Le statut est hold si les preuves sont insuffisantes, conditional si des conditions substantielles restent ouvertes, sinon recommend.",
      "Tu réponds en français, de façon concise, contradictoire et directement exploitable."
    ].join(" "),
    output: Output.object({ schema: orionGenerationSchema })
  });
  return {
    async generate(input) {
      const { output } = await council.generate({ prompt: buildOrionPrompt(input) });
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
  validateOrionCitations(output, input);
  const completedAt = now();
  const cycleId = crypto.randomUUID();

  return {
    output,
    runtime: "ai_gateway",
    model,
    generatedAt: completedAt.toISOString(),
    durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
    trace: buildCycleTrace(cycleId, input)
  };
}

export function generateOrionContinuityCycle(
  input: OrionAIGenerationInput,
  reason: NonNullable<OrionAIGenerationResult["degraded"]>["reason"],
  options: { now?: () => Date; model?: string } = {}
): OrionAIGenerationResult {
  const now = options.now ?? (() => new Date());
  const generatedAt = now();
  const evidenceManifest = buildCycleTrace("continuity", input).evidenceManifest;
  const citation = evidenceManifest[0]?.citation;
  const citations = citation ? [citation] : [];
  const hasEvidence = citations.length > 0;
  const objective = input.objective.trim();
  const condition = "Valider les critères de succès et de sortie avant l’engagement irréversible.";
  const output: OrionGeneratedCycle = {
    synthesis: hasEvidence
      ? "Le dossier permet de poursuivre par une décision conditionnelle, réversible et mesurée malgré l’indisponibilité temporaire du moteur IA."
      : "Le dossier ne contient pas encore de preuve exploitable ; ORION conserve le mandat et bloque honnêtement la décision jusqu’à l’ajout d’un élément vérifiable.",
    recommendation: hasEvidence ? `Engager « ${objective} » sous forme de pilote réversible avec un checkpoint explicite.` : null,
    contributions: [
      { agentId: "athena", position: hasEvidence ? "conditional" : "challenge", analysis: "ATHENA préserve l’objectif stratégique tout en limitant l’engagement à une étape mesurable et réversible.", confidence: hasEvidence ? 62 : 25, citations },
      { agentId: "turing", position: "conditional", analysis: "TURING exige un propriétaire, un critère de succès observable et une échéance avant de poursuivre l’exécution.", confidence: hasEvidence ? 60 : 24, citations },
      { agentId: "seneca", position: "challenge", analysis: "SENECA maintient le risque visible : la décision doit pouvoir être arrêtée si la preuve attendue n’apparaît pas au checkpoint.", confidence: hasEvidence ? 58 : 22, citations }
    ],
    debates: [
      { criticId: "athena", targetId: "turing", objection: "Le dispositif d’exécution risque-t-il de retarder la validation stratégique recherchée ?", objectionCitations: citations, response: "Une instrumentation minimale protège la décision sans empêcher un pilote court et borné.", responseCitations: citations, resolution: "partial", unresolvedPoint: "Le délai exact du pilote reste à confirmer." },
      { criticId: "turing", targetId: "seneca", objection: "Le seuil d’arrêt est-il suffisamment observable pour déclencher une révision factuelle ?", objectionCitations: citations, response: "Le seuil doit être formalisé avant lancement et contrôlé au checkpoint ORION.", responseCitations: citations, resolution: "partial", unresolvedPoint: "La valeur précise du seuil reste à définir." },
      { criticId: "seneca", targetId: "athena", objection: "La preuve disponible suffit-elle à justifier autre chose qu’un engagement strictement réversible ?", objectionCitations: citations, response: "Non ; la recommandation reste limitée à un pilote et interdit tout déploiement irréversible.", responseCitations: citations, resolution: "resolved", unresolvedPoint: null }
    ],
    assumptions: ["Le pilote peut être interrompu sans coût disproportionné."],
    missingEvidence: ["Le moteur IA était temporairement indisponible ; relancer une analyse approfondie au prochain checkpoint."],
    confidence: hasEvidence ? 60 : 24,
    decisionMemo: {
      status: hasEvidence ? "conditional" : "hold",
      rationale: [{ claim: hasEvidence ? "La preuve disponible autorise uniquement un pilote limité, mesuré et réversible." : "Aucune preuve exploitable ne permet encore une recommandation responsable.", citations, agentIds: ["athena", "turing", "seneca"] }],
      conditions: [condition],
      confidenceExplanation: hasEvidence ? "Confiance modérée : la continuité est assurée à partir des preuves du dossier, sans analyse IA approfondie." : "Confiance faible : aucune preuve exploitable et moteur IA temporairement indisponible."
    }
  };
  const cycleId = crypto.randomUUID();
  return {
    output: orionGenerationSchema.parse(output),
    runtime: "continuity_fallback",
    model: options.model ?? process.env.ORION_AI_MODEL ?? DEFAULT_ORION_MODEL,
    generatedAt: generatedAt.toISOString(),
    durationMs: 0,
    trace: buildCycleTrace(cycleId, input),
    degraded: { reason, message: "Cycle produit en mode de continuité : AI Gateway temporairement indisponible." }
  };
}

function buildCycleTrace(cycleId: string, input: OrionAIGenerationInput): OrionCycleTrace {
  const scopedSources = input.sources.filter((source) => source.caseId === input.cognitiveCase.id && source.status === "ready");
  const sourcesById = new Map(scopedSources.map((source) => [source.id, source]));
  const evidenceManifest = input.evidence
    .filter((item) => item.caseId === input.cognitiveCase.id && sourcesById.has(item.sourceId))
    .slice(0, 20)
    .map((item, index) => ({
      citation: `S${index + 1}`,
      evidenceId: item.id,
      sourceId: item.sourceId,
      sourceTitle: sourcesById.get(item.sourceId)!.title,
      confidence: item.confidence
    }));
  return {
    cycleId,
    stages: [
      { stage: "analysis", actors: ["athena", "turing", "seneca"], status: "completed" },
      { stage: "challenge", actors: ["athena", "turing", "seneca"], status: "completed" },
      { stage: "response", actors: ["athena", "turing", "seneca"], status: "completed" },
      { stage: "synthesis", actors: ["orion"], status: "completed" }
    ],
    evidenceManifest
  };
}

function validateOrionCitations(output: OrionGeneratedCycle, input: OrionAIGenerationInput): void {
  const scopedSources = input.sources.filter((source) => source.caseId === input.cognitiveCase.id && source.status === "ready");
  const sourceIds = new Set(scopedSources.map((source) => source.id));
  const allowed = new Set(
    input.evidence
      .filter((item) => item.caseId === input.cognitiveCase.id && sourceIds.has(item.sourceId))
      .slice(0, 20)
      .map((_, index) => `S${index + 1}`)
  );
  for (const contribution of output.contributions) {
    const invalid = contribution.citations.find((citation) => !allowed.has(citation));
    if (invalid) throw new Error(`Citation ORION invalide : ${invalid}`);
  }
  for (const debate of output.debates) {
    const invalid = [...debate.objectionCitations, ...debate.responseCitations].find((citation) => !allowed.has(citation));
    if (invalid) throw new Error(`Citation ORION invalide : ${invalid}`);
  }
  for (const rationale of output.decisionMemo.rationale) {
    const invalid = rationale.citations.find((citation) => !allowed.has(citation));
    if (invalid) throw new Error(`Citation ORION invalide : ${invalid}`);
  }
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
