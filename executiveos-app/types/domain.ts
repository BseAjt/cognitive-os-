export type ChallengeState = "explore" | "decide" | "execute" | "learn";

export interface Challenge {
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
  state: ChallengeState;
}

export interface Decision {
  id: string;
  challengeId: string;
  recommendation: string;
  finalDecision: string;
  rationale: string;
  confidence: number;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  challengeId: string;
  title: string;
  owner: string;
  progress: number;
  status: "todo" | "doing" | "done" | "blocked";
}

export interface CognitiveEvent {
  id: string;
  type: string;
  detail: string;
  createdAt: string;
}
