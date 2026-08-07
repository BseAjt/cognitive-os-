import { randomUUID } from 'node:crypto';
import { canHandle } from './agent-contracts.js';

const allowedTransitions = {
  backlog: ['ready', 'cancelled'],
  ready: ['running', 'blocked', 'cancelled'],
  running: ['completed', 'blocked', 'cancelled'],
  blocked: ['ready', 'cancelled'],
  completed: [],
  cancelled: []
};

export function createTask(payload = {}) {
  const title = String(payload.title || '').trim();
  if (!title) throw new Error('Task title is required');
  return {
    id: randomUUID(), title, description: String(payload.description || ''),
    status: payload.status || 'backlog', priority: payload.priority || 'medium',
    requiredCapability: payload.requiredCapability || 'analysis', assignedAgentId: payload.assignedAgentId || null,
    objectiveId: payload.objectiveId || null, dueAt: payload.dueAt || null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
}

export function transitionTask(task, nextStatus) {
  if (!allowedTransitions[task.status]?.includes(nextStatus)) throw new Error(`Invalid transition ${task.status} -> ${nextStatus}`);
  return { ...task, status: nextStatus, updatedAt: new Date().toISOString() };
}

export function assignTask(task, agents) {
  if (task.assignedAgentId) return task;
  const agent = agents.find(a => canHandle(a, task.requiredCapability));
  if (!agent) return { ...task, status: 'blocked', blockedReason: `No online agent for ${task.requiredCapability}`, updatedAt: new Date().toISOString() };
  return { ...task, assignedAgentId: agent.id, status: task.status === 'backlog' ? 'ready' : task.status, updatedAt: new Date().toISOString() };
}

export function runTask(task, agents) {
  const assigned = assignTask(task, agents);
  if (assigned.status === 'blocked') return assigned;
  const running = assigned.status === 'ready' ? transitionTask(assigned, 'running') : assigned;
  if (running.status !== 'running') throw new Error('Task must be ready or running');
  return transitionTask({ ...running, result: `Executed by ${running.assignedAgentId}` }, 'completed');
}
