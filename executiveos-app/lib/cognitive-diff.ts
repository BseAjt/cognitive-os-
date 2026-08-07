import type { CognitiveChange, CognitiveDiffInput, CognitiveDiffResult } from "./cognitive-diff-types.ts";

export function buildCognitiveDiff(input: CognitiveDiffInput): CognitiveDiffResult {
  const changes: CognitiveChange[] = [];
  const caseId = input.cognitiveCase.id;

  const previousHypotheses = input.previousMemories
    .filter((item) => item.caseId === caseId && item.kind === "hypothesis" && item.durable)
    .map((item) => item.content);
  const currentHypotheses = input.currentCycle.memory
    .filter((item) => item.kind === "hypothesis" && item.durable)
    .map((item) => ({ content: item.content, confidence: item.confidence }));

  for (const hypothesis of currentHypotheses) {
    const match = previousHypotheses.find((item) => equivalent(item, hypothesis.content));
    changes.push(match
      ? change("hypothesis_reinforced", hypothesis.content, match, hypothesis.content, hypothesis.confidence, ["Hypothèse retrouvée dans la mémoire durable et réaffirmée dans le cycle courant."])
      : change("hypothesis_added", hypothesis.content, undefined, hypothesis.content, hypothesis.confidence, ["Nouvelle hypothèse extraite du cycle courant."]));
  }

  for (const oldHypothesis of previousHypotheses) {
    if (isExplicitlyInvalidated(oldHypothesis, input.currentMessage)) {
      changes.push(change("hypothesis_invalidated", oldHypothesis, oldHypothesis, "invalidée", 90, [input.currentMessage]));
    }
  }

  const beforeConfidence = input.previousRecall?.confidence ?? input.cognitiveCase.signals.confidence;
  const afterConfidence = input.currentCycle.decision?.confidence
    ?? input.currentCycle.agents.confidence
    ?? input.cognitiveCase.signals.confidence;
  const confidenceDelta = afterConfidence - beforeConfidence;
  if (Math.abs(confidenceDelta) >= 5) {
    changes.push(change(
      "confidence_changed",
      "Confiance du dossier",
      `${beforeConfidence}%`,
      `${afterConfidence}%`,
      Math.min(100, Math.max(50, Math.abs(confidenceDelta) + 60)),
      [input.currentCycle.agents.synthesis],
      confidenceDelta
    ));
  }

  const previousDecision = input.previousRecall?.lastDecision
    ?? newest(input.previousDecisions.filter((item) => item.caseId === caseId));
  if (previousDecision && input.currentCycle.decision && !equivalent(previousDecision.outcome, input.currentCycle.decision.outcome)) {
    changes.push(change(
      "decision_changed",
      "Décision",
      previousDecision.outcome,
      input.currentCycle.decision.outcome,
      input.currentCycle.decision.confidence,
      [input.currentCycle.decision.rationale]
    ));
  }

  const previousRisks = input.previousMemories
    .filter((item) => item.caseId === caseId && item.kind === "risk" && item.durable)
    .map((item) => item.content);
  const currentRisks = input.currentCycle.memory
    .filter((item) => item.kind === "risk" && item.durable)
    .map((item) => ({ content: item.content, confidence: item.confidence }));

  for (const risk of currentRisks) {
    if (!previousRisks.some((item) => equivalent(item, risk.content))) {
      changes.push(change("risk_added", risk.content, undefined, risk.content, risk.confidence, ["Nouveau risque détecté dans le cycle courant."]));
    }
  }
  for (const previousRisk of previousRisks) {
    if (isExplicitlyResolved(previousRisk, input.currentMessage)) {
      changes.push(change("risk_resolved", previousRisk, previousRisk, "résolu", 88, [input.currentMessage]));
    }
  }

  const previousKnowledge = input.previousKnowledge.filter((item) => item.caseId === caseId).map((item) => item.title);
  for (const knowledge of input.currentCycle.knowledge) {
    if (!previousKnowledge.some((item) => equivalent(item, knowledge.title))) {
      changes.push(change("knowledge_added", knowledge.title, undefined, knowledge.title, knowledge.confidence, ["Nouvel élément projeté vers le Knowledge Graph."]));
    }
  }

  if (previousDecision && input.currentCycle.decision && decisionContradicts(previousDecision.outcome, input.currentCycle.decision.outcome, input.currentMessage)) {
    changes.push(change(
      "contradiction_detected",
      "Décision précédente",
      previousDecision.outcome,
      input.currentCycle.decision.outcome,
      input.currentCycle.decision.confidence,
      ["La formulation courante contredit explicitement la décision précédente."]
    ));
  }

  const grouped = (kind: CognitiveChange["kind"]) => changes.filter((item) => item.kind === kind);
  const hypothesisChanges = changes.filter((item) => item.kind.startsWith("hypothesis_"));
  const confidenceChanges = grouped("confidence_changed");
  const decisionChanges = grouped("decision_changed");
  const newRisks = grouped("risk_added");
  const resolvedRisks = grouped("risk_resolved");
  const contradictions = grouped("contradiction_detected");
  const newKnowledge = grouped("knowledge_added");
  const significance = significanceFor(changes);

  return {
    caseId,
    changes,
    hypothesisChanges,
    confidenceChanges,
    decisionChanges,
    newRisks,
    resolvedRisks,
    contradictions,
    newKnowledge,
    recommendedReflection: reflectionFor(changes, input.currentCycle.nextAction),
    significance
  };
}

function change(
  kind: CognitiveChange["kind"],
  subject: string,
  before: string | undefined,
  after: string | undefined,
  confidence: number,
  evidence: string[],
  delta?: number
): CognitiveChange {
  return { kind, subject, before, after, delta, confidence, evidence };
}

function newest<T extends { createdAt: string }>(items: T[]): T | undefined {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function equivalent(a: string, b: string): boolean {
  const left = normalize(a);
  const right = normalize(b);
  if (left === right) return true;
  if (!left || !right) return false;
  return left.includes(right) || right.includes(left);
}

function isExplicitlyInvalidated(subject: string, message: string): boolean {
  const normalized = normalize(message);
  const key = normalize(subject).split(" ").filter((token) => token.length > 4).slice(0, 3);
  const mentionsSubject = key.length === 0 || key.some((token) => normalized.includes(token));
  return mentionsSubject && /(hypothese|idee|conviction|supposition).*(fausse|invalidee|incorrecte)|(?:faux|invalide|incorrect).*(hypothese|idee|conviction)/.test(normalized);
}

function isExplicitlyResolved(subject: string, message: string): boolean {
  const normalized = normalize(message);
  const key = normalize(subject).split(" ").filter((token) => token.length > 4).slice(0, 3);
  const mentionsSubject = key.length === 0 || key.some((token) => normalized.includes(token));
  return mentionsSubject && /(risque|blocage|probleme).*(resolu|leve|mitige|clos)|(?:resolu|leve|mitige|clos).*(risque|blocage|probleme)/.test(normalized);
}

function decisionContradicts(previous: string, current: string, message: string): boolean {
  if (equivalent(previous, current)) return false;
  const normalized = normalize(message);
  return /(reviens sur|annule|inverse|contraire|finalement|ne plus|abandonne|remplace)/.test(normalized);
}

function significanceFor(changes: CognitiveChange[]): CognitiveDiffResult["significance"] {
  if (!changes.length) return "none";
  if (changes.some((item) => item.kind === "decision_changed" || item.kind === "hypothesis_invalidated" || item.kind === "contradiction_detected")) return "high";
  if (changes.some((item) => item.kind === "risk_added" || item.kind === "risk_resolved" || Math.abs(item.delta ?? 0) >= 15)) return "medium";
  return "low";
}

function reflectionFor(changes: CognitiveChange[], nextAction: string): string {
  if (!changes.length) return `Aucun changement cognitif significatif détecté. Continuer avec : ${nextAction}`;
  const priorities = changes
    .filter((item) => item.kind === "hypothesis_invalidated" || item.kind === "decision_changed" || item.kind === "contradiction_detected" || item.kind === "risk_added")
    .slice(0, 3)
    .map((item) => `${item.kind}: ${item.subject}`);
  return `Réévaluer ${priorities.length ? priorities.join(" · ") : changes[0].subject}. Prochaine action : ${nextAction}`;
}
