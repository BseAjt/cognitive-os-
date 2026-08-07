"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createActionSlice, createCaseSlice, createConversationSlice, createDecisionSlice, createEventSlice } from "./slices";
import { createExecutiveCommands } from "./commands";
import { createRuntimeSlice } from "./runtime-slice";
import type { ActionRecord, AgentContract, CognitiveCase, DecisionRecord } from "../domain/canonical";
import type { ConversationMessage, ExecutiveState, ReasoningRevision } from "./types";

export type { ConversationMessage, ExecutiveState, ReasoningRevision, ReasoningStepId } from "./types";

type PersistedMessage = Omit<ConversationMessage, "caseId"> & {
  caseId?: string;
  challengeId?: string;
};

type PersistedDecision = {
  id: string;
  caseId?: string;
  challengeId?: string;
  recommendation: string;
  outcome?: string;
  finalDecision?: string;
  rationale: string;
  confidence: number;
  createdAt: string;
};

type PersistedAction = {
  id: string;
  caseId?: string;
  challengeId?: string;
  title: string;
  owner: string;
  progress: number;
  status: ActionRecord["status"];
  requiredCapability?: string;
  assignedAgentId?: string | null;
  blockedReason?: string;
  dueAt?: string | null;
  result?: string;
};

type PersistedLegacyChallenge = {
  id: string;
  title: string;
  goal: string;
  hypothesis: string;
  impact: number;
  urgency: number;
  confidence: number;
  cognitiveCost: number;
  risk: number;
  context: string;
  state: CognitiveCase["state"];
};

type PersistedLegacyRevision = Omit<ReasoningRevision, "caseId"> & {
  caseId?: string;
  challengeId?: string;
};

type PersistedExecutiveState = {
  cases?: CognitiveCase[];
  challenges?: PersistedLegacyChallenge[];
  activeCaseId?: string;
  activeChallengeId?: string;
  messages?: PersistedMessage[];
  decisions?: PersistedDecision[];
  actions?: PersistedAction[];
  events?: ExecutiveState["events"];
  agents?: AgentContract[];
  reasoningRevisions?: PersistedLegacyRevision[];
};

function migratePersistedState(persistedState: unknown, version: number): ExecutiveState {
  const state = (persistedState ?? {}) as PersistedExecutiveState;

  if (version >= 7) return state as ExecutiveState;

  const migratedCases: CognitiveCase[] = state.cases ?? (state.challenges ?? []).map((challenge) => ({
    id: challenge.id,
    title: challenge.title,
    objective: challenge.goal,
    workingHypothesis: challenge.hypothesis,
    context: challenge.context,
    state: challenge.state,
    signals: {
      impact: challenge.impact,
      urgency: challenge.urgency,
      confidence: challenge.confidence,
      cognitiveCost: challenge.cognitiveCost,
      risk: challenge.risk
    }
  }));

  const migratedMessages: ConversationMessage[] = (state.messages ?? []).map((message) => ({
    id: message.id,
    caseId: message.caseId ?? message.challengeId ?? "executiveos",
    role: message.role,
    text: message.text,
    createdAt: message.createdAt
  }));

  const migratedDecisions: DecisionRecord[] = (state.decisions ?? []).map((decision) => ({
    id: decision.id,
    caseId: decision.caseId ?? decision.challengeId ?? "executiveos",
    recommendation: decision.recommendation,
    outcome: decision.outcome ?? decision.finalDecision ?? "",
    rationale: decision.rationale,
    confidence: decision.confidence,
    createdAt: decision.createdAt
  }));

  const migratedActions: ActionRecord[] = (state.actions ?? []).map((action) => ({
    id: action.id,
    caseId: action.caseId ?? action.challengeId ?? "executiveos",
    title: action.title,
    owner: action.owner,
    progress: action.progress,
    status: action.status,
    requiredCapability: action.requiredCapability,
    assignedAgentId: action.assignedAgentId,
    blockedReason: action.blockedReason,
    dueAt: action.dueAt,
    result: action.result
  }));

  const migratedRevisions: ReasoningRevision[] = (state.reasoningRevisions ?? []).map((revision) => ({
    ...revision,
    caseId: revision.caseId ?? revision.challengeId ?? "executiveos"
  }));

  return {
    cases: migratedCases,
    activeCaseId: state.activeCaseId ?? state.activeChallengeId ?? migratedCases[0]?.id ?? "executiveos",
    messages: migratedMessages,
    decisions: migratedDecisions,
    actions: migratedActions,
    events: state.events ?? [],
    agents: state.agents ?? [],
    reasoningRevisions: migratedRevisions
  } as ExecutiveState;
}

export const useExecutiveStore = create<ExecutiveState>()(
  persist(
    (...args) => ({
      ...createCaseSlice(...args),
      ...createConversationSlice(...args),
      ...createDecisionSlice(...args),
      ...createActionSlice(...args),
      ...createEventSlice(...args),
      ...createRuntimeSlice(...args),
      ...createExecutiveCommands(...args)
    }),
    {
      name: "executiveos-v2",
      version: 7,
      migrate: migratePersistedState
    }
  )
);
