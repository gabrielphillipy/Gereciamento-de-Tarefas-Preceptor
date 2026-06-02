import { X } from "lucide-react";
import type { Status, User, WorkItem } from "../types";
import { WorkCard } from "./WorkCard";

export function ItemsModal({
  title,
  subtitle,
  items,
  allUsers,
  currentUser,
  onStatusChange,
  onEdit,
  onDelete,
  onClose,
}: {
  title: string;
  subtitle: string;
  items: WorkItem[];
  allUsers: User[];
  currentUser: User;
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (item: WorkItem) => void;
  onDelete: (id: number) => void;
  onOpenComments: (id: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">{subtitle}</p>
            <h3>{title}</h3>
          </div>
          <button
            className="ghost-button icon-button"
            type="button"
            onClick={onClose}
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {items.length ? (
            <div className="day-list">
              {items.map((item) => (
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
                  onOpenComments={onOpenComments}
                />
              ))}
            </div>
          ) : (
            <div className="empty-day">
              <strong>Nada por aqui</strong>
              <p>Nenhuma demanda nesta lista.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
