import type { CognitiveTimelineEvent } from "./cognitive-events.ts";

export interface DecisionVersion {
  id: string;
  caseId: string;
  version: number;
  content: string;
  confidence: number | null;
  createdAt: string;
}

export interface DecisionDiff {
  id: string;
  caseId: string;
  from: DecisionVersion;
  to: DecisionVersion;
  changed: boolean;
  changeSummary: string;
  confidenceDelta: number | null;
  drivers: CognitiveTimelineEvent[];
  addedTerms: string[];
  removedTerms: string[];
}

interface ReasoningRevisionLike {
  id: string;
  caseId: string;
  stepId: string;
  version: number;
  content: string;
  confidence?: number;
  createdAt: string;
}

const STOP_WORDS = new Set(["avec","pour","dans","sans","plus","moins","nous","vous","leur","leurs","cette","ceci","cela","une","des","les","aux","sur","par","que","qui","est","sont","être","doit","devrait","retenir","décision"]);

function terms(value:string):string[] {
  return [...new Set(value.toLocaleLowerCase("fr-FR").replace(/[^a-zà-ÿ0-9\s-]/gi," ").split(/\s+/).filter((term)=>term.length>=4 && !STOP_WORDS.has(term)))];
}

function setDifference(left:string[], right:string[]):string[] {
  const rightSet = new Set(right);
  return left.filter((item)=>!rightSet.has(item));
}

function driverEvents(events:CognitiveTimelineEvent[], from:string, to:string):CognitiveTimelineEvent[] {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  return events
    .filter((event)=>{
      const time = new Date(event.timestamp).getTime();
      return time > start && time <= end && ["evidence","hypothesis","risk","analysis","contradiction","learning","memory"].includes(event.type);
    })
    .sort((a,b)=>{
      const weight = (event:CognitiveTimelineEvent) => event.impact === "critical" ? 4 : event.impact === "high" ? 3 : event.impact === "medium" ? 2 : 1;
      return weight(b)-weight(a) || new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime();
    })
    .slice(0,5);
}

export function buildDecisionVersions(caseId:string, revisions:ReasoningRevisionLike[]):DecisionVersion[] {
  return revisions
    .filter((revision)=>revision.caseId===caseId && revision.stepId==="decision")
    .sort((a,b)=>a.version-b.version || new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime())
    .map((revision)=>({ id:revision.id, caseId, version:revision.version, content:revision.content, confidence:revision.confidence ?? null, createdAt:revision.createdAt }));
}

export function buildDecisionDiffs(caseId:string, revisions:ReasoningRevisionLike[], events:CognitiveTimelineEvent[]):DecisionDiff[] {
  const versions = buildDecisionVersions(caseId,revisions);
  const diffs:DecisionDiff[] = [];
  for(let index=1; index<versions.length; index+=1){
    const from = versions[index-1];
    const to = versions[index];
    if(!from || !to) continue;
    const fromTerms = terms(from.content);
    const toTerms = terms(to.content);
    const addedTerms = setDifference(toTerms,fromTerms).slice(0,8);
    const removedTerms = setDifference(fromTerms,toTerms).slice(0,8);
    const confidenceDelta = from.confidence !== null && to.confidence !== null ? to.confidence-from.confidence : null;
    const drivers = driverEvents(events,from.createdAt,to.createdAt);
    const changed = from.content.trim() !== to.content.trim() || (confidenceDelta ?? 0) !== 0;
    const textChange = addedTerms.length || removedTerms.length
      ? `${addedTerms.length ? `Ajouts : ${addedTerms.join(", ")}` : ""}${addedTerms.length && removedTerms.length ? " · " : ""}${removedTerms.length ? `Retraits : ${removedTerms.join(", ")}` : ""}`
      : changed ? "La formulation ou la confiance de la décision a évolué." : "Aucun changement substantiel détecté.";
    diffs.push({
      id:`decision-diff:${caseId}:${from.version}:${to.version}`,
      caseId,
      from,
      to,
      changed,
      changeSummary:textChange,
      confidenceDelta,
      drivers,
      addedTerms,
      removedTerms
    });
  }
  return diffs;
}
