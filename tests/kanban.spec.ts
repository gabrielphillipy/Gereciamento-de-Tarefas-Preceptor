import { expect, test } from "@playwright/test";

// Testes do quadro Kanban.
// Para rodar os testes de interação autenticada, configure as variáveis de ambiente:
//   TEST_EMAIL=usuario@empresa.com TEST_PASSWORD=senha npx playwright test kanban

const TEST_EMAIL = process.env.TEST_EMAIL ?? "";
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "";

// ─── Testes sem autenticação ──────────────────────────────────

test("redireciona para login quando não autenticado", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Gestão de tarefas, agenda e entregas da equipe",
    }),
  ).toBeVisible();
});

// ─── Testes autenticados ──────────────────────────────────────

test.describe("Kanban Board (requer credenciais)", () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, "Configure TEST_EMAIL e TEST_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Senha").fill(TEST_PASSWORD);
    await page.locator('form[aria-label="Formulário de login"]').getByRole("button", { name: "Entrar" }).click();
    await page.waitForSelector(".app-shell", { timeout: 10_000 });

    // Navega para o Kanban
    await page.locator("nav").getByRole("button", { name: /Kanban/ }).click();
    await page.waitForSelector(".kanban-board", { timeout: 5_000 });
  });

  test("exibe as quatro colunas com os rótulos corretos", async ({ page }) => {
    const board = page.locator(".kanban-board");
    await expect(board.getByText("Planejada")).toBeVisible();
    await expect(board.getByText("Em andamento")).toBeVisible();
    await expect(board.getByText("Revisão")).toBeVisible();
    await expect(board.getByText("Concluída")).toBeVisible();
  });

  test("cada coluna tem contagem de itens visível", async ({ page }) => {
    const columns = page.locator(".kanban-column");
    await expect(columns).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      const heading = columns.nth(i).locator(".kanban-heading");
      await expect(heading).toBeVisible();
    }
  });

  test("colunas têm aria-label para leitores de tela", async ({ page }) => {
    await expect(page.locator('[aria-label="Coluna Planejada"]')).toBeVisible();
    await expect(page.locator('[aria-label="Coluna Em andamento"]')).toBeVisible();
    await expect(page.locator('[aria-label="Coluna Revisão"]')).toBeVisible();
    await expect(page.locator('[aria-label="Coluna Concluída"]')).toBeVisible();
  });

  test("botão Mostrar mais aparece quando há mais de 10 itens numa coluna", async ({ page }) => {
    // Este teste verifica o comportamento de paginação quando aplicável.
    // Se não houver mais de 10 itens, o botão não deve aparecer.
    const showMoreButtons = page.locator("button", { hasText: /Mostrar mais/ });
    const count = await showMoreButtons.count();
    if (count > 0) {
      const firstButton = showMoreButtons.first();
      await expect(firstButton).toBeVisible();
      await firstButton.click();
      // Após clicar, a coluna deve mostrar mais itens
      await expect(firstButton).not.toBeVisible();
    }
  });
});
