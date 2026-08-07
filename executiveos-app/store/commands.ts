import type { StateCreator } from "zustand";
import type { ExecutiveCommands, ExecutiveState } from "./types.ts";

export const createExecutiveCommands: StateCreator<ExecutiveState, [], [], ExecutiveCommands> = (set, get) => ({
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
