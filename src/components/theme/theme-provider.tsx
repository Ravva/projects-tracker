"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "cyber-emerald" | "amethyst-eclipse" | "system";
type ResolvedTheme = "cyber-emerald" | "amethyst-eclipse";

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

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (
    storedTheme === "cyber-emerald" ||
    storedTheme === "amethyst-eclipse" ||
    storedTheme === "system"
  ) {
    return storedTheme;
  }

  // Fallback for legacy dark theme setting
  if (storedTheme === "dark" || storedTheme === "light") {
    return "cyber-emerald";
  }

  return "system";
}

function applyTheme(theme: ThemeMode, resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;

  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }

  root.style.colorScheme = "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] =
    useState<ResolvedTheme>("cyber-emerald");

  useEffect(() => {
    const currentTheme = readStoredTheme();
    const nextResolvedTheme =
      currentTheme === "system" ? getSystemTheme() : currentTheme;

    setTheme(currentTheme);
    setResolvedTheme(nextResolvedTheme);
    applyTheme(currentTheme, nextResolvedTheme);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      if (theme !== "system") {
        return;
      }

      const nextResolvedTheme = getSystemTheme();
      setResolvedTheme(nextResolvedTheme);
      applyTheme("system", nextResolvedTheme);
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
        const nextResolvedTheme =
          nextTheme === "system" ? getSystemTheme() : nextTheme;

        setTheme(nextTheme);
        setResolvedTheme(nextResolvedTheme);

        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        applyTheme(nextTheme, nextResolvedTheme);
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
