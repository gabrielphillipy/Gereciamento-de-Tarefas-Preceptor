// ─── Tema: claro / escuro ────────────────────────────────────
// O tema vivo fica em `data-theme="dark"` no <html>. As variáveis
// CSS (styles.css) reagem a esse atributo. O usuário pode alternar
// pelo botão ThemeToggle; a preferência persiste em localStorage.

export type Theme = "light" | "dark";

const STORAGE_KEY = "preceptor-theme";

export function getStoredTheme(): Theme | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return null;
  } catch {
    return null;
  }
}

export function getInitialTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

export function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* modo privado / quota: ignora */
    }
  }
}

// Aplica o tema inicial sincronamente antes do React renderizar,
// evitando o flash de tema claro em quem prefere escuro.
export function applyInitialTheme() {
  applyTheme(getInitialTheme());
}
