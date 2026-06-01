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
  | "untitled-classic"
  | "system";

export type AppearanceMode = "light" | "dark" | "system";
type ResolvedTheme =
  | "cyber-emerald"
  | "amethyst-eclipse"
  | "amber-core"
  | "untitled-classic";
type ResolvedAppearance = "light" | "dark";

const THEME_STORAGE_KEY = "projects-tracker-theme";
const MODE_STORAGE_KEY = "projects-tracker-mode";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  mode: AppearanceMode;
  resolvedMode: ResolvedAppearance;
  setMode: (mode: AppearanceMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemThemePreset(): ResolvedTheme {
  return "untitled-classic"; // Default to Untitled Classic Slate as standard system look
}

function isThemeMode(value: string | null): value is ThemeMode {
  return (
    value === "cyber-emerald" ||
    value === "amethyst-eclipse" ||
    value === "amber-core" ||
    value === "untitled-classic" ||
    value === "system"
  );
}

function isAppearanceMode(value: string | null): value is AppearanceMode {
  return value === "light" || value === "dark" || value === "system";
}

function getResolvedTheme(theme: ThemeMode): ResolvedTheme {
  return theme === "system" ? getSystemThemePreset() : theme;
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeMode(storedTheme)) {
    return storedTheme;
  }
  return "system";
}

function readStoredMode(): AppearanceMode {
  if (typeof window === "undefined") {
    return "dark"; // Default to dark mode for high-tech premium feel
  }
  const storedMode = window.localStorage.getItem(MODE_STORAGE_KEY);
  if (isAppearanceMode(storedMode)) {
    return storedMode;
  }
  return "dark";
}

function applyTheme(theme: ThemeMode, mode: AppearanceMode) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const resolvedPreset = getResolvedTheme(theme);

  // Set theme preset attribute
  root.setAttribute("data-theme", resolvedPreset);

  // Set dark/light class
  let shouldBeDark = mode === "dark";
  if (mode === "system") {
    shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  if (shouldBeDark) {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme());
  const [mode, setModeState] = useState<AppearanceMode>(() => readStoredMode());

  const resolvedTheme = useMemo(() => getResolvedTheme(theme), [theme]);

  const [resolvedMode, setResolvedMode] = useState<ResolvedAppearance>(() => {
    if (typeof window === "undefined") return "dark";
    const initialMode = readStoredMode();
    if (initialMode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return initialMode;
  });

  useEffect(() => {
    // Initial paint
    const currentTheme = readStoredTheme();
    const currentMode = readStoredMode();

    setThemeState(currentTheme);
    setModeState(currentMode);

    let isDark = currentMode === "dark";
    if (currentMode === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    setResolvedMode(isDark ? "dark" : "light");

    applyTheme(currentTheme, currentMode);
  }, []);

  useEffect(() => {
    const mediaQueryPreset = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = () => {
      let isDark = mode === "dark";
      if (mode === "system") {
        isDark = mediaQueryPreset.matches;
      }
      setResolvedMode(isDark ? "dark" : "light");
      applyTheme(theme, mode);
    };

    handleSystemChange();
    mediaQueryPreset.addEventListener("change", handleSystemChange);

    return () => {
      mediaQueryPreset.removeEventListener("change", handleSystemChange);
    };
  }, [theme, mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme) => {
        setThemeState(nextTheme);
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        applyTheme(nextTheme, mode);
      },
      mode,
      resolvedMode,
      setMode: (nextMode) => {
        setModeState(nextMode);
        window.localStorage.setItem(MODE_STORAGE_KEY, nextMode);

        let isDark = nextMode === "dark";
        if (nextMode === "system") {
          isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        setResolvedMode(isDark ? "dark" : "light");
        applyTheme(theme, nextMode);
      },
    }),
    [theme, resolvedTheme, mode, resolvedMode],
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
