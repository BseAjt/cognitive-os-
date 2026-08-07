import type { StateCreator } from "zustand";
import { assignAction, executeAction, transitionAction } from "../lib/executive-runtime.ts";
import { initialAgents, initialRuntimeActions } from "./seed.ts";
import type { ExecutiveState, RuntimeSlice } from "./types.ts";

export const createRuntimeSlice: StateCreator<ExecutiveState, [], [], RuntimeSlice> = (set) => ({
  agents: initialAgents,
  agentRuns: [],
  reasoningRevisions: [],
  addReasoningRevision: (revision) =>
    set((state) => {
      const versions = state.reasoningRevisions.filter((item) => item.caseId === revision.caseId && item.stepId === revision.stepId);
      const createdAt = new Date().toISOString();
      const next = {
        ...revision,
        id: crypto.randomUUID(),
        version: versions.length + 1,
        createdAt
      };
      return {
        reasoningRevisions: [...state.reasoningRevisions, next],
        events: [{ id: crypto.randomUUID(), type: "ReasoningRevisionAdded", detail: `${revision.stepId} · v${next.version}`, createdAt }, ...state.events]
      };
    }),
  assignRuntimeAction: (actionId) =>
    set((state) => ({
      actions: state.actions.map((action) => action.id === actionId ? assignAction(action, state.agents) : action),
      events: [{ id: crypto.randomUUID(), type: "RuntimeTaskAssigned", detail: `Affectation de ${actionId}`, createdAt: new Date().toISOString() }, ...state.events]
    })),
  transitionRuntimeAction: (actionId, status) =>
    set((state) => ({
      actions: state.actions.map((action) => action.id === actionId ? transitionAction(action, status) : action),
      events: [{ id: crypto.randomUUID(), type: "RuntimeTaskTransitioned", detail: `${actionId} → ${status}`, createdAt: new Date().toISOString() }, ...state.events]
    })),
  executeRuntimeAction: (actionId) =>
    set((state) => ({
      actions: state.actions.map((action) => action.id === actionId ? executeAction(action, state.agents) : action),
      events: [{ id: crypto.randomUUID(), type: "RuntimeTaskExecuted", detail: `Exécution de ${actionId}`, createdAt: new Date().toISOString() }, ...state.events]
    })),
  resetRuntimeActions: () => set({ actions: initialRuntimeActions })
});
