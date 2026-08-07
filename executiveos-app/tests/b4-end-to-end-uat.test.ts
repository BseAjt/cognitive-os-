import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runUnifiedRuntime } from "../lib/unified-runtime.ts";
import { executeAction } from "../lib/executive-runtime.ts";
import { defaultExecutiveAgents } from "../lib/agent-runtime.ts";
import { buildExecutiveCaseBrief } from "../lib/executive-brief.ts";
import type { ActionRecord, CognitiveCase, DossierObjectRecord, LearningEventRecord, ReflectionRecord } from "../domain/canonical.ts";

const cognitiveCase:CognitiveCase={
 id:"executiveos-uat",
 title:"Construire ExecutiveOS",
 objective:"Construire un Cognitive Operating System utilisable de bout en bout",
 workingHypothesis:"Un produit orienté dossiers apporte plus de valeur qu'une collection de moteurs",
 context:"B4 doit démontrer conversation, plan, exécution, résultat, apprentissage et reprise.",
 state:"execute",
 signals:{impact:10,urgency:8,confidence:79,cognitiveCost:7,risk:6}
};

test("UAT B4: ORION turns a dossier request into a structured executable plan",()=>{
 const result=runUnifiedRuntime({
   message:"Prépare un plan de lancement pour ExecutiveOS avec les dépendances techniques, les risques et les critères de réussite.",
   cognitiveCase,
   agents:defaultExecutiveAgents,
   recallSummary:"Le dossier est centré sur une expérience dossier-first et doit produire des résultats observables."
 });
 assert.ok(result.conversation.response.includes("ORION"));
 assert.ok(result.actions.length>=4,"ORION must create a multi-action plan");
 assert.ok(result.actions.some((item)=>item.requiredCapability==="technology"));
 assert.ok(result.memory.length>0,"conversation must enrich memory");
 assert.ok(result.knowledge.length>0,"conversation must enrich knowledge");
 assert.ok(result.trace.some((item)=>item.stage==="action"&&item.status==="completed"));

 const proposal=result.actions[0];
 const action:ActionRecord={id:"uat-action",caseId:cognitiveCase.id,title:proposal.title,owner:proposal.preferredAgentName??"À assigner",progress:0,status:"todo",requiredCapability:proposal.requiredCapability,assignedAgentId:proposal.preferredAgentId??null};
 const executed=executeAction(action,defaultExecutiveAgents);
 assert.equal(executed.status,"done");
 assert.equal(executed.progress,100);
 assert.ok(executed.result?.includes("produit"),"execution must create a visible business deliverable");
});

test("UAT B4: reopening the dossier gives a proactive resume and next best action",()=>{
 const actions:ActionRecord[]=[
   {id:"done",caseId:cognitiveCase.id,title:"Auditer le runtime",owner:"TURING",progress:100,status:"done",requiredCapability:"technology",result:"Audit technique produit"},
   {id:"next",caseId:cognitiveCase.id,title:"Valider le parcours pilote",owner:"ORION",progress:25,status:"doing",requiredCapability:"execution"}
 ];
 const objects:DossierObjectRecord[]=[{id:"risk",caseId:cognitiveCase.id,type:"risk",title:"Parcours utilisateur encore fragmenté",confidence:84,status:"active",source:"conversation",createdAt:"2026-08-07T18:00:00.000Z",updatedAt:"2026-08-07T18:00:00.000Z"}];
 const learnings:LearningEventRecord[]=[{id:"learning",caseId:cognitiveCase.id,type:"KnowledgeLearned",title:"Dossier-first",detail:"L'utilisateur attend un parcours complet plutôt que des moteurs séparés.",significance:"high",confidence:91,source:"cognitive_diff",createdAt:"2026-08-07T19:00:00.000Z"}];
 const reflections:ReflectionRecord[]=[{id:"reflection",caseId:cognitiveCase.id,summary:"Revoir l'expérience",whatChanged:["Le besoin produit est clarifié"],whyItChanged:["UAT"],learned:["Le dossier est l'unité centrale"],uncertainties:[],decisionsToReconsider:["Navigation par moteurs"],confidence:92,significance:"high",source:"reflection_engine",createdAt:"2026-08-07T19:10:00.000Z"}];
 const brief=buildExecutiveCaseBrief({cognitiveCase,decisions:[],actions,caseObjects:objects,learningEvents:learnings,reflections});
 assert.ok(brief.sinceLastSession.length>=3);
 assert.ok(brief.decisionsToReconsider.includes("Navigation par moteurs"));
 assert.equal(brief.nextAction,"Valider le parcours pilote");
 assert.match(brief.recommendation,/Depuis la dernière session/);
 assert.match(brief.recommendation,/ORION recommande/);
});

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,"..");
const commands=readFileSync(resolve(root,"store/commands.ts"),"utf8");
const runtimeSlice=readFileSync(resolve(root,"store/runtime-slice.ts"),"utf8");
const workspace=readFileSync(resolve(root,"components/executive-workspace.tsx"),"utf8");
const store=readFileSync(resolve(root,"store/executive-store.ts"),"utf8");

test("UAT B4: product contracts persist and expose the complete dossier loop",()=>{
 for(const contract of [
   'messages: [...state.messages',
   'caseObjects:',
   'actions:',
   'knowledgeRecords:',
   'memories:',
   'learningEvents:',
   'reflections:'
 ]) assert.ok(commands.includes(contract),`missing atomic dossier contract ${contract}`);
 assert.ok(runtimeSlice.includes('type: "RuntimeTaskExecuted"'));
 assert.ok(runtimeSlice.includes('executed.result'));
 assert.ok(workspace.includes("EXECUTIVE BRIEF"));
 assert.ok(workspace.includes("ORION · CONVERSATION DU DOSSIER"));
 assert.ok(workspace.includes("OBJETS DU DOSSIER"));
 assert.ok(store.includes("version: 16"),"dossier state must survive reload through persistence v16");
});
