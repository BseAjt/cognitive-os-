import { randomUUID } from 'node:crypto';

export function buildGraph(db) {
  const nodes = [];
  const edges = [];
  const add = (type, entity, label) => nodes.push({ id: `${type}:${entity.id}`, entityId: entity.id, type, label: label(entity), data: entity });
  for (const o of db.objectives || []) add('objective', o, x => x.title);
  for (const d of db.decisions || []) add('decision', d, x => x.title);
  for (const m of db.memories || []) add('memory', m, x => x.content.slice(0, 60));
  for (const t of db.tasks || []) add('task', t, x => x.title);
  for (const a of db.agents || []) add('agent', a, x => x.name);
  for (const d of db.decisions || []) if (d.objectiveId) edges.push({ id: randomUUID(), source: `decision:${d.id}`, target: `objective:${d.objectiveId}`, type: 'supports' });
  for (const t of db.tasks || []) {
    if (t.objectiveId) edges.push({ id: randomUUID(), source: `task:${t.id}`, target: `objective:${t.objectiveId}`, type: 'advances' });
    if (t.assignedAgentId) edges.push({ id: randomUUID(), source: `agent:${t.assignedAgentId}`, target: `task:${t.id}`, type: 'owns' });
  }
  return { nodes, edges, stats: { nodes: nodes.length, edges: edges.length } };
}
