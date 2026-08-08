import assert from "node:assert/strict";
import test from "node:test";
import { ingestContextSource, MAX_CONTEXT_SOURCE_CHARACTERS, sourceCitation, synthesizeCaseContext } from "../lib/context-ingestion.ts";

test("B7.1 ingests a source and preserves provenance",()=>{
  const result=ingestContextSource({caseId:"case-1",type:"meeting",title:"COMEX du 8 août",origin:"Réunion COMEX",content:"Le budget confirmé est de 120 000 euros. Le lancement doit intervenir avant octobre. Quel responsable porte le risque fournisseur ?",createdAt:"2026-08-08T08:00:00.000Z"},"source-1");
  assert.equal(result.source.status,"ready");
  assert.equal(result.source.origin,"Réunion COMEX");
  assert.equal(result.source.wordCount,21);
  assert.ok(result.evidence.some((item)=>item.claim.includes("120 000")));
  assert.ok(result.evidence.every((item)=>item.sourceId==="source-1"));
});

test("B7.1 builds a case-scoped cited synthesis",()=>{
  const first=ingestContextSource({caseId:"case-1",type:"note",title:"Budget",content:"Le budget confirmé est de 120 000 euros et ne peut pas être dépassé.",createdAt:"2026-08-08T08:00:00.000Z"},"source-1");
  const second=ingestContextSource({caseId:"case-1",type:"url",title:"Étude marché",origin:"https://example.test/study",content:"Le marché progresse de 18 % par an. Pourquoi notre conversion reste-t-elle inférieure à 4 % ?",createdAt:"2026-08-08T09:00:00.000Z"},"source-2");
  const other=ingestContextSource({caseId:"case-2",type:"note",title:"Hors dossier",content:"Cette information ne doit pas apparaître dans la synthèse du premier dossier."},"source-3");
  const sources=[first.source,second.source,other.source];
  const synthesis=synthesizeCaseContext("case-1",sources,[...first.evidence,...second.evidence,...other.evidence],"2026-08-08T10:00:00.000Z");
  assert.deepEqual(synthesis.sourceIds,["source-1","source-2"]);
  assert.match(synthesis.summary,/\[S1\]|\[S2\]/);
  assert.ok(!synthesis.summary.includes("ne doit pas apparaître"));
  assert.equal(sourceCitation("source-2",sources.filter((item)=>item.caseId==="case-1")),"S2");
});

test("B7.1 rejects empty and oversized content",()=>{
  assert.throws(()=>ingestContextSource({caseId:"case-1",type:"note",title:"Vide",content:"  "}),/aucun texte/);
  assert.throws(()=>ingestContextSource({caseId:"case-1",type:"note",title:"Trop long",content:"x".repeat(MAX_CONTEXT_SOURCE_CHARACTERS+1)}),/dépasse/);
});
