import assert from "node:assert/strict";
import test from "node:test";
import type { CognitiveTimelineEvent } from "../lib/cognitive-events.ts";
import { buildTemporalCognitiveSnapshot, diffTemporalCognitiveSnapshots, temporalCursorPoints } from "../lib/temporal-navigation.ts";

function event(id:string,type:CognitiveTimelineEvent["type"],timestamp:string,summary:string,extra:Partial<CognitiveTimelineEvent>={}):CognitiveTimelineEvent {
  return { id, caseId:"case-a", type, timestamp, actor:"runtime", title:summary, summary, reasoning:"", impact:"medium", confidenceBefore:null, confidenceAfter:null, causedBy:[], affects:[], produces:[], metadata:{}, ...extra };
}

const events:CognitiveTimelineEvent[] = [
  event("q1","question","2026-08-01T08:00:00.000Z","Dois-je lancer ?",{actor:"user"}),
  event("h1","hypothesis","2026-08-01T08:05:00.000Z","Le marché est prêt",{confidenceAfter:55}),
  event("d1","decision","2026-08-01T08:10:00.000Z","Lancer un pilote",{confidenceAfter:60}),
  event("e1","evidence","2026-08-02T09:00:00.000Z","Trois clients confirment le besoin",{confidenceAfter:72}),
  event("r2","revision","2026-08-02T09:10:00.000Z","Lancer le pilote en septembre",{confidenceAfter:82,metadata:{stepId:"decision",version:2}}),
  event("l1","learning","2026-08-03T10:00:00.000Z","Le segment public répond mieux",{confidenceAfter:84}),
  {...event("foreign","risk","2026-08-01T08:07:00.000Z","Autre dossier"),caseId:"case-b"}
];

test("snapshot reconstructs only information available at the requested time",()=>{
  const snapshot=buildTemporalCognitiveSnapshot("case-a","2026-08-01T08:06:00.000Z",events);
  assert.equal(snapshot.eventCount,2);
  assert.equal(snapshot.hypotheses.length,1);
  assert.equal(snapshot.decisions.length,0);
  assert.equal(snapshot.learnings.length,0);
  assert.equal(snapshot.confidence,55);
});

test("snapshot never leaks events from another dossier",()=>{
  const snapshot=buildTemporalCognitiveSnapshot("case-a","2026-08-04T00:00:00.000Z",events);
  assert.equal(snapshot.risks.length,0);
  assert.ok(!snapshot.latestEvent || snapshot.latestEvent.id!=="foreign");
});

test("snapshot selects the latest decision revision active at that instant",()=>{
  const before=buildTemporalCognitiveSnapshot("case-a","2026-08-02T09:05:00.000Z",events);
  const after=buildTemporalCognitiveSnapshot("case-a","2026-08-02T09:11:00.000Z",events);
  assert.equal(before.activeDecision?.id,"d1");
  assert.equal(after.activeDecision?.id,"r2");
  assert.equal(after.confidence,82);
});

test("snapshot diff explains what appeared between two instants",()=>{
  const from=buildTemporalCognitiveSnapshot("case-a","2026-08-01T08:11:00.000Z",events);
  const to=buildTemporalCognitiveSnapshot("case-a","2026-08-03T11:00:00.000Z",events);
  const diff=diffTemporalCognitiveSnapshots(from,to,events);
  assert.deepEqual(diff.added.map((item)=>item.id),["e1","r2","l1"]);
  assert.equal(diff.newDecision?.id,"r2");
  assert.equal(diff.newEvidence.length,1);
  assert.equal(diff.newLearnings.length,1);
  assert.equal(diff.confidenceDelta,24);
});

test("cursor points are ordered and case isolated",()=>{
  const points=temporalCursorPoints("case-a",events);
  assert.equal(points.length,6);
  assert.equal(points[0],"2026-08-01T08:00:00.000Z");
  assert.equal(points.at(-1),"2026-08-03T10:00:00.000Z");
});
