import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  Megaphone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import "./styles.css";

type Role = "gestor" | "colaborador";
type Status = "planejada" | "em-andamento" | "revisao" | "concluida";
type Kind = "tarefa" | "reuniao" | "entrega";

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
};

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

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [items, setItems] = useState<WorkItem[]>(initialItems);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  return (
    <Dashboard
      currentUser={currentUser}
      items={items}
      setItems={setItems}
      onLogout={() => setCurrentUser(null)}
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
          <ShieldCheck size={28} />
        </div>
        <p className="eyebrow">Preceptor Tasks</p>
        <h1>Gestao de tarefas, agenda e entregas da equipe</h1>
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
            <strong>Agenda</strong>
            <p>Reunioes, prazos e demandas em um fluxo unico.</p>
          </div>
          <div>
            <strong>Equipe</strong>
            <p>Gestor distribui tarefas e colaboradores acompanham status.</p>
          </div>
          <div>
            <strong>Entrega</strong>
            <p>Visao clara de prioridade, responsavel e data final.</p>
          </div>
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
  const [form, setForm] = useState({
    title: "",
    ownerId: "bruno",
    kind: "tarefa" as Kind,
    date: "2026-05-25",
    time: "09:00",
    priority: "Media" as WorkItem["priority"],
    project: "",
    notes: "",
  });

  const visibleItems = useMemo(() => {
    return items
      .filter((item) =>
        currentUser.role === "gestor" ? true : item.ownerId === currentUser.id
      )
      .filter((item) => {
        const owner = users.find((user) => user.id === item.ownerId)?.name ?? "";
        const text = `${item.title} ${item.project} ${owner}`.toLowerCase();
        return text.includes(query.toLowerCase());
      })
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [currentUser, items, query]);

  const metrics = {
    total: visibleItems.length,
    pending: visibleItems.filter((item) => item.status !== "concluida").length,
    meetings: visibleItems.filter((item) => item.kind === "reuniao").length,
    deliveries: visibleItems.filter((item) => item.kind === "entrega").length,
  };

  function addItem(event: React.FormEvent) {
    event.preventDefault();
    setItems((current) => [
      {
        id: Date.now(),
        ...form,
        status: "planejada",
      },
      ...current,
    ]);
    setForm((current) => ({ ...current, title: "", project: "", notes: "" }));
  }

  function updateStatus(id: number, status: Status) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="side-brand">
          <ShieldCheck />
          <span>Preceptor</span>
        </div>
        <nav>
          <a className="active" href="#agenda">
            <CalendarDays size={18} />
            Agenda
          </a>
          <a href="#tarefas">
            <CheckCircle2 size={18} />
            Tarefas
          </a>
          <a href="#equipe">
            <UsersRound size={18} />
            Equipe
          </a>
          <a href="#indicadores">
            <BarChart3 size={18} />
            Indicadores
          </a>
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
            <h2>Rotina de trabalho da equipe</h2>
          </div>
          <div className="user-chip">
            <UserRound size={18} />
            <span>{currentUser.name}</span>
          </div>
        </header>

        <section className="metrics" id="indicadores">
          <Metric icon={<CalendarDays />} label="Eventos" value={metrics.total} />
          <Metric icon={<Clock3 />} label="Pendencias" value={metrics.pending} />
          <Metric icon={<UsersRound />} label="Reunioes" value={metrics.meetings} />
          <Metric icon={<Megaphone />} label="Entregas" value={metrics.deliveries} />
        </section>

        <section className="control-row">
          <div className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar tarefa, projeto ou responsavel"
            />
          </div>
        </section>

        <section className="main-grid">
          <div className="agenda-panel" id="agenda">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Agenda</p>
                <h3>Proximos compromissos</h3>
              </div>
            </div>
            <div className="timeline">
              {visibleItems.map((item) => (
                <WorkCard
                  key={item.id}
                  item={item}
                  canEdit={currentUser.role === "gestor" || item.ownerId === currentUser.id}
                  onStatusChange={updateStatus}
                />
              ))}
            </div>
          </div>

          <div className="side-panel">
            {currentUser.role === "gestor" ? (
              <form className="create-form" onSubmit={addItem}>
                <div className="section-heading compact">
                  <div>
                    <p className="eyebrow">Gestor</p>
                    <h3>Demandar atividade</h3>
                  </div>
                  <Plus size={20} />
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
                      onChange={(event) =>
                        setForm({ ...form, kind: event.target.value as Kind })
                      }
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
                        setForm({
                          ...form,
                          priority: event.target.value as WorkItem["priority"],
                        })
                      }
                    >
                      <option>Baixa</option>
                      <option>Media</option>
                      <option>Alta</option>
                    </select>
                  </label>
                </div>
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
                <button className="primary-button" type="submit">
                  Criar demanda
                </button>
              </form>
            ) : (
              <div className="create-form collaborator-note">
                <p className="eyebrow">Colaborador</p>
                <h3>Minha fila</h3>
                <p>
                  Acompanhe suas tarefas, reunioes e entregas. Atualize o status
                  quando avancar para manter o gestor alinhado.
                </p>
              </div>
            )}

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
      </section>
    </main>
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

function WorkCard({
  item,
  canEdit,
  onStatusChange,
}: {
  item: WorkItem;
  canEdit: boolean;
  onStatusChange: (id: number, status: Status) => void;
}) {
  const owner = users.find((user) => user.id === item.ownerId);

  return (
    <article className={`work-card priority-${item.priority.toLowerCase()}`} id="tarefas">
      <div className="card-date">
        <strong>{new Date(`${item.date}T00:00:00`).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        })}</strong>
        <span>{item.time}</span>
      </div>
      <div className="card-content">
        <div className="card-header">
          <span className={`pill kind-${item.kind}`}>{kindLabel[item.kind]}</span>
          <span className={`pill status-${item.status}`}>{statusLabel[item.status]}</span>
        </div>
        <h4>{item.title}</h4>
        <p>{item.notes}</p>
        <div className="meta-line">
          <span>{owner?.name}</span>
          <span>{item.project || "Sem projeto"}</span>
          <span>Prioridade {item.priority}</span>
        </div>
        {canEdit ? (
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
      </div>
    </article>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
