import test from "node:test";
import assert from "node:assert/strict";
import { buildSmartPlan } from "../lib/smart-plan.ts";
import { runUnifiedRuntime } from "../lib/unified-runtime.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const cognitiveCase:CognitiveCase={id:"plan",title:"Lancement ExecutiveOS",objective:"Valider puis lancer ExecutiveOS",workingHypothesis:"Le besoin existe",context:"Pilotes disponibles",state:"execute",signals:{impact:9,urgency:8,confidence:76,cognitiveCost:6,risk:6}};

test("smart plan is only generated for execution-oriented requests",()=>{
 assert.equal(buildSmartPlan("Quel est le contexte ?",cognitiveCase),undefined);
 const plan=buildSmartPlan("Prépare un plan de lancement",cognitiveCase);
 assert.ok(plan);
 assert.equal(plan?.actions.length,4);
 assert.ok(plan?.risks.length);
 assert.match(plan?.title??"",/Plan/);
});

test("Unified Runtime turns a plan request into multiple persistent action proposals",()=>{
 const result=runUnifiedRuntime({message:"Prépare un plan de lancement pour ExecutiveOS",cognitiveCase});
 assert.ok(result.plan);
 assert.ok(result.actions.length>=4);
 assert.ok(result.actions.some((item)=>item.title.includes("critères de réussite")));
 assert.ok(result.knowledge.some((item)=>item.type==="risk"));
 assert.ok(result.conversation.response.includes("Plan de lancement créé"));
 assert.equal(result.nextAction,result.plan?.actions[0]?.title);
});
