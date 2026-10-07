import { useState } from "react";
import type { ThemeColors } from "../connect/types";
import SignUpPage from "./SignUpPage";
import LoginPage from "./LoginPage";
import ForgotPassword from "./ForgotPassword";

export type AuthMode = "login" | "signup";

export type AuthScreenProps = {
  mode: AuthMode;
  colors?: ThemeColors;
  onModeChange: (mode: AuthMode) => void;
  onSuccess?: () => void;
};

export default function AuthScreen({
  mode,
  onModeChange,
  onSuccess = () => {},
}: AuthScreenProps) {
  const [isForgot, setIsForgot] = useState(false);

  if (isForgot) {
    return (
      <ForgotPassword
        onBackToLogin={() => {
          setIsForgot(false);
          onModeChange("login");
        }}
      />
    );
  }

  if (mode === "signup") {
    return (
      <SignUpPage
        onNavigateLogin={() => {
          setIsForgot(false);
          onModeChange("login");
        }}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <LoginPage
      onNavigateSignup={() => {
        setIsForgot(false);
        onModeChange("signup");
      }}
      onForgotPassword={() => setIsForgot(true)}
      onSuccess={onSuccess}
    />
  );
}
