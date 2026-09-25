import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { LogOut, Mail, Phone } from "lucide-react";
import { auth } from "../firebase/config";
import type { ThemeColors } from "../connect/types";

type Mode = "login" | "signup";
type Method = "email" | "phone";

type ProfileAuthProps = {
  children?: ReactNode;
  studentName?: string;
  onAuthName?: (name: string) => void;
  colors?: ThemeColors;
};

const fallbackColors: ThemeColors = {
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

function mapAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/missing-password":
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/email-already-in-use":
      return "An account already exists with this email. Try logging in.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/invalid-phone-number":
    case "auth/missing-phone-number":
      return "Please enter a valid phone number with country code.";
    case "auth/invalid-verification-code":
      return "That OTP is incorrect. Please try again.";
    case "auth/code-expired":
    case "auth/session-expired":
      return "This OTP has expired. Request a new one.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/quota-exceeded":
      return "SMS quota exceeded. Try again later or use another sign-in method.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked. Allow popups and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled in Firebase Authentication.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function normalizePhone(countryCode: string, phone: string): string {
  const trimmed = phone.trim().replace(/[\s-]/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  return `${countryCode}${digits}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.6 7.5l6.3 5.3C37.9 38.1 44 32 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export default function ProfileAuth({
  children,
  studentName,
  onAuthName,
  colors,
}: ProfileAuthProps) {
  const c = colors ?? fallbackColors;
  const purple = c.purple;
  const purple2 = c.purple2;
  const border = c.border;
  const card2 = c.card2;
  const muted = c.muted;

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 9,
    border: `1px solid ${c.inputBorder}`,
    background: c.inputBg,
    color: c.text,
    outline: "none",
    fontSize: 14,
  };

  const fieldLabel: CSSProperties = {
    display: "grid",
    gap: 8,
    color: c.labelText,
    fontSize: 13,
    fontWeight: 650,
    textAlign: "left",
  };

  const primaryBtn: CSSProperties = {
    border: "none",
    background: purple,
    color: "white",
    padding: "12px 18px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    width: "100%",
    fontSize: 14,
    boxShadow: "0 8px 30px rgba(59,130,246,.2)",
  };

  const secondaryBtn: CSSProperties = {
    border: `1px solid ${border}`,
    background: card2,
    color: c.text,
    padding: "12px 18px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 650,
    width: "100%",
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  };

  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [method, setMethod] = useState<Method>("email");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const recaptchaHostRef = useRef<HTMLDivElement | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const onAuthNameRef = useRef(onAuthName);
  useEffect(() => {
    onAuthNameRef.current = onAuthName;
  }, [onAuthName]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setReady(true);
      if (next?.displayName) onAuthNameRef.current?.(next.displayName);
    });

    getRedirectResult(auth).catch((err: { code?: string }) => {
      if (err?.code) setError(mapAuthError(err.code));
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    return () => {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    };
  }, []);

  function resetMessages() {
    setError("");
    setInfo("");
  }

  function ensureRecaptcha(): RecaptchaVerifier {
    if (recaptchaRef.current) return recaptchaRef.current;
    if (!recaptchaHostRef.current) {
      throw new Error("Phone verification is not ready. Please try again.");
    }
    recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaHostRef.current, {
      size: "invisible",
    });
    return recaptchaRef.current;
  }

  async function resetRecaptcha() {
    recaptchaRef.current?.clear();
    recaptchaRef.current = null;
  }

  async function handleGoogle() {
    resetMessages();
    setBusy(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/popup-blocked") {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          setError(mapAuthError((redirectErr as { code?: string }).code ?? ""));
        }
      } else {
        setError(mapAuthError(code));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleEmail(event: FormEvent) {
    event.preventDefault();
    resetMessages();

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
    } catch (err) {
      setError(mapAuthError((err as { code?: string }).code ?? ""));
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp(isResend = false) {
    resetMessages();
    const formatted = normalizePhone(countryCode, phone);
    if (!/^\+\d{8,15}$/.test(formatted)) {
      setError("Please enter a valid phone number with country code.");
      return;
    }

    setBusy(true);
    try {
      if (isResend) await resetRecaptcha();
      const verifier = ensureRecaptcha();
      confirmationRef.current = await signInWithPhoneNumber(auth, formatted, verifier);
      setOtpSent(true);
      setOtp("");
      setResendIn(60);
      setInfo(isResend ? "A new OTP has been sent." : "OTP sent. Check your phone.");
    } catch (err) {
      await resetRecaptcha();
      setError(mapAuthError((err as { code?: string }).code ?? ""));
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    resetMessages();
    if (!confirmationRef.current) {
      setError("Request an OTP first.");
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setBusy(true);
    try {
      await confirmationRef.current.confirm(otp.trim());
    } catch (err) {
      setError(mapAuthError((err as { code?: string }).code ?? ""));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    resetMessages();
    setBusy(true);
    try {
      await signOut(auth);
      setOtpSent(false);
      setOtp("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(mapAuthError((err as { code?: string }).code ?? ""));
    } finally {
      setBusy(false);
    }
  }

  async function saveMissingName() {
    if (!user || !studentName?.trim()) {
      setError("Enter your name in the profile form below.");
      return;
    }
    setBusy(true);
    resetMessages();
    try {
      await updateProfile(user, { displayName: studentName.trim() });
      await user.reload();
      setUser(auth.currentUser);
      setInfo("Name saved.");
    } catch (err) {
      setError(mapAuthError((err as { code?: string }).code ?? ""));
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div style={{ color: muted, fontSize: 14, padding: "12px 0", textAlign: "left" }}>
        Loading account…
      </div>
    );
  }

  if (user) {
    const name = user.displayName || studentName || "";
    const emailValue = user.email;
    const phoneValue = user.phoneNumber;
    const photo = user.photoURL;
    const missingName = !user.displayName;

    return (
      <div style={{ textAlign: "left" }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            padding: 16,
            borderRadius: 14,
            border: `1px solid ${border}`,
            background: card2,
            marginBottom: 22,
            flexWrap: "wrap",
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt=""
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                objectFit: "cover",
                border: `1px solid ${border}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(59,130,246,.18)",
                color: purple2,
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              {(name || emailValue || phoneValue || "G").slice(0, 1).toUpperCase()}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 750, fontSize: 18 }}>
              {name || "Student"}
            </div>
            {emailValue ? (
              <div style={{ color: muted, fontSize: 13, marginTop: 4 }}>{emailValue}</div>
            ) : null}
            {phoneValue ? (
              <div style={{ color: muted, fontSize: 13, marginTop: 4 }}>{phoneValue}</div>
            ) : null}
            {!emailValue && !phoneValue ? (
              <div style={{ color: muted, fontSize: 13, marginTop: 4 }}>Signed in</div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            style={{
              ...secondaryBtn,
              width: "auto",
              padding: "10px 14px",
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {missingName ? (
          <div
            style={{
              marginBottom: 18,
              padding: 14,
              borderRadius: 12,
              border: "1px solid rgba(59,130,246,.35)",
              background: "rgba(59,130,246,.08)",
              color: muted,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Add your name in the profile fields below, then save it to your account.
            {studentName?.trim() ? (
              <button
                type="button"
                onClick={saveMissingName}
                disabled={busy}
                style={{ ...primaryBtn, width: "auto", marginTop: 12, padding: "10px 14px" }}
              >
                Save name to account
              </button>
            ) : null}
          </div>
        ) : null}

        {error ? <ErrorText text={error} /> : null}
        {info ? <InfoText text={info} /> : null}

        {children}
      </div>
    );
  }

  return (
    <div style={{ textAlign: "left" }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 26 }}>
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h2>
      <p style={{ margin: "0 0 20px", color: muted, fontSize: 14, lineHeight: 1.6 }}>
        {mode === "login"
          ? "Log in with Google, phone, or email."
          : "Sign up with Google, phone, or email."}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 18,
          padding: 4,
          borderRadius: 12,
          background: "#0b0b10",
          border: `1px solid ${border}`,
        }}
      >
        {(["login", "signup"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setMode(item);
              resetMessages();
            }}
            style={{
              border: "none",
              background: mode === item ? purple : "transparent",
              color: mode === item ? "white" : muted,
              padding: "10px 12px",
              borderRadius: 9,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {item === "login" ? "Login" : "Sign Up"}
          </button>
        ))}
      </div>

      <button type="button" onClick={handleGoogle} disabled={busy} style={secondaryBtn}>
        <GoogleIcon />
        Continue with Google
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "18px 0",
          color: muted,
          fontSize: 12,
        }}
      >
        <div style={{ height: 1, background: border, flex: 1 }} />
        or
        <div style={{ height: 1, background: border, flex: 1 }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => {
            setMethod("email");
            resetMessages();
          }}
          style={{
            ...secondaryBtn,
            width: "auto",
            padding: "8px 12px",
            borderColor: method === "email" ? purple : border,
            color: method === "email" ? purple2 : muted,
          }}
        >
          <Mail size={15} />
          Email
        </button>
        <button
          type="button"
          onClick={() => {
            setMethod("phone");
            resetMessages();
          }}
          style={{
            ...secondaryBtn,
            width: "auto",
            padding: "8px 12px",
            borderColor: method === "phone" ? purple : border,
            color: method === "phone" ? purple2 : muted,
          }}
        >
          <Phone size={15} />
          Phone number
        </button>
      </div>

      {error ? <ErrorText text={error} /> : null}
      {info ? <InfoText text={info} /> : null}

      {method === "email" ? (
        <form onSubmit={handleEmail} style={{ display: "grid", gap: 14 }}>
          <label style={fieldLabel}>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </label>
          <label style={fieldLabel}>
            Password
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={inputStyle}
            />
          </label>
          {mode === "signup" ? (
            <label style={fieldLabel}>
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                style={inputStyle}
              />
            </label>
          ) : null}
          <button type="submit" disabled={busy} style={primaryBtn}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <label style={fieldLabel}>
            Phone number
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 8 }}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={inputStyle}
                disabled={otpSent}
              >
                <option value="+91">IN +91</option>
                <option value="+1">US +1</option>
                <option value="+44">UK +44</option>
                <option value="+61">AU +61</option>
                <option value="+971">AE +971</option>
              </select>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                style={inputStyle}
                disabled={otpSent}
              />
            </div>
          </label>

          {!otpSent ? (
            <button type="button" disabled={busy} style={primaryBtn} onClick={() => sendOtp(false)}>
              {busy ? "Sending OTP…" : "Send OTP"}
            </button>
          ) : (
            <form onSubmit={verifyOtp} style={{ display: "grid", gap: 14 }}>
              <label style={fieldLabel}>
                OTP
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  style={inputStyle}
                />
              </label>
              <button type="submit" disabled={busy} style={primaryBtn}>
                {busy ? "Verifying…" : "Verify OTP"}
              </button>
              <button
                type="button"
                disabled={busy || resendIn > 0}
                onClick={() => sendOtp(true)}
                style={{
                  ...secondaryBtn,
                  opacity: resendIn > 0 ? 0.6 : 1,
                  cursor: resendIn > 0 ? "not-allowed" : "pointer",
                }}
              >
                {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  confirmationRef.current = null;
                  resetMessages();
                }}
                style={{ ...secondaryBtn, color: muted }}
              >
                Use a different number
              </button>
            </form>
          )}
        </div>
      )}

      <div ref={recaptchaHostRef} style={{ minHeight: 1 }} />

      {children ? (
        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: `1px solid ${border}`,
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function ErrorText({ text }: { text: string }) {
  return (
    <div
      role="alert"
      style={{
        marginBottom: 12,
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(239,68,68,.12)",
        border: "1px solid rgba(239,68,68,.35)",
        color: "#fca5a5",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      {text}
    </div>
  );
}

function InfoText({ text }: { text: string }) {
  return (
    <div
      style={{
        marginBottom: 12,
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(52,211,153,.1)",
        border: "1px solid rgba(52,211,153,.3)",
        color: "#6ee7b7",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      {text}
    </div>
  );
}
