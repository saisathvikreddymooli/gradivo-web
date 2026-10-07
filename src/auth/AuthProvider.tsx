import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { ensureUserDocument } from "../connect/api";
import { AuthContext, type AuthContextValue } from "./context";
import { logAuthError } from "./authError";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    // Single onAuthStateChanged listener to track authenticated session
    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        if (!active) return;
        setUser(nextUser);
        setReady(true);
      },
      (error) => {
        logAuthError("onAuthStateChanged listener", error);
        if (!active) return;
        setUser(null);
        setReady(true);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    ready,

    async signUp(name: string, email: string, password: string): Promise<User> {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();

      // 1. Create the Firebase user
      const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);

      // 2. Save the user's display name in Firebase Auth
      await updateProfile(credential.user, { displayName: trimmedName });

      // 3. Store the user's basic profile in Firestore using the UID
      try {
        await ensureUserDocument(credential.user, { name: trimmedName });
      } catch (firestoreError) {
        logAuthError("ensureUserDocument after signup", firestoreError);
      }

      // 4. Reload user to synchronize displayName in current session state
      if (auth.currentUser) {
        try {
          await auth.currentUser.reload();
          setUser(auth.currentUser);
        } catch {
          setUser(credential.user);
        }
      }

      return credential.user;
    },

    async logIn(email: string, password: string): Promise<User> {
      const trimmedEmail = email.trim();
      const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      setUser(credential.user);
      return credential.user;
    },

    async sendPasswordReset(email: string): Promise<void> {
      await sendPasswordResetEmail(auth, email.trim());
    },

    async logOut(): Promise<void> {
      await signOut(auth);
      setUser(null);
    },

    async reloadUser(): Promise<void> {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        setUser(auth.currentUser);
      }
    },
  }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
