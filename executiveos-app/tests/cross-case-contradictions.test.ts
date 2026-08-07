import test from "node:test";
import assert from "node:assert/strict";
import { detectCrossCaseContradictions } from "../lib/cross-case-contradictions.ts";
import type { CognitiveCase, DecisionRecord } from "../domain/canonical.ts";

const cases:CognitiveCase[]=[
 {id:"a",title:"Produit A",objective:"Choisir stratégie",workingHypothesis:"",context:"",state:"decide",signals:{impact:8,urgency:7,confidence:80,cognitiveCost:5,risk:4}},
 {id:"b",title:"Produit B",objective:"Choisir stratégie",workingHypothesis:"",context:"",state:"decide",signals:{impact:8,urgency:7,confidence:80,cognitiveCost:5,risk:4}}
];
const decisions:DecisionRecord[]=[
 {id:"d1",caseId:"a",recommendation:"Adopter une stratégie cloud",outcome:"Choisir architecture cloud",rationale:"",confidence:88,createdAt:"2026-08-07T10:00:00.000Z"},
 {id:"d2",caseId:"b",recommendation:"Éviter la stratégie cloud",outcome:"Rejeter architecture cloud",rationale:"",confidence:82,createdAt:"2026-08-07T11:00:00.000Z"}
];

test("detects opposing positions on a shared cross-case topic",()=>{
 const contradictions=detectCrossCaseContradictions({cases,decisions,caseObjects:[],learningEvents:[]});
 assert.ok(contradictions.length>=1);
 assert.ok(["architecture","strategie","cloud"].includes(contradictions[0].topic));
 assert.ok(contradictions[0].confidence>=80);
 assert.match(contradictions[0].reason,/Positions opposées/);
 assert.notEqual(contradictions[0].leftCaseId,contradictions[0].rightCaseId);
});
