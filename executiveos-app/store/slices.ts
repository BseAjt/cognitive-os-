import type { StateCreator } from "zustand";
import type { ExecutiveState, ChallengeSlice, ConversationSlice, DecisionSlice, ActionSlice, EventSlice } from "@/store/types";
import { initialChallenges, initialMessages } from "@/store/seed";

export const createChallengeSlice: StateCreator<ExecutiveState, [], [], ChallengeSlice> = (set) => ({
  challenges: initialChallenges,
  activeChallengeId: "executiveos",
  setActiveChallenge: (id) => set({ activeChallengeId: id }),
  replaceChallenge: (challenge) =>
    set((state) => ({ challenges: state.challenges.map((item) => item.id === challenge.id ? challenge : item) })),
  applyChallengePatch: (caseId, patch) =>
    set((state) => ({
      challenges: state.challenges.map((item) => item.id === caseId ? { ...item, ...patch } : item)
    }))
});

export const createConversationSlice: StateCreator<ExecutiveState, [], [], ConversationSlice> = (set) => ({
  messages: initialMessages,
  appendMessages: (messages) => set((state) => ({ messages: [...state.messages, ...messages] })),
  clearConversationHistory: (caseId) =>
    set((state) => ({ messages: state.messages.filter((message) => message.caseId !== caseId) }))
});

export const createDecisionSlice: StateCreator<ExecutiveState, [], [], DecisionSlice> = (set) => ({
  decisions: [],
  prependDecision: (decision) => set((state) => ({ decisions: [decision, ...state.decisions] }))
});

export const createActionSlice: StateCreator<ExecutiveState, [], [], ActionSlice> = (set) => ({
  actions: [],
  prependActions: (actions) => set((state) => ({ actions: [...actions, ...state.actions] }))
});

export const createEventSlice: StateCreator<ExecutiveState, [], [], EventSlice> = (set) => ({
  events: [],
  prependEvent: (event) => set((state) => ({ events: [event, ...state.events] }))
});
