import test from "node:test";
import assert from "node:assert/strict";
import { calculateProductEvidence, createInvestorDemoDataset, INVESTOR_DEMO_STEPS } from "../lib/investor-demo.ts";

test("B8.1 creates the deterministic investor story across five complete cases", () => {
  const first = createInvestorDemoDataset();
  const second = createInvestorDemoDataset();
  assert.deepEqual(first, second);
  assert.equal(first.cases.length, 5);
  assert.equal(first.contextSources.length, 40);
  assert.equal(first.contextEvidence.length, 120);
  assert.equal(first.decisions.length, 9);
  assert.equal(first.actions.length, 30);
  assert.equal(first.executiveCycles.length, 5);
  assert.equal(first.decisionActionPlans.length, 5);
  assert.equal(first.decisionWatches.filter((watch) => watch.status === "reopen").length, 3);
});

test("B8.1 metrics are derived from traceable records rather than display constants", () => {
  const dataset = createInvestorDemoDataset();
  const metrics = calculateProductEvidence(dataset);
  assert.equal(metrics.sourcesConsolidated, dataset.contextSources.length);
  assert.equal(metrics.evidenceStructured, dataset.contextEvidence.length);
  assert.equal(metrics.traceabilityRate, 100);
  assert.equal(metrics.decisionsSourced, 9);
  assert.equal(metrics.actionsPiloted, 30);
  assert.equal(metrics.decisionsReopened, 3);
  assert.ok(metrics.estimatedHoursSaved > 0);
});

test("B8.1 keeps every evidence item scoped to an existing source and case", () => {
  const dataset = createInvestorDemoDataset();
  const sources = new Map(dataset.contextSources.map((source) => [source.id, source]));
  for (const evidence of dataset.contextEvidence) {
    const source = sources.get(evidence.sourceId);
    assert.ok(source);
    assert.equal(source.caseId, evidence.caseId);
  }
  assert.equal(INVESTOR_DEMO_STEPS.length, 5);
});
