import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Send, Trash2, X } from "lucide-react";
import type { Comment, User, WorkItem } from "../types";
import { supabase } from "../supabase";
import { formatDateTime, initials, mapComment } from "../utils";

export function CommentsModal({
  item,
  currentUser,
  allUsers,
  onClose,
}: {
  item: WorkItem;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fetchComments = useCallback(async () => {
    const { data, error: fetchErr } = await supabase
      .from("work_item_comments")
      .select("*")
      .eq("work_item_id", item.id)
      .order("created_at", { ascending: true });
    if (fetchErr) {
      console.error("fetchComments:", fetchErr);
      setError(`Não foi possível carregar comentários: ${fetchErr.message}`);
      setLoading(false);
      return;
    }
    setComments((data ?? []).map(mapComment));
    setLoading(false);
  }, [item.id]);

  useEffect(() => {
    fetchComments();
    const channel = supabase
      .channel(`comments-${item.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "work_item_comments",
          filter: `work_item_id=eq.${item.id}`,
        },
        () => {
          fetchComments();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [item.id, fetchComments]);

  async function addComment() {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setError("");
    const { error: insErr } = await supabase.from("work_item_comments").insert({
      work_item_id: item.id,
      author_id: currentUser.id,
      body,
    });
    setBusy(false);
    if (insErr) {
      console.error("addComment:", insErr);
      setError(`Não foi possível enviar: ${insErr.message}`);
      return;
    }
    setText("");
    // realtime fará o refetch
  }

  async function removeComment(c: Comment) {
    if (!window.confirm("Excluir este comentário?")) return;
    setBusy(true);
    setError("");
    const { error: rmErr } = await supabase
      .from("work_item_comments")
      .delete()
      .eq("id", c.id);
    setBusy(false);
    if (rmErr) {
      console.error("removeComment:", rmErr);
      setError(`Não foi possível excluir: ${rmErr.message}`);
    }
    // realtime atualiza a lista
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card comments-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">
              <MessageSquare size={12} /> Comentários
            </p>
            <h3>{item.title}</h3>
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

        <div className="modal-body comments-body">
          {loading ? (
            <p className="muted-text">Carregando...</p>
          ) : comments.length === 0 ? (
            <p className="muted-text comments-empty">
              Nenhum comentário ainda. Seja o primeiro a escrever.
            </p>
          ) : (
            <ul className="comment-list">
              {comments.map((c) => {
                const author = allUsers.find((u) => u.id === c.authorId);
                const isMine = c.authorId === currentUser.id;
                const canDelete = isMine || currentUser.role === "gestor";
                return (
                  <li
                    key={c.id}
                    className={`comment-row${isMine ? " mine" : ""}`}
                  >
                    <div className="comment-avatar">
                      {initials(author?.name ?? "?")}
                    </div>
                    <div className="comment-content">
                      <div className="comment-meta">
                        <strong>{author?.name ?? "Usuário"}</strong>
                        <small>{formatDateTime(c.createdAt)}</small>
                        {canDelete ? (
                          <button
                            type="button"
                            className="ghost-button icon-button comment-delete"
                            onClick={() => removeComment(c)}
                            disabled={busy}
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : null}
                      </div>
                      <p>{c.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {error ? <p className="form-error">{error}</p> : null}

          <div className="comment-add">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Escreva um comentário..."
              rows={3}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  addComment();
                }
              }}
            />
            <button
              className="primary-button"
              type="button"
              onClick={addComment}
              disabled={!text.trim() || busy}
            >
              <Send size={16} />
              {busy ? "Enviando..." : "Comentar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
