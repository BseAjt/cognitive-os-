import type { CaseContextSynthesis, ContextEvidenceRecord, ContextSourceRecord, ContextSourceType } from "../domain/canonical.ts";

export const MAX_CONTEXT_SOURCE_CHARACTERS = 200_000;

export interface ContextSourceInput {
  caseId:string;
  type:ContextSourceType;
  title:string;
  origin?:string;
  mimeType?:string;
  content:string;
  createdAt?:string;
}

export interface ContextIngestionResult {
  source:ContextSourceRecord;
  evidence:ContextEvidenceRecord[];
}

export function ingestContextSource(input:ContextSourceInput, id=crypto.randomUUID()):ContextIngestionResult {
  const createdAt=input.createdAt ?? new Date().toISOString();
  const title=input.title.trim();
  const rawContent=normalizeContent(input.content);
  if(!title) throw new Error("Le titre de la source est obligatoire.");
  if(!rawContent) throw new Error("La source ne contient aucun texte exploitable.");
  if(rawContent.length>MAX_CONTEXT_SOURCE_CHARACTERS) throw new Error(`La source dépasse ${MAX_CONTEXT_SOURCE_CHARACTERS.toLocaleString("fr-FR")} caractères.`);

  const sentences=splitSentences(rawContent);
  const selected=selectEvidence(sentences);
  const source:ContextSourceRecord={
    id,caseId:input.caseId,type:input.type,title,origin:input.origin?.trim()||title,mimeType:input.mimeType,
    status:"ready",rawContent,summary:buildSourceSummary(selected,rawContent),wordCount:countWords(rawContent),createdAt,processedAt:createdAt
  };
  const evidence=selected.map((item,index)=>({
    id:`${id}:evidence:${index+1}`,caseId:input.caseId,sourceId:id,claim:item.text,excerpt:item.text,confidence:item.confidence,position:item.position,createdAt
  }));
  return {source,evidence};
}

export function synthesizeCaseContext(caseId:string,sources:ContextSourceRecord[],evidence:ContextEvidenceRecord[],generatedAt=new Date().toISOString()):CaseContextSynthesis {
  const ready=sources.filter((source)=>source.caseId===caseId&&source.status==="ready");
  const sourceIds=new Set(ready.map((source)=>source.id));
  const relevant=evidence.filter((item)=>item.caseId===caseId&&sourceIds.has(item.sourceId));
  const facts=unique(relevant.filter((item)=>!isQuestion(item.claim)).sort((a,b)=>b.confidence-a.confidence).map((item)=>item.claim)).slice(0,6);
  const questions=unique(relevant.filter((item)=>isQuestion(item.claim)).map((item)=>item.claim)).slice(0,4);
  const summary=ready.length
    ? `${ready.length} source${ready.length>1?"s":""} analysée${ready.length>1?"s":""} · ${ready.reduce((sum,item)=>sum+item.wordCount,0)} mots. ${facts.slice(0,3).map((fact,index)=>`[S${sourceIndex(relevant.find((item)=>item.claim===fact)?.sourceId,ready)+1}] ${fact}`).join(" ")}`
    : "Aucune source exploitable n’est encore rattachée à ce dossier.";
  return {caseId,summary,keyFacts:facts,openQuestions:questions,sourceIds:ready.map((item)=>item.id),generatedAt};
}

export function sourceCitation(sourceId:string,sources:ContextSourceRecord[]):string {
  const index=sources.findIndex((item)=>item.id===sourceId);
  return index>=0?`S${index+1}`:"S?";
}

function normalizeContent(content:string):string { return content.replace(/\r\n?/g,"\n").replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim(); }
function countWords(content:string):number { return content.split(/\s+/u).filter(Boolean).length; }
function splitSentences(content:string):Array<{text:string;position:number}> {
  return content.split(/(?<=[.!?])\s+|\n+/u).map((text,position)=>({text:text.trim(),position})).filter((item)=>item.text.length>=20);
}
function selectEvidence(sentences:Array<{text:string;position:number}>):Array<{text:string;position:number;confidence:number}> {
  return sentences.map((item)=>({...item,confidence:scoreSentence(item.text)})).sort((a,b)=>b.confidence-a.confidence||a.position-b.position).slice(0,8).sort((a,b)=>a.position-b.position);
}
function scoreSentence(text:string):number {
  let score=65;
  if(/\d/.test(text)) score+=8;
  if(/\b(doit|objectif|contrainte|risque|décid|confirme|indique|résultat|deadline|budget)\b/iu.test(text)) score+=10;
  if(isQuestion(text)) score-=4;
  if(text.length>=50&&text.length<=240) score+=5;
  return Math.max(45,Math.min(95,score));
}
function buildSourceSummary(evidence:Array<{text:string}>,content:string):string { return evidence.slice(0,3).map((item)=>item.text).join(" ") || content.slice(0,360); }
function isQuestion(value:string):boolean { return value.endsWith("?")||/^(qui|que|quoi|comment|pourquoi|quand|où|quel|quelle|est-ce)/iu.test(value); }
function unique(values:string[]):string[] { return [...new Set(values.map((value)=>value.trim()).filter(Boolean))]; }
function sourceIndex(sourceId:string|undefined,sources:ContextSourceRecord[]):number { const index=sources.findIndex((item)=>item.id===sourceId); return Math.max(0,index); }
