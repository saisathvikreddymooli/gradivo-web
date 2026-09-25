import { useCallback, useEffect, useState } from "react";
import type { ThemeColors } from "./connect/types";

export type ThemeMode = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "gradivo-theme";

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function getStoredTheme(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Private mode etc: fall through to the default.
  }
  return "dark";
}

export function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return systemPrefersDark();
}

function applyThemeAttribute(isDark: boolean) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }
}

/** Single source of truth for every color used across Gradivo. */
export function themeColors(isDark: boolean): ThemeColors {
  return {
    bg: isDark ? "#070706" : "#F8F7FC",
    card: isDark ? "#101016" : "#FFFFFF",
    card2: isDark ? "#15151d" : "#F4F2F8",
    border: isDark ? "#272733" : "#E4E4E7",
    inputBorder: isDark ? "#272733" : "#D4D4D8",
    purple: isDark ? "#3B82F6" : "#2563EB",
    purple2: isDark ? "#60A5FA" : "#4F46E5",
    text: isDark ? "#f5f3ff" : "#18181b",
    muted: isDark ? "#a1a1aa" : "#71717a",
    labelText: isDark ? "#d4d4d8" : "#3f3f46",
    inputBg: isDark ? "#0b0b10" : "#ffffff",
    navBg: isDark ? "rgba(7,7,11,0.88)" : "rgba(255,255,255,0.80)",
    panel: isDark ? "rgba(16,16,22,.82)" : "rgba(255,255,255,.92)",
    glowCard: isDark
      ? "linear-gradient(135deg, rgba(59,130,246,.14), rgba(16,16,22,.9))"
      : "linear-gradient(135deg, rgba(59,130,246,.14), rgba(255,255,255,.96))",
  };
}

/**
 * Active theme: persisted choice (default "system"), live system updates,
 * and a `data-theme` attribute for pre-paint + stylesheet use.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [isDark, setIsDark] = useState<boolean>(() => resolveIsDark(getStoredTheme()));

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Storage unavailable: theme still applies for this session.
    }
    setIsDark(resolveIsDark(mode));
  }, []);

  useEffect(() => {
    if (theme !== "system" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setIsDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    applyThemeAttribute(isDark);
  }, [isDark]);

  return { theme, setTheme, isDark, colors: themeColors(isDark) };
}
