"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createActionSlice, createCaseSlice, createCognitiveProfileSlice, createConversationSlice, createDecisionSlice, createEventSlice, createKnowledgeGraphSlice, createKnowledgeSlice, createLearningSlice, createMemorySlice, createReflectionSlice } from "./slices";
import { createExecutiveCommands } from "./commands";
import { createRuntimeSlice } from "./runtime-slice";
import { defaultExecutiveAgents } from "../lib/agent-runtime";
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
import type { ActionRecord, AgentContract, AgentRunRecord, CognitiveCase, CognitiveProfileRecord, DecisionRecord, KnowledgeEntity, KnowledgeRecord, KnowledgeRelation, LearningEventRecord, MemoryRecord, ReflectionRecord } from "../domain/canonical";
import type { ConversationMessage, ExecutiveState, ReasoningRevision } from "./types";

export type { ConversationMessage, ExecutiveState, ReasoningRevision, ReasoningStepId } from "./types";
type PersistedMessage = Omit<ConversationMessage,"caseId"> & {caseId?:string;challengeId?:string};
type PersistedDecision = {id:string;caseId?:string;challengeId?:string;recommendation:string;outcome?:string;finalDecision?:string;rationale:string;confidence:number;createdAt:string};
type PersistedAction = {id:string;caseId?:string;challengeId?:string;title:string;owner:string;progress:number;status:ActionRecord["status"];requiredCapability?:string;assignedAgentId?:string|null;blockedReason?:string;dueAt?:string|null;result?:string};
type PersistedLegacyChallenge = {id:string;title:string;goal:string;hypothesis:string;impact:number;urgency:number;confidence:number;cognitiveCost:number;risk:number;context:string;state:CognitiveCase["state"]};
type PersistedLegacyRevision = Omit<ReasoningRevision,"caseId"> & {caseId?:string;challengeId?:string};
type PersistedExecutiveState = { cases?:CognitiveCase[]; challenges?:PersistedLegacyChallenge[]; activeCaseId?:string; activeChallengeId?:string; messages?:PersistedMessage[]; decisions?:PersistedDecision[]; actions?:PersistedAction[]; events?:ExecutiveState["events"]; agents?:AgentContract[]; agentRuns?:AgentRunRecord[]; learningEvents?:LearningEventRecord[]; reflections?:ReflectionRecord[]; cognitiveProfiles?:CognitiveProfileRecord[]; reasoningRevisions?:PersistedLegacyRevision[]; memories?:MemoryRecord[]; knowledgeRecords?:KnowledgeRecord[]; knowledgeEntities?:KnowledgeEntity[]; knowledgeRelations?:KnowledgeRelation[] };

const populated = <T,>(current:T[]|undefined, seed:T[]) => current?.length ? current : seed;

function migratePersistedState(persistedState:unknown, version:number):ExecutiveState{
  const state=(persistedState??{}) as PersistedExecutiveState;
  if(version>=14) return state as ExecutiveState;

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

  const migratedCases=populated(cases, initialCases);
  return {
    cases:migratedCases,
    activeCaseId:state.activeCaseId??state.activeChallengeId??migratedCases[0]?.id??"executiveos",
    messages:populated(messages, initialMessages),
    decisions:populated(decisions, initialDecisions),
    actions:populated(actions, initialRuntimeActions),
    events:populated(state.events, initialEvents),
    agents:state.agents?.length?state.agents:defaultExecutiveAgents,
    agentRuns:populated(state.agentRuns, initialAgentRuns),
    learningEvents:populated(state.learningEvents, initialLearningEvents),
    reflections:populated(state.reflections, initialReflections),
    cognitiveProfiles:populated(state.cognitiveProfiles, initialCognitiveProfiles),
    reasoningRevisions:populated(revisions, initialReasoningRevisions),
    memories:populated(state.memories, initialMemories),
    knowledgeRecords:populated(state.knowledgeRecords, initialKnowledgeRecords),
    knowledgeEntities:populated(state.knowledgeEntities, initialKnowledgeEntities),
    knowledgeRelations:populated(state.knowledgeRelations, initialKnowledgeRelations)
  } as ExecutiveState;
}

export const useExecutiveStore = create<ExecutiveState>()(
  persist(
    (...args) => ({
      ...createCaseSlice(...args),
      ...createConversationSlice(...args),
      ...createDecisionSlice(...args),
      ...createActionSlice(...args),
      ...createEventSlice(...args),
      ...createLearningSlice(...args),
      ...createReflectionSlice(...args),
      ...createCognitiveProfileSlice(...args),
      ...createMemorySlice(...args),
      ...createKnowledgeSlice(...args),
      ...createKnowledgeGraphSlice(...args),
      ...createRuntimeSlice(...args),
      ...createExecutiveCommands(...args)
    }),
    {
      name: "executiveos-v2",
      version: 14,
      migrate: migratePersistedState
    }
  )
);
