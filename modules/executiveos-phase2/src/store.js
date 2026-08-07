import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const DB_PATH = path.resolve(process.env.EXECUTIVEOS_DATA_PATH || 'data/executiveos.json');
const now = () => new Date().toISOString();
const daysAgo = days => new Date(Date.now() - days * 86400000).toISOString();

const seed = {
  workspace: {
    id: 'default',
    name: 'ExecutiveOS',
    owner: 'Sébastien',
    mission: 'Construire un système d’exploitation cognitif personnel capable de mémoriser, raisonner, décider et orchestrer une équipe d’agents IA.',
    createdAt: daysAgo(45)
  },
  objectives: [
    { id: 'obj-build', title: 'Construire ExecutiveOS', status: 'active', priority: 'critical', progress: 42, horizon: '90 jours', ownerAgentId: 'orion', createdAt: daysAgo(45) },
    { id: 'obj-core', title: 'Valider le noyau cognitif', status: 'active', priority: 'high', progress: 68, horizon: '30 jours', ownerAgentId: 'turing', createdAt: daysAgo(30) },
    { id: 'obj-memory', title: 'Industrialiser MemoryOS', status: 'active', priority: 'high', progress: 35, horizon: '60 jours', ownerAgentId: 'athena', createdAt: daysAgo(24) },
    { id: 'obj-agents', title: 'Déployer l’équipe exécutive IA', status: 'active', priority: 'medium', progress: 55, horizon: '45 jours', ownerAgentId: 'orion', createdAt: daysAgo(20) },
    { id: 'obj-beta', title: 'Préparer une bêta privée', status: 'planned', priority: 'medium', progress: 10, horizon: '120 jours', ownerAgentId: 'da-vinci', createdAt: daysAgo(10) }
  ],
  decisions: [
    { id: 'dec-positioning', title: 'Positionner MemoryOS comme sous-système', rationale: 'ExecutiveOS orchestre la décision, la mémoire, la réflexion et les agents. MemoryOS devient la couche de continuité cognitive.', confidence: 92, status: 'validated', objectiveId: 'obj-build', ownerAgentId: 'athena', createdAt: daysAgo(32) },
    { id: 'dec-vertical-slices', title: 'Construire par vertical slices exécutables', rationale: 'Chaque phase doit produire un composant testable de bout en bout plutôt qu’une architecture théorique complète.', confidence: 96, status: 'validated', objectiveId: 'obj-core', ownerAgentId: 'turing', createdAt: daysAgo(18) },
    { id: 'dec-storage', title: 'Conserver un mode local avec migration PostgreSQL', rationale: 'Le JSON local accélère les tests tandis que l’adaptateur PostgreSQL prépare le passage au cloud.', confidence: 84, status: 'validated', objectiveId: 'obj-core', ownerAgentId: 'turing', createdAt: daysAgo(11) },
    { id: 'dec-private-beta', title: 'Cibler une bêta privée avant le lancement public', rationale: 'Une cohorte réduite permettra d’observer les usages réels de mémoire, de décision et d’orchestration.', confidence: 78, status: 'proposed', objectiveId: 'obj-beta', ownerAgentId: 'athena', createdAt: daysAgo(5) }
  ],
  memories: [
    { id: 'mem-principle', type: 'principle', content: 'Continuer le raisonnement au lieu de recommencer.', source: 'Vision produit MemoryOS', confidence: 100, tags: ['vision', 'memory'], createdAt: daysAgo(45) },
    { id: 'mem-problem', type: 'insight', content: 'Le problème principal n’est pas l’oubli des informations, mais la perte du chemin de raisonnement qui a produit une compréhension.', source: 'Recherche utilisateur', confidence: 95, tags: ['problem', 'reasoning'], createdAt: daysAgo(42) },
    { id: 'mem-architecture', type: 'learning', content: 'Un graphe utile doit relier les objectifs, décisions, tâches, agents et mémoires plutôt que seulement des notes.', source: 'Phase 2', confidence: 91, tags: ['graph', 'architecture'], createdAt: daysAgo(14) },
    { id: 'mem-agent-contract', type: 'learning', content: 'Un agent ne doit recevoir une tâche que si son contrat déclare explicitement la capacité requise.', source: 'Task Engine', confidence: 94, tags: ['agents', 'governance'], createdAt: daysAgo(9) },
    { id: 'mem-risk', type: 'risk', content: 'La richesse fonctionnelle peut masquer l’absence de boucle d’usage simple et quotidienne.', source: 'Reflection Council', confidence: 82, tags: ['product', 'risk'], createdAt: daysAgo(3) }
  ],
  agents: [
    { id: 'orion', name: 'ORION', role: 'Chief Orchestrator', status: 'online', specialty: 'Orchestration exécutive', capabilities: ['orchestration', 'analysis', 'planning', 'coordination'], version: '1.1.0', workload: 64, createdAt: daysAgo(40) },
    { id: 'athena', name: 'ATHENA', role: 'Chief Strategy Officer', status: 'online', specialty: 'Stratégie, priorisation et arbitrage', capabilities: ['strategy', 'analysis', 'planning', 'market'], version: '1.0.0', workload: 48, createdAt: daysAgo(38) },
    { id: 'turing', name: 'TURING', role: 'Chief Technology Officer', status: 'online', specialty: 'Architecture et ingénierie', capabilities: ['technology', 'analysis', 'implementation', 'security'], version: '1.2.0', workload: 82, createdAt: daysAgo(38) },
    { id: 'seneca', name: 'SENECA', role: 'Chief Reflection Officer', status: 'online', specialty: 'Biais, contradictions et recul', capabilities: ['reflection', 'analysis', 'risk', 'ethics'], version: '1.0.0', workload: 36, createdAt: daysAgo(35) },
    { id: 'da-vinci', name: 'DA VINCI', role: 'Chief Product Officer', status: 'online', specialty: 'Produit, expérience et prototypage', capabilities: ['product', 'design', 'research', 'planning'], version: '1.0.0', workload: 41, createdAt: daysAgo(21) },
    { id: 'lovelace', name: 'LOVELACE', role: 'Chief Data Officer', status: 'standby', specialty: 'Données, modèles et qualité', capabilities: ['data', 'analysis', 'technology', 'governance'], version: '0.9.0', workload: 18, createdAt: daysAgo(16) }
  ],
  tasks: [
    { id: 'task-graph', title: 'Construire le graphe cognitif', description: 'Relier objectifs, décisions, tâches, mémoires et agents.', status: 'running', priority: 'critical', requiredCapability: 'technology', assignedAgentId: 'turing', objectiveId: 'obj-build', progress: 75, dueDate: new Date(Date.now() + 4 * 86400000).toISOString(), createdAt: daysAgo(14), updatedAt: daysAgo(1) },
    { id: 'task-contracts', title: 'Formaliser les contrats des agents', description: 'Définir validation, capacités, statut et version.', status: 'completed', priority: 'high', requiredCapability: 'orchestration', assignedAgentId: 'orion', objectiveId: 'obj-core', progress: 100, result: 'Agent Contract v1 validé et intégré au Task Engine.', createdAt: daysAgo(18), updatedAt: daysAgo(8) },
    { id: 'task-postgres', title: 'Activer le stockage PostgreSQL', description: 'Brancher l’adaptateur, créer les migrations et valider la persistance.', status: 'ready', priority: 'high', requiredCapability: 'technology', assignedAgentId: 'turing', objectiveId: 'obj-core', progress: 15, dueDate: new Date(Date.now() + 10 * 86400000).toISOString(), createdAt: daysAgo(8), updatedAt: daysAgo(2) },
    { id: 'task-memory-schema', title: 'Définir le schéma de mémoire cognitive', description: 'Structurer faits, hypothèses, arguments, décisions, questions et apprentissages.', status: 'running', priority: 'high', requiredCapability: 'data', assignedAgentId: 'lovelace', objectiveId: 'obj-memory', progress: 55, dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), createdAt: daysAgo(10), updatedAt: daysAgo(1) },
    { id: 'task-daily-loop', title: 'Concevoir la boucle d’usage quotidienne', description: 'Créer un parcours simple : capturer, comprendre, décider, reprendre.', status: 'ready', priority: 'high', requiredCapability: 'product', assignedAgentId: 'da-vinci', objectiveId: 'obj-memory', progress: 25, dueDate: new Date(Date.now() + 12 * 86400000).toISOString(), createdAt: daysAgo(7), updatedAt: daysAgo(2) },
    { id: 'task-council', title: 'Étendre l’Executive Council', description: 'Ajouter synthèse contradictoire, recommandation et plan d’action.', status: 'backlog', priority: 'medium', requiredCapability: 'orchestration', assignedAgentId: 'orion', objectiveId: 'obj-agents', progress: 0, createdAt: daysAgo(5), updatedAt: daysAgo(5) },
    { id: 'task-risk-review', title: 'Analyser les risques de surcomplexité', description: 'Identifier les fonctions à différer pour préserver un produit utilisable.', status: 'completed', priority: 'medium', requiredCapability: 'reflection', assignedAgentId: 'seneca', objectiveId: 'obj-beta', progress: 100, result: 'Limiter la bêta à Capture, Reprise, Décision et Conseil.', createdAt: daysAgo(6), updatedAt: daysAgo(3) },
    { id: 'task-beta-cohort', title: 'Définir la cohorte bêta', description: 'Identifier 10 utilisateurs pilotes et leurs scénarios prioritaires.', status: 'blocked', priority: 'medium', requiredCapability: 'strategy', assignedAgentId: 'athena', objectiveId: 'obj-beta', progress: 20, blockedReason: 'Proposition de valeur et critères de sélection à finaliser.', createdAt: daysAgo(4), updatedAt: daysAgo(1) }
  ],
  activity: [
    { id: 'act-1', action: 'task:updated', entityId: 'task-graph', detail: 'Progression portée à 75 % après validation du graphe.', createdAt: daysAgo(1) },
    { id: 'act-2', action: 'memory:created', entityId: 'mem-risk', detail: 'Risque produit ajouté par SENECA.', createdAt: daysAgo(3) },
    { id: 'act-3', action: 'task:completed', entityId: 'task-risk-review', detail: 'Revue de surcomplexité terminée.', createdAt: daysAgo(3) },
    { id: 'act-4', action: 'decision:proposed', entityId: 'dec-private-beta', detail: 'Décision soumise au Conseil exécutif.', createdAt: daysAgo(5) },
    { id: 'act-5', action: 'task:completed', entityId: 'task-contracts', detail: 'Contrats d’agents v1 finalisés.', createdAt: daysAgo(8) }
  ]
};

async function ensureDb() {
  await mkdir(path.dirname(DB_PATH), { recursive: true });
  try {
    const current = JSON.parse(await readFile(DB_PATH, 'utf8'));
    let changed = false;
    for (const [key, value] of Object.entries(seed)) if (current[key] === undefined) { current[key] = value; changed = true; }
    if (current.agents?.some(a => !a.capabilities)) { current.agents = seed.agents; changed = true; }
    if (changed) await writeFile(DB_PATH, JSON.stringify(current, null, 2));
  } catch { await writeFile(DB_PATH, JSON.stringify(seed, null, 2)); }
}

export async function readDb() { await ensureDb(); return JSON.parse(await readFile(DB_PATH, 'utf8')); }
export async function writeDb(db) { await writeFile(DB_PATH, JSON.stringify(db, null, 2)); return db; }
export async function addEntity(collection, payload) {
  const db = await readDb();
  if (!Array.isArray(db[collection])) throw new Error('Unknown collection');
  const entity = { id: randomUUID(), ...payload, createdAt: payload.createdAt || now() };
  db[collection].unshift(entity);
  db.activity.unshift({ id: randomUUID(), action: `created:${collection}`, entityId: entity.id, createdAt: now() });
  await writeDb(db); return entity;
}
export async function updateEntity(collection, id, updater) {
  const db = await readDb();
  const index = db[collection]?.findIndex(x => x.id === id) ?? -1;
  if (index < 0) throw new Error('Entity not found');
  db[collection][index] = updater(db[collection][index]);
  db.activity.unshift({ id: randomUUID(), action: `updated:${collection}`, entityId: id, createdAt: now() });
  await writeDb(db); return db[collection][index];
}
