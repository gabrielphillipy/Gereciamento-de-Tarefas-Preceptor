import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  KanbanSquare,
  LogOut,
  Megaphone,
  Plus,
  Save,
  Search,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { supabase } from "../supabase";
import type {
  CalendarPeriod,
  Kind,
  MetricKey,
  NavSection,
  Recurrence,
  Status,
  User,
  ViewMode,
  WorkForm,
  WorkItem,
} from "../types";
import { recurrenceLabel, statusLabel, today } from "../constants";
import {
  formatFull,
  generateRecurrenceDates,
  initials,
  isOverdue,
  makeEmptyForm,
} from "../utils";
import { AttachmentsField } from "./AttachmentsField";
import { CalendarView } from "./CalendarView";
import { CommentsModal } from "./CommentsModal";
import { IndicatorsPage } from "./IndicatorsPage";
import { ItemsModal } from "./ItemsModal";
import { KanbanBoard } from "./KanbanBoard";
import { MeetingEditor, type MeetingPatch } from "./MeetingEditor";
import { Metric } from "./Metric";
import { NotificationCenter } from "./NotificationCenter";
import { TeamPage } from "./TeamPage";
import { Toast } from "./Toast";
import { UsersAdminPage } from "./UsersAdminPage";

export function Dashboard({
  currentUser,
  allUsers,
  items,
  onRefresh,
  onRefreshUsers,
  onLogout,
}: {
  currentUser: User;
  allUsers: User[];
  items: WorkItem[];
  onRefresh: () => Promise<void>;
  onRefreshUsers: () => Promise<void>;
  onLogout: () => void;
}) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("agenda");
  const [activeNav, setActiveNav] = useState<NavSection>("agenda");
  const [statusFilter, setStatusFilter] = useState<Status | "todos">("todos");
  const [ownerFilter, setOwnerFilter] = useState("todos");
  const [kindFilter, setKindFilter] = useState<Kind | "todos">("todos");
  const [teamFilter, setTeamFilter] = useState("todos");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [calPeriod, setCalPeriod] = useState<CalendarPeriod>("mes");
  const [dayModal, setDayModal] = useState<string | null>(null);
  const [metricModal, setMetricModal] = useState<MetricKey | null>(null);
  const [meetingId, setMeetingId] = useState<number | null>(null);
  const [commentsItemId, setCommentsItemId] = useState<number | null>(null);
  const [recurrenceCount, setRecurrenceCount] = useState(4);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);

  const colaboradores = allUsers.filter((u) => u.role === "colaborador");
  const firstColabId = colaboradores[0]?.id ?? "";
  const [form, setForm] = useState<WorkForm>(() => makeEmptyForm(firstColabId));

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  function showToast(message: string, tone: "error" | "success") {
    setToast({ message, tone });
  }

  // Cargos disponíveis (derivados das equipes cadastradas nos perfis).
  const teamOptions = useMemo(
    () => Array.from(new Set(allUsers.map((u) => u.team).filter(Boolean))).sort(),
    [allUsers],
  );

  // Regra de visibilidade:
  //  - gestor vê tudo;
  //  - colaborador vê o que é dele, as demandas gerais (sem equipe alvo)
  //    e as direcionadas à equipe dele.
  const myItems = useMemo(
    () =>
      items.filter((item) => {
        if (currentUser.role === "gestor") return true;
        if (item.ownerId === currentUser.id) return true;
        if (!item.targetTeam) return true;
        return item.targetTeam === currentUser.team;
      }),
    [items, currentUser],
  );

  const visibleItems = useMemo(() => {
    return items
      .filter((item) => {
        if (currentUser.role === "gestor") return true;
        if (item.ownerId === currentUser.id) return true;
        if (!item.targetTeam) return true;
        return item.targetTeam === currentUser.team;
      })
      .filter((item) => statusFilter === "todos" || item.status === statusFilter)
      .filter((item) => ownerFilter === "todos" || item.ownerId === ownerFilter)
      .filter((item) => kindFilter === "todos" || item.kind === kindFilter)
      .filter((item) => {
        if (teamFilter === "todos") return true;
        if (teamFilter === "geral") return !item.targetTeam;
        return item.targetTeam === teamFilter;
      })
      .filter((item) => {
        const owner = allUsers.find((u) => u.id === item.ownerId)?.name ?? "";
        const text =
          `${item.title} ${item.project} ${item.notes} ${owner}`.toLowerCase();
        return text.includes(query.toLowerCase());
      })
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [
    currentUser,
    items,
    allUsers,
    kindFilter,
    ownerFilter,
    query,
    statusFilter,
    teamFilter,
  ]);

  const metrics = {
    total: visibleItems.length,
    pending: visibleItems.filter((item) => item.status !== "concluida").length,
    overdue: visibleItems.filter((item) => isOverdue(item)).length,
    deliveries: visibleItems.filter((item) => item.kind === "entrega").length,
  };

  const metricBuckets: Record<MetricKey, WorkItem[]> = {
    planejada: visibleItems.filter((item) => item.status === "planejada"),
    "em-andamento": visibleItems.filter((item) => item.status === "em-andamento"),
    concluida: visibleItems.filter((item) => item.status === "concluida"),
    atrasada: visibleItems.filter((item) => isOverdue(item)),
  };

  const metricLabel: Record<MetricKey, string> = {
    planejada: "Planejadas",
    "em-andamento": "Em andamento",
    concluida: "Concluídas",
    atrasada: "Atrasadas",
  };

  const visibleTeamUsers = colaboradores.filter((user) => {
    if (currentUser.role === "colaborador" && user.id !== currentUser.id)
      return false;
    if (ownerFilter !== "todos" && user.id !== ownerFilter) return false;
    const hasVisibleItems = visibleItems.some((item) => item.ownerId === user.id);
    const queryMatchesUser = `${user.name} ${user.team}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return query.trim()
      ? hasVisibleItems || queryMatchesUser
      : ownerFilter !== "todos" || hasVisibleItems;
  });

  const teamStats = visibleTeamUsers.map((user) => {
    const assigned = visibleItems.filter((item) => item.ownerId === user.id);
    return {
      user,
      total: assigned.length,
      pending: assigned.filter((item) => item.status !== "concluida").length,
      overdue: assigned.filter((item) => isOverdue(item)).length,
      done: assigned.filter((item) => item.status === "concluida").length,
    };
  });

  const statusStats = (Object.keys(statusLabel) as Status[]).map((status) => ({
    status,
    total: visibleItems.filter((item) => item.status === status).length,
  }));

  const selectedMeeting =
    meetingId !== null
      ? (items.find((item) => item.id === meetingId) ?? null)
      : null;

  const selectedCommentItem =
    commentsItemId !== null
      ? (items.find((item) => item.id === commentsItemId) ?? null)
      : null;

  function resetForm() {
    setForm(makeEmptyForm(firstColabId));
    setRecurrenceCount(4);
    setEditingId(null);
    setComposerOpen(false);
  }

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const timestamp = new Date().toISOString();
    const basePayload = {
      title: form.title,
      owner_id: form.ownerId,
      kind: form.kind,
      time: form.time,
      priority: form.priority,
      project: form.project,
      notes: form.notes,
      target_team: form.targetTeam,
      meeting_summary: form.meetingSummary,
      meeting_goals: form.meetingGoals,
      recurrence: form.recurrence,
      attachments: form.attachments,
      updated_at: timestamp,
    };

    let error: { message: string } | null = null;
    let createdCount = 1;

    if (editingId) {
      const res = await supabase
        .from("work_items")
        .update({ ...basePayload, date: form.date, status: form.status })
        .eq("id", editingId);
      error = res.error;
    } else {
      const dates = generateRecurrenceDates(
        form.date,
        form.recurrence,
        Math.max(1, Math.min(52, recurrenceCount)),
      );
      const rows = dates.map((date) => ({
        ...basePayload,
        date,
        status: "planejada",
        created_at: timestamp,
      }));
      createdCount = rows.length;
      const res = await supabase.from("work_items").insert(rows);
      error = res.error;
    }

    setSaving(false);

    if (error) {
      console.error("saveItem:", error);
      showToast(`Não foi possível salvar a demanda: ${error.message}`, "error");
      return;
    }

    await onRefresh();
    showToast(
      editingId
        ? "Demanda atualizada."
        : createdCount > 1
          ? `${createdCount} demandas criadas.`
          : "Demanda criada.",
      "success",
    );
    resetForm();
  }

  async function updateStatus(id: number, status: Status) {
    const { error } = await supabase
      .from("work_items")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error("updateStatus:", error);
      showToast(`Não foi possível atualizar o status: ${error.message}`, "error");
      return;
    }
    await onRefresh();
  }

  function editItem(item: WorkItem) {
    setEditingId(item.id);
    setComposerOpen(true);
    setForm({
      title: item.title,
      ownerId: item.ownerId,
      kind: item.kind,
      date: item.date,
      time: item.time,
      priority: item.priority,
      project: item.project,
      notes: item.notes,
      targetTeam: item.targetTeam,
      meetingSummary: item.meetingSummary,
      meetingGoals: item.meetingGoals,
      recurrence: item.recurrence,
      attachments: item.attachments,
      status: item.status,
    });
  }

  async function deleteItem(id: number) {
    const item = items.find((current) => current.id === id);
    if (!item) return;
    if (!window.confirm(`Excluir a demanda "${item.title}"?`)) return;
    const { error } = await supabase.from("work_items").delete().eq("id", id);
    if (error) {
      console.error("deleteItem:", error);
      showToast(`Não foi possível excluir a demanda: ${error.message}`, "error");
      return;
    }
    await onRefresh();
    showToast("Demanda excluída.", "success");
    if (editingId === id) resetForm();
  }

  async function saveMeeting(id: number, patch: MeetingPatch) {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.meetingSummary !== undefined) {
      payload.meeting_summary = patch.meetingSummary;
    }
    if (patch.meetingGoals !== undefined) {
      payload.meeting_goals = patch.meetingGoals;
    }
    const { error } = await supabase
      .from("work_items")
      .update(payload)
      .eq("id", id);
    if (error) {
      console.error("saveMeeting:", error);
      throw new Error(error.message);
    }
    await onRefresh();
  }

  function navigate(section: NavSection) {
    setActiveNav(section);
    if (section === "agenda" || section === "kanban") setViewMode(section);
  }

  function startNewDemand() {
    setEditingId(null);
    setForm(makeEmptyForm(firstColabId));
    setComposerOpen(true);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="side-brand">
          <div className="brand-icon">
            <span>P!</span>
          </div>
          <div>
            Preceptor
            <small>Operations Hub</small>
          </div>
        </div>
        <nav>
          <p className="nav-group">Operação</p>
          <button
            className={activeNav === "agenda" ? "active" : ""}
            onClick={() => navigate("agenda")}
          >
            <CalendarDays size={18} />
            Agenda
          </button>
          <button
            className={activeNav === "kanban" ? "active" : ""}
            onClick={() => navigate("kanban")}
          >
            <KanbanSquare size={18} />
            Kanban
          </button>
          <p className="nav-group">Gestão</p>
          <button
            className={activeNav === "equipe" ? "active" : ""}
            onClick={() => navigate("equipe")}
          >
            <UsersRound size={18} />
            Equipe
          </button>
          <button
            className={activeNav === "indicadores" ? "active" : ""}
            onClick={() => navigate("indicadores")}
          >
            <BarChart3 size={18} />
            Indicadores
          </button>
          {currentUser.role === "gestor" ? (
            <button
              className={activeNav === "usuarios" ? "active" : ""}
              onClick={() => navigate("usuarios")}
            >
              <ShieldCheck size={18} />
              Usuários
            </button>
          ) : null}
        </nav>
        <div className="side-footer">
          <div className="side-user">
            <div className="side-avatar">{initials(currentUser.name)}</div>
            <div>
              <strong>{currentUser.name}</strong>
              <small>{currentUser.role}</small>
            </div>
          </div>
          <button className="ghost-button" onClick={onLogout}>
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-head">
            <p className="eyebrow">Painel {currentUser.role}</p>
            <h2>Central de operação</h2>
            <p className="topbar-subtitle">
              Priorize demandas, acompanhe prazos e mantenha a equipe alinhada.
            </p>
          </div>
          <div className="topbar-tools">
            <div className="search-box">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar demanda, projeto ou responsável"
              />
            </div>
            <NotificationCenter items={myItems} />
            {currentUser.role === "gestor" ? (
              <button className="primary-button" onClick={startNewDemand}>
                <Plus size={18} />
                Nova demanda
              </button>
            ) : null}
          </div>
        </header>

        <section className="metrics">
          <Metric
            icon={<CalendarDays />}
            label="Planejadas"
            value={metricBuckets.planejada.length}
            caption="Ver lista"
            ratio={metrics.total ? metricBuckets.planejada.length / metrics.total : 0}
            onClick={() => setMetricModal("planejada")}
          />
          <Metric
            icon={<Clock3 />}
            label="Em andamento"
            value={metricBuckets["em-andamento"].length}
            caption="Ver lista"
            ratio={
              metrics.total ? metricBuckets["em-andamento"].length / metrics.total : 0
            }
            tone="amber"
            onClick={() => setMetricModal("em-andamento")}
          />
          <Metric
            icon={<CheckCircle2 />}
            label="Concluídas"
            value={metricBuckets.concluida.length}
            caption="Ver lista"
            ratio={metrics.total ? metricBuckets.concluida.length / metrics.total : 0}
            tone="green"
            onClick={() => setMetricModal("concluida")}
          />
          <Metric
            icon={<Megaphone />}
            label="Atrasadas"
            value={metricBuckets.atrasada.length}
            caption="Ver lista"
            ratio={metrics.total ? metricBuckets.atrasada.length / metrics.total : 0}
            tone="coral"
            onClick={() => setMetricModal("atrasada")}
          />
        </section>

        <section className="toolbar">
          <div className="view-toggle" aria-label="Alternar visualizacao">
            <button
              className={viewMode === "agenda" ? "selected" : ""}
              onClick={() => navigate("agenda")}
            >
              <CalendarDays size={17} />
              Agenda
            </button>
            <button
              className={viewMode === "kanban" ? "selected" : ""}
              onClick={() => navigate("kanban")}
            >
              <KanbanSquare size={17} />
              Kanban
            </button>
          </div>
          <div className="filters">
            <select
              aria-label="Filtro de status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as Status | "todos")
              }
            >
              <option value="todos">Todos os status</option>
              <option value="planejada">Planejada</option>
              <option value="em-andamento">Em andamento</option>
              <option value="revisao">Revisão</option>
              <option value="concluida">Concluída</option>
            </select>
            <select
              aria-label="Filtro de tipo"
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value as Kind | "todos")}
            >
              <option value="todos">Todos os tipos</option>
              <option value="tarefa">Tarefa</option>
              <option value="reuniao">Reunião</option>
              <option value="entrega">Entrega</option>
            </select>
            <select
              aria-label="Filtro de cargo"
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
            >
              <option value="todos">Todos os cargos</option>
              <option value="geral">Geral (sem restrição)</option>
              {teamOptions.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            {currentUser.role === "gestor" ? (
              <select
                aria-label="Filtro de responsavel"
                value={ownerFilter}
                onChange={(event) => setOwnerFilter(event.target.value)}
              >
                <option value="todos">Todos os responsáveis</option>
                {colaboradores.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </section>

        {activeNav === "equipe" ? (
          <TeamPage
            stats={teamStats}
            items={visibleItems}
            onOpenMeeting={(id) => setMeetingId(id)}
          />
        ) : activeNav === "indicadores" ? (
          <IndicatorsPage
            metrics={metrics}
            statusStats={statusStats}
            visibleItems={visibleItems}
            allUsers={allUsers}
          />
        ) : activeNav === "usuarios" && currentUser.role === "gestor" ? (
          <UsersAdminPage
            users={allUsers}
            currentUser={currentUser}
            onRefreshUsers={onRefreshUsers}
          />
        ) : (
          <section className="main-grid">
            <div className="agenda-panel" id={viewMode}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    {viewMode === "agenda" ? "Agenda" : "Kanban"}
                  </p>
                  <h3>
                    {viewMode === "agenda"
                      ? "Calendário de compromissos"
                      : "Fluxo de trabalho"}
                  </h3>
                </div>
                <span className="save-hint">Salvo no banco de dados</span>
              </div>

              {viewMode === "agenda" ? (
                <CalendarView
                  items={visibleItems}
                  allUsers={allUsers}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  currentUser={currentUser}
                  onStatusChange={updateStatus}
                  onEdit={editItem}
                  onDelete={deleteItem}
                  onOpenComments={(id) => setCommentsItemId(id)}
                  period={calPeriod}
                  onPeriodChange={setCalPeriod}
                  onOpenDay={setDayModal}
                />
              ) : visibleItems.length === 0 ? (
                <div className="empty-state">
                  <strong>Nenhuma demanda encontrada</strong>
                  <p>Ajuste os filtros ou crie uma nova atividade para a equipe.</p>
                </div>
              ) : (
                <KanbanBoard
                  items={visibleItems}
                  allUsers={allUsers}
                  currentUser={currentUser}
                  onStatusChange={updateStatus}
                  onEdit={editItem}
                  onDelete={deleteItem}
                  onOpenComments={(id) => setCommentsItemId(id)}
                />
              )}
            </div>
          </section>
        )}

        {composerOpen && currentUser.role === "gestor" ? (
          <div className="drawer-backdrop" role="presentation">
            <form
              className="task-drawer"
              onSubmit={saveItem}
              aria-label="Formulario de demanda"
            >
              <div className="drawer-header">
                <div>
                  <p className="eyebrow">{editingId ? "Edição" : "Nova demanda"}</p>
                  <h3>{editingId ? "Editar demanda" : "Planejar atividade"}</h3>
                </div>
                <button
                  className="ghost-button icon-button"
                  type="button"
                  onClick={resetForm}
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
              <label>
                Título
                <input
                  required
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="Nome da tarefa"
                />
              </label>
              <label>
                Responsável
                <select
                  value={form.ownerId}
                  onChange={(event) =>
                    setForm({ ...form, ownerId: event.target.value })
                  }
                >
                  {colaboradores.length === 0 ? (
                    <option value="">Nenhum colaborador cadastrado</option>
                  ) : (
                    colaboradores.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                        {user.team ? ` — ${user.team}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label>
                Equipe alvo (opcional)
                <input
                  list="team-options"
                  value={form.targetTeam}
                  onChange={(event) =>
                    setForm({ ...form, targetTeam: event.target.value })
                  }
                  placeholder="Vazio = visível a todos"
                />
                <datalist id="team-options">
                  {teamOptions.map((team) => (
                    <option key={team} value={team} />
                  ))}
                </datalist>
              </label>
              <div className="form-pair">
                <label>
                  Tipo
                  <select
                    value={form.kind}
                    onChange={(event) =>
                      setForm({ ...form, kind: event.target.value as Kind })
                    }
                  >
                    <option value="tarefa">Tarefa</option>
                    <option value="reuniao">Reunião</option>
                    <option value="entrega">Entrega</option>
                  </select>
                </label>
                <label>
                  Prioridade
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priority: event.target.value as WorkItem["priority"],
                      })
                    }
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Media">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </label>
              </div>
              {editingId ? (
                <label>
                  Status
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value as Status })
                    }
                  >
                    <option value="planejada">Planejada</option>
                    <option value="em-andamento">Em andamento</option>
                    <option value="revisao">Revisão</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </label>
              ) : null}
              <div className="form-pair">
                <label>
                  Data
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm({ ...form, date: event.target.value })}
                  />
                </label>
                <label>
                  Hora
                  <input
                    required
                    type="time"
                    value={form.time}
                    onChange={(event) => setForm({ ...form, time: event.target.value })}
                  />
                </label>
              </div>
              <div className="form-pair">
                <label>
                  Repetir
                  <select
                    value={form.recurrence}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        recurrence: event.target.value as Recurrence,
                      })
                    }
                  >
                    <option value="none">{recurrenceLabel.none}</option>
                    <option value="diaria">{recurrenceLabel.diaria}</option>
                    <option value="semanal">{recurrenceLabel.semanal}</option>
                    <option value="mensal">{recurrenceLabel.mensal}</option>
                  </select>
                </label>
                {!editingId && form.recurrence !== "none" ? (
                  <label>
                    Repetir por (vezes)
                    <input
                      type="number"
                      min={2}
                      max={52}
                      value={recurrenceCount}
                      onChange={(event) =>
                        setRecurrenceCount(
                          Math.max(2, Math.min(52, Number(event.target.value) || 2)),
                        )
                      }
                    />
                  </label>
                ) : (
                  <div />
                )}
              </div>
              <label>
                Projeto
                <input
                  value={form.project}
                  onChange={(event) =>
                    setForm({ ...form, project: event.target.value })
                  }
                  placeholder="Ex: Campanha institucional"
                />
              </label>
              <label>
                Observações
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Contexto, briefing ou link"
                />
              </label>
              <AttachmentsField
                attachments={form.attachments}
                onChange={(next) => setForm({ ...form, attachments: next })}
                userId={currentUser.id}
              />
              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={saving}>
                  <Save size={18} />
                  {saving
                    ? "Salvando..."
                    : editingId
                      ? "Salvar alterações"
                      : "Criar demanda"}
                </button>
                <button className="ghost-button" type="button" onClick={resetForm}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </section>

      {dayModal ? (
        <ItemsModal
          subtitle="Compromissos do dia"
          title={formatFull(dayModal)}
          items={visibleItems.filter((item) => item.date === dayModal)}
          allUsers={allUsers}
          currentUser={currentUser}
          onStatusChange={updateStatus}
          onEdit={(item) => {
            setDayModal(null);
            editItem(item);
          }}
          onDelete={deleteItem}
          onOpenComments={(id) => {
            setDayModal(null);
            setCommentsItemId(id);
          }}
          onClose={() => setDayModal(null)}
        />
      ) : null}

      {metricModal ? (
        <ItemsModal
          subtitle="Lista de tarefas"
          title={metricLabel[metricModal]}
          items={metricBuckets[metricModal]}
          allUsers={allUsers}
          currentUser={currentUser}
          onStatusChange={updateStatus}
          onEdit={(item) => {
            setMetricModal(null);
            editItem(item);
          }}
          onDelete={deleteItem}
          onOpenComments={(id) => {
            setMetricModal(null);
            setCommentsItemId(id);
          }}
          onClose={() => setMetricModal(null)}
        />
      ) : null}

      {selectedMeeting ? (
        <MeetingEditor
          meeting={selectedMeeting}
          items={items}
          allUsers={allUsers}
          onSave={saveMeeting}
          onClose={() => setMeetingId(null)}
        />
      ) : null}

      {selectedCommentItem ? (
        <CommentsModal
          item={selectedCommentItem}
          currentUser={currentUser}
          allUsers={allUsers}
          onClose={() => setCommentsItemId(null)}
        />
      ) : null}

      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </main>
  );
}
