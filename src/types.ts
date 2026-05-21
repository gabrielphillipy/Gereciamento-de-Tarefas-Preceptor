// ─── Tipos compartilhados ────────────────────────────────────

export type Role = "gestor" | "colaborador";
export type Status = "planejada" | "em-andamento" | "revisao" | "concluida";
export type Kind = "tarefa" | "reuniao" | "entrega";
export type ViewMode = "agenda" | "kanban";
export type NavSection =
  | "agenda"
  | "kanban"
  | "equipe"
  | "indicadores"
  | "usuarios";
export type CalendarPeriod = "dia" | "semana" | "mes" | "ano";
export type MetricKey = "planejada" | "em-andamento" | "concluida" | "atrasada";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  team: string;
};

export type WorkItem = {
  id: number;
  title: string;
  ownerId: string;
  kind: Kind;
  status: Status;
  date: string;
  time: string;
  priority: "Baixa" | "Media" | "Alta";
  project: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkForm = Omit<
  WorkItem,
  "id" | "status" | "createdAt" | "updatedAt"
> & {
  status?: Status;
};
