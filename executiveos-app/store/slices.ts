import type { StateCreator } from "zustand";
import type { ExecutiveState, CaseSlice, ConversationSlice, DossierObjectSlice, DecisionSlice, ActionSlice, EventSlice, LearningSlice, ReflectionSlice, CognitiveProfileSlice, MemorySlice, KnowledgeSlice, KnowledgeGraphSlice } from "./types.ts";
import {
  initialCases,
  initialMessages,
  initialRuntimeActions,
  initialDecisions,
  initialEvents,
  initialLearningEvents,
  initialReflections,
  initialCognitiveProfiles,
  initialMemories,
  initialKnowledgeRecords,
  initialKnowledgeEntities,
  initialKnowledgeRelations
} from "./seed.ts";

export const createCaseSlice: StateCreator<ExecutiveState, [], [], CaseSlice> = (set) => ({
  cases: initialCases,
  activeCaseId: "executiveos",
  setActiveCase: (id) => set({ activeCaseId: id }),
  createCase: ({ title, objective, context = "" }) => {
    const id = crypto.randomUUID();
    set((state) => ({
      activeCaseId: id,
      cases: [{
        id,
        title,
        objective,
        workingHypothesis: "À construire",
        context,
        state: "explore",
        signals: { impact: 5, urgency: 5, confidence: 50, cognitiveCost: 5, risk: 4 }
      }, ...state.cases],
      events: [{ id: crypto.randomUUID(), type: "CaseCreated", detail: `Dossier créé · ${title}`, createdAt: new Date().toISOString() }, ...state.events]
    }));
    return id;
  },
  replaceCase: (cognitiveCase) => set((state) => ({ cases: state.cases.map((item) => item.id === cognitiveCase.id ? cognitiveCase : item) })),
  applyCasePatch: (caseId, patch) => set((state) => ({ cases: state.cases.map((item) => item.id === caseId ? { ...item, ...patch } : item) }))
});
export const createConversationSlice: StateCreator<ExecutiveState, [], [], ConversationSlice> = (set) => ({ messages: initialMessages, appendMessages: (messages) => set((state) => ({ messages: [...state.messages, ...messages] })), clearConversationHistory: (caseId) => set((state) => ({ messages: state.messages.filter((message) => message.caseId !== caseId) })) });
export const createDossierObjectSlice: StateCreator<ExecutiveState, [], [], DossierObjectSlice> = (set) => ({ caseObjects: [], prependCaseObjects: (records) => set((state) => ({ caseObjects: [...records, ...state.caseObjects] })) });
export const createDecisionSlice: StateCreator<ExecutiveState, [], [], DecisionSlice> = (set) => ({ decisions: initialDecisions, prependDecision: (decision) => set((state) => ({ decisions: [decision, ...state.decisions] })) });
export const createActionSlice: StateCreator<ExecutiveState, [], [], ActionSlice> = (set) => ({ actions: initialRuntimeActions, prependActions: (actions) => set((state) => ({ actions: [...actions, ...state.actions] })) });
export const createEventSlice: StateCreator<ExecutiveState, [], [], EventSlice> = (set) => ({ events: initialEvents, prependEvent: (event) => set((state) => ({ events: [event, ...state.events] })) });
export const createLearningSlice: StateCreator<ExecutiveState, [], [], LearningSlice> = (set) => ({ learningEvents: initialLearningEvents, prependLearningEvents: (records) => set((state) => ({ learningEvents: [...records, ...state.learningEvents] })) });
export const createReflectionSlice: StateCreator<ExecutiveState, [], [], ReflectionSlice> = (set) => ({ reflections: initialReflections, prependReflection: (record) => set((state) => ({ reflections: [record, ...state.reflections] })) });
export const createCognitiveProfileSlice: StateCreator<ExecutiveState, [], [], CognitiveProfileSlice> = (set) => ({ cognitiveProfiles: initialCognitiveProfiles, upsertCognitiveProfile: (record) => set((state) => ({ cognitiveProfiles: [record, ...state.cognitiveProfiles.filter((item) => item.caseId !== record.caseId)] })) });
export const createMemorySlice: StateCreator<ExecutiveState, [], [], MemorySlice> = (set) => ({ memories: initialMemories, prependMemories: (records) => set((state) => ({ memories: [...records, ...state.memories] })) });
export const createKnowledgeSlice: StateCreator<ExecutiveState, [], [], KnowledgeSlice> = (set) => ({ knowledgeRecords: initialKnowledgeRecords, prependKnowledge: (records) => set((state) => ({ knowledgeRecords: [...records, ...state.knowledgeRecords] })) });
export const createKnowledgeGraphSlice: StateCreator<ExecutiveState, [], [], KnowledgeGraphSlice> = (set) => ({ knowledgeEntities: initialKnowledgeEntities, knowledgeRelations: initialKnowledgeRelations, mergeKnowledgeGraph: (entities, relations) => set((state) => ({ knowledgeEntities: mergeById(state.knowledgeEntities, entities), knowledgeRelations: mergeById(state.knowledgeRelations, relations) })) });
function mergeById<T extends { id: string }>(current:T[], incoming:T[]):T[]{ const map=new Map(current.map((item)=>[item.id,item])); for(const item of incoming) map.set(item.id,item); return [...map.values()]; }
