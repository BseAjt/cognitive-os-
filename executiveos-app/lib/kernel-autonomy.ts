import type { KernelPolicyDecision } from "./kernel-policy.ts";
import type { KernelPriority } from "./kernel-scheduler.ts";
import type { RuntimePipelineResult } from "./runtime-pipeline.ts";

export type KernelAutonomyDecision = "observe" | "suggest_followup" | "requires_human";
export type KernelAutonomyTrigger = "none" | "blocked_cycle" | "high_priority_followup" | "recovery_used" | "policy_guardrail";

export interface KernelAutonomyResult {
  decision: KernelAutonomyDecision;
  trigger: KernelAutonomyTrigger;
  suggestedPrompt?: string;
  rationale: string;
}

export function evaluateKernelAutonomy(input: {
  result: RuntimePipelineResult;
  priority: KernelPriority;
  policyDecision: KernelPolicyDecision;
  attemptCount: number;
}): KernelAutonomyResult {
  if (input.policyDecision !== "allow") {
    return {
      decision: "requires_human",
      trigger: "policy_guardrail",
      rationale: "Le cycle est sous garde-fou Kernel : aucune poursuite autonome n’est autorisée."
    };
  }

  if (input.result.trace.some((item) => item.status === "blocked")) {
    return {
      decision: "requires_human",
      trigger: "blocked_cycle",
      rationale: "Une étape cognitive est bloquée : intervention ou contexte humain requis."
    };
  }

  if (input.attemptCount > 1) {
    return {
      decision: "suggest_followup",
      trigger: "recovery_used",
      suggestedPrompt: `Vérifie la robustesse après recovery puis poursuis : ${input.result.nextAction}`,
      rationale: "Le cycle a nécessité une récupération ; un contrôle de robustesse est recommandé."
    };
  }

  if ((input.priority === "critical" || input.priority === "high") && input.result.nextAction) {
    return {
      decision: "suggest_followup",
      trigger: "high_priority_followup",
      suggestedPrompt: input.result.nextAction,
      rationale: "Cycle prioritaire terminé : le Kernel propose la prochaine étape sans l’exécuter automatiquement."
    };
  }

  return {
    decision: "observe",
    trigger: "none",
    rationale: "Aucun suivi autonome immédiat n’est nécessaire."
  };
}
