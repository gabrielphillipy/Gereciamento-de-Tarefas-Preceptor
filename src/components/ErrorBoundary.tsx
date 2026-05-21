import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

// Captura erros de renderização e mostra uma tela amigável
// no lugar de uma página em branco.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary capturou um erro:", error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="error-screen">
        <div className="brand-mark">
          <span>P!</span>
        </div>
        <h1>Algo deu errado</h1>
        <p>Ocorreu um erro inesperado na aplicação.</p>
        {this.state.message ? <code>{this.state.message}</code> : null}
        <button
          className="primary-button"
          type="button"
          onClick={() => window.location.reload()}
        >
          Recarregar a página
        </button>
      </div>
    );
  }
}
