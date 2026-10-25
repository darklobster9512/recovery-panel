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
    // Every admin tab remounts the panel; only drop dark mode when leaving /admin.
    return () => {
      setTimeout(() => { if (!window.location.pathname.startsWith("/admin")) root.classList.remove("dark"); }, 0);
    };
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  return { theme, toggle };
}
