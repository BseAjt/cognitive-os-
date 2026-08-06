import { expect, test } from "@playwright/test";

async function openCleanWorkspace(page: Parameters<typeof test>[0]["page"]) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Que souhaites-tu résoudre aujourd’hui ?" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await openCleanWorkspace(page);
});

test("loads the real workspace and initial cognitive state", async ({ page }) => {
  await expect(page.getByText("ExecutiveOS /", { exact: false })).toBeVisible();
  await expect(page.getByText("Bonjour Sébastien", { exact: false })).toBeVisible();
  await expect(page.getByText("DECISION LEDGER")).toBeVisible();
  await expect(page.getByText("OPEN ACTIONS")).toBeVisible();
  await expect(page.getByText("LIVE REASONING")).toBeVisible();
});

test("submits a decision through the real runtime and fills the ledger", async ({ page }) => {
  const input = page.getByPlaceholder("J’ai une idée…");
  await input.fill("Dois-je recruter un CTO maintenant ?");
  await page.getByRole("button", { name: "Analyser" }).click();

  await expect(page.getByText("Dois-je recruter un CTO maintenant ?", { exact: true })).toBeVisible();
  await expect(page.getByText("Décision cadrée", { exact: false })).toBeVisible();
  await expect(page.getByText("Dois-je recruter un CTO maintenant ?", { exact: true }).last()).toBeVisible();
  await expect(page.getByText(/decision ·/i)).toBeVisible();
});

test("extracts and persists an action", async ({ page }) => {
  const action = "Il faut appeler cinq clients avant vendredi";
  await page.getByPlaceholder("J’ai une idée…").fill(action);
  await page.getByRole("button", { name: "Analyser" }).click();

  await expect(page.getByText(action, { exact: true }).last()).toBeVisible();
  await expect(page.getByText("À assigner · todo")).toBeVisible();
  await expect(page.getByText(/action ·/i)).toBeVisible();
});

test("supports Enter submission and Shift+Enter multiline input", async ({ page }) => {
  const input = page.getByPlaceholder("J’ai une idée…");
  await input.fill("J’ai un problème de trésorerie");
  await input.press("Enter");
  await expect(page.getByText("J’ai un problème de trésorerie", { exact: true })).toBeVisible();

  await input.fill("Première ligne");
  await input.press("Shift+Enter");
  await input.type("Deuxième ligne");
  await expect(input).toHaveValue("Première ligne\nDeuxième ligne");
});

test("rejects an empty submission", async ({ page }) => {
  const before = await page.locator("[class*='justify-end']").count();
  await page.getByPlaceholder("J’ai une idée…").fill("   ");
  await page.getByRole("button", { name: "Analyser" }).click();
  await expect(page.locator("[class*='justify-end']")).toHaveCount(before);
});

test("quick prompts populate the composer", async ({ page }) => {
  await page.getByRole("button", { name: "Je dois prendre une décision" }).click();
  await expect(page.getByPlaceholder("J’ai une idée…")).toHaveValue("Je dois prendre une décision : ");
});

test("toggles the reasoning graph", async ({ page }) => {
  const graph = page.locator(".react-flow");
  await expect(graph).toBeVisible();
  await page.getByRole("button", { name: "Masquer le graphe" }).click();
  await expect(graph).toHaveCount(0);
  await page.getByRole("button", { name: "Afficher le graphe" }).click();
  await expect(page.locator(".react-flow")).toBeVisible();
});

test("applies the critical signal simulation", async ({ page }) => {
  await page.getByRole("button", { name: "Signal critique" }).click();
  await expect(page.getByText("41%", { exact: true })).toBeVisible();
  await expect(page.getByText("9/10", { exact: true })).toBeVisible();
  await expect(page.getByText("Les utilisateurs pilotes remettent en cause", { exact: false })).toBeVisible();
});

test("persists conversation state after reload", async ({ page }) => {
  const message = "J’ai une idée : créer une offre premium";
  await page.getByPlaceholder("J’ai une idée…").fill(message);
  await page.getByRole("button", { name: "Analyser" }).click();
  await expect(page.getByText(message, { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText(message, { exact: true })).toBeVisible();
});

test("clears the active challenge history after confirmation", async ({ page }) => {
  const message = "Texte libre à supprimer";
  await page.getByPlaceholder("J’ai une idée…").fill(message);
  await page.getByRole("button", { name: "Analyser" }).click();
  await expect(page.getByText(message, { exact: true })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Effacer l’historique" }).click();
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByText(message, { exact: true })).toHaveCount(0);
  await expect(page.getByText("Commence par", { exact: false })).toBeVisible();
});

test("keeps history when deletion is cancelled", async ({ page }) => {
  const message = "Conversation à conserver";
  await page.getByPlaceholder("J’ai une idée…").fill(message);
  await page.getByRole("button", { name: "Analyser" }).click();

  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Effacer l’historique" }).click();
  await expect(page.getByText(message, { exact: true })).toBeVisible();
});

test("switches challenges on desktop without leaking messages", async ({ page, isMobile }) => {
  test.skip(isMobile, "The challenge sidebar is intentionally hidden on mobile.");

  const message = "Message réservé au challenge ExecutiveOS";
  await page.getByPlaceholder("J’ai une idée…").fill(message);
  await page.getByRole("button", { name: "Analyser" }).click();
  await page.getByRole("button", { name: /Valider le positionnement/ }).click();

  await expect(page.getByText("ExecutiveOS / Valider le positionnement", { exact: true })).toBeVisible();
  await expect(page.getByText(message, { exact: true })).toHaveCount(0);
});

test("remains usable on a mobile viewport", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only journey.");

  await expect(page.getByPlaceholder("J’ai une idée…")).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyser" })).toBeVisible();
  await page.getByPlaceholder("J’ai une idée…").fill("J’ai un problème mobile");
  await page.getByRole("button", { name: "Analyser" }).click();
  await expect(page.getByText("J’ai un problème mobile", { exact: true })).toBeVisible();
});
