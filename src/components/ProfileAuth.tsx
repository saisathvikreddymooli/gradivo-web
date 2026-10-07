import { useEffect, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import type { ThemeColors } from "../connect/types";
import { useAuth } from "../auth/useAuth";
import { getAuthErrorMessage, logAuthError } from "../auth/authError";
import AuthScreen from "../auth/AuthScreen";

type Props = {
  children?: ReactNode;
  studentName?: string;
  onAuthName?: (name: string) => void;
  onSignupComplete?: () => void;
  colors: ThemeColors;
};

export default function ProfileAuth({ children, studentName, onAuthName, onSignupComplete, colors }: Props) {
  const { user, ready, logOut } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user?.displayName) onAuthName?.(user.displayName);
  }, [user?.displayName, onAuthName]);

  if (!ready) return <div role="status" style={{ color: colors.muted, fontSize: 14, padding: "12px 0" }}>Loading account…</div>;
  if (!user) return <AuthScreen mode={mode} colors={colors} onModeChange={setMode} onSuccess={() => { if (mode === "signup") onSignupComplete?.(); }} />;

  const name = user.displayName || studentName || "Student";

  async function handleLogout() {
    setBusy(true);
    setError("");
    try {
      await logOut();
    } catch (authError) {
      logAuthError("sign out", authError);
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ textAlign: "left" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", padding: 16, marginBottom: 22, border: `1px solid ${colors.border}`, borderRadius: 14, background: colors.card2, flexWrap: "wrap" }}>
        {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} /> : <div aria-hidden="true" style={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: "50%", color: colors.purple2, background: "rgba(59,130,246,.18)", fontWeight: 800 }}>{name.slice(0, 1).toUpperCase()}</div>}
        <div style={{ flex: 1, minWidth: 150 }}>
          <div style={{ color: colors.text, fontWeight: 750 }}>{name}</div>
          {user.email && <div style={{ marginTop: 3, color: colors.muted, fontSize: 13 }}>{user.email}</div>}
        </div>
        <button type="button" disabled={busy} onClick={handleLogout} style={{ minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 13px", border: `1px solid ${colors.border}`, borderRadius: 9, color: colors.text, background: colors.card, font: "inherit", cursor: busy ? "wait" : "pointer" }}>
          <LogOut size={16} /> {busy ? "Signing out…" : "Logout"}
        </button>
      </div>
      {error && <div role="alert" style={{ marginBottom: 12, color: "#fca5a5", fontSize: 13 }}>{error}</div>}
      {children}
    </div>
  );
}
