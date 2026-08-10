import type { AgentContract, CognitiveCase, ContextEvidenceRecord, ContextSourceRecord, ExecutiveCycleRecord } from "../domain/canonical.ts";
import type { OrionAIGenerationResult, OrionSpecialistId } from "./orion-ai-runtime.ts";

export interface OrionCycleRequest {
  objective: string;
  cognitiveCase: CognitiveCase;
  sources: ContextSourceRecord[];
  evidence: ContextEvidenceRecord[];
}

const MANDATES: Record<OrionSpecialistId, string> = {
  athena: "Cohérence stratégique et arbitrage",
  turing: "Faisabilité, dépendances et exécution",
  seneca: "Risques, objections et réversibilité"
};

export async function requestOrionExecutiveCycle(input: OrionCycleRequest, agents: AgentContract[]): Promise<ExecutiveCycleRecord> {
  const response = await fetch("/api/orion/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
  const payload = await response.json().catch(() => null) as OrionAIGenerationResult | { error?: string } | null;
  if (!response.ok || !payload || !("output" in payload)) {
    const code = payload && "error" in payload ? payload.error : undefined;
    throw new Error(code === "ai_runtime_not_configured"
      ? "Le runtime IA ORION n’est pas disponible sur ce déploiement."
      : "Le cycle ORION n’a pas pu être exécuté. Réessayez dans quelques instants.");
  }
  return toExecutiveCycleRecord(input, payload, agents);
}

export function toExecutiveCycleRecord(input: OrionCycleRequest, result: OrionAIGenerationResult, agents: AgentContract[]): ExecutiveCycleRecord {
  const { output, trace } = result;
  const completed = output.decisionMemo.status !== "hold" && Boolean(output.recommendation);
  const evidenceByCitation = new Map(trace.evidenceManifest.map((item) => [item.citation, item]));
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  return {
    id: trace.cycleId,
    caseId: input.cognitiveCase.id,
    objective: input.objective.trim(),
    status: completed ? "completed" : "blocked",
    selectedAgentIds: output.contributions.map((item) => item.agentId),
    contributions: output.contributions.map((item) => ({
      agentId: item.agentId,
      agentName: agentsById.get(item.agentId)?.name ?? item.agentId.toUpperCase(),
      mandate: MANDATES[item.agentId],
      position: item.position,
      analysis: item.analysis,
      confidence: item.confidence,
      citations: item.citations,
      evidenceIds: item.citations.map((citation) => evidenceByCitation.get(citation)?.evidenceId).filter((id): id is string => Boolean(id))
    })),
    divergences: output.debates
      .filter((item) => item.resolution !== "resolved")
      .map((item) => ({
        topic: `${item.criticId.toUpperCase()} ↔ ${item.targetId.toUpperCase()}`,
        agentIds: [item.criticId, item.targetId],
        description: item.objection,
        resolution: item.unresolvedPoint ?? item.response
      })),
    synthesis: output.synthesis,
    recommendation: completed ? output.recommendation : null,
    confidence: output.confidence,
    missingEvidence: [...output.missingEvidence, ...(!completed ? output.decisionMemo.conditions : [])],
    sourceIds: [...new Set(trace.evidenceManifest.map((item) => item.sourceId))],
    createdAt: result.generatedAt
  };
}
