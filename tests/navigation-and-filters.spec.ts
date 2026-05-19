import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Central de operacao" })).toBeVisible();
});

test("filtro de responsavel atualiza a tela de equipe", async ({ page }) => {
  await page.getByLabel("Filtro de responsavel").selectOption("carla");
  await page.getByRole("navigation").getByRole("button", { name: "Equipe" }).click();
  const teamPanel = page.locator("#equipe");

  await expect(page.getByRole("heading", { name: "Capacidade e responsabilidades" })).toBeVisible();
  await expect(teamPanel.getByText("Carla Souza")).toBeVisible();
  await expect(teamPanel.getByText("Bruno Silva")).toHaveCount(0);
  await expect(teamPanel.getByText("Diego Lima")).toHaveCount(0);
  await expect(teamPanel.getByText("2 total")).toBeVisible();
});

test("agenda mostra calendario mensal com eventos", async ({ page }) => {
  await page.getByRole("navigation").getByRole("button", { name: "Agenda" }).click();
  const calendar = page.getByLabel("Calendario mensal");

  await expect(calendar).toBeVisible();
  await expect(page.getByText("maio de 2026")).toBeVisible();
  await expect(calendar.getByText("Ajustar calendario editorial do mes")).toBeVisible();
  await calendar.getByRole("button", { name: /20 Ajustar calendario editorial do mes/ }).click();
  await expect(page.getByRole("heading", { name: "Ajustar calendario editorial do mes" })).toBeVisible();
});

test("filtros alteram indicadores e kanban", async ({ page }) => {
  await page.getByLabel("Filtro de status").selectOption("revisao");
  await page.getByRole("navigation").getByRole("button", { name: "Indicadores" }).click();

  await expect(page.getByRole("heading", { name: "Resumo operacional" })).toBeVisible();
  await expect(page.getByText("1 demandas pendentes")).toBeVisible();
  await expect(page.getByText("0% concluidas")).toBeVisible();

  await page.getByRole("navigation").getByRole("button", { name: "Kanban" }).click();
  await expect(page.getByRole("heading", { name: "Fluxo de trabalho" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Entrega do relatorio de desempenho" })).toBeVisible();
  await expect(page.getByText("Ajustar calendario editorial do mes")).toHaveCount(0);
});
