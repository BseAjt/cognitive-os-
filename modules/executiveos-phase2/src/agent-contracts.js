const required = ['id', 'name', 'role', 'specialty', 'capabilities'];

export function validateAgentContract(agent) {
  const errors = [];
  for (const field of required) {
    if (agent?.[field] === undefined || agent?.[field] === null || agent?.[field] === '') errors.push(`Missing ${field}`);
  }
  if (agent?.capabilities && !Array.isArray(agent.capabilities)) errors.push('capabilities must be an array');
  if (agent?.status && !['online', 'busy', 'offline'].includes(agent.status)) errors.push('invalid status');
  return { valid: errors.length === 0, errors };
}

export function normalizeAgent(agent) {
  const result = {
    id: String(agent.id).toLowerCase(),
    name: String(agent.name).toUpperCase(),
    role: String(agent.role),
    specialty: String(agent.specialty),
    capabilities: [...new Set(agent.capabilities.map(String))],
    status: agent.status || 'online',
    version: agent.version || '1.0.0'
  };
  const validation = validateAgentContract(result);
  if (!validation.valid) throw new Error(`Invalid agent contract: ${validation.errors.join(', ')}`);
  return result;
}

export function canHandle(agent, capability) {
  return agent.status === 'online' && agent.capabilities.includes(capability);
}
