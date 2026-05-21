import { useState } from "react";
import { Bell, X } from "lucide-react";
import type { WorkItem } from "../types";
import { today } from "../constants";
import { addDays, formatDate, isOverdue } from "../utils";

export function NotificationCenter({ items }: { items: WorkItem[] }) {
  const [open, setOpen] = useState(false);

  const overdue = items.filter((item) => isOverdue(item));
  const dueToday = items.filter(
    (item) => item.status !== "concluida" && item.date === today,
  );
  const soonLimit = addDays(today, 3);
  const dueSoon = items.filter(
    (item) =>
      item.status !== "concluida" && item.date > today && item.date <= soonLimit,
  );
  const urgentCount = overdue.length + dueToday.length;

  const groups = [
    { label: "Atrasadas", tone: "coral", list: overdue },
    { label: "Para hoje", tone: "amber", list: dueToday },
    { label: "Próximos dias", tone: "blue", list: dueSoon },
  ].filter((group) => group.list.length > 0);

  return (
    <div className="notif">
      <button
        className="notif-bell"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notificações"
        title="Notificações"
      >
        <Bell size={18} />
        {urgentCount > 0 ? <span className="notif-badge">{urgentCount}</span> : null}
      </button>
      {open ? (
        <>
          <div className="notif-backdrop" onClick={() => setOpen(false)} />
          <div className="notif-panel" role="dialog" aria-label="Notificações">
            <div className="notif-head">
              <strong>Notificações</strong>
              <button
                className="ghost-button icon-button"
                type="button"
                onClick={() => setOpen(false)}
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>
            {groups.length === 0 ? (
              <p className="muted-text notif-empty">
                Nenhum prazo próximo. Tudo em dia.
              </p>
            ) : (
              groups.map((group) => (
                <div className="notif-group" key={group.label}>
                  <span className={`notif-tag notif-tag-${group.tone}`}>
                    {group.label} · {group.list.length}
                  </span>
                  {group.list.map((item) => (
                    <div className="notif-row" key={item.id}>
                      <span>{item.title}</span>
                      <small>
                        {formatDate(item.date)} às {item.time}
                      </small>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
