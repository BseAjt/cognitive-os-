import type { AgentContract, CognitiveCase, ContextEvidenceRecord, ContextSourceRecord, ExecutiveCycleContribution, ExecutiveCycleRecord } from "../domain/canonical.ts";
import { retrieveCaseContext } from "./cognitive-retrieval.ts";

export interface ExecutiveCycleInput { id?:string; createdAt?:string; objective:string; cognitiveCase:CognitiveCase; agents:AgentContract[]; sources:ContextSourceRecord[]; evidence:ContextEvidenceRecord[] }

const MANDATES:Record<string,string>={athena:"Cohérence stratégique et arbitrage",turing:"Faisabilité, dépendances et exécution",seneca:"Risques, objections et réversibilité"};

export function runOrionExecutiveCycle(input:ExecutiveCycleInput):ExecutiveCycleRecord {
  const objective=input.objective.trim();
  if(!objective)throw new Error("Le mandat du cycle ORION est requis.");
  const scopedSources=input.sources.filter((item)=>item.caseId===input.cognitiveCase.id&&item.status==="ready");
  const scopedEvidence=input.evidence.filter((item)=>item.caseId===input.cognitiveCase.id);
  const retrieval=retrieveCaseContext(input.cognitiveCase.id,`${objective} ${input.cognitiveCase.objective}`,scopedSources,scopedEvidence,6);
  const selected=input.agents.filter((agent)=>["athena","turing","seneca"].includes(agent.id)&&agent.status==="online");
  const contributions=selected.map((agent)=>contribution(agent,input.cognitiveCase,objective,retrieval.hits));
  const hasStrategy=contributions.some((item)=>item.agentId==="athena");
  const hasChallenge=contributions.some((item)=>item.position==="challenge");
  const missingEvidence=[
    !scopedSources.length?"Ajouter au moins une source réelle au dossier":null,
    retrieval.hits.length<2?"Consolider au moins deux preuves pertinentes et citées":null,
    !hasStrategy?"Rendre ATHENA disponible pour l’arbitrage stratégique":null
  ].filter((item):item is string=>Boolean(item));
  const status=missingEvidence.length?"blocked" as const:"completed" as const;
  const confidence=contributions.length?Math.round(contributions.reduce((sum,item)=>sum+item.confidence,0)/contributions.length):input.cognitiveCase.signals.confidence;
  const divergences=hasChallenge&&contributions.length>1?[{topic:"Niveau d’engagement",agentIds:contributions.map((item)=>item.agentId),description:"ATHENA privilégie l’avancement tandis que SENECA demande une condition de réversibilité explicite.",resolution:"Définir le signal observable qui déclenchera la révision de la décision."}]:[];
  const recommendation=status==="completed"?`Avancer sur « ${objective} » avec un point de contrôle explicite et les preuves ${retrieval.hits.slice(0,3).map((hit)=>`[${hit.citation}]`).join(" ")}.`:null;
  return {id:input.id??crypto.randomUUID(),caseId:input.cognitiveCase.id,objective,status,selectedAgentIds:selected.map((agent)=>agent.id),contributions,divergences,synthesis:status==="completed"?`ORION consolide ${contributions.length} perspectives et ${retrieval.hits.length} preuves. ${divergences.length?"Une divergence reste tracée et doit devenir un critère de révision.":"Les perspectives convergent vers une décision conditionnelle et réversible."}`:`ORION suspend la recommandation : ${missingEvidence.join(" ; ")}.`,recommendation,confidence,missingEvidence,sourceIds:[...new Set(retrieval.hits.map((hit)=>hit.sourceId))],createdAt:input.createdAt??new Date().toISOString()};
}

function contribution(agent:AgentContract,cognitiveCase:CognitiveCase,objective:string,hits:ReturnType<typeof retrieveCaseContext>["hits"]):ExecutiveCycleContribution {
  const citations=hits.slice(0,3).map((hit)=>hit.citation);
  const evidenceIds=hits.slice(0,3).map((hit)=>hit.evidenceId);
  const cited=citations.length?citations.map((item)=>`[${item}]`).join(" "):"[preuve requise]";
  if(agent.id==="athena")return {agentId:agent.id,agentName:agent.name,mandate:MANDATES[agent.id],position:"support",analysis:`Le mandat « ${objective} » sert l’objectif « ${cognitiveCase.objective} » si le bénéfice attendu est mesuré. ${cited}`,confidence:Math.min(92,cognitiveCase.signals.confidence+10),evidenceIds,citations};
  if(agent.id==="turing")return {agentId:agent.id,agentName:agent.name,mandate:MANDATES[agent.id],position:"conditional",analysis:`Valider les dépendances, le propriétaire et le critère de sortie avant exécution. ${cited}`,confidence:Math.min(89,cognitiveCase.signals.confidence+6),evidenceIds,citations};
  return {agentId:agent.id,agentName:agent.name,mandate:MANDATES[agent.id]??agent.specialty,position:"challenge",analysis:`L’hypothèse la plus fragile doit être testée avant tout engagement irréversible ; risque actuel ${cognitiveCase.signals.risk}/10. ${cited}`,confidence:Math.min(94,cognitiveCase.signals.confidence+8),evidenceIds,citations};
}
