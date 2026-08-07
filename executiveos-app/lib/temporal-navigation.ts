import type { CognitiveTimelineEvent } from "./cognitive-events.ts";

export interface TemporalCognitiveSnapshot {
  caseId: string;
  at: string;
  eventCount: number;
  confidence: number | null;
  questions: CognitiveTimelineEvent[];
  goals: CognitiveTimelineEvent[];
  hypotheses: CognitiveTimelineEvent[];
  evidence: CognitiveTimelineEvent[];
  decisions: CognitiveTimelineEvent[];
  activeDecision: CognitiveTimelineEvent | null;
  risks: CognitiveTimelineEvent[];
  actions: CognitiveTimelineEvent[];
  outcomes: CognitiveTimelineEvent[];
  learnings: CognitiveTimelineEvent[];
  memories: CognitiveTimelineEvent[];
  contradictions: CognitiveTimelineEvent[];
  latestEvent: CognitiveTimelineEvent | null;
}

export interface TemporalSnapshotDiff {
  from: TemporalCognitiveSnapshot;
  to: TemporalCognitiveSnapshot;
  confidenceDelta: number | null;
  added: CognitiveTimelineEvent[];
  addedByType: Record<string, number>;
  newDecision: CognitiveTimelineEvent | null;
  newRisks: CognitiveTimelineEvent[];
  newEvidence: CognitiveTimelineEvent[];
  newLearnings: CognitiveTimelineEvent[];
  newMemories: CognitiveTimelineEvent[];
}

function atOrBefore(event:CognitiveTimelineEvent, at:string):boolean {
  return new Date(event.timestamp).getTime() <= new Date(at).getTime();
}

function latestConfidence(events:CognitiveTimelineEvent[]):number|null {
  for(let index=events.length-1; index>=0; index-=1){
    const value = events[index]?.confidenceAfter;
    if(typeof value === "number") return value;
  }
  return null;
}

function ofType(events:CognitiveTimelineEvent[], type:CognitiveTimelineEvent["type"]):CognitiveTimelineEvent[] {
  return events.filter((event)=>event.type===type);
}

function latestDecision(events:CognitiveTimelineEvent[]):CognitiveTimelineEvent|null {
  for(let index=events.length-1; index>=0; index-=1){
    const event=events[index];
    if(event && (event.type === "decision" || event.type === "revision") && (event.metadata.stepId === "decision" || event.type === "decision")) return event;
  }
  return null;
}

export function buildTemporalCognitiveSnapshot(caseId:string, at:string, events:CognitiveTimelineEvent[]):TemporalCognitiveSnapshot {
  const visible = events
    .filter((event)=>event.caseId===caseId && atOrBefore(event,at))
    .sort((a,b)=>new Date(a.timestamp).getTime()-new Date(b.timestamp).getTime());

  return {
    caseId,
    at,
    eventCount:visible.length,
    confidence:latestConfidence(visible),
    questions:ofType(visible,"question"),
    goals:ofType(visible,"goal"),
    hypotheses:ofType(visible,"hypothesis"),
    evidence:ofType(visible,"evidence"),
    decisions:visible.filter((event)=>event.type==="decision" || (event.type==="revision" && event.metadata.stepId==="decision")),
    activeDecision:latestDecision(visible),
    risks:ofType(visible,"risk"),
    actions:ofType(visible,"action"),
    outcomes:ofType(visible,"outcome"),
    learnings:ofType(visible,"learning"),
    memories:ofType(visible,"memory"),
    contradictions:ofType(visible,"contradiction"),
    latestEvent:visible[visible.length-1] ?? null
  };
}

export function diffTemporalCognitiveSnapshots(from:TemporalCognitiveSnapshot,to:TemporalCognitiveSnapshot,events:CognitiveTimelineEvent[]):TemporalSnapshotDiff {
  const start = new Date(from.at).getTime();
  const end = new Date(to.at).getTime();
  const added = events
    .filter((event)=>event.caseId===to.caseId && new Date(event.timestamp).getTime()>start && new Date(event.timestamp).getTime()<=end)
    .sort((a,b)=>new Date(a.timestamp).getTime()-new Date(b.timestamp).getTime());
  const addedByType:Record<string,number> = {};
  for(const event of added) addedByType[event.type]=(addedByType[event.type] ?? 0)+1;
  const confidenceDelta = from.confidence !== null && to.confidence !== null ? to.confidence-from.confidence : null;
  return {
    from,
    to,
    confidenceDelta,
    added,
    addedByType,
    newDecision:to.activeDecision?.id !== from.activeDecision?.id ? to.activeDecision : null,
    newRisks:added.filter((event)=>event.type==="risk"),
    newEvidence:added.filter((event)=>event.type==="evidence" || event.type==="analysis"),
    newLearnings:added.filter((event)=>event.type==="learning" || event.type==="contradiction"),
    newMemories:added.filter((event)=>event.type==="memory")
  };
}

export function temporalCursorPoints(caseId:string, events:CognitiveTimelineEvent[]):string[] {
  return [...new Set(events.filter((event)=>event.caseId===caseId).map((event)=>event.timestamp))]
    .sort((a,b)=>new Date(a).getTime()-new Date(b).getTime());
}
