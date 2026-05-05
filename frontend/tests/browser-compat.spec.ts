import { expect, test, type Page } from "@playwright/test";

function trackUnexpectedBrowserErrors(page: Page) {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on("response", (response) => {
    if (response.status() >= 500) {
      errors.push(`http ${response.status()}: ${response.url()}`);
    }
  });

  return () => {
    expect(errors).toEqual([]);
  };
}

async function loginAsGuest(page: Page) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Se connecter" })).toBeVisible();
  await page.getByRole("button", { name: "Continuer en invité" }).click();
  await page.waitForURL(/\/$/);
  await expect(page.getByText(/Guest-/i)).toBeVisible();
}

test.describe("browser compatibility", () => {
  test("public routes render across supported browsers", async ({ page }) => {
    const assertNoUnexpectedBrowserErrors = trackUnexpectedBrowserErrors(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Live Quiz pour/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Jouer maintenant" })).toBeVisible();

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Se connecter" })).toBeVisible();

    assertNoUnexpectedBrowserErrors();
  });

  test("guest can navigate authenticated surfaces and create a room", async ({ page }) => {
    const assertNoUnexpectedBrowserErrors = trackUnexpectedBrowserErrors(page);

    await loginAsGuest(page);
    await expect(page.getByRole("heading", { name: /Live Quiz pour/i })).toBeVisible();

    await page.getByRole("link", { name: "Leaderboard" }).click();
    await expect(page).toHaveURL(/\/leaderboard$/);
    await expect(
      page.getByRole("heading", {
        name: /Classement global, progression joueur et matchs récen/i,
      }),
    ).toBeVisible();

    await page.goto("/friends");
    await expect(
      page.getByRole("heading", { name: "Amis et invitations" }),
    ).toBeVisible();

    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { level: 2, name: /Historique récent/i }),
    ).toBeVisible();

    await page.goto("/quiz-ready");
    await expect(page.getByRole("heading", { name: /Tous les quiz live pour/i })).toBeVisible();

    const officialSection = page.locator("section").filter({ hasText: "Sélection officielle" }).first();
    await expect(officialSection.locator("button").first()).toBeVisible();
    await officialSection.locator("button").first().click();

    await expect(page.getByRole("heading", { name: "Créer une room" })).toBeVisible();
    await expect(page.getByText("10s", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Créer et jouer" }).click();

    await page.waitForURL(/\/room\/\d+$/);
    await expect(page.getByText("Pré-match")).toBeVisible();
    await expect(page.getByRole("button", { name: "Démarrer la partie" })).toBeVisible();
    await expect(page.getByText("10s", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Quitter la room" }).click();
    await page.waitForURL(/\/$/);

    assertNoUnexpectedBrowserErrors();
  });
});
