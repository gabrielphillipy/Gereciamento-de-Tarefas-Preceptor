import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Edit3,
  KanbanSquare,
  LogOut,
  Megaphone,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { supabase } from "./supabase";
import "./styles.css";

// ─── Tipos ───────────────────────────────────────────────────

type Role = "gestor" | "colaborador";
type Status = "planejada" | "em-andamento" | "revisao" | "concluida";
type Kind = "tarefa" | "reuniao" | "entrega";
type ViewMode = "agenda" | "kanban";
type NavSection = "agenda" | "kanban" | "equipe" | "indicadores" | "usuarios";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  team: string;
};

type WorkItem = {
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

type WorkForm = Omit<WorkItem, "id" | "status" | "createdAt" | "updatedAt"> & {
  status?: Status;
};

// ─── Constantes ──────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);

const statusLabel: Record<Status, string> = {
  planejada: "Planejada",
  "em-andamento": "Em andamento",
  revisao: "Revisão",
  concluida: "Concluída",
};

const kindLabel: Record<Kind, string> = {
  tarefa: "Tarefa",
  reuniao: "Reunião",
  entrega: "Entrega",
};

const priorityLabel: Record<WorkItem["priority"], string> = {
  Baixa: "Baixa",
  Media: "Média",
  Alta: "Alta",
};

// ─── Helpers de mapeamento DB → TS ───────────────────────────

function mapItem(row: Record<string, unknown>): WorkItem {
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
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    role: row.role as Role,
    team: (row.team as string) ?? "",
  };
}

function makeEmptyForm(firstColabId = ""): WorkForm {
  return {
    title: "",
    ownerId: firstColabId,
    kind: "tarefa",
    date: today,
    time: "09:00",
    priority: "Media",
    project: "",
    notes: "",
  };
}

// ─── App ─────────────────────────────────────────────────────

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("work_items")
      .select("*")
      .order("date")
      .order("time");
    if (data) setItems(data.map(mapItem));
  }, []);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setAllUsers(data.map(mapUser));
  }, []);

  const loadUserAndData = useCallback(async (userId: string) => {
    setLoading(true);
    const [profileRes, usersRes, itemsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("profiles").select("*"),
      supabase.from("work_items").select("*").order("date").order("time"),
    ]);
    if (profileRes.data) setCurrentUser(mapUser(profileRes.data));
    if (usersRes.data) setAllUsers(usersRes.data.map(mapUser));
    if (itemsRes.data) setItems(itemsRes.data.map(mapItem));
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserAndData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        loadUserAndData(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setAllUsers([]);
        setItems([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserAndData]);

  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel("preceptor-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_items" },
        () => {
          fetchItems();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          fetchUsers();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, fetchItems, fetchUsers]);

  async function logout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="brand-mark">
          <span>P!</span>
        </div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Dashboard
      currentUser={currentUser}
      allUsers={allUsers}
      items={items}
      onRefresh={fetchItems}
      onRefreshUsers={fetchUsers}
      onLogout={logout}
    />
  );
}

// ─── Login / Cadastro ─────────────────────────────────────────

function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError("");
    setInfo("");
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) setError("Email ou senha incorretos.");
    setSubmitting(false);
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim(), team: team.trim() } },
    });

    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }

    if (!authData.session) {
      setInfo("Conta criada! Verifique seu email para confirmar e depois faça login.");
      switchMode("login");
    }

    setSubmitting(false);
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark">
          <span>P!</span>
        </div>
        <p className="eyebrow">Preceptor Tasks</p>
        <h1>Gestão de tarefas, agenda e entregas da equipe</h1>

        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === "login" ? " active" : ""}`}
            onClick={() => switchMode("login")}
            type="button"
          >
            Entrar
          </button>
          <button
            className={`auth-tab${mode === "register" ? " active" : ""}`}
            onClick={() => switchMode("register")}
            type="button"
          >
            Criar conta
          </button>
        </div>

        {info ? <p className="form-info">{info}</p> : null}

        {mode === "login" ? (
          <form className="login-form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                type="email"
                required
              />
            </label>
            <label>
              Senha
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="senha"
                type="password"
                required
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleRegister}>
            <label>
              Nome completo
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </label>
            <label>
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                type="email"
                required
              />
            </label>
            <label>
              Senha
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 6 caracteres"
                type="password"
                required
                minLength={6}
              />
            </label>
            <label>
              Equipe
              <input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="Ex: Marketing"
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Criando conta..." : "Criar conta"}
            </button>
          </form>
        )}
      </section>

      <section className="login-preview">
        <div className="preview-topline">
          <Sparkles size={18} />
          <span>Planejamento operacional</span>
        </div>
        <div className="preview-board">
          <div>
            <strong>Agenda sincronizada</strong>
            <p>Demandas salvas no banco de dados, acessíveis de qualquer dispositivo.</p>
          </div>
          <div>
            <strong>Kanban</strong>
            <p>Gestor e equipe acompanham status por etapa de trabalho.</p>
          </div>
          <div>
            <strong>Colaboração</strong>
            <p>Gestor cria e distribui tarefas. Equipe atualiza o progresso em tempo real.</p>
          </div>
        </div>
        <div className="preview-metrics">
          <span>4 status de fluxo</span>
          <span>Multiusuário</span>
          <span>Tempo real</span>
        </div>
      </section>
    </main>
  );
}

// ─── Dashboard ────────────────────────────────────────────────

function Dashboard({
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
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

  const visibleItems = useMemo(() => {
    return items
      .filter((item) =>
        currentUser.role === "gestor" ? true : item.ownerId === currentUser.id
      )
      .filter((item) => statusFilter === "todos" || item.status === statusFilter)
      .filter((item) => ownerFilter === "todos" || item.ownerId === ownerFilter)
      .filter((item) => kindFilter === "todos" || item.kind === kindFilter)
      .filter((item) => {
        const owner = allUsers.find((u) => u.id === item.ownerId)?.name ?? "";
        const text = `${item.title} ${item.project} ${item.notes} ${owner}`.toLowerCase();
        return text.includes(query.toLowerCase());
      })
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [currentUser, items, allUsers, kindFilter, ownerFilter, query, statusFilter]);

  const metrics = {
    total: visibleItems.length,
    pending: visibleItems.filter((item) => item.status !== "concluida").length,
    overdue: visibleItems.filter((item) => isOverdue(item)).length,
    deliveries: visibleItems.filter((item) => item.kind === "entrega").length,
  };

  const nextDue = visibleItems.filter((item) => item.status !== "concluida").slice(0, 3);

  const visibleTeamUsers = colaboradores.filter((user) => {
    if (currentUser.role === "colaborador" && user.id !== currentUser.id) return false;
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

  function resetForm() {
    setForm(makeEmptyForm(firstColabId));
    setEditingId(null);
    setComposerOpen(false);
  }

  async function saveItem(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const timestamp = new Date().toISOString();
    const payload = {
      title: form.title,
      owner_id: form.ownerId,
      kind: form.kind,
      date: form.date,
      time: form.time,
      priority: form.priority,
      project: form.project,
      notes: form.notes,
      updated_at: timestamp,
    };

    const { error } = editingId
      ? await supabase
          .from("work_items")
          .update({ ...payload, status: form.status })
          .eq("id", editingId)
      : await supabase
          .from("work_items")
          .insert({ ...payload, status: "planejada", created_at: timestamp });

    setSaving(false);

    if (error) {
      showToast("Não foi possível salvar a demanda. Tente novamente.", "error");
      return;
    }

    await onRefresh();
    showToast(editingId ? "Demanda atualizada." : "Demanda criada.", "success");
    resetForm();
  }

  async function updateStatus(id: number, status: Status) {
    const { error } = await supabase
      .from("work_items")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      showToast("Não foi possível atualizar o status.", "error");
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
      status: item.status,
    });
  }

  async function deleteItem(id: number) {
    const item = items.find((current) => current.id === id);
    if (!item) return;
    if (!window.confirm(`Excluir a demanda "${item.title}"?`)) return;
    const { error } = await supabase.from("work_items").delete().eq("id", id);
    if (error) {
      showToast("Não foi possível excluir a demanda.", "error");
      return;
    }
    await onRefresh();
    showToast("Demanda excluída.", "success");
    if (editingId === id) resetForm();
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
            label="Eventos no período"
            value={metrics.total}
            caption="Total"
            ratio={1}
          />
          <Metric
            icon={<Clock3 />}
            label="Demandas pendentes"
            value={metrics.pending}
            caption={
              metrics.total
                ? `${Math.round((metrics.pending / metrics.total) * 100)}% do total`
                : "—"
            }
            ratio={metrics.total ? metrics.pending / metrics.total : 0}
            tone="amber"
          />
          <Metric
            icon={<Megaphone />}
            label="Demandas atrasadas"
            value={metrics.overdue}
            caption={metrics.overdue ? "Requer atenção" : "Em dia"}
            ratio={metrics.total ? metrics.overdue / metrics.total : 0}
            tone="coral"
          />
          <Metric
            icon={<CheckCircle2 />}
            label="Entregas filtradas"
            value={metrics.deliveries}
            caption="Entregas"
            ratio={metrics.total ? metrics.deliveries / metrics.total : 0}
            tone="green"
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
              onChange={(event) => setStatusFilter(event.target.value as Status | "todos")}
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
          <TeamPage stats={teamStats} items={visibleItems} />
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
                  <p className="eyebrow">{viewMode === "agenda" ? "Agenda" : "Kanban"}</p>
                  <h3>
                    {viewMode === "agenda" ? "Próximos compromissos" : "Fluxo de trabalho"}
                  </h3>
                </div>
                <span className="save-hint">Salvo no banco de dados</span>
              </div>

              {visibleItems.length === 0 ? (
                <div className="empty-state">
                  <strong>Nenhuma demanda encontrada</strong>
                  <p>Ajuste os filtros ou crie uma nova atividade para a equipe.</p>
                </div>
              ) : viewMode === "agenda" ? (
                <CalendarView
                  items={visibleItems}
                  allUsers={allUsers}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  currentUser={currentUser}
                  onStatusChange={updateStatus}
                  onEdit={editItem}
                  onDelete={deleteItem}
                />
              ) : (
                <KanbanBoard
                  items={visibleItems}
                  allUsers={allUsers}
                  currentUser={currentUser}
                  onStatusChange={updateStatus}
                  onEdit={editItem}
                  onDelete={deleteItem}
                />
              )}
            </div>

            <div className="side-panel">
              {currentUser.role === "gestor" ? (
                <div className="team-panel action-panel">
                  <p className="eyebrow">Gestor</p>
                  <h3>Demandas</h3>
                  <p className="muted-text">
                    Crie tarefas, reuniões e entregas pelo botão principal.
                  </p>
                  <button className="primary-button" onClick={startNewDemand}>
                    <Plus size={18} />
                    Criar demanda
                  </button>
                </div>
              ) : (
                <div className="team-panel collaborator-note">
                  <p className="eyebrow">Colaborador</p>
                  <h3>Minha fila</h3>
                  <p>
                    Acompanhe suas tarefas, reuniões e entregas. Atualize o status quando avançar
                    para manter o gestor alinhado.
                  </p>
                </div>
              )}

              <div className="team-panel">
                <p className="eyebrow">Alertas</p>
                <h3>Próximos prazos</h3>
                {nextDue.length ? (
                  nextDue.map((item) => (
                    <div className="alert-row" key={item.id}>
                      <span>{item.title}</span>
                      <small>
                        {formatDate(item.date)} às {item.time}
                      </small>
                    </div>
                  ))
                ) : (
                  <p className="muted-text">Nada pendente nos filtros atuais.</p>
                )}
              </div>

              <div className="team-panel" id="equipe">
                <p className="eyebrow">Equipe</p>
                <h3>Colaboradores</h3>
                {colaboradores.length === 0 ? (
                  <p className="muted-text">Nenhum colaborador cadastrado ainda.</p>
                ) : (
                  colaboradores.map((user) => (
                    <div className="team-row" key={user.id}>
                      <span>{user.name}</span>
                      <small>{user.team}</small>
                    </div>
                  ))
                )}
              </div>
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
                  onChange={(event) => setForm({ ...form, ownerId: event.target.value })}
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
                      setForm({ ...form, priority: event.target.value as WorkItem["priority"] })
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
              <label>
                Projeto
                <input
                  value={form.project}
                  onChange={(event) => setForm({ ...form, project: event.target.value })}
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
              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={saving}>
                  <Save size={18} />
                  {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar demanda"}
                </button>
                <button className="ghost-button" type="button" onClick={resetForm}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </section>

      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </main>
  );
}

// ─── Pagina Equipe ────────────────────────────────────────────

function TeamPage({
  stats,
  items,
}: {
  stats: Array<{
    user: User;
    total: number;
    pending: number;
    overdue: number;
    done: number;
  }>;
  items: WorkItem[];
}) {
  return (
    <section className="management-panel" id="equipe">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Equipe</p>
          <h3>Capacidade e responsabilidades</h3>
        </div>
      </div>
      {stats.length === 0 ? (
        <div className="empty-state">
          <strong>Nenhum colaborador encontrado</strong>
          <p>Altere os filtros para ver a carga de trabalho da equipe.</p>
        </div>
      ) : (
        <div className="team-grid">
          {stats.map(({ user, total, pending, overdue, done }) => {
            const assigned = items
              .filter((item) => item.ownerId === user.id && item.status !== "concluida")
              .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
              .slice(0, 3);

            return (
              <article className="person-card" key={user.id}>
                <div className="person-header">
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.team}</span>
                  </div>
                  <UserRound size={22} />
                </div>
                <div className="person-stats">
                  <span>{total} total</span>
                  <span>{pending} pendentes</span>
                  <span>{done} concluídas</span>
                  <span className={overdue ? "danger-text" : ""}>{overdue} atrasadas</span>
                </div>
                <div className="mini-list">
                  {assigned.length ? (
                    assigned.map((item) => (
                      <div key={item.id}>
                        <strong>{item.title}</strong>
                        <small>
                          {formatDate(item.date)} às {item.time}
                        </small>
                      </div>
                    ))
                  ) : (
                    <p className="muted-text">Sem pendências no momento.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Pagina Indicadores ───────────────────────────────────────

function IndicatorsPage({
  metrics,
  statusStats,
  visibleItems,
  allUsers,
}: {
  metrics: { total: number; pending: number; overdue: number; deliveries: number };
  statusStats: Array<{ status: Status; total: number }>;
  visibleItems: WorkItem[];
  allUsers: User[];
}) {
  const completionRate =
    metrics.total === 0
      ? 0
      : Math.round(
          (visibleItems.filter((item) => item.status === "concluida").length / metrics.total) * 100
        );

  return (
    <section className="management-panel" id="indicadores">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Indicadores</p>
          <h3>Resumo operacional</h3>
        </div>
        <div className="heading-actions">
          <span className="save-hint">{completionRate}% concluídas</span>
          <button
            className="ghost-button"
            type="button"
            onClick={() => exportCsv(visibleItems, allUsers)}
            disabled={visibleItems.length === 0}
            title="Exportar as demandas filtradas em CSV"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>
      <div className="insights-grid">
        {statusStats.map(({ status, total }) => (
          <article className="insight-card" key={status}>
            <span>{statusLabel[status]}</span>
            <strong>{total}</strong>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${metrics.total ? (total / metrics.total) * 100 : 0}%` }}
              />
            </div>
          </article>
        ))}
      </div>
      <div className="report-grid">
        <article>
          <p className="eyebrow">Risco</p>
          <h4>{metrics.overdue} demandas atrasadas</h4>
          <p className="muted-text">Use esse número para priorizar renegociações de prazo.</p>
        </article>
        <article>
          <p className="eyebrow">Fila ativa</p>
          <h4>{metrics.pending} demandas pendentes</h4>
          <p className="muted-text">Inclui tarefas planejadas, em andamento e em revisão.</p>
        </article>
        <article>
          <p className="eyebrow">Entregas</p>
          <h4>{metrics.deliveries} entregas filtradas</h4>
          <p className="muted-text">Mostra apenas o que aparece nos filtros atuais.</p>
        </article>
      </div>
    </section>
  );
}

// ─── Página Usuários (admin) ──────────────────────────────────

function UsersAdminPage({
  users,
  currentUser,
  onRefreshUsers,
}: {
  users: User[];
  currentUser: User;
  onRefreshUsers: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [teamDraft, setTeamDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));

  async function changeRole(user: User, role: Role) {
    setError("");
    setBusyId(user.id);
    const { error: err } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", user.id);
    if (err) setError("Não foi possível alterar o papel: " + err.message);
    await onRefreshUsers();
    setBusyId(null);
  }

  async function saveTeam(user: User) {
    const next = (teamDraft[user.id] ?? user.team).trim();
    if (next === user.team) return;
    setError("");
    setBusyId(user.id);
    const { error: err } = await supabase
      .from("profiles")
      .update({ team: next })
      .eq("id", user.id);
    if (err) setError("Não foi possível alterar a equipe: " + err.message);
    await onRefreshUsers();
    setBusyId(null);
  }

  return (
    <section className="management-panel" id="usuarios">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Usuários</p>
          <h3>Gestão de acessos da equipe</h3>
        </div>
        <span className="save-hint">{users.length} cadastrados</span>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {sorted.length === 0 ? (
        <div className="empty-state">
          <strong>Nenhum usuário cadastrado</strong>
          <p>Os usuários aparecem aqui assim que criam uma conta.</p>
        </div>
      ) : (
        <div className="users-table">
          {sorted.map((user) => {
            const isSelf = user.id === currentUser.id;
            const busy = busyId === user.id;
            return (
              <article className="user-row-card" key={user.id}>
                <div className="user-row-main">
                  <div className="user-avatar">
                    <UserRound size={20} />
                  </div>
                  <div>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </div>
                </div>
                <div className="user-row-controls">
                  <label className="inline-field">
                    Equipe
                    <input
                      value={teamDraft[user.id] ?? user.team}
                      onChange={(e) =>
                        setTeamDraft({ ...teamDraft, [user.id]: e.target.value })
                      }
                      onBlur={() => saveTeam(user)}
                      placeholder="Sem equipe"
                      disabled={busy}
                    />
                  </label>
                  <label className="inline-field">
                    Papel
                    <select
                      value={user.role}
                      disabled={busy || isSelf}
                      onChange={(e) => changeRole(user, e.target.value as Role)}
                      title={isSelf ? "Você não pode alterar o próprio papel" : undefined}
                    >
                      <option value="colaborador">Colaborador</option>
                      <option value="gestor">Gestor</option>
                    </select>
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────

function Metric({
  icon,
  label,
  value,
  caption,
  ratio,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  caption: string;
  ratio: number;
  tone?: "amber" | "coral" | "green";
}) {
  return (
    <article className={`metric-card${tone ? ` tone-${tone}` : ""}`}>
      <div className="metric-top">
        <div className="metric-icon">{icon}</div>
        <span className="metric-trend">{caption}</span>
      </div>
      <strong>{value}</strong>
      <span className="metric-label">{label}</span>
      <div className="metric-bar">
        <span style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }} />
      </div>
    </article>
  );
}

function Toast({
  message,
  tone,
}: {
  message: string;
  tone: "error" | "success";
}) {
  return (
    <div className={`toast toast-${tone}`} role="status" aria-live="polite">
      {tone === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      <span>{message}</span>
    </div>
  );
}

function CalendarView({
  items,
  allUsers,
  selectedDate,
  onSelectDate,
  currentUser,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  items: WorkItem[];
  allUsers: User[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  currentUser: User;
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (item: WorkItem) => void;
  onDelete: (id: number) => void;
}) {
  const referenceDate = items[0]?.date ?? selectedDate;
  const monthDate = new Date(`${referenceDate}T00:00:00`);
  const month = monthDate.getMonth();
  const year = monthDate.getFullYear();
  const days = buildCalendarDays(year, month);
  const itemsByDate = groupItemsByDate(items);
  const selectedItems = itemsByDate[selectedDate] ?? [];
  const monthLabel = monthDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="calendar-layout">
      <div className="calendar-panel" aria-label="Calendário mensal">
        <div className="calendar-toolbar">
          <div>
            <span>Calendário mensal</span>
            <strong>{monthLabel}</strong>
          </div>
          <button className="ghost-button" onClick={() => onSelectDate(today)}>
            Hoje
          </button>
        </div>
        <div className="calendar-weekdays">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {days.map((day) => {
            const dateItems = itemsByDate[day.date] ?? [];
            const isCurrentMonth = day.month === month;
            const isSelected = day.date === selectedDate;
            const isToday = day.date === today;

            return (
              <button
                className={`calendar-day ${isCurrentMonth ? "" : "outside-month"} ${
                  isSelected ? "selected-day" : ""
                } ${isToday ? "is-today" : ""}`}
                key={day.date}
                onClick={() => onSelectDate(day.date)}
              >
                <span className="day-number">{day.label}</span>
                <div className="day-events">
                  {dateItems.slice(0, 2).map((item) => (
                    <span className={`event-dot event-${item.kind}`} key={item.id}>
                      {item.title}
                    </span>
                  ))}
                  {dateItems.length > 2 ? <small>+{dateItems.length - 2}</small> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="day-detail">
        <p className="eyebrow">Dia selecionado</p>
        <h3>{formatDate(selectedDate)}</h3>
        {selectedItems.length ? (
          <div className="day-list">
            {selectedItems.map((item) => (
              <WorkCard
                key={item.id}
                item={item}
                allUsers={allUsers}
                compact
                canManage={currentUser.role === "gestor"}
                canEditStatus={
                  currentUser.role === "gestor" || item.ownerId === currentUser.id
                }
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="empty-day">
            <strong>Nada agendado</strong>
            <p>Nenhuma demanda filtrada para este dia.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function KanbanBoard({
  items,
  allUsers,
  currentUser,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  items: WorkItem[];
  allUsers: User[];
  currentUser: User;
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (item: WorkItem) => void;
  onDelete: (id: number) => void;
}) {
  const columns: Status[] = ["planejada", "em-andamento", "revisao", "concluida"];
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<Status | null>(null);

  function handleDrop(status: Status) {
    const dragged = items.find((item) => item.id === draggingId);
    if (dragged && dragged.status !== status) {
      onStatusChange(dragged.id, status);
    }
    setDraggingId(null);
    setDragOver(null);
  }

  return (
    <div className="kanban-board">
      {columns.map((status) => {
        const columnItems = items.filter((item) => item.status === status);
        return (
          <section
            className={`kanban-column${dragOver === status ? " drag-over" : ""}`}
            key={status}
            onDragOver={(event) => {
              if (draggingId === null) return;
              event.preventDefault();
              setDragOver(status);
            }}
            onDrop={() => handleDrop(status)}
          >
            <div className="kanban-heading">
              <strong>{statusLabel[status]}</strong>
              <span>{columnItems.length}</span>
            </div>
            <div className="kanban-list">
              {columnItems.map((item) => {
                const draggable =
                  currentUser.role === "gestor" || item.ownerId === currentUser.id;
                return (
                  <div
                    key={item.id}
                    className={`kanban-draggable${
                      draggingId === item.id ? " dragging" : ""
                    }`}
                    draggable={draggable}
                    onDragStart={() => setDraggingId(item.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOver(null);
                    }}
                  >
                    <WorkCard
                      item={item}
                      allUsers={allUsers}
                      compact
                      canManage={currentUser.role === "gestor"}
                      canEditStatus={
                        currentUser.role === "gestor" || item.ownerId === currentUser.id
                      }
                      onStatusChange={onStatusChange}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function WorkCard({
  item,
  allUsers,
  compact,
  canManage,
  canEditStatus,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  item: WorkItem;
  allUsers: User[];
  compact: boolean;
  canManage: boolean;
  canEditStatus: boolean;
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (item: WorkItem) => void;
  onDelete: (id: number) => void;
}) {
  const owner = allUsers.find((u) => u.id === item.ownerId);
  const overdue = isOverdue(item);

  return (
    <article
      className={`work-card priority-${item.priority.toLowerCase()} ${
        compact ? "compact-card" : ""
      }`}
    >
      {!compact ? (
        <div className="card-date">
          <strong>{formatDate(item.date, true)}</strong>
          <span>{item.time}</span>
        </div>
      ) : null}
      <div className="card-content">
        <div className="card-header">
          <span className={`pill kind-${item.kind}`}>{kindLabel[item.kind]}</span>
          <span className={`pill status-${item.status}`}>{statusLabel[item.status]}</span>
          {overdue ? <span className="pill danger-pill">Atrasada</span> : null}
        </div>
        <h4>{item.title}</h4>
        <p>{item.notes}</p>
        <div className="meta-line">
          <span>{owner?.name ?? "—"}</span>
          <span>{item.project || "Sem projeto"}</span>
          <span>
            {formatDate(item.date)} às {item.time}
          </span>
          <span>Prioridade {priorityLabel[item.priority]}</span>
        </div>
        <div className="card-actions">
          {canEditStatus ? (
            <select
              className="status-select"
              value={item.status}
              onChange={(event) => onStatusChange(item.id, event.target.value as Status)}
            >
              <option value="planejada">Planejada</option>
              <option value="em-andamento">Em andamento</option>
              <option value="revisao">Revisão</option>
              <option value="concluida">Concluída</option>
            </select>
          ) : null}
          {canManage ? (
            <div className="icon-actions">
              <button
                className="ghost-button icon-button"
                onClick={() => onEdit(item)}
                title="Editar"
              >
                <Edit3 size={16} />
              </button>
              <button
                className="danger-button icon-button"
                onClick={() => onDelete(item.id)}
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

// ─── Utilitários ─────────────────────────────────────────────

function formatDate(date: string, short = false) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: short ? "short" : "2-digit",
    year: short ? undefined : "numeric",
  });
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function groupItemsByDate(items: WorkItem[]) {
  return items.reduce<Record<string, WorkItem[]>>((acc, item) => {
    acc[item.date] = [...(acc[item.date] ?? []), item].sort((a, b) =>
      a.time.localeCompare(b.time)
    );
    return acc;
  }, {});
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const value = toDateInputValue(date);
    return { date: value, label: String(date.getDate()), month: date.getMonth() };
  });
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isOverdue(item: WorkItem) {
  return item.status !== "concluida" && item.date < today;
}

function exportCsv(items: WorkItem[], users: User[]) {
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

// ─── Mount ───────────────────────────────────────────────────

createRoot(document.getElementById("root")!).render(<App />);
