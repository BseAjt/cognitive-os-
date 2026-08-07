import test from "node:test";
import assert from "node:assert/strict";
import { buildCognitiveReplay } from "../lib/cognitive-replay.ts";
import { groupCognitiveEventsIntoOrionCycles } from "../lib/orion-cycles.ts";
import type { CognitiveTimelineEvent } from "../lib/cognitive-events.ts";

function event(id:string,type:CognitiveTimelineEvent["type"],timestamp:string,summary:string,confidenceAfter:number|null=null,caseId="case-a"):CognitiveTimelineEvent {
  return { id,caseId,type,timestamp,actor:type==="question"?"user":"ORION",title:type,summary,reasoning:"test",impact:"medium",confidenceBefore:null,confidenceAfter,causedBy:[],affects:[`case:${caseId}`],produces:[],metadata:{} };
}

const events:CognitiveTimelineEvent[] = [
  event("q1","question","2026-08-07T10:00:00.000Z","Dois-je lancer le produit ?"),
  event("h1","hypothesis","2026-08-07T10:01:00.000Z","Le marché est prêt",60),
  event("e1","evidence","2026-08-07T10:02:00.000Z","Trois pilotes sont positifs",72),
  event("d1","decision","2026-08-07T10:03:00.000Z","Lancer un pilote limité",80),
  event("future","learning","2026-08-07T20:00:00.000Z","Le pilote a dépassé les attentes",90),
  event("foreign","risk","2026-08-07T10:01:30.000Z","Risque étranger",40,"case-b")
];

test("replay follows the cognitive sequence of one ORION cycle",()=>{
  const cycle=groupCognitiveEventsIntoOrionCycles(events.filter((item)=>item.caseId==="case-a"))[0];
  assert.ok(cycle);
  const replay=buildCognitiveReplay("case-a",cycle,events);
  assert.deepEqual(replay.frames.map((frame)=>frame.phase),["Question","Hypothèse","Preuve","Décision"]);
  assert.equal(replay.frames.at(-1)?.after.activeDecision?.summary,"Lancer un pilote limité");
});

test("each replay frame only knows information available at that step",()=>{
  const cycle=groupCognitiveEventsIntoOrionCycles(events.filter((item)=>item.caseId==="case-a"))[0];
  assert.ok(cycle);
  const replay=buildCognitiveReplay("case-a",cycle,events);
  const evidenceFrame=replay.frames.find((frame)=>frame.event.id==="e1");
  assert.ok(evidenceFrame);
  assert.equal(evidenceFrame.after.eventCount,3);
  assert.equal(evidenceFrame.after.learnings.length,0);
  assert.equal(evidenceFrame.after.risks.length,0);
});

test("replay frames explain state transitions and confidence",()=>{
  const cycle=groupCognitiveEventsIntoOrionCycles(events.filter((item)=>item.caseId==="case-a"))[0];
  assert.ok(cycle);
  const replay=buildCognitiveReplay("case-a",cycle,events);
  const decisionFrame=replay.frames.find((frame)=>frame.event.id==="d1");
  assert.ok(decisionFrame);
  assert.equal(decisionFrame.confidenceDelta,8);
  assert.match(decisionFrame.narration,/décision/i);
  assert.match(decisionFrame.narration,/\+8/);
});

test("replay stays strictly isolated to the requested dossier",()=>{
  const cycle=groupCognitiveEventsIntoOrionCycles(events.filter((item)=>item.caseId==="case-a"))[0];
  assert.ok(cycle);
  const replay=buildCognitiveReplay("case-a",cycle,events);
  assert.ok(replay.frames.every((frame)=>frame.after.risks.every((risk)=>risk.caseId==="case-a")));
  assert.ok(replay.frames.every((frame)=>!frame.after.latestEvent || frame.after.latestEvent.caseId==="case-a"));
});
