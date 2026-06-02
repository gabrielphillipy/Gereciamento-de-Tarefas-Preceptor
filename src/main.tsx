import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles.css";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN as string,
    environment: (import.meta.env.VITE_APP_ENV as string) ?? "development",
    tracesSampleRate: 0.2,
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
