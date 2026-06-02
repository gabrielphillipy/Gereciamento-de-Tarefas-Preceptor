import { expect, test } from "@playwright/test";

// Testes do componente de calendário.
// Para rodar os testes de interação autenticada, configure:
//   TEST_EMAIL=usuario@empresa.com TEST_PASSWORD=senha npx playwright test calendar

const TEST_EMAIL = process.env.TEST_EMAIL ?? "";
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "";

// ─── Testes sem autenticação ──────────────────────────────────

test("login exibe campo de email com placeholder correto", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByPlaceholder("seu@email.com")).toBeVisible();
});

// ─── Testes autenticados ──────────────────────────────────────

test.describe("CalendarView (requer credenciais)", () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, "Configure TEST_EMAIL e TEST_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Senha").fill(TEST_PASSWORD);
    await page.locator('form[aria-label="Formulário de login"]').getByRole("button", { name: "Entrar" }).click();
    await page.waitForSelector(".app-shell", { timeout: 10_000 });

    // Garante que a visão Agenda está ativa
    await page.locator("nav").getByRole("button", { name: /Agenda/ }).click();
    await page.waitForSelector(".calendar-shell", { timeout: 5_000 });
  });

  test("exibe controles de período: Dia, Semana, Mês, Ano", async ({ page }) => {
    const periods = page.locator('[aria-label="Período do calendário"]');
    await expect(periods.getByRole("button", { name: "Dia" })).toBeVisible();
    await expect(periods.getByRole("button", { name: "Semana" })).toBeVisible();
    await expect(periods.getByRole("button", { name: "Mês" })).toBeVisible();
    await expect(periods.getByRole("button", { name: "Ano" })).toBeVisible();
  });

  test("alterna para visão de semana", async ({ page }) => {
    await page.locator('[aria-label="Período do calendário"]').getByRole("button", { name: "Semana" }).click();
    await expect(page.locator(".week-grid")).toBeVisible();
  });

  test("alterna para visão de dia", async ({ page }) => {
    await page.locator('[aria-label="Período do calendário"]').getByRole("button", { name: "Dia" }).click();
    await expect(page.locator(".day-view")).toBeVisible();
  });

  test("alterna para visão de ano", async ({ page }) => {
    await page.locator('[aria-label="Período do calendário"]').getByRole("button", { name: "Ano" }).click();
    await expect(page.locator(".year-grid")).toBeVisible();
  });

  test("botão Hoje navega para o mês atual", async ({ page }) => {
    // Avança um mês e volta com Hoje
    await page.getByTitle("Próximo").click();
    await page.getByRole("button", { name: "Hoje" }).click();

    const currentMonth = new Date().toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    await expect(page.locator(".cal-title")).toContainText(
      currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1),
    );
  });

  test("navegação para frente e para trás funciona", async ({ page }) => {
    const titleBefore = await page.locator(".cal-title").textContent();
    await page.getByTitle("Próximo").click();
    const titleAfter = await page.locator(".cal-title").textContent();
    expect(titleAfter).not.toBe(titleBefore);

    await page.getByTitle("Anterior").click();
    const titleRestored = await page.locator(".cal-title").textContent();
    expect(titleRestored).toBe(titleBefore);
  });

  test("visão mensal exibe grade com células de dias", async ({ page }) => {
    // Confirma que está na visão de mês
    await page.locator('[aria-label="Período do calendário"]').getByRole("button", { name: "Mês" }).click();
    const grid = page.locator(".calendar-grid");
    await expect(grid).toBeVisible();
    // Um mês tem entre 28 e 42 células
    const cells = grid.locator(".calendar-day");
    const count = await cells.count();
    expect(count).toBeGreaterThanOrEqual(28);
    expect(count).toBeLessThanOrEqual(42);
  });
});
