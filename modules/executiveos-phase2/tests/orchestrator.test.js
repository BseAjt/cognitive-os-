import test from 'node:test';
import assert from 'node:assert/strict';
import { runCouncil } from '../src/orchestrator.js';

test('council produces multidisciplinary analysis', () => {
  const result = runCouncil('Lancer un pilote');
  assert.equal(result.analyses.length, 3);
  assert.match(result.synthesis, /ORION/);
  assert.equal(result.nextActions.length, 3);
});

test('council rejects empty input', () => {
  assert.throws(() => runCouncil('  '), /required/);
});
