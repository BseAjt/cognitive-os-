import test from "node:test";
import assert from "node:assert/strict";
import { groupCognitiveEventsIntoOrionCycles, orionCycleProgress } from "../lib/orion-cycles.ts";
import type { CognitiveTimelineEvent } from "../lib/cognitive-events.ts";

const base = (id:string, type:CognitiveTimelineEvent["type"], timestamp:string, summary:string):CognitiveTimelineEvent => ({
  id,
  caseId:"executiveos",
  type,
  timestamp,
  actor:type === "question" ? "user" : "ORION",
  title:type,
  summary,
  reasoning:"test",
  impact:type === "decision" ? "high" : "medium",
  confidenceBefore:null,
  confidenceAfter:type === "decision" ? 84 : null,
  causedBy:[],
  affects:["case:executiveos"],
  produces:[],
  metadata:{}
});

test("groups a complete ORION reasoning cycle from question to decision and action", () => {
  const cycles = groupCognitiveEventsIntoOrionCycles([
    base("q1","question","2026-08-07T09:00:00Z","Dois-je lancer le produit ?"),
    base("a1","analysis","2026-08-07T09:01:00Z","Analyse du marché"),
    base("h1","hypothesis","2026-08-07T09:02:00Z","Le segment est solvable"),
    base("d1","decision","2026-08-07T09:05:00Z","Lancer un pilote"),
    base("x1","action","2026-08-07T09:06:00Z","Préparer le pilote")
  ]);
  assert.equal(cycles.length, 1);
  assert.equal(cycles[0]?.trigger?.id, "q1");
  assert.equal(cycles[0]?.outcome, "Lancer un pilote");
  assert.equal(cycles[0]?.confidence, 84);
  assert.equal(cycles[0]?.isComplete, true);
  assert.deepEqual(orionCycleProgress(cycles[0]!), ["Question","Analyse","Hypothèse","Décision","Action"]);
});

test("a new question starts a new cognitive cycle", () => {
  const cycles = groupCognitiveEventsIntoOrionCycles([
    base("q1","question","2026-08-07T09:00:00Z","Faut-il lancer ?"),
    base("d1","decision","2026-08-07T09:05:00Z","Oui, pilote"),
    base("q2","question","2026-08-07T10:00:00Z","Quel pricing retenir ?"),
    base("a2","analysis","2026-08-07T10:02:00Z","Analyse pricing")
  ]);
  assert.equal(cycles.length, 2);
  assert.equal(cycles[0]?.sequence, 1);
  assert.equal(cycles[1]?.sequence, 2);
  assert.match(cycles[1]?.title ?? "", /Quel pricing retenir/);
});

test("a long inactivity gap creates a separate continuation cycle", () => {
  const cycles = groupCognitiveEventsIntoOrionCycles([
    base("a1","analysis","2026-08-07T09:00:00Z","Analyse initiale"),
    base("l1","learning","2026-08-07T18:00:01Z","Nouveau signal")
  ]);
  assert.equal(cycles.length, 2);
});

test("cycles remain isolated to the case represented by their input projection", () => {
  const event = base("q1","question","2026-08-07T09:00:00Z","Question ExecutiveOS");
  const other = { ...base("q2","question","2026-08-07T09:01:00Z","Question autre"), caseId:"other" };
  const cycles = groupCognitiveEventsIntoOrionCycles([event]);
  assert.equal(cycles.length, 1);
  assert.equal(cycles[0]?.caseId, "executiveos");
  assert.notEqual(cycles[0]?.caseId, other.caseId);
});
