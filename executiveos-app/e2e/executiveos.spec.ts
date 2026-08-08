import { expect, test, type Page } from "@playwright/test";

async function openCleanWorkspace(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Mes dossiers" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await openCleanWorkspace(page);
});

test("loads the dossier-first workspace and investor evidence", async ({ page }) => {
  await expect(page.getByText("ExecutiveOS", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("ExecutiveOS · Dossier First")).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Nouveau dossier" })).toBeVisible();
  await expect(page.getByText("Dossier actif")).toBeVisible();
});

test("opens the active cognitive dossier", async ({ page }) => {
  await page.getByText("Reprendre →").click();
  await expect(page.getByText("← Mes dossiers")).toBeVisible();
  await expect(page.getByText("Là où tu en étais")).toBeVisible();
  await expect(page.getByText("01 · Vue d’ensemble")).toBeVisible();
  await expect(page.getByText("02 · Sources & contexte")).toBeVisible();
  await expect(page.getByText("03 · Analyse & décision")).toBeVisible();
  await expect(page.getByText("04 · Exécution")).toBeVisible();
  await expect(page.getByText("05 · Apprentissage")).toBeVisible();
  await expect(page.getByText("06 · Historique")).toBeVisible();
});

test("creates a new cognitive dossier", async ({ page }) => {
  await page.getByRole("button", { name: "+ Nouveau dossier" }).click();
  await expect(page.getByRole("heading", { name: "Quel sujet veux-tu faire avancer ?" })).toBeVisible();
  await page.getByPlaceholder("Ex. Dois-je lancer ce produit ?").fill("Préparer la levée Seed");
  await page.getByPlaceholder("Ex. Décider si le lancement crée assez de valeur.").fill("Construire une décision investissable");
  await page.getByPlaceholder("Ce que tu sais déjà, contraintes, horizon…").fill("Horizon de six mois");
  await page.getByRole("button", { name: "Créer et ouvrir le dossier" }).click();
  await expect(page.getByRole("heading", { name: "Préparer la levée Seed" })).toBeVisible();
  await expect(page.getByText("Construire une décision investissable")).toBeVisible();
});

test("opens organization settings and collaboration controls", async ({ page, isMobile }) => {
  test.skip(isMobile, "The desktop navigation is intentionally hidden on mobile.");
  await page.getByRole("button", { name: "Paramètres" }).click();
  await expect(page.getByRole("heading", { name: "ExecutiveOS" })).toBeVisible();
  await expect(page.getByText("Organisation", { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel("E-mail du membre")).toBeVisible();
  await expect(page.getByRole("button", { name: "Inviter" })).toBeVisible();
  await expect(page.getByText("Journal d’audit")).toBeVisible();
});

test("restores the investor demonstration workspace", async ({ page, isMobile }) => {
  test.skip(isMobile, "The desktop navigation is intentionally hidden on mobile.");
  await page.getByRole("button", { name: "Paramètres" }).click();
  await page.getByRole("button", { name: "Restaurer la démo investisseur" }).click();
  await page.getByRole("button", { name: "Mes dossiers" }).click();
  await expect(page.getByRole("heading", { name: "Mes dossiers" })).toBeVisible();
  await expect(page.locator("main").getByRole("button").filter({ hasText: "Ouvrir le dossier" }).first()).toBeVisible();
});

test("keeps the dossier-first experience usable on mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only journey.");
  await expect(page.getByRole("heading", { name: "Mes dossiers" })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Nouveau dossier" })).toBeVisible();
  await expect(page.getByPlaceholder(/Demander à ORION/)).toBeVisible();
  await page.getByRole("button", { name: "+ Nouveau dossier" }).click();
  await expect(page.getByPlaceholder("Ex. Dois-je lancer ce produit ?")).toBeVisible();
});
