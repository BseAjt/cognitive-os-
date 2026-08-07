import type { StateCreator } from "zustand";
import { projectKnowledgeGraph } from "../lib/knowledge-graph-runtime.ts";
import type { ExecutiveCommands, ExecutiveState } from "./types.ts";

export const createExecutiveCommands: StateCreator<ExecutiveState, [], [], ExecutiveCommands> = (set, get) => ({
  applyRuntimeCycle: ({ caseId, userText, result, createdAt }) => {
    const timestamp = createdAt ?? new Date().toISOString();
    set((state) => {
      const decision = result.decision
        ? {
            id: crypto.randomUUID(),
            caseId,
            recommendation: result.decision.recommendation,
            outcome: result.decision.outcome,
            rationale: result.decision.rationale,
            confidence: result.decision.confidence,
            createdAt: timestamp
          }
        : undefined;

      const actions = result.actions.map((action) => ({
        id: crypto.randomUUID(),
        caseId,
        title: action.title,
        owner: action.preferredAgentName ?? "À assigner",
        progress: 0,
        status: "todo" as const,
        requiredCapability: action.requiredCapability,
        assignedAgentId: action.preferredAgentId ?? null
      }));

      const agentRun = {
        id: crypto.randomUUID(),
        caseId,
        orchestratorId: result.agents.orchestratorId,
        selectedAgentIds: result.agents.selectedAgentIds,
        contributions: result.agents.contributions,
        synthesis: result.agents.synthesis,
        confidence: result.agents.confidence,
        createdAt: timestamp
      };

      const memories = result.memory.map((memory) => ({
        id: crypto.randomUUID(),
        caseId,
        kind: memory.kind,
        content: memory.content,
        confidence: memory.confidence,
        durable: memory.durable,
        source: "unified_runtime" as const,
        createdAt: timestamp
      }));

      const knowledgeRecords = result.knowledge.map((knowledge) => ({
        id: crypto.randomUUID(),
        caseId,
        type: knowledge.type,
        title: knowledge.title,
        confidence: knowledge.confidence,
        source: "unified_runtime" as const,
        createdAt: timestamp
      }));

      const reasoningRevisions = result.reasoning.map((revision) => {
        const existingCount = state.reasoningRevisions.filter(
          (item) => item.caseId === caseId && item.stepId === revision.stepId
        ).length;
        return {
          id: crypto.randomUUID(),
          caseId,
          stepId: revision.stepId,
          version: existingCount,
          content: revision.content,
          confidence: revision.confidence,
          risk: revision.risk,
          createdAt: timestamp
        };
      });

      const currentCase = state.cases.find((cognitiveCase) => cognitiveCase.id === caseId);
      const projectedCase = currentCase
        ? { ...currentCase, ...result.conversation.casePatch }
        : undefined;
      const graph = projectedCase
        ? projectKnowledgeGraph({
            cognitiveCase: projectedCase,
            knowledgeRecords,
            memories,
            decision,
            actions,
            createdAt: timestamp
          })
        : { entities: [], relations: [] };

      const events = [
        {
          id: crypto.randomUUID(),
          type: "RuntimeCycleCompleted",
          detail: `${result.trace.filter((item) => item.status === "completed").length} étapes · ${memories.filter((item) => item.durable).length} mémoires · ${knowledgeRecords.length} connaissances`,
          createdAt: timestamp
        },
        {
          id: crypto.randomUUID(),
          type: "AgentCouncilCompleted",
          detail: `ORION · ${result.agents.selectedAgentIds.length} spécialiste(s) · confiance ${result.agents.confidence}%`,
          createdAt: timestamp
        },
        ...(memories.length ? [{ id: crypto.randomUUID(), type: "MemoryPersisted", detail: `${memories.length} mémoire(s) persistée(s)`, createdAt: timestamp }] : []),
        ...(knowledgeRecords.length ? [{ id: crypto.randomUUID(), type: "KnowledgePersisted", detail: `${knowledgeRecords.length} connaissance(s) persistée(s)`, createdAt: timestamp }] : []),
        ...(graph.entities.length ? [{ id: crypto.randomUUID(), type: "KnowledgeGraphProjected", detail: `${graph.entities.length} entité(s) · ${graph.relations.length} relation(s)`, createdAt: timestamp }] : []),
        ...(decision ? [{ id: crypto.randomUUID(), type: "DecisionCaptured", detail: decision.outcome, createdAt: timestamp }] : []),
        ...actions.map((action) => ({ id: crypto.randomUUID(), type: "ActionCreated", detail: action.assignedAgentId ? `${action.title} → ${action.owner}` : action.title, createdAt: timestamp }))
      ];

      return {
        cases: state.cases.map((cognitiveCase) =>
          cognitiveCase.id === caseId ? { ...cognitiveCase, ...result.conversation.casePatch } : cognitiveCase
        ),
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), caseId, role: "user" as const, text: userText, createdAt: timestamp },
          { id: crypto.randomUUID(), caseId, role: "assistant" as const, text: result.conversation.response, createdAt: timestamp }
        ],
        decisions: decision ? [decision, ...state.decisions] : state.decisions,
        actions: actions.length ? [...actions, ...state.actions] : state.actions,
        agentRuns: [agentRun, ...state.agentRuns],
        memories: memories.length ? [...memories, ...state.memories] : state.memories,
        knowledgeRecords: knowledgeRecords.length ? [...knowledgeRecords, ...state.knowledgeRecords] : state.knowledgeRecords,
        knowledgeEntities: mergeById(state.knowledgeEntities, graph.entities),
        knowledgeRelations: mergeById(state.knowledgeRelations, graph.relations),
        reasoningRevisions: reasoningRevisions.length ? [...state.reasoningRevisions, ...reasoningRevisions] : state.reasoningRevisions,
        events: [...events, ...state.events]
      };
    });
  },

  recordConversationTurn: ({ caseId, userText, assistantText, intent, extractionCount, casePatch, createdAt }) => {
    const timestamp = createdAt ?? new Date().toISOString();
    set((state) => ({
      cases: state.cases.map((cognitiveCase) => cognitiveCase.id === caseId ? { ...cognitiveCase, ...casePatch } : cognitiveCase),
      messages: [
        ...state.messages,
        { id: crypto.randomUUID(), caseId, role: "user", text: userText, createdAt: timestamp },
        { id: crypto.randomUUID(), caseId, role: "assistant", text: assistantText, createdAt: timestamp }
      ],
      events: [
        { id: crypto.randomUUID(), type: "ConversationParsed", detail: `${intent} · ${extractionCount} objets détectés`, createdAt: timestamp },
        ...state.events
      ]
    }));
  },

  captureDecision: ({ caseId, text, recommendation, confidence, rationale, createdAt }) => {
    const timestamp = createdAt ?? new Date().toISOString();
    set((state) => ({
      decisions: [{
        id: crypto.randomUUID(),
        caseId,
        recommendation,
        outcome: text,
        rationale: rationale ?? "Décision extraite de la conversation.",
        confidence,
        createdAt: timestamp
      }, ...state.decisions],
      events: [{ id: crypto.randomUUID(), type: "DecisionCaptured", detail: text, createdAt: timestamp }, ...state.events]
    }));
  },

  createAction: ({ caseId, title, owner, requiredCapability }) => {
    const timestamp = new Date().toISOString();
    set((state) => ({
      actions: [{
        id: crypto.randomUUID(),
        caseId,
        title,
        owner: owner ?? "À assigner",
        progress: 0,
        status: "todo",
        requiredCapability
      }, ...state.actions],
      events: [{ id: crypto.randomUUID(), type: "ActionCreated", detail: title, createdAt: timestamp }, ...state.events]
    }));
  },

  applyCriticalSignal: () => {
    const timestamp = new Date().toISOString();
    const activeCaseId = get().activeCaseId;
    set((state) => ({
      cases: state.cases.map((cognitiveCase) =>
        cognitiveCase.id === activeCaseId
          ? {
              ...cognitiveCase,
              context: "Les utilisateurs pilotes remettent en cause la disposition à payer sans intégration calendrier.",
              signals: {
                ...cognitiveCase.signals,
                confidence: 41,
                urgency: 10,
                risk: 9
              }
            }
          : cognitiveCase
      ),
      events: [{
        id: crypto.randomUUID(),
        type: "CriticalSignalDetected",
        detail: "La disposition à payer devient incertaine.",
        createdAt: timestamp
      }, ...state.events]
    }));
  }
});

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()];
}
