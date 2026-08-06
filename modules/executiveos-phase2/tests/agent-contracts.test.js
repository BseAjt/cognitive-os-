import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAgent, validateAgentContract, canHandle } from '../src/agent-contracts.js';
test('normalizes a valid contract',()=>{const a=normalizeAgent({id:'Ada',name:'ada',role:'Engineer',specialty:'Code',capabilities:['implementation']});assert.equal(a.id,'ada');assert.equal(a.name,'ADA');assert.equal(canHandle(a,'implementation'),true)});
test('reports invalid contract',()=>assert.equal(validateAgentContract({id:'x'}).valid,false));
