import { Edit3, MessageSquare, Paperclip, Repeat, Trash2 } from "lucide-react";
import type { Status, User, WorkItem } from "../types";
import { kindLabel, priorityLabel, recurrenceLabel, statusLabel } from "../constants";
import { formatDate, isOverdue } from "../utils";

export function WorkCard({
  item,
  allUsers,
  compact,
  canManage,
  canEditStatus,
  onStatusChange,
  onEdit,
  onDelete,
  onOpenComments,
}: {
  item: WorkItem;
  allUsers: User[];
  compact: boolean;
  canManage: boolean;
  canEditStatus: boolean;
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (item: WorkItem) => void;
  onDelete: (id: number) => void;
  onOpenComments: (id: number) => void;
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
          <span className={`pill status-${item.status}`}>
            {statusLabel[item.status]}
          </span>
          {overdue ? <span className="pill danger-pill">Atrasada</span> : null}
          {item.recurrence !== "none" ? (
            <span className="pill recurrence-pill" title="Demanda recorrente">
              <Repeat size={12} />
              {recurrenceLabel[item.recurrence]}
            </span>
          ) : null}
          {item.attachments.length > 0 ? (
            <span className="pill recurrence-pill" title={`${item.attachments.length} anexo(s)`}>
              <Paperclip size={12} />
              {item.attachments.length}
            </span>
          ) : null}
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
              onChange={(event) =>
                onStatusChange(item.id, event.target.value as Status)
              }
            >
              <option value="planejada">Planejada</option>
              <option value="em-andamento">Em andamento</option>
              <option value="revisao">Revisão</option>
              <option value="concluida">Concluída</option>
            </select>
          ) : null}
          <div className="icon-actions">
            <button
              className="ghost-button icon-button"
              onClick={() => onOpenComments(item.id)}
              title="Comentários"
            >
              <MessageSquare size={16} />
            </button>
            {canManage ? (
              <>
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
              </>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
