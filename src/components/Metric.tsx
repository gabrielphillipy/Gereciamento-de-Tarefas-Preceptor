import type { ReactNode } from "react";

export function Metric({
  icon,
  label,
  value,
  caption,
  ratio,
  tone,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  caption: string;
  ratio: number;
  tone?: "amber" | "coral" | "green";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`metric-card${tone ? ` tone-${tone}` : ""}`}
      onClick={onClick}
    >
      <div className="metric-top">
        <div className="metric-icon">{icon}</div>
        <span className="metric-trend">{caption}</span>
      </div>
      <strong>{value}</strong>
      <span className="metric-label">{label}</span>
      <div className="metric-bar">
        <span style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }} />
      </div>
    </button>
  );
}
