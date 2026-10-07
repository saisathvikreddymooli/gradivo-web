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
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
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
