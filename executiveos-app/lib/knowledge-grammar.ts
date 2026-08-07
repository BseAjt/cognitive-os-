export type EntityType =
  | "organization" | "person" | "team" | "project" | "goal" | "kpi"
  | "decision" | "decision_case" | "scenario" | "context" | "context_item"
  | "risk" | "opportunity" | "meeting" | "conversation" | "document" | "email"
  | "action" | "commitment" | "learning" | "insight" | "hypothesis" | "fact"
  | "memory";

export type LifecycleStatus = "draft" | "active" | "validated" | "blocked" | "completed" | "superseded" | "archived";

export interface EntityDefinition {
  type: EntityType;
  role: string;
  requiredAttributes: string[];
  optionalAttributes: string[];
  lifecycle: LifecycleStatus[];
  businessRules: string[];
}

export const ENTITY_DEFINITIONS: Record<EntityType, EntityDefinition> = {
  organization: def("organization", "Represents the legal or operating entity governed by ExecutiveOS", ["id","name","ownerId"], ["industry","jurisdiction","strategy","metadata"], ["draft","active","archived"], ["Every entity belongs to one organization","An organization must have one accountable owner"]),
  person: def("person", "Represents an individual actor, stakeholder or decision maker", ["id","name"], ["title","email","teamIds","decisionRights","metadata"], ["draft","active","archived"], ["A person may own decisions, attend meetings, sponsor projects and define goals"]),
  team: def("team", "Represents an organizational group with responsibilities", ["id","name","organizationId"], ["leaderId","memberIds","mandate"], ["draft","active","archived"], ["A team must belong to one organization"]),
  project: def("project", "Represents a bounded initiative delivering outcomes", ["id","title","ownerId","status"], ["goalIds","riskIds","kpiIds","deadline"], ["draft","active","blocked","completed","archived"], ["A project must have an owner and at least one intended outcome"]),
  goal: def("goal", "Represents a strategic or operational objective", ["id","title","ownerId"], ["deadline","priority","kpiIds","parentGoalId"], ["draft","active","completed","superseded","archived"], ["A goal should be measurable through one or more KPIs"]),
  kpi: def("kpi", "Represents a measurable indicator used to monitor performance", ["id","name","ownerId","unit"], ["target","currentValue","source","frequency"], ["draft","active","superseded","archived"], ["A KPI value must include a source and observation date"]),
  decision: def("decision", "Represents a finalized executive choice", ["id","decisionCaseId","selectedScenarioId","ownerId","rationale","status"], ["conditions","reviewTriggerIds","outcomeMetricIds","decidedAt"], ["draft","validated","superseded","archived"], ["A decision cannot be validated without a selected scenario and rationale"]),
  decision_case: def("decision_case", "Represents the complete, evolving dossier used to reach a decision", ["id","title","ownerId","objectiveId","status"], ["contextId","scenarioIds","boardAssessmentIds","selectedScenarioId","rationale","reviewTriggerIds","outcomeMetricIds","deadline"], ["draft","active","blocked","validated","completed","archived"], ["A case cannot be validated while required context is missing","A case must preserve dissenting views and rejected scenarios"]),
  scenario: def("scenario", "Represents one actionable option considered in a decision case", ["id","decisionCaseId","title"], ["assumptions","impacts","dependencies","exitConditions","score","confidence"], ["draft","active","validated","superseded","archived"], ["Scores are forbidden when critical data is missing","Every scenario must expose assumptions and exit conditions"]),
  context: def("context", "Represents the full situational picture of a decision case", ["id","decisionCaseId"], ["itemIds","readiness","capturedAt"], ["draft","active","validated","superseded","archived"], ["Context readiness is computed from required context items"]),
  context_item: def("context_item", "Represents one contextual fact, hypothesis, constraint, preference or uncertainty", ["id","contextId","domain","kind","label"], ["value","source","ownerId","confidence","validFrom","validTo","status","requirement"], ["draft","active","validated","superseded","archived"], ["Every item must preserve provenance","Contested or stale required items block recommendation"]),
  risk: def("risk", "Represents an uncertain event with potential negative impact", ["id","title","ownerId"], ["likelihood","impact","mitigationActionIds","status"], ["draft","active","completed","archived"], ["Critical risks require an owner and mitigation plan"]),
  opportunity: def("opportunity", "Represents an uncertain event with potential positive impact", ["id","title","ownerId"], ["value","probability","actionIds"], ["draft","active","completed","archived"], ["An opportunity should link to at least one goal or decision case"]),
  meeting: def("meeting", "Represents a time-bounded collaborative event", ["id","title","startsAt","attendeeIds"], ["transcript","summary","decisionIds","actionIds","documentIds"], ["draft","active","completed","archived"], ["Extracted knowledge must be validated before becoming authoritative"]),
  conversation: def("conversation", "Represents an exchange that may produce knowledge or decisions", ["id","participantIds","startedAt"], ["messages","summary","memoryIds"], ["active","completed","archived"], ["Conversation-derived facts remain provisional until validated"]),
  document: def("document", "Represents a governed source of organizational knowledge", ["id","title","source"], ["mimeType","version","ownerId","validFrom","validTo","memoryIds"], ["draft","active","superseded","archived"], ["Every document version is immutable once validated"]),
  email: def("email", "Represents a message imported as potential evidence or commitment", ["id","subject","senderId","recipientIds","sentAt"], ["body","attachmentIds","commitmentIds","memoryIds"], ["active","archived"], ["Imported email content is evidence, not automatically a fact"]),
  action: def("action", "Represents executable work created by a decision, risk or commitment", ["id","title","ownerId","status"], ["dueAt","decisionId","projectId","dependencies","result"], ["draft","active","blocked","completed","archived"], ["Completed actions require a result or evidence"]),
  commitment: def("commitment", "Represents an explicit promise made by a person or organization", ["id","title","ownerId","dueAt"], ["counterpartyId","sourceId","status","actionIds"], ["draft","active","completed","superseded","archived"], ["Overdue commitments must surface in the Executive Inbox"]),
  learning: def("learning", "Represents a validated lesson derived from outcomes", ["id","title","sourceIds"], ["statement","confidence","appliesTo","supersedesId"], ["draft","validated","superseded","archived"], ["A learning requires evidence from an outcome or repeated pattern"]),
  insight: def("insight", "Represents a synthesized interpretation that may guide action", ["id","title","sourceIds"], ["statement","confidence","ownerId"], ["draft","active","validated","superseded","archived"], ["Insights must remain distinguishable from facts"]),
  hypothesis: def("hypothesis", "Represents a testable belief about the organization or environment", ["id","statement","ownerId"], ["confidence","evidenceFor","evidenceAgainst","test","deadline"], ["draft","active","validated","superseded","archived"], ["A hypothesis must be falsifiable and reviewable"]),
  fact: def("fact", "Represents a validated statement supported by evidence", ["id","statement","sourceIds"], ["confidence","validFrom","validTo","ownerId"], ["draft","validated","superseded","archived"], ["A fact requires provenance and cannot be silently overwritten"]),
  memory: def("memory", "Represents durable organizational understanding preserved for future reasoning", ["id","title","sourceIds"], ["summary","reasoning","entityIds","version","validFrom","validTo"], ["draft","active","validated","superseded","archived"], ["Memory stores reasoning, not only conclusions","Every update creates a new version"])
};

export type RelationshipType =
  | "OWNS" | "ATTENDS" | "SPONSORS" | "DEFINES" | "BELONGS_TO"
  | "USES_CONTEXT" | "CONSIDERS" | "ASSESSED_BY" | "SELECTS"
  | "CREATES" | "MITIGATES" | "UPDATES" | "SUPPORTS" | "CONTRADICTS"
  | "DERIVED_FROM" | "EVIDENCED_BY" | "RELATES_TO" | "MEASURES"
  | "ADVANCES" | "DEPENDS_ON" | "RESULTS_IN" | "LEARNED_FROM";

export interface RelationshipRule {
  type: RelationshipType;
  from: EntityType[];
  to: EntityType[];
  role: string;
}

export const RELATIONSHIP_RULES: RelationshipRule[] = [
  rel("OWNS", ["person","team"], ["decision","decision_case","project","goal","risk","action","commitment"], "Accountability"),
  rel("ATTENDS", ["person"], ["meeting"], "Participation"),
  rel("SPONSORS", ["person","team"], ["project"], "Executive sponsorship"),
  rel("DEFINES", ["person","team"], ["goal","kpi"], "Definition authority"),
  rel("BELONGS_TO", ["person","team","project"], ["organization","team"], "Organizational membership"),
  rel("USES_CONTEXT", ["decision_case","decision"], ["context","context_item"], "Decision evidence"),
  rel("CONSIDERS", ["decision_case"], ["scenario"], "Option consideration"),
  rel("ASSESSED_BY", ["decision_case","scenario"], ["person","team","insight"], "Assessment"),
  rel("SELECTS", ["decision","decision_case"], ["scenario"], "Choice"),
  rel("CREATES", ["decision","meeting","commitment","risk"], ["action","memory","learning"], "Generated output"),
  rel("MITIGATES", ["decision","action","scenario"], ["risk"], "Risk treatment"),
  rel("UPDATES", ["decision","meeting","document","learning"], ["memory","context","hypothesis"], "Knowledge evolution"),
  rel("SUPPORTS", ["fact","insight","document","email","memory"], ["hypothesis","decision_case","scenario","decision"], "Supporting evidence"),
  rel("CONTRADICTS", ["fact","insight","document","email","memory"], ["hypothesis","fact","decision_case"], "Contradictory evidence"),
  rel("DERIVED_FROM", ["fact","hypothesis","insight","learning","memory"], ["meeting","conversation","document","email","decision"], "Provenance"),
  rel("EVIDENCED_BY", ["fact","hypothesis","learning"], ["document","email","meeting","conversation","kpi"], "Evidence"),
  rel("RELATES_TO", ["organization","person","team","project","goal","risk","opportunity","memory"], ["organization","person","team","project","goal","risk","opportunity","memory"], "Generic semantic relation"),
  rel("MEASURES", ["kpi"], ["goal","project","risk"], "Performance measurement"),
  rel("ADVANCES", ["project","decision","action"], ["goal"], "Strategic contribution"),
  rel("DEPENDS_ON", ["project","scenario","action","decision_case"], ["person","team","project","action","context_item"], "Dependency"),
  rel("RESULTS_IN", ["decision","action","project"], ["fact","learning","memory","kpi"], "Observed outcome"),
  rel("LEARNED_FROM", ["learning","memory"], ["decision","project","meeting","fact"], "Learning provenance")
];

export function validateRelationship(from: EntityType, type: RelationshipType, to: EntityType): boolean {
  return RELATIONSHIP_RULES.some((rule) => rule.type === type && rule.from.includes(from) && rule.to.includes(to));
}

function def(type: EntityType, role: string, requiredAttributes: string[], optionalAttributes: string[], lifecycle: LifecycleStatus[], businessRules: string[]): EntityDefinition {
  return { type, role, requiredAttributes, optionalAttributes, lifecycle, businessRules };
}
function rel(type: RelationshipType, from: EntityType[], to: EntityType[], role: string): RelationshipRule {
  return { type, from, to, role };
}
