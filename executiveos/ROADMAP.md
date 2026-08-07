# ExecutiveOS — Roadmap d'intégration

Cette roadmap reprend les dix modules construits en prototype et les transforme en trajectoire d'intégration dans le produit Executive Twin existant.

| Module | Capacité | Prototype | Intégration repo |
|---|---|---:|---:|
| M1 | Executive Runtime / ORION | ✅ | À mapper sur l'orchestration existante |
| M2 | Memory Engine | ✅ | À mapper sur Memory / Fact / Hypothesis / Insight |
| M3 | Decision Engine | ✅ | À converger avec DecisionCase / Scenario / Decision |
| M4 | Reflection Engine | ✅ | À intégrer comme couche d'audit et review triggers |
| M5 | Knowledge Engine | ✅ | À converger avec Enterprise Knowledge Graph |
| M6 | Reasoning Timeline | ✅ | À intégrer comme historique/versioning du raisonnement |
| M7 | Cognitive Twin | ✅ | À converger avec Executive Twin learning loops |
| M8 | Action Engine | ✅ | À mapper sur Action / Commitment / Project |
| M9 | Goals Engine | ✅ | À mapper sur Goal / KPI |
| M10 | Command Center | ✅ | À intégrer à Executive Twin Home / Executive Inbox |

## Ordre de convergence recommandé

1. **M2 + M5 + M6** — unifier mémoire, graphe et raisonnement versionné.
2. **M3 + M4** — faire converger décision, dissent, risques et review triggers.
3. **M8 + M9** — relier décision → action → objectif → KPI.
4. **M7** — apprendre les patterns cognitifs à partir des objets validés.
5. **M1 + M10** — ORION et Command Center comme couches d'orchestration et de pilotage.

## Definition of Done globale

ExecutiveOS est considéré intégré lorsque :

- un sujet peut devenir un DecisionCase ou un Reasoning Thread ;
- le contexte pertinent est récupéré avec provenance ;
- les hypothèses, preuves et dissent sont conservés ;
- une décision produit des actions et objectifs mesurables ;
- les résultats créent Learnings et nouvelles versions de Memory ;
- le raisonnement peut être rejoué à une date antérieure ;
- le Command Center expose priorités, risques, décisions, engagements et objectifs ;
- le Cognitive Twin ne produit que des inférences explicables, sourcées et révisables.

## Politique de migration

Les prototypes Python/FastAPI construits pendant l'exploration servent de spécification exécutable. La cible GitHub doit réimplémenter ou adapter ces capacités dans l'architecture native du dépôt, plutôt que maintenir deux stacks produits concurrentes.
