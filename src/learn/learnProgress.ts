import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { LEARN_CHECKLIST } from "./learnContent";

const LOCAL_KEY_PREFIX = "gradivo-learn-checklist-v1";

function localKey(): string {
  const uid = auth.currentUser?.uid ?? "local";
  return `${LOCAL_KEY_PREFIX}:${uid}`;
}

function validIds(ids: unknown): string[] {
  const known = new Set(LEARN_CHECKLIST.map((item) => item.id));
  if (!Array.isArray(ids)) return [];
  return ids.filter((id): id is string => typeof id === "string" && known.has(id));
}

function loadLocal(): string[] {
  try {
    const raw = localStorage.getItem(localKey());
    if (!raw) return [];
    return validIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

function saveLocal(done: string[]) {
  try {
    localStorage.setItem(localKey(), JSON.stringify(done));
  } catch {
    // Private-mode / quota failures must not break the checklist.
  }
}

/**
 * Load checklist progress. Signed-in users read users/{uid}/learn/progress
 * (falling back to the local copy); logged-out users use localStorage only.
 */
export async function loadLearnChecklist(uid: string | null): Promise<string[]> {
  if (!uid) return loadLocal();
  try {
    const snap = await getDoc(doc(db, "users", uid, "learn", "progress"));
    if (snap.exists()) {
      const done = validIds((snap.data() as { done?: unknown }).done);
      saveLocal(done);
      return done;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      const code = (error as { code?: unknown }).code;
      console.error("[Learn] Checklist load failed", {
        documentPath: `users/${uid}/learn/progress`,
        uid,
        code: typeof code === "string" ? code : "unknown",
        error,
      });
    }
  }
  return loadLocal();
}

/**
 * Save checklist progress with a merge write. Firestore when signed in,
 * localStorage always (offline backup).
 */
export async function saveLearnChecklist(uid: string | null, done: string[]): Promise<void> {
  const clean = validIds(done);
  saveLocal(clean);
  if (!uid) return;
  if (auth.currentUser?.uid !== uid) {
    throw new Error("Please sign in to save your checklist.");
  }
  await setDoc(doc(db, "users", uid, "learn", "progress"), { done: clean }, { merge: true });
}
