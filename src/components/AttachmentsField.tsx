import { useRef, useState } from "react";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import type { Attachment } from "../types";
import { supabase } from "../supabase";
import { formatBytes, newGoalId } from "../utils";

const BUCKET = "work-attachments";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
]);

export function AttachmentsField({
  attachments,
  onChange,
  userId,
}: {
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
  userId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setBusy(true);
    setError("");
    const added: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" ultrapassa o limite de 10 MB.`);
        break;
      }
      if (!ALLOWED_TYPES.has(file.type)) {
        setError(
          `Tipo de arquivo não permitido: "${file.type || "desconhecido"}". Use imagens, PDF, documentos Office ou ZIP.`,
        );
        break;
      }
      const safeName = file.name.replace(/[^\w.-]/g, "_");
      const path = `${userId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });
      if (upErr) {
        console.error("upload:", upErr);
        setError(`Falha ao enviar "${file.name}": ${upErr.message}`);
        break;
      }
      added.push({
        id: newGoalId(),
        name: file.name,
        path,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      });
    }
    if (added.length) onChange([...attachments, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function remove(att: Attachment) {
    if (!window.confirm(`Remover o anexo "${att.name}"?`)) return;
    setBusy(true);
    setError("");
    const { error: rmErr } = await supabase.storage
      .from(BUCKET)
      .remove([att.path]);
    if (rmErr) {
      console.error("removeAttachment:", rmErr);
      setError(`Falha ao remover: ${rmErr.message}`);
      setBusy(false);
      return;
    }
    onChange(attachments.filter((a) => a.id !== att.id));
    setBusy(false);
  }

  async function download(att: Attachment) {
    setError("");
    const { data, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(att.path, 60);
    if (signErr || !data?.signedUrl) {
      console.error("signedUrl:", signErr);
      setError(`Falha ao gerar link: ${signErr?.message ?? "erro desconhecido"}`);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="attachments-field">
      <div className="attachments-head">
        <span className="attachments-title">
          <Paperclip size={14} />
          Anexos {attachments.length > 0 ? `(${attachments.length})` : ""}
        </span>
        <button
          type="button"
          className="ghost-button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Upload size={14} />
          {busy ? "Enviando..." : "Adicionar arquivo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files?.length) handleFiles(event.target.files);
          }}
        />
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {attachments.length === 0 ? (
        <p className="muted-text attachments-empty">Nenhum arquivo anexado.</p>
      ) : (
        <ul className="attachments-list">
          {attachments.map((att) => (
            <li key={att.id} className="attachments-row">
              <button
                type="button"
                className="attachments-name"
                onClick={() => download(att)}
                title="Baixar"
              >
                <Download size={14} />
                <span>{att.name}</span>
                <small>{formatBytes(att.size)}</small>
              </button>
              <button
                type="button"
                className="ghost-button icon-button"
                onClick={() => remove(att)}
                title="Remover"
                disabled={busy}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
