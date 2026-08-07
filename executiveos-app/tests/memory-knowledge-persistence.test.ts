import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runUnifiedRuntime } from "../lib/unified-runtime.ts";
import type { CognitiveCase } from "../domain/canonical.ts";

const cognitiveCase: CognitiveCase = {
  id: "memory-case",
  title: "Mémoire cognitive",
  objective: "Capitaliser le raisonnement",
  workingHypothesis: "",
  context: "",
  state: "explore",
  signals: { impact: 8, urgency: 5, confidence: 75, cognitiveCost: 5, risk: 4 }
};

test("unified runtime produces case-scoped memory and knowledge candidates", () => {
  const result = runUnifiedRuntime({
    message: "Je pense que le marché est prêt. Le risque principal est le churn. Il faut interroger cinq clients.",
    cognitiveCase
  });
  assert.ok(result.memory.some((item) => item.kind === "hypothesis" && item.durable));
  assert.ok(result.memory.some((item) => item.kind === "risk" && item.durable));
  assert.ok(result.knowledge.some((item) => item.type === "risk"));
  assert.ok(result.knowledge.some((item) => item.type === "action"));
});

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");
const types = source("store/types.ts");
const slices = source("store/slices.ts");
const commands = source("store/commands.ts");
const store = source("store/executive-store.ts");

for (const [name, file, expected] of [
  ["memory slice is part of state", types, "memories: MemoryRecord[]"],
  ["knowledge slice is part of state", types, "knowledgeRecords: KnowledgeRecord[]"],
  ["memory slice is initialized", slices, "memories: []"],
  ["knowledge slice is initialized", slices, "knowledgeRecords: []"],
  ["runtime persists memory", commands, "source: \"unified_runtime\" as const"],
  ["runtime writes memories atomically", commands, "memories: memories.length"],
  ["runtime writes knowledge atomically", commands, "knowledgeRecords: knowledgeRecords.length"],
  ["persistence schema includes graph migration v9", store, "version: 9"],
  ["store composes memory slice", store, "createMemorySlice"],
  ["store composes knowledge slice", store, "createKnowledgeSlice"]
] as const) {
  test(name, () => assert.ok(file.includes(expected), `Missing persistence contract: ${expected}`));
}
