import { UserRound } from "lucide-react";
import type { User, WorkItem } from "../types";
import { formatDate } from "../utils";

export function TeamPage({
  stats,
  items,
  onOpenMeeting,
}: {
  stats: Array<{
    user: User;
    total: number;
    pending: number;
    overdue: number;
    done: number;
  }>;
  items: WorkItem[];
  onOpenMeeting: (id: number) => void;
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
              .filter(
                (item) => item.ownerId === user.id && item.status !== "concluida",
              )
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
                  <span className={overdue ? "danger-text" : ""}>
                    {overdue} atrasadas
                  </span>
                </div>
                <div className="mini-list">
                  {assigned.length ? (
                    assigned.map((item) =>
                      item.kind === "reuniao" ? (
                        <button
                          key={item.id}
                          type="button"
                          className="mini-row meeting-row"
                          onClick={() => onOpenMeeting(item.id)}
                          title="Abrir notas e metas da reunião"
                        >
                          <strong>{item.title}</strong>
                          <small>
                            {formatDate(item.date)} às {item.time} · Reunião
                          </small>
                        </button>
                      ) : (
                        <div key={item.id} className="mini-row">
                          <strong>{item.title}</strong>
                          <small>
                            {formatDate(item.date)} às {item.time}
                          </small>
                        </div>
                      ),
                    )
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
