import test from "node:test";
import assert from "node:assert/strict";
import { defaultExecutiveAgents } from "../lib/agent-runtime.ts";
import { runOrionExecutiveCycle } from "../lib/orion-executive-cycle.ts";
import type { CognitiveCase, ContextEvidenceRecord, ContextSourceRecord } from "../domain/canonical.ts";

const cognitiveCase:CognitiveCase={id:"case-b73",title:"Lancement",objective:"Décider du lancement",workingHypothesis:"Le marché est prêt",context:"Arbitrage produit",state:"decide",signals:{impact:8,urgency:7,confidence:70,cognitiveCost:5,risk:7}};
const sources:ContextSourceRecord[]=[{id:"source-1",caseId:cognitiveCase.id,type:"note",title:"Étude pilote",origin:"atelier",status:"ready",rawContent:"Budget confirmé. Risque adoption.",summary:"Budget et adoption",wordCount:4,createdAt:"2026-08-08T00:00:00.000Z",processedAt:"2026-08-08T00:00:00.000Z"}];
const evidence:ContextEvidenceRecord[]=[
  {id:"evidence-1",caseId:cognitiveCase.id,sourceId:"source-1",claim:"Le budget du lancement est confirmé",excerpt:"Budget du lancement confirmé",confidence:90,position:0,createdAt:"2026-08-08T00:00:00.000Z"},
  {id:"evidence-2",caseId:cognitiveCase.id,sourceId:"source-1",claim:"Le risque principal concerne l'adoption",excerpt:"Risque adoption à surveiller",confidence:82,position:1,createdAt:"2026-08-08T00:00:00.000Z"}
];

test("B7.3 persists a sourced multidisciplinary ORION cycle",()=>{const cycle=runOrionExecutiveCycle({id:"cycle-1",createdAt:"2026-08-08T01:00:00.000Z",objective:"Arbitrer le lancement et son budget",cognitiveCase,agents:defaultExecutiveAgents,sources,evidence});assert.equal(cycle.status,"completed");assert.deepEqual(cycle.selectedAgentIds,["athena","turing","seneca"]);assert.equal(cycle.contributions.length,3);assert.ok(cycle.contributions.every((item)=>item.citations.includes("S1")));assert.ok(cycle.recommendation?.includes("[S1]"));assert.equal(cycle.divergences.length,1);});

test("B7.3 blocks recommendation when cited evidence is insufficient",()=>{const cycle=runOrionExecutiveCycle({objective:"Décider maintenant",cognitiveCase,agents:defaultExecutiveAgents,sources:[],evidence:[]});assert.equal(cycle.status,"blocked");assert.equal(cycle.recommendation,null);assert.ok(cycle.missingEvidence.length>=2);});

test("B7.3 never retrieves evidence from another case",()=>{const foreignSources=sources.map((item)=>({...item,caseId:"foreign"}));const foreignEvidence=evidence.map((item)=>({...item,caseId:"foreign"}));const cycle=runOrionExecutiveCycle({objective:"Arbitrer le lancement",cognitiveCase,agents:defaultExecutiveAgents,sources:foreignSources,evidence:foreignEvidence});assert.equal(cycle.status,"blocked");assert.deepEqual(cycle.sourceIds,[]);assert.ok(cycle.contributions.every((item)=>item.evidenceIds.length===0));});
