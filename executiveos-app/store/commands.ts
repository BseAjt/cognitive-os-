import type { StateCreator } from "zustand";
import type { ExecutiveCommands, ExecutiveState } from "@/store/types";

export const createExecutiveCommands: StateCreator<ExecutiveState, [], [], ExecutiveCommands> = (set, get) => ({
  recordConversationTurn: ({ caseId, userText, assistantText, intent, extractionCount, challengePatch, createdAt }) => {
    const timestamp = createdAt ?? new Date().toISOString();
    set((state) => ({
      challenges: state.challenges.map((challenge) => challenge.id === caseId ? { ...challenge, ...challengePatch } : challenge),
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

  createAction: ({ caseId, title, owner }) => {
    const timestamp = new Date().toISOString();
    set((state) => ({
      actions: [{
        id: crypto.randomUUID(),
        caseId,
        title,
        owner: owner ?? "À assigner",
        progress: 0,
        status: "todo"
      }, ...state.actions],
      events: [{ id: crypto.randomUUID(), type: "ActionCreated", detail: title, createdAt: timestamp }, ...state.events]
    }));
  },

  applyCriticalSignal: () => {
    const timestamp = new Date().toISOString();
    const activeCaseId = get().activeChallengeId;
    set((state) => ({
      challenges: state.challenges.map((challenge) =>
        challenge.id === activeCaseId
          ? {
              ...challenge,
              confidence: 41,
              urgency: 10,
              risk: 9,
              context: "Les utilisateurs pilotes remettent en cause la disposition à payer sans intégration calendrier."
            }
          : challenge
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
