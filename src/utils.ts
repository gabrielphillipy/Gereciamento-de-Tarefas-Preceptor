// ─── Utilitários ─────────────────────────────────────────────

import type {
  Attachment,
  Comment,
  Kind,
  MeetingGoal,
  Recurrence,
  Role,
  Status,
  User,
  WorkForm,
  WorkItem,
} from "./types";
import { kindLabel, priorityLabel, statusLabel, today } from "./constants";

// ─── Mapeamento DB → TS ──────────────────────────────────────

export function mapItem(row: Record<string, unknown>): WorkItem {
  return {
    id: row.id as number,
    title: row.title as string,
    ownerId: row.owner_id as string,
    kind: row.kind as Kind,
    status: row.status as Status,
    date: row.date as string,
    time: row.time as string,
    priority: row.priority as WorkItem["priority"],
    project: (row.project as string) ?? "",
    notes: (row.notes as string) ?? "",
    targetTeam: (row.target_team as string) ?? "",
    meetingSummary: (row.meeting_summary as string) ?? "",
    meetingGoals: Array.isArray(row.meeting_goals)
      ? (row.meeting_goals as MeetingGoal[])
      : [],
    recurrence: ((row.recurrence as Recurrence) ?? "none") as Recurrence,
    attachments: Array.isArray(row.attachments)
      ? (row.attachments as Attachment[])
      : [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapComment(row: Record<string, unknown>): Comment {
  return {
    id: row.id as number,
    workItemId: row.work_item_id as number,
    authorId: row.author_id as string,
    body: row.body as string,
    createdAt: row.created_at as string,
  };
}

export function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    role: row.role as Role,
    team: (row.team as string) ?? "",
  };
}

export function makeEmptyForm(firstColabId = ""): WorkForm {
  return {
    title: "",
    ownerId: firstColabId,
    kind: "tarefa",
    date: today,
    time: "09:00",
    priority: "Media",
    project: "",
    notes: "",
    targetTeam: "",
    meetingSummary: "",
    meetingGoals: [],
    recurrence: "none",
    attachments: [],
  };
}

// ─── Datas ───────────────────────────────────────────────────

export function formatDate(date: string, short = false) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: short ? "short" : "2-digit",
    year: short ? undefined : "numeric",
  });
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFull(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00`);
  result.setDate(result.getDate() + days);
  return toDateInputValue(result);
}

export function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setDate(result.getDate() - result.getDay());
  result.setHours(0, 0, 0, 0);
  return result;
}

export function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const value = toDateInputValue(date);
    return { date: value, label: String(date.getDate()), month: date.getMonth() };
  });
}

// ─── Demandas ────────────────────────────────────────────────

export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function isOverdue(item: WorkItem) {
  return item.status !== "concluida" && item.date < today;
}

// Encontra a reunião anterior do mesmo responsável (a mais recente
// antes desta, em data+hora). Retorna undefined se não houver.
export function findPreviousMeeting(items: WorkItem[], meeting: WorkItem) {
  const key = `${meeting.date}${meeting.time}`;
  return items
    .filter(
      (item) =>
        item.kind === "reuniao" &&
        item.ownerId === meeting.ownerId &&
        item.id !== meeting.id &&
        `${item.date}${item.time}` < key,
    )
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0];
}

// Gera as datas (ISO) de uma série recorrente a partir de uma data base.
export function generateRecurrenceDates(
  startDate: string,
  recurrence: Recurrence,
  count: number,
): string[] {
  if (recurrence === "none" || count <= 1) return [startDate];
  const base = new Date(`${startDate}T00:00:00`);
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    if (recurrence === "diaria") d.setDate(base.getDate() + i);
    else if (recurrence === "semanal") d.setDate(base.getDate() + i * 7);
    else if (recurrence === "mensal") d.setMonth(base.getMonth() + i);
    dates.push(toDateInputValue(d));
  }
  return dates;
}

// Formata bytes em KB/MB para exibir tamanho de anexos.
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Identificador estável para metas (uuid quando disponível).
export function newGoalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function groupItemsByDate(items: WorkItem[]) {
  return items.reduce<Record<string, WorkItem[]>>((acc, item) => {
    acc[item.date] = [...(acc[item.date] ?? []), item].sort((a, b) =>
      a.time.localeCompare(b.time),
    );
    return acc;
  }, {});
}

export function exportCsv(items: WorkItem[], users: User[]) {
  const headers = [
    "Titulo",
    "Responsavel",
    "Tipo",
    "Status",
    "Prioridade",
    "Data",
    "Hora",
    "Projeto",
    "Observacoes",
  ];
  const rows = items.map((item) => {
    const owner = users.find((u) => u.id === item.ownerId)?.name ?? "";
    return [
      item.title,
      owner,
      kindLabel[item.kind],
      statusLabel[item.status],
      priorityLabel[item.priority],
      item.date,
      item.time,
      item.project,
      item.notes,
    ];
  });
  const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `preceptor-tasks-${today}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
