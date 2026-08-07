export type CognitiveCaseState = "explore" | "decide" | "execute" | "learn";
export type ActionStatus = "todo" | "doing" | "done" | "blocked";
export type ContextDomain = "strategy" | "finance" | "people" | "operations" | "market" | "legal" | "history" | "governance";
export type ContextKind = "fact" | "hypothesis" | "constraint" | "preference" | "uncertainty";
export type ContextRequirement = "required" | "important" | "optional";
export type ContextStatus = "missing" | "draft" | "verified" | "stale" | "contested";

export interface CognitiveCase {
  id: string;
  title: string;
  objective: string;
  workingHypothesis: string;
  context: string;
  state: CognitiveCaseState;
  signals: {
    impact: number;
    urgency: number;
    confidence: number;
    cognitiveCost: number;
    risk: number;
  };
}

export interface DecisionRecord {
  id: string;
  caseId: string;
  recommendation: string;
  outcome: string;
  rationale: string;
  confidence: number;
  createdAt: string;
}

export interface ActionRecord {
  id: string;
  caseId: string;
  title: string;
  owner: string;
  progress: number;
  status: ActionStatus;
}

export interface CognitiveEventRecord {
  id: string;
  type: string;
  detail: string;
  createdAt: string;
}

export interface ContextRecord {
  id: string;
  caseId: string;
  domain: ContextDomain;
  kind: ContextKind;
  key: string;
  label: string;
  value: string;
  confidence: number;
  requirement: ContextRequirement;
  status: ContextStatus;
  unit?: string;
  source?: string;
  owner?: string;
  capturedAt?: string;
  validUntil?: string;
}

export interface DecisionOptionModel {
  title: string;
  description: string;
  score: number | null;
}

export type DecisionCategory =
  | "hiring"
  | "investment"
  | "launch"
  | "pricing"
  | "partnership"
  | "workforce_restructuring"
  | "generic";

export interface DecisionModel {
  question: string;
  category: DecisionCategory;
  criteria: string[];
  options: DecisionOptionModel[];
  recommendation: string | null;
  confidence: number | null;
  missingInformation: string[];
  reviewTrigger: string;
  classifications: string[];
  requiredAgents: string[];
  requiresContext: boolean;
}
