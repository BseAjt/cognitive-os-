import type {
  ActionRecord,
  CognitiveCaseState,
  CognitiveEventRecord,
  DecisionRecord
} from "@/domain/canonical";
import type {
  LegacyActionItem,
  LegacyChallenge,
  LegacyDecision
} from "@/domain/adapters";

/** @deprecated Prefer CognitiveCaseState from @/domain/canonical. */
export type ChallengeState = CognitiveCaseState;
/** @deprecated Prefer CognitiveCase from @/domain/canonical. */
export type Challenge = LegacyChallenge;
/** @deprecated Prefer DecisionRecord from @/domain/canonical. */
export type Decision = LegacyDecision;
/** @deprecated Prefer ActionRecord from @/domain/canonical. */
export type ActionItem = LegacyActionItem;
/** Canonical event shape retained under the historical export name for compatibility. */
export type CognitiveEvent = CognitiveEventRecord;

export type { ActionRecord, DecisionRecord };
