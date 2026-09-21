import { auth } from "../firebase/config";
import type { ItemStatus, ProgressMap, StudentIntake } from "./types";

const PROGRESS_PREFIX = "gradivo-roadmap-progress-v1";
const INTAKE_PREFIX = "gradivo-roadmap-intake-v1";

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

export function saveProgress(progress: ProgressMap) {
  try {
    localStorage.setItem(storageKey(PROGRESS_PREFIX), JSON.stringify(progress));
  } catch {
    // Private-mode / quota failures must not break roadmap clicks.
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
