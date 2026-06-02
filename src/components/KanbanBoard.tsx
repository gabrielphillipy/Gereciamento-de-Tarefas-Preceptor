import { useState } from "react";
import type { Status, User, WorkItem } from "../types";
import { statusLabel } from "../constants";
import { WorkCard } from "./WorkCard";

const PAGE_SIZE = 10;

export function KanbanBoard({
  items,
  allUsers,
  currentUser,
  onStatusChange,
  onEdit,
  onDelete,
  onOpenComments,
}: {
  items: WorkItem[];
  allUsers: User[];
  currentUser: User;
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (item: WorkItem) => void;
  onDelete: (id: number) => void;
  onOpenComments: (id: number) => void;
}) {
  const columns: Status[] = ["planejada", "em-andamento", "revisao", "concluida"];
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const [visibleCount, setVisibleCount] = useState<Record<Status, number>>({
    planejada: PAGE_SIZE,
    "em-andamento": PAGE_SIZE,
    revisao: PAGE_SIZE,
    concluida: PAGE_SIZE,
  });

  function handleDrop(status: Status) {
    const dragged = items.find((item) => item.id === draggingId);
    if (dragged && dragged.status !== status) {
      onStatusChange(dragged.id, status);
    }
    setDraggingId(null);
    setDragOver(null);
  }

  return (
    <div className="kanban-board" role="region" aria-label="Quadro Kanban">
      {columns.map((status) => {
        const columnItems = items.filter((item) => item.status === status);
        const shown = columnItems.slice(0, visibleCount[status]);
        const remaining = columnItems.length - visibleCount[status];

        return (
          <section
            className={`kanban-column${dragOver === status ? " drag-over" : ""}`}
            key={status}
            aria-label={`Coluna ${statusLabel[status]}`}
            onDragOver={(event) => {
              if (draggingId === null) return;
              event.preventDefault();
              setDragOver(status);
            }}
            onDrop={() => handleDrop(status)}
          >
            <div className="kanban-heading">
              <strong>{statusLabel[status]}</strong>
              <span aria-label={`${columnItems.length} itens`}>{columnItems.length}</span>
            </div>
            <ul className="kanban-list" role="list">
              {shown.map((item) => {
                const draggable =
                  currentUser.role === "gestor" || item.ownerId === currentUser.id;
                return (
                  <li
                    key={item.id}
                    role="listitem"
                    className={`kanban-draggable${
                      draggingId === item.id ? " dragging" : ""
                    }`}
                    draggable={draggable}
                    aria-grabbed={draggingId === item.id}
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
                        currentUser.role === "gestor" ||
                        item.ownerId === currentUser.id
                      }
                      onStatusChange={onStatusChange}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onOpenComments={onOpenComments}
                    />
                  </li>
                );
              })}
            </ul>
            {remaining > 0 ? (
              <button
                type="button"
                className="ghost-button"
                style={{ width: "100%", marginTop: "0.5rem" }}
                onClick={() =>
                  setVisibleCount((prev) => ({
                    ...prev,
                    [status]: prev[status] + PAGE_SIZE,
                  }))
                }
              >
                Mostrar mais ({remaining} restantes)
              </button>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
