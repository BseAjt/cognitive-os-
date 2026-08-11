import assert from "node:assert/strict";
import test from "node:test";
import { extractBulkDecisions } from "../lib/bulk-decision-import.ts";

test("l’import groupé extrait plusieurs décisions structurées et limite la prévisualisation", () => {
  const raw = Array.from({ length: 6 }, (_, index) => `Décision : Arbitrage ${index + 1}
Choix : Nous avons retenu l’option progressive.
Raison : parce que le risque restait réversible.
Résultat : le pilote a confirmé la valeur.`).join("\n\n");
  const result = extractBulkDecisions(raw);
  assert.equal(result.length, 5);
  assert.equal(result[0]?.title, "Arbitrage 1");
  assert.match(result[0]?.choice ?? "", /progressive/);
  assert.match(result[0]?.outcome ?? "", /pilote/);
});

test("l’import groupé refuse un collage vide", () => {
  assert.deepEqual(extractBulkDecisions("   "), []);
});
