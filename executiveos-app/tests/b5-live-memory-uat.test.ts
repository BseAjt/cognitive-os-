import test from "node:test";
import assert from "node:assert/strict";
import { consolidateLiveKnowledge } from "../lib/live-memory.ts";
import { buildCrossCaseLinks } from "../lib/cross-case-memory.ts";
import { buildReusableExperiences } from "../lib/experience-reuse.ts";
import { detectCrossCaseContradictions } from "../lib/cross-case-contradictions.ts";
import { buildKnowledgeSuggestions } from "../lib/knowledge-suggestions.ts";
import { buildLivingKnowledgeGraph } from "../lib/living-knowledge-graph.ts";
import type { CognitiveCase, DecisionRecord, DossierObjectRecord, LearningEventRecord, MemoryRecord } from "../domain/canonical.ts";

const active:CognitiveCase={id:"new",title:"Lancer ExecutiveCRM",objective:"Lancer un produit IA organisé par dossier",workingHypothesis:"Le dossier client structure la décision",context:"Réutiliser les apprentissages ExecutiveOS",state:"execute",signals:{impact:8,urgency:7,confidence:70,cognitiveCost:5,risk:5}};
const source:CognitiveCase={id:"old",title:"Construire ExecutiveOS",objective:"Lancer un produit IA organisé par dossier",workingHypothesis:"Le dossier structure la décision",context:"Pilote produit",state:"learn",signals:{impact:9,urgency:7,confidence:84,cognitiveCost:5,risk:4}};
const decisions:DecisionRecord[]=[
 {id:"d-new",caseId:"new",recommendation:"Augmenter le pricing pilote",outcome:"Choisir pricing premium",rationale:"Tester la valeur",confidence:72,createdAt:"2026-08-07T12:00:00.000Z"},
 {id:"d-old",caseId:"old",recommendation:"Réduire le pricing pilote",outcome:"Choisir pricing accessible",rationale:"Accélérer validation",confidence:88,createdAt:"2026-08-07T10:00:00.000Z"}
];
const objects:DossierObjectRecord[]=[
 {id:"o-new",caseId:"new",type:"hypothesis",title:"Le dossier structure la décision produit",confidence:58,status:"active",source:"conversation",createdAt:"2026-08-07T12:00:00.000Z",updatedAt:"2026-08-07T12:00:00.000Z"},
 {id:"r-old",caseId:"old",type:"risk",title:"Positionnement difficile à comprendre",confidence:82,status:"active",source:"conversation",createdAt:"2026-08-07T10:00:00.000Z",updatedAt:"2026-08-07T10:00:00.000Z"}
];
const memories:MemoryRecord[]=[{id:"m-old",caseId:"old",kind:"hypothesis",content:"Le dossier structure la décision produit",confidence:90,durable:true,createdAt:"2026-08-07T10:00:00.000Z"}];
const learnings:LearningEventRecord[]=[{id:"l-old",caseId:"old",type:"KnowledgeLearned",title:"Apprentissage produit",detail:"Un dossier de référence rend la valeur du produit démontrable",significance:"high",confidence:92,source:"cognitive_diff",createdAt:"2026-08-07T11:00:00.000Z"}];

test("B5 UAT: a new dossier benefits from consolidated cross-dossier memory",()=>{
 const cases=[active,source];
 const knowledgeByCase=Object.fromEntries(cases.map((cognitiveCase)=>[cognitiveCase.id,consolidateLiveKnowledge({cognitiveCase,caseObjects:objects,memories,knowledgeRecords:[],learningEvents:learnings})]));
 assert.ok(knowledgeByCase.old.length>=2);

 const links=buildCrossCaseLinks({activeCase:active,cases,knowledgeByCase,threshold:10});
 assert.ok(links.some((link)=>link.targetCaseId==="old"));

 const experiences=buildReusableExperiences({activeCase:active,cases,links,decisions,caseObjects:objects,learningEvents:learnings});
 assert.ok(experiences.some((item)=>item.sourceCaseId==="old" && item.type==="learning"));
 assert.ok(experiences.some((item)=>item.sourceCaseId==="old" && item.type==="risk"));

 const contradictions=detectCrossCaseContradictions({cases,decisions,caseObjects:objects,learningEvents:learnings});
 assert.ok(contradictions.some((item)=>item.leftCaseId!==item.rightCaseId));

 const suggestions=buildKnowledgeSuggestions({activeCase:active,liveKnowledge:knowledgeByCase.new,links,reusableExperiences:experiences,contradictions});
 assert.ok(suggestions.some((item)=>item.type==="review_contradiction"));
 assert.ok(suggestions.some((item)=>item.type==="reuse_experience"));

 const graph=buildLivingKnowledgeGraph({cases,links,reusableExperiences:experiences,contradictions});
 assert.ok(graph.edges.some((edge)=>edge.type==="RELATED_TO"));
 assert.ok(graph.edges.some((edge)=>edge.type==="REUSES"));
 assert.ok(graph.edges.some((edge)=>edge.type==="CONFLICTS_WITH"));
});
