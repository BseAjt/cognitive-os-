import type { ActionRecord, CognitiveCase, DecisionRecord, KnowledgeRecord, MemoryRecord } from "../domain/canonical.ts";
import type { CognitiveRecallResult } from "./cognitive-recall.ts";
import type { UnifiedRuntimeResult } from "./unified-runtime.ts";

export type CognitiveChangeKind =
  | "hypothesis_added"
  | "hypothesis_reinforced"
  | "hypothesis_invalidated"
  | "confidence_changed"
  | "decision_changed"
  | "risk_added"
  | "risk_resolved"
  | "knowledge_added"
  | "contradiction_detected";

export interface CognitiveChange {
  kind: CognitiveChangeKind;
  subject: string;
  before?: string;
  after?: string;
  delta?: number;
  confidence: number;
  evidence: string[];
}

export interface CognitiveDiffInput {
  cognitiveCase: CognitiveCase;
  currentMessage: string;
  previousRecall?: CognitiveRecallResult;
  previousMemories: MemoryRecord[];
  previousKnowledge: KnowledgeRecord[];
  previousDecisions: DecisionRecord[];
  previousActions: ActionRecord[];
  currentCycle: UnifiedRuntimeResult;
}

export interface CognitiveDiffResult {
  caseId: string;
  changes: CognitiveChange[];
  hypothesisChanges: CognitiveChange[];
  confidenceChanges: CognitiveChange[];
  decisionChanges: CognitiveChange[];
  newRisks: CognitiveChange[];
  resolvedRisks: CognitiveChange[];
  contradictions: CognitiveChange[];
  newKnowledge: CognitiveChange[];
  recommendedReflection: string;
  significance: "none" | "low" | "medium" | "high";
}
