import type { CognitiveTimelineEvent, CognitiveEventType } from "./cognitive-events.ts";
import type { OrionCognitiveCycle } from "./orion-cycles.ts";
import { buildTemporalCognitiveSnapshot, diffTemporalCognitiveSnapshots, type TemporalCognitiveSnapshot, type TemporalSnapshotDiff } from "./temporal-navigation.ts";

export interface CognitiveReplayFrame {
  id: string;
  index: number;
  caseId: string;
  at: string;
  event: CognitiveTimelineEvent;
  before: TemporalCognitiveSnapshot;
  after: TemporalCognitiveSnapshot;
  delta: TemporalSnapshotDiff;
  phase: string;
  narration: string;
  known: string[];
  assumed: string[];
  openQuestions: string[];
  confidenceDelta: number | null;
}

export interface CognitiveReplay {
  id: string;
  caseId: string;
  cycleId: string;
  title: string;
  startedAt: string;
  endedAt: string;
  frames: CognitiveReplayFrame[];
  startState: TemporalCognitiveSnapshot;
  endState: TemporalCognitiveSnapshot;
  confidenceDelta: number | null;
  summary: string;
}

function label(type:CognitiveEventType):string {
  return ({ question:"Question", goal:"Objectif", hypothesis:"Hypothèse", evidence:"Preuve", analysis:"Analyse", decision:"Décision", revision:"Révision", risk:"Risque", action:"Action", execution:"Exécution", outcome:"Résultat", learning:"Apprentissage", memory:"Mémoire", contradiction:"Contradiction", reopen:"Réouverture" } as Record<CognitiveEventType,string>)[type];
}

function previousInstant(at:string):string {
  return new Date(Math.max(0,new Date(at).getTime()-1)).toISOString();
}

function trim(value:string, limit=120):string {
  return value.length<=limit ? value : `${value.slice(0,limit-1).trimEnd()}…`;
}

function narrate(event:CognitiveTimelineEvent, delta:TemporalSnapshotDiff):string {
  const additions = Object.entries(delta.addedByType).map(([type,count])=>`${label(type as CognitiveEventType)} +${count}`).join(" · ");
  if(event.type==="question") return `Le raisonnement s’ouvre sur la question : ${trim(event.summary)}.`;
  if(event.type==="hypothesis") return `Une hypothèse entre dans le raisonnement : ${trim(event.summary)}.`;
  if(event.type==="evidence") return `Une nouvelle preuve modifie le contexte disponible : ${trim(event.summary)}.`;
  if(event.type==="decision") return `Une décision est formalisée : ${trim(event.summary)}${delta.confidenceDelta!==null ? ` La confiance évolue de ${delta.confidenceDelta>=0?"+":""}${delta.confidenceDelta} point(s).` : ""}`;
  if(event.type==="revision") return `Le raisonnement est révisé : ${trim(event.summary)}${delta.confidenceDelta!==null ? ` La confiance évolue de ${delta.confidenceDelta>=0?"+":""}${delta.confidenceDelta} point(s).` : ""}`;
  if(event.type==="risk" || event.type==="contradiction") return `${label(event.type)} détecté : ${trim(event.summary)}.`;
  if(event.type==="outcome") return `Le résultat observé devient disponible : ${trim(event.summary)}.`;
  if(event.type==="learning" || event.type==="memory") return `Le dossier capitalise un nouvel apprentissage : ${trim(event.summary)}.`;
  return `${label(event.type)} : ${trim(event.summary)}${additions ? ` · ${additions}` : ""}`;
}

function summaries(events:CognitiveTimelineEvent[], limit=4):string[] {
  return events.slice(-limit).map((event)=>event.summary);
}

export function buildCognitiveReplay(caseId:string, cycle:OrionCognitiveCycle, allEvents:CognitiveTimelineEvent[]):CognitiveReplay {
  const orderedAll = [...allEvents].filter((event)=>event.caseId===caseId).sort((a,b)=>new Date(a.timestamp).getTime()-new Date(b.timestamp).getTime());
  const cycleEvents = [...cycle.events].filter((event)=>event.caseId===caseId).sort((a,b)=>new Date(a.timestamp).getTime()-new Date(b.timestamp).getTime());
  const startAt = cycleEvents[0]?.timestamp ?? cycle.startedAt;
  const endAt = cycleEvents.at(-1)?.timestamp ?? cycle.endedAt;
  const startState = buildTemporalCognitiveSnapshot(caseId, previousInstant(startAt), orderedAll);
  const endState = buildTemporalCognitiveSnapshot(caseId, endAt, orderedAll);
  const frames = cycleEvents.map((event,index)=>{
    const before = buildTemporalCognitiveSnapshot(caseId, previousInstant(event.timestamp), orderedAll);
    const after = buildTemporalCognitiveSnapshot(caseId, event.timestamp, orderedAll);
    const delta = diffTemporalCognitiveSnapshots(before,after,orderedAll);
    return {
      id:`replay:${cycle.id}:${event.id}`,
      index,
      caseId,
      at:event.timestamp,
      event,
      before,
      after,
      delta,
      phase:label(event.type),
      narration:narrate(event,delta),
      known:[...summaries(after.evidence,3), ...summaries(after.memories,2)].slice(-4),
      assumed:summaries(after.hypotheses,4),
      openQuestions:summaries(after.questions,4),
      confidenceDelta:delta.confidenceDelta
    } satisfies CognitiveReplayFrame;
  });
  const confidenceDelta = startState.confidence!==null && endState.confidence!==null ? endState.confidence-startState.confidence : null;
  const phases=[...new Set(frames.map((frame)=>frame.phase))];
  return {
    id:`cognitive-replay:${cycle.id}`,
    caseId,
    cycleId:cycle.id,
    title:cycle.trigger?.summary ?? cycle.title,
    startedAt:startAt,
    endedAt:endAt,
    frames,
    startState,
    endState,
    confidenceDelta,
    summary:`${frames.length} étape(s) · ${phases.join(" → ")}${confidenceDelta!==null ? ` · confiance ${confidenceDelta>=0?"+":""}${confidenceDelta} pts` : ""}`
  };
}
