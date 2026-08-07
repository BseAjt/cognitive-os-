import type { ActionRecord, CognitiveCase, CognitiveEventRecord, DecisionRecord, LearningEventRecord, ReflectionRecord } from "../domain/canonical.ts";

export type OutcomeView = "home" | "understand" | "decision" | "act" | "explore" | "settings";

export interface EventDestination {
  view: OutcomeView;
  label: string;
  reason: string;
}

export function resolveEventDestination(event: CognitiveEventRecord): EventDestination {
  const type = event.type.toLowerCase();
  if (/decision|recommendation|scenario|council/.test(type)) return { view: "decision", label: "Voir la décision", reason: "Cet événement modifie un arbitrage." };
  if (/task|action|execution|executed|assigned|transition/.test(type)) return { view: "act", label: "Voir l’action", reason: "Cet événement modifie l’exécution." };
  if (/memory|learning|reflection|profile|belief|risk|confidence/.test(type)) return { view: "understand", label: "Voir ce qui a été appris", reason: "Cet événement modifie la compréhension du dossier." };
  if (/knowledge|graph|entity|relation/.test(type)) return { view: "explore", label: "Voir dans le graphe", reason: "Cet événement modifie le graphe de connaissance." };
  return { view: "understand", label: "Voir le contexte", reason: "Cet événement appartient à l’historique cognitif." };
}

export interface CaseJourney {
  cognitiveCase: CognitiveCase;
  latestDecision?: DecisionRecord;
  nextAction?: ActionRecord;
  latestLearning?: LearningEventRecord;
  latestReflection?: ReflectionRecord;
}

export function buildCaseJourney(input: {
  cognitiveCase: CognitiveCase;
  decisions: DecisionRecord[];
  actions: ActionRecord[];
  learningEvents: LearningEventRecord[];
  reflections: ReflectionRecord[];
}): CaseJourney {
  const caseId = input.cognitiveCase.id;
  const latestDecision = [...input.decisions].filter((item) => item.caseId === caseId).sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  const nextAction = input.actions
    .filter((item) => item.caseId === caseId && item.status !== "done")
    .sort((a,b) => {
      const rank = { doing: 0, todo: 1, blocked: 2, done: 3 } as const;
      return rank[a.status] - rank[b.status] || (b.progress - a.progress);
    })[0];
  const latestLearning = [...input.learningEvents].filter((item) => item.caseId === caseId).sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  const latestReflection = [...input.reflections].filter((item) => item.caseId === caseId).sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  return { cognitiveCase: input.cognitiveCase, latestDecision, nextAction, latestLearning, latestReflection };
}
