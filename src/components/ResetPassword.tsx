import { useState, type FormEvent } from "react";
import { supabase } from "../supabase";

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }
    setDone(true);
    setTimeout(() => {
      supabase.auth.signOut();
    }, 1800);
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark">
          <span>P!</span>
        </div>
        <p className="eyebrow">Preceptor Tasks</p>
        <h1>Definir nova senha</h1>
        {done ? (
          <p className="form-info">
            Senha alterada com sucesso! Redirecionando para o login...
          </p>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Nova senha
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 6 caracteres"
                type="password"
                required
                minLength={6}
              />
            </label>
            <label>
              Confirmar senha
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="repita a nova senha"
                type="password"
                required
                minLength={6}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
