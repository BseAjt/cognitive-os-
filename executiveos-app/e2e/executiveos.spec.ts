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
  await expect(page.getByRole("button", { name: /03.*Analyse & décision/ })).toBeVisible();
  await page.getByRole("button", { name: /03.*Analyse & décision/ }).click();
  await expect(page.getByRole("heading", { name: "Raisonner, comparer et arbitrer" })).toBeVisible();
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

test("opens organization settings and collaboration controls", async ({ page, isMobile }) => {
  test.skip(isMobile, "The desktop navigation is intentionally hidden on mobile.");
  await page.getByRole("button", { name: "Paramètres" }).click();
  await expect(page.getByRole("heading", { name: "Centre de contrôle" })).toBeVisible();
  await expect(page.getByText("Profil d’organisation", { exact: true })).toBeVisible();
  await expect(page.getByLabel("E-mail du collaborateur")).toBeVisible();
  await expect(page.getByRole("button", { name: "Inviter" })).toBeVisible();
  await expect(page.getByText("Données & continuité")).toBeVisible();
});

test("exports the complete workspace from product controls", async ({ page, isMobile }) => {
  test.skip(isMobile, "The desktop navigation is intentionally hidden on mobile.");
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
});
