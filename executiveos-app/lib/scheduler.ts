import type { CognitiveCase } from "@/domain/canonical";

export function caseScore(cognitiveCase: CognitiveCase): number {
  const { confidence, risk, impact, urgency, cognitiveCost } = cognitiveCase.signals;
  const confidenceFactor = 0.5 + confidence / 100;
  const riskMultiplier = 1 + risk / 20;
  return Math.round(
    ((impact * urgency * confidenceFactor * riskMultiplier) /
      Math.max(1, cognitiveCost)) *
      10
  );
}

export function explainPriority(cognitiveCase: CognitiveCase): string[] {
  const { impact, urgency, confidence, risk, cognitiveCost } = cognitiveCase.signals;
  const reasons = [
    `Impact stratégique ${impact}/10`,
    `Urgence ${urgency}/10`,
    `Confiance des hypothèses ${confidence}%`,
    `Risque ${risk}/10`,
    `Coût cognitif ${cognitiveCost}/10`
  ];
  if (confidence < 55) reasons.push("Décision à réévaluer : confiance insuffisante");
  if (risk >= 8) reasons.push("Risque critique : attention immédiate requise");
  return reasons;
}
