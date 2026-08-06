"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActionItem, Challenge, CognitiveEvent, Decision } from "@/types/domain";

export interface ConversationMessage {
  id: string;
  challengeId: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

interface ExecutiveState {
  challenges: Challenge[];
  decisions: Decision[];
  actions: ActionItem[];
  events: CognitiveEvent[];
  messages: ConversationMessage[];
  activeChallengeId: string;
  setActiveChallenge: (id: string) => void;
  updateChallenge: (challenge: Challenge) => void;
  addDecision: (decision: Decision) => void;
  addActions: (actions: ActionItem[]) => void;
  addEvent: (type: string, detail: string) => void;
  addMessages: (messages: ConversationMessage[]) => void;
  clearConversationHistory: (challengeId: string) => void;
  runCriticalSimulation: () => void;
}

const initialChallenges: Challenge[] = [
  {
    id: "executiveos",
    title: "Construire ExecutiveOS",
    goal: "Démontrer une nouvelle catégorie logicielle centrée sur la décision.",
    hypothesis: "Les dirigeants paieront pour réduire le coût cognitif de leurs décisions.",
    impact: 10,
    urgency: 8,
    confidence: 72,
    cognitiveCost: 7,
    risk: 7,
    context: "Le Conversation Runtime devient le cœur du produit.",
    state: "decide"
  },
  {
    id: "positioning",
    title: "Valider le positionnement",
    goal: "Créer un message immédiatement compris par les dirigeants.",
    hypothesis: "Decision Operating System est une catégorie claire et mémorisable.",
    impact: 7,
    urgency: 5,
    confidence: 84,
    cognitiveCost: 3,
    risk: 3,
    context: "ExecutiveOS est retenu comme nom produit.",
    state: "explore"
  }
];

export const useExecutiveStore = create<ExecutiveState>()(
  persist(
    (set) => ({
      challenges: initialChallenges,
      decisions: [],
      actions: [],
      events: [],
      messages: [
        {
          id: "welcome",
          challengeId: "executiveos",
          role: "assistant",
          text: "Bonjour Sébastien. Tu reprends ExecutiveOS. Le principal sujet est maintenant la validation du Conversation Runtime. Que souhaites-tu approfondir ?",
          createdAt: new Date().toISOString()
        }
      ],
      activeChallengeId: "executiveos",
      setActiveChallenge: (id) => set({ activeChallengeId: id }),
      updateChallenge: (challenge) =>
        set((state) => ({
          challenges: state.challenges.map((item) => item.id === challenge.id ? challenge : item)
        })),
      addDecision: (decision) => set((state) => ({ decisions: [decision, ...state.decisions] })),
      addActions: (actions) => set((state) => ({ actions: [...actions, ...state.actions] })),
      addEvent: (type, detail) =>
        set((state) => ({
          events: [{ id: crypto.randomUUID(), type, detail, createdAt: new Date().toISOString() }, ...state.events]
        })),
      addMessages: (messages) => set((state) => ({ messages: [...state.messages, ...messages] })),
      clearConversationHistory: (challengeId) =>
        set((state) => ({
          messages: state.messages.filter((message) => message.challengeId !== challengeId)
        })),
      runCriticalSimulation: () =>
        set((state) => ({
          challenges: state.challenges.map((challenge) =>
            challenge.id === "executiveos"
              ? {
                  ...challenge,
                  confidence: 41,
                  urgency: 10,
                  risk: 9,
                  context: "Les utilisateurs pilotes remettent en cause la disposition à payer sans intégration calendrier."
                }
              : challenge
          ),
          events: [{ id: crypto.randomUUID(), type: "CriticalSignalDetected", detail: "La disposition à payer devient incertaine.", createdAt: new Date().toISOString() }, ...state.events]
        }))
    }),
    { name: "executiveos-v2" }
  )
);
