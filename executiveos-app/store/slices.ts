import type { StateCreator } from "zustand";
import type { ExecutiveState, CaseSlice, ConversationSlice, DecisionSlice, ActionSlice, EventSlice } from "./types.ts";
import { initialCases, initialMessages, initialRuntimeActions } from "./seed.ts";

export const createCaseSlice: StateCreator<ExecutiveState, [], [], CaseSlice> = (set) => ({
  cases: initialCases,
  activeCaseId: "executiveos",
  setActiveCase: (id) => set({ activeCaseId: id }),
  replaceCase: (cognitiveCase) =>
    set((state) => ({ cases: state.cases.map((item) => item.id === cognitiveCase.id ? cognitiveCase : item) })),
  applyCasePatch: (caseId, patch) =>
    set((state) => ({
      cases: state.cases.map((item) => item.id === caseId ? { ...item, ...patch } : item)
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
  actions: initialRuntimeActions,
  prependActions: (actions) => set((state) => ({ actions: [...actions, ...state.actions] }))
});

export const createEventSlice: StateCreator<ExecutiveState, [], [], EventSlice> = (set) => ({
  events: [],
  prependEvent: (event) => set((state) => ({ events: [event, ...state.events] }))
});
