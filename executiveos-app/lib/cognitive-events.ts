import type { ActionRecord, DecisionRecord, DossierObjectRecord, LearningEventRecord, MemoryRecord } from "../domain/canonical.ts";

export type CognitiveEventType =
  | "question"
  | "goal"
  | "hypothesis"
  | "evidence"
  | "analysis"
  | "decision"
  | "revision"
  | "risk"
  | "action"
  | "execution"
  | "outcome"
  | "learning"
  | "memory"
  | "contradiction"
  | "reopen";

export type CognitiveEventActor = "user" | "ORION" | "runtime";
export type CognitiveImpactLevel = "critical" | "high" | "medium" | "low";

export interface CognitiveTimelineEvent {
  id: string;
  caseId: string;
  type: CognitiveEventType;
  timestamp: string;
  actor: CognitiveEventActor;
  title: string;
  summary: string;
  reasoning: string;
  impact: CognitiveImpactLevel;
  confidenceBefore: number | null;
  confidenceAfter: number | null;
  causedBy: string[];
  affects: string[];
  produces: string[];
  metadata: Record<string, string | number | boolean | null>;
}

interface ConversationLike { id:string; caseId:string; role:"user"|"assistant"; text:string; createdAt:string }
interface ReasoningRevisionLike { id:string; caseId:string; stepId:string; version:number; content:string; confidence?:number; risk?:number; createdAt:string }

export interface CognitiveEventProjectionInput {
  caseId: string;
  messages: ConversationLike[];
  caseObjects: DossierObjectRecord[];
  decisions: DecisionRecord[];
  actions: ActionRecord[];
  learningEvents: LearningEventRecord[];
  reasoningRevisions: ReasoningRevisionLike[];
  memories?: MemoryRecord[];
}

function impactForConfidence(confidence:number|undefined, fallback:CognitiveImpactLevel="medium"):CognitiveImpactLevel {
  if ((confidence ?? 0) >= 92) return "high";
  if ((confidence ?? 0) <= 45 && confidence !== undefined) return "high";
  return fallback;
}

function objectEventType(type:DossierObjectRecord["type"]):CognitiveEventType {
  if (type === "context") return "evidence";
  return type;
}

function learningType(record:LearningEventRecord):CognitiveEventType {
  if (record.type === "ContradictionDetected") return "contradiction";
  if (record.type === "DecisionReversed") return "revision";
  if (record.type === "RiskDetected" || record.type === "RiskResolved") return "risk";
  return "learning";
}

function actionType(action:ActionRecord):CognitiveEventType {
  if (action.status === "done" && action.result) return "outcome";
  if (action.status === "doing" || action.status === "done" || action.status === "blocked") return "execution";
  return "action";
}

function sortAndDedupe(events:CognitiveTimelineEvent[]):CognitiveTimelineEvent[] {
  const map = new Map<string,CognitiveTimelineEvent>();
  for (const event of events) map.set(event.id, event);
  return [...map.values()].sort((a,b)=>new Date(a.timestamp).getTime()-new Date(b.timestamp).getTime());
}

export function projectCognitiveEvents(input:CognitiveEventProjectionInput):CognitiveTimelineEvent[] {
  const caseMessages = input.messages.filter((item)=>item.caseId===input.caseId);
  const caseObjects = input.caseObjects.filter((item)=>item.caseId===input.caseId);
  const decisions = input.decisions.filter((item)=>item.caseId===input.caseId);
  const actions = input.actions.filter((item)=>item.caseId===input.caseId);
  const learnings = input.learningEvents.filter((item)=>item.caseId===input.caseId);
  const revisions = input.reasoningRevisions.filter((item)=>item.caseId===input.caseId);
  const memories = (input.memories ?? []).filter((item)=>item.caseId===input.caseId && item.durable);

  const events:CognitiveTimelineEvent[] = [];

  for (const message of caseMessages) {
    const isUser = message.role === "user";
    const question = isUser && /\?|dois-je|faut-il|comment|pourquoi|quel|quelle/i.test(message.text);
    events.push({
      id:`message:${message.id}`,
      caseId:input.caseId,
      type: question ? "question" : "analysis",
      timestamp:message.createdAt,
      actor:isUser ? "user" : "ORION",
      title:question ? "Question formulée" : isUser ? "Contexte apporté" : "Analyse ORION",
      summary:message.text,
      reasoning:isUser ? "Nouvelle contribution au raisonnement du dossier." : "ORION a produit une analyse dans le contexte courant du dossier.",
      impact:question ? "high" : "medium",
      confidenceBefore:null,
      confidenceAfter:null,
      causedBy:[],
      affects:[`case:${input.caseId}`],
      produces:[],
      metadata:{ source:"conversation", role:message.role }
    });
  }

  for (const record of caseObjects) {
    events.push({
      id:`object:${record.id}`,
      caseId:input.caseId,
      type:objectEventType(record.type),
      timestamp:record.createdAt,
      actor:record.source === "conversation" ? "ORION" : "runtime",
      title:`${record.type === "goal" ? "Objectif" : record.type === "hypothesis" ? "Hypothèse" : record.type === "risk" ? "Risque" : record.type === "decision" ? "Décision" : record.type === "action" ? "Action" : record.type === "question" ? "Question" : "Élément de contexte"} ${record.status === "superseded" ? "révisé" : "créé"}`,
      summary:record.title,
      reasoning:`Objet métier ${record.type} créé depuis ${record.source}.`,
      impact:record.type === "decision" || record.type === "risk" ? "high" : "medium",
      confidenceBefore:null,
      confidenceAfter:record.confidence,
      causedBy:record.referenceId ? [record.referenceId] : [],
      affects:[`case:${input.caseId}`],
      produces:[record.id],
      metadata:{ source:record.source, status:record.status, objectType:record.type }
    });
  }

  for (const decision of decisions) {
    events.push({
      id:`decision:${decision.id}`,
      caseId:input.caseId,
      type:"decision",
      timestamp:decision.createdAt,
      actor:"ORION",
      title:"Décision formalisée",
      summary:decision.outcome,
      reasoning:decision.rationale || decision.recommendation,
      impact:"high",
      confidenceBefore:null,
      confidenceAfter:decision.confidence,
      causedBy:[],
      affects:[`case:${input.caseId}`],
      produces:[decision.id],
      metadata:{ recommendation:decision.recommendation }
    });
  }

  for (const revision of revisions) {
    events.push({
      id:`revision:${revision.id}`,
      caseId:input.caseId,
      type:revision.version > 1 ? "revision" : revision.stepId === "evidence" ? "evidence" : revision.stepId === "decision" ? "decision" : "analysis",
      timestamp:revision.createdAt,
      actor:"runtime",
      title:revision.version > 1 ? `Raisonnement révisé · ${revision.stepId} v${revision.version}` : `Raisonnement · ${revision.stepId}`,
      summary:revision.content,
      reasoning:revision.version > 1 ? "Une nouvelle version immuable remplace la compréhension précédente sans l’effacer." : "Première version enregistrée pour cette étape du raisonnement.",
      impact:revision.stepId === "decision" ? "high" : "medium",
      confidenceBefore:null,
      confidenceAfter:revision.confidence ?? null,
      causedBy:[],
      affects:[`reasoning:${revision.stepId}`],
      produces:[revision.id],
      metadata:{ stepId:revision.stepId, version:revision.version, risk:revision.risk ?? null }
    });
  }

  for (const action of actions) {
    events.push({
      id:`action:${action.id}:${action.status}`,
      caseId:input.caseId,
      type:actionType(action),
      timestamp:action.dueAt ?? decisions[0]?.createdAt ?? new Date(0).toISOString(),
      actor:"runtime",
      title:action.status === "done" && action.result ? "Résultat observé" : action.status === "todo" ? "Action créée" : "Exécution mise à jour",
      summary:action.result ?? action.title,
      reasoning:action.blockedReason ? `Blocage : ${action.blockedReason}` : `État ${action.status} · progression ${action.progress}%.`,
      impact:action.status === "blocked" ? "critical" : action.status === "done" ? "high" : "medium",
      confidenceBefore:null,
      confidenceAfter:null,
      causedBy:[],
      affects:[action.id],
      produces:action.result ? [`outcome:${action.id}`] : [],
      metadata:{ status:action.status, progress:action.progress, owner:action.owner }
    });
  }

  for (const learning of learnings) {
    events.push({
      id:`learning:${learning.id}`,
      caseId:input.caseId,
      type:learningType(learning),
      timestamp:learning.createdAt,
      actor:"runtime",
      title:learning.title,
      summary:learning.detail,
      reasoning:`Learning Event ${learning.type} détecté par le moteur cognitif.`,
      impact:learning.significance === "high" ? "high" : learning.significance === "medium" ? "medium" : "low",
      confidenceBefore:null,
      confidenceAfter:learning.confidence ?? null,
      causedBy:[],
      affects:[`case:${input.caseId}`],
      produces:[learning.id],
      metadata:{ learningType:learning.type, significance:learning.significance }
    });
  }

  for (const memory of memories) {
    events.push({
      id:`memory:${memory.id}`,
      caseId:input.caseId,
      type:"memory",
      timestamp:memory.createdAt,
      actor:"runtime",
      title:"Connaissance consolidée",
      summary:memory.content,
      reasoning:"Cette connaissance a été marquée durable et peut être réutilisée lors de futures reprises.",
      impact:impactForConfidence(memory.confidence, "low"),
      confidenceBefore:null,
      confidenceAfter:memory.confidence,
      causedBy:[],
      affects:[`memory:${input.caseId}`],
      produces:[memory.id],
      metadata:{ kind:memory.kind, durable:memory.durable, source:memory.source }
    });
  }

  return sortAndDedupe(events);
}
