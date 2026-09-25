import { auth } from "../firebase/config";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import type { ItemStatus, ProgressMap, StudentIntake } from "./types";

const PROGRESS_PREFIX = "gradivo-roadmap-progress-v1";
const INTAKE_PREFIX = "gradivo-roadmap-intake-v1";
let pendingAccountWrite: Promise<void> = Promise.resolve();

function storageKey(prefix: string): string {
  const uid = auth.currentUser?.uid ?? "local";
  return `${prefix}:${uid}`;
}

export function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(storageKey(PROGRESS_PREFIX));
    if (!raw) return {};
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

export async function loadAccountProgress(uid: string): Promise<ProgressMap> {
  try {
    const snapshot = await getDoc(doc(db, "users", uid));
    const candidate = snapshot.exists() ? snapshot.data().learningProgress : null;
    const progress: ProgressMap = {};
    if (candidate && typeof candidate === "object") {
      for (const [id, status] of Object.entries(candidate as Record<string, unknown>)) {
        if (status === "not_started" || status === "learning" || status === "completed") {
          progress[id] = status;
        }
      }
    }
    try {
      localStorage.setItem(storageKey(PROGRESS_PREFIX), JSON.stringify(progress));
    } catch {
      // Firestore remains the source of truth for signed-in students.
    }
    return progress;
  } catch (error) {
    console.warn("Could not load learning progress from the account.", error);
    return loadProgress();
  }
}

export function saveProgress(progress: ProgressMap) {
  try {
    localStorage.setItem(storageKey(PROGRESS_PREFIX), JSON.stringify(progress));
  } catch {
    // Private-mode / quota failures must not break roadmap clicks.
  }
  const user = auth.currentUser;
  if (user) {
    pendingAccountWrite = pendingAccountWrite.catch(() => undefined).then(async () => {
      const ref = doc(db, "users", user.uid);
      try {
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          await updateDoc(ref, { learningProgress: progress, updatedAt: serverTimestamp() });
        } else {
          await setDoc(ref, {
            name: user.displayName || "Student",
            isVerifiedSenior: false,
            learningProgress: progress,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.warn("Could not save learning progress to the account.", error);
      }
    });
  }
}

export function setItemStatus(progress: ProgressMap, id: string, status: ItemStatus): ProgressMap {
  const next = { ...progress, [id]: status };
  saveProgress(next);
  return next;
}

export function loadIntake(): StudentIntake | null {
  try {
    const raw = localStorage.getItem(storageKey(INTAKE_PREFIX));
    if (!raw) return null;
    return JSON.parse(raw) as StudentIntake;
  } catch {
    return null;
  }
}

export function saveIntake(intake: StudentIntake) {
  try {
    localStorage.setItem(storageKey(INTAKE_PREFIX), JSON.stringify(intake));
  } catch {
    // Private-mode / quota failures must not break roadmap clicks.
  }
}
