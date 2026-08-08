import test from "node:test";
import assert from "node:assert/strict";
import { ingestContextSource, synthesizeCaseContext } from "../lib/context-ingestion.ts";
import { retrieveCaseContext } from "../lib/cognitive-retrieval.ts";
import { runOrionExecutiveCycle } from "../lib/orion-executive-cycle.ts";
import { buildDecisionToAction } from "../lib/decision-to-action.ts";
import { evaluateDecisionWatch } from "../lib/decision-watch.ts";
import { buildExecutiveCaseBrief } from "../lib/executive-brief.ts";
import { defaultExecutiveAgents } from "../lib/agent-runtime.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

test("B7 UAT closes the Executive Intelligence Loop from source to cited re-evaluation",()=>{
 const cognitiveCase:CognitiveCase={id:"b7-uat",title:"Lancer un pilote",objective:"Décider et piloter un lancement",workingHypothesis:"Le pilote est viable",context:"Décision à instruire",state:"decide",signals:{impact:9,urgency:8,confidence:76,cognitiveCost:5,risk:5}};
 const baseline=ingestContextSource({caseId:cognitiveCase.id,type:"note",title:"Validation COMEX",content:"Le COMEX confirme un budget de 120 000 euros. Le pilote doit mesurer la conversion et limiter le risque fournisseur.",createdAt:"2026-08-08T08:00:00.000Z"},"source-1");
 const synthesis=synthesizeCaseContext(cognitiveCase.id,[baseline.source],baseline.evidence,"2026-08-08T08:01:00.000Z");
 const retrieval=retrieveCaseContext(cognitiveCase.id,"Quel budget et quel risque ?",[baseline.source],baseline.evidence);
 assert.ok(retrieval.hits.length>0);assert.match(synthesis.summary,/\[S1\]/);
 const cycle=runOrionExecutiveCycle({cognitiveCase,objective:"Valider le lancement du pilote",agents:defaultExecutiveAgents,sources:[baseline.source],evidence:baseline.evidence,id:"cycle",createdAt:"2026-08-08T09:00:00.000Z"});
 assert.equal(cycle.status,"completed");assert.ok(cycle.contributions.every((item)=>item.citations.length>0));
 const activated=buildDecisionToAction({cognitiveCase,cycle,id:"plan",decisionId:"decision",actionIds:["a1","a2","a3"],createdAt:"2026-08-08T10:00:00.000Z"});
 assert.equal(activated.actions.length,3);
 const changed=ingestContextSource({caseId:cognitiveCase.id,type:"message",title:"Alerte fournisseur",content:"Le fournisseur est désormais bloqué et le lancement devient impossible dans le délai décidé.",createdAt:"2026-08-09T10:00:00.000Z"},"source-2");
 const watch=evaluateDecisionWatch({plan:activated.plan,decision:activated.decision,actions:activated.actions,sources:[baseline.source,changed.source],evidence:[...baseline.evidence,...changed.evidence],evaluatedAt:"2026-08-09T11:00:00.000Z",id:"watch"});
 assert.equal(watch.status,"reopen");assert.ok(watch.signals.some((item)=>item.citation==="S2"));
 const brief=buildExecutiveCaseBrief({cognitiveCase:{...cognitiveCase,state:"execute"},decisions:[activated.decision],actions:activated.actions,caseObjects:[],learningEvents:[],reflections:[],contextSources:[baseline.source,changed.source],contextEvidence:[...baseline.evidence,...changed.evidence],executiveCycles:[cycle],decisionActionPlans:[activated.plan],decisionWatches:[watch],generatedAt:"2026-08-09T12:00:00.000Z"});
 assert.equal(brief.watchStatus,"reopen");assert.equal(brief.health,"critical");assert.ok(brief.citedEvidence.some((item)=>item.citation==="S2"));assert.match(brief.executiveSummary,/Recommandation ORION/);
});
