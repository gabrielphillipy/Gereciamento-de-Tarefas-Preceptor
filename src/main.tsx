import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  KanbanSquare,
  LogOut,
  Megaphone,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import "./styles.css";

type Role = "gestor" | "colaborador";
type Status = "planejada" | "em-andamento" | "revisao" | "concluida";
type Kind = "tarefa" | "reuniao" | "entrega";
type ViewMode = "agenda" | "kanban";
type NavSection = "agenda" | "kanban" | "equipe" | "indicadores";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string;
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

const STORAGE_ITEMS_KEY = "preceptor.workItems";
const STORAGE_USER_KEY = "preceptor.currentUser";

const users: User[] = [
  {
    id: "ana",
    name: "Ana Martins",
    email: "gestor@empresa.com",
    password: "gestor123",
    role: "gestor",
    team: "Lideranca",
  },
  {
    id: "bruno",
    name: "Bruno Silva",
    email: "colaborador@empresa.com",
    password: "colab123",
    role: "colaborador",
    team: "Conteudo",
  },
  {
    id: "carla",
    name: "Carla Souza",
    email: "carla@empresa.com",
    password: "colab123",
    role: "colaborador",
    team: "Performance",
  },
  {
    id: "diego",
    name: "Diego Lima",
    email: "diego@empresa.com",
    password: "colab123",
    role: "colaborador",
    team: "Criacao",
  },
];

const today = new Date().toISOString().slice(0, 10);
const now = new Date().toISOString();

const initialItems: WorkItem[] = [
  {
    id: 1,
    title: "Ajustar calendario editorial do mes",
    ownerId: "bruno",
    kind: "tarefa",
    status: "em-andamento",
    date: "2026-05-20",
    time: "09:00",
    priority: "Alta",
    project: "Campanha Maio",
    notes: "Revisar temas, responsaveis e ordem das publicacoes.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    title: "Reuniao de alinhamento com equipe",
    ownerId: "carla",
    kind: "reuniao",
    status: "planejada",
    date: "2026-05-21",
    time: "14:30",
    priority: "Media",
    project: "Rotina semanal",
    notes: "Pauta: metas, gargalos e proximas entregas.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    title: "Entrega do relatorio de desempenho",
    ownerId: "carla",
    kind: "entrega",
    status: "revisao",
    date: "2026-05-23",
    time: "17:00",
    priority: "Alta",
    project: "Performance",
    notes: "Incluir analise por canal e sugestoes de melhoria.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 4,
    title: "Criar pecas para comunicacao interna",
    ownerId: "diego",
    kind: "tarefa",
    status: "planejada",
    date: "2026-05-24",
    time: "10:00",
    priority: "Media",
    project: "Endomarketing",
    notes: "Priorizar banners de aviso e card para intranet.",
    createdAt: now,
    updatedAt: now,
  },
];

const statusLabel: Record<Status, string> = {
  planejada: "Planejada",
  "em-andamento": "Em andamento",
  revisao: "Revisao",
  concluida: "Concluida",
};

const kindLabel: Record<Kind, string> = {
  tarefa: "Tarefa",
  reuniao: "Reuniao",
  entrega: "Entrega",
};

const emptyForm: WorkForm = {
  title: "",
  ownerId: "bruno",
  kind: "tarefa",
  date: "2026-05-25",
  time: "09:00",
  priority: "Media",
  project: "",
  notes: "",
};

function loadItems() {
  const stored = localStorage.getItem(STORAGE_ITEMS_KEY);
  if (!stored) return initialItems;

  try {
    const parsed = JSON.parse(stored) as WorkItem[];
    return Array.isArray(parsed) ? parsed : initialItems;
  } catch {
    return initialItems;
  }
}

function loadCurrentUser() {
  const stored = localStorage.getItem(STORAGE_USER_KEY);
  if (!stored) return null;
  return users.find((user) => user.id === stored) ?? null;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadCurrentUser());
  const [items, setItems] = useState<WorkItem[]>(() => loadItems());

  useEffect(() => {
    localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  function login(user: User) {
    localStorage.setItem(STORAGE_USER_KEY, user.id);
    setCurrentUser(user);
  }

  function logout() {
    localStorage.removeItem(STORAGE_USER_KEY);
    setCurrentUser(null);
  }

  if (!currentUser) {
    return <Login onLogin={login} />;
  }

  return (
    <Dashboard
      currentUser={currentUser}
      items={items}
      setItems={setItems}
      onLogout={logout}
    />
  );
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("gestor@empresa.com");
  const [password, setPassword] = useState("gestor123");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = users.find(
      (user) => user.email === email.trim() && user.password === password
    );

    if (!found) {
      setError("Usuario ou senha invalido. Teste gestor@empresa.com / gestor123.");
      return;
    }

    setError("");
    onLogin(found);
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark">
          <span>P!</span>
        </div>
        <p className="eyebrow">Preceptor Tasks</p>
        <h1>Gestao de tarefas, agenda e entregas da equipe</h1>
        <p className="login-copy">
          Uma central para organizar demandas, compromissos e entregas sem perder o controle dos prazos.
        </p>
        <form className="login-form" onSubmit={submit}>
          <label>
            Usuario
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email da empresa"
              type="email"
            />
          </label>
          <label>
            Senha
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="senha"
              type="password"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" type="submit">
            Entrar
          </button>
        </form>
        <div className="access-grid" aria-label="Acessos de teste">
          <span>Gestor: gestor@empresa.com / gestor123</span>
          <span>Colaborador: colaborador@empresa.com / colab123</span>
        </div>
      </section>
      <section className="login-preview">
        <div className="preview-topline">
          <Sparkles size={18} />
          <span>Planejamento operacional</span>
        </div>
        <div className="preview-board">
          <div>
            <strong>Agenda salva</strong>
            <p>As demandas continuam no navegador mesmo apos recarregar a pagina.</p>
          </div>
          <div>
            <strong>Kanban</strong>
            <p>Gestor e equipe acompanham status por etapa de trabalho.</p>
          </div>
          <div>
            <strong>Operacao</strong>
            <p>Criar, editar, excluir e filtrar demandas sem backend por enquanto.</p>
          </div>
        </div>
        <div className="preview-metrics">
          <span>4 status de fluxo</span>
          <span>3 areas de equipe</span>
          <span>100% local</span>
        </div>
      </section>
    </main>
  );
}

function Dashboard({
  currentUser,
  items,
  setItems,
  onLogout,
}: {
  currentUser: User;
  items: WorkItem[];
  setItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
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
  const [form, setForm] = useState<WorkForm>(emptyForm);

  const visibleItems = useMemo(() => {
    return items
      .filter((item) =>
        currentUser.role === "gestor" ? true : item.ownerId === currentUser.id
      )
      .filter((item) => statusFilter === "todos" || item.status === statusFilter)
      .filter((item) => ownerFilter === "todos" || item.ownerId === ownerFilter)
      .filter((item) => kindFilter === "todos" || item.kind === kindFilter)
      .filter((item) => {
        const owner = users.find((user) => user.id === item.ownerId)?.name ?? "";
        const text = `${item.title} ${item.project} ${item.notes} ${owner}`.toLowerCase();
        return text.includes(query.toLowerCase());
      })
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [currentUser, items, kindFilter, ownerFilter, query, statusFilter]);

  const metrics = {
    total: visibleItems.length,
    pending: visibleItems.filter((item) => item.status !== "concluida").length,
    overdue: visibleItems.filter((item) => isOverdue(item)).length,
    deliveries: visibleItems.filter((item) => item.kind === "entrega").length,
  };

  const nextDue = visibleItems.filter((item) => item.status !== "concluida").slice(0, 3);
  const visibleTeamUsers = users.filter((user) => {
    if (user.role !== "colaborador") return false;
    if (currentUser.role === "colaborador" && user.id !== currentUser.id) return false;
    if (ownerFilter !== "todos" && user.id !== ownerFilter) return false;

    const hasVisibleItems = visibleItems.some((item) => item.ownerId === user.id);
    const queryMatchesUser = `${user.name} ${user.team}`.toLowerCase().includes(query.toLowerCase());

    return query.trim() ? hasVisibleItems || queryMatchesUser : ownerFilter !== "todos" || hasVisibleItems;
  });

  const teamStats = visibleTeamUsers
    .map((user) => {
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
    setForm(emptyForm);
    setEditingId(null);
    setComposerOpen(false);
  }

  function saveItem(event: React.FormEvent) {
    event.preventDefault();
    const timestamp = new Date().toISOString();

    if (editingId) {
      setItems((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...form,
                status: form.status ?? item.status,
                updatedAt: timestamp,
              }
            : item
        )
      );
      resetForm();
      return;
    }

    setItems((current) => [
      {
        id: Date.now(),
        ...form,
        status: "planejada",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      ...current,
    ]);
    resetForm();
  }

  function updateStatus(id: number, status: Status) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item
      )
    );
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

  function deleteItem(id: number) {
    const item = items.find((current) => current.id === id);
    if (!item) return;
    const confirmed = window.confirm(`Excluir a demanda "${item.title}"?`);
    if (!confirmed) return;
    setItems((current) => current.filter((current) => current.id !== id));
    if (editingId === id) resetForm();
  }

  function restoreSampleData() {
    const confirmed = window.confirm("Restaurar os dados de exemplo e apagar alteracoes locais?");
    if (!confirmed) return;
    setItems(initialItems);
    resetForm();
  }

  function navigate(section: NavSection) {
    setActiveNav(section);

    if (section === "agenda" || section === "kanban") {
      setViewMode(section);
    }
  }

  function startNewDemand() {
    setEditingId(null);
    setForm(emptyForm);
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
            <span>Preceptor</span>
            <small>Operations Hub</small>
          </div>
        </div>
        <nav>
          <button className={activeNav === "agenda" ? "active" : ""} onClick={() => navigate("agenda")}>
            <CalendarDays size={18} />
            Agenda
          </button>
          <button className={activeNav === "kanban" ? "active" : ""} onClick={() => navigate("kanban")}>
            <KanbanSquare size={18} />
            Kanban
          </button>
          <button className={activeNav === "equipe" ? "active" : ""} onClick={() => navigate("equipe")}>
            <UsersRound size={18} />
            Equipe
          </button>
          <button className={activeNav === "indicadores" ? "active" : ""} onClick={() => navigate("indicadores")}>
            <BarChart3 size={18} />
            Indicadores
          </button>
        </nav>
        <button className="ghost-button" onClick={onLogout}>
          <LogOut size={18} />
          Sair
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Painel {currentUser.role}</p>
            <h2>Central de operacao</h2>
            <p className="topbar-subtitle">
              Priorize demandas, acompanhe prazos e mantenha a equipe alinhada.
            </p>
          </div>
          <div className="topbar-actions">
            {currentUser.role === "gestor" ? (
              <button className="primary-button" onClick={startNewDemand}>
                <Plus size={18} />
                Nova demanda
              </button>
            ) : null}
            <button className="ghost-button icon-button" onClick={restoreSampleData} title="Restaurar dados">
              <RotateCcw size={18} />
            </button>
            <div className="user-chip">
              <UserRound size={18} />
              <span>{currentUser.name}</span>
            </div>
          </div>
        </header>

        <section className="metrics">
          <Metric icon={<CalendarDays />} label="Eventos" value={metrics.total} />
          <Metric icon={<Clock3 />} label="Pendencias" value={metrics.pending} />
          <Metric icon={<Megaphone />} label="Atrasadas" value={metrics.overdue} />
          <Metric icon={<CheckCircle2 />} label="Entregas" value={metrics.deliveries} />
        </section>

        <section className="control-row">
          <div className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar tarefa, projeto, observacao ou responsavel"
            />
          </div>
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
        </section>

        <section className="filters-row">
          <select
            aria-label="Filtro de status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as Status | "todos")}
          >
            <option value="todos">Todos os status</option>
            <option value="planejada">Planejada</option>
            <option value="em-andamento">Em andamento</option>
            <option value="revisao">Revisao</option>
            <option value="concluida">Concluida</option>
          </select>
          <select
            aria-label="Filtro de tipo"
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value as Kind | "todos")}
          >
            <option value="todos">Todos os tipos</option>
            <option value="tarefa">Tarefa</option>
            <option value="reuniao">Reuniao</option>
            <option value="entrega">Entrega</option>
          </select>
          {currentUser.role === "gestor" ? (
            <select
              aria-label="Filtro de responsavel"
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
            >
              <option value="todos">Todos os responsaveis</option>
              {users
                .filter((user) => user.role === "colaborador")
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </select>
          ) : null}
        </section>

        {activeNav === "equipe" ? (
          <TeamPage stats={teamStats} items={visibleItems} />
        ) : activeNav === "indicadores" ? (
          <IndicatorsPage metrics={metrics} statusStats={statusStats} visibleItems={visibleItems} />
        ) : (
        <section className="main-grid">
          <div className="agenda-panel" id={viewMode}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">{viewMode === "agenda" ? "Agenda" : "Kanban"}</p>
                <h3>{viewMode === "agenda" ? "Proximos compromissos" : "Fluxo de trabalho"}</h3>
              </div>
              <span className="save-hint">Salvo neste navegador</span>
            </div>

            {visibleItems.length === 0 ? (
              <div className="empty-state">
                <strong>Nenhuma demanda encontrada</strong>
                <p>Ajuste os filtros ou crie uma nova atividade para a equipe.</p>
              </div>
            ) : viewMode === "agenda" ? (
              <CalendarView
                items={visibleItems}
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
                  Crie tarefas, reunioes e entregas pelo botao principal. Edicoes abrem no mesmo painel.
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
                  Acompanhe suas tarefas, reunioes e entregas. Atualize o status
                  quando avancar para manter o gestor alinhado.
                </p>
              </div>
            )}

            <div className="team-panel">
              <p className="eyebrow">Alertas</p>
              <h3>Proximos prazos</h3>
              {nextDue.length ? (
                nextDue.map((item) => (
                  <div className="alert-row" key={item.id}>
                    <span>{item.title}</span>
                    <small>{formatDate(item.date)} as {item.time}</small>
                  </div>
                ))
              ) : (
                <p className="muted-text">Nada pendente nos filtros atuais.</p>
              )}
            </div>

            <div className="team-panel" id="equipe">
              <p className="eyebrow">Equipe</p>
              <h3>Colaboradores</h3>
              {users
                .filter((user) => user.role === "colaborador")
                .map((user) => (
                  <div className="team-row" key={user.id}>
                    <span>{user.name}</span>
                    <small>{user.team}</small>
                  </div>
                ))}
            </div>
          </div>
        </section>
        )}
        {composerOpen && currentUser.role === "gestor" ? (
          <div className="drawer-backdrop" role="presentation">
            <form className="task-drawer" onSubmit={saveItem} aria-label="Formulario de demanda">
              <div className="drawer-header">
                <div>
                  <p className="eyebrow">{editingId ? "Edicao" : "Nova demanda"}</p>
                  <h3>{editingId ? "Editar demanda" : "Planejar atividade"}</h3>
                </div>
                <button className="ghost-button icon-button" type="button" onClick={resetForm} title="Fechar">
                  <X size={18} />
                </button>
              </div>
              <label>
                Titulo
                <input
                  required
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="Nome da tarefa"
                />
              </label>
              <label>
                Responsavel
                <select
                  value={form.ownerId}
                  onChange={(event) => setForm({ ...form, ownerId: event.target.value })}
                >
                  {users
                    .filter((user) => user.role === "colaborador")
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.team}
                      </option>
                    ))}
                </select>
              </label>
              <div className="form-pair">
                <label>
                  Tipo
                  <select
                    value={form.kind}
                    onChange={(event) => setForm({ ...form, kind: event.target.value as Kind })}
                  >
                    <option value="tarefa">Tarefa</option>
                    <option value="reuniao">Reuniao</option>
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
                    <option>Baixa</option>
                    <option>Media</option>
                    <option>Alta</option>
                  </select>
                </label>
              </div>
              {editingId ? (
                <label>
                  Status
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as Status })}
                  >
                    <option value="planejada">Planejada</option>
                    <option value="em-andamento">Em andamento</option>
                    <option value="revisao">Revisao</option>
                    <option value="concluida">Concluida</option>
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
                Observacoes
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Contexto, briefing ou link"
                />
              </label>
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  <Save size={18} />
                  {editingId ? "Salvar alteracoes" : "Criar demanda"}
                </button>
                <button className="ghost-button" type="button" onClick={resetForm}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </section>
    </main>
  );
}

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
                <span>{done} concluidas</span>
                <span className={overdue ? "danger-text" : ""}>{overdue} atrasadas</span>
              </div>
              <div className="mini-list">
                {assigned.length ? (
                  assigned.map((item) => (
                    <div key={item.id}>
                      <strong>{item.title}</strong>
                      <small>{formatDate(item.date)} as {item.time}</small>
                    </div>
                  ))
                ) : (
                  <p className="muted-text">Sem pendencias no momento.</p>
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

function IndicatorsPage({
  metrics,
  statusStats,
  visibleItems,
}: {
  metrics: {
    total: number;
    pending: number;
    overdue: number;
    deliveries: number;
  };
  statusStats: Array<{ status: Status; total: number }>;
  visibleItems: WorkItem[];
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
        <span className="save-hint">{completionRate}% concluidas</span>
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
          <p className="muted-text">Use esse numero para priorizar renegociacoes de prazo.</p>
        </article>
        <article>
          <p className="eyebrow">Fila ativa</p>
          <h4>{metrics.pending} demandas pendentes</h4>
          <p className="muted-text">Inclui tarefas planejadas, em andamento e em revisao.</p>
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

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function CalendarView({
  items,
  selectedDate,
  onSelectDate,
  currentUser,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  items: WorkItem[];
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
      <div className="calendar-panel" aria-label="Calendario mensal">
        <div className="calendar-toolbar">
          <div>
            <span>Calendario mensal</span>
            <strong>{monthLabel}</strong>
          </div>
          <button className="ghost-button" onClick={() => onSelectDate(today)}>
            Hoje
          </button>
        </div>
        <div className="calendar-weekdays">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {days.map((day) => {
            const dateItems = itemsByDate[day.date] ?? [];
            const isCurrentMonth = day.month === month;
            const isSelected = day.date === selectedDate;

            return (
              <button
                className={`calendar-day ${isCurrentMonth ? "" : "outside-month"} ${isSelected ? "selected-day" : ""}`}
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
                compact
                canManage={currentUser.role === "gestor"}
                canEditStatus={currentUser.role === "gestor" || item.ownerId === currentUser.id}
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
  currentUser,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  items: WorkItem[];
  currentUser: User;
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (item: WorkItem) => void;
  onDelete: (id: number) => void;
}) {
  const columns: Status[] = ["planejada", "em-andamento", "revisao", "concluida"];

  return (
    <div className="kanban-board">
      {columns.map((status) => {
        const columnItems = items.filter((item) => item.status === status);
        return (
          <section className="kanban-column" key={status}>
            <div className="kanban-heading">
              <strong>{statusLabel[status]}</strong>
              <span>{columnItems.length}</span>
            </div>
            <div className="kanban-list">
              {columnItems.map((item) => (
                <WorkCard
                  key={item.id}
                  item={item}
                  compact
                  canManage={currentUser.role === "gestor"}
                  canEditStatus={currentUser.role === "gestor" || item.ownerId === currentUser.id}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function WorkCard({
  item,
  compact,
  canManage,
  canEditStatus,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  item: WorkItem;
  compact: boolean;
  canManage: boolean;
  canEditStatus: boolean;
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (item: WorkItem) => void;
  onDelete: (id: number) => void;
}) {
  const owner = users.find((user) => user.id === item.ownerId);
  const overdue = isOverdue(item);

  return (
    <article className={`work-card priority-${item.priority.toLowerCase()} ${compact ? "compact-card" : ""}`}>
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
          <span>{owner?.name}</span>
          <span>{item.project || "Sem projeto"}</span>
          <span>{formatDate(item.date)} as {item.time}</span>
          <span>Prioridade {item.priority}</span>
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
              <option value="revisao">Revisao</option>
              <option value="concluida">Concluida</option>
            </select>
          ) : null}
          {canManage ? (
            <div className="icon-actions">
              <button className="ghost-button icon-button" onClick={() => onEdit(item)} title="Editar">
                <Edit3 size={16} />
              </button>
              <button className="danger-button icon-button" onClick={() => onDelete(item.id)} title="Excluir">
                <Trash2 size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function formatDate(date: string, short = false) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: short ? "short" : "2-digit",
    year: short ? undefined : "numeric",
  });
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

    return {
      date: value,
      label: String(date.getDate()),
      month: date.getMonth(),
    };
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

createRoot(document.getElementById("root")!).render(<App />);
