# Preceptor Tasks

Aplicação web de gestão de tarefas, agenda e entregas para a equipe da Preceptor.
Gestores criam e distribuem demandas; colaboradores acompanham e atualizam o
status — tudo sincronizado em tempo real.

## Funcionalidades

- Autenticação (login, cadastro e recuperação de senha) via Supabase
- Calendário com visões de **dia, semana, mês e ano**
- Quadro Kanban com arrastar e soltar
- Métricas clicáveis (planejadas, em andamento, concluídas, atrasadas)
- Páginas de equipe, indicadores e administração de usuários
- Sincronização em tempo real entre usuários
- Exportação das demandas em CSV
- Editor de reuniões com cobrança das metas da reunião anterior
- Tarefas recorrentes (diária, semanal, mensal)
- Anexos de arquivos (bucket privado no Supabase Storage)
- Comentários em qualquer demanda
- Notificações de prazos próximos
- **Modo claro e escuro** (segue a preferência do sistema)

## Stack

- React 19 + TypeScript
- Vite
- Supabase (autenticação + banco de dados Postgres)
- Playwright (testes end-to-end)

## Pré-requisitos

- Node.js 20 ou superior
- Uma conta e um projeto no [Supabase](https://supabase.com)

## Configuração

```bash
# 1. Instalar as dependências
npm install

# 2. Criar o arquivo de variáveis de ambiente
cp .env.example .env
# edite o .env e preencha as credenciais do Supabase

# 3. Criar as tabelas no banco
# execute o conteúdo de supabase/schema.sql no SQL Editor do Supabase

# 4. Rodar em desenvolvimento
npm run dev
```

## Variáveis de ambiente

| Variável            | Descrição                              |
| ------------------- | -------------------------------------- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase                |
| `VITE_SUPABASE_KEY` | Chave pública (anon key) do projeto    |

Encontradas em **Supabase → Project Settings → API**.

## Scripts

| Comando                | Descrição                              |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento            |
| `npm run build`        | Checagem de tipos + build de produção  |
| `npm run preview`      | Pré-visualiza o build de produção      |
| `npm run lint`         | Analisa o código com ESLint            |
| `npm run typecheck`    | Verifica os tipos com `tsc`            |
| `npm run format`       | Formata o código com Prettier          |
| `npm run test:e2e`     | Roda os testes end-to-end (Playwright) |

## Estrutura

```
src/
  main.tsx           Entrada do app (tema inicial + montagem)
  styles.css         Estilos (design system Aurora) + overrides do modo escuro
  supabase.ts        Cliente do Supabase
  theme.ts           Persistência de tema claro/escuro
  types.ts           Tipos compartilhados
  utils.ts           Helpers de data, CSV, anexos
  constants.ts       Labels (status, kind, prioridade, recorrência)
  hooks/             Hooks (useTheme, usePreceptorData)
  components/        Componentes (Dashboard, Login, CalendarView,
                     KanbanBoard, ItemsModal, MeetingEditor,
                     AttachmentsField, CommentsModal, ThemeToggle, ...)
supabase/
  schema.sql         Definição das tabelas, RLS, triggers e bucket
tests/               Testes end-to-end (calendar, kanban, login)
public/              Arquivos estáticos (favicon, manifest, logos)
.github/workflows/   CI: lint, typecheck e build
```

## Deploy

O projeto está preparado para deploy na Vercel:

1. Importe o repositório na Vercel.
2. Configure as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY`.
3. O build roda `npm run build` e a saída fica em `dist/`.

## Integração contínua

A cada push e pull request na branch `main`, o GitHub Actions roda lint,
checagem de tipos e build — ver `.github/workflows/ci.yml`.
