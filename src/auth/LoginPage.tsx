import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "./useAuth";
import { getAuthErrorMessage } from "./authError";
import "./auth.css";

type LoginProps = {
  onNavigateSignup: () => void;
  onForgotPassword: () => void;
  onSuccess: () => void;
};

export default function LoginPage({
  onNavigateSignup,
  onForgotPassword,
  onSuccess,
}: LoginProps) {
  const { logIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError("Please enter a valid email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setBusy(true);

    try {
      await logIn(trimmedEmail, password);
      onSuccess();
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
          <div className="gradivo-auth-kicker">Welcome Back</div>
          <h1 className="gradivo-auth-title">Log in to Gradivo</h1>
          <p className="gradivo-auth-subtitle">
            Sign in to access your roadmaps, profile, and community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="gradivo-auth-form" noValidate>
          <div className="gradivo-auth-field">
            <label className="gradivo-auth-label" htmlFor="login-email">
              Email
            </label>
            <div className="gradivo-auth-input-wrapper">
              <Mail size={17} className="gradivo-auth-icon" />
              <input
                id="login-email"
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

          <div className="gradivo-auth-field">
            <label className="gradivo-auth-label" htmlFor="login-password">
              Password
            </label>
            <div className="gradivo-auth-input-wrapper">
              <LockKeyhole size={17} className="gradivo-auth-icon" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="gradivo-auth-input"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
              <button
                type="button"
                className="gradivo-auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="gradivo-auth-forgot-row">
            <button
              type="button"
              className="gradivo-auth-text-link"
              onClick={onForgotPassword}
              disabled={busy}
            >
              Forgot password?
            </button>
          </div>

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
            {busy ? "Logging in..." : "Login"}
            {!busy && <ArrowRight size={17} />}
          </button>
        </form>

        <div className="gradivo-auth-footer">
          <span>Don't have an account?</span>
          <button
            type="button"
            className="gradivo-auth-text-link"
            onClick={onNavigateSignup}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
