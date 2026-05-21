import { expect, test } from "@playwright/test";

// Testes da tela de autenticação — não dependem de credenciais
// reais do Supabase, apenas da renderização e validações locais.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("exibe a tela de login", async ({ page }) => {
  await expect(
    page.getByRole("heading", {
      name: "Gestão de tarefas, agenda e entregas da equipe",
    }),
  ).toBeVisible();

  const tabs = page.locator(".auth-tabs");
  await expect(tabs.getByRole("button", { name: "Entrar" })).toBeVisible();
  await expect(tabs.getByRole("button", { name: "Criar conta" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
});

test("alterna entre entrar e criar conta", async ({ page }) => {
  const tabs = page.locator(".auth-tabs");

  await tabs.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByLabel("Nome completo")).toBeVisible();
  await expect(page.getByLabel("Equipe")).toBeVisible();

  await tabs.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByLabel("Nome completo")).toHaveCount(0);
});

test("recuperar senha sem email mostra aviso", async ({ page }) => {
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await expect(
    page.getByText("Digite seu email no campo acima para receber o link."),
  ).toBeVisible();
});

test("login com credenciais inválidas mostra erro", async ({ page }) => {
  await page.getByLabel("Email").fill("ninguem@exemplo.com");
  await page.getByLabel("Senha").fill("senha-invalida");
  await page.locator("form").getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Email ou senha incorretos.")).toBeVisible();
});
