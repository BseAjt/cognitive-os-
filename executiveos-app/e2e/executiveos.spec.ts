import { expect, test, type Page } from "@playwright/test";

async function openCleanWorkspace(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Mes dossiers" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await openCleanWorkspace(page);
});

test("exposes the C1.1 ORION AI runtime readiness contract", async ({ request }) => {
  const response = await request.get("/api/orion/generate");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toEqual(expect.objectContaining({
    runtime: "ai_gateway",
    configured: expect.any(Boolean)
  }));
});

test("loads the dossier-first workspace and investor evidence", async ({ page }) => {
  await expect(page.getByText("ExecutiveOS · Dossier First")).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Nouveau dossier" })).toBeVisible();
});

test("opens the active cognitive dossier", async ({ page, isMobile }) => {
  test.skip(isMobile, "The active dossier shortcut is intentionally hidden on mobile.");
  await page.getByText("Reprendre →").click();
  await expect(page.getByText("← Mes dossiers")).toBeVisible();
  await expect(page.getByText("Brief vivant · maintenant")).toBeVisible();
  await expect(page.getByText("Centre d’attention")).toBeVisible();
  await expect(page.getByRole("button", { name: /01.*Vue d’ensemble/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /02.*Sources & contexte/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /03.*Strategy Studio/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /04.*Analyse & décision/ })).toBeVisible();
  await page.getByRole("button", { name: /04.*Analyse & décision/ }).click();
  await expect(page.getByRole("heading", { name: "Raisonner, comparer et arbitrer" })).toBeVisible();
});

test("runs a strategic study and turns it into execution", async ({ page }) => {
  await page.getByText("Ouvrir le dossier →").first().click();
  await page.getByRole("button", { name: /03.*Strategy Studio/ }).click();
  const studio = page.getByRole("region", { name: "Strategy Studio" });
  await expect(studio.getByRole("heading", { name: "De l’intuition au dossier investissable" })).toBeVisible();
  await expect(studio.getByRole("button", { name: /TAM · SAM · SOM/ })).toBeVisible();
  await studio.getByRole("button", { name: "Lancer avec ORION" }).click();
  await expect(studio.getByText("Synthèse ORION")).toBeVisible();
  await expect(studio.getByText("1/10")).toBeVisible();
  await studio.getByRole("button", { name: "Transformer en décision" }).click();
  await expect(studio.getByRole("status")).toContainText("décision traçable");
  await studio.getByRole("button", { name: "Créer le plan d’action" }).click();
  await expect(studio.getByRole("status")).toContainText("3 actions");
});

test("searches across the cognitive workspace and opens a result", async ({ page }) => {
  const search = page.getByLabel("Rechercher dans ExecutiveOS");
  await search.fill("ExecutiveOS");
  const result = page.getByRole("button", { name: /Dossier.*Construire ExecutiveOS/ }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page.getByText("Brief vivant · maintenant")).toBeVisible();
});

test("creates a new cognitive dossier", async ({ page }) => {
  await page.getByRole("button", { name: "+ Nouveau dossier" }).click();
  await expect(page.getByRole("heading", { name: "Quel sujet veux-tu faire avancer ?" })).toBeVisible();
  await page.getByPlaceholder("Ex. Dois-je lancer ce produit ?").fill("Préparer la levée Seed");
  await page.getByPlaceholder("Ex. Décider si le lancement crée assez de valeur.").fill("Construire une décision investissable");
  await page.getByPlaceholder("Ce que tu sais déjà, contraintes, horizon…").fill("Horizon de six mois");
  await page.getByRole("button", { name: "Créer et ouvrir le dossier" }).click();
  await expect(page.getByRole("heading", { name: "Préparer la levée Seed", exact: true })).toBeVisible();
  await expect(page.getByText("Construire une décision investissable").first()).toBeVisible();
});

test("opens organization settings and collaboration controls", async ({ page }) => {
  await page.getByRole("button", { name: "Paramètres" }).click();
  await expect(page.getByRole("heading", { name: "Centre de contrôle" })).toBeVisible();
  await expect(page.getByText("Profil d’organisation", { exact: true })).toBeVisible();
  await expect(page.getByLabel("E-mail du collaborateur")).toBeVisible();
  await expect(page.getByRole("button", { name: "Inviter" })).toBeVisible();
  await expect(page.getByText("Données & continuité")).toBeVisible();
});

test("exports the complete workspace from product controls", async ({ page }) => {
  await page.getByRole("button", { name: "Paramètres" }).click();
  await expect(page.getByRole("button", { name: "Exporter tout l’espace en JSON" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Demander une synchronisation cloud" })).toBeVisible();
});

test("keeps the dossier-first experience usable on mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only journey.");
  await expect(page.getByRole("heading", { name: "Mes dossiers" })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Nouveau dossier" })).toBeVisible();
  await expect(page.getByLabel("Rechercher dans ExecutiveOS")).toBeVisible();
  await page.getByRole("button", { name: "+ Nouveau dossier" }).click();
  await expect(page.getByPlaceholder("Ex. Dois-je lancer ce produit ?")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("keeps cognitive docks contained inside the mobile viewport", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only viewport regression.");
  await page.getByRole("button", { name: /Mémoire vivante/ }).click();
  const memory = page.getByRole("dialog", { name: "Mémoire vivante" });
  await expect(memory).toBeVisible();
  await expect.poll(() => memory.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.left >= 0 && box.right <= window.innerWidth && box.top >= 0 && box.bottom <= window.innerHeight;
  })).toBe(true);
  await memory.getByRole("button", { name: "Réduire" }).click();

  await page.getByRole("button", { name: /Cycles ORION/ }).click();
  const cycles = page.getByRole("dialog", { name: "Cycles ORION" });
  await expect(cycles).toBeVisible();
  await expect.poll(() => cycles.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.left >= 0 && box.right <= window.innerWidth && box.top >= 0 && box.bottom <= window.innerHeight;
  })).toBe(true);
});

test("runs an actionable ORION cycle from the cycles dock", async ({ page }) => {
  await page.route("**/api/orion/generate", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      runtime:"ai_gateway",model:"e2e",generatedAt:"2026-08-10T10:00:00.000Z",durationMs:20,
      trace:{cycleId:"e2e-cycle",stages:[],evidenceManifest:[{citation:"S1",evidenceId:"demo-evidence-1-1-1",sourceId:"demo-source-1-1",sourceTitle:"Preuve pilote",confidence:90}]},
      output:{
        synthesis:"Les trois perspectives convergent vers un investissement progressif et mesurable.",recommendation:"Valider un investissement progressif avec un point de contrôle explicite.",confidence:84,assumptions:[],missingEvidence:[],
        decisionMemo:{status:"conditional",rationale:[{claim:"L’investissement progressif limite le risque tout en produisant une preuve de valeur.",citations:["S1"],agentIds:["athena","turing","seneca"]}],conditions:["Mesurer le résultat au checkpoint."],confidenceExplanation:"La preuve disponible soutient une décision conditionnelle et réversible."},
        contributions:[
          {agentId:"athena",position:"support",analysis:"La priorité soutient directement la trajectoire stratégique du dossier.",confidence:86,citations:["S1"]},
          {agentId:"turing",position:"conditional",analysis:"Le plan est faisable avec un responsable et un jalon explicites.",confidence:83,citations:["S1"]},
          {agentId:"seneca",position:"challenge",analysis:"La réversibilité doit rester mesurable pendant toute l’exécution.",confidence:81,citations:["S1"]}
        ],
        debates:[
          {criticId:"athena",targetId:"turing",objection:"Le dispositif opérationnel risque-t-il de retarder la valeur attendue ?",objectionCitations:["S1"],response:"Un cadrage léger suffit avant de commencer l’exécution mesurée.",responseCitations:["S1"],resolution:"resolved",unresolvedPoint:null},
          {criticId:"turing",targetId:"seneca",objection:"Le critère de réversibilité est-il suffisamment mesurable ?",objectionCitations:["S1"],response:"Le checkpoint permettra de mesurer le signal avant extension.",responseCitations:["S1"],resolution:"partial",unresolvedPoint:"Préciser le seuil au lancement."},
          {criticId:"seneca",targetId:"athena",objection:"La valeur stratégique justifie-t-elle déjà un engagement large ?",objectionCitations:["S1"],response:"La recommandation reste volontairement progressive et conditionnelle.",responseCitations:["S1"],resolution:"resolved",unresolvedPoint:null}
        ]
      }
    })
  }));
  await page.getByRole("button", { name: /Cycles ORION/ }).click();
  const cycles = page.getByRole("dialog", { name: "Cycles ORION" });
  await cycles.getByLabel("Mandat du prochain cycle").fill("Arbitrer le prochain investissement prioritaire");
  await cycles.getByRole("button", { name: "Lancer et créer le plan" }).click();
  await expect(cycles.getByRole("status")).toContainText("3 actions créées");
  await expect(cycles.getByText("Dernière synthèse")).toBeVisible();
  await expect(cycles.getByText("Plan actif · 3 actions")).toBeVisible();
});

test("starts and executes an action through ORION instead of only changing its status", async ({ page }) => {
  await page.getByText("Ouvrir le dossier →").first().click();
  await page.getByRole("button", { name: /05.*Exécution/ }).click();
  await expect(page.getByRole("heading", { name: "Transformer les décisions en exécution orchestrée." })).toBeVisible();

  const start = page.getByRole("button", { name: "Démarrer avec ORION" }).first();
  await start.click();
  await expect(page.getByRole("status")).toContainText("ORION a produit le cadrage d’exécution");
  await expect(page.getByTestId("kernel-observability").getByRole("button", { name: /Voir la trace/ }).first()).toBeVisible();

  const execute = page.getByRole("button", { name: "Exécuter" }).first();
  await execute.click();
  await expect(page.getByRole("status")).toContainText(/terminée à 100%|bloquée/);
  await expect(page.getByText(/ORION recommande/).first()).toBeVisible();
});
