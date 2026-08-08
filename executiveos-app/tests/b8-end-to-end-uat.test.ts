import test from "node:test";
import assert from "node:assert/strict";
import { defaultExecutiveAgents } from "../lib/agent-runtime.ts";
import { ingestContextSource } from "../lib/context-ingestion.ts";
import { retrieveCaseContext } from "../lib/cognitive-retrieval.ts";
import { demoSignals, normalizeExternalSignal } from "../lib/integration-fabric.ts";
import { runOrionExecutiveCycle } from "../lib/orion-executive-cycle.ts";
import type { CognitiveCase, IntegrationConnectionRecord } from "../domain/canonical.ts";

test("B8 UAT carries an integrated signal into B7 retrieval and ORION",()=>{
 const cognitiveCase:CognitiveCase={id:"b8-uat",title:"Pilote connecté",objective:"Décider avec les signaux réels",workingHypothesis:"Le budget est confirmé",context:"Pilotage",state:"explore",signals:{impact:8,urgency:8,confidence:70,cognitiveCost:4,risk:6}};
 const connection:IntegrationConnectionRecord={id:"drive",provider:"drive",label:"Documents",status:"connected",enabled:true,scopes:["files.read"],caseId:cognitiveCase.id,createdAt:"2026-08-08T08:00:00.000Z",updatedAt:"2026-08-08T08:00:00.000Z"};
 const normalized=normalizeExternalSignal(connection,demoSignals("drive","2026-08-08T09:00:00.000Z")[0]!);
 const ingestion=ingestContextSource({caseId:cognitiveCase.id,type:normalized.type,title:normalized.title,origin:normalized.fingerprint,mimeType:normalized.mimeType,content:normalized.content,createdAt:normalized.createdAt},"source-drive");
 const retrieval=retrieveCaseContext(cognitiveCase.id,"Quel budget et quel seuil de conversion ?",[ingestion.source],ingestion.evidence);
 assert.ok(retrieval.hits.some((item)=>item.excerpt.includes("120 000")));
 const cycle=runOrionExecutiveCycle({id:"cycle-b8",objective:"Valider le pilote à partir du business case",cognitiveCase,agents:defaultExecutiveAgents,sources:[ingestion.source],evidence:ingestion.evidence,createdAt:"2026-08-08T10:00:00.000Z"});
 assert.equal(cycle.status,"completed");assert.ok(cycle.recommendation?.includes("[S1]"));assert.deepEqual(cycle.sourceIds,["source-drive"]);
});
