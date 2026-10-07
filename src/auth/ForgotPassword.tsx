import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { useAuth } from "./useAuth";
import { getAuthErrorMessage } from "./authError";
import "./auth.css";

type ForgotPasswordProps = {
  onBackToLogin: () => void;
};

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError("Please enter a valid email.");
      return;
    }

    setBusy(true);

    try {
      await sendPasswordReset(trimmedEmail);
      setNotice(
        "A password reset link has been sent to your email. Please check your inbox (and spam folder).",
      );
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gradivo-auth-page">
      <div className="gradivo-auth-glow" aria-hidden="true" />
      <div className="gradivo-auth-card">
        <div className="gradivo-auth-header">
          <div className="gradivo-auth-mark" aria-hidden="true">
            <span>G</span>
          </div>
          <div className="gradivo-auth-kicker">Account Recovery</div>
          <h1 className="gradivo-auth-title">Reset your password</h1>
          <p className="gradivo-auth-subtitle">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="gradivo-auth-form" noValidate>
          <div className="gradivo-auth-field">
            <label className="gradivo-auth-label" htmlFor="reset-email">
              Email Address
            </label>
            <div className="gradivo-auth-input-wrapper">
              <Mail size={17} className="gradivo-auth-icon" />
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                className="gradivo-auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          {notice && (
            <div className="gradivo-auth-notice" role="status">
              {notice}
            </div>
          )}

          {error && (
            <div className="gradivo-auth-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="gradivo-auth-submit-btn"
            disabled={busy}
          >
            {busy ? "Sending Link..." : "Send Reset Link"}
            {!busy && <ArrowRight size={17} />}
          </button>
        </form>

        <div className="gradivo-auth-footer">
          <button
            type="button"
            className="gradivo-auth-text-link"
            onClick={onBackToLogin}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft size={15} /> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
