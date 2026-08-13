export type DiscStyle = "D" | "I" | "S" | "C";

export interface DiscDecisionProfile {
  primary: DiscStyle;
  secondary: DiscStyle;
  adapted: DiscStyle;
}

export interface DiscDecisionGuidance {
  style: DiscStyle;
  name: string;
  color: string;
  decisionPattern: string;
  mastered: string[];
  complements: string[];
  recommendationStyle: string;
  challengeQuestion: string;
}

export const discDecisionGuidance: Record<DiscStyle, DiscDecisionGuidance> = {
  D: {
    style: "D",
    name: "Dominant",
    color: "Rouge",
    decisionPattern: "Vous tranchez par objectif, impact et vitesse d’exécution.",
    mastered: ["priorisation du résultat", "passage à l’action", "arbitrage sous pression"],
    complements: ["réversibilité", "conséquences humaines", "signaux faibles"],
    recommendationStyle: "Directe, courte, orientée résultat et prochain mouvement.",
    challengeQuestion: "Quelles conséquences difficiles à inverser la vitesse de décision risque-t-elle de masquer ?",
  },
  I: {
    style: "I",
    name: "Influent",
    color: "Jaune",
    decisionPattern: "Vous tranchez par opportunité, adhésion et énergie collective.",
    mastered: ["mobilisation", "lecture des opportunités", "création d’adhésion"],
    complements: ["niveau de preuve", "capacité réelle", "discipline de suivi"],
    recommendationStyle: "Vivante et synthétique, avec bénéfice visible et engagement concret.",
    challengeQuestion: "Quelle preuve indépendante montre que l’enthousiasme peut devenir un résultat durable ?",
  },
  S: {
    style: "S",
    name: "Stable",
    color: "Vert",
    decisionPattern: "Vous tranchez par continuité, confiance et impact sur les personnes.",
    mastered: ["cohésion", "écoute des parties prenantes", "stabilité d’exécution"],
    complements: ["coût du statu quo", "urgence réelle", "arbitrage explicite"],
    recommendationStyle: "Progressive, rassurante et attentive aux impacts humains.",
    challengeQuestion: "Que coûtera concrètement l’absence de décision dans les prochaines semaines ?",
  },
  C: {
    style: "C",
    name: "Consciencieux",
    color: "Bleu",
    decisionPattern: "Vous tranchez par faits, précision et maîtrise du risque.",
    mastered: ["qualité d’analyse", "vérification des preuves", "anticipation des risques"],
    complements: ["vitesse suffisante", "expérimentation réversible", "coût de l’analyse prolongée"],
    recommendationStyle: "Structurée, sourcée et explicite sur les hypothèses et incertitudes.",
    challengeQuestion: "Quelle décision réversible pouvez-vous tester avant de disposer de toutes les informations ?",
  },
};

export function buildDiscDecisionBrief(profile: DiscDecisionProfile) {
  const primary = discDecisionGuidance[profile.primary];
  const secondary = discDecisionGuidance[profile.secondary];
  const adapted = discDecisionGuidance[profile.adapted];
  return {
    title: `${primary.name} · nuance ${secondary.name}`,
    decisionPattern: primary.decisionPattern,
    mastered: [...new Set([...primary.mastered, secondary.mastered[0]])],
    complements: [...new Set([...primary.complements, secondary.complements[0]])],
    recommendationStyle: primary.recommendationStyle,
    challengeQuestion: primary.challengeQuestion,
    adaptedContext: profile.adapted === profile.primary
      ? "Votre comportement sous contrainte reste proche de votre style naturel."
      : `Sous contrainte, vous mobilisez davantage le style ${adapted.name.toLowerCase()}.`,
  };
}

export function isDiscDecisionProfile(value: unknown): value is DiscDecisionProfile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DiscDecisionProfile>;
  const styles: DiscStyle[] = ["D", "I", "S", "C"];
  return styles.includes(candidate.primary as DiscStyle)
    && styles.includes(candidate.secondary as DiscStyle)
    && styles.includes(candidate.adapted as DiscStyle)
    && candidate.primary !== candidate.secondary;
}
