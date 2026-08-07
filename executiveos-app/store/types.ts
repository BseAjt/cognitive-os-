import type { ActionRecord, AgentContract, AgentRunRecord, CognitiveCase, CognitiveEventRecord, DecisionRecord, KnowledgeEntity, KnowledgeRecord, KnowledgeRelation, MemoryRecord } from "../domain/canonical.ts";
import type { UnifiedRuntimeResult } from "../lib/unified-runtime.ts";

export interface ConversationMessage {
  id: string;
  caseId: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

export type ReasoningStepId = "question" | "hypothesis" | "evidence" | "options" | "objections" | "decision" | "consequences";

export interface ReasoningRevision {
  id: string;
  caseId: string;
  stepId: ReasoningStepId;
  version: number;
  content: string;
  confidence?: number;
  risk?: number;
  createdAt: string;
}

export interface CaseSlice {
  cases: CognitiveCase[];
  activeCaseId: string;
  setActiveCase: (id: string) => void;
  replaceCase: (cognitiveCase: CognitiveCase) => void;
  applyCasePatch: (caseId: string, patch: Partial<CognitiveCase>) => void;
}

export interface ConversationSlice {
  messages: ConversationMessage[];
  appendMessages: (messages: ConversationMessage[]) => void;
  clearConversationHistory: (caseId: string) => void;
}

export interface DecisionSlice {
  decisions: DecisionRecord[];
  prependDecision: (decision: DecisionRecord) => void;
}

export interface ActionSlice {
  actions: ActionRecord[];
  prependActions: (actions: ActionRecord[]) => void;
}

export interface EventSlice {
  events: CognitiveEventRecord[];
  prependEvent: (event: CognitiveEventRecord) => void;
}

export interface MemorySlice {
  memories: MemoryRecord[];
  prependMemories: (records: MemoryRecord[]) => void;
}

export interface KnowledgeSlice {
  knowledgeRecords: KnowledgeRecord[];
  prependKnowledge: (records: KnowledgeRecord[]) => void;
}

export interface KnowledgeGraphSlice {
  knowledgeEntities: KnowledgeEntity[];
  knowledgeRelations: KnowledgeRelation[];
  mergeKnowledgeGraph: (entities: KnowledgeEntity[], relations: KnowledgeRelation[]) => void;
}

export interface RuntimeSlice {
  agents: AgentContract[];
  agentRuns: AgentRunRecord[];
  reasoningRevisions: ReasoningRevision[];
  addReasoningRevision: (revision: Omit<ReasoningRevision, "id" | "version" | "createdAt">) => void;
  assignRuntimeAction: (actionId: string) => void;
  transitionRuntimeAction: (actionId: string, status: ActionRecord["status"]) => void;
  executeRuntimeAction: (actionId: string) => void;
  resetRuntimeActions: () => void;
}

export interface ExecutiveCommands {
  applyRuntimeCycle: (input: {
    caseId: string;
    userText: string;
    result: UnifiedRuntimeResult;
    createdAt?: string;
  }) => void;
  recordConversationTurn: (input: {
    caseId: string;
    userText: string;
    assistantText: string;
    intent: string;
    extractionCount: number;
    casePatch: Partial<CognitiveCase>;
    createdAt?: string;
  }) => void;
  captureDecision: (input: {
    caseId: string;
    text: string;
    recommendation: string;
    confidence: number;
    rationale?: string;
    createdAt?: string;
  }) => void;
  createAction: (input: {
    caseId: string;
    title: string;
    owner?: string;
    requiredCapability?: string;
  }) => void;
  applyCriticalSignal: () => void;
}

export type ExecutiveState = CaseSlice & ConversationSlice & DecisionSlice & ActionSlice & EventSlice & MemorySlice & KnowledgeSlice & KnowledgeGraphSlice & RuntimeSlice & ExecutiveCommands;
