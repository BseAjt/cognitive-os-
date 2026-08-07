import type { CognitiveCase } from "../domain/canonical.ts";

export type KernelPriority = "critical" | "high" | "normal" | "background";
export type KernelLane = "decision" | "execution" | "learning" | "general";

export interface KernelScheduleDecision {
  priority: KernelPriority;
  lane: KernelLane;
  score: number;
  reasons: string[];
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function scheduleKernelCycle(input: { message: string; cognitiveCase: CognitiveCase }): KernelScheduleDecision {
  const { cognitiveCase } = input;
  const message = input.message.toLowerCase();
  const signals = cognitiveCase.signals;

  const decisionIntent = /(décid|chois|arbitr|faut-il|dois-je|should|whether)/i.test(message);
  const executionIntent = /(exécut|plan|roadmap|lancer|mettre en œuvre|implement|deploy|ship)/i.test(message);
  const learningIntent = /(appris|learning|retour|bilan|réflexion|reflection|leçon)/i.test(message);

  const lane: KernelLane = decisionIntent ? "decision" : executionIntent ? "execution" : learningIntent ? "learning" : "general";
  const uncertainty = Math.max(0, 100 - signals.confidence);
  const rawScore = signals.impact * 3.2 + signals.urgency * 3 + signals.risk * 2.4 + uncertainty * 0.12 - signals.cognitiveCost * 0.8;
  const intentBoost = lane === "decision" ? 8 : lane === "execution" ? 6 : lane === "learning" ? 2 : 0;
  const score = Math.round(clamp(rawScore + intentBoost));

  const priority: KernelPriority = score >= 78 ? "critical" : score >= 60 ? "high" : score >= 32 ? "normal" : "background";
  const reasons = [
    `impact ${signals.impact}/10`,
    `urgence ${signals.urgency}/10`,
    `risque ${signals.risk}/10`,
    `confiance ${signals.confidence}%`,
    `lane ${lane}`
  ];

  return { priority, lane, score, reasons };
}
