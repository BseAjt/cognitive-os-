import type { CognitiveCase, CognitiveEventRecord } from "@/domain/canonical";

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

export type LegacyCognitiveEvent = CognitiveEventRecord;
