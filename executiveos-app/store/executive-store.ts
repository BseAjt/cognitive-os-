"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { assignAction, executeAction, transitionAction } from "@/lib/executive-runtime";
import type { ActionItem, AgentContract, Challenge, CognitiveEvent, Decision } from "@/types/domain";

export interface ConversationMessage {
  id: string;
  challengeId: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

export type ReasoningStepId = "question" | "hypothesis" | "evidence" | "options" | "objections" | "decision" | "consequences";

export interface ReasoningRevision {
  id: string;
  challengeId: string;
  stepId: ReasoningStepId;
  version: number;
  content: string;
  confidence?: number;
  risk?: number;
  createdAt: string;
}

interface ExecutiveState {
  challenges: Challenge[];
  decisions: Decision[];
  actions: ActionItem[];
  agents: AgentContract[];
  events: CognitiveEvent[];
  messages: ConversationMessage[];
  reasoningRevisions: ReasoningRevision[];
  activeChallengeId: string;
  setActiveChallenge: (id: string) => void;
  updateChallenge: (challenge: Challenge) => void;
  addDecision: (decision: Decision) => void;
  addActions: (actions: ActionItem[]) => void;
  addEvent: (type: string, detail: string) => void;
  addMessages: (messages: ConversationMessage[]) => void;
  addReasoningRevision: (revision: Omit<ReasoningRevision, "id" | "version" | "createdAt">) => void;
  clearConversationHistory: (challengeId: string) => void;
  assignRuntimeAction: (actionId: string) => void;
  transitionRuntimeAction: (actionId: string, status: ActionItem["status"]) => void;
  executeRuntimeAction: (actionId: string) => void;
  clearRuntimeActions: () => void;
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

const initialAgents: AgentContract[] = [
  { id: "orion", name: "ORION", role: "Orchestrateur exécutif", specialty: "Synthèse et orchestration", capabilities: ["analysis", "orchestration", "decision"], status: "online", version: "2.0.0" },
  { id: "athena", name: "ATHENA", role: "Chief Strategy Officer", specialty: "Stratégie", capabilities: ["analysis", "strategy", "decision"], status: "online", version: "2.0.0" },
  { id: "turing", name: "TURING", role: "CTO", specialty: "Technologie et architecture", capabilities: ["analysis", "technology", "execution"], status: "online", version: "2.0.0" },
  { id: "seneca", name: "SENECA", role: "Chief Reflection Officer", specialty: "Critique et risques", capabilities: ["analysis", "reflection", "risk"], status: "online", version: "2.0.0" }
];

const initialActions: ActionItem[] = [
  { id: "runtime-context", challengeId: "executiveos", title: "Valider le contrat du Context Engine", owner: "Non affecté", progress: 0, status: "todo", requiredCapability: "analysis" },
  { id: "runtime-architecture", challengeId: "executiveos", title: "Vérifier l’architecture du runtime agentique", owner: "Non affecté", progress: 0, status: "todo", requiredCapability: "technology" }
];

export const useExecutiveStore = create<ExecutiveState>()(
  persist(
    (set) => ({
      challenges: initialChallenges,
      decisions: [],
      actions: initialActions,
      agents: initialAgents,
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
      reasoningRevisions: [],
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
      addReasoningRevision: (revision) =>
        set((state) => {
          const versions = state.reasoningRevisions.filter((item) => item.challengeId === revision.challengeId && item.stepId === revision.stepId);
          const next: ReasoningRevision = {
            ...revision,
            id: crypto.randomUUID(),
            version: versions.length + 1,
            createdAt: new Date().toISOString()
          };
          return {
            reasoningRevisions: [...state.reasoningRevisions, next],
            events: [{ id: crypto.randomUUID(), type: "ReasoningRevisionAdded", detail: `${revision.stepId} · v${next.version}`, createdAt: next.createdAt }, ...state.events]
          };
        }),
      clearConversationHistory: (challengeId) =>
        set((state) => ({
          messages: state.messages.filter((message) => message.challengeId !== challengeId)
        })),
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
      clearRuntimeActions: () => set({ actions: initialActions }),
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
