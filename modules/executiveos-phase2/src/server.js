import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDb, addEntity, updateEntity } from './store.js';
import { runCouncil } from './orchestrator.js';
import { createTask, assignTask, runTask, transitionTask } from './task-engine.js';
import { buildGraph } from './graph-engine.js';
import { normalizeAgent, validateAgentContract } from './agent-contracts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');
const port = Number(process.env.PORT || 8080);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.json':'application/json' };
const send = (res, code, value, type='application/json') => { res.writeHead(code, {'content-type': type}); res.end(type.includes('json') ? JSON.stringify(value) : value); };
const parseBody = req => new Promise((resolve, reject) => { let data=''; req.on('data', c => { data += c; if (data.length > 1_000_000) reject(new Error('Payload too large')); }); req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Invalid JSON')); }}); });

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/health') return send(res, 200, { status:'ok', module:'executive-core', version:'0.2.0', storage: process.env.DATABASE_URL ? 'postgres-ready' : 'json' });
    if (url.pathname === '/api/state' && req.method === 'GET') return send(res, 200, await readDb());
    if (url.pathname === '/api/graph' && req.method === 'GET') return send(res, 200, buildGraph(await readDb()));
    if (url.pathname === '/api/objectives' && req.method === 'POST') return send(res, 201, await addEntity('objectives', await parseBody(req)));
    if (url.pathname === '/api/decisions' && req.method === 'POST') return send(res, 201, await addEntity('decisions', await parseBody(req)));
    if (url.pathname === '/api/memories' && req.method === 'POST') return send(res, 201, await addEntity('memories', await parseBody(req)));
    if (url.pathname === '/api/agents' && req.method === 'POST') return send(res, 201, await addEntity('agents', normalizeAgent(await parseBody(req))));
    if (url.pathname === '/api/agents/validate' && req.method === 'POST') return send(res, 200, validateAgentContract(await parseBody(req)));
    if (url.pathname === '/api/tasks' && req.method === 'POST') return send(res, 201, await addEntity('tasks', createTask(await parseBody(req))));
    const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/(assign|run|transition)$/);
    if (taskMatch && req.method === 'POST') {
      const [, id, action] = taskMatch;
      const payload = await parseBody(req);
      const db = await readDb();
      const result = await updateEntity('tasks', id, task => action === 'assign' ? assignTask(task, db.agents) : action === 'run' ? runTask(task, db.agents) : transitionTask(task, payload.status));
      return send(res, 200, result);
    }
    if (url.pathname === '/api/council' && req.method === 'POST') return send(res, 200, runCouncil((await parseBody(req)).input));
    let file = url.pathname === '/' ? '/index.html' : url.pathname;
    file = path.normalize(file).replace(/^\.\.(\/|\\|$)/, '');
    const filePath = path.join(publicDir, file);
    if (!filePath.startsWith(publicDir)) return send(res, 403, { error:'Forbidden' });
    const data = await readFile(filePath);
    return send(res, 200, data, types[path.extname(filePath)] || 'application/octet-stream');
  } catch (error) {
    if (error.code === 'ENOENT') return send(res, 404, { error:'Not found' });
    return send(res, 400, { error:error.message });
  }
});

server.listen(port, () => console.log(`ExecutiveOS Phase 2 running on http://localhost:${port}`));
