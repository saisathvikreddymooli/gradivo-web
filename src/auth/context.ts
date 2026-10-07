import { createContext } from "react";
import type { User } from "firebase/auth";

export type AuthContextValue = {
  user: User | null;
  ready: boolean;
  signUp: (name: string, email: string, password: string) => Promise<User>;
  logIn: (email: string, password: string) => Promise<User>;
  sendPasswordReset: (email: string) => Promise<void>;
  logOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
