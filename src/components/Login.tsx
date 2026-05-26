import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "../supabase";

export function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError("");
    setInfo("");
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) setError("Email ou senha incorretos.");
    setSubmitting(false);
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim(), team: team.trim() } },
    });

    setSubmitting(false);

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes("password") || msg.includes("senha")) {
        setError(
          "A senha precisa ter ao menos 8 caracteres, incluindo letras e números.",
        );
        return;
      }
      // Demais erros (notavelmente "user already registered"): cai no
      // mesmo fluxo de sucesso para impedir enumeração de e-mails.
    }

    setInfo(
      "Se for um novo cadastro, enviamos um e-mail de confirmação. Caso já tenha conta, faça login.",
    );
    switchMode("login");
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Digite seu email no campo acima para receber o link.");
      return;
    }
    setError("");
    setInfo("");
    setSubmitting(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    setSubmitting(false);
    // Mensagem fixa, independente de o e-mail existir ou não — evita
    // que um atacante descubra quais contas estão cadastradas.
    setInfo(
      "Se este e-mail estiver cadastrado, enviaremos um link de redefinição.",
    );
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark">
          <span>P!</span>
        </div>
        <p className="eyebrow">Preceptor Tasks</p>
        <h1>Gestão de tarefas, agenda e entregas da equipe</h1>

        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === "login" ? " active" : ""}`}
            onClick={() => switchMode("login")}
            type="button"
          >
            Entrar
          </button>
          <button
            className={`auth-tab${mode === "register" ? " active" : ""}`}
            onClick={() => switchMode("register")}
            type="button"
          >
            Criar conta
          </button>
        </div>

        {info ? <p className="form-info">{info}</p> : null}

        {mode === "login" ? (
          <form className="login-form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                type="email"
                required
              />
            </label>
            <label>
              Senha
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="senha"
                type="password"
                required
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </button>
            <button
              type="button"
              className="link-button"
              onClick={handleForgotPassword}
            >
              Esqueci minha senha
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleRegister}>
            <label>
              Nome completo
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </label>
            <label>
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                type="email"
                required
              />
            </label>
            <label>
              Senha
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mín. 8 caracteres, com letras e números"
                type="password"
                required
                minLength={8}
                pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
                title="A senha precisa ter ao menos 8 caracteres, incluindo letras e números."
              />
            </label>
            <label>
              Equipe
              <input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="Ex: Marketing"
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Criando conta..." : "Criar conta"}
            </button>
          </form>
        )}
      </section>

      <section className="login-preview">
        <div className="preview-topline">
          <Sparkles size={18} />
          <span>Planejamento operacional</span>
        </div>
        <div className="preview-board">
          <div>
            <strong>Agenda sincronizada</strong>
            <p>
              Demandas salvas no banco de dados, acessíveis de qualquer dispositivo.
            </p>
          </div>
          <div>
            <strong>Kanban</strong>
            <p>Gestor e equipe acompanham status por etapa de trabalho.</p>
          </div>
          <div>
            <strong>Colaboração</strong>
            <p>
              Gestor cria e distribui tarefas. Equipe atualiza o progresso em tempo
              real.
            </p>
          </div>
        </div>
        <div className="preview-metrics">
          <span>4 status de fluxo</span>
          <span>Multiusuário</span>
          <span>Tempo real</span>
        </div>
      </section>
    </main>
  );
}
