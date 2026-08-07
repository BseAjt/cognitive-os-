import type { ActionItem, Challenge, CognitiveEvent, Decision } from "@/types/domain";

export interface ConversationMessage {
  id: string;
  caseId: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

export interface ChallengeSlice {
  challenges: Challenge[];
  activeChallengeId: string;
  setActiveChallenge: (id: string) => void;
  replaceChallenge: (challenge: Challenge) => void;
  applyChallengePatch: (caseId: string, patch: Partial<Challenge>) => void;
}

export interface ConversationSlice {
  messages: ConversationMessage[];
  appendMessages: (messages: ConversationMessage[]) => void;
  clearConversationHistory: (caseId: string) => void;
}

export interface DecisionSlice {
  decisions: Decision[];
  prependDecision: (decision: Decision) => void;
}

export interface ActionSlice {
  actions: ActionItem[];
  prependActions: (actions: ActionItem[]) => void;
}

export interface EventSlice {
  events: CognitiveEvent[];
  prependEvent: (event: CognitiveEvent) => void;
}

export interface ExecutiveCommands {
  recordConversationTurn: (input: {
    caseId: string;
    userText: string;
    assistantText: string;
    intent: string;
    extractionCount: number;
    challengePatch: Partial<Challenge>;
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

export type ExecutiveState = ChallengeSlice & ConversationSlice & DecisionSlice & ActionSlice & EventSlice & ExecutiveCommands;
