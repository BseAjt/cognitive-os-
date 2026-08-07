import test from "node:test";
import assert from "node:assert/strict";
import { buildDecisionDiffs } from "../lib/decision-diff.ts";
import type { CognitiveTimelineEvent } from "../lib/cognitive-events.ts";

const revisions = [
  { id:"r1", caseId:"executiveos", stepId:"decision", version:1, content:"Conserver une architecture monolithique pour accélérer la livraison.", confidence:72, createdAt:"2026-08-07T09:00:00.000Z" },
  { id:"r2", caseId:"executiveos", stepId:"decision", version:2, content:"Adopter une architecture modulaire pour réduire la dette technique.", confidence:86, createdAt:"2026-08-07T12:00:00.000Z" }
];

const events:CognitiveTimelineEvent[] = [
  { id:"e1", caseId:"executiveos", type:"evidence", timestamp:"2026-08-07T10:00:00.000Z", actor:"runtime", title:"Preuve", summary:"Les composants fortement couplés ralentissent les changements.", reasoning:"Mesure issue du runtime.", impact:"high", confidenceBefore:null, confidenceAfter:90, causedBy:[], affects:[], produces:[], metadata:{} },
  { id:"e2", caseId:"executiveos", type:"risk", timestamp:"2026-08-07T11:00:00.000Z", actor:"runtime", title:"Risque", summary:"La dette technique augmente.", reasoning:"Risque détecté.", impact:"critical", confidenceBefore:null, confidenceAfter:94, causedBy:[], affects:[], produces:[], metadata:{} },
  { id:"foreign", caseId:"other", type:"evidence", timestamp:"2026-08-07T10:30:00.000Z", actor:"runtime", title:"Autre", summary:"Autre dossier", reasoning:"", impact:"high", confidenceBefore:null, confidenceAfter:99, causedBy:[], affects:[], produces:[], metadata:{} }
];

test("decision diff compares immutable decision revisions", () => {
  const [diff] = buildDecisionDiffs("executiveos", revisions, events);
  assert.ok(diff);
  assert.equal(diff.from.version,1);
  assert.equal(diff.to.version,2);
  assert.equal(diff.confidenceDelta,14);
  assert.equal(diff.changed,true);
  assert.ok(diff.addedTerms.includes("modulaire"));
  assert.ok(diff.removedTerms.includes("monolithique"));
});

test("decision diff explains change with cognitive drivers between versions", () => {
  const [diff] = buildDecisionDiffs("executiveos", revisions, events);
  assert.deepEqual(diff.drivers.map((item)=>item.id),["e2","e1"]);
  assert.ok(diff.changeSummary.includes("Ajouts"));
});

test("decision diff stays isolated to the requested dossier", () => {
  const [diff] = buildDecisionDiffs("executiveos", revisions, events.filter((event)=>event.caseId==="executiveos"));
  assert.ok(diff.drivers.every((event)=>event.caseId==="executiveos"));
  assert.deepEqual(buildDecisionDiffs("other", revisions, events),[]);
});
