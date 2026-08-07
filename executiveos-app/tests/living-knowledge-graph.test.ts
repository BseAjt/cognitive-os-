import test from "node:test";
import assert from "node:assert/strict";
import { buildLivingKnowledgeGraph, graphSummary } from "../lib/living-knowledge-graph.ts";
import type { CognitiveCase } from "../domain/canonical.ts";
import type { CrossCaseLink } from "../lib/cross-case-memory.ts";
import type { CrossCaseContradiction } from "../lib/cross-case-contradictions.ts";
import type { ReusableExperience } from "../lib/experience-reuse.ts";

const cases:CognitiveCase[]=[
 {id:"a",title:"ExecutiveCRM",objective:"Lancer produit",workingHypothesis:"",context:"",state:"execute",signals:{impact:8,urgency:7,confidence:75,cognitiveCost:5,risk:5}},
 {id:"b",title:"ExecutiveOS",objective:"Lancer produit",workingHypothesis:"",context:"",state:"learn",signals:{impact:9,urgency:8,confidence:82,cognitiveCost:5,risk:4}}
];
const links:CrossCaseLink[]=[{sourceCaseId:"a",targetCaseId:"b",score:72,sharedConcepts:["produit"],rationale:"1 concept partagé : produit."}];
const reusable:ReusableExperience[]=[{sourceCaseId:"b",sourceCaseTitle:"ExecutiveOS",type:"learning",title:"Valider avec un dossier de référence",detail:"",confidence:90,relevance:79,reason:"Dossier similaire."}];
const contradictions:CrossCaseContradiction[]=[{id:"c",leftCaseId:"a",rightCaseId:"b",leftCaseTitle:"ExecutiveCRM",rightCaseTitle:"ExecutiveOS",topic:"pricing",leftStatement:"Augmenter pricing",rightStatement:"Réduire pricing",confidence:84,reason:"Positions opposées."}];

test("living knowledge graph projects cases, reuse and contradictions without duplicate nodes",()=>{
 const graph=buildLivingKnowledgeGraph({cases,links,reusableExperiences:reusable,contradictions});
 assert.equal(graph.nodes.filter((n)=>n.type==="case").length,2);
 assert.equal(graph.nodes.filter((n)=>n.type==="experience").length,1);
 assert.equal(graph.nodes.filter((n)=>n.type==="contradiction").length,1);
 assert.ok(graph.edges.some((e)=>e.type==="RELATED_TO"));
 assert.ok(graph.edges.some((e)=>e.type==="REUSES"));
 assert.equal(graph.edges.filter((e)=>e.type==="CONFLICTS_WITH").length,2);
 assert.match(graphSummary(graph),/2 dossiers reliés/);
});
