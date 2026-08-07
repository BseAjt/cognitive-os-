import test from "node:test";
import assert from "node:assert/strict";
import { buildCrossCaseLinks, reusableKnowledgeForLink } from "../lib/cross-case-memory.ts";
import type { CognitiveCase } from "../domain/canonical.ts";
import type { ConsolidatedKnowledge } from "../lib/live-memory.ts";

const active:CognitiveCase={id:"a",title:"Construire ExecutiveOS",objective:"Lancer un cognitive operating system",workingHypothesis:"Le dossier est l'unité de valeur",context:"Produit IA décisionnel",state:"execute",signals:{impact:9,urgency:8,confidence:82,cognitiveCost:5,risk:4}};
const similar:CognitiveCase={id:"b",title:"Lancer ExecutiveCRM",objective:"Lancer un operating system commercial",workingHypothesis:"Le dossier client est l'unité de valeur",context:"Produit IA pour décisions commerciales",state:"execute",signals:{impact:8,urgency:6,confidence:70,cognitiveCost:5,risk:5}};
const remote:CognitiveCase={id:"c",title:"Organiser le mariage",objective:"Planifier les prestataires",workingHypothesis:"Budget maîtrisé",context:"Evénement familial",state:"execute",signals:{impact:6,urgency:6,confidence:80,cognitiveCost:4,risk:3}};
const record=(caseId:string,title:string,confidence=85):ConsolidatedKnowledge=>({id:`k-${caseId}-${title}`,caseId,title,detail:title,confidence,sourceIds:[`s-${caseId}`],kind:"learning"});

test("cross-case memory links similar dossiers with an explainable score",()=>{
 const knowledgeByCase={a:[record("a","Les utilisateurs raisonnent par dossier")],b:[record("b","Le dossier structure les décisions utilisateurs")],c:[record("c","Le traiteur est réservé")]};
 const links=buildCrossCaseLinks({activeCase:active,cases:[active,similar,remote],knowledgeByCase,threshold:15});
 assert.ok(links.some((link)=>link.targetCaseId==="b"));
 assert.ok(!links.some((link)=>link.targetCaseId==="c"));
 const link=links.find((item)=>item.targetCaseId==="b")!;
 assert.ok(link.sharedConcepts.includes("dossier"));
 assert.match(link.rationale,/concept/);
 const reusable=reusableKnowledgeForLink(link,knowledgeByCase.b);
 assert.ok(reusable.length>=1);
});
