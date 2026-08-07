"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createActionSlice, createChallengeSlice, createConversationSlice, createDecisionSlice, createEventSlice } from "@/store/slices";
import { createExecutiveCommands } from "@/store/commands";
import type { ActionRecord, DecisionRecord } from "@/domain/canonical";
import type { ConversationMessage, ExecutiveState } from "@/store/types";

export type { ConversationMessage, ExecutiveState } from "@/store/types";

type PersistedMessage = Omit<ConversationMessage, "caseId"> & {
  caseId?: string;
  challengeId?: string;
};

type PersistedDecision = Partial<DecisionRecord> & {
  id: string;
  challengeId?: string;
  finalDecision?: string;
  recommendation: string;
  rationale: string;
  confidence: number;
  createdAt: string;
};

type PersistedAction = Partial<ActionRecord> & {
  id: string;
  challengeId?: string;
  title: string;
  owner: string;
  progress: number;
  status: ActionRecord["status"];
};

type PersistedExecutiveState = Partial<ExecutiveState> & {
  messages?: PersistedMessage[];
  decisions?: PersistedDecision[];
  actions?: PersistedAction[];
};

function migratePersistedState(persistedState: unknown, version: number): ExecutiveState {
  const state = (persistedState ?? {}) as PersistedExecutiveState;

  const migratedMessages = (state.messages ?? []).map((message) => ({
    id: message.id,
    caseId: message.caseId ?? message.challengeId ?? "executiveos",
    role: message.role,
    text: message.text,
    createdAt: message.createdAt
  }));

  const migratedDecisions = (state.decisions ?? []).map((decision) => ({
    id: decision.id,
    caseId: decision.caseId ?? decision.challengeId ?? "executiveos",
    recommendation: decision.recommendation,
    outcome: decision.outcome ?? decision.finalDecision ?? "",
    rationale: decision.rationale,
    confidence: decision.confidence,
    createdAt: decision.createdAt
  }));

  const migratedActions = (state.actions ?? []).map((action) => ({
    id: action.id,
    caseId: action.caseId ?? action.challengeId ?? "executiveos",
    title: action.title,
    owner: action.owner,
    progress: action.progress,
    status: action.status
  }));

  if (version >= 5) return state as ExecutiveState;

  return {
    ...state,
    messages: migratedMessages,
    decisions: migratedDecisions,
    actions: migratedActions
  } as ExecutiveState;
}

export const useExecutiveStore = create<ExecutiveState>()(
  persist(
    (...args) => ({
      ...createChallengeSlice(...args),
      ...createConversationSlice(...args),
      ...createDecisionSlice(...args),
      ...createActionSlice(...args),
      ...createEventSlice(...args),
      ...createExecutiveCommands(...args)
    }),
    {
      name: "executiveos-v2",
      version: 5,
      migrate: migratePersistedState
    }
  )
);
