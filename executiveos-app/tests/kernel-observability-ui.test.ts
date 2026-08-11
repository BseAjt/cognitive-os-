import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const source = readFileSync(resolve(root, "components/executive-runtime-panel.tsx"), "utf8");

test("B6.3.3 surfaces Kernel observability in the active dossier execution workspace", () => {
  for (const contract of [
    "kernelTransactions",
    "kernelEvents",
    "Executive Kernel · Observability",
    "Cycles Assistant de décision exécutés par le Kernel",
    "data-testid=\"kernel-observability\""
  ]) assert.ok(source.includes(contract), `missing Kernel observability contract: ${contract}`);
});

test("B6.3.3 isolates Kernel transactions by active dossier", () => {
  assert.ok(source.includes("transaction.caseId === activeCaseId"));
});

test("B6.3.3 exposes completed, blocked and failed cycle health", () => {
  assert.ok(source.includes('item.status === "completed"'));
  assert.ok(source.includes('item.status === "blocked"'));
  assert.ok(source.includes('item.status === "failed"'));
  assert.ok(source.includes("KernelStatus"));
});

test("B6.3.3 lets users expand the ordered Kernel trace", () => {
  assert.ok(source.includes("expandedTransactionId"));
  assert.ok(source.includes("event.transactionId === transaction.id"));
  assert.ok(source.includes("a.createdAt.localeCompare(b.createdAt)"));
  assert.ok(source.includes("Voir la trace"));
});
