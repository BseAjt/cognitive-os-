import test from "node:test";
import assert from "node:assert/strict";
import { consolidateLiveKnowledge, buildLiveMemorySummary } from "../lib/live-memory.ts";
import type { CognitiveCase, DossierObjectRecord, LearningEventRecord, MemoryRecord } from "../domain/canonical.ts";

const cognitiveCase:CognitiveCase={id:"b5",title:"Construire ExecutiveOS",objective:"Créer un Cognitive Operating System utile",workingHypothesis:"Le dossier est l'unité de valeur",context:"B4 est fermé",state:"learn",signals:{impact:9,urgency:7,confidence:82,cognitiveCost:5,risk:4}};
const objects:DossierObjectRecord[]=[{id:"o1",caseId:"b5",type:"hypothesis",title:"Le dossier est l'unité de valeur",confidence:82,status:"active",source:"conversation",createdAt:"2026-08-07T10:00:00.000Z",updatedAt:"2026-08-07T10:00:00.000Z"}];
const memories:MemoryRecord[]=[{id:"m1",caseId:"b5",kind:"hypothesis",content:"Le dossier est l'unité de valeur",confidence:90,durable:true,createdAt:"2026-08-07T10:00:00.000Z"}];
const learningEvents:LearningEventRecord[]=[{id:"l1",caseId:"b5",type:"KnowledgeLearned",title:"Apprentissage",detail:"Les utilisateurs pensent par dossier, pas par moteur",significance:"high",confidence:88,source:"cognitive_diff",createdAt:"2026-08-07T11:00:00.000Z"}];

test("live memory consolidates duplicate knowledge across cognitive sources",()=>{
 const records=consolidateLiveKnowledge({cognitiveCase,caseObjects:objects,memories,knowledgeRecords:[],learningEvents});
 const hypothesis=records.find((item)=>item.title.includes("dossier est l'unité"));
 assert.ok(hypothesis);
 assert.equal(hypothesis.sourceIds.length,2);
 assert.equal(hypothesis.confidence,86);
 assert.ok(records.some((item)=>item.kind==="learning"));
 assert.match(buildLiveMemorySummary(records),/Mémoire vivante consolidée/);
});
