import type { ContextEvidenceRecord, ContextSourceRecord } from "../domain/canonical.ts";

export interface CognitiveRetrievalHit {
  evidenceId:string;
  sourceId:string;
  citation:string;
  title:string;
  origin:string;
  excerpt:string;
  score:number;
  lexicalScore:number;
  semanticScore:number;
  confidence:number;
  matchedTerms:string[];
}

export interface CognitiveRetrievalResult {
  caseId:string;
  query:string;
  hits:CognitiveRetrievalHit[];
  searchedSourceCount:number;
  searchedEvidenceCount:number;
}

const CONCEPTS:Record<string,string[]>= {
  budget:["coût","finance","prix","investissement","dépense"],
  risque:["danger","menace","incertitude","fragile","blocage"],
  délai:["date","échéance","deadline","calendrier","lancement"],
  décision:["arbitrage","choix","recommandation","décider"],
  responsable:["owner","propriétaire","pilote","porteur"],
  marché:["client","croissance","conversion","concurrence"]
};

export function retrieveCaseContext(
  caseId:string,
  query:string,
  sources:ContextSourceRecord[],
  evidence:ContextEvidenceRecord[],
  limit=6
):CognitiveRetrievalResult {
  const normalizedQuery=normalize(query);
  const scopedSources=sources.filter((source)=>source.caseId===caseId&&source.status==="ready");
  const sourceById=new Map(scopedSources.map((source,index)=>[source.id,{source,index}]));
  const scopedEvidence=evidence.filter((item)=>item.caseId===caseId&&sourceById.has(item.sourceId));
  if(!normalizedQuery) return {caseId,query:query.trim(),hits:[],searchedSourceCount:scopedSources.length,searchedEvidenceCount:scopedEvidence.length};

  const queryTerms=terms(normalizedQuery);
  const expanded=expandTerms(queryTerms);
  const hits=scopedEvidence.map((item)=>{
    const entry=sourceById.get(item.sourceId)!;
    const candidate=normalize(`${item.claim} ${entry.source.title} ${entry.source.summary}`);
    const candidateTerms=terms(candidate);
    const lexical=overlap(queryTerms,candidateTerms);
    const semantic=Math.max(overlap(expanded,candidateTerms),trigramSimilarity(normalizedQuery,candidate));
    const score=Math.round(Math.min(100,(lexical*.62+semantic*.28+(item.confidence/100)*.10)*100));
    const matchedTerms=[...queryTerms].filter((term)=>candidateTerms.has(term)||[...(CONCEPTS[term]??[])].some((related)=>candidateTerms.has(normalize(related))));
    return {
      evidenceId:item.id,sourceId:item.sourceId,citation:`S${entry.index+1}`,title:entry.source.title,
      origin:entry.source.origin,excerpt:item.excerpt,score,lexicalScore:Math.round(lexical*100),
      semanticScore:Math.round(semantic*100),confidence:item.confidence,matchedTerms
    };
  }).filter((hit)=>hit.score>=12).sort((a,b)=>b.score-a.score||b.confidence-a.confidence).slice(0,Math.max(1,limit));

  return {caseId,query:query.trim(),hits,searchedSourceCount:scopedSources.length,searchedEvidenceCount:scopedEvidence.length};
}

function normalize(value:string):string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9%]+/g," ").trim();
}
function terms(value:string):Set<string> { return new Set(value.split(/\s+/).filter((term)=>term.length>2)); }
function expandTerms(query:Set<string>):Set<string> {
  const result=new Set(query);
  for(const term of query) for(const [concept,related] of Object.entries(CONCEPTS)) {
    if(term===concept||related.map(normalize).includes(term)) { result.add(concept); related.map(normalize).forEach((item)=>result.add(item)); }
  }
  return result;
}
function overlap(query:Set<string>,candidate:Set<string>):number {
  if(!query.size)return 0;
  let matched=0;
  for(const term of query) if(candidate.has(term))matched++;
  return matched/query.size;
}
function trigramSimilarity(query:string,candidate:string):number {
  const queryGrams=trigrams(query);
  const candidateGrams=trigrams(candidate);
  if(!queryGrams.size)return 0;
  let matched=0;
  for(const gram of queryGrams)if(candidateGrams.has(gram))matched++;
  return Math.min(1,matched/queryGrams.size);
}
function trigrams(value:string):Set<string> {
  const compact=`  ${value.replace(/\s+/g," ")} `;
  const result=new Set<string>();
  for(let index=0;index<compact.length-2;index++)result.add(compact.slice(index,index+3));
  return result;
}
