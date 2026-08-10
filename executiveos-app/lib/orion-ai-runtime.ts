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

const specialistOutputSchema = contributionSchema.omit({ agentId: true });

const objectionOutputSchema = z.object({
  objection: z.string().min(20).max(1_500),
  citations: z.array(z.string().min(1).max(30)).max(8)
});

const responseOutputSchema = z.object({
  response: z.string().min(20).max(1_500),
  resolution: z.enum(["resolved", "partial", "unresolved"]),
  unresolvedPoint: z.string().min(10).max(750).nullable(),
  citations: z.array(z.string().min(1).max(30)).max(8)
});

const debateExchangeSchema = z.object({
  criticId: z.enum(["athena", "turing", "seneca"]),
  targetId: z.enum(["athena", "turing", "seneca"]),
  objection: objectionOutputSchema.shape.objection,
  objectionCitations: objectionOutputSchema.shape.citations,
  response: responseOutputSchema.shape.response,
  responseCitations: responseOutputSchema.shape.citations,
  resolution: responseOutputSchema.shape.resolution,
  unresolvedPoint: responseOutputSchema.shape.unresolvedPoint
}).refine((exchange) => exchange.criticId !== exchange.targetId, { message: "Un agent ne peut pas se contredire lui-même." });

export type OrionSpecialistId = z.infer<typeof contributionSchema>["agentId"];
export type OrionSpecialistOutput = z.infer<typeof specialistOutputSchema>;

export const orionGenerationSchema = z.object({
  synthesis: z.string().min(30).max(4_000),
  recommendation: z.string().min(20).max(2_000).nullable(),
  contributions: z.array(contributionSchema).min(1).max(3),
  debates: z.array(debateExchangeSchema).min(3).max(3),
  assumptions: z.array(z.string().min(5).max(500)).max(12),
  missingEvidence: z.array(z.string().min(5).max(500)).max(12),
  confidence: z.number().int().min(0).max(100)
});

const synthesisOutputSchema = orionGenerationSchema.omit({ contributions: true, debates: true });

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

export interface OrionSpecialistRunner {
  analyze(agentId: OrionSpecialistId, input: OrionAIGenerationInput): Promise<OrionSpecialistOutput>;
  challenge(agentId: OrionSpecialistId, input: OrionAIGenerationInput, target: OrionGeneratedCycle["contributions"][number]): Promise<z.infer<typeof objectionOutputSchema>>;
  respond(agentId: OrionSpecialistId, input: OrionAIGenerationInput, objection: { criticId: OrionSpecialistId; objection: string; citations: string[] }): Promise<z.infer<typeof responseOutputSchema>>;
  synthesize(input: OrionAIGenerationInput, contributions: OrionGeneratedCycle["contributions"], debates: OrionGeneratedCycle["debates"]): Promise<Omit<OrionGeneratedCycle, "contributions" | "debates">>;
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
  specialistRunner: OrionSpecialistRunner = createOrionSpecialistRunner(model)
): OrionGenerationRunner {
  const runner = specialistRunner;
  return {
    async generate(input) {
      const contributions = await Promise.all(
        (["athena", "turing", "seneca"] as const).map(async (agentId) => ({ agentId, ...await runner.analyze(agentId, input) }))
      );
      const targets: Record<OrionSpecialistId, OrionSpecialistId> = { athena: "turing", turing: "seneca", seneca: "athena" };
      const objections = await Promise.all(contributions.map(async ({ agentId }) => {
        const targetId = targets[agentId];
        const target = contributions.find((item) => item.agentId === targetId)!;
        return { criticId: agentId, targetId, ...await runner.challenge(agentId, input, target) };
      }));
      const debates = await Promise.all(objections.map(async (objection) => ({
        criticId: objection.criticId,
        targetId: objection.targetId,
        objection: objection.objection,
        objectionCitations: objection.citations,
        ...mapDebateResponse(await runner.respond(objection.targetId, input, objection))
      })));
      return { ...await runner.synthesize(input, contributions, debates), contributions, debates };
    }
  };
}

function mapDebateResponse(response: z.infer<typeof responseOutputSchema>) {
  return { response: response.response, responseCitations: response.citations, resolution: response.resolution, unresolvedPoint: response.unresolvedPoint };
}

const SPECIALIST_INSTRUCTIONS: Record<OrionSpecialistId, string[]> = {
  athena: [
    "Tu es ATHENA, Chief Strategy Officer d'ExecutiveOS.",
    "Évalue l'alignement stratégique, les options, les arbitrages et l'avantage durable.",
    "Ne traite la technique et les risques que lorsqu'ils modifient la décision stratégique."
  ],
  turing: [
    "Tu es TURING, Chief Technology Officer d'ExecutiveOS.",
    "Évalue la faisabilité, les dépendances, l'architecture, les critères de sortie et le chemin d'exécution.",
    "Transforme les inconnues techniques en validations observables."
  ],
  seneca: [
    "Tu es SENECA, Chief Reflection Officer d'ExecutiveOS.",
    "Cherche les hypothèses fragiles, contradictions, biais, effets de second ordre et conditions de réversibilité.",
    "Formule un désaccord réel lorsque les preuves ne justifient pas l'engagement."
  ]
};

export function createOrionSpecialistRunner(model = process.env.ORION_AI_MODEL ?? DEFAULT_ORION_MODEL): OrionSpecialistRunner {
  const createSpecialist = (agentId: OrionSpecialistId) => new ToolLoopAgent({
    model,
    instructions: [
      ...SPECIALIST_INSTRUCTIONS[agentId],
      "Tu réponds en français, de façon concise et exploitable.",
      "Tu n'inventes aucune preuve et tu cites uniquement les identifiants S1, S2, etc. réellement fournis.",
      "Une incertitude importante réduit ta confiance et conduit à une position conditionnelle ou challenge."
    ].join(" "),
    output: Output.object({ schema: specialistOutputSchema })
  });
  const specialists = {
    athena: createSpecialist("athena"),
    turing: createSpecialist("turing"),
    seneca: createSpecialist("seneca")
  };

  const createCritic = (agentId: OrionSpecialistId) => new ToolLoopAgent({
    model,
    instructions: [
      ...SPECIALIST_INSTRUCTIONS[agentId],
      "Tu dois maintenant tester la solidité de la position d'un autre spécialiste.",
      "Formule une objection précise qui pourrait modifier la décision, sans caricaturer sa position.",
      "Tu cites uniquement les identifiants de preuve réellement fournis."
    ].join(" "),
    output: Output.object({ schema: objectionOutputSchema })
  });
  const critics = { athena: createCritic("athena"), turing: createCritic("turing"), seneca: createCritic("seneca") };

  const createRespondent = (agentId: OrionSpecialistId) => new ToolLoopAgent({
    model,
    instructions: [
      ...SPECIALIST_INSTRUCTIONS[agentId],
      "Réponds directement à l'objection reçue : accepte-la, réfute-la avec preuve, ou reconnais ce qui reste non résolu.",
      "N'efface jamais un désaccord réel. Un point non prouvé reste partiel ou non résolu.",
      "Tu cites uniquement les identifiants de preuve réellement fournis."
    ].join(" "),
    output: Output.object({ schema: responseOutputSchema })
  });
  const respondents = { athena: createRespondent("athena"), turing: createRespondent("turing"), seneca: createRespondent("seneca") };

  const orchestrator = new ToolLoopAgent({
    model,
    instructions: [
      "Tu es ORION, orchestrateur exécutif d'ExecutiveOS.",
      "Tu synthétises des contributions spécialisées déjà produites sans les remplacer ni masquer leurs désaccords.",
      "Tu distingues les objections résolues, partielles et non résolues, et toute objection non résolue limite la recommandation.",
      "Tu produis une synthèse décisionnelle concise, contradictoire et exploitable en français.",
      "Tu n'inventes jamais de preuve : cite uniquement les identifiants fournis.",
      "Une recommandation doit rester nulle lorsque les preuves sont insuffisantes.",
      "Toute incertitude devient une hypothèse ou une preuve manquante explicite."
    ].join(" "),
    output: Output.object({ schema: synthesisOutputSchema })
  });

  return {
    async analyze(agentId, input) {
      const { output } = await specialists[agentId].generate({ prompt: buildOrionPrompt(input) });
      return output;
    },
    async challenge(agentId, input, target) {
      const { output } = await critics[agentId].generate({ prompt: JSON.stringify({ context: JSON.parse(buildOrionPrompt(input)), targetContribution: target }) });
      return output;
    },
    async respond(agentId, input, objection) {
      const { output } = await respondents[agentId].generate({ prompt: JSON.stringify({ context: JSON.parse(buildOrionPrompt(input)), objection }) });
      return output;
    },
    async synthesize(input, contributions, debates) {
      const { output } = await orchestrator.generate({
        prompt: JSON.stringify({ context: JSON.parse(buildOrionPrompt(input)), specialistContributions: contributions, contradictoryDebate: debates })
      });
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

  return {
    output,
    runtime: "ai_gateway",
    model,
    generatedAt: completedAt.toISOString(),
    durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime())
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
