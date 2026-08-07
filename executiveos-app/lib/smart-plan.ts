import type { CognitiveCase } from "../domain/canonical.ts";

export interface SmartPlanAction {
  title: string;
  requiredCapability: string;
}

export interface SmartPlanRisk {
  title: string;
  confidence: number;
}

export interface SmartPlan {
  title: string;
  summary: string;
  actions: SmartPlanAction[];
  risks: SmartPlanRisk[];
}

export function buildSmartPlan(message: string, cognitiveCase: CognitiveCase): SmartPlan | undefined {
  if (!isPlanRequest(message)) return undefined;

  const lower = message.toLowerCase();
  const launch = /lancement|lancer|launch|go-to-market|gtm/.test(lower);
  const technical = /tech|architecture|api|logiciel|runtime|migration|intégration/.test(lower);
  const validation = /pilot|pilote|test|validation|valider/.test(lower);

  const actions: SmartPlanAction[] = [
    { title: `Définir les critères de réussite pour « ${cognitiveCase.objective} »`, requiredCapability: "analysis" },
    technical
      ? { title: "Valider les dépendances techniques et les critères de sortie", requiredCapability: "technology" }
      : { title: "Valider les hypothèses critiques avec des preuves observables", requiredCapability: "analysis" },
    launch
      ? { title: "Préparer le pilote de lancement avec périmètre, cible et mesure de succès", requiredCapability: "strategy" }
      : validation
        ? { title: "Exécuter un test contrôlé sur le périmètre prioritaire", requiredCapability: "execution" }
        : { title: "Exécuter la prochaine étape contrôlée du dossier", requiredCapability: "execution" },
    { title: "Mesurer le résultat et réévaluer la décision à partir des données obtenues", requiredCapability: "analysis" }
  ];

  const risks: SmartPlanRisk[] = [
    { title: "Critères de réussite insuffisamment mesurables", confidence: 78 },
    { title: technical ? "Dépendance technique non validée avant exécution" : "Hypothèse critique non validée avant engagement", confidence: 76 }
  ];

  return {
    title: launch ? "Plan de lancement" : "Plan d’exécution",
    summary: `${actions.length} étapes structurées pour transformer le dossier en résultats observables.`,
    actions,
    risks
  };
}

function isPlanRequest(message: string): boolean {
  return /\b(plan|roadmap|feuille de route|prépare|préparer|organise|organiser|exécuter|execution|mise en œuvre)\b/i.test(message);
}
