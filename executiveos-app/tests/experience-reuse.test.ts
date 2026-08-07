import test from "node:test";
import assert from "node:assert/strict";
import { buildExperienceRecommendation, buildReusableExperiences } from "../lib/experience-reuse.ts";
import type { CognitiveCase, DecisionRecord, DossierObjectRecord, LearningEventRecord } from "../domain/canonical.ts";
import type { CrossCaseLink } from "../lib/cross-case-memory.ts";

const active:CognitiveCase={id:"a",title:"ExecutiveCRM",objective:"Lancer un produit IA",workingHypothesis:"Le dossier guide la décision",context:"Produit commercial",state:"execute",signals:{impact:8,urgency:7,confidence:75,cognitiveCost:5,risk:5}};
const source:CognitiveCase={id:"b",title:"Construire ExecutiveOS",objective:"Lancer un produit IA",workingHypothesis:"Le dossier guide la décision",context:"Produit cognitif",state:"execute",signals:{impact:9,urgency:8,confidence:82,cognitiveCost:5,risk:4}};
const links:CrossCaseLink[]=[{sourceCaseId:"a",targetCaseId:"b",score:72,sharedConcepts:["dossier","decision","produit"],rationale:"3 concepts partagés : dossier, decision, produit."}];
const decisions:DecisionRecord[]=[{id:"d",caseId:"b",recommendation:"Piloter avant scale",outcome:"Lancer un pilote contrôlé",rationale:"Réduire le risque avant industrialisation",confidence:88,createdAt:"2026-08-07T10:00:00.000Z"}];
const risks:DossierObjectRecord[]=[{id:"r",caseId:"b",type:"risk",title:"Positionnement difficile à comprendre",confidence:80,status:"active",source:"conversation",createdAt:"2026-08-07T10:00:00.000Z",updatedAt:"2026-08-07T10:00:00.000Z"}];
const learnings:LearningEventRecord[]=[{id:"l",caseId:"b",type:"KnowledgeLearned",title:"Apprentissage produit",detail:"Un dossier de référence rend la valeur plus démontrable",significance:"high",confidence:91,source:"cognitive_diff",createdAt:"2026-08-07T11:00:00.000Z"}];

test("reuses decisions, risks and learnings from a similar dossier",()=>{
 const items=buildReusableExperiences({activeCase:active,cases:[active,source],links,decisions,caseObjects:risks,learningEvents:learnings});
 assert.equal(items.length,3);
 assert.ok(items.some((item)=>item.type==="decision"));
 assert.ok(items.some((item)=>item.type==="risk"));
 assert.ok(items.some((item)=>item.type==="learning"));
 assert.ok(items[0].relevance>=70);
 assert.match(buildExperienceRecommendation(items),/Expérience réutilisable/);
 assert.match(buildExperienceRecommendation(items),/Construire ExecutiveOS/);
});
