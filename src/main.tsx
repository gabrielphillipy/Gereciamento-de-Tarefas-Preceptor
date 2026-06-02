import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles.css";
import { applyInitialTheme } from "./theme";

// Aplica o tema (claro/escuro) antes do React renderizar para
// evitar flash de tema claro em quem prefere escuro.
applyInitialTheme();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
