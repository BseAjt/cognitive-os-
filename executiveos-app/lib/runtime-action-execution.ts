import type { ActionRecord, AgentContract, CognitiveCase, KnowledgeRecord, MemoryRecord } from "../domain/canonical.ts";
import { runUnifiedRuntime, type UnifiedRuntimeResult } from "./unified-runtime.ts";

export type RuntimeActionExecutionPhase = "prepare" | "execute";

export interface RuntimeActionExecutionInput {
  phase: RuntimeActionExecutionPhase;
  action: ActionRecord;
  cognitiveCase: CognitiveCase;
  agents: AgentContract[];
  memories: MemoryRecord[];
  knowledgeRecords: KnowledgeRecord[];
  recallSummary?: string;
}

export interface RuntimeActionExecution {
  phase: RuntimeActionExecutionPhase;
  result: UnifiedRuntimeResult;
  summary: string;
}

export function runRuntimeActionExecution(input: RuntimeActionExecutionInput): RuntimeActionExecution {
  const capability = input.action.requiredCapability ?? "analysis";
  const instruction = input.phase === "prepare"
    ? [
        `Préparation contrôlée de l’action « ${input.action.title} ».`,
        `Capacité requise : ${capability}.`,
        "ORION doit mobiliser les perspectives utiles, expliciter les dépendances, les critères de réussite, les risques et le premier livrable vérifiable."
      ].join(" ")
    : [
        `Exécution cognitive contrôlée de l’action « ${input.action.title} ».`,
        `Capacité requise : ${capability}.`,
        "ORION doit produire maintenant le livrable attendu à partir du contexte disponible, confronter le résultat aux risques et indiquer les preuves ou validations encore nécessaires."
      ].join(" ");

  const result = runUnifiedRuntime({
    message: instruction,
    cognitiveCase: input.cognitiveCase,
    agents: input.agents,
    memories: input.memories.filter((item) => item.caseId === input.cognitiveCase.id),
    knowledgeRecords: input.knowledgeRecords.filter((item) => item.caseId === input.cognitiveCase.id),
    recallSummary: input.recallSummary
  });

  const contributionSummary = result.agents.contributions
    .map((item) => `${item.agentName} — ${item.content}`)
    .join(" ");
  const summary = [
    result.agents.synthesis,
    contributionSummary,
    `Prochaine étape : ${result.nextAction}`
  ].filter(Boolean).join(" ");

  return { phase: input.phase, result, summary };
}
