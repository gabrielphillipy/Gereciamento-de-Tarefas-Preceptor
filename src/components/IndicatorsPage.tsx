import { Download } from "lucide-react";
import type { Status, User, WorkItem } from "../types";
import { statusLabel } from "../constants";
import { exportCsv } from "../utils";

export function IndicatorsPage({
  metrics,
  statusStats,
  visibleItems,
  allUsers,
}: {
  metrics: { total: number; pending: number; overdue: number; deliveries: number };
  statusStats: Array<{ status: Status; total: number }>;
  visibleItems: WorkItem[];
  allUsers: User[];
}) {
  const completionRate =
    metrics.total === 0
      ? 0
      : Math.round(
          (visibleItems.filter((item) => item.status === "concluida").length /
            metrics.total) *
            100,
        );

  return (
    <section className="management-panel" id="indicadores">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Indicadores</p>
          <h3>Resumo operacional</h3>
        </div>
        <div className="heading-actions">
          <span className="save-hint">{completionRate}% concluídas</span>
          <button
            className="ghost-button"
            type="button"
            onClick={() => exportCsv(visibleItems, allUsers)}
            disabled={visibleItems.length === 0}
            title="Exportar as demandas filtradas em CSV"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>
      <div className="insights-grid">
        {statusStats.map(({ status, total }) => (
          <article className="insight-card" key={status}>
            <span>{statusLabel[status]}</span>
            <strong>{total}</strong>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${metrics.total ? (total / metrics.total) * 100 : 0}%`,
                }}
              />
            </div>
          </article>
        ))}
      </div>
      <div className="report-grid">
        <article>
          <p className="eyebrow">Risco</p>
          <h4>{metrics.overdue} demandas atrasadas</h4>
          <p className="muted-text">
            Use esse número para priorizar renegociações de prazo.
          </p>
        </article>
        <article>
          <p className="eyebrow">Fila ativa</p>
          <h4>{metrics.pending} demandas pendentes</h4>
          <p className="muted-text">
            Inclui tarefas planejadas, em andamento e em revisão.
          </p>
        </article>
        <article>
          <p className="eyebrow">Entregas</p>
          <h4>{metrics.deliveries} entregas filtradas</h4>
          <p className="muted-text">Mostra apenas o que aparece nos filtros atuais.</p>
        </article>
      </div>
    </section>
  );
}
