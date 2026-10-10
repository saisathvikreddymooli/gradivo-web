import { useState } from "react";
import { useAuth } from "./useAuth";
import { getAuthErrorMessage } from "./authError";

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.6 7.5l6.3 5.3C37.9 38.1 44 32 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

type SocialButtonsProps = {
  onSuccess: () => void;
};

export default function SocialButtons({ onSuccess }: SocialButtonsProps) {
  const { signInWithGoogle, signInWithLinkedIn } = useAuth();
  const [error, setError] = useState("");
  const [busyProvider, setBusyProvider] = useState<"google" | "linkedin" | null>(null);

  async function handleProvider(kind: "google" | "linkedin") {
    if (busyProvider) return;
    setBusyProvider(kind);
    setError("");
    try {
      const user =
        kind === "google" ? await signInWithGoogle() : await signInWithLinkedIn();
      if (user) {
        onSuccess();
      }
      // null means a redirect fallback started; completion arrives on reload.
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusyProvider(null);
    }
  }

  return (
    <div>
      <div style={{ display: "grid", gap: 10 }}>
        <button
          type="button"
          className="gradivo-auth-social-btn"
          onClick={() => handleProvider("google")}
          disabled={busyProvider !== null}
          aria-label="Continue with Google"
        >
          <GoogleMark />
          {busyProvider === "google" ? "Connecting…" : "Continue with Google"}
        </button>
        <button
          type="button"
          className="gradivo-auth-social-btn"
          onClick={() => handleProvider("linkedin")}
          disabled={busyProvider !== null}
          aria-label="Continue with LinkedIn"
        >
          <LinkedInMark />
          {busyProvider === "linkedin" ? "Connecting…" : "Continue with LinkedIn"}
        </button>
      </div>
      {error && (
        <div className="gradivo-auth-error" role="alert" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}
    </div>
  );
}
