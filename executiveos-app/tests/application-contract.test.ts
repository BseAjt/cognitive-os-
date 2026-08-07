import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

const home = source("components/executive-home-v4.tsx");
const workspace = source("components/executive-workspace.tsx");
const historyControls = source("components/history-controls.tsx");
const store = source("store/executive-store.ts");
const storeTypes = source("store/types.ts");
const commands = source("store/commands.ts");
const runtimeSlice = source("store/runtime-slice.ts");
const unifiedRuntime = source("lib/unified-runtime.ts");
const graph = source("components/reasoning-graph.tsx");
const layout = source("app/layout.tsx");

const contracts: Array<[string, string, string]> = [
  ["workspace invokes unified runtime", workspace, "const result = runUnifiedRuntime({"],
  ["workspace feeds runtime agent catalogue", workspace, "agents: store.agents"],
  ["workspace feeds persistent memory", workspace, "memories: store.memories.filter"],
  ["workspace feeds persistent knowledge", workspace, "knowledgeRecords: store.knowledgeRecords.filter"],
  ["workspace applies runtime cycle atomically", workspace, "store.applyRuntimeCycle({"],
  ["dossier-first shell switches canonical cases", home, "store.setActiveCase(id)"],
  ["workspace uses canonical case score", workspace, "caseScore("],
  ["unified runtime delegates conversation analysis", unifiedRuntime, "runConversationRuntime(input.message, input.cognitiveCase)"],
  ["unified runtime exposes agent orchestration", unifiedRuntime, "agents: AgentOrchestrationResult"],
  ["unified runtime exposes memory candidates", unifiedRuntime, "memory: MemoryCandidate[]"],
  ["unified runtime exposes knowledge candidates", unifiedRuntime, "knowledge: KnowledgeCandidate[]"],
  ["command layer persists runtime cycle", commands, "applyRuntimeCycle:"],
  ["store persistence is enabled", store, "persist("],
  ["store persistence key is stable", store, "name: \"executiveos-v2\""],
  ["state exposes activeCaseId", storeTypes, "activeCaseId: string"],
  ["state exposes clearConversationHistory", storeTypes, "clearConversationHistory: (caseId: string) => void"],
  ["critical signal uses activeCaseId", commands, "const activeCaseId = get().activeCaseId"],
  ["critical signal raises risk", commands, "risk: 9"],
  ["runtime slice exposes action assignment", runtimeSlice, "assignRuntimeAction"],
  ["runtime slice exposes action execution", runtimeSlice, "executeRuntimeAction"],
  ["history controls use canonical case", historyControls, "state.activeCaseId"],
  ["history deletion calls canonical action", historyControls, "clearConversationHistory(activeCaseId)"],
  ["history controls are mounted globally", layout, "<HistoryControls />"],
  ["reasoning graph renders ReactFlow", graph, "<ReactFlow"],
  ["reasoning graph exposes controls", graph, "<Controls />"]
];

for (const [name, file, expected] of contracts) {
  test(name, () => assert.ok(file.includes(expected), `Missing application contract: ${expected}`));
}

test("workspace does not perform direct decision or action persistence", () => {
  assert.equal(workspace.includes("store.captureDecision({"), false);
  assert.equal(workspace.includes("store.recordConversationTurn({"), false);
});

test("legacy Challenge state vocabulary is absent", () => {
  assert.equal(storeTypes.includes("activeChallengeId"), false);
  assert.equal(storeTypes.includes("Challenge[]"), false);
});
