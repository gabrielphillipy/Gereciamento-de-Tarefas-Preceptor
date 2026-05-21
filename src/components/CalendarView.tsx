import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarPeriod, Status, User, WorkItem } from "../types";
import { today } from "../constants";
import {
  buildCalendarDays,
  groupItemsByDate,
  startOfWeek,
  toDateInputValue,
} from "../utils";
import { WorkCard } from "./WorkCard";

export function CalendarView({
  items,
  allUsers,
  selectedDate,
  onSelectDate,
  currentUser,
  onStatusChange,
  onEdit,
  onDelete,
  period,
  onPeriodChange,
  onOpenDay,
}: {
  items: WorkItem[];
  allUsers: User[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  currentUser: User;
  onStatusChange: (id: number, status: Status) => void;
  onEdit: (item: WorkItem) => void;
  onDelete: (id: number) => void;
  period: CalendarPeriod;
  onPeriodChange: (period: CalendarPeriod) => void;
  onOpenDay: (date: string) => void;
}) {
  const anchor = new Date(`${selectedDate}T00:00:00`);
  const weekStart = startOfWeek(anchor);
  const itemsByDate = groupItemsByDate(items);
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dayItems = itemsByDate[selectedDate] ?? [];

  function shift(delta: number) {
    const next = new Date(anchor);
    if (period === "dia") next.setDate(next.getDate() + delta);
    else if (period === "semana") next.setDate(next.getDate() + delta * 7);
    else if (period === "mes") next.setMonth(next.getMonth() + delta);
    else next.setFullYear(next.getFullYear() + delta);
    onSelectDate(toDateInputValue(next));
  }

  let periodTitle: string;
  if (period === "dia") {
    periodTitle = anchor.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  } else if (period === "semana") {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    periodTitle = `${weekStart.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })} – ${weekEnd.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  } else if (period === "mes") {
    periodTitle = anchor.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  } else {
    periodTitle = String(anchor.getFullYear());
  }

  const periodOptions: Array<{ value: CalendarPeriod; label: string }> = [
    { value: "dia", label: "Dia" },
    { value: "semana", label: "Semana" },
    { value: "mes", label: "Mês" },
    { value: "ano", label: "Ano" },
  ];

  return (
    <div className="calendar-shell">
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button
            className="ghost-button icon-button"
            type="button"
            onClick={() => shift(-1)}
            title="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => onSelectDate(today)}
          >
            Hoje
          </button>
          <button
            className="ghost-button icon-button"
            type="button"
            onClick={() => shift(1)}
            title="Próximo"
          >
            <ChevronRight size={18} />
          </button>
          <strong className="cal-title">{periodTitle}</strong>
        </div>
        <div className="cal-periods" aria-label="Período do calendário">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={period === option.value ? "selected" : ""}
              onClick={() => onPeriodChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {period === "mes" ? (
        <>
          <div className="calendar-weekdays">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {buildCalendarDays(anchor.getFullYear(), anchor.getMonth()).map((day) => {
              const dateItems = itemsByDate[day.date] ?? [];
              return (
                <button
                  className={`calendar-day ${
                    day.month === anchor.getMonth() ? "" : "outside-month"
                  } ${day.date === selectedDate ? "selected-day" : ""} ${
                    day.date === today ? "is-today" : ""
                  }`}
                  key={day.date}
                  type="button"
                  onClick={() => {
                    onSelectDate(day.date);
                    onOpenDay(day.date);
                  }}
                >
                  <span className="day-number">{day.label}</span>
                  <div className="day-events">
                    {dateItems.slice(0, 3).map((item) => (
                      <span className={`event-dot event-${item.kind}`} key={item.id}>
                        {item.title}
                      </span>
                    ))}
                    {dateItems.length > 3 ? (
                      <small>+{dateItems.length - 3}</small>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : period === "semana" ? (
        <div className="week-grid">
          {Array.from({ length: 7 }, (_, index) => {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + index);
            const date = toDateInputValue(day);
            const dateItems = itemsByDate[date] ?? [];
            return (
              <button
                className={`week-col ${date === today ? "is-today" : ""} ${
                  date === selectedDate ? "is-selected" : ""
                }`}
                key={date}
                type="button"
                onClick={() => {
                  onSelectDate(date);
                  onOpenDay(date);
                }}
              >
                <div className="week-col-head">
                  <span>{weekdays[day.getDay()]}</span>
                  <strong className="day-number">{day.getDate()}</strong>
                </div>
                <div className="week-col-body">
                  {dateItems.length ? (
                    dateItems.map((item) => (
                      <span className={`event-dot event-${item.kind}`} key={item.id}>
                        {item.time} · {item.title}
                      </span>
                    ))
                  ) : (
                    <em>Sem compromissos</em>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : period === "dia" ? (
        <div className="day-view">
          {dayItems.length ? (
            <div className="day-list">
              {dayItems.map((item) => (
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
                />
              ))}
            </div>
          ) : (
            <div className="empty-day">
              <strong>Nada agendado</strong>
              <p>Nenhuma demanda neste dia. Use ‹ e › para navegar.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="year-grid">
          {Array.from({ length: 12 }, (_, monthIndex) => {
            const monthName = new Date(
              anchor.getFullYear(),
              monthIndex,
              1,
            ).toLocaleDateString("pt-BR", { month: "long" });
            return (
              <button
                className="mini-month"
                key={monthIndex}
                type="button"
                onClick={() => {
                  onSelectDate(
                    `${anchor.getFullYear()}-${String(monthIndex + 1).padStart(
                      2,
                      "0",
                    )}-01`,
                  );
                  onPeriodChange("mes");
                }}
              >
                <strong>{monthName}</strong>
                <div className="mini-weekdays">
                  {["D", "S", "T", "Q", "Q", "S", "S"].map((letter, index) => (
                    <span key={index}>{letter}</span>
                  ))}
                </div>
                <div className="mini-grid">
                  {buildCalendarDays(anchor.getFullYear(), monthIndex).map((day) => {
                    const hasItems = (itemsByDate[day.date]?.length ?? 0) > 0;
                    return (
                      <span
                        className={`mini-day ${
                          day.month === monthIndex ? "" : "mini-out"
                        } ${hasItems ? "mini-has" : ""} ${
                          day.date === today ? "mini-today" : ""
                        }`}
                        key={day.date}
                      >
                        {day.label}
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
