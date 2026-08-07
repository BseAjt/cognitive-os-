import type { CognitiveCase } from "../domain/canonical.ts";

export type KernelPolicyDecision = "allow" | "require_context" | "deny";
export type KernelPolicyRisk = "low" | "medium" | "high" | "critical";

export interface KernelPolicyResult {
  decision: KernelPolicyDecision;
  risk: KernelPolicyRisk;
  rules: string[];
  rationale: string;
}

const regulatedWorkforce = /(pse|plan social|licenciement économique|suppression(s)? de postes|réduction d['’ ]effectifs|restructuration)/i;
const destructiveAction = /(supprime définitivement|efface définitivement|delete permanently|drop database|destroy production)/i;

export function evaluateKernelPolicy(input: { message: string; cognitiveCase: CognitiveCase }): KernelPolicyResult {
  const { message, cognitiveCase } = input;
  const rules: string[] = [];

  if (destructiveAction.test(message)) {
    rules.push("destructive_side_effect");
    return {
      decision: "deny",
      risk: "critical",
      rules,
      rationale: "Action destructive explicite : le Kernel refuse l’exécution automatique."
    };
  }

  if (regulatedWorkforce.test(message)) {
    rules.push("regulated_workforce_decision");
    return {
      decision: "require_context",
      risk: "high",
      rules,
      rationale: "Décision sociale réglementée : contexte et validation humaine requis avant recommandation."
    };
  }

  const highRiskLowConfidence = cognitiveCase.signals.risk >= 8 && cognitiveCase.signals.confidence < 55;
  if (highRiskLowConfidence) {
    rules.push("high_risk_low_confidence");
    return {
      decision: "require_context",
      risk: "high",
      rules,
      rationale: "Risque élevé avec confiance insuffisante : le Kernel exige davantage de contexte."
    };
  }

  if (cognitiveCase.signals.risk >= 6) rules.push("elevated_case_risk");
  return {
    decision: "allow",
    risk: cognitiveCase.signals.risk >= 6 ? "medium" : "low",
    rules,
    rationale: rules.length ? "Cycle autorisé avec surveillance renforcée." : "Aucun garde-fou bloquant détecté."
  };
}
