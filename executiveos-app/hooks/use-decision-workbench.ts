"use client";

import { useMemo, useState } from "react";
import { answerContextItem, type ContextItem } from "@/lib/context-engine";
import {
  createDecisionContext,
  evaluateDecisionContext,
  type DecisionFrame
} from "@/lib/decision-runtime";

export function useDecisionWorkbench(frame: DecisionFrame, onContextSubmit: (summary: string) => void) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [contextItems, setContextItems] = useState<ContextItem[]>(() => createDecisionContext(frame));

  const decisionState = useMemo(
    () => evaluateDecisionContext(frame, contextItems),
    [frame, contextItems]
  );

  function updateItem(item: ContextItem, value: string) {
    setSaved(false);
    setContextItems((current) =>
      current.map((candidate) => candidate.id === item.id ? answerContextItem(candidate, value) : candidate)
    );
  }

  function submitContext() {
    const documented = contextItems.filter((item) => item.status === "verified" && item.value.trim());
    const lines = documented.map(
      (item) => `[${item.domain}] ${item.label} : ${item.value}${item.unit ? ` ${item.unit}` : ""} · source ${item.source ?? "non précisée"} · confiance ${item.confidence}%`
    );
    const assessment = decisionState.assessment;

    onContextSubmit([
      `Dossier contextuel pour la décision « ${frame.question} ».`,
      `Préparation globale : ${assessment.readiness}%.`,
      `Recommandation autorisée : ${decisionState.recommendationAllowed ? "oui" : "non"}.`,
      ...lines,
      assessment.missingRequired.length
        ? `Informations bloquantes : ${assessment.missingRequired.map((item) => item.label).join(", ")}.`
        : "Aucune information bloquante restante."
    ].join("\n"));
    setSaved(true);
  }

  return {
    selectedOption,
    setSelectedOption,
    saved,
    contextItems,
    assessment: decisionState.assessment,
    nextQuestion: decisionState.nextQuestion,
    recommendationAllowed: decisionState.recommendationAllowed,
    recommendation: decisionState.recommendation,
    nextAction: decisionState.nextAction,
    updateItem,
    submitContext
  };
}
