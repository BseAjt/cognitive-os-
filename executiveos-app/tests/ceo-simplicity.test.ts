import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync(new URL("../components/executive-home-v4.tsx", import.meta.url), "utf8");
const guide = readFileSync(new URL("../components/executive-guide.tsx", import.meta.url), "utf8");

test("decision journey exposes only three plain-language primary steps", () => {
  for (const label of ["Synthèse", "Décider", "Suivre"]) assert.match(home, new RegExp(label));
  assert.match(home, /ADVANCED_SECTIONS/);
  assert.match(home, />Plus</);
  const twin = readFileSync(new URL("../components/investor-twin-home.tsx", import.meta.url), "utf8");
  assert.match(twin, /Parcours principal/);
  assert.match(twin, /#synthese/);
  assert.match(twin, /#suivre/);
});

test("floating expert docks are removed from the primary page", () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /LiveMemoryDock|OrionCyclesDock/);
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

test("the product is focused on the investor decision twin", () => {
  assert.match(home, /useState<UserProfile>\("investor"\)/);
  assert.match(home, /Mon jumeau/);
  assert.doesNotMatch(home, /Choisir un profil/);
  assert.match(home, /InvestorHome/);
  assert.match(guide, /Guide de l’investisseur/);
  assert.match(guide, /executiveos:investor-guide:v1/);
});

test("CEO home leads with three plain-language outcomes instead of product modules", () => {
  assert.match(home, /ExecutiveOS CEO/);
  assert.match(home, /Voici l’essentiel/);
  assert.match(home, /À traiter aujourd’hui/);
  assert.match(home, /Décision à prendre/);
  assert.match(home, /Prochaine action/);
  assert.match(home, /Tous les sujets/);
});

test("investor home leads with twin maturity and doctrine training", () => {
  assert.match(home, /Votre jumeau décisionnel privé/);
  assert.match(home, /État du jumeau/);
  assert.match(home, /Doctrine couverte/);
  assert.match(home, /Importer mon historique/);
  assert.match(home, /Analyser une opportunité/);
  assert.match(home, /Confronter à ma doctrine/);
});
