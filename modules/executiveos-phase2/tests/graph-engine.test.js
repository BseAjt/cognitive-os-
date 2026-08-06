import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph } from '../src/graph-engine.js';
test('builds nodes and semantic relations',()=>{const g=buildGraph({objectives:[{id:'o',title:'Goal'}],decisions:[{id:'d',title:'Choose',objectiveId:'o'}],memories:[],tasks:[{id:'t',title:'Do',objectiveId:'o',assignedAgentId:'a'}],agents:[{id:'a',name:'Agent'}]});assert.equal(g.nodes.length,4);assert.equal(g.edges.length,3);assert.ok(g.edges.some(e=>e.type==='advances'))});
