import { expect, test, type Page } from "@playwright/test";

async function openCleanWorkspace(page: Page) {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: /Décidez avec votre expérience/ })).toBeVisible();
  await page.getByRole("button", { name: /Explorer la démo/ }).click();
  const closeGuide = page.getByRole("button", { name: "Fermer le guide investisseur" });
  await expect(closeGuide).toBeVisible();
  await closeGuide.click();
}

test.beforeEach(async ({ page }) => { await openCleanWorkspace(page); });

test("exposes the AI runtime readiness contract", async ({ request }) => {
  const response = await request.get("/api/orion/generate");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toEqual(expect.objectContaining({ runtime: "ai_gateway", configured: expect.any(Boolean) }));
});


test("turns a complementary axis into decision context", async ({ page }) => {
  const axis = page.getByRole("button", { name: /Contradiction utile/ });
  await expect(axis).toBeVisible();
  await axis.click();
  await expect(page.getByText(/Dossier concerné/)).toBeVisible();
  await page.getByPlaceholder("Écrivez votre réponse concrète…").fill("Le principal argument contraire est que le coût d’intégration dépasse le gain attendu.");
  await page.getByRole("button", { name: "Ajouter à l’analyse" }).click();
  await expect(page.getByText("Réponse ajoutée à l’analyse du dossier.")).toBeVisible();
});

test("shows a measurable private decision twin", async ({ page }) => {
  await expect(page.getByText("Doctrine de démonstration — données fictives")).toBeVisible();
  await expect(page.getByText("Qualité de l’historique")).toBeVisible();
  await expect(page.getByText("Historique appris")).toBeVisible();
  await expect(page.getByText("Critères identifiés")).toBeVisible();
  await expect(page.getByText("Résultats disponibles")).toBeVisible();
});

test("switches the decision twin to English and remembers the preference", async ({ page }) => {
  await page.getByRole("button", { name: "en", exact: true }).evaluate((element) => (element as HTMLButtonElement).click());
  await expect(page.getByRole("heading", { name: "Use your experience without repeating your mistakes." })).toBeVisible();
  await expect(page.getByRole("button", { name: /Analyze a decision/ })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(page.getByText("Demo doctrine — fictional data")).toBeVisible();
  await expect(page.getByRole("button", { name: "en", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("imports decision history to train the twin", async ({ page }) => {
  await page.getByRole("button", { name: "Importer mon historique" }).click();
  await expect(page.getByRole("heading", { name: "Importer des décisions passées" })).toBeVisible();
  await page.getByPlaceholder(/Une décision par bloc/).fill("Nous avons investi dans Acme parce que la rétention dépassait 130 %. Six mois plus tard, le revenu avait doublé.");
  await page.getByRole("button", { name: "Extraire 3 à 5 décisions" }).click();
  await expect(page.getByText(/DÉCISION 1/)).toBeVisible();
  await page.getByRole("button", { name: "Importer les décisions détectées" }).click();
  await expect(page.getByRole("heading", { name: "Importer des décisions passées" })).toBeHidden();
});

test("creates an opportunity and opens its decision workspace", async ({ page }) => {
  await page.getByRole("button", { name: /Analyser une décision/ }).click();
  await page.getByPlaceholder("Automatisation d’une ligne de production").fill("Acme AI — Série A");
  await page.getByPlaceholder(/Investir maintenant ou lancer un pilote limité/).fill("Devons-nous poursuivre la due diligence ?");
  await page.getByLabel("Date limite").fill("2026-09-30");
  await page.getByLabel("Heures disponibles / semaine").fill("8");
  await page.getByPlaceholder(/Option A \/ Option B/).fill("Option A: poursuivre. Option B: arrêter.");
  await page.getByPlaceholder("Réponse obligatoire").fill("Reporter le chantier de documentation.");
  await page.getByPlaceholder(/Arrêter si moins de 2 pilotes/).fill("Arrêter le 30 septembre sans pilote payant.");
  await page.getByRole("button", { name: "Confronter cette décision à mes critères" }).click();
  await expect(page.getByRole("heading", { name: "Acme AI — Série A", exact: true })).toBeVisible();
  await expect(page.getByText("Devons-nous poursuivre la due diligence ?").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Décider", exact: true })).toBeVisible();
});

test("searches decision memory and opens a result", async ({ page }) => {
  const search = page.getByLabel("Rechercher dans ExecutiveOS");
  await search.fill("automatiser");
  const result = page.getByRole("button", { name: /Dossier.*Automatiser la ligne/ }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page.getByText("Brief vivant · maintenant")).toBeVisible();
});

test("keeps the twin experience inside the mobile viewport", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only journey.");
  await expect(page.getByRole("button", { name: /Analyser une décision/ })).toBeVisible();
  await page.getByRole("button", { name: /Analyser une décision/ }).click();
  await expect(page.getByPlaceholder("Automatisation d’une ligne de production")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("opens organization settings without leaving the twin", async ({ page }) => {
  test.skip((await page.viewportSize())?.width ? (await page.viewportSize())!.width < 1024 : false, "Desktop navigation only.");
  await page.getByRole("button", { name: "Paramètres" }).click();
  await expect(page.getByRole("heading", { name: "Centre de contrôle" })).toBeVisible();
  await expect(page.getByText("Données & continuité")).toBeVisible();
});
