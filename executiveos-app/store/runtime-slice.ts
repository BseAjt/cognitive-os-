import type { StateCreator } from "zustand";
import { assignAction, executeAction, transitionAction } from "../lib/executive-runtime.ts";
import { initialAgentRuns, initialAgents, initialReasoningRevisions, initialRuntimeActions } from "./seed.ts";
import type { ExecutiveState, RuntimeSlice } from "./types.ts";

export const createRuntimeSlice: StateCreator<ExecutiveState, [], [], RuntimeSlice> = (set) => ({
  agents: initialAgents,
  agentRuns: initialAgentRuns,
  reasoningRevisions: initialReasoningRevisions,
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
    set((state) => {
      const current = state.actions.find((action) => action.id === actionId);
      if (!current) return state;
      const assigned = assignAction(current, state.agents);
      const detail = assigned.status === "blocked"
        ? `${current.title} est bloquée : ${assigned.blockedReason}`
        : `${current.title} est affectée à ${assigned.owner}.`;
      return {
        actions: state.actions.map((action) => action.id === actionId ? assigned : action),
        events: [{ id: crypto.randomUUID(), type: "RuntimeTaskAssigned", detail, createdAt: new Date().toISOString() }, ...state.events]
      };
    }),
  transitionRuntimeAction: (actionId, status) =>
    set((state) => {
      const current = state.actions.find((action) => action.id === actionId);
      if (!current) return state;
      const transitioned = transitionAction(current, status);
      return {
        actions: state.actions.map((action) => action.id === actionId ? transitioned : action),
        events: [{ id: crypto.randomUUID(), type: "RuntimeTaskTransitioned", detail: `${current.title} → ${status} (${transitioned.progress}%).`, createdAt: new Date().toISOString() }, ...state.events]
      };
    }),
  executeRuntimeAction: (actionId) =>
    set((state) => {
      const current = state.actions.find((action) => action.id === actionId);
      if (!current) return state;
      const executed = executeAction(current, state.agents);
      const detail = executed.status === "blocked"
        ? `${current.title} n’a pas pu être exécutée : ${executed.blockedReason}`
        : executed.result ?? `${current.title} exécutée.`;
      return {
        actions: state.actions.map((action) => action.id === actionId ? executed : action),
        events: [{ id: crypto.randomUUID(), type: "RuntimeTaskExecuted", detail, createdAt: new Date().toISOString() }, ...state.events]
      };
    }),
  resetRuntimeActions: () => set({ actions: initialRuntimeActions })
});
