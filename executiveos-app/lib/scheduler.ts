import type { Challenge } from "@/types/domain";

export function challengeScore(challenge: Challenge): number {
  const confidenceFactor = 0.5 + challenge.confidence / 100;
  const riskMultiplier = 1 + challenge.risk / 20;
  return Math.round(
    ((challenge.impact * challenge.urgency * confidenceFactor * riskMultiplier) /
      Math.max(1, challenge.cognitiveCost)) *
      10
  );
}

export function explainPriority(challenge: Challenge): string[] {
  const reasons = [
    `Impact stratégique ${challenge.impact}/10`,
    `Urgence ${challenge.urgency}/10`,
    `Confiance des hypothèses ${challenge.confidence}%`,
    `Risque ${challenge.risk}/10`,
    `Coût cognitif ${challenge.cognitiveCost}/10`
  ];
  if (challenge.confidence < 55) reasons.push("Décision à réévaluer : confiance insuffisante");
  if (challenge.risk >= 8) reasons.push("Risque critique : attention immédiate requise");
  return reasons;
}
