export type KernelRecoveryDisposition = "retry" | "fail_fast" | "human_review";

export interface KernelRecoveryPlan {
  disposition: KernelRecoveryDisposition;
  maxAttempts: number;
  reason: string;
}

const transientPattern = /(timeout|temporar|network|econnreset|econnrefused|rate limit|503|502|504)/i;
const validationPattern = /(validation|invalid|policy|forbidden|unauthorized|permission|schema)/i;

export function planKernelRecovery(error: unknown, attempt: number): KernelRecoveryPlan {
  const message = error instanceof Error ? error.message : String(error ?? "unknown error");

  if (validationPattern.test(message)) {
    return { disposition: "fail_fast", maxAttempts: attempt, reason: "Erreur non transitoire de validation, permission ou policy." };
  }

  if (transientPattern.test(message) && attempt < 2) {
    return { disposition: "retry", maxAttempts: 2, reason: "Erreur transitoire détectée : une nouvelle tentative Kernel est autorisée." };
  }

  if (transientPattern.test(message)) {
    return { disposition: "fail_fast", maxAttempts: 2, reason: "Budget de retry Kernel épuisé." };
  }

  return { disposition: "human_review", maxAttempts: attempt, reason: "Erreur non classifiée : revue humaine recommandée." };
}
