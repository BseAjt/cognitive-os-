import type { ActionRecord, ContextEvidenceRecord, ContextSourceRecord, DecisionActionPlanRecord, DecisionRecord, DecisionWatchRecord } from "../domain/canonical.ts";

const CONTRADICTION=/\b(annul|abandonn|bloqu|impossible|d[ée]pass|retard|baisse|perte|interdit|refus|contraire|invalide|n(?:e|’)\s+peut\s+plus)\w*/iu;
const MATERIAL_CHANGE=/\b(d[ée]sormais|nouveau|change|r[ée]vis|alerte|risque|contrainte|budget|d[ée]lai|march[ée])\w*/iu;

export function evaluateDecisionWatch(input:{plan:DecisionActionPlanRecord;decision:DecisionRecord;actions:ActionRecord[];sources:ContextSourceRecord[];evidence:ContextEvidenceRecord[];evaluatedAt?:string;id?:string}):DecisionWatchRecord {
  if(input.plan.caseId!==input.decision.caseId) throw new Error("La décision surveillée n’appartient pas au plan.");
  const evaluatedAt=input.evaluatedAt??new Date().toISOString();
  const sourceOrder=input.sources.filter((item)=>item.caseId===input.plan.caseId).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  const sourceIndex=new Map(sourceOrder.map((item,index)=>[item.id,`S${index+1}`]));
  const newSourceIds=new Set(sourceOrder.filter((item)=>item.createdAt>input.plan.createdAt).map((item)=>item.id));
  const newEvidence=input.evidence.filter((item)=>item.caseId===input.plan.caseId&&newSourceIds.has(item.sourceId));
  const signals:DecisionWatchRecord["signals"]=[];
  for(const item of newEvidence){
    const contradiction=CONTRADICTION.test(item.claim);
    if(!contradiction&&!MATERIAL_CHANGE.test(item.claim)) continue;
    signals.push({id:`${input.plan.id}:${item.id}`,type:contradiction?"contradiction":"new_evidence",severity:contradiction&&item.confidence>=75?"critical":"warning",title:contradiction?"Preuve potentiellement contradictoire":"Changement de contexte détecté",detail:item.claim,sourceId:item.sourceId,evidenceId:item.id,citation:sourceIndex.get(item.sourceId)});
  }
  for(const action of input.actions.filter((item)=>input.plan.actionIds.includes(item.id)&&item.status==="blocked")) signals.push({id:`${input.plan.id}:blocked:${action.id}`,type:"blocked_action",severity:"critical",title:"Exécution bloquée",detail:action.blockedReason?`${action.title} — ${action.blockedReason}`:action.title});
  if(input.plan.status==="active"&&input.plan.checkpointAt<=evaluatedAt) signals.push({id:`${input.plan.id}:checkpoint`,type:"checkpoint_due",severity:"warning",title:"Checkpoint ORION arrivé",detail:`Le plan devait être réévalué le ${input.plan.checkpointAt}.`});
  const status:DecisionWatchRecord["status"]=signals.some((item)=>item.severity==="critical")?"reopen":signals.length?"watch":"stable";
  const summary=status==="stable"?"Aucun signal matériel ne fragilise la décision.":status==="reopen"?`${signals.length} signal(s) imposent de rouvrir la décision.`:`${signals.length} signal(s) nécessitent une surveillance.`;
  const recommendedAction=status==="reopen"?"Suspendre l’élargissement du plan et relancer un cycle ORION avec les nouvelles preuves.":status==="watch"?"Qualifier les signaux au prochain checkpoint avant de modifier la décision.":"Poursuivre l’exécution et maintenir la surveillance du contexte.";
  return {id:input.id??crypto.randomUUID(),caseId:input.plan.caseId,planId:input.plan.id,decisionId:input.decision.id,status,signals,summary,recommendedAction,evaluatedAt};
}
