export type CognitiveCaseState = "explore" | "decide" | "execute" | "learn";
export type ActionStatus = "todo" | "doing" | "done" | "blocked";
export type AgentStatus = "online" | "busy" | "offline";
export type ContextDomain = "strategy" | "finance" | "people" | "operations" | "market" | "legal" | "history" | "governance";
export type ContextKind = "fact" | "hypothesis" | "constraint" | "preference" | "uncertainty" | "goal";
export type ContextRequirement = "required" | "important" | "optional";
export type ContextStatus = "missing" | "draft" | "verified" | "stale" | "contested";
export type MemoryKind = "goal" | "hypothesis" | "risk" | "decision" | "action" | "question" | "context";
export type LearningEventType = "BeliefAdded" | "BeliefReinforced" | "BeliefInvalidated" | "ConfidenceChanged" | "DecisionReversed" | "RiskDetected" | "RiskResolved" | "ContradictionDetected" | "KnowledgeLearned";
export type DossierObjectType = "question" | "goal" | "hypothesis" | "context" | "risk" | "decision" | "action";
export type DossierObjectStatus = "open" | "active" | "resolved" | "superseded";
export type ContextSourceType = "note" | "url" | "document" | "message" | "meeting";
export type ContextSourceStatus = "processing" | "ready" | "failed";

export interface CognitiveCase { id:string; title:string; objective:string; workingHypothesis:string; context:string; state:CognitiveCaseState; signals:{ impact:number; urgency:number; confidence:number; cognitiveCost:number; risk:number } }
export interface DecisionRecord { id:string; caseId:string; recommendation:string; outcome:string; rationale:string; confidence:number; createdAt:string }
export interface AgentContract { id:string; name:string; role:string; specialty:string; capabilities:string[]; status:AgentStatus; version:string }
export interface AgentContributionRecord { agentId:string; agentName:string; focus:string; content:string; confidence:number }
export interface AgentRunRecord { id:string; caseId:string; orchestratorId:string; selectedAgentIds:string[]; contributions:AgentContributionRecord[]; synthesis:string; confidence:number; createdAt:string }
export interface ActionRecord { id:string; caseId:string; title:string; owner:string; progress:number; status:ActionStatus; requiredCapability?:string; assignedAgentId?:string|null; blockedReason?:string; dueAt?:string|null; result?:string }
export interface CognitiveEventRecord { id:string; type:string; detail:string; createdAt:string }
export interface DossierObjectRecord { id:string; caseId:string; type:DossierObjectType; title:string; confidence:number; status:DossierObjectStatus; source:"conversation"|"decision"|"action"|"migration"; referenceId?:string; createdAt:string; updatedAt:string }
export interface LearningEventRecord { id:string; caseId:string; type:LearningEventType; title:string; detail:string; significance:"none"|"low"|"medium"|"high"; confidence?:number; source:"cognitive_diff"; createdAt:string }
export interface ReflectionRecord { id:string; caseId:string; summary:string; whatChanged:string[]; whyItChanged:string[]; learned:string[]; uncertainties:string[]; decisionsToReconsider:string[]; confidence:number; significance:"none"|"low"|"medium"|"high"; source:"reflection_engine"; createdAt:string }
export interface CognitiveProfileRecord { id:string; caseId:string; calibration:number; beliefStability:number; revisionRate:number; riskDiscipline:number; learningQuality:number; dominantPatterns:string[]; biasSignals:string[]; sampleSize:number; source:"cognitive_dna"; createdAt:string; updatedAt:string }
export interface MemoryRecord { id:string; caseId:string; kind:MemoryKind; content:string; confidence:number; durable:boolean; source:"unified_runtime"|"manual"|"migration"; createdAt:string }
export interface KnowledgeRecord { id:string; caseId:string; type:"context_item"|"risk"|"decision"|"action"|"insight"; title:string; confidence:number; source:"unified_runtime"|"manual"|"migration"; createdAt:string }
export interface ContextRecord { id:string; caseId:string; domain:ContextDomain; kind:ContextKind; key:string; label:string; value:string; confidence:number; requirement:ContextRequirement; status:ContextStatus; unit?:string; source?:string; owner?:string; capturedAt?:string; validUntil?:string }
export interface DecisionOptionModel { title:string; description:string; score:number|null }
export type DecisionCategory = "hiring"|"investment"|"launch"|"pricing"|"partnership"|"workforce_restructuring"|"generic";
export interface DecisionModel { question:string; category:DecisionCategory; criteria:string[]; options:DecisionOptionModel[]; recommendation:string|null; confidence:number|null; missingInformation:string[]; reviewTrigger:string; classifications:string[]; requiredAgents:string[]; requiresContext:boolean }
export type KnowledgeEntityType = "organization"|"organizational_unit"|"person"|"goal"|"kpi"|"project"|"decision_case"|"context_item"|"scenario"|"assessment"|"decision"|"review_trigger"|"outcome"|"risk"|"opportunity"|"action"|"commitment"|"experience"|"evidence"|"memory"|"learning"|"insight"|"customer"|"supplier"|"product"|"process"|"application"|"contract"|"market"|"cognitive_profile";
export type KnowledgeRelationType = "PART_OF"|"MEMBER_OF"|"REPORTS_TO"|"OWNS"|"SPONSORS"|"SUPPORTS"|"MEASURES"|"ADVANCES"|"CONFLICTS_WITH"|"DEPENDS_ON"|"CONCERNS"|"USES_CONTEXT"|"CONSIDERS"|"ASSESSED_BY"|"SELECTS"|"REJECTS"|"RESULTS_IN"|"REQUIRES_REVIEW_WHEN"|"DERIVED_FROM"|"SUPPORTED_BY"|"CONTRADICTED_BY"|"SUPERSEDES"|"VALIDATES"|"INVALIDATES"|"LEARNED_FROM"|"CREATES"|"ASSIGNED_TO"|"BLOCKS"|"MITIGATES"|"MONITORS"|"ACHIEVES"|"AFFECTS";
export interface KnowledgeEntity { id:string; organizationId:string; caseId?:string; type:KnowledgeEntityType; title:string; status:string; createdAt:string; updatedAt:string; source?:string }
export interface KnowledgeRelation { id:string; organizationId:string; caseId?:string; sourceId:string; sourceType:KnowledgeEntityType; targetId:string; targetType:KnowledgeEntityType; relationType:KnowledgeRelationType; confidence:number; provenance:string; validFrom:string; validTo?:string }
export interface ExecutiveBriefing { systemHealth:number; openDecisions:number; criticalRisks:number; invalidatedHypotheses:number; dueCommitments:number; newKnowledge:number; recommendation:string }
export interface KnowledgeSnapshot { entities:KnowledgeEntity[]; relations:KnowledgeRelation[]; briefing:ExecutiveBriefing }
export interface ContextSourceRecord { id:string; caseId:string; type:ContextSourceType; title:string; origin:string; mimeType?:string; status:ContextSourceStatus; rawContent:string; summary:string; wordCount:number; createdAt:string; processedAt?:string; error?:string }
export interface ContextEvidenceRecord { id:string; caseId:string; sourceId:string; claim:string; excerpt:string; confidence:number; position:number; createdAt:string }
export interface CaseContextSynthesis { caseId:string; summary:string; keyFacts:string[]; openQuestions:string[]; sourceIds:string[]; generatedAt:string }
export type ExecutiveCycleStatus = "completed"|"blocked";
export interface ExecutiveCycleContribution { agentId:string; agentName:string; mandate:string; position:"support"|"challenge"|"conditional"; analysis:string; confidence:number; evidenceIds:string[]; citations:string[] }
export interface ExecutiveCycleDivergence { topic:string; agentIds:string[]; description:string; resolution:string }
export interface ExecutiveCycleRecord { id:string; caseId:string; objective:string; status:ExecutiveCycleStatus; selectedAgentIds:string[]; contributions:ExecutiveCycleContribution[]; divergences:ExecutiveCycleDivergence[]; synthesis:string; recommendation:string|null; confidence:number; missingEvidence:string[]; sourceIds:string[]; createdAt:string }
export type DecisionActionPlanStatus = "active"|"completed";
export interface ExecutionMetric { id:string; label:string; target:string; current:string; owner:string }
export interface ActionDependency { actionId:string; dependsOnActionId:string }
export interface DecisionActionPlanRecord { id:string; caseId:string; executiveCycleId:string; decisionId:string; recommendation:string; status:DecisionActionPlanStatus; actionIds:string[]; dependencies:ActionDependency[]; metrics:ExecutionMetric[]; checkpointAt:string; createdAt:string }
export type DecisionWatchStatus = "stable"|"watch"|"reopen";
export type DecisionWatchSignalType = "new_evidence"|"contradiction"|"blocked_action"|"checkpoint_due";
export interface DecisionWatchSignal { id:string; type:DecisionWatchSignalType; severity:"info"|"warning"|"critical"; title:string; detail:string; sourceId?:string; evidenceId?:string; citation?:string }
export interface DecisionWatchRecord { id:string; caseId:string; planId:string; decisionId:string; status:DecisionWatchStatus; signals:DecisionWatchSignal[]; summary:string; recommendedAction:string; evaluatedAt:string }
