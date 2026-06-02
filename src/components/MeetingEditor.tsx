import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import type { MeetingGoal, User, WorkItem } from "../types";
import { findPreviousMeeting, formatDate, newGoalId } from "../utils";

export type MeetingPatch = {
  meetingSummary?: string;
  meetingGoals?: MeetingGoal[];
};

export function MeetingEditor({
  meeting,
  items,
  allUsers,
  onSave,
  onClose,
}: {
  meeting: WorkItem;
  items: WorkItem[];
  allUsers: User[];
  onSave: (id: number, patch: MeetingPatch) => Promise<void>;
  onClose: () => void;
}) {
  const owner = allUsers.find((u) => u.id === meeting.ownerId);
  const previous = useMemo(
    () => findPreviousMeeting(items, meeting),
    [items, meeting],
  );

  const [summary, setSummary] = useState(meeting.meetingSummary);
  const [goals, setGoals] = useState<MeetingGoal[]>(meeting.meetingGoals);
  const [newGoalText, setNewGoalText] = useState("");
  const [prevGoals, setPrevGoals] = useState<MeetingGoal[]>(
    previous?.meetingGoals ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Quando a reunião selecionada (ou a anterior) muda, recarrega o estado.
  useEffect(() => {
    setSummary(meeting.meetingSummary);
    setGoals(meeting.meetingGoals);
  }, [meeting]);

  useEffect(() => {
    setPrevGoals(previous?.meetingGoals ?? []);
  }, [previous]);

  function addGoal() {
    const text = newGoalText.trim();
    if (!text) return;
    setGoals([...goals, { id: newGoalId(), text, done: false }]);
    setNewGoalText("");
  }

  function removeGoal(id: string) {
    setGoals(goals.filter((g) => g.id !== id));
  }

  function togglePrev(id: string) {
    setPrevGoals(
      prevGoals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    );
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await onSave(meeting.id, { meetingSummary: summary, meetingGoals: goals });
      if (previous) {
        await onSave(previous.id, { meetingGoals: prevGoals });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar a reunião.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card meeting-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">Reunião · {owner?.name ?? "—"}</p>
            <h3>{meeting.title}</h3>
            <small className="muted-text">
              {formatDate(meeting.date)} às {meeting.time}
            </small>
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

        <div className="modal-body meeting-body">
          {previous && prevGoals.length > 0 ? (
            <section className="meeting-section">
              <p className="eyebrow">Cobrança da reunião anterior</p>
              <p className="muted-text meeting-prev-sub">
                {formatDate(previous.date)} — marque o que o colaborador entregou.
              </p>
              <div className="goal-checklist">
                {prevGoals.map((goal) => (
                  <label
                    key={goal.id}
                    className={`goal-row${goal.done ? " done" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={goal.done}
                      onChange={() => togglePrev(goal.id)}
                    />
                    <span>{goal.text}</span>
                  </label>
                ))}
              </div>
            </section>
          ) : previous ? (
            <section className="meeting-section">
              <p className="eyebrow">Cobrança da reunião anterior</p>
              <p className="muted-text">
                A reunião de {formatDate(previous.date)} não teve metas registradas.
              </p>
            </section>
          ) : (
            <section className="meeting-section">
              <p className="eyebrow">Cobrança da reunião anterior</p>
              <p className="muted-text">
                Primeira reunião registrada com este colaborador.
              </p>
            </section>
          )}

          <section className="meeting-section">
            <p className="eyebrow">O que foi falado</p>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Resumo, decisões, pontos discutidos..."
              rows={6}
            />
          </section>

          <section className="meeting-section">
            <p className="eyebrow">Metas para a próxima reunião</p>
            <div className="goal-editor">
              {goals.length === 0 ? (
                <p className="muted-text">Nenhuma meta definida ainda.</p>
              ) : (
                <div className="goal-list">
                  {goals.map((goal) => (
                    <div key={goal.id} className="goal-edit-row">
                      <span>{goal.text}</span>
                      <button
                        className="ghost-button icon-button"
                        type="button"
                        onClick={() => removeGoal(goal.id)}
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="goal-add">
                <input
                  value={newGoalText}
                  onChange={(event) => setNewGoalText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addGoal();
                    }
                  }}
                  placeholder="Ex: Entregar briefing aprovado"
                />
                <button
                  className="ghost-button"
                  type="button"
                  onClick={addGoal}
                  disabled={!newGoalText.trim()}
                >
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
            </div>
          </section>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="form-actions">
            <button
              className="primary-button"
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={18} />
              {saving ? "Salvando..." : "Salvar reunião"}
            </button>
            <button className="ghost-button" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
