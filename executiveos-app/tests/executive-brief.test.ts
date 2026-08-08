import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildExecutiveCaseBrief } from "../lib/executive-brief.ts";
import type { ActionRecord, CognitiveCase, DecisionRecord, DossierObjectRecord, LearningEventRecord, ReflectionRecord } from "../domain/canonical.ts";

const cognitiveCase:CognitiveCase={id:"brief",title:"Lancer ExecutiveOS",objective:"Décider du lancement",workingHypothesis:"Le besoin existe",context:"Pilotes en cours",state:"execute",signals:{impact:9,urgency:8,confidence:78,cognitiveCost:6,risk:8}};
const decisions:DecisionRecord[]=[{id:"d",caseId:"brief",recommendation:"Lancer un pilote",outcome:"Pilote contrôlé",rationale:"Réduire le risque",confidence:84,createdAt:"2026-08-07T10:00:00.000Z"}];
const actions:ActionRecord[]=[
 {id:"a",caseId:"brief",title:"Valider cinq utilisateurs",owner:"ORION",progress:20,status:"blocked",blockedReason:"Recrutement incomplet"},
 {id:"done",caseId:"brief",title:"Auditer le runtime",owner:"TURING",progress:100,status:"done",result:"Audit technique livré"}
];
const objects:DossierObjectRecord[]=[{id:"r",caseId:"brief",type:"risk",title:"Faible disposition à payer",confidence:88,status:"active",source:"conversation",createdAt:"2026-08-07T10:00:00.000Z",updatedAt:"2026-08-07T10:00:00.000Z"}];
const learnings:LearningEventRecord[]=[{id:"l",caseId:"brief",type:"KnowledgeLearned",title:"Apprentissage",detail:"Les pilotes veulent une intégration calendrier",significance:"medium",confidence:82,source:"cognitive_diff",createdAt:"2026-08-07T11:00:00.000Z"}];
const reflections:ReflectionRecord[]=[{id:"ref",caseId:"brief",summary:"Le contexte a changé",whatChanged:["Le risque commercial augmente"],whyItChanged:["Retour pilote"],learned:["Intégration calendrier requise"],uncertainties:["Disposition à payer"],decisionsToReconsider:["Pilote contrôlé"],confidence:87,significance:"high",source:"reflection_engine",createdAt:"2026-08-07T12:00:00.000Z"}];

test("Executive Brief derives decision, action, blockers, risk and learning from the dossier",()=>{
 const brief=buildExecutiveCaseBrief({cognitiveCase,decisions,actions,caseObjects:objects,learningEvents:learnings,reflections});
 assert.equal(brief.latestDecision,"Pilote contrôlé");
 assert.equal(brief.nextAction,"Valider cinq utilisateurs");
 assert.ok(brief.blockers.some((item)=>item.includes("Recrutement incomplet")));
 assert.deepEqual(brief.criticalRisks,["Faible disposition à payer"]);
 assert.match(brief.latestLearning,/calendrier/);
 assert.equal(brief.health,"critical");
});

test("B4.6 makes ORION proactive when reopening a dossier",()=>{
 const brief=buildExecutiveCaseBrief({cognitiveCase,decisions,actions,caseObjects:objects,learningEvents:learnings,reflections});
 assert.deepEqual(brief.decisionsToReconsider,["Pilote contrôlé"]);
 assert.ok(brief.sinceLastSession.some((item)=>item.includes("action(s) terminée(s)")));
 assert.ok(brief.sinceLastSession.some((item)=>item.includes("décision(s) à reconsidérer")));
 assert.ok(brief.proactiveAlerts.some((item)=>item.startsWith("Blocage:")));
 assert.ok(brief.proactiveAlerts.some((item)=>item.startsWith("Risque critique:")));
 assert.ok(brief.proactiveAlerts.some((item)=>item.startsWith("Décision à revoir:")));
 assert.match(brief.recommendation,/Depuis la dernière session/);
 assert.match(brief.recommendation,/ORION recommande/);
 assert.match(brief.recommendation,/Lever le blocage/);
});

const here=dirname(fileURLToPath(import.meta.url));const root=resolve(here,"..");
const workspace=readFileSync(resolve(root,"components/executive-workspace.tsx"),"utf8");
test("Executive Brief is visible in the dossier workspace",()=>{
 assert.ok(workspace.includes("EXECUTIVE BRIEF"));
 assert.ok(workspace.includes("buildExecutiveCaseBrief"));
 assert.ok(workspace.includes("Risques critiques"));
 assert.ok(workspace.includes("Recommandation ORION"));
 assert.ok(workspace.includes("B7.6 · Synthèse exécutive sourcée"));
 assert.ok(workspace.includes("brief.citedEvidence"));
});

test("B7.6 unifies sources, execution plan and Decision Watch in a cited executive brief",()=>{
 const brief=buildExecutiveCaseBrief({cognitiveCase,decisions,actions,caseObjects:objects,learningEvents:learnings,reflections,contextSources:[{id:"s1",caseId:"brief",type:"note",title:"Retour pilote",origin:"COMEX",status:"ready",rawContent:"Le budget baisse.",summary:"Budget",wordCount:3,createdAt:"2026-08-08T00:00:00.000Z"}],contextEvidence:[{id:"e1",caseId:"brief",sourceId:"s1",claim:"Le budget disponible baisse de 20 %.",excerpt:"Le budget baisse.",confidence:91,position:0,createdAt:"2026-08-08T00:00:00.000Z"}],decisionActionPlans:[{id:"p1",caseId:"brief",executiveCycleId:"c1",decisionId:"d",recommendation:"Pilote contrôlé",status:"active",actionIds:["a"],dependencies:[],metrics:[],checkpointAt:"2026-08-22T00:00:00.000Z",createdAt:"2026-08-07T10:00:00.000Z"}],decisionWatches:[{id:"w1",caseId:"brief",planId:"p1",decisionId:"d",status:"reopen",signals:[],summary:"Le budget fragilise la décision.",recommendedAction:"Relancer ORION.",evaluatedAt:"2026-08-08T12:00:00.000Z"}],generatedAt:"2026-08-08T13:00:00.000Z"});
 assert.equal(brief.watchStatus,"reopen");assert.equal(brief.citedEvidence[0]?.citation,"S1");assert.match(brief.executiveSummary,/plan associé compte 1 actions/);assert.equal(brief.generatedAt,"2026-08-08T13:00:00.000Z");
});
