import { useEffect, useState } from "react";
import { applyTheme, getInitialTheme, type Theme } from "../theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggle() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  return { theme, toggle, setTheme };
}
