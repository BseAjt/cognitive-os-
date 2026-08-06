import type { Challenge } from "../types/domain.ts";

export interface DecisionOption {
  title: string;
  description: string;
  score: number;
}

export interface DecisionFrame {
  question: string;
  category: "hiring" | "investment" | "launch" | "pricing" | "partnership" | "generic";
  criteria: string[];
  options: DecisionOption[];
  recommendation: string;
  confidence: number;
  missingInformation: string[];
  reviewTrigger: string;
}

export function buildDecisionFrame(message: string, challenge: Challenge): DecisionFrame {
  const lower = message.toLowerCase();
  const question = message.replace(/\s+/g, " ").trim();

  if (/recrut|embauch|directeur commercial|sales director|head of sales|cto|cfo/.test(lower)) {
    return createFrame(
      "hiring",
      question,
      ["Impact métier", "Coût complet", "Délai de contribution", "Réversibilité", "Capacité interne"],
      ["Recruter maintenant", "Tester une solution intérimaire", "Reporter et valider le besoin"],
      "Tester une solution intérimaire avec des critères de déclenchement explicites.",
      ["Besoin exact", "Budget complet", "Capacité interne", "Indicateurs de succès"],
      74
    );
  }

  if (/achet|acquérir|investir|investissement|lever des fonds|financer/.test(lower)) {
    return createFrame(
      "investment",
      question,
      ["Valeur attendue", "Cash mobilisé", "Risque baissier", "Liquidité", "Réversibilité"],
      ["Engager maintenant", "Investir par étapes", "Reporter"],
      "Investir par étapes avec un plafond de perte et un jalon de revue.",
      ["Montant", "ROI attendu", "Scénario défavorable", "Horizon"],
      70
    );
  }

  if (/lancer|launch|mise sur le marché|nouveau produit|nouvelle offre/.test(lower)) {
    return createFrame(
      "launch",
      question,
      ["Signal marché", "Vitesse", "Coût", "Risque de marque", "Capacité d’exécution"],
      ["Lancement complet", "Pilote limité", "Reporter"],
      "Lancer un pilote limité avec critères de passage à l’échelle.",
      ["Segment cible", "Critère de succès", "Budget pilote", "Capacité support"],
      76
    );
  }

  if (/prix|pricing|tarif|augmenter.*prix|baisser.*prix/.test(lower)) {
    return createFrame(
      "pricing",
      question,
      ["Marge", "Élasticité", "Positionnement", "Churn", "Réversibilité"],
      ["Changer maintenant", "Tester sur un segment", "Conserver le prix"],
      "Tester le nouveau prix sur un segment contrôlé avant généralisation.",
      ["Marge actuelle", "Sensibilité prix", "Churn acceptable", "Segment test"],
      72
    );
  }

  if (/partenariat|partenaire|alliance|joint.?venture|s'associer|s’associer/.test(lower)) {
    return createFrame(
      "partnership",
      question,
      ["Accès marché", "Dépendance", "Économie du deal", "Contrôle", "Réversibilité"],
      ["Signer maintenant", "Pilote contractuel", "Ne pas poursuivre"],
      "Démarrer par un pilote contractuel limité et mesurable.",
      ["Objectifs communs", "Partage de valeur", "Clauses de sortie", "Sponsor exécutif"],
      69
    );
  }

  return createFrame(
    "generic",
    question,
    ["Impact", "Coût", "Risque", "Vitesse", "Réversibilité"],
    ["Agir maintenant", "Tester à petite échelle", "Reporter"],
    "Tester à petite échelle avant un engagement difficilement réversible.",
    ["Critère de réussite", "Coût d’opportunité", "Échéance réelle"],
    Math.max(55, challenge.confidence)
  );
}

function createFrame(
  category: DecisionFrame["category"],
  question: string,
  criteria: string[],
  optionTitles: string[],
  recommendation: string,
  missingInformation: string[],
  confidence: number
): DecisionFrame {
  const scores = [66, 84, 58];
  return {
    category,
    question,
    criteria,
    options: optionTitles.map((title, index) => ({
      title,
      description:
        index === 0
          ? "Engagement immédiat."
          : index === 1
            ? "Réduction d’incertitude par une étape limitée."
            : "Attendre ou abandonner selon les preuves.",
      score: scores[index]
    })),
    recommendation,
    confidence,
    missingInformation,
    reviewTrigger:
      "Réexaminer après obtention des informations manquantes ou changement significatif du contexte."
  };
}
