import assert from "node:assert/strict";
import test from "node:test";
import { ingestContextSource } from "../lib/context-ingestion.ts";
import { retrieveCaseContext } from "../lib/cognitive-retrieval.ts";

const budget=ingestContextSource({caseId:"case-1",type:"meeting",title:"COMEX",origin:"Réunion du 8 août",content:"Le budget confirmé est de 120 000 euros. Le lancement doit intervenir avant octobre. Le risque fournisseur reste sous la responsabilité de Maya."},"source-1");
const market=ingestContextSource({caseId:"case-1",type:"url",title:"Étude marché",origin:"https://example.test/market",content:"Le marché progresse de 18 % par an. La conversion client reste inférieure à 4 %."},"source-2");
const privateSource=ingestContextSource({caseId:"case-2",type:"note",title:"Dossier secret",content:"Le budget confidentiel est de neuf millions d'euros."},"source-secret");
const sources=[budget.source,market.source,privateSource.source];
const evidence=[...budget.evidence,...market.evidence,...privateSource.evidence];

test("B7.2 retrieves ranked evidence with stable provenance",()=>{
  const result=retrieveCaseContext("case-1","Quel est le budget ?",sources,evidence);
  assert.equal(result.hits[0]?.sourceId,"source-1");
  assert.equal(result.hits[0]?.citation,"S1");
  assert.equal(result.hits[0]?.origin,"Réunion du 8 août");
  assert.ok((result.hits[0]?.score??0)>50);
});

test("B7.2 expands semantic concepts and remains case scoped",()=>{
  const result=retrieveCaseContext("case-1","Quel danger menace le fournisseur ?",sources,evidence);
  assert.ok(result.hits.some((hit)=>hit.excerpt.includes("risque fournisseur")));
  assert.ok(result.hits.every((hit)=>hit.sourceId!=="source-secret"));
  assert.equal(result.searchedSourceCount,2);
});

test("B7.2 returns an explicit empty result for an empty query",()=>{
  const result=retrieveCaseContext("case-1","   ",sources,evidence);
  assert.deepEqual(result.hits,[]);
  assert.equal(result.searchedEvidenceCount,budget.evidence.length+market.evidence.length);
});
