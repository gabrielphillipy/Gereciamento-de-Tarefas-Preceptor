import { useState } from "react";
import type { Status, User, WorkItem } from "../types";
import { statusLabel } from "../constants";
import { WorkCard } from "./WorkCard";

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
                        currentUser.role === "gestor" ||
                        item.ownerId === currentUser.id
                      }
                      onStatusChange={onStatusChange}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onOpenComments={onOpenComments}
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
