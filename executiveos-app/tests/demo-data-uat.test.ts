import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  initialAgentRuns,
  initialCases,
  initialCognitiveProfiles,
  initialDecisions,
  initialEvents,
  initialKnowledgeEntities,
  initialKnowledgeRecords,
  initialKnowledgeRelations,
  initialLearningEvents,
  initialMemories,
  initialMessages,
  initialReasoningRevisions,
  initialReflections,
  initialRuntimeActions
} from "../store/seed.ts";

const datasets = {
  cases: initialCases,
  messages: initialMessages,
  decisions: initialDecisions,
  actions: initialRuntimeActions,
  events: initialEvents,
  learnings: initialLearningEvents,
  reflections: initialReflections,
  cognitiveDNA: initialCognitiveProfiles,
  memories: initialMemories,
  knowledge: initialKnowledgeRecords,
  graphNodes: initialKnowledgeEntities,
  graphRelations: initialKnowledgeRelations,
  agentRuns: initialAgentRuns,
  reasoning: initialReasoningRevisions
};

for (const [name, records] of Object.entries(datasets)) {
  test(`demo dataset ${name} is populated`, () => assert.ok(records.length > 0, `${name} must not be empty`));
}

test("demo actions cover executable runtime states", () => {
  const states = new Set(initialRuntimeActions.map((action) => action.status));
  assert.ok(states.has("todo"));
  assert.ok(states.has("doing"));
  assert.ok(states.has("done"));
  assert.ok(initialRuntimeActions.some((action) => action.assignedAgentId));
});

test("knowledge graph contains connected runtime data", () => {
  const ids = new Set(initialKnowledgeEntities.map((entity) => entity.id));
  for (const relation of initialKnowledgeRelations) {
    assert.ok(ids.has(relation.sourceId), `missing source ${relation.sourceId}`);
    assert.ok(ids.has(relation.targetId), `missing target ${relation.targetId}`);
  }
});

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const home = readFileSync(resolve(root, "components/executive-home-v4.tsx"), "utf8");
const runtime = readFileSync(resolve(root, "components/executive-runtime-panel.tsx"), "utf8");
const workspace = readFileSync(resolve(root, "components/executive-workspace.tsx"), "utf8");

for (const tab of ["Accueil", "Comprendre", "Décider", "Agir", "Explorer", "Paramètres"]) {
  test(`navigation exposes ${tab}`, () => assert.ok(home.includes(`label: \"${tab}\"`)));
}

test("global ORION command executes the unified runtime", () => {
  assert.ok(home.includes("runUnifiedRuntime"));
  assert.ok(home.includes("store.applyRuntimeCycle"));
  assert.ok(home.includes('setView("decision")'));
});

test("understand tab consumes memory, reflection and cognitive DNA", () => {
  assert.ok(home.includes("store.memories"));
  assert.ok(home.includes("store.learningEvents"));
  assert.ok(home.includes("store.reflections"));
  assert.ok(home.includes("store.cognitiveProfiles"));
});

test("settings tab exposes real diagnostic actions", () => {
  assert.ok(home.includes("store.resetRuntimeActions()"));
  assert.ok(home.includes("store.clearConversationHistory(active.id)"));
  assert.ok(home.includes("store.applyCriticalSignal()"));
});

test("act tab exposes assign, transition and execute controls", () => {
  assert.ok(runtime.includes("assignRuntimeAction(action.id)"));
  assert.ok(runtime.includes('transitionRuntimeAction(action.id, "doing")'));
  assert.ok(runtime.includes("executeRuntimeAction(action.id)"));
});

test("explore tab derives its graph from live store state", () => {
  assert.ok(runtime.includes("buildRuntimeGraph({ cases, decisions, actions, agents, events })"));
});

test("decision workspace runs the unified runtime and persists cycles", () => {
  assert.ok(workspace.includes("runUnifiedRuntime"));
  assert.ok(workspace.includes("store.applyRuntimeCycle"));
  assert.ok(workspace.includes("DecisionCanvas"));
});
