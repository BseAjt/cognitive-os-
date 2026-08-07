import type { StateCreator } from "zustand";
import { buildCognitiveDiff } from "../lib/cognitive-diff.ts";
import { buildCognitiveRecall } from "../lib/cognitive-recall.ts";
import { buildCognitiveProfile } from "../lib/cognitive-dna.ts";
import { projectKnowledgeGraph } from "../lib/knowledge-graph-runtime.ts";
import { learningEventsFromDiff } from "../lib/learning-events.ts";
import { buildReflection } from "../lib/reflection-engine.ts";
import type { DossierObjectRecord } from "../domain/canonical.ts";
import type { ExecutiveCommands, ExecutiveState } from "./types.ts";

export const createExecutiveCommands: StateCreator<ExecutiveState, [], [], ExecutiveCommands> = (set, get) => ({
  applyRuntimeCycle: ({ caseId, userText, result, createdAt }) => {
    const timestamp = createdAt ?? new Date().toISOString();
    set((state) => {
      const currentCase = state.cases.find((cognitiveCase) => cognitiveCase.id === caseId);
      const previousRecall = currentCase ? buildCognitiveRecall({ cognitiveCase: currentCase, decisions: state.decisions, actions: state.actions, memories: state.memories, reasoningRevisions: state.reasoningRevisions, knowledgeEntities: state.knowledgeEntities, knowledgeRelations: state.knowledgeRelations, agentRuns: state.agentRuns, learningEvents: state.learningEvents, reflections: state.reflections }) : undefined;
      const cognitiveDiff = currentCase ? buildCognitiveDiff({ cognitiveCase: currentCase, currentMessage: userText, previousRecall, previousMemories: state.memories, previousKnowledge: state.knowledgeRecords, previousDecisions: state.decisions, previousActions: state.actions, currentCycle: result }) : undefined;
      const learningEvents = cognitiveDiff ? learningEventsFromDiff(caseId, cognitiveDiff, timestamp) : [];
      const reflection = cognitiveDiff ? buildReflection({ caseId, diff: cognitiveDiff, learningEvents, createdAt: timestamp }) : undefined;
      const decision = result.decision ? { id: crypto.randomUUID(), caseId, recommendation: result.decision.recommendation, outcome: result.decision.outcome, rationale: result.decision.rationale, confidence: result.decision.confidence, createdAt: timestamp } : undefined;
      const actions = result.actions.map((action) => ({ id: crypto.randomUUID(), caseId, title: action.title, owner: action.preferredAgentName ?? "À assigner", progress: 0, status: "todo" as const, requiredCapability: action.requiredCapability, assignedAgentId: action.preferredAgentId ?? null }));
      const agentRun = { id: crypto.randomUUID(), caseId, orchestratorId: result.agents.orchestratorId, selectedAgentIds: result.agents.selectedAgentIds, contributions: result.agents.contributions, synthesis: result.agents.synthesis, confidence: result.agents.confidence, createdAt: timestamp };
      const memories = result.memory.map((memory) => ({ id: crypto.randomUUID(), caseId, kind: memory.kind, content: memory.content, confidence: memory.confidence, durable: memory.durable, source: "unified_runtime" as const, createdAt: timestamp }));
      const knowledgeRecords = result.knowledge.map((knowledge) => ({ id: crypto.randomUUID(), caseId, type: knowledge.type, title: knowledge.title, confidence: knowledge.confidence, source: "unified_runtime" as const, createdAt: timestamp }));
      const reasoningRevisions = result.reasoning.map((revision) => { const existingCount = state.reasoningRevisions.filter((item) => item.caseId === caseId && item.stepId === revision.stepId).length; return { id: crypto.randomUUID(), caseId, stepId: revision.stepId, version: existingCount, content: revision.content, confidence: revision.confidence, risk: revision.risk, createdAt: timestamp }; });
      const profile = buildCognitiveProfile({ caseId, decisions: decision ? [decision, ...state.decisions] : state.decisions, learningEvents: [...learningEvents, ...state.learningEvents], reflections: reflection ? [reflection, ...state.reflections] : state.reflections, previous: state.cognitiveProfiles.find((item) => item.caseId === caseId), createdAt: timestamp });
      const projectedCase = currentCase ? { ...currentCase, ...result.conversation.casePatch } : undefined;
      const graph = projectedCase ? projectKnowledgeGraph({ cognitiveCase: projectedCase, knowledgeRecords, memories, learningEvents, reflections: reflection ? [reflection] : [], decision, actions, createdAt: timestamp }) : { entities: [], relations: [] };
      const profileEntity = { id: `cognitive-profile:${caseId}`, organizationId: "executiveos", caseId, type: "cognitive_profile" as const, title: `Cognitive DNA · calibration ${profile.calibration}% · learning ${profile.learningQuality}%`, status: profile.biasSignals.length ? "watch" : "stable", createdAt: profile.createdAt, updatedAt: profile.updatedAt, source: profile.source };
      const profileRelation = { id: `relation:cognitive-profile:${caseId}`, organizationId: "executiveos", caseId, sourceId: profileEntity.id, sourceType: "cognitive_profile" as const, targetId: `case:${caseId}`, targetType: "decision_case" as const, relationType: "MEASURES" as const, confidence: profile.calibration, provenance: profile.source, validFrom: profile.updatedAt };
      const conversationObjects: DossierObjectRecord[] = result.conversation.extractions
        .filter((item) => item.kind !== "decision" && item.kind !== "action")
        .map((item) => ({ id: crypto.randomUUID(), caseId, type: item.kind, title: item.text, confidence: item.confidence, status: item.kind === "question" ? "open" : "active", source: "conversation", createdAt: timestamp, updatedAt: timestamp }));
      const decisionObject: DossierObjectRecord[] = decision ? [{ id: crypto.randomUUID(), caseId, type: "decision", title: decision.outcome, confidence: decision.confidence, status: "resolved", source: "decision", referenceId: decision.id, createdAt: timestamp, updatedAt: timestamp }] : [];
      const actionObjects: DossierObjectRecord[] = actions.map((action) => ({ id: crypto.randomUUID(), caseId, type: "action", title: action.title, confidence: 85, status: "active", source: "action", referenceId: action.id, createdAt: timestamp, updatedAt: timestamp }));
      const caseObjects = [...conversationObjects, ...decisionObject, ...actionObjects];
      const events = [
        { id: crypto.randomUUID(), type: "RuntimeCycleCompleted", detail: `${result.trace.filter((item) => item.status === "completed").length} étapes · ${memories.filter((item) => item.durable).length} mémoires · ${knowledgeRecords.length} connaissances`, createdAt: timestamp },
        { id: crypto.randomUUID(), type: "AgentCouncilCompleted", detail: `ORION · ${result.agents.selectedAgentIds.length} perspective(s) interne(s) · confiance ${result.agents.confidence}%`, createdAt: timestamp },
        ...(caseObjects.length ? [{ id: crypto.randomUUID(), type: "DossierObjectsCreated", detail: `${caseObjects.length} objet(s) métier créés depuis la conversation`, createdAt: timestamp }] : []),
        ...(learningEvents.length ? [{ id: crypto.randomUUID(), type: "LearningPersisted", detail: `${learningEvents.length} apprentissage(s) · impact ${cognitiveDiff?.significance ?? "none"}`, createdAt: timestamp }] : []),
        ...(reflection ? [{ id: crypto.randomUUID(), type: "ReflectionPersisted", detail: `${reflection.significance} · confiance ${reflection.confidence}%`, createdAt: timestamp }] : []),
        { id: crypto.randomUUID(), type: "CognitiveProfileUpdated", detail: `Calibration ${profile.calibration}% · stabilité ${profile.beliefStability}% · apprentissage ${profile.learningQuality}%`, createdAt: timestamp },
        ...(decision ? [{ id: crypto.randomUUID(), type: "DecisionCaptured", detail: decision.outcome, createdAt: timestamp }] : []),
        ...actions.map((action) => ({ id: crypto.randomUUID(), type: "ActionCreated", detail: action.assignedAgentId ? `${action.title} → ${action.owner}` : action.title, createdAt: timestamp }))
      ];
      return {
        cases: state.cases.map((cognitiveCase) => cognitiveCase.id === caseId ? { ...cognitiveCase, ...result.conversation.casePatch } : cognitiveCase),
        messages: [...state.messages, { id: crypto.randomUUID(), caseId, role: "user" as const, text: userText, createdAt: timestamp }, { id: crypto.randomUUID(), caseId, role: "assistant" as const, text: result.conversation.response, createdAt: timestamp }],
        caseObjects: caseObjects.length ? [...caseObjects, ...state.caseObjects] : state.caseObjects,
        decisions: decision ? [decision, ...state.decisions] : state.decisions,
        actions: actions.length ? [...actions, ...state.actions] : state.actions,
        agentRuns: [agentRun, ...state.agentRuns],
        learningEvents: learningEvents.length ? [...learningEvents, ...state.learningEvents] : state.learningEvents,
        reflections: reflection ? [reflection, ...state.reflections] : state.reflections,
        cognitiveProfiles: [profile, ...state.cognitiveProfiles.filter((item) => item.caseId !== caseId)],
        memories: memories.length ? [...memories, ...state.memories] : state.memories,
        knowledgeRecords: knowledgeRecords.length ? [...knowledgeRecords, ...state.knowledgeRecords] : state.knowledgeRecords,
        knowledgeEntities: mergeById(state.knowledgeEntities, [...graph.entities, profileEntity]),
        knowledgeRelations: mergeById(state.knowledgeRelations, [...graph.relations, profileRelation]),
        reasoningRevisions: reasoningRevisions.length ? [...state.reasoningRevisions, ...reasoningRevisions] : state.reasoningRevisions,
        kernelTransactions: [result.kernel, ...state.kernelTransactions.filter((item) => item.id !== result.kernel.id)],
        kernelEvents: [...result.kernelEvents, ...state.kernelEvents.filter((item) => item.transactionId !== result.kernel.id)],
        events: [...events, ...state.events]
      };
    });
  },
  recordConversationTurn: ({ caseId, userText, assistantText, intent, extractionCount, casePatch, createdAt }) => { const timestamp = createdAt ?? new Date().toISOString(); set((state) => ({ cases: state.cases.map((cognitiveCase) => cognitiveCase.id === caseId ? { ...cognitiveCase, ...casePatch } : cognitiveCase), messages: [...state.messages, { id: crypto.randomUUID(), caseId, role: "user", text: userText, createdAt: timestamp }, { id: crypto.randomUUID(), caseId, role: "assistant", text: assistantText, createdAt: timestamp }], events: [{ id: crypto.randomUUID(), type: "ConversationParsed", detail: `${intent} · ${extractionCount} objets détectés`, createdAt: timestamp }, ...state.events] })); },
  captureDecision: ({ caseId, text, recommendation, confidence, rationale, createdAt }) => { const timestamp=createdAt??new Date().toISOString(); const id=crypto.randomUUID(); set((state)=>({decisions:[{id,caseId,recommendation,outcome:text,rationale:rationale??"Décision extraite de la conversation.",confidence,createdAt:timestamp},...state.decisions],caseObjects:[{id:crypto.randomUUID(),caseId,type:"decision",title:text,confidence,status:"resolved",source:"decision",referenceId:id,createdAt:timestamp,updatedAt:timestamp},...state.caseObjects],events:[{id:crypto.randomUUID(),type:"DecisionCaptured",detail:text,createdAt:timestamp},...state.events]})); },
  createAction: ({ caseId, title, owner, requiredCapability }) => { const timestamp=new Date().toISOString(); const id=crypto.randomUUID(); set((state)=>({actions:[{id,caseId,title,owner:owner??"À assigner",progress:0,status:"todo",requiredCapability},...state.actions],caseObjects:[{id:crypto.randomUUID(),caseId,type:"action",title,confidence:80,status:"active",source:"action",referenceId:id,createdAt:timestamp,updatedAt:timestamp},...state.caseObjects],events:[{id:crypto.randomUUID(),type:"ActionCreated",detail:title,createdAt:timestamp},...state.events]})); },
  applyCriticalSignal: () => {
    const timestamp = new Date().toISOString();
    const activeCaseId = get().activeCaseId;
    set((state) => ({
      cases: state.cases.map((cognitiveCase) => cognitiveCase.id === activeCaseId ? {
        ...cognitiveCase,
        context: "Les utilisateurs pilotes remettent en cause la disposition à payer sans intégration calendrier.",
        signals: { ...cognitiveCase.signals, confidence: 41, urgency: 10, risk: 9 }
      } : cognitiveCase),
      events: [{ id: crypto.randomUUID(), type: "CriticalSignalDetected", detail: "La disposition à payer devient incertaine.", createdAt: timestamp }, ...state.events]
    }));
  }
});
function mergeById<T extends {id:string}>(current:T[],incoming:T[]):T[]{const map=new Map(current.map((item)=>[item.id,item]));for(const item of incoming)map.set(item.id,item);return [...map.values()];}
