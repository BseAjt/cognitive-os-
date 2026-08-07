import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createKernelSlice } from "../store/kernel-slice.ts";
import type { KernelEvent, KernelTransaction } from "../lib/executive-kernel.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

const transaction: KernelTransaction = {
  id: "tx-1",
  caseId: "case-a",
  status: "completed",
  startedAt: "2026-08-08T10:00:00.000Z",
  completedAt: "2026-08-08T10:00:01.000Z",
  completedStages: ["context", "reasoning"],
  blockedStages: [],
  skippedStages: ["recall"],
  eventCount: 2
};

const events: KernelEvent[] = [
  { id: "ke-1", transactionId: "tx-1", caseId: "case-a", type: "KernelCycleStarted", status: "running", detail: "start", createdAt: transaction.startedAt },
  { id: "ke-2", transactionId: "tx-1", caseId: "case-a", type: "KernelCycleCompleted", status: "completed", detail: "done", createdAt: transaction.completedAt }
];

test("Kernel slice persists one transaction and its ordered event stream", () => {
  let state: any = { kernelTransactions: [], kernelEvents: [] };
  const set = (updater: any) => { state = { ...state, ...(typeof updater === "function" ? updater(state) : updater) }; };
  const slice = (createKernelSlice as any)(set, () => state, {});
  state = { ...state, ...slice };
  state.recordKernelExecution(transaction, events);
  assert.equal(state.kernelTransactions.length, 1);
  assert.equal(state.kernelTransactions[0].caseId, "case-a");
  assert.deepEqual(state.kernelEvents.map((event: KernelEvent) => event.id), ["ke-1", "ke-2"]);
});

test("recording the same Kernel transaction replaces its previous trace instead of duplicating it", () => {
  let state: any = { kernelTransactions: [], kernelEvents: [] };
  const set = (updater: any) => { state = { ...state, ...(typeof updater === "function" ? updater(state) : updater) }; };
  const slice = (createKernelSlice as any)(set, () => state, {});
  state = { ...state, ...slice };
  state.recordKernelExecution(transaction, events);
  state.recordKernelExecution({ ...transaction, status: "blocked" }, [{ ...events[0], id: "ke-3", status: "blocked" }]);
  assert.equal(state.kernelTransactions.length, 1);
  assert.equal(state.kernelTransactions[0].status, "blocked");
  assert.deepEqual(state.kernelEvents.map((event: KernelEvent) => event.id), ["ke-3"]);
});

test("runtime cycle persists Kernel metadata atomically with domain outputs", () => {
  const commands = source("store/commands.ts");
  assert.ok(commands.includes("kernelTransactions: [result.kernel"));
  assert.ok(commands.includes("kernelEvents: [...result.kernelEvents"));
  assert.ok(commands.includes("item.transactionId !== result.kernel.id"));
});

test("store migration initializes Kernel observability for existing users", () => {
  const store = source("store/executive-store.ts");
  assert.ok(store.includes("version: 17"));
  assert.ok(store.includes("kernelTransactions: state.kernelTransactions ?? []"));
  assert.ok(store.includes("kernelEvents: state.kernelEvents ?? []"));
  assert.ok(store.includes("...createKernelSlice(...args)"));
});
