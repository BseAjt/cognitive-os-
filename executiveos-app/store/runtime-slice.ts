import type { StateCreator } from "zustand";
import { assignAction, transitionAction } from "../lib/executive-runtime.ts";
import { buildCognitiveRecall } from "../lib/cognitive-recall.ts";
import { runRuntimeActionExecution } from "../lib/runtime-action-execution.ts";
import { initialAgentRuns, initialAgents, initialReasoningRevisions, initialRuntimeActions } from "./seed.ts";
import type { ExecutiveState, RuntimeSlice } from "./types.ts";

export const createRuntimeSlice: StateCreator<ExecutiveState, [], [], RuntimeSlice> = (set, get) => ({
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
  startRuntimeAction: (actionId) => {
    runActionCycle("prepare", actionId, get, set);
  },
  executeRuntimeAction: (actionId) =>
    runActionCycle("execute", actionId, get, set),
  resetRuntimeActions: () => set({ actions: initialRuntimeActions })
});

function runActionCycle(
  phase: "prepare" | "execute",
  actionId: string,
  get: () => ExecutiveState,
  set: Parameters<StateCreator<ExecutiveState, [], [], RuntimeSlice>>[0]
) {
  const state = get();
  const current = state.actions.find((action) => action.id === actionId);
  if (!current) throw new Error("Action introuvable dans le runtime.");
  const cognitiveCase = state.cases.find((item) => item.id === current.caseId);
  if (!cognitiveCase) throw new Error("Dossier introuvable pour cette action.");

  const assigned = assignAction(current, state.agents);
  if (assigned.status === "blocked") {
    set((latest) => ({
      actions: latest.actions.map((action) => action.id === actionId ? assigned : action),
      events: [{ id: crypto.randomUUID(), type: "RuntimeTaskBlocked", detail: assigned.blockedReason ?? "Aucun agent compatible.", createdAt: new Date().toISOString() }, ...latest.events]
    }));
    return;
  }

  const recall = buildCognitiveRecall({
    cognitiveCase,
    decisions: state.decisions,
    actions: state.actions,
    memories: state.memories,
    reasoningRevisions: state.reasoningRevisions,
    knowledgeEntities: state.knowledgeEntities,
    knowledgeRelations: state.knowledgeRelations,
    agentRuns: state.agentRuns,
    learningEvents: state.learningEvents,
    reflections: state.reflections
  });
  const execution = runRuntimeActionExecution({
    phase,
    action: assigned,
    cognitiveCase,
    agents: state.agents,
    memories: state.memories,
    knowledgeRecords: state.knowledgeRecords,
    recallSummary: recall.summary
  });
  const timestamp = new Date().toISOString();
  const result = execution.result;
  const blocked = result.kernel.status === "blocked" || result.kernel.status === "failed";
  const nextStatus = blocked ? "blocked" as const : phase === "prepare" ? "doing" as const : "done" as const;
  const progress = nextStatus === "done" ? 100 : nextStatus === "doing" ? Math.max(assigned.progress, 35) : assigned.progress;
  const updatedAction = {
    ...assigned,
    status: nextStatus,
    progress,
    blockedReason: blocked ? result.kernelEvents.find((item) => item.status === "blocked" || item.status === "failed")?.detail ?? "Le Kernel a bloqué l’exécution." : undefined,
    result: execution.summary
  };
  const agentRun = { id: crypto.randomUUID(), caseId: cognitiveCase.id, orchestratorId: result.agents.orchestratorId, selectedAgentIds: result.agents.selectedAgentIds, contributions: result.agents.contributions, synthesis: result.agents.synthesis, confidence: result.agents.confidence, createdAt: timestamp };
  const memories = result.memory.map((item) => ({ id: crypto.randomUUID(), caseId: cognitiveCase.id, kind: item.kind, content: item.content, confidence: item.confidence, durable: item.durable, source: "unified_runtime" as const, createdAt: timestamp }));
  const knowledgeRecords = result.knowledge.map((item) => ({ id: crypto.randomUUID(), caseId: cognitiveCase.id, type: item.type, title: item.title, confidence: item.confidence, source: "unified_runtime" as const, createdAt: timestamp }));
  const reasoningRevisions = result.reasoning.map((item) => ({ id: crypto.randomUUID(), caseId: cognitiveCase.id, stepId: item.stepId, version: state.reasoningRevisions.filter((revision) => revision.caseId === cognitiveCase.id && revision.stepId === item.stepId).length + 1, content: item.content, confidence: item.confidence, risk: item.risk, createdAt: timestamp }));

  set((latest) => ({
    actions: latest.actions.map((action) => action.id === actionId ? updatedAction : action),
    agentRuns: [agentRun, ...latest.agentRuns],
    memories: [...memories, ...latest.memories],
    knowledgeRecords: [...knowledgeRecords, ...latest.knowledgeRecords],
    reasoningRevisions: [...latest.reasoningRevisions, ...reasoningRevisions],
    kernelTransactions: [result.kernel, ...latest.kernelTransactions.filter((item) => item.id !== result.kernel.id)],
    kernelEvents: [...result.kernelEvents, ...latest.kernelEvents.filter((item) => item.transactionId !== result.kernel.id)],
    events: [{
      id: crypto.randomUUID(),
      type: phase === "prepare" ? "RuntimeTaskStarted" : "RuntimeTaskExecuted",
      detail: `${updatedAction.title} · ${result.agents.selectedAgentIds.length} agent(s) · ${result.kernel.completedStages.length} étape(s) Kernel · ${nextStatus}`,
      createdAt: timestamp
    }, ...latest.events]
  }));
}
