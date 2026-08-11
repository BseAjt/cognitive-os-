import { expect, test, type Page } from "@playwright/test";

async function openCleanWorkspace(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Une doctrine qui apprend/ })).toBeVisible();
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

test("shows a measurable private decision twin", async ({ page }) => {
  await expect(page.getByText("Votre jumeau décisionnel privé")).toBeVisible();
  await expect(page.getByText("État du jumeau")).toBeVisible();
  await expect(page.getByText("Décisions apprises")).toBeVisible();
  await expect(page.getByText("Doctrine couverte")).toBeVisible();
  await expect(page.getByText("Calibration", { exact: true })).toBeVisible();
});

test("imports decision history to train the twin", async ({ page }) => {
  await page.getByRole("button", { name: "Importer mon historique" }).click();
  await expect(page.getByRole("heading", { name: "Importer des décisions passées" })).toBeVisible();
  await page.getByPlaceholder(/Nous avons investi/).fill("Nous avons investi dans Acme parce que la rétention dépassait 130 %. Six mois plus tard, le revenu avait doublé.");
  await page.getByRole("button", { name: "Apprendre de cet historique" }).click();
  await expect(page.getByRole("heading", { name: "Importer des décisions passées" })).toBeHidden();
});

test("creates an opportunity and opens its decision workspace", async ({ page }) => {
  await page.getByRole("button", { name: /Analyser une opportunité/ }).click();
  await page.getByPlaceholder("Ex. Acme AI — Série A").fill("Acme AI — Série A");
  await page.getByPlaceholder("Ex. Devons-nous poursuivre la due diligence ?").fill("Devons-nous poursuivre la due diligence ?");
  await page.getByRole("button", { name: "Créer l’analyse" }).click();
  await expect(page.getByRole("heading", { name: "Acme AI — Série A", exact: true })).toBeVisible();
  await expect(page.getByText("Devons-nous poursuivre la due diligence ?").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Décider", exact: true })).toBeVisible();
});

test("searches decision memory and opens a result", async ({ page }) => {
  const search = page.getByLabel("Rechercher dans ExecutiveOS");
  await search.fill("ExecutiveOS");
  const result = page.getByRole("button", { name: /Dossier.*Construire ExecutiveOS/ }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page.getByText("Brief vivant · maintenant")).toBeVisible();
});

test("keeps the twin experience inside the mobile viewport", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only journey.");
  await expect(page.getByRole("button", { name: /Analyser une opportunité/ })).toBeVisible();
  await page.getByRole("button", { name: /Analyser une opportunité/ }).click();
  await expect(page.getByPlaceholder("Ex. Acme AI — Série A")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("opens organization settings without leaving the twin", async ({ page }) => {
  test.skip((await page.viewportSize())?.width ? (await page.viewportSize())!.width < 1024 : false, "Desktop navigation only.");
  await page.getByRole("button", { name: "Paramètres" }).click();
  await expect(page.getByRole("heading", { name: "Centre de contrôle" })).toBeVisible();
  await expect(page.getByText("Données & continuité")).toBeVisible();
});
