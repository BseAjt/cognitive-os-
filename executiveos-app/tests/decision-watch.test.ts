import test from "node:test";
import assert from "node:assert/strict";
import { evaluateDecisionWatch } from "../lib/decision-watch.ts";
import type { ActionRecord, ContextEvidenceRecord, ContextSourceRecord, DecisionActionPlanRecord, DecisionRecord } from "../domain/canonical.ts";

const plan:DecisionActionPlanRecord={id:"plan",caseId:"case",executiveCycleId:"cycle",decisionId:"decision",recommendation:"Lancer le pilote",status:"active",actionIds:["a1"],dependencies:[],metrics:[],checkpointAt:"2026-08-22T00:00:00.000Z",createdAt:"2026-08-08T00:00:00.000Z"};
const decision:DecisionRecord={id:"decision",caseId:"case",recommendation:"Lancer",outcome:"Pilote lancé",rationale:"Cycle ORION",confidence:84,createdAt:plan.createdAt};
const actions:ActionRecord[]=[{id:"a1",caseId:"case",title:"Préparer le pilote",owner:"TURING",progress:20,status:"doing"}];
const source:ContextSourceRecord={id:"source",caseId:"case",type:"note",title:"Retour terrain",origin:"COMEX",status:"ready",rawContent:"Le fournisseur est désormais bloqué.",summary:"Blocage",wordCount:5,createdAt:"2026-08-09T00:00:00.000Z",processedAt:"2026-08-09T00:00:00.000Z"};
const evidence:ContextEvidenceRecord={id:"evidence",caseId:"case",sourceId:"source",claim:"Le fournisseur est désormais bloqué et le lancement devient impossible.",excerpt:"Le fournisseur est désormais bloqué.",confidence:90,position:0,createdAt:source.createdAt};

test("B7.5 reopens a decision when new cited evidence contradicts its execution",()=>{const watch=evaluateDecisionWatch({plan,decision,actions,sources:[source],evidence:[evidence],evaluatedAt:"2026-08-10T00:00:00.000Z",id:"watch"});assert.equal(watch.status,"reopen");assert.equal(watch.signals[0]?.citation,"S1");assert.equal(watch.signals[0]?.type,"contradiction");assert.match(watch.recommendedAction,/relancer un cycle ORION/);});

test("B7.5 keeps a decision stable without material post-decision signals",()=>{const watch=evaluateDecisionWatch({plan,decision,actions,sources:[],evidence:[],evaluatedAt:"2026-08-10T00:00:00.000Z",id:"watch"});assert.equal(watch.status,"stable");assert.deepEqual(watch.signals,[]);});

test("B7.5 detects blocked actions and due ORION checkpoints",()=>{const watch=evaluateDecisionWatch({plan,decision,actions:[{...actions[0]!,status:"blocked",blockedReason:"Dépendance indisponible"}],sources:[],evidence:[],evaluatedAt:"2026-08-23T00:00:00.000Z",id:"watch"});assert.equal(watch.status,"reopen");assert.ok(watch.signals.some((item)=>item.type==="blocked_action"));assert.ok(watch.signals.some((item)=>item.type==="checkpoint_due"));});

test("B7.5 refuses cross-case decision monitoring",()=>{assert.throws(()=>evaluateDecisionWatch({plan,decision:{...decision,caseId:"other"},actions,sources:[],evidence:[]}),/n’appartient pas/);});
