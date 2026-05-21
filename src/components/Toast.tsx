import { AlertCircle, CheckCircle2 } from "lucide-react";

export function Toast({
  message,
  tone,
}: {
  message: string;
  tone: "error" | "success";
}) {
  return (
    <div className={`toast toast-${tone}`} role="status" aria-live="polite">
      {tone === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      <span>{message}</span>
    </div>
  );
}
