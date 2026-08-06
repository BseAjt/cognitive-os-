import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const workspace = readFileSync(resolve(root, "components/executive-workspace.tsx"), "utf8");
const store = readFileSync(resolve(root, "store/executive-store.ts"), "utf8");
const page = readFileSync(resolve(root, "app/page.tsx"), "utf8");
const graph = readFileSync(resolve(root, "components/reasoning-graph.tsx"), "utf8");

const contracts: Array<[string, string, string]> = [
  ["home mounts the real workspace", page, "<ExecutiveWorkspace />"],
  ["workspace invokes the real conversation runtime", workspace, "runConversationRuntime(message, active)"],
  ["message submission updates the active challenge", workspace, "store.updateChallenge(updated)"],
  ["conversation stores user and assistant messages", workspace, "store.addMessages(["],
  ["decisions are persisted in the ledger", workspace, "store.addDecision({"],
  ["actions are persisted", workspace, "store.addActions(["],
  ["runtime events are recorded", workspace, "store.addEvent(\"ConversationParsed\""],
  ["enter submits without shift", workspace, "event.key === \"Enter\" && !event.shiftKey"],
  ["empty messages are rejected", workspace, "if (!message) return"],
  ["challenge switching is wired", workspace, "store.setActiveChallenge(challenge.id)"],
  ["graph visibility can be toggled", workspace, "setShowGraph(!showGraph)"],
  ["critical signal simulation is wired", workspace, "onClick={store.runCriticalSimulation}"],
  ["quick prompts are present", workspace, "Reprendre là où j’en étais"],
  ["decision ledger is rendered", workspace, "DECISION LEDGER"],
  ["open actions are rendered", workspace, "OPEN ACTIONS"],
  ["store persistence is enabled", store, "persist("],
  ["store has a stable persistence key", store, "name: \"executiveos-v2\""],
  ["history deletion exists in the store", store, "clearConversationHistory"],
  ["critical simulation changes risk", store, "risk: 9"],
  ["reasoning graph renders ReactFlow", graph, "<ReactFlow"],
  ["reasoning graph exposes controls", graph, "<Controls />"]
];

for (const [name, source, expected] of contracts) {
  test(name, () => {
    assert.ok(source.includes(expected), `Missing application contract: ${expected}`);
  });
}

test("all visible workspace actions reference implemented store methods", () => {
  const usedMethods = [...workspace.matchAll(/store\.([A-Za-z0-9_]+)/g)].map((match) => match[1]);
  const uniqueMethods = [...new Set(usedMethods)].filter((name) => !["challenges", "messages", "decisions", "actions"].includes(name));
  for (const method of uniqueMethods) {
    assert.ok(store.includes(`${method}:`), `Store method used by UI but not implemented: ${method}`);
  }
});

test("history deletion is not silently considered tested unless exposed", () => {
  assert.ok(
    workspace.includes("clearConversationHistory"),
    "The store implements history deletion, but the current workspace does not expose it to users"
  );
});
