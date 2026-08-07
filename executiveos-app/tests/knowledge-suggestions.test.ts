import test from "node:test";
import assert from "node:assert/strict";
import { buildKnowledgeSuggestionBrief, buildKnowledgeSuggestions } from "../lib/knowledge-suggestions.ts";
import type { CognitiveCase } from "../domain/canonical.ts";
import type { ConsolidatedKnowledge } from "../lib/live-memory.ts";
import type { CrossCaseLink } from "../lib/cross-case-memory.ts";
import type { ReusableExperience } from "../lib/experience-reuse.ts";
import type { CrossCaseContradiction } from "../lib/cross-case-contradictions.ts";

const active:CognitiveCase={id:"a",title:"ExecutiveCRM",objective:"Lancer un produit IA",workingHypothesis:"Le dossier guide la décision",context:"Produit commercial",state:"execute",signals:{impact:8,urgency:7,confidence:75,cognitiveCost:5,risk:5}};
const live:ConsolidatedKnowledge[]=[{id:"k1",caseId:"a",title:"La cible accepte un prix premium",detail:"Hypothèse pricing",confidence:54,sourceIds:["m1"],kind:"hypothesis"}];
const links:CrossCaseLink[]=[{sourceCaseId:"a",targetCaseId:"b",score:72,sharedConcepts:["dossier","produit"],rationale:"2 concepts partagés : dossier, produit."}];
const reusable:ReusableExperience[]=[{sourceCaseId:"b",sourceCaseTitle:"Construire ExecutiveOS",type:"learning",title:"Apprentissage produit",detail:"Un dossier de référence rend la valeur démontrable",confidence:91,relevance:80,reason:"Dossier similaire à 72%."}];
const contradictions:CrossCaseContradiction[]=[{id:"c1",leftCaseId:"a",rightCaseId:"b",leftCaseTitle:"ExecutiveCRM",rightCaseTitle:"Construire ExecutiveOS",topic:"pricing",leftStatement:"Augmenter le pricing",rightStatement:"Réduire le pricing",confidence:84,reason:"Positions opposées détectées sur « pricing » dans deux dossiers différents."}];

test("knowledge suggestions prioritize contradictions and reusable experience",()=>{
 const suggestions=buildKnowledgeSuggestions({activeCase:active,liveKnowledge:live,links,reusableExperiences:reusable,contradictions});
 assert.ok(suggestions.length>=4);
 assert.equal(suggestions[0].type,"review_contradiction");
 assert.ok(suggestions.some((item)=>item.type==="reuse_experience"));
 assert.ok(suggestions.some((item)=>item.type==="related_case"));
 assert.ok(suggestions.some((item)=>item.type==="validate_knowledge"));
 assert.match(buildKnowledgeSuggestionBrief(suggestions),/Revoir/);
});
