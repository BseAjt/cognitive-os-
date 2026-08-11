import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const twin = read("../components/investor-twin-home.tsx");
const demo = read("../lib/investor-demo.ts");
const onboarding = read("../components/product-onboarding.tsx");
const settings = read("../components/product-control-center.tsx");
const how = read("../app/comment-ca-marche/page.tsx");
const schema = read("../supabase/schema.sql");

test("la démonstration publique est fictive, externe et immédiatement exploitable", () => {
  assert.match(demo, /Claire Martin/);
  assert.match(demo, /ETI industrielle/);
  assert.match(demo, /Automatiser la ligne/);
  assert.match(twin, /Essayer avec mes propres décisions/);
  assert.doesNotMatch(demo, /Architecture UX unifiée|Positionnement retenu pour la démo|Modèle canonique adopté/);
});

test("le cold start propose import groupé, prévisualisation et doctrine émergente", () => {
  assert.match(twin, /Extraire 3 à 5 décisions/);
  assert.match(twin, /Prévisualisation structurée/);
  assert.match(twin, /Importer les décisions détectées/);
  assert.match(read("../lib/decision-twin.ts"), /Doctrine émergente/);
});

test("onboarding, connecteurs, confidentialité et page publique sont présents", () => {
  assert.match(onboarding, /Décisions d’investissement/);
  assert.match(onboarding, /Recrutement exécutif/);
  assert.match(onboarding, /Confidentialité de vos données/);
  assert.match(settings, /Connecter mes données/);
  assert.match(settings, /Gmail \/ Outlook/);
  assert.match(settings, /BIENTÔT DISPONIBLE/);
  assert.match(how, /Raconter/);
  assert.match(how, /Confronter/);
  assert.match(how, /Apprendre/);
});

test("l’isolation cloud repose sur RLS et l’appartenance à l’organisation", () => {
  assert.match(schema, /enable row level security/);
  assert.match(schema, /private\.is_org_member/);
  assert.match(schema, /auth\.uid\(\)/);
  assert.match(schema, /with check/);
});
