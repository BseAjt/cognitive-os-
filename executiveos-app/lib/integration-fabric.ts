import type { ContextSourceType, ExternalSignalRecord, IntegrationConnectionRecord, IntegrationProvider, IntegrationSyncRunRecord } from "../domain/canonical.ts";

export const PROVIDER_CATALOG:Record<IntegrationProvider,{label:string;scopes:string[]}>={
  gmail:{label:"Gmail",scopes:["messages.read"]},calendar:{label:"Calendrier",scopes:["events.read"]},slack:{label:"Slack",scopes:["channels.history"]},notion:{label:"Notion",scopes:["pages.read"]},drive:{label:"Documents",scopes:["files.read"]},meetings:{label:"Réunions",scopes:["transcripts.read"]}
};

export interface NormalizedSignal { fingerprint:string; type:ContextSourceType; title:string; origin:string; mimeType?:string; content:string; createdAt:string }

export function normalizeExternalSignal(connection:IntegrationConnectionRecord,signal:ExternalSignalRecord):NormalizedSignal {
  if(connection.provider!==signal.provider) throw new Error("Le signal ne correspond pas au connecteur.");
  if(!signal.externalId.trim()||!signal.content.trim()) throw new Error("Le signal externe est incomplet.");
  return {fingerprint:`integration:${signal.provider}:${signal.externalId}`,type:sourceType(signal),title:signal.title.trim()||PROVIDER_CATALOG[signal.provider].label,origin:signal.origin.trim()||PROVIDER_CATALOG[signal.provider].label,mimeType:signal.mimeType,content:signal.content.trim(),createdAt:signal.occurredAt};
}

export function buildSyncRun(input:{id:string;connection:IntegrationConnectionRecord;discovered:number;ingested:number;duplicates:number;failed:number;sourceIds:string[];startedAt:string;completedAt:string;errors:string[]}):IntegrationSyncRunRecord {
  const status=input.failed===0?"success":input.ingested>0?"partial":"failed";
  return {id:input.id,connectionId:input.connection.id,caseId:input.connection.caseId,status,discovered:input.discovered,ingested:input.ingested,duplicates:input.duplicates,failed:input.failed,sourceIds:input.sourceIds,startedAt:input.startedAt,completedAt:input.completedAt,cursor:input.completedAt,errors:input.errors};
}

export function demoSignals(provider:IntegrationProvider,at=new Date().toISOString()):ExternalSignalRecord[]{
  const catalog:Record<IntegrationProvider,ExternalSignalRecord>={
    gmail:{externalId:`gmail-${at.slice(0,10)}`,provider,kind:"email",title:"Validation du sponsor",content:"Le sponsor confirme le budget du pilote et demande un suivi hebdomadaire des risques, du délai et de l’adoption.",origin:"sponsor@executiveos.demo",occurredAt:at,participants:["Sponsor","Direction produit"],tags:["budget","risque"]},
    calendar:{externalId:`calendar-${at.slice(0,10)}`,provider,kind:"calendar_event",title:"Comité de décision",content:"Comité de décision planifié. Ordre du jour : valider le pilote, le responsable, les critères de succès et le prochain checkpoint ORION.",origin:"Calendrier exécutif",occurredAt:at,participants:["COMEX"],tags:["decision"]},
    slack:{externalId:`slack-${at.slice(0,10)}`,provider,kind:"message",title:"Signal terrain",content:"L’équipe signale une dépendance fournisseur non résolue qui peut bloquer le délai de lancement.",origin:"#pilotage-produit",occurredAt:at,participants:["Delivery"],tags:["blocage"]},
    notion:{externalId:`notion-${at.slice(0,10)}`,provider,kind:"page",title:"Hypothèses du pilote",content:"Hypothèse principale : un pilote limité réduit le risque tout en permettant de mesurer l’adoption et la conversion.",origin:"Notion / Strategy",occurredAt:at,participants:["Strategy"],tags:["hypothese"]},
    drive:{externalId:`drive-${at.slice(0,10)}`,provider,kind:"document",title:"Business case pilote",content:"Le business case fixe un budget maximum de 120 000 euros et une durée de huit semaines. Le seuil de conversion attendu est de 4 %. Le risque fournisseur doit être revu chaque semaine.",origin:"Drive / Business case",occurredAt:at,participants:["Finance"],tags:["budget","kpi"],mimeType:"text/plain"},
    meetings:{externalId:`meeting-${at.slice(0,10)}`,provider,kind:"meeting",title:"Compte rendu du COMEX",content:"Le COMEX soutient le lancement sous condition de nommer un responsable, de suivre les risques fournisseur et de réévaluer la décision dans deux semaines.",origin:"Transcription COMEX",occurredAt:at,participants:["CEO","COO","CFO"],tags:["decision","checkpoint"]}
  };
  return [catalog[provider]];
}

function sourceType(signal:ExternalSignalRecord):ContextSourceType { if(signal.kind==="meeting"||signal.kind==="calendar_event")return "meeting"; if(signal.kind==="document"||signal.kind==="page")return "document"; return "message"; }
