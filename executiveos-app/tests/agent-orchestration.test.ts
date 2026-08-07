import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultExecutiveAgents, runAgentOrchestration } from "../lib/agent-runtime.ts";
import { runUnifiedRuntime } from "../lib/unified-runtime.ts";
import type { CognitiveCase, MemoryRecord } from "../domain/canonical.ts";

const cognitiveCase: CognitiveCase = { id:"agent-case", title:"Architecture ExecutiveOS", objective:"Choisir une architecture robuste et différenciante", workingHypothesis:"Le runtime unifié réduit la dette technique", context:"Le produit doit intégrer mémoire, graphe et agents.", state:"decide", signals:{ impact:9, urgency:7, confidence:72, cognitiveCost:6, risk:8 } };

test("ORION selects technology and reflection specialists for a risky architecture question", () => {
  const result = runAgentOrchestration({ message:"Nous devons choisir l'architecture du runtime. Le risque est un couplage trop fort.", cognitiveCase, agents:defaultExecutiveAgents, extractions:[{ kind:"risk", text:"Couplage trop fort", confidence:88 }, { kind:"action", text:"Vérifier l'architecture du runtime", confidence:91 }] });
  assert.equal(result.orchestratorId, "orion");
  assert.ok(result.selectedAgentIds.includes("turing"));
  assert.ok(result.selectedAgentIds.includes("seneca"));
  assert.ok(result.contributions.some((item) => item.agentId === "turing"));
  assert.ok(result.contributions.some((item) => item.agentId === "seneca"));
  assert.match(result.synthesis, /ORION/);
});

test("persisted cognitive memory can trigger SENECA even when the new message omits the risk", () => {
  const memories: MemoryRecord[] = [{ id:"m-risk", caseId:"agent-case", kind:"risk", content:"Risque historique de verrouillage architectural", confidence:90, durable:true, source:"unified_runtime", createdAt:"2026-08-07T13:00:00.000Z" }];
  const result = runAgentOrchestration({ message:"Quelle option devons-nous privilégier ?", cognitiveCase:{ ...cognitiveCase, signals:{ ...cognitiveCase.signals, risk:4 } }, agents:defaultExecutiveAgents, extractions:[], memories });
  assert.ok(result.selectedAgentIds.includes("seneca"));
});

test("unified runtime injects agent contributions and pre-assigns technical actions", () => {
  const result = runUnifiedRuntime({ message:"Le risque est le couplage. Il faut vérifier l'architecture du runtime et les API.", cognitiveCase });
  assert.equal(result.trace.some((item) => item.stage === "agents" && item.status === "completed"), true);
  assert.ok(result.reasoning.some((item) => item.content.startsWith("TURING —")));
  assert.ok(result.knowledge.some((item) => item.type === "insight" && item.title.includes("ORION")));
  const technicalAction = result.actions.find((item) => item.requiredCapability === "technology");
  assert.equal(technicalAction?.preferredAgentId, "turing");
});

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");
const types = source("store/types.ts");
const runtimeSlice = source("store/runtime-slice.ts");
const commands = source("store/commands.ts");
const store = source("store/executive-store.ts");

for (const [name, file, expected] of [
  ["state exposes persistent agent runs", types, "agentRuns: AgentRunRecord[]"],
  ["runtime initializes agent run history", runtimeSlice, "agentRuns: []"],
  ["runtime cycle persists ORION run", commands, "agentRuns: [agentRun, ...state.agentRuns]"],
  ["actions accept preferred agent assignment", commands, "assignedAgentId: action.preferredAgentId"],
  ["agent council emits an event", commands, "AgentCouncilCompleted"],
  ["persistence schema includes reflection migration v12", store, "version: 12"]
] as const) {
  test(name, () => assert.ok(file.includes(expected), `Missing agent runtime contract: ${expected}`));
}
