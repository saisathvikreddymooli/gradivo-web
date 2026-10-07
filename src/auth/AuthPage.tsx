import { useEffect } from "react";
import type { ThemeColors } from "../connect/types";
import { useAuth } from "./useAuth";
import AuthScreen, { type AuthMode } from "./AuthScreen";

type AuthPageProps = {
  mode: AuthMode;
  colors?: ThemeColors;
  onModeChange: (mode: AuthMode) => void;
  onSuccess: () => void;
  onAuthenticated: () => void;
};

export default function AuthPage({
  mode,
  colors,
  onModeChange,
  onSuccess,
  onAuthenticated,
}: AuthPageProps) {
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && user) {
      onAuthenticated();
    }
  }, [ready, user, onAuthenticated]);

  if (ready && user) {
    return (
      <div
        style={{
          minHeight: "50vh",
          display: "grid",
          placeItems: "center",
          color: colors?.muted || "#a1a1aa",
          fontSize: 14,
        }}
      >
        Redirecting to profile...
      </div>
    );
  }

  return (
    <AuthScreen
      mode={mode}
      colors={colors}
      onModeChange={onModeChange}
      onSuccess={onSuccess}
    />
  );
}
