import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../components/investor-twin-home.tsx", import.meta.url), "utf8");

test("demo and personal data are explicitly separated", () => {
  assert.match(source, /Démonstration — données fictives/);
  assert.match(source, /createBlankWorkspace/);
  assert.match(source, /Les exemples sont exclus des calculs/);
});

test("opportunity analysis requires a trade-off, capacity and stop rule", () => {
  assert.match(source, /Quel chantier sera arrêté, délégué ou reporté/);
  assert.match(source, /Heures disponibles \/ semaine/);
  assert.match(source, /Critère et date d’arrêt/);
  assert.match(source, /Mandatory challenge/);
});

test("the UI exposes qualitative evidence and explainable orientation", () => {
  assert.match(source, /Premiers signaux/);
  assert.match(source, /Orientation probable/);
  assert.match(source, /Comment cette analyse est produite/);
  assert.match(source, /Ce que vous n’avez peut-être pas encore examiné/);
  assert.match(source, /Question décisive/);
  assert.doesNotMatch(source, /maturityScore}%/);
});
