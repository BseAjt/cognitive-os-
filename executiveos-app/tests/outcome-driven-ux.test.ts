import test from "node:test";
import assert from "node:assert/strict";
import { buildCaseJourney, resolveEventDestination } from "../lib/outcome-navigation.ts";
import { executeAction } from "../lib/executive-runtime.ts";
import type { ActionRecord, AgentContract, CognitiveCase, CognitiveEventRecord, DecisionRecord, LearningEventRecord, ReflectionRecord } from "../domain/canonical.ts";

const cognitiveCase: CognitiveCase = { id:"case-meaning", title:"Rendre ExecutiveOS utile", objective:"Relier chaque changement à un résultat exploitable", workingHypothesis:"Une trajectoire objectif → décision → action → apprentissage donne du sens", context:"UAT produit", state:"execute", signals:{ impact:10, urgency:9, confidence:80, cognitiveCost:5, risk:4 } };
const decisions: DecisionRecord[] = [{ id:"d", caseId:cognitiveCase.id, recommendation:"Relier les objets", outcome:"Navigation orientée résultat", rationale:"Éviter les logs morts", confidence:90, createdAt:"2026-08-07T16:00:00.000Z" }];
const actions: ActionRecord[] = [{ id:"a", caseId:cognitiveCase.id, title:"Auditer le runtime", owner:"TURING", progress:60, status:"doing", requiredCapability:"technology", assignedAgentId:"turing" }];
const learnings: LearningEventRecord[] = [{ id:"l", caseId:cognitiveCase.id, type:"KnowledgeLearned", title:"Le statut seul ne suffit pas", detail:"L’utilisateur doit voir ce qui change réellement.", significance:"high", confidence:95, source:"cognitive_diff", createdAt:"2026-08-07T17:00:00.000Z" }];
const reflections: ReflectionRecord[] = [{ id:"r", caseId:cognitiveCase.id, summary:"Le produit doit être outcome-driven", whatChanged:["navigation"], whyItChanged:["feedback utilisateur"], learned:["lier statuts et résultats"], uncertainties:[], decisionsToReconsider:[], confidence:92, significance:"high", source:"reflection_engine", createdAt:"2026-08-07T17:10:00.000Z" }];

test("case journey exposes decision, next action and learning", () => {
  const journey = buildCaseJourney({ cognitiveCase, decisions, actions, learningEvents: learnings, reflections });
  assert.equal(journey.latestDecision?.id, "d");
  assert.equal(journey.nextAction?.id, "a");
  assert.equal(journey.latestLearning?.id, "l");
});

test("runtime events route to meaningful product surfaces", () => {
  const event = (type:string):CognitiveEventRecord => ({ id:type, type, detail:type, createdAt:new Date().toISOString() });
  assert.equal(resolveEventDestination(event("RuntimeTaskExecuted")).view, "act");
  assert.equal(resolveEventDestination(event("DecisionRecorded")).view, "decision");
  assert.equal(resolveEventDestination(event("ReflectionPersisted")).view, "understand");
  assert.equal(resolveEventDestination(event("KnowledgePersisted")).view, "explore");
});

test("executed action produces a useful deliverable, not only a status", () => {
  const agents:AgentContract[] = [{ id:"turing", name:"TURING", role:"CTO", specialty:"Architecture", capabilities:["technology"], status:"online", version:"2.1.0" }];
  const result = executeAction({ ...actions[0], status:"todo", progress:0 }, agents);
  assert.equal(result.status, "done");
  assert.equal(result.progress, 100);
  assert.match(result.result ?? "", /Audit technique produit/);
  assert.match(result.result ?? "", /TURING/);
});
