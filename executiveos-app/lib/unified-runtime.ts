import type { AgentContract, CognitiveCase, ContextRecord, KnowledgeRecord, MemoryRecord } from "../domain/canonical.ts";
import { preferredAgentForCapability, runAgentOrchestration, type AgentOrchestrationResult } from "./agent-runtime.ts";
import { runConversationRuntime, type CognitiveExtraction, type RuntimeResult } from "./conversation-runtime.ts";

export type RuntimeStage = "context" | "reasoning" | "agents" | "decision" | "action" | "memory" | "knowledge";
export type ReasoningStepId = "question" | "hypothesis" | "evidence" | "options" | "objections" | "decision" | "consequences";

export interface RuntimeStageTrace {
  stage: RuntimeStage;
  status: "completed" | "skipped" | "blocked";
  detail: string;
}

export interface ReasoningProposal {
  stepId: ReasoningStepId;
  content: string;
  confidence?: number;
  risk?: number;
}

export interface DecisionProposal {
  outcome: string;
  recommendation: string;
  confidence: number;
  rationale: string;
}

export interface ActionProposal {
  title: string;
  requiredCapability: string;
  preferredAgentId?: string;
  preferredAgentName?: string;
}

export interface MemoryCandidate {
  kind: CognitiveExtraction["kind"];
  content: string;
  confidence: number;
  durable: boolean;
}

export interface KnowledgeCandidate {
  type: "context_item" | "risk" | "decision" | "action" | "insight";
  title: string;
  confidence: number;
}

export interface UnifiedRuntimeInput {
  message: string;
  cognitiveCase: CognitiveCase;
  contextItems?: ContextRecord[];
  agents?: AgentContract[];
  memories?: MemoryRecord[];
  knowledgeRecords?: KnowledgeRecord[];
}

export interface UnifiedRuntimeResult {
  conversation: RuntimeResult;
  reasoning: ReasoningProposal[];
  agents: AgentOrchestrationResult;
  decision?: DecisionProposal;
  actions: ActionProposal[];
  memory: MemoryCandidate[];
  knowledge: KnowledgeCandidate[];
  trace: RuntimeStageTrace[];
  nextAction: string;
}

export function runUnifiedRuntime(input: UnifiedRuntimeInput): UnifiedRuntimeResult {
  const conversation = runConversationRuntime(input.message, input.cognitiveCase);
  const agentOrchestration = runAgentOrchestration({
    message: input.message,
    cognitiveCase: input.cognitiveCase,
    agents: input.agents ?? [],
    extractions: conversation.extractions,
    memories: input.memories,
    knowledgeRecords: input.knowledgeRecords
  });

  const reasoning: ReasoningProposal[] = [
    ...conversation.extractions.map((extraction) => toReasoningProposal(extraction, input.cognitiveCase)),
    ...agentOrchestration.contributions.map((contribution) => ({
      stepId: contribution.agentId === "seneca" ? "objections" as const : contribution.agentId === "turing" ? "evidence" as const : "options" as const,
      content: `${contribution.agentName} — ${contribution.content}`,
      confidence: contribution.confidence,
      risk: contribution.agentId === "seneca" ? input.cognitiveCase.signals.risk : undefined
    })),
    ...(agentOrchestration.contributions.length ? [{
      stepId: "options" as const,
      content: agentOrchestration.synthesis,
      confidence: agentOrchestration.confidence
    }] : [])
  ];

  const decisionExtraction = conversation.extractions.find((item) => item.kind === "decision");
  const decision = decisionExtraction
    ? {
        outcome: decisionExtraction.text,
        recommendation: conversation.decisionFrame?.recommendation ?? conversation.nextAction,
        confidence: Math.round((decisionExtraction.confidence + agentOrchestration.confidence) / 2),
        rationale: conversation.decisionFrame
          ? `Décision structurée par le Decision Runtime (${conversation.decisionFrame.category}) et revue par ORION.`
          : `Décision extraite de la conversation et revue par ORION.`
      }
    : undefined;

  const actions = conversation.extractions
    .filter((item) => item.kind === "action")
    .map((item) => {
      const requiredCapability = inferCapability(item.text);
      const preferred = preferredAgentForCapability(requiredCapability, input.agents ?? [], agentOrchestration.selectedAgentIds);
      return {
        title: item.text,
        requiredCapability,
        preferredAgentId: preferred?.id,
        preferredAgentName: preferred?.name
      };
    });

  const memory = conversation.extractions.map((item) => ({
    kind: item.kind,
    content: item.text,
    confidence: item.confidence,
    durable: item.kind !== "question"
  }));
  const knowledge = [
    ...conversation.extractions.map(toKnowledgeCandidate),
    ...(agentOrchestration.contributions.length ? [{
      type: "insight" as const,
      title: agentOrchestration.synthesis,
      confidence: agentOrchestration.confidence
    }] : [])
  ];

  const trace: RuntimeStageTrace[] = [
    { stage: "context", status: "completed", detail: `${conversation.extractions.length} éléments cognitifs extraits.` },
    { stage: "reasoning", status: reasoning.length ? "completed" : "skipped", detail: `${reasoning.length} propositions de révision.` },
    { stage: "agents", status: agentOrchestration.contributions.length ? "completed" : "skipped", detail: `${agentOrchestration.selectedAgentIds.length} spécialiste(s) mobilisé(s) par ORION.` },
    {
      stage: "decision",
      status: conversation.decisionFrame?.requiresContext && !conversation.decisionFrame.recommendation ? "blocked" : decision ? "completed" : "skipped",
      detail: conversation.decisionFrame?.requiresContext && !conversation.decisionFrame.recommendation
        ? "Décision bloquée jusqu'à validation du contexte requis."
        : decision ? "Proposition de décision produite." : "Aucune décision détectée."
    },
    { stage: "action", status: actions.length ? "completed" : "skipped", detail: `${actions.length} action(s) proposée(s).` },
    { stage: "memory", status: memory.length ? "completed" : "skipped", detail: `${memory.filter((item) => item.durable).length} candidat(s) mémoire durable.` },
    { stage: "knowledge", status: knowledge.length ? "completed" : "skipped", detail: `${knowledge.length} candidat(s) Knowledge Graph.` }
  ];

  return {
    conversation,
    reasoning,
    agents: agentOrchestration,
    decision,
    actions,
    memory,
    knowledge,
    trace,
    nextAction: agentOrchestration.contributions.length
      ? `${conversation.nextAction} · ORION: ${agentOrchestration.synthesis}`
      : conversation.nextAction
  };
}

function toReasoningProposal(extraction: CognitiveExtraction, cognitiveCase: CognitiveCase): ReasoningProposal {
  return {
    stepId: reasoningStepFor(extraction.kind),
    content: extraction.text,
    confidence: extraction.confidence,
    risk: extraction.kind === "risk" ? cognitiveCase.signals.risk : undefined
  };
}

function reasoningStepFor(kind: CognitiveExtraction["kind"]): ReasoningStepId {
  switch (kind) {
    case "hypothesis": return "hypothesis";
    case "risk": return "objections";
    case "decision": return "decision";
    case "action": return "consequences";
    case "question": return "question";
    case "goal": return "question";
    case "context":
    default:
      return "evidence";
  }
}

function inferCapability(text: string): string {
  const lower = text.toLowerCase();
  if (/jurid|legal|contrat|conform/.test(lower)) return "legal";
  if (/tech|architecture|système|api|code|runtime|logiciel/.test(lower)) return "technology";
  if (/finance|budget|cash|trésorerie|roi/.test(lower)) return "finance";
  if (/rh|recrut|équipe|poste|effectif/.test(lower)) return "people";
  return "analysis";
}

function toKnowledgeCandidate(extraction: CognitiveExtraction): KnowledgeCandidate {
  const type = extraction.kind === "risk"
    ? "risk"
    : extraction.kind === "decision"
      ? "decision"
      : extraction.kind === "action"
        ? "action"
        : extraction.kind === "context" || extraction.kind === "goal" || extraction.kind === "hypothesis"
          ? "context_item"
          : "insight";
  return { type, title: extraction.text, confidence: extraction.confidence };
}
