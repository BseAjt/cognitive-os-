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
const slices = readFileSync(resolve(root, "store/slices.ts"), "utf8");
const commands = readFileSync(resolve(root, "store/commands.ts"), "utf8");
const types = readFileSync(resolve(root, "store/types.ts"), "utf8");
const store = readFileSync(resolve(root, "store/executive-store.ts"), "utf8");

for (const label of ["Mes dossiers", "Paramètres"]) {
  test(`primary navigation exposes ${label}`, () => assert.ok(home.includes(label)));
}

test("primary navigation no longer exposes engine tabs", () => {
  assert.ok(!home.includes('label: "Comprendre"'));
  assert.ok(!home.includes('label: "Décider"'));
  assert.ok(!home.includes('label: "Agir"'));
  assert.ok(!home.includes('label: "Explorer"'));
});

test("Phase B renders one contextual command surface instead of stacked engines", () => {
  for (const id of ["overview", "analysis", "execution", "learning", "history"]) assert.ok(home.includes(`activeSection === \"${id}\"`));
  assert.ok(home.includes("CommandSurface"));
  assert.ok(home.includes("WorkspaceView"));
  assert.ok(home.includes("scrollIntoView"));
  assert.ok(!home.includes('stage === "overview"'));
  assert.ok(!home.includes('stage === "analysis"'));
  assert.ok(!home.includes('stage === "execution"'));
});

test("B1 keeps decision, execution, learning and history in the same dossier page", () => {
  assert.ok(home.includes("<ExecutiveWorkspace />"));
  assert.ok(home.includes('<ExecutiveRuntimePanel mode="act" />'));
  assert.ok(home.includes("<LearningPanel"));
  assert.ok(home.includes("<HistoryPanel"));
});

test("users can create and edit dossiers", () => {
  assert.ok(slices.includes("createCase:"));
  assert.ok(home.includes("store.createCase"));
  assert.ok(home.includes("store.applyCasePatch"));
  assert.ok(home.includes("+ Nouveau dossier"));
});

test("global ORION command executes inside the active dossier and stays in unified workspace", () => {
  assert.ok(home.includes("runUnifiedRuntime"));
  assert.ok(home.includes("store.applyRuntimeCycle"));
  assert.ok(home.includes('executiveos:open-analysis'));
});

test("Phase B global search spans useful cognitive records", () => {
  assert.ok(home.includes("Rechercher un dossier, une décision, une action"));
  for (const collection of ["store.cases", "store.decisions", "store.actions", "store.memories", "store.contextSources"]) assert.ok(home.includes(collection));
  assert.ok(home.includes("openSearchResult"));
});

test("Phase B living brief exposes attention and next-best-action surfaces", () => {
  assert.ok(home.includes("buildExecutiveCaseBrief"));
  assert.ok(home.includes("Brief vivant · maintenant"));
  assert.ok(home.includes("Centre d’attention"));
  assert.ok(home.includes("Depuis ta dernière visite"));
});

test("execution stays operational inside dossier workspace", () => {
  assert.ok(runtime.includes("assignRuntimeAction(action.id)"));
  assert.ok(runtime.includes("handleStart(action.id)"));
  assert.ok(runtime.includes("Démarrer avec ORION"));
  assert.ok(runtime.includes("handleExecute(action.id)"));
  assert.ok(runtime.includes("executionFeedback"));
});

test("B4.1 keeps one persistent ORION conversation per dossier", () => {
  assert.ok(workspace.includes('store.messages.filter((message) => message.caseId === active.id)'));
  assert.ok(workspace.includes("ORION · CONVERSATION DU DOSSIER"));
  assert.ok(workspace.includes("Historique persistant"));
  assert.ok(workspace.includes("processMessage(input)"));
  assert.ok(commands.includes('messages: [...state.messages, { id: crypto.randomUUID(), caseId, role: "user"'));
  assert.ok(commands.includes('role: "assistant" as const'));
});

test("B4.1 conversation and Decision Canvas are visible in the same workspace", () => {
  assert.ok(workspace.includes("<DecisionCanvas"));
  assert.ok(!workspace.includes('setMode("conversation")'));
  assert.ok(!workspace.includes('mode === "canvas"'));
  assert.ok(!workspace.includes('mode === "conversation"'));
});

test("B4.3 persists conversation-derived objects as first-class dossier records", () => {
  assert.ok(types.includes("caseObjects: DossierObjectRecord[]"));
  assert.ok(slices.includes("createDossierObjectSlice"));
  assert.ok(commands.includes("const conversationObjects: DossierObjectRecord[]"));
  assert.ok(commands.includes("const decisionObject: DossierObjectRecord[]"));
  assert.ok(commands.includes("const actionObjects: DossierObjectRecord[]"));
  assert.ok(commands.includes("DossierObjectsCreated"));
  assert.ok(store.includes("version: 17"));
});

test("B4.3 exposes dossier objects in the same ORION workspace", () => {
  assert.ok(workspace.includes('store.caseObjects.filter((item) => item.caseId === active.id)'));
  assert.ok(workspace.includes("OBJETS DU DOSSIER"));
  assert.ok(workspace.includes("DossierObjectGroup"));
});

test("decision workspace remains connected to unified runtime", () => {
  assert.ok(workspace.includes("runUnifiedRuntime"));
  assert.ok(workspace.includes("store.applyRuntimeCycle"));
  assert.ok(workspace.includes("DecisionCanvas"));
});
