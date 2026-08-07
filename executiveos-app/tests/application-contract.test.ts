import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

const page = source("app/page.tsx");
const layout = source("app/layout.tsx");
const workspace = source("components/executive-workspace.tsx");
const workspaceHook = source("hooks/use-executive-workspace.ts");
const conversationPanel = source("components/workspace/conversation-panel.tsx");
const ledgerPanels = source("components/workspace/ledger-panels.tsx");
const historyControls = source("components/history-controls.tsx");
const store = source("store/executive-store.ts");
const storeTypes = source("store/types.ts");
const storeCommands = source("store/commands.ts");
const graph = source("components/reasoning-graph.tsx");

const contracts: Array<[string, string, string]> = [
  ["home mounts ExecutiveOS shell", page, "<ExecutiveOSHome />"],
  ["workspace delegates orchestration to hook", workspace, "useExecutiveWorkspace()"],
  ["workspace renders conversation panel", workspace, "<ConversationPanel"],
  ["workspace renders reasoning panel", workspace, "<ReasoningPanel"],
  ["workspace renders decision ledger", workspace, "<DecisionLedger"],
  ["workspace renders open actions", workspace, "<OpenActions"],
  ["workspace hook invokes conversation runtime", workspaceHook, "runConversationRuntime(clean, activeCase)"],
  ["workspace hook records conversation through command layer", workspaceHook, "store.recordConversationTurn({"],
  ["workspace hook captures decisions through command layer", workspaceHook, "store.captureDecision({"],
  ["workspace hook creates actions through command layer", workspaceHook, "store.createAction({"],
  ["workspace hook switches canonical cases", workspaceHook, "store.setActiveCase(caseId)"],
  ["conversation enter submits without shift", conversationPanel, "event.key === \"Enter\" && !event.shiftKey"],
  ["conversation quick prompts are present", conversationPanel, "Reprendre là où j’en étais"],
  ["decision ledger is rendered", ledgerPanels, "DECISION LEDGER"],
  ["open actions are rendered", ledgerPanels, "OPEN ACTIONS"],
  ["store persistence is enabled", store, "persist("],
  ["store has stable persistence key", store, "name: \"executiveos-v2\""],
  ["state exposes canonical active case", storeTypes, "activeCaseId: string"],
  ["state exposes history deletion", storeTypes, "clearConversationHistory: (caseId: string) => void"],
  ["critical signal targets canonical case", storeCommands, "const activeCaseId = get().activeCaseId"],
  ["critical signal changes risk", storeCommands, "risk: 9"],
  ["history controls use canonical active case", historyControls, "state.activeCaseId"],
  ["history deletion calls store action", historyControls, "clearConversationHistory(activeCaseId)"],
  ["history controls are mounted globally", layout, "<HistoryControls />"],
  ["reasoning graph renders ReactFlow", graph, "<ReactFlow"],
  ["reasoning graph exposes controls", graph, "<Controls />"]
];

for (const [name, file, expected] of contracts) {
  test(name, () => {
    assert.ok(file.includes(expected), `Missing application contract: ${expected}`);
  });
}

test("legacy Challenge vocabulary is absent from active state contracts", () => {
  assert.equal(storeTypes.includes("Challenge"), false);
  assert.equal(storeCommands.includes("activeChallengeId"), false);
});
