import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "./useAuth";
import { getAuthErrorMessage } from "./authError";
import SocialButtons from "./SocialButtons";
import "./auth.css";

type SignUpProps = {
  onNavigateLogin: () => void;
  onSuccess: () => void;
};

export default function SignUpPage({ onNavigateLogin, onSuccess }: SignUpProps) {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError("Please enter a valid email.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password is too weak. Must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      await signUp(trimmedName, trimmedEmail, password);
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
          <div className="gradivo-auth-kicker">Start Your Journey</div>
          <h1 className="gradivo-auth-title">Create your account</h1>
          <p className="gradivo-auth-subtitle">
            Join Gradivo to plan your tech roadmap and connect with peers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="gradivo-auth-form" noValidate>
          <div className="gradivo-auth-field">
            <label className="gradivo-auth-label" htmlFor="signup-name">
              Name
            </label>
            <div className="gradivo-auth-input-wrapper">
              <UserRound size={17} className="gradivo-auth-icon" />
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                className="gradivo-auth-input"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="gradivo-auth-field">
            <label className="gradivo-auth-label" htmlFor="signup-email">
              Email
            </label>
            <div className="gradivo-auth-input-wrapper">
              <Mail size={17} className="gradivo-auth-icon" />
              <input
                id="signup-email"
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
            <label className="gradivo-auth-label" htmlFor="signup-password">
              Password
            </label>
            <div className="gradivo-auth-input-wrapper">
              <LockKeyhole size={17} className="gradivo-auth-icon" />
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="gradivo-auth-input"
                placeholder="At least 6 characters"
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

          <div className="gradivo-auth-field">
            <label className="gradivo-auth-label" htmlFor="signup-confirm-password">
              Confirm Password
            </label>
            <div className="gradivo-auth-input-wrapper">
              <LockKeyhole size={17} className="gradivo-auth-icon" />
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                className="gradivo-auth-input"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={busy}
              />
              <button
                type="button"
                className="gradivo-auth-eye-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
            {busy ? "Creating Account..." : "Create Account"}
            {!busy && <ArrowRight size={17} />}
          </button>
        </form>

        <div className="gradivo-auth-divider" aria-hidden="true">
          or continue with
        </div>
        <SocialButtons onSuccess={onSuccess} />

        <div className="gradivo-auth-footer">
          <span>Already have an account?</span>
          <button
            type="button"
            className="gradivo-auth-text-link"
            onClick={onNavigateLogin}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
