import type { ActionRecord, AgentRunRecord, CognitiveCase, DecisionRecord, KnowledgeEntity, KnowledgeRelation, LearningEventRecord, MemoryRecord, ReflectionRecord } from "../domain/canonical.ts";
import type { ReasoningRevision } from "../store/types.ts";

export interface CognitiveRecallInput {
  cognitiveCase: CognitiveCase;
  decisions: DecisionRecord[];
  actions: ActionRecord[];
  memories: MemoryRecord[];
  reasoningRevisions: ReasoningRevision[];
  knowledgeEntities: KnowledgeEntity[];
  knowledgeRelations: KnowledgeRelation[];
  agentRuns: AgentRunRecord[];
  learningEvents?: LearningEventRecord[];
  reflections?: ReflectionRecord[];
}

export interface CognitiveRecallResult {
  caseId: string;
  summary: string;
  lastDecision?: DecisionRecord;
  openActions: ActionRecord[];
  durableMemories: MemoryRecord[];
  latestReasoning: ReasoningRevision[];
  relevantKnowledge: KnowledgeEntity[];
  lastAgentRun?: AgentRunRecord;
  latestLearningEvents: LearningEventRecord[];
  lastReflection?: ReflectionRecord;
  nextBestAction: string;
  confidence: number;
}

export function buildCognitiveRecall(input: CognitiveRecallInput): CognitiveRecallResult {
  const caseId = input.cognitiveCase.id;
  const byNewest = <T extends { createdAt?: string }>(items: T[]) => [...items].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  const lastDecision = byNewest(input.decisions.filter((item) => item.caseId === caseId))[0];
  const openActions = input.actions.filter((item) => item.caseId === caseId && item.status !== "done").sort((a, b) => a.progress - b.progress);
  const durableMemories = byNewest(input.memories.filter((item) => item.caseId === caseId && item.durable)).slice(0, 6);
  const latestReasoning = latestReasoningPerStep(input.reasoningRevisions.filter((item) => item.caseId === caseId));
  const relevantKnowledge = input.knowledgeEntities.filter((item) => item.caseId === caseId).slice(-12);
  const lastAgentRun = byNewest(input.agentRuns.filter((item) => item.caseId === caseId))[0];
  const latestLearningEvents = byNewest((input.learningEvents ?? []).filter((item) => item.caseId === caseId)).slice(0, 6);
  const lastReflection = byNewest((input.reflections ?? []).filter((item) => item.caseId === caseId))[0];
  const nextBestAction = lastReflection?.decisionsToReconsider[0]
    ?? openActions[0]?.title
    ?? latestLearningEvents[0]?.detail
    ?? lastAgentRun?.synthesis
    ?? input.cognitiveCase.context
    ?? "Reprendre l’analyse du dossier.";
  const confidence = recallConfidence(input.cognitiveCase, lastDecision, durableMemories, latestReasoning, relevantKnowledge, lastReflection);
  const summary = buildSummary({ cognitiveCase: input.cognitiveCase, lastDecision, openActions, durableMemories, latestReasoning, lastAgentRun, latestLearningEvents, lastReflection, nextBestAction });
  return { caseId, summary, lastDecision, openActions, durableMemories, latestReasoning, relevantKnowledge, lastAgentRun, latestLearningEvents, lastReflection, nextBestAction, confidence };
}

function latestReasoningPerStep(revisions: ReasoningRevision[]): ReasoningRevision[] {
  const latest = new Map<string, ReasoningRevision>();
  for (const revision of revisions) {
    const current = latest.get(revision.stepId);
    if (!current || revision.version > current.version || revision.createdAt > current.createdAt) latest.set(revision.stepId, revision);
  }
  return [...latest.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function recallConfidence(cognitiveCase: CognitiveCase, decision: DecisionRecord | undefined, memories: MemoryRecord[], reasoning: ReasoningRevision[], knowledge: KnowledgeEntity[], reflection?: ReflectionRecord): number {
  let score = cognitiveCase.signals.confidence;
  if (decision) score += 5;
  if (memories.length >= 2) score += 4;
  if (reasoning.length >= 3) score += 4;
  if (knowledge.length >= 3) score += 3;
  if (reflection && reflection.confidence >= 75) score += 3;
  return Math.max(0, Math.min(100, score));
}

function buildSummary(input: { cognitiveCase: CognitiveCase; lastDecision?: DecisionRecord; openActions: ActionRecord[]; durableMemories: MemoryRecord[]; latestReasoning: ReasoningRevision[]; lastAgentRun?: AgentRunRecord; latestLearningEvents: LearningEventRecord[]; lastReflection?: ReflectionRecord; nextBestAction: string; }): string {
  const parts = [
    `Objectif: ${input.cognitiveCase.objective}`,
    input.cognitiveCase.workingHypothesis ? `Hypothèse active: ${input.cognitiveCase.workingHypothesis}` : null,
    input.lastDecision ? `Dernière décision: ${input.lastDecision.outcome}` : null,
    input.openActions.length ? `Actions ouvertes: ${input.openActions.slice(0, 3).map((item) => item.title).join(" · ")}` : null,
    input.latestReasoning.length ? `Raisonnement repris: ${input.latestReasoning.slice(-3).map((item) => item.content).join(" · ")}` : null,
    input.durableMemories.length ? `Mémoire durable: ${input.durableMemories.slice(0, 3).map((item) => item.content).join(" · ")}` : null,
    input.latestLearningEvents.length ? `Apprentissages récents: ${input.latestLearningEvents.slice(0, 3).map((item) => item.title).join(" · ")}` : null,
    input.lastReflection ? `Dernière réflexion: ${input.lastReflection.summary}` : null,
    input.lastAgentRun ? `Dernier conseil ORION: ${input.lastAgentRun.synthesis}` : null,
    `Prochaine meilleure action: ${input.nextBestAction}`
  ].filter((item): item is string => Boolean(item));
  return parts.join("\n");
}
