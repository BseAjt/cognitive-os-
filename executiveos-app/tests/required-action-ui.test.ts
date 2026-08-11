import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../components/executive-home-v4.tsx", import.meta.url), "utf8");

test("the case health indicator explains the required action", () => {
  assert.match(home, /aria-controls="required-action-panel"/);
  assert.match(home, /brief\.blockers\.length/);
  assert.match(home, /brief\.decisionsToReconsider\.length/);
  assert.match(home, /brief\.criticalRisks\.length/);
  assert.match(home, /Lever un blocage d’exécution/);
  assert.match(home, /Réexaminer une décision/);
  assert.match(home, /Traiter un risque critique/);
});

test("the required action provides a direct bilingual call to action", () => {
  assert.match(home, /Traiter maintenant/);
  assert.match(home, /Address now/);
  assert.match(home, /goTo\(requiredAction\.section\)/);
});
