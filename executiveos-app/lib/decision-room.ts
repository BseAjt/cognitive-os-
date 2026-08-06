import type { Challenge } from "@/types/domain";

export interface DecisionOption {
  title: string;
  description: string;
  score: number;
}

export interface DecisionFrame {
  question: string;
  criteria: string[];
  options: DecisionOption[];
  recommendation: string;
  confidence: number;
  missingInformation: string[];
  reviewTrigger: string;
}

export function buildDecisionFrame(message: string, challenge: Challenge): DecisionFrame {
  const lower = message.toLowerCase();
  const isHiring = /recrut|embauch|directeur commercial|sales director|head of sales/.test(lower);

  if (isHiring) {
    return {
      question: "Faut-il recruter un directeur commercial maintenant ?",
      criteria: ["Impact sur la croissance", "Coût et trésorerie", "Vitesse d’exécution", "Réversibilité", "Maturité du pipeline"],
      options: [
        { title: "Recruter maintenant", description: "Lancer immédiatement le recrutement d’un directeur commercial senior.", score: 64 },
        { title: "Nommer un responsable intérimaire", description: "Tester pendant 8 semaines un leadership commercial interne ou fractionné.", score: 82 },
        { title: "Reporter de 3 mois", description: "Valider d’abord le pipeline, les leads et la cause réelle du ralentissement.", score: 71 }
      ],
      recommendation: "Nommer un responsable intérimaire pendant 8 semaines, puis recruter si le pipeline qualifié et la conversion justifient le poste.",
      confidence: 74,
      missingInformation: ["Pipeline qualifié actuel", "Taux de conversion", "Coût complet du recrutement", "Capacité de l’équipe existante"],
      reviewTrigger: "Réexaminer dans 8 semaines ou dès que le pipeline qualifié dépasse le seuil défini."
    };
  }

  return {
    question: message.replace(/\s+/g, " ").trim(),
    criteria: ["Impact", "Coût", "Risque", "Vitesse", "Réversibilité"],
    options: [
      { title: "Agir maintenant", description: "Exécuter l’option principale immédiatement.", score: 68 },
      { title: "Tester à petite échelle", description: "Réduire l’incertitude avec une expérimentation courte.", score: 83 },
      { title: "Reporter", description: "Attendre davantage d’informations avant de s’engager.", score: 57 }
    ],
    recommendation: "Tester à petite échelle avant de prendre un engagement difficilement réversible.",
    confidence: Math.max(55, challenge.confidence),
    missingInformation: ["Critère de réussite", "Coût d’opportunité", "Échéance réelle"],
    reviewTrigger: "Réexaminer après obtention des informations manquantes."
  };
}
