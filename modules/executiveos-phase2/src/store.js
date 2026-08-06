import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const DB_PATH = path.resolve(process.env.EXECUTIVEOS_DATA_PATH || 'data/executiveos.json');
const now = () => new Date().toISOString();
const seed = {
  workspace: { id: 'default', name: 'ExecutiveOS', owner: 'Sébastien', createdAt: now() },
  objectives: [
    { id: 'obj-build', title: 'Construire ExecutiveOS', status: 'active', priority: 'critical', progress: 35, horizon: '90 jours', createdAt: now() },
    { id: 'obj-core', title: 'Valider le noyau cognitif', status: 'active', priority: 'high', progress: 45, horizon: '30 jours', createdAt: now() }
  ],
  decisions: [{ id: 'dec-positioning', title: 'Positionner MemoryOS comme sous-système', rationale: 'ExecutiveOS orchestre la décision, la mémoire et les agents.', confidence: 92, status: 'validated', objectiveId: 'obj-build', createdAt: now() }],
  memories: [{ id: 'mem-principle', type: 'principle', content: 'Continuer le raisonnement au lieu de recommencer.', source: 'Vision produit', createdAt: now() }],
  agents: [
    { id: 'orion', name: 'ORION', role: 'Chief Orchestrator', status: 'online', specialty: 'Orchestration exécutive', capabilities: ['orchestration','analysis','planning'], version: '1.0.0', createdAt: now() },
    { id: 'athena', name: 'ATHENA', role: 'Chief Strategy Officer', status: 'online', specialty: 'Stratégie et arbitrage', capabilities: ['strategy','analysis','planning'], version: '1.0.0', createdAt: now() },
    { id: 'turing', name: 'TURING', role: 'Chief Technology Officer', status: 'online', specialty: 'Architecture et ingénierie', capabilities: ['technology','analysis','implementation'], version: '1.0.0', createdAt: now() },
    { id: 'seneca', name: 'SENECA', role: 'Chief Reflection Officer', status: 'online', specialty: 'Biais, contradictions et recul', capabilities: ['reflection','analysis','risk'], version: '1.0.0', createdAt: now() }
  ],
  tasks: [
    { id: 'task-graph', title: 'Construire le graphe cognitif', description: 'Relier objectifs, décisions, tâches, mémoires et agents.', status: 'ready', priority: 'high', requiredCapability: 'technology', assignedAgentId: 'turing', objectiveId: 'obj-build', createdAt: now(), updatedAt: now() },
    { id: 'task-contracts', title: 'Formaliser les contrats des agents', description: 'Définir validation, capacités et statut.', status: 'completed', priority: 'high', requiredCapability: 'orchestration', assignedAgentId: 'orion', objectiveId: 'obj-core', result: 'Agent contract v1 implemented', createdAt: now(), updatedAt: now() }
  ],
  activity: []
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
