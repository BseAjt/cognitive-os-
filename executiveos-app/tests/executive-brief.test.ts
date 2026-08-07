import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildExecutiveCaseBrief } from "../lib/executive-brief.ts";
import type { ActionRecord, CognitiveCase, DecisionRecord, DossierObjectRecord, LearningEventRecord } from "../domain/canonical.ts";

const cognitiveCase:CognitiveCase={id:"brief",title:"Lancer ExecutiveOS",objective:"Décider du lancement",workingHypothesis:"Le besoin existe",context:"Pilotes en cours",state:"execute",signals:{impact:9,urgency:8,confidence:78,cognitiveCost:6,risk:8}};
const decisions:DecisionRecord[]=[{id:"d",caseId:"brief",recommendation:"Lancer un pilote",outcome:"Pilote contrôlé",rationale:"Réduire le risque",confidence:84,createdAt:"2026-08-07T10:00:00.000Z"}];
const actions:ActionRecord[]=[{id:"a",caseId:"brief",title:"Valider cinq utilisateurs",owner:"ORION",progress:20,status:"blocked",blockedReason:"Recrutement incomplet"}];
const objects:DossierObjectRecord[]=[{id:"r",caseId:"brief",type:"risk",title:"Faible disposition à payer",confidence:88,status:"active",source:"conversation",createdAt:"2026-08-07T10:00:00.000Z",updatedAt:"2026-08-07T10:00:00.000Z"}];
const learnings:LearningEventRecord[]=[{id:"l",caseId:"brief",type:"KnowledgeLearned",title:"Apprentissage",detail:"Les pilotes veulent une intégration calendrier",significance:"medium",confidence:82,source:"cognitive_diff",createdAt:"2026-08-07T11:00:00.000Z"}];

test("Executive Brief derives decision, action, blockers, risk and learning from the dossier",()=>{
 const brief=buildExecutiveCaseBrief({cognitiveCase,decisions,actions,caseObjects:objects,learningEvents:learnings,reflections:[]});
 assert.equal(brief.latestDecision,"Pilote contrôlé");
 assert.equal(brief.nextAction,"Valider cinq utilisateurs");
 assert.ok(brief.blockers.some((item)=>item.includes("Recrutement incomplet")));
 assert.deepEqual(brief.criticalRisks,["Faible disposition à payer"]);
 assert.match(brief.latestLearning,/calendrier/);
 assert.equal(brief.health,"critical");
 assert.match(brief.recommendation,/Lever le blocage/);
});

const here=dirname(fileURLToPath(import.meta.url));const root=resolve(here,"..");
const workspace=readFileSync(resolve(root,"components/executive-workspace.tsx"),"utf8");
test("Executive Brief is visible in the dossier workspace",()=>{
 assert.ok(workspace.includes("EXECUTIVE BRIEF"));
 assert.ok(workspace.includes("buildExecutiveCaseBrief"));
 assert.ok(workspace.includes("Risques critiques"));
 assert.ok(workspace.includes("Recommandation ORION"));
});
