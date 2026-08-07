const lenses = [
  ['ATHENA', 'Stratégie', input => `Clarifier l’avantage décisif, le bénéficiaire principal et le résultat mesurable de « ${input} ».`],
  ['TURING', 'Technologie', input => `Découper « ${input} » en un flux testable : entrée, décision, mémoire, sortie et observabilité.`],
  ['SENECA', 'Réflexion', input => `Identifier l’hypothèse la plus fragile et définir une preuve susceptible de l’invalider.`]
];

export function runCouncil(input) {
  const clean = String(input || '').trim();
  if (!clean) throw new Error('Input is required');
  const analyses = lenses.map(([agent, lens, fn]) => ({ agent, lens, message: fn(clean) }));
  return {
    input: clean,
    analyses,
    synthesis: `ORION recommande de transformer « ${clean} » en une expérimentation limitée, avec un propriétaire, une échéance et un critère de succès explicite.`,
    nextActions: [
      'Définir le résultat attendu en une phrase.',
      'Choisir le plus petit périmètre démontrable.',
      'Exécuter un test et mémoriser la décision.'
    ]
  };
}
