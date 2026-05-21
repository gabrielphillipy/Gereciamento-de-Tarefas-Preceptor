import { useState } from "react";
import { UserRound } from "lucide-react";
import type { Role, User } from "../types";
import { supabase } from "../supabase";

export function UsersAdminPage({
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
                      title={
                        isSelf ? "Você não pode alterar o próprio papel" : undefined
                      }
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
