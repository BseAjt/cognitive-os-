"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createActionSlice, createChallengeSlice, createConversationSlice, createDecisionSlice, createEventSlice } from "@/store/slices";
import { createExecutiveCommands } from "@/store/commands";
import type { ConversationMessage, ExecutiveState } from "@/store/types";

export type { ConversationMessage, ExecutiveState } from "@/store/types";

type PersistedMessageV3 = Omit<ConversationMessage, "caseId"> & {
  caseId?: string;
  challengeId?: string;
};

type PersistedExecutiveState = Partial<ExecutiveState> & {
  messages?: PersistedMessageV3[];
};

function migratePersistedState(persistedState: unknown, version: number): ExecutiveState {
  const state = (persistedState ?? {}) as PersistedExecutiveState;
  if (version >= 4 || !state.messages) return state as ExecutiveState;

  return {
    ...state,
    messages: state.messages.map((message) => ({
      id: message.id,
      caseId: message.caseId ?? message.challengeId ?? "executiveos",
      role: message.role,
      text: message.text,
      createdAt: message.createdAt
    }))
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
      version: 4,
      migrate: migratePersistedState
    }
  )
);
