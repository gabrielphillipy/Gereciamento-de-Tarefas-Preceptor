// ─── Constantes ──────────────────────────────────────────────

import type { Kind, Recurrence, Status, WorkItem } from "./types";

export const today = new Date().toISOString().slice(0, 10);

export const statusLabel: Record<Status, string> = {
  planejada: "Planejada",
  "em-andamento": "Em andamento",
  revisao: "Revisão",
  concluida: "Concluída",
};

export const kindLabel: Record<Kind, string> = {
  tarefa: "Tarefa",
  reuniao: "Reunião",
  entrega: "Entrega",
};

export const priorityLabel: Record<WorkItem["priority"], string> = {
  Baixa: "Baixa",
  Media: "Média",
  Alta: "Alta",
};

export const recurrenceLabel: Record<Recurrence, string> = {
  none: "Não repete",
  diaria: "Diária",
  semanal: "Semanal",
  mensal: "Mensal",
};
