import type {
  ActionRecord,
  CognitiveCase,
  DecisionRecord,
  KnowledgeEntity,
  KnowledgeRecord,
  KnowledgeRelation,
  KnowledgeRelationType,
  LearningEventRecord,
  MemoryRecord
} from "../domain/canonical.ts";

export interface KnowledgeGraphProjection {
  entities: KnowledgeEntity[];
  relations: KnowledgeRelation[];
}

export function projectKnowledgeGraph(input: {
  cognitiveCase: CognitiveCase;
  knowledgeRecords: KnowledgeRecord[];
  memories: MemoryRecord[];
  learningEvents?: LearningEventRecord[];
  decision?: DecisionRecord;
  actions: ActionRecord[];
  createdAt: string;
}): KnowledgeGraphProjection {
  const { cognitiveCase, knowledgeRecords, memories, learningEvents = [], decision, actions, createdAt } = input;
  const organizationId = "executiveos";
  const caseEntityId = `case:${cognitiveCase.id}`;

  const caseEntity: KnowledgeEntity = {
    id: caseEntityId,
    organizationId,
    caseId: cognitiveCase.id,
    type: "decision_case",
    title: cognitiveCase.title,
    status: cognitiveCase.state,
    createdAt,
    updatedAt: createdAt,
    source: "unified_runtime"
  };

  const semanticRecords = knowledgeRecords.filter((record) => record.type !== "decision" && record.type !== "action");
  const knowledgeEntities = semanticRecords.map<KnowledgeEntity>((record) => ({
    id: `knowledge:${record.id}`,
    organizationId,
    caseId: cognitiveCase.id,
    type: record.type,
    title: record.title,
    status: "active",
    createdAt: record.createdAt,
    updatedAt: record.createdAt,
    source: record.source
  }));

  const memoryEntities = memories.filter((memory) => memory.durable).map<KnowledgeEntity>((memory) => ({
    id: `memory:${memory.id}`,
    organizationId,
    caseId: cognitiveCase.id,
    type: "memory",
    title: memory.content,
    status: "active",
    createdAt: memory.createdAt,
    updatedAt: memory.createdAt,
    source: memory.source
  }));

  const learningEntities = learningEvents.map<KnowledgeEntity>((event) => ({
    id: `learning:${event.id}`,
    organizationId,
    caseId: cognitiveCase.id,
    type: "learning",
    title: `${event.title} — ${event.detail}`,
    status: event.significance,
    createdAt: event.createdAt,
    updatedAt: event.createdAt,
    source: event.source
  }));

  const decisionEntity: KnowledgeEntity[] = decision ? [{
    id: `decision:${decision.id}`,
    organizationId,
    caseId: cognitiveCase.id,
    type: "decision",
    title: decision.outcome,
    status: "captured",
    createdAt: decision.createdAt,
    updatedAt: decision.createdAt,
    source: "unified_runtime"
  }] : [];

  const actionEntities = actions.map<KnowledgeEntity>((action) => ({
    id: `action:${action.id}`,
    organizationId,
    caseId: cognitiveCase.id,
    type: "action",
    title: action.title,
    status: action.status,
    createdAt,
    updatedAt: createdAt,
    source: "unified_runtime"
  }));

  const relations: KnowledgeRelation[] = [
    ...semanticRecords.map((record) => relation({ id: `relation:knowledge:${record.id}`, organizationId, caseId: cognitiveCase.id, sourceId: `knowledge:${record.id}`, sourceType: record.type, targetId: caseEntityId, targetType: "decision_case", relationType: relationForKnowledge(record.type), confidence: record.confidence, provenance: record.source, validFrom: record.createdAt })),
    ...memories.filter((memory) => memory.durable).map((memory) => relation({ id: `relation:memory:${memory.id}`, organizationId, caseId: cognitiveCase.id, sourceId: `memory:${memory.id}`, sourceType: "memory", targetId: caseEntityId, targetType: "decision_case", relationType: "DERIVED_FROM", confidence: memory.confidence, provenance: memory.source, validFrom: memory.createdAt })),
    ...learningEvents.map((event) => relation({ id: `relation:learning:${event.id}`, organizationId, caseId: cognitiveCase.id, sourceId: `learning:${event.id}`, sourceType: "learning", targetId: caseEntityId, targetType: "decision_case", relationType: relationForLearning(event.type), confidence: event.confidence ?? 80, provenance: event.source, validFrom: event.createdAt })),
    ...(decision ? [relation({ id: `relation:decision:${decision.id}`, organizationId, caseId: cognitiveCase.id, sourceId: caseEntityId, sourceType: "decision_case", targetId: `decision:${decision.id}`, targetType: "decision", relationType: "SELECTS", confidence: decision.confidence, provenance: "unified_runtime", validFrom: decision.createdAt })] : []),
    ...actions.map((action) => relation({ id: `relation:action:${action.id}`, organizationId, caseId: cognitiveCase.id, sourceId: decision ? `decision:${decision.id}` : caseEntityId, sourceType: decision ? "decision" : "decision_case", targetId: `action:${action.id}`, targetType: "action", relationType: decision ? "CREATES" : "RESULTS_IN", confidence: 85, provenance: "unified_runtime", validFrom: createdAt }))
  ];

  return { entities: [caseEntity, ...knowledgeEntities, ...memoryEntities, ...learningEntities, ...decisionEntity, ...actionEntities], relations };
}

function relation(value: KnowledgeRelation): KnowledgeRelation { return value; }
function relationForKnowledge(type: KnowledgeRecord["type"]): KnowledgeRelationType {
  if (type === "risk") return "AFFECTS";
  if (type === "insight") return "DERIVED_FROM";
  return "CONCERNS";
}
function relationForLearning(type: LearningEventRecord["type"]): KnowledgeRelationType {
  if (type === "BeliefInvalidated") return "INVALIDATES";
  if (type === "BeliefReinforced") return "VALIDATES";
  if (type === "ContradictionDetected") return "CONTRADICTED_BY";
  if (type === "RiskResolved") return "MITIGATES";
  return "LEARNED_FROM";
}
