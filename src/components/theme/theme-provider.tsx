"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode =
  | "cyber-emerald"
  | "amethyst-eclipse"
  | "amber-core"
  | "system";
type ResolvedTheme = "cyber-emerald" | "amethyst-eclipse" | "amber-core";

const THEME_STORAGE_KEY = "projects-tracker-theme";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  return "cyber-emerald";
}

function isThemeMode(value: string | null): value is ThemeMode {
  return (
    value === "cyber-emerald" ||
    value === "amethyst-eclipse" ||
    value === "amber-core" ||
    value === "system"
  );
}

function getResolvedTheme(theme: ThemeMode): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (isThemeMode(storedTheme)) {
    return storedTheme;
  }

  // Fallback for legacy dark theme setting
  if (storedTheme === "dark" || storedTheme === "light") {
    return "cyber-emerald";
  }

  return "system";
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const resolvedTheme = getResolvedTheme(theme);

  if (theme === "system") {
    root.setAttribute("data-theme", resolvedTheme);
  } else {
    root.setAttribute("data-theme", theme);
  }

  root.style.colorScheme = "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    getResolvedTheme(readStoredTheme()),
  );

  useEffect(() => {
    const currentTheme = readStoredTheme();
    const nextResolvedTheme = getResolvedTheme(currentTheme);

    setThemeState(currentTheme);
    setResolvedTheme(nextResolvedTheme);
    applyTheme(currentTheme);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      if (theme !== "system") {
        return;
      }

      const nextResolvedTheme = getResolvedTheme("system");
      setResolvedTheme(nextResolvedTheme);
      applyTheme("system");
    };

    handleSystemThemeChange();
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme) => {
        const nextResolvedTheme = getResolvedTheme(nextTheme);

        setThemeState(nextTheme);
        setResolvedTheme(nextResolvedTheme);

        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        applyTheme(nextTheme);
      },
    }),
    [resolvedTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }

  return context;
}
