import test from 'node:test';
import assert from 'node:assert/strict';
import { createTask, assignTask, runTask, transitionTask } from '../src/task-engine.js';

const agents=[{id:'turing',status:'online',capabilities:['technology']}];
test('assigns a task by capability',()=>{const t=assignTask(createTask({title:'Build API',requiredCapability:'technology'}),agents);assert.equal(t.assignedAgentId,'turing');assert.equal(t.status,'ready')});
test('blocks when no agent can handle it',()=>{const t=assignTask(createTask({title:'Legal review',requiredCapability:'legal'}),agents);assert.equal(t.status,'blocked')});
test('runs assigned task to completion',()=>{const t=runTask(createTask({title:'Build API',requiredCapability:'technology'}),agents);assert.equal(t.status,'completed');assert.match(t.result,/turing/)});
test('rejects invalid transitions',()=>assert.throws(()=>transitionTask(createTask({title:'X'}),'completed'),/Invalid transition/));
