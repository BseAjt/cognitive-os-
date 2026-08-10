import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync(new URL("../components/executive-home-v4.tsx", import.meta.url), "utf8");
const guide = readFileSync(new URL("../components/executive-guide.tsx", import.meta.url), "utf8");

test("CEO navigation exposes four plain-language primary steps", () => {
  for (const label of ["Aujourd’hui", "Arbitrer", "Exécuter", "Apprendre"]) assert.match(home, new RegExp(label));
  assert.match(home, /ADVANCED_SECTIONS/);
  assert.match(home, /Plus ···/);
});

test("startup CEO guide is persistent, replayable and mobile accessible", () => {
  assert.match(guide, /executiveos:ceo-guide:v1/);
  assert.match(guide, /executiveos:show-guide/);
  assert.match(guide, /Guide du dirigeant/);
  assert.match(home, /Ouvrir l’aide et le glossaire/);
});

test("primary navigation contains contextual help", () => {
  assert.match(home, /InfoTip/);
  assert.match(guide, /role="tooltip"/);
});

test("help center documents both profiles and business vocabulary", () => {
  assert.match(guide, /Aide ExecutiveOS/);
  assert.match(guide, /Glossaire/);
  assert.match(guide, /Décision à rouvrir/);
  assert.match(guide, /Calibration/);
  assert.match(home, /Aide & glossaire/);
  assert.match(home, /Ouvrir l’aide et le glossaire/);
});

test("executive and investor profiles are separate and persistent", () => {
  assert.match(home, /type UserProfile = "executive" \| "investor"/);
  assert.match(home, /executiveos:user-profile:v1/);
  assert.match(home, /Mon portefeuille/);
  assert.match(home, /InvestorHome/);
  assert.match(guide, /Guide de l’investisseur/);
  assert.match(guide, /executiveos:investor-guide:v1/);
});
