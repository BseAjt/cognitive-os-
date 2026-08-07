import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "zustand/vanilla";
import { createActionSlice, createChallengeSlice, createConversationSlice, createDecisionSlice, createEventSlice } from "../store/slices.ts";
import { createExecutiveCommands } from "../store/commands.ts";
import type { ExecutiveState } from "../store/types.ts";

function createExecutiveTestStore() {
  return createStore<ExecutiveState>()((...args) => ({
    ...createChallengeSlice(...args),
    ...createConversationSlice(...args),
    ...createDecisionSlice(...args),
    ...createActionSlice(...args),
    ...createEventSlice(...args),
    ...createExecutiveCommands(...args)
  }));
}

test("conversation command updates a cognitive case atomically", () => {
  const store = createExecutiveTestStore();
  const beforeMessages = store.getState().messages.length;

  store.getState().recordConversationTurn({
    caseId: "executiveos",
    userText: "Je dois décider",
    assistantText: "Décision structurée",
    intent: "decision",
    extractionCount: 1,
    challengePatch: { urgency: 9, state: "decide" },
    createdAt: "2026-08-07T12:00:00.000Z"
  });

  const state = store.getState();
  assert.equal(state.messages.length, beforeMessages + 2);
  assert.equal(state.messages.at(-1)?.caseId, "executiveos");
  assert.equal(state.challenges.find((item) => item.id === "executiveos")?.urgency, 9);
  assert.equal(state.events[0].type, "ConversationParsed");
});

test("decision and action commands accept canonical caseId", () => {
  const store = createExecutiveTestStore();
  store.getState().captureDecision({
    caseId: "executiveos",
    text: "Lancer un pilote",
    recommendation: "Piloter pendant quatre semaines",
    confidence: 82,
    createdAt: "2026-08-07T12:01:00.000Z"
  });
  store.getState().createAction({ caseId: "executiveos", title: "Définir les critères du pilote" });

  const state = store.getState();
  assert.equal(state.decisions[0].challengeId, "executiveos");
  assert.equal(state.decisions[0].finalDecision, "Lancer un pilote");
  assert.equal(state.actions[0].challengeId, "executiveos");
  assert.equal(state.actions[0].title, "Définir les critères du pilote");
  assert.ok(state.events.some((event) => event.type === "DecisionCaptured"));
  assert.ok(state.events.some((event) => event.type === "ActionCreated"));
});

test("critical signal targets the active case", () => {
  const store = createExecutiveTestStore();
  store.getState().setActiveChallenge("positioning");
  store.getState().applyCriticalSignal();
  const active = store.getState().challenges.find((item) => item.id === "positioning");
  assert.equal(active?.risk, 9);
  assert.equal(active?.urgency, 10);
  assert.equal(store.getState().events[0].type, "CriticalSignalDetected");
});
