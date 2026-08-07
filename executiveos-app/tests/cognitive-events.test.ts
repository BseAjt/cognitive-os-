import test from "node:test";
import assert from "node:assert/strict";
import { projectCognitiveEvents } from "../lib/cognitive-events.ts";
import type { ActionRecord, DecisionRecord, DossierObjectRecord, LearningEventRecord, MemoryRecord } from "../domain/canonical.ts";

const caseId = "case-1";
const decisions:DecisionRecord[]=[{id:"d1",caseId,recommendation:"Lancer",outcome:"Lancement retenu",rationale:"Les preuves convergent.",confidence:86,createdAt:"2026-08-07T10:10:00.000Z"}];
const objects:DossierObjectRecord[]=[
 {id:"q1",caseId,type:"question",title:"Dois-je lancer le produit ?",confidence:90,status:"open",source:"conversation",createdAt:"2026-08-07T10:00:00.000Z",updatedAt:"2026-08-07T10:00:00.000Z"},
 {id:"h1",caseId,type:"hypothesis",title:"Le marché est prêt",confidence:72,status:"active",source:"conversation",createdAt:"2026-08-07T10:03:00.000Z",updatedAt:"2026-08-07T10:03:00.000Z"}
];
const actions:ActionRecord[]=[{id:"a1",caseId,title:"Tester le lancement",owner:"ORION",progress:100,status:"done",result:"Pilote validé",dueAt:"2026-08-07T10:20:00.000Z"}];
const learnings:LearningEventRecord[]=[{id:"l1",caseId,type:"KnowledgeLearned",title:"Le pilote valide l'usage",detail:"Les utilisateurs reprennent le dossier sans relire le chat.",significance:"high",confidence:91,source:"cognitive_diff",createdAt:"2026-08-07T10:30:00.000Z"}];
const memories:MemoryRecord[]=[{id:"m1",caseId,kind:"decision",content:"Le lancement est retenu après validation pilote.",confidence:94,durable:true,source:"manual",createdAt:"2026-08-07T10:31:00.000Z"}];

test("projects immutable domain traces into typed cognitive events",()=>{
 const events=projectCognitiveEvents({
  caseId,
  messages:[
   {id:"msg-u",caseId,role:"user",text:"Dois-je lancer le produit ?",createdAt:"2026-08-07T09:59:00.000Z"},
   {id:"msg-o",caseId,role:"assistant",text:"Je recommande de tester trois scénarios.",createdAt:"2026-08-07T10:01:00.000Z"}
  ],
  caseObjects:objects,
  decisions,
  actions,
  learningEvents:learnings,
  reasoningRevisions:[
   {id:"r1",caseId,stepId:"hypothesis",version:1,content:"Le marché est prêt",confidence:65,createdAt:"2026-08-07T10:02:00.000Z"},
   {id:"r2",caseId,stepId:"hypothesis",version:2,content:"Le marché est prêt si onboarding < 5 min",confidence:78,createdAt:"2026-08-07T10:08:00.000Z"}
  ],
  memories
 });
 assert.ok(events.length>=9);
 assert.equal(events[0].type,"question");
 assert.ok(events.some((event)=>event.type==="revision" && event.metadata.version===2));
 assert.ok(events.some((event)=>event.type==="decision" && event.confidenceAfter===86));
 assert.ok(events.some((event)=>event.type==="outcome" && event.summary==="Pilote validé"));
 assert.ok(events.some((event)=>event.type==="learning" && event.impact==="high"));
 assert.ok(events.some((event)=>event.type==="memory" && event.produces.includes("m1")));
 for(const event of events){
  assert.equal(event.caseId,caseId);
  assert.ok(event.title.length>0);
  assert.ok(event.summary.length>0);
  assert.ok(["critical","high","medium","low"].includes(event.impact));
 }
});

test("never leaks events from another dossier",()=>{
 const events=projectCognitiveEvents({
  caseId,
  messages:[{id:"foreign",caseId:"other",role:"user",text:"Dois-je abandonner ?",createdAt:"2026-08-07T09:00:00.000Z"}],
  caseObjects:[],decisions:[],actions:[],learningEvents:[],reasoningRevisions:[],memories:[]
 });
 assert.equal(events.length,0);
});
