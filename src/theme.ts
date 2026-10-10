import { useEffect } from "react";
import type { ThemeColors } from "./connect/types";

export type ThemeMode = "dark";

export const THEME_STORAGE_KEY = "gradivo-theme";

export function getStoredTheme(): ThemeMode {
  return "dark";
}

export function resolveIsDark(_mode: ThemeMode): boolean {
  return true;
}

function applyThemeAttribute() {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = "dark";
  }
}

/** Single source of truth for every color used across Gradivo. */
export function themeColors(_isDark: boolean): ThemeColors {
  return {
    bg: "#070706",
    card: "#101016",
    card2: "#15151d",
    border: "#272733",
    inputBorder: "#272733",
    purple: "#3B82F6",
    purple2: "#60A5FA",
    text: "#f5f3ff",
    muted: "#a1a1aa",
    labelText: "#d4d4d8",
    inputBg: "#0b0b10",
    navBg: "rgba(7,7,11,0.88)",
    panel: "rgba(16,16,22,.82)",
    glowCard: "linear-gradient(135deg, rgba(59,130,246,.14), rgba(16,16,22,.9))",
  };
}

/** Gradivo always uses its dark palette, independent of browser preferences. */
export function useTheme() {
  useEffect(() => {
    applyThemeAttribute();
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    } catch {
      // The document remains dark if storage is unavailable.
    }
  }, []);

  return { theme: "dark" as const, isDark: true, colors: themeColors(true) };
}
