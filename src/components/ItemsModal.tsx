import { useState } from "react";
import { X } from "lucide-react";
import type { Status, User, WorkItem } from "../types";
import { WorkCard } from "./WorkCard";

const PAGE_SIZE = 10;

export function ItemsModal({
  title,
  subtitle,
  items,
  allUsers,
  currentUser,
  onStatusChange,
  onEdit,
  onDelete,
  onOpenComments,
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
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = items.slice(0, visible);
  const remaining = items.length - visible;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">{subtitle}</p>
            <h3 id="modal-title">{title}</h3>
          </div>
          <button
            className="ghost-button icon-button"
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {items.length ? (
            <>
              <div className="day-list">
                {shown.map((item) => (
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
              {remaining > 0 ? (
                <button
                  type="button"
                  className="ghost-button"
                  style={{ width: "100%", marginTop: "0.75rem" }}
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  Carregar mais ({remaining} restantes)
                </button>
              ) : null}
            </>
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
