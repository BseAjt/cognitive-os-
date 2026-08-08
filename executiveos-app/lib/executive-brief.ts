import type { ActionRecord, CognitiveCase, ContextEvidenceRecord, ContextSourceRecord, DecisionActionPlanRecord, DecisionRecord, DecisionWatchRecord, DossierObjectRecord, ExecutiveCycleRecord, LearningEventRecord, ReflectionRecord } from "../domain/canonical.ts";

export interface ExecutiveCaseBrief {
  objective: string;
  state: CognitiveCase["state"];
  latestDecision: string;
  decisionConfidence?: number;
  nextAction: string;
  blockers: string[];
  criticalRisks: string[];
  latestLearning: string;
  decisionsToReconsider: string[];
  sinceLastSession: string[];
  proactiveAlerts: string[];
  recommendation: string;
  health: "stable" | "watch" | "critical";
  executiveSummary: string;
  activePlan?: string;
  watchStatus: "stable"|"watch"|"reopen"|"not_started";
  citedEvidence: Array<{citation:string;claim:string;sourceTitle:string}>;
  generatedAt: string;
}

export function buildExecutiveCaseBrief(input: {
  cognitiveCase: CognitiveCase;
  decisions: DecisionRecord[];
  actions: ActionRecord[];
  caseObjects: DossierObjectRecord[];
  learningEvents: LearningEventRecord[];
  reflections: ReflectionRecord[];
  contextSources?:ContextSourceRecord[];
  contextEvidence?:ContextEvidenceRecord[];
  executiveCycles?:ExecutiveCycleRecord[];
  decisionActionPlans?:DecisionActionPlanRecord[];
  decisionWatches?:DecisionWatchRecord[];
  generatedAt?:string;
}): ExecutiveCaseBrief {
  const { cognitiveCase } = input;
  const decisions = input.decisions.filter((item) => item.caseId === cognitiveCase.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const actions = input.actions.filter((item) => item.caseId === cognitiveCase.id);
  const objects = input.caseObjects.filter((item) => item.caseId === cognitiveCase.id);
  const learningEvents = input.learningEvents.filter((item) => item.caseId === cognitiveCase.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reflections = input.reflections.filter((item) => item.caseId === cognitiveCase.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const latestDecision = decisions[0];
  const openActions = actions.filter((item) => item.status !== "done");
  const completedActions = actions.filter((item) => item.status === "done");
  const blockedActions = openActions.filter((item) => item.status === "blocked");
  const nextAction = openActions.find((item) => item.status === "doing") ?? openActions.find((item) => item.status === "todo") ?? openActions[0];
  const risks = objects.filter((item) => item.type === "risk" && item.status !== "resolved").sort((a, b) => b.confidence - a.confidence);
  const latestLearning = learningEvents[0]?.detail ?? reflections[0]?.summary ?? "Aucun apprentissage consolidé pour le moment.";
  const blockers = blockedActions.map((item) => item.blockedReason ? `${item.title} — ${item.blockedReason}` : item.title);
  const criticalRisks = risks.filter((item) => item.confidence >= 70).slice(0, 3).map((item) => item.title);
  const decisionsToReconsider = unique(reflections.flatMap((item) => item.decisionsToReconsider)).slice(0, 3);
  const plans=(input.decisionActionPlans??[]).filter((item)=>item.caseId===cognitiveCase.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const activePlan=plans.find((item)=>item.status==="active")??plans[0];
  const watch=activePlan&&(input.decisionWatches??[]).filter((item)=>item.planId===activePlan.id).sort((a,b)=>b.evaluatedAt.localeCompare(a.evaluatedAt))[0];
  const sources=(input.contextSources??[]).filter((item)=>item.caseId===cognitiveCase.id).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  const sourceIndex=new Map(sources.map((item,index)=>[item.id,{citation:`S${index+1}`,title:item.title}]));
  const citedEvidence=(input.contextEvidence??[]).filter((item)=>item.caseId===cognitiveCase.id&&sourceIndex.has(item.sourceId)).sort((a,b)=>b.confidence-a.confidence).slice(0,3).map((item)=>({citation:sourceIndex.get(item.sourceId)!.citation,claim:item.claim,sourceTitle:sourceIndex.get(item.sourceId)!.title}));

  const sinceLastSession = [
    completedActions.length ? `${completedActions.length} action(s) terminée(s).` : "",
    blockedActions.length ? `${blockedActions.length} action(s) bloquée(s).` : "",
    learningEvents.length ? `${learningEvents.length} apprentissage(s) consolidé(s).` : "",
    decisionsToReconsider.length ? `${decisionsToReconsider.length} décision(s) à reconsidérer.` : "",
    criticalRisks.length ? `${criticalRisks.length} risque(s) critique(s) actif(s).` : ""
  ].filter(Boolean);

  const proactiveAlerts = [
    ...blockers.map((item) => `Blocage: ${item}`),
    ...criticalRisks.map((item) => `Risque critique: ${item}`),
    ...decisionsToReconsider.map((item) => `Décision à revoir: ${item}`)
  ].slice(0, 5);

  const health: ExecutiveCaseBrief["health"] = watch?.status==="reopen" || cognitiveCase.signals.risk >= 8 || blockers.length > 0 || decisionsToReconsider.length > 0
    ? "critical"
    : cognitiveCase.signals.risk >= 6 || criticalRisks.length > 0
      ? "watch"
      : "stable";

  const nextBestAction = blockers.length
    ? `Lever le blocage « ${blockers[0]} » avant d'élargir l'exécution.`
    : decisionsToReconsider.length
      ? `Réouvrir la décision « ${decisionsToReconsider[0]} » car le contexte cognitif a évolué.`
      : nextAction
        ? `Faire avancer « ${nextAction.title} » et mesurer son résultat.`
        : latestDecision
          ? "Transformer la décision actuelle en prochaine action observable."
          : "Clarifier la question de décision et comparer les options avant engagement.";

  const changeSummary = sinceLastSession.length ? `Depuis la dernière session : ${sinceLastSession.join(" ")} ` : "";
  const recommendation = `${changeSummary}ORION recommande : ${nextBestAction}`;
  const cycle=(input.executiveCycles??[]).filter((item)=>item.caseId===cognitiveCase.id&&item.status==="completed").sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  const executiveSummary=`${cognitiveCase.title} est en phase ${cognitiveCase.state}. ${latestDecision?`La décision active est « ${latestDecision.outcome} » avec ${latestDecision.confidence}% de confiance.`:"Aucune décision n’est encore formalisée."} ${activePlan?`Le plan associé compte ${activePlan.actionIds.length} actions et un checkpoint au ${activePlan.checkpointAt}.`:"Aucun plan d’exécution n’est actif."} ${watch?.summary??"La surveillance de décision n’a pas encore été lancée."}${cycle?.recommendation?` Recommandation ORION : ${cycle.recommendation}`:""}`;

  return {
    objective: cognitiveCase.objective,
    state: cognitiveCase.state,
    latestDecision: latestDecision?.outcome ?? "Aucune décision formalisée",
    decisionConfidence: latestDecision?.confidence,
    nextAction: nextAction?.title ?? "Aucune action ouverte",
    blockers,
    criticalRisks,
    latestLearning,
    decisionsToReconsider,
    sinceLastSession,
    proactiveAlerts,
    recommendation,
    health,
    executiveSummary,
    activePlan:activePlan?.recommendation,
    watchStatus:watch?.status??"not_started",
    citedEvidence,
    generatedAt:input.generatedAt??new Date().toISOString()
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}
