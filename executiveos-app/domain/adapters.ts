import type {
  ActionRecord,
  CognitiveCase,
  CognitiveEventRecord,
  DecisionRecord
} from "@/domain/canonical";

export interface LegacyChallenge {
  id: string;
  title: string;
  goal: string;
  hypothesis: string;
  impact: number;
  urgency: number;
  confidence: number;
  cognitiveCost: number;
  risk: number;
  context: string;
  state: CognitiveCase["state"];
}

export interface LegacyDecision {
  id: string;
  challengeId: string;
  recommendation: string;
  finalDecision: string;
  rationale: string;
  confidence: number;
  createdAt: string;
}

export interface LegacyActionItem {
  id: string;
  challengeId: string;
  title: string;
  owner: string;
  progress: number;
  status: ActionRecord["status"];
}

export function challengeToCase(challenge: LegacyChallenge): CognitiveCase {
  return {
    id: challenge.id,
    title: challenge.title,
    objective: challenge.goal,
    workingHypothesis: challenge.hypothesis,
    context: challenge.context,
    state: challenge.state,
    signals: {
      impact: challenge.impact,
      urgency: challenge.urgency,
      confidence: challenge.confidence,
      cognitiveCost: challenge.cognitiveCost,
      risk: challenge.risk
    }
  };
}

export function caseToChallenge(cognitiveCase: CognitiveCase): LegacyChallenge {
  return {
    id: cognitiveCase.id,
    title: cognitiveCase.title,
    goal: cognitiveCase.objective,
    hypothesis: cognitiveCase.workingHypothesis,
    context: cognitiveCase.context,
    state: cognitiveCase.state,
    impact: cognitiveCase.signals.impact,
    urgency: cognitiveCase.signals.urgency,
    confidence: cognitiveCase.signals.confidence,
    cognitiveCost: cognitiveCase.signals.cognitiveCost,
    risk: cognitiveCase.signals.risk
  };
}

export function decisionToCanonical(decision: LegacyDecision): DecisionRecord {
  return {
    id: decision.id,
    caseId: decision.challengeId,
    recommendation: decision.recommendation,
    outcome: decision.finalDecision,
    rationale: decision.rationale,
    confidence: decision.confidence,
    createdAt: decision.createdAt
  };
}

export function actionToCanonical(action: LegacyActionItem): ActionRecord {
  return {
    id: action.id,
    caseId: action.challengeId,
    title: action.title,
    owner: action.owner,
    progress: action.progress,
    status: action.status
  };
}

export type LegacyCognitiveEvent = CognitiveEventRecord;
