"use client";

import { useMemo, useState } from "react";
import { runConversationRuntime, type CognitiveExtraction } from "@/lib/conversation-runtime";
import type { DecisionFrame } from "@/lib/decision-runtime";
import { challengeScore } from "@/lib/scheduler";
import { useExecutiveStore } from "@/store/executive-store";

export function useExecutiveWorkspace() {
  const store = useExecutiveStore();
  const [input, setInput] = useState("");
  const [lastExtractions, setLastExtractions] = useState<CognitiveExtraction[]>([]);
  const [lastNextAction, setLastNextAction] = useState("");
  const [decisionFrame, setDecisionFrame] = useState<DecisionFrame | null>(null);
  const [showGraph, setShowGraph] = useState(true);

  const rankedChallenges = useMemo(
    () => [...store.challenges].sort((a, b) => challengeScore(b) - challengeScore(a)),
    [store.challenges]
  );

  const activeChallenge = store.challenges.find((item) => item.id === store.activeChallengeId) ?? rankedChallenges[0];
  const messages = useMemo(
    () => store.messages.filter((message) => message.challengeId === activeChallenge.id),
    [store.messages, activeChallenge.id]
  );
  const decisions = useMemo(
    () => store.decisions.filter((decision) => decision.challengeId === activeChallenge.id),
    [store.decisions, activeChallenge.id]
  );
  const actions = useMemo(
    () => store.actions.filter((action) => action.challengeId === activeChallenge.id),
    [store.actions, activeChallenge.id]
  );

  function resetTransientReasoning() {
    setLastExtractions([]);
    setLastNextAction("");
    setDecisionFrame(null);
  }

  function selectChallenge(challengeId: string) {
    store.setActiveChallenge(challengeId);
    resetTransientReasoning();
  }

  function createAction(title: string) {
    store.createAction({ challengeId: activeChallenge.id, title });
  }

  function processMessage(message: string) {
    const clean = message.trim();
    if (!clean) return;

    const result = runConversationRuntime(clean, activeChallenge);
    const createdAt = new Date().toISOString();

    store.recordConversationTurn({
      challengeId: activeChallenge.id,
      userText: clean,
      assistantText: result.response,
      intent: result.intent,
      extractionCount: result.extractions.length,
      challengePatch: result.challengePatch,
      createdAt
    });

    const decision = result.extractions.find((item) => item.kind === "decision");
    if (decision) {
      store.captureDecision({
        challengeId: activeChallenge.id,
        text: decision.text,
        recommendation: result.nextAction,
        confidence: decision.confidence,
        createdAt
      });
    }

    const action = result.extractions.find((item) => item.kind === "action");
    if (action) store.createAction({ challengeId: activeChallenge.id, title: action.text });

    setLastExtractions(result.extractions);
    setLastNextAction(result.nextAction);
    setDecisionFrame(result.decisionFrame ?? null);
    setInput("");
  }

  return {
    input,
    setInput,
    showGraph,
    setShowGraph,
    rankedChallenges,
    activeChallenge,
    messages,
    decisions,
    actions,
    lastExtractions,
    lastNextAction,
    decisionFrame,
    processMessage,
    createAction,
    selectChallenge,
    runCriticalSimulation: store.applyCriticalSignal
  };
}
