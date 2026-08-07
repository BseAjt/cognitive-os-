import type { CognitiveCase, ContextRecord } from "../domain/canonical.ts";
import { runConversationRuntime, type CognitiveExtraction, type RuntimeResult } from "./conversation-runtime.ts";

export type RuntimeStage = "context" | "reasoning" | "decision" | "action" | "memory" | "knowledge";
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
}

export interface UnifiedRuntimeResult {
  conversation: RuntimeResult;
  reasoning: ReasoningProposal[];
  decision?: DecisionProposal;
  actions: ActionProposal[];
  memory: MemoryCandidate[];
  knowledge: KnowledgeCandidate[];
  trace: RuntimeStageTrace[];
  nextAction: string;
}

export function runUnifiedRuntime(input: UnifiedRuntimeInput): UnifiedRuntimeResult {
  const conversation = runConversationRuntime(input.message, input.cognitiveCase);
  const reasoning = conversation.extractions.map((extraction) => toReasoningProposal(extraction, input.cognitiveCase));
  const decisionExtraction = conversation.extractions.find((item) => item.kind === "decision");
  const decision = decisionExtraction
    ? {
        outcome: decisionExtraction.text,
        recommendation: conversation.decisionFrame?.recommendation ?? conversation.nextAction,
        confidence: decisionExtraction.confidence,
        rationale: conversation.decisionFrame
          ? `Décision structurée par le Decision Runtime (${conversation.decisionFrame.category}).`
          : "Décision extraite de la conversation."
      }
    : undefined;
  const actions = conversation.extractions
    .filter((item) => item.kind === "action")
    .map((item) => ({ title: item.text, requiredCapability: inferCapability(item.text) }));
  const memory = conversation.extractions.map((item) => ({
    kind: item.kind,
    content: item.text,
    confidence: item.confidence,
    durable: item.kind !== "question"
  }));
  const knowledge = conversation.extractions.map(toKnowledgeCandidate);

  const trace: RuntimeStageTrace[] = [
    { stage: "context", status: "completed", detail: `${conversation.extractions.length} éléments cognitifs extraits.` },
    { stage: "reasoning", status: reasoning.length ? "completed" : "skipped", detail: `${reasoning.length} propositions de révision.` },
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
    decision,
    actions,
    memory,
    knowledge,
    trace,
    nextAction: conversation.nextAction
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
  if (/tech|architecture|système|api|code/.test(lower)) return "technology";
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
