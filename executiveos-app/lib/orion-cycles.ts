import type { CognitiveTimelineEvent, CognitiveEventType } from "./cognitive-events.ts";

export interface OrionCognitiveCycle {
  id: string;
  caseId: string;
  sequence: number;
  startedAt: string;
  endedAt: string;
  trigger: CognitiveTimelineEvent | null;
  events: CognitiveTimelineEvent[];
  eventTypes: CognitiveEventType[];
  title: string;
  summary: string;
  outcome: string | null;
  confidence: number | null;
  impact: "critical" | "high" | "medium" | "low";
  isComplete: boolean;
}

const TERMINAL_TYPES = new Set<CognitiveEventType>(["decision", "outcome", "learning", "memory"]);
const MAJOR_TYPES = new Set<CognitiveEventType>(["decision", "revision", "risk", "outcome", "contradiction"]);

function maxImpact(events:CognitiveTimelineEvent[]): OrionCognitiveCycle["impact"] {
  if (events.some((event) => event.impact === "critical")) return "critical";
  if (events.some((event) => event.impact === "high")) return "high";
  if (events.some((event) => event.impact === "medium")) return "medium";
  return "low";
}

function latestConfidence(events:CognitiveTimelineEvent[]):number|null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const value = events[index]?.confidenceAfter;
    if (typeof value === "number") return value;
  }
  return null;
}

function buildTitle(events:CognitiveTimelineEvent[], sequence:number):string {
  const trigger = events.find((event) => event.type === "question") ?? events[0];
  if (trigger?.type === "question") return `Cycle #${sequence} · ${trim(trigger.summary, 72)}`;
  const major = events.find((event) => MAJOR_TYPES.has(event.type));
  return `Cycle #${sequence} · ${major ? major.title : "Évolution du raisonnement"}`;
}

function buildSummary(events:CognitiveTimelineEvent[]):string {
  const meaningful = events.filter((event) => event.type !== "memory");
  const types = [...new Set(meaningful.map((event) => label(event.type)))];
  const terminal = [...meaningful].reverse().find((event) => TERMINAL_TYPES.has(event.type));
  return `${types.slice(0, 5).join(" → ")}${terminal ? ` · ${trim(terminal.summary, 110)}` : ""}`;
}

function trim(value:string, limit:number):string {
  return value.length <= limit ? value : `${value.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

function label(type:CognitiveEventType):string {
  return ({ question:"Question", goal:"Objectif", hypothesis:"Hypothèse", evidence:"Preuve", analysis:"Analyse", decision:"Décision", revision:"Révision", risk:"Risque", action:"Action", execution:"Exécution", outcome:"Résultat", learning:"Apprentissage", memory:"Mémoire", contradiction:"Contradiction", reopen:"Réouverture" } as Record<CognitiveEventType,string>)[type];
}

function shouldStartNewCycle(event:CognitiveTimelineEvent, current:CognitiveTimelineEvent[]):boolean {
  if (!current.length) return true;
  if (event.type === "question") return true;
  const previous = current[current.length - 1];
  const gapMs = new Date(event.timestamp).getTime() - new Date(previous.timestamp).getTime();
  if (gapMs > 6 * 60 * 60 * 1000) return true;
  if (event.type === "reopen") return true;
  return false;
}

export function groupCognitiveEventsIntoOrionCycles(events:CognitiveTimelineEvent[]):OrionCognitiveCycle[] {
  const ordered = [...events].sort((a,b)=>new Date(a.timestamp).getTime()-new Date(b.timestamp).getTime());
  const groups:CognitiveTimelineEvent[][] = [];
  let current:CognitiveTimelineEvent[] = [];

  for (const event of ordered) {
    if (shouldStartNewCycle(event, current)) {
      if (current.length) groups.push(current);
      current = [event];
    } else {
      current.push(event);
    }
  }
  if (current.length) groups.push(current);

  return groups.map((group, index) => {
    const sequence = index + 1;
    const trigger = group.find((event) => event.type === "question") ?? null;
    const outcome = [...group].reverse().find((event) => ["decision","outcome","learning"].includes(event.type))?.summary ?? null;
    return {
      id:`orion-cycle:${group[0]?.caseId}:${sequence}:${group[0]?.id}`,
      caseId:group[0]?.caseId ?? "",
      sequence,
      startedAt:group[0]?.timestamp ?? "",
      endedAt:group[group.length-1]?.timestamp ?? "",
      trigger,
      events:group,
      eventTypes:[...new Set(group.map((event)=>event.type))],
      title:buildTitle(group, sequence),
      summary:buildSummary(group),
      outcome,
      confidence:latestConfidence(group),
      impact:maxImpact(group),
      isComplete:group.some((event)=>TERMINAL_TYPES.has(event.type))
    };
  });
}

export function orionCycleProgress(cycle:OrionCognitiveCycle):string[] {
  const order:CognitiveEventType[] = ["question","analysis","hypothesis","evidence","decision","action","execution","outcome","learning"];
  return order.filter((type)=>cycle.eventTypes.includes(type)).map(label);
}
