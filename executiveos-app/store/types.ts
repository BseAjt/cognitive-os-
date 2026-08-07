import type { ActionRecord, CognitiveCase, CognitiveEventRecord, DecisionRecord } from "@/domain/canonical";

export interface ConversationMessage {
  id: string;
  caseId: string;
  role: "user" | "assistant";
  text: string;
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

export interface ExecutiveCommands {
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
  }) => void;
  applyCriticalSignal: () => void;
}

export type ExecutiveState = CaseSlice & ConversationSlice & DecisionSlice & ActionSlice & EventSlice & ExecutiveCommands;
