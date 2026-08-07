import test from "node:test";
import assert from "node:assert/strict";
import { assignAction, buildRuntimeGraph, canHandle, executeAction, transitionAction, validateAgentContract } from "../lib/executive-runtime.ts";
import type { ActionRecord, AgentContract, CognitiveCase, CognitiveEventRecord, DecisionRecord } from "../domain/canonical.ts";

const agents: AgentContract[] = [
  { id: "orion", name: "ORION", role: "Orchestrator", specialty: "Executive orchestration", capabilities: ["analysis", "synthesis", "coordination"], status: "online", version: "1.0.0" },
  { id: "turing", name: "TURING", role: "CTO", specialty: "Technology", capabilities: ["technology", "architecture"], status: "online", version: "1.0.0" }
];

const action: ActionRecord = {
  id: "action-1",
  caseId: "case-1",
  title: "Analyser le contexte",
  owner: "Unassigned",
  progress: 0,
  status: "todo",
  requiredCapability: "analysis"
};

test("valid agent contract passes validation", () => {
  assert.deepEqual(validateAgentContract(agents[0]), []);
  assert.equal(canHandle(agents[0], "analysis"), true);
});

test("offline or incapable agents cannot handle a capability", () => {
  assert.equal(canHandle({ ...agents[0], status: "offline" }, "analysis"), false);
  assert.equal(canHandle(agents[1], "analysis"), false);
});

test("action assignment selects the first compatible online agent", () => {
  const assigned = assignAction(action, agents);
  assert.equal(assigned.assignedAgentId, "orion");
  assert.equal(assigned.owner, "ORION");
  assert.equal(assigned.status, "todo");
});

test("action is blocked when no compatible agent exists", () => {
  const blocked = assignAction({ ...action, requiredCapability: "legal" }, agents);
  assert.equal(blocked.status, "blocked");
  assert.match(blocked.blockedReason ?? "", /legal/);
});

test("task state machine rejects invalid transitions", () => {
  assert.throws(() => transitionAction({ ...action, status: "done" }, "doing"), /Invalid transition/);
});

test("executing a todo action assigns, runs and completes it", () => {
  const completed = executeAction(action, agents);
  assert.equal(completed.status, "done");
  assert.equal(completed.progress, 100);
  assert.equal(completed.assignedAgentId, "orion");
  assert.match(completed.result ?? "", /ORION/);
});

test("runtime graph projects live entities and ownership edges", () => {
  const cases: CognitiveCase[] = [{
    id: "case-1", title: "RC1", objective: "Stabiliser", workingHypothesis: "", context: "", state: "execute",
    signals: { impact: 8, urgency: 7, confidence: 80, cognitiveCost: 4, risk: 3 }
  }];
  const decisions: DecisionRecord[] = [{ id: "decision-1", caseId: "case-1", recommendation: "Refactor", outcome: "Stabiliser RC1", rationale: "Réduire la dette", confidence: 90, createdAt: new Date().toISOString() }];
  const actions: ActionRecord[] = [{ ...action, assignedAgentId: "orion", owner: "ORION" }];
  const events: CognitiveEventRecord[] = [{ id: "event-1", type: "ActionAssigned", detail: "ORION affecté", createdAt: new Date().toISOString() }];
  const graph = buildRuntimeGraph({ cases, decisions, actions, agents, events });
  assert.equal(graph.nodes.some((node) => node.id === "agent:orion"), true);
  assert.equal(graph.edges.some((edge) => edge.type === "owns" && edge.source === "agent:orion"), true);
  assert.equal(graph.stats.nodes, cases.length + decisions.length + actions.length + agents.length + events.length);
});
