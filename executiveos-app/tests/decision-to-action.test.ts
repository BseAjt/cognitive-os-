import test from "node:test";
import assert from "node:assert/strict";
import { buildDecisionToAction } from "../lib/decision-to-action.ts";
import type { CognitiveCase, ExecutiveCycleRecord } from "../domain/canonical.ts";

const cognitiveCase:CognitiveCase={id:"case-b74",title:"Lancement",objective:"Lancer le produit",workingHypothesis:"Le marché est prêt",context:"Pilote validé",state:"decide",signals:{impact:9,urgency:8,confidence:78,cognitiveCost:5,risk:6}};
const cycle:ExecutiveCycleRecord={id:"cycle-b74",caseId:cognitiveCase.id,objective:"Valider le lancement",status:"completed",selectedAgentIds:["athena","turing","seneca"],contributions:[{agentId:"athena",agentName:"ATHENA",mandate:"Stratégie",position:"support",analysis:"Avancer",confidence:86,evidenceIds:["e1"],citations:["S1"]},{agentId:"turing",agentName:"TURING",mandate:"Exécution",position:"conditional",analysis:"Planifier",confidence:82,evidenceIds:["e1"],citations:["S1"]}],divergences:[],synthesis:"Convergence",recommendation:"Lancer avec un checkpoint [S1].",confidence:84,missingEvidence:[],sourceIds:["s1"],createdAt:"2026-08-08T00:00:00.000Z"};

test("B7.4 converts a completed ORION recommendation into a measurable execution plan",()=>{const result=buildDecisionToAction({cognitiveCase,cycle,id:"plan-1",decisionId:"decision-1",actionIds:["a1","a2","a3"],createdAt:"2026-08-08T00:00:00.000Z"});assert.equal(result.plan.executiveCycleId,cycle.id);assert.equal(result.actions.length,3);assert.deepEqual(result.actions.map((item)=>item.owner),["ATHENA","TURING","ORION"]);assert.equal(result.plan.dependencies.length,2);assert.equal(result.plan.metrics.length,2);assert.equal(result.decision.confidence,84);assert.equal(result.plan.checkpointAt,"2026-08-22T00:00:00.000Z");});

test("B7.4 refuses to activate a blocked recommendation",()=>{assert.throws(()=>buildDecisionToAction({cognitiveCase,cycle:{...cycle,status:"blocked",recommendation:null}}),/recommandation ORION validée/);});

test("B7.4 enforces strict CognitiveCase isolation",()=>{assert.throws(()=>buildDecisionToAction({cognitiveCase,cycle:{...cycle,caseId:"foreign"}}),/n’appartient pas/);});
