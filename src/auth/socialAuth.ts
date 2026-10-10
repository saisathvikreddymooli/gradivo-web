import {
  GoogleAuthProvider,
  OAuthProvider,
  fetchSignInMethodsForEmail,
  getRedirectResult,
  linkWithCredential,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
  type AuthProvider as FirebaseAuthProvider,
  type User,
  type UserCredential,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { ensureUserDocument, recordSocialSignIn } from "../connect/api";
import { logAuthError } from "./authError";

/**
 * Provider id for LinkedIn "Sign In with LinkedIn using OpenID Connect".
 * This id must match the provider id configured in
 * Firebase Console > Authentication > Sign-in method > OpenID Connect.
 * Never put the LinkedIn Client Secret in frontend code.
 */
export const LINKEDIN_PROVIDER_ID = "oidc.linkedin";

function googleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function linkedInProvider(): OAuthProvider {
  return new OAuthProvider(LINKEDIN_PROVIDER_ID);
}

async function finishSocialSignIn(
  credential: UserCredential,
  providerLabel: string,
): Promise<User> {
  const user = credential.user;
  try {
    await ensureUserDocument(user, {
      name: user.displayName || "",
    });
  } catch (firestoreError) {
    logAuthError(`ensureUserDocument after ${providerLabel} sign-in`, firestoreError);
  }
  try {
    const methods = new Set<string>();
    for (const info of user.providerData) {
      if (info?.providerId) methods.add(info.providerId);
    }
    await recordSocialSignIn(user.uid, [...methods]);
  } catch (firestoreError) {
    logAuthError(`recordSocialSignIn after ${providerLabel} sign-in`, firestoreError);
  }
  return user;
}

async function signInWithPopupOrRedirect(
  firebaseAuth: Auth,
  provider: FirebaseAuthProvider,
): Promise<UserCredential | null> {
  try {
    return await signInWithPopup(firebaseAuth, provider);
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    if (
      code === "auth/popup-blocked" ||
      code === "auth/operation-not-supported-in-this-environment" ||
      code === "auth/popup-window-closed"
    ) {
      logAuthError("social popup blocked, falling back to redirect", error);
      await signInWithRedirect(firebaseAuth, provider);
      return null;
    }
    throw error;
  }
}

/**
 * Google sign-in/sign-up (one click works for both). Returns the user, or
 * null when a redirect fallback was started (completion arrives via
 * consumeRedirectResult on the next app load).
 */
export async function signInWithGoogle(): Promise<User | null> {
  const credential = await signInWithPopupOrRedirect(auth, googleProvider());
  if (!credential) return null;
  return finishSocialSignIn(credential, "Google");
}

/**
 * LinkedIn sign-in/sign-up via OpenID Connect. Requires the
 * "oidc.linkedin" provider to be configured in the Firebase console first.
 */
export async function signInWithLinkedIn(): Promise<User | null> {
  const credential = await signInWithPopupOrRedirect(auth, linkedInProvider());
  if (!credential) return null;
  return finishSocialSignIn(credential, "LinkedIn");
}

/**
 * Completes a redirect-based social sign-in on app load. Call once at
 * startup; resolves to the signed-in user or null when no redirect
 * happened. Errors (user-cancelled, account-exists) are re-thrown for
 * the caller to display.
 */
export async function consumeRedirectResult(): Promise<User | null> {
  let credential: UserCredential | null = null;
  try {
    credential = await getRedirectResult(auth);
  } catch (error) {
    logAuthError("social redirect result", error);
    throw error;
  }
  if (!credential) return null;
  const providerLabel = credential.providerId?.includes("linkedin")
    ? "LinkedIn"
    : "Google";
  return finishSocialSignIn(credential, providerLabel);
}

/**
 * When Firebase reports auth/account-exists-with-different-credential,
 * tell the user which method they used first so they can sign in that way.
 */
export async function describeExistingAccountMethod(email: string): Promise<string[]> {
  try {
    return await fetchSignInMethodsForEmail(auth, email);
  } catch (error) {
    logAuthError("fetchSignInMethodsForEmail", error);
    return [];
  }
}

export { linkWithCredential };
export type { UserCredential };
