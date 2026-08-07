import type {
  CognitiveCase,
  ContextRecord,
  DecisionCategory,
  DecisionModel,
  DecisionOptionModel
} from "../domain/canonical.ts";
import {
  assessContext,
  buildAdaptiveQuestions,
  workforceRestructuringContextSeed,
  type ContextAssessment,
  type ContextQuestion
} from "./context-engine.ts";

export type DecisionOption = DecisionOptionModel;
export type DecisionFrame = DecisionModel;
export type { DecisionCategory };

export interface DecisionRuntimeResult {
  frame: DecisionFrame;
  contextItems: ContextRecord[];
  assessment: ContextAssessment;
  nextQuestion?: ContextQuestion;
  recommendationAllowed: boolean;
  recommendation: string | null;
  nextAction: string;
}

const WORKFORCE_RESTRUCTURING_PATTERN = /plan social|\bpse\b|licenciement(?:s)? économique(?:s)?|suppression(?:s)? de postes?|réduction d['’]effectifs?|réduire (?:les |des )?effectifs|restructuration|compression d['’]effectifs?|départs? contraints?/i;

export function runDecisionRuntime(message: string, cognitiveCase: CognitiveCase, existingContext?: ContextRecord[]): DecisionRuntimeResult {
  const frame = buildDecisionFrame(message, cognitiveCase);
  const contextItems = existingContext ?? createDecisionContext(frame);
  const assessment = assessContext(contextItems);
  const recommendationAllowed = !frame.requiresContext || assessment.recommendationAllowed;
  const recommendation = recommendationAllowed ? frame.recommendation : null;

  return {
    frame,
    contextItems,
    assessment,
    nextQuestion: buildAdaptiveQuestions(contextItems)[0],
    recommendationAllowed,
    recommendation,
    nextAction: buildDecisionNextAction(frame, assessment)
  };
}

export function evaluateDecisionContext(frame: DecisionFrame, contextItems: ContextRecord[]): Omit<DecisionRuntimeResult, "contextItems"> {
  const assessment = assessContext(contextItems);
  const recommendationAllowed = !frame.requiresContext || assessment.recommendationAllowed;
  return {
    frame,
    assessment,
    nextQuestion: buildAdaptiveQuestions(contextItems)[0],
    recommendationAllowed,
    recommendation: recommendationAllowed ? frame.recommendation : null,
    nextAction: buildDecisionNextAction(frame, assessment)
  };
}

export function createDecisionContext(frame: DecisionFrame): ContextRecord[] {
  if (frame.category === "workforce_restructuring") {
    return workforceRestructuringContextSeed.map((item) => ({ ...item, caseId: frame.question }));
  }

  return frame.missingInformation.map((label, index) => ({
    id: `generic-${index}`,
    caseId: frame.question,
    domain: "strategy",
    kind: "uncertainty",
    key: `generic_${index}`,
    label,
    value: "",
    confidence: 0,
    requirement: "required",
    status: "missing"
  }));
}

export function buildDecisionFrame(message: string, cognitiveCase: CognitiveCase): DecisionFrame {
  const lower = message.toLowerCase();
  const question = message.replace(/\s+/g, " ").trim();

  if (WORKFORCE_RESTRUCTURING_PATTERN.test(lower)) {
    return {
      category: "workforce_restructuring",
      question,
      criteria: [
        "Nécessité économique documentée",
        "Trésorerie et continuité d’activité",
        "Emplois et compétences critiques préservés",
        "Conformité juridique et dialogue social",
        "Impact humain et opérationnel",
        "Coût total et effets à moyen terme"
      ],
      options: [
        { title: "Préserver l’emploi par des mesures alternatives", description: "Examiner réduction des dépenses, gel des recrutements, mobilité, non-remplacement, activité partielle ou autres leviers adaptés.", score: null },
        { title: "Mettre en œuvre une restructuration intermédiaire", description: "Étudier les départs volontaires, réorganisations, reclassements et mesures d’accompagnement avant toute suppression contrainte.", score: null },
        { title: "Envisager des suppressions de postes", description: "N’instruire cette option que si la nécessité est établie, les alternatives insuffisantes et les obligations sociales et juridiques cadrées.", score: null }
      ],
      recommendation: null,
      confidence: null,
      missingInformation: [
        "Évolution du chiffre d’affaires, de la marge et de la trésorerie",
        "Pertes actuelles et prévisionnelles",
        "Horizon de trésorerie",
        "Nombre de postes et populations potentiellement concernés",
        "Économies attendues et coût complet de chaque scénario",
        "Alternatives déjà étudiées",
        "Compétences critiques et conséquences opérationnelles",
        "Pays, effectif de l’entreprise et cadre juridique applicable",
        "État du dialogue social et calendrier envisagé"
      ],
      reviewTrigger: "Formuler une recommandation uniquement après diagnostic financier, RH, juridique et opérationnel documenté.",
      classifications: ["high-impact", "regulated", "human-sensitive"],
      requiredAgents: ["CFO", "DRH", "Legal", "Operations", "SENECA"],
      requiresContext: true
    };
  }

  if (/recrut|embauch|directeur commercial|sales director|head of sales|cto|cfo/.test(lower)) {
    return createFrame("hiring", question, ["Impact métier", "Coût complet", "Délai de contribution", "Réversibilité", "Capacité interne"], ["Recruter maintenant", "Tester une solution intérimaire", "Reporter et valider le besoin"], "Tester une solution intérimaire avec des critères de déclenchement explicites.", ["Besoin exact", "Budget complet", "Capacité interne", "Indicateurs de succès"], 74);
  }
  if (/achet|acquérir|investir|investissement|lever des fonds|financer/.test(lower)) {
    return createFrame("investment", question, ["Valeur attendue", "Cash mobilisé", "Risque baissier", "Liquidité", "Réversibilité"], ["Engager maintenant", "Investir par étapes", "Reporter"], "Investir par étapes avec un plafond de perte et un jalon de revue.", ["Montant", "ROI attendu", "Scénario défavorable", "Horizon"], 70);
  }
  if (/lancer|launch|mise sur le marché|nouveau produit|nouvelle offre/.test(lower)) {
    return createFrame("launch", question, ["Signal marché", "Vitesse", "Coût", "Risque de marque", "Capacité d’exécution"], ["Lancement complet", "Pilote limité", "Reporter"], "Lancer un pilote limité avec critères de passage à l’échelle.", ["Segment cible", "Critère de succès", "Budget pilote", "Capacité support"], 76);
  }
  if (/prix|pricing|tarif|augmenter.*prix|baisser.*prix/.test(lower)) {
    return createFrame("pricing", question, ["Marge", "Élasticité", "Positionnement", "Churn", "Réversibilité"], ["Changer maintenant", "Tester sur un segment", "Conserver le prix"], "Tester le nouveau prix sur un segment contrôlé avant généralisation.", ["Marge actuelle", "Sensibilité prix", "Churn acceptable", "Segment test"], 72);
  }
  if (/partenariat|partenaire|alliance|joint.?venture|s'associer|s’associer/.test(lower)) {
    return createFrame("partnership", question, ["Accès marché", "Dépendance", "Économie du deal", "Contrôle", "Réversibilité"], ["Signer maintenant", "Pilote contractuel", "Ne pas poursuivre"], "Démarrer par un pilote contractuel limité et mesurable.", ["Objectifs communs", "Partage de valeur", "Clauses de sortie", "Sponsor exécutif"], 69);
  }
  return createFrame("generic", question, ["Impact", "Coût", "Risque", "Vitesse", "Réversibilité"], ["Agir maintenant", "Tester à petite échelle", "Reporter"], "Tester à petite échelle avant un engagement difficilement réversible.", ["Critère de réussite", "Coût d’opportunité", "Échéance réelle"], Math.max(55, cognitiveCase.signals.confidence));
}

function buildDecisionNextAction(frame: DecisionFrame, assessment: ContextAssessment): string {
  if (frame.requiresContext && !assessment.recommendationAllowed) {
    const missing = assessment.missingRequired.map((item) => item.label);
    return missing.length
      ? `Documenter les informations bloquantes : ${missing.join(", ")}.`
      : frame.reviewTrigger;
  }
  if (frame.missingInformation.length) {
    return `Collecter les informations manquantes : ${frame.missingInformation.join(", ")}.`;
  }
  return frame.reviewTrigger;
}

function createFrame(
  category: DecisionCategory,
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
      description: index === 0 ? "Engagement immédiat." : index === 1 ? "Réduction d’incertitude par une étape limitée." : "Attendre ou abandonner selon les preuves.",
      score: scores[index]
    })),
    recommendation,
    confidence,
    missingInformation,
    reviewTrigger: "Réexaminer après obtention des informations manquantes ou changement significatif du contexte.",
    classifications: [],
    requiredAgents: [],
    requiresContext: false
  };
}
