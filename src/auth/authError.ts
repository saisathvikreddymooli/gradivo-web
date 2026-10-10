export function logAuthError(operation: string, error: unknown) {
  const firebaseError = error as { code?: string; message?: string };
  const code = firebaseError?.code ?? "unknown";
  const message = firebaseError?.message ?? String(error);

  // Always log original Firebase error code and message during development
  console.error(`[Firebase Auth] ${operation} failed:`, {
    code,
    message,
    rawError: error,
  });
}

export function getAuthErrorMessage(error: unknown): string {
  if (!error) return "An unexpected error occurred.";

  const firebaseError = error as { code?: string; message?: string };
  const code = firebaseError?.code ?? "";

  // Log to console for development visibility
  logAuthError("Authentication operation", error);

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email.";
    case "auth/user-not-found":
      return "Account not found.";
    case "auth/wrong-password":
      return "Invalid email or password.";
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "Email already registered.";
    case "auth/weak-password":
      return "Password is too weak.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password under Authentication > Sign-in method.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Firebase Authentication. Add it under Authentication > Settings > Authorized domains.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid":
      return "Firebase rejected the configured API key. Check the VITE_FIREBASE_API_KEY value for this project.";
    case "auth/auth-domain-config-required":
      return "Firebase Authentication is missing its auth domain. Check VITE_FIREBASE_AUTH_DOMAIN.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked. Please allow popups, or wait while we try redirect sign-in instead.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return "Sign-in was cancelled before completing. Please try again.";
    case "auth/operation-not-supported-in-this-environment":
      return "Popups are not supported here, so redirect sign-in was started. Please complete it in the opened page.";
    case "auth/account-exists-with-different-credential":
      return "This email is already registered with a different sign-in method. Please sign in with the method you used first.";
    case "auth/credential-already-in-use":
      return "This account is already linked to another user. Please sign in with the method you used first.";
    case "auth/configuration-not-found":
      return "This sign-in method is not enabled yet. Please contact support or try another method.";
    case "auth/invalid-oauth-provider":
      return "This sign-in provider is not configured. Please try another method.";
    case "auth/missing-password":
      return "Please enter a password.";
    case "auth/missing-email":
      return "Please enter your email.";
    default:
      if (typeof error === "string" && error.trim().length > 0) {
        return error;
      }
      return "Invalid email or password.";
  }
}
