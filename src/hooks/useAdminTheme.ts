import { useCallback, useEffect, useState } from "react";

const KEY = "admin-theme";
type Theme = "light" | "dark";

/** Admin-only theme: applies `dark` on <html> while the admin panel is mounted. */
export function useAdminTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(KEY) === "dark" ? "dark" : "light"));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(KEY, theme);
    return () => root.classList.remove("dark");
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  return { theme, toggle };
}
