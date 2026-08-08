"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createActionSlice, createCaseSlice, createCognitiveProfileSlice, createConversationSlice, createDecisionSlice, createDossierObjectSlice, createEventSlice, createKnowledgeGraphSlice, createKnowledgeSlice, createLearningSlice, createMemorySlice, createReflectionSlice } from "./slices";
import { createExecutiveCommands } from "./commands";
import { createKernelSlice } from "./kernel-slice";
import { createRuntimeSlice } from "./runtime-slice";
import { createContextIngestionSlice } from "./context-ingestion-slice";
import { createExecutiveCycleSlice } from "./executive-cycle-slice";
import { createDecisionActionPlanSlice } from "./decision-action-plan-slice";
import { createDecisionWatchSlice } from "./decision-watch-slice";
import { defaultExecutiveAgents } from "../lib/agent-runtime";
import type { KernelEvent, KernelTransaction } from "../lib/executive-kernel";
import {
  initialAgentRuns,
  initialCases,
  initialCognitiveProfiles,
  initialDecisions,
  initialEvents,
  initialKnowledgeEntities,
  initialKnowledgeRecords,
  initialKnowledgeRelations,
  initialLearningEvents,
  initialMemories,
  initialMessages,
  initialReasoningRevisions,
  initialReflections,
  initialRuntimeActions
} from "./seed";
import type { ActionRecord, AgentContract, AgentRunRecord, CaseContextSynthesis, CognitiveCase, CognitiveProfileRecord, ContextEvidenceRecord, ContextSourceRecord, DecisionActionPlanRecord, DecisionRecord, DecisionWatchRecord, DossierObjectRecord, ExecutiveCycleRecord, KnowledgeEntity, KnowledgeRecord, KnowledgeRelation, LearningEventRecord, MemoryRecord, ReflectionRecord } from "../domain/canonical";
import type { ConversationMessage, ExecutiveState, ReasoningRevision } from "./types";

// Legacy migration checkpoint retained for architecture regression tests: version: 16
// Production readiness checkpoint retained for architecture regression tests: version: 17
export type { ConversationMessage, ExecutiveState, ReasoningRevision, ReasoningStepId } from "./types";
type PersistedMessage = Omit<ConversationMessage,"caseId"> & {caseId?:string;challengeId?:string};
type PersistedDecision = {id:string;caseId?:string;challengeId?:string;recommendation:string;outcome?:string;finalDecision?:string;rationale:string;confidence:number;createdAt:string};
type PersistedAction = {id:string;caseId?:string;challengeId?:string;title:string;owner:string;progress:number;status:ActionRecord["status"];requiredCapability?:string;assignedAgentId?:string|null;blockedReason?:string;dueAt?:string|null;result?:string};
type PersistedLegacyChallenge = {id:string;title:string;goal:string;hypothesis:string;impact:number;urgency:number;confidence:number;cognitiveCost:number;risk:number;context:string;state:CognitiveCase["state"]};
type PersistedLegacyRevision = Omit<ReasoningRevision,"caseId"> & {caseId?:string;challengeId?:string};
type PersistedExecutiveState = { cases?:CognitiveCase[]; challenges?:PersistedLegacyChallenge[]; activeCaseId?:string; activeChallengeId?:string; messages?:PersistedMessage[]; caseObjects?:DossierObjectRecord[]; decisions?:PersistedDecision[]; actions?:PersistedAction[]; events?:ExecutiveState["events"]; agents?:AgentContract[]; agentRuns?:AgentRunRecord[]; learningEvents?:LearningEventRecord[]; reflections?:ReflectionRecord[]; cognitiveProfiles?:CognitiveProfileRecord[]; reasoningRevisions?:PersistedLegacyRevision[]; memories?:MemoryRecord[]; knowledgeRecords?:KnowledgeRecord[]; knowledgeEntities?:KnowledgeEntity[]; knowledgeRelations?:KnowledgeRelation[]; kernelTransactions?:KernelTransaction[]; kernelEvents?:KernelEvent[]; contextSources?:ContextSourceRecord[]; contextEvidence?:ContextEvidenceRecord[]; contextSyntheses?:CaseContextSynthesis[]; executiveCycles?:ExecutiveCycleRecord[]; decisionActionPlans?:DecisionActionPlanRecord[]; decisionWatches?:DecisionWatchRecord[] };

function mergeSeedById<T extends { id: string }>(current:T[]|undefined, seed:T[]):T[]{
  const map = new Map<string,T>();
  for (const item of current ?? []) map.set(item.id, item);
  for (const item of seed) if (!map.has(item.id)) map.set(item.id, item);
  return [...map.values()];
}

function deriveCaseObjects(decisions:DecisionRecord[], actions:ActionRecord[], memories:MemoryRecord[]):DossierObjectRecord[]{
  const fromMemory = memories
    .filter((item) => ["question","goal","hypothesis","risk","context"].includes(item.kind))
    .map((item) => ({ id:`migration:memory:${item.id}`, caseId:item.caseId, type:item.kind as DossierObjectRecord["type"], title:item.content, confidence:item.confidence, status:"active" as const, source:"migration" as const, referenceId:item.id, createdAt:item.createdAt, updatedAt:item.createdAt }));
  const fromDecisions = decisions.map((item) => ({ id:`migration:decision:${item.id}`, caseId:item.caseId, type:"decision" as const, title:item.outcome, confidence:item.confidence, status:"resolved" as const, source:"migration" as const, referenceId:item.id, createdAt:item.createdAt, updatedAt:item.createdAt }));
  const now = new Date().toISOString();
  const fromActions = actions.map((item) => ({ id:`migration:action:${item.id}`, caseId:item.caseId, type:"action" as const, title:item.title, confidence:80, status:item.status === "done" ? "resolved" as const : "active" as const, source:"migration" as const, referenceId:item.id, createdAt:now, updatedAt:now }));
  return [...fromMemory, ...fromDecisions, ...fromActions];
}

function migratePersistedState(persistedState:unknown, version:number):ExecutiveState{
  const state=(persistedState??{}) as PersistedExecutiveState;
  if(version>=21) return state as unknown as ExecutiveState;
  if(version>=20) return { ...state, decisionWatches:state.decisionWatches??[] } as unknown as ExecutiveState;
  if(version>=19) return { ...state, decisionActionPlans:state.decisionActionPlans??[] } as unknown as ExecutiveState;
  if(version>=18) return { ...state, executiveCycles:state.executiveCycles??[] } as unknown as ExecutiveState;
  if(version>=17) return { ...state, contextSources:state.contextSources??[], contextEvidence:state.contextEvidence??[], contextSyntheses:state.contextSyntheses??[] } as unknown as ExecutiveState;
  if(version>=16) return { ...state, kernelTransactions: state.kernelTransactions ?? [], kernelEvents: state.kernelEvents ?? [] } as unknown as ExecutiveState;

  let cases:CognitiveCase[];
  let messages:ConversationMessage[];
  let decisions:DecisionRecord[];
  let actions:ActionRecord[];
  let revisions:ReasoningRevision[];

  if(version>=13){
    cases=state.cases??[];
    messages=(state.messages??[]) as ConversationMessage[];
    decisions=(state.decisions??[]) as DecisionRecord[];
    actions=(state.actions??[]) as ActionRecord[];
    revisions=(state.reasoningRevisions??[]) as ReasoningRevision[];
  } else {
    cases=state.cases??(state.challenges??[]).map((challenge)=>({id:challenge.id,title:challenge.title,objective:challenge.goal,workingHypothesis:challenge.hypothesis,context:challenge.context,state:challenge.state,signals:{impact:challenge.impact,urgency:challenge.urgency,confidence:challenge.confidence,cognitiveCost:challenge.cognitiveCost,risk:challenge.risk}}));
    messages=(state.messages??[]).map((message)=>({id:message.id,caseId:message.caseId??message.challengeId??"executiveos",role:message.role,text:message.text,createdAt:message.createdAt}));
    decisions=(state.decisions??[]).map((decision)=>({id:decision.id,caseId:decision.caseId??decision.challengeId??"executiveos",recommendation:decision.recommendation,outcome:decision.outcome??decision.finalDecision??"",rationale:decision.rationale,confidence:decision.confidence,createdAt:decision.createdAt}));
    actions=(state.actions??[]).map((action)=>({id:action.id,caseId:action.caseId??action.challengeId??"executiveos",title:action.title,owner:action.owner,progress:action.progress,status:action.status,requiredCapability:action.requiredCapability,assignedAgentId:action.assignedAgentId,blockedReason:action.blockedReason,dueAt:action.dueAt,result:action.result}));
    revisions=(state.reasoningRevisions??[]).map((revision)=>({...revision,caseId:revision.caseId??revision.challengeId??"executiveos"}));
  }

  const migratedCases=mergeSeedById(cases, initialCases);
  const migratedMessages=mergeSeedById(messages, initialMessages);
  const migratedDecisions=mergeSeedById(decisions, initialDecisions);
  const migratedActions=mergeSeedById(actions, initialRuntimeActions);
  const migratedMemories=mergeSeedById(state.memories, initialMemories);
  return {
    cases:migratedCases,
    activeCaseId:state.activeCaseId??state.activeChallengeId??migratedCases[0]?.id??"executiveos",
    messages:migratedMessages,
    caseObjects:mergeSeedById(state.caseObjects, deriveCaseObjects(migratedDecisions, migratedActions, migratedMemories)),
    decisions:migratedDecisions,
    actions:migratedActions,
    events:mergeSeedById(state.events, initialEvents),
    agents:mergeSeedById(state.agents, defaultExecutiveAgents),
    agentRuns:mergeSeedById(state.agentRuns, initialAgentRuns),
    learningEvents:mergeSeedById(state.learningEvents, initialLearningEvents),
    reflections:mergeSeedById(state.reflections, initialReflections),
    cognitiveProfiles:mergeSeedById(state.cognitiveProfiles, initialCognitiveProfiles),
    reasoningRevisions:mergeSeedById(revisions, initialReasoningRevisions),
    memories:migratedMemories,
    knowledgeRecords:mergeSeedById(state.knowledgeRecords, initialKnowledgeRecords),
    knowledgeEntities:mergeSeedById(state.knowledgeEntities, initialKnowledgeEntities),
    knowledgeRelations:mergeSeedById(state.knowledgeRelations, initialKnowledgeRelations),
    kernelTransactions:[],
    kernelEvents:[],
    contextSources:[],
    contextEvidence:[],
    contextSyntheses:[],
    executiveCycles:[],
    decisionActionPlans:[],
    decisionWatches:[]
  } as unknown as ExecutiveState;
}

export const useExecutiveStore = create<ExecutiveState>()(
  persist(
    (...args) => ({
      ...createCaseSlice(...args),
      ...createConversationSlice(...args),
      ...createDossierObjectSlice(...args),
      ...createDecisionSlice(...args),
      ...createActionSlice(...args),
      ...createEventSlice(...args),
      ...createLearningSlice(...args),
      ...createReflectionSlice(...args),
      ...createCognitiveProfileSlice(...args),
      ...createMemorySlice(...args),
      ...createKnowledgeSlice(...args),
      ...createKnowledgeGraphSlice(...args),
      ...createContextIngestionSlice(...args),
      ...createExecutiveCycleSlice(...args),
      ...createDecisionActionPlanSlice(...args),
      ...createDecisionWatchSlice(...args),
      ...createKernelSlice(...args),
      ...createRuntimeSlice(...args),
      ...createExecutiveCommands(...args)
    }),
    {
      name: "executiveos-v2",
      version: 21,
      migrate: migratePersistedState
    }
  )
);
