import type { ActionRecord, AgentContract, AgentRunRecord, AuditLogRecord, CaseAccessRecord, CaseContextSynthesis, CognitiveCase, CognitiveEventRecord, CognitiveProfileRecord, CollaborationCommentRecord, CollaborationTargetType, ContextEvidenceRecord, ContextSourceRecord, DecisionActionPlanRecord, DecisionRecord, DecisionWatchRecord, DossierObjectRecord, ExecutiveCycleRecord, ExternalSignalRecord, IdeaRecord, IntegrationConnectionRecord, IntegrationProvider, IntegrationSyncRunRecord, KnowledgeEntity, KnowledgeRecord, KnowledgeRelation, LearningEventRecord, MemoryRecord, OrganizationInvitationRecord, OrganizationMemberRecord, OrganizationRecord, ProjectRecord, ReflectionRecord } from "../domain/canonical.ts";
import type { DecisionToActionResult } from "../lib/decision-to-action.ts";
import type { KernelEvent, KernelTransaction } from "../lib/executive-kernel.ts";
import type { UnifiedRuntimeResult } from "../lib/unified-runtime.ts";

export interface ConversationMessage {
  id: string;
  caseId: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

export type ReasoningStepId = "question" | "hypothesis" | "evidence" | "options" | "objections" | "decision" | "consequences";

export interface ReasoningRevision {
  id: string;
  caseId: string;
  stepId: ReasoningStepId;
  version: number;
  content: string;
  confidence?: number;
  risk?: number;
  createdAt: string;
}

export interface CaseSlice {
  cases: CognitiveCase[];
  activeCaseId: string;
  setActiveCase: (id: string) => void;
  createCase: (input: { title: string; objective: string; context?: string }) => string;
  replaceCase: (cognitiveCase: CognitiveCase) => void;
  applyCasePatch: (caseId: string, patch: Partial<CognitiveCase>) => void;
}

export interface ConversationSlice {
  messages: ConversationMessage[];
  appendMessages: (messages: ConversationMessage[]) => void;
  clearConversationHistory: (caseId: string) => void;
}

export interface DossierObjectSlice {
  caseObjects: DossierObjectRecord[];
  prependCaseObjects: (records: DossierObjectRecord[]) => void;
}

export interface DecisionSlice {
  decisions: DecisionRecord[];
  prependDecision: (decision: DecisionRecord) => void;
}

export interface ActionSlice {
  actions: ActionRecord[];
  prependActions: (actions: ActionRecord[]) => void;
}

export interface EventSlice {
  events: CognitiveEventRecord[];
  prependEvent: (event: CognitiveEventRecord) => void;
}

export interface LearningSlice {
  learningEvents: LearningEventRecord[];
  prependLearningEvents: (records: LearningEventRecord[]) => void;
}

export interface ReflectionSlice {
  reflections: ReflectionRecord[];
  prependReflection: (record: ReflectionRecord) => void;
}

export interface CognitiveProfileSlice {
  cognitiveProfiles: CognitiveProfileRecord[];
  upsertCognitiveProfile: (record: CognitiveProfileRecord) => void;
}

export interface MemorySlice {
  memories: MemoryRecord[];
  prependMemories: (records: MemoryRecord[]) => void;
}

export interface KnowledgeSlice {
  knowledgeRecords: KnowledgeRecord[];
  prependKnowledge: (records: KnowledgeRecord[]) => void;
}

export interface KnowledgeGraphSlice {
  knowledgeEntities: KnowledgeEntity[];
  knowledgeRelations: KnowledgeRelation[];
  mergeKnowledgeGraph: (entities: KnowledgeEntity[], relations: KnowledgeRelation[]) => void;
}

export interface ContextIngestionSlice {
  contextSources: ContextSourceRecord[];
  contextEvidence: ContextEvidenceRecord[];
  contextSyntheses: CaseContextSynthesis[];
  ingestContextSource: (input: { caseId:string; type:ContextSourceRecord["type"]; title:string; origin?:string; mimeType?:string; content:string; createdAt?:string }) => string;
  removeContextSource: (sourceId:string) => void;
}

export interface KernelSlice {
  kernelTransactions: KernelTransaction[];
  kernelEvents: KernelEvent[];
  recordKernelExecution: (transaction: KernelTransaction, events: KernelEvent[]) => void;
}

export interface ExecutiveCycleSlice {
  executiveCycles: ExecutiveCycleRecord[];
  prependExecutiveCycle: (record: ExecutiveCycleRecord) => void;
}

export interface DecisionActionPlanSlice {
  decisionActionPlans: DecisionActionPlanRecord[];
  activateDecisionActionPlan: (result: DecisionToActionResult) => void;
}
export interface DecisionWatchSlice { decisionWatches:DecisionWatchRecord[]; evaluateDecisionPlan:(planId:string,evaluatedAt?:string)=>void }
export interface IntegrationFabricSlice {
  integrationConnections:IntegrationConnectionRecord[];
  integrationSyncRuns:IntegrationSyncRunRecord[];
  connectIntegration:(input:{provider:IntegrationProvider;caseId:string;label?:string;scopes?:string[]})=>string;
  disconnectIntegration:(connectionId:string)=>void;
  syncIntegration:(connectionId:string,signals:ExternalSignalRecord[],startedAt?:string)=>IntegrationSyncRunRecord;
}

export type DemoMode = "investor" | "blank" | "workspace";
export interface InvestorDemoSlice {
  demoMode: DemoMode;
  demoVersion: string;
  projects: ProjectRecord[];
  ideas: IdeaRecord[];
  loadInvestorDemo: () => void;
  createBlankWorkspace: () => void;
}

export interface CollaborationSlice {
  organizations:OrganizationRecord[]; activeOrganizationId:string; activeMemberId:string;
  organizationMembers:OrganizationMemberRecord[]; organizationInvitations:OrganizationInvitationRecord[];
  caseAccess:CaseAccessRecord[]; collaborationComments:CollaborationCommentRecord[]; auditLogs:AuditLogRecord[];
  activateCloudOrganization:(input:{organization:OrganizationRecord;member:OrganizationMemberRecord})=>void;
  inviteMember:(email:string,role:"admin"|"member"|"viewer")=>string;
  addComment:(input:{caseId:string;targetType:CollaborationTargetType;targetId:string;body:string})=>string;
  resolveComment:(commentId:string)=>void;
}

export interface RuntimeSlice {
  agents: AgentContract[];
  agentRuns: AgentRunRecord[];
  reasoningRevisions: ReasoningRevision[];
  addReasoningRevision: (revision: Omit<ReasoningRevision, "id" | "version" | "createdAt">) => void;
  assignRuntimeAction: (actionId: string) => void;
  startRuntimeAction: (actionId: string) => void;
  transitionRuntimeAction: (actionId: string, status: ActionRecord["status"]) => void;
  executeRuntimeAction: (actionId: string) => void;
  resetRuntimeActions: () => void;
}

export interface ExecutiveCommands {
  applyRuntimeCycle: (input: { caseId: string; userText: string; result: UnifiedRuntimeResult; createdAt?: string }) => void;
  recordConversationTurn: (input: { caseId: string; userText: string; assistantText: string; intent: string; extractionCount: number; casePatch: Partial<CognitiveCase>; createdAt?: string }) => void;
  captureDecision: (input: { caseId: string; text: string; recommendation: string; confidence: number; rationale?: string; createdAt?: string }) => void;
  createAction: (input: { caseId: string; title: string; owner?: string; requiredCapability?: string }) => void;
  applyCriticalSignal: () => void;
}

export type ExecutiveState = CaseSlice & ConversationSlice & DossierObjectSlice & DecisionSlice & ActionSlice & EventSlice & LearningSlice & ReflectionSlice & CognitiveProfileSlice & MemorySlice & KnowledgeSlice & KnowledgeGraphSlice & ContextIngestionSlice & ExecutiveCycleSlice & DecisionActionPlanSlice & DecisionWatchSlice & IntegrationFabricSlice & InvestorDemoSlice & CollaborationSlice & KernelSlice & RuntimeSlice & ExecutiveCommands;
