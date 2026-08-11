import type { ActionRecord, CognitiveCase, DecisionActionPlanRecord, DecisionRecord, ExecutiveCycleRecord } from "../domain/canonical.ts";

export interface DecisionToActionResult { plan:DecisionActionPlanRecord; decision:DecisionRecord; actions:ActionRecord[] }
export interface DecisionToActionInput { cognitiveCase:CognitiveCase; cycle:ExecutiveCycleRecord; id?:string; decisionId?:string; actionIds?:string[]; createdAt?:string }

export function buildDecisionToAction(input:DecisionToActionInput):DecisionToActionResult {
  if(input.cycle.caseId!==input.cognitiveCase.id) throw new Error("Le cycle d’analyse n’appartient pas à ce dossier.");
  if(input.cycle.status!=="completed"||!input.cycle.recommendation) throw new Error("Une recommandation validée est requise avant l’exécution.");
  const createdAt=input.createdAt??new Date().toISOString();
  const actionIds=input.actionIds??[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()];
  if(actionIds.length!==3) throw new Error("Le plan Decision-to-Action requiert trois identifiants d’action.");
  const decisionId=input.decisionId??crypto.randomUUID();
  const owners=ownersFor(input.cycle);
  const actions:ActionRecord[]=[
    {id:actionIds[0]!,caseId:input.cognitiveCase.id,title:"Définir le critère de succès et le signal de révision",owner:owners.strategy,progress:0,status:"todo",requiredCapability:"analysis",assignedAgentId:agentId(input.cycle,"athena"),dueAt:addDays(createdAt,3)},
    {id:actionIds[1]!,caseId:input.cognitiveCase.id,title:`Préparer l’exécution de « ${input.cycle.objective} »`,owner:owners.delivery,progress:0,status:"todo",requiredCapability:"orchestration",assignedAgentId:agentId(input.cycle,"turing"),dueAt:addDays(createdAt,7)},
    {id:actionIds[2]!,caseId:input.cognitiveCase.id,title:"Mesurer le résultat et tenir le point de réévaluation",owner:"Pilotage de la décision",progress:0,status:"todo",requiredCapability:"decision",assignedAgentId:"orion",dueAt:addDays(createdAt,14)}
  ];
  const plan:DecisionActionPlanRecord={id:input.id??crypto.randomUUID(),caseId:input.cognitiveCase.id,executiveCycleId:input.cycle.id,decisionId,recommendation:input.cycle.recommendation,status:"active",actionIds,dependencies:[{actionId:actionIds[1]!,dependsOnActionId:actionIds[0]!},{actionId:actionIds[2]!,dependsOnActionId:actionIds[1]!}],metrics:[{id:`${decisionId}:progress`,label:"Actions terminées",target:"3/3",current:"0/3",owner:"Pilotage de la décision"},{id:`${decisionId}:confidence`,label:"Confiance de décision",target:`≥ ${input.cycle.confidence}%`,current:`${input.cycle.confidence}%`,owner:owners.strategy}],checkpointAt:addDays(createdAt,14),createdAt};
  const decision:DecisionRecord={id:decisionId,caseId:input.cognitiveCase.id,recommendation:input.cycle.recommendation,outcome:input.cycle.objective,rationale:`Décision issue du cycle d’analyse ${input.cycle.id}, fondée sur ${input.cycle.sourceIds.length} source(s) et ${input.cycle.contributions.length} perspective(s).`,confidence:input.cycle.confidence,createdAt};
  return {plan,decision,actions};
}

function addDays(value:string,days:number):string { const date=new Date(value); date.setUTCDate(date.getUTCDate()+days); return date.toISOString(); }
function agentId(cycle:ExecutiveCycleRecord,id:string):string|null { return cycle.selectedAgentIds.includes(id)?id:null; }
function ownersFor(cycle:ExecutiveCycleRecord):{strategy:string;delivery:string} { const byId=new Map(cycle.contributions.map((item)=>[item.agentId,item.mandate])); return {strategy:byId.get("athena")??"Cadrage stratégique",delivery:byId.get("turing")??"Pilotage de l’exécution"}; }
