import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import type { StudentIntake } from "./types";

export type StoredRoadmap = {
  intake: StudentIntake;
  /** Millis since epoch (client) marking when the roadmap was generated. */
  generatedAt: number;
  sourceVersion: string;
};

const ROADMAP_DOC = "current";

function roadmapRef(uid: string) {
  return doc(db, "users", uid, "roadmaps", ROADMAP_DOC);
}

function validIntake(value: unknown): value is StudentIntake {
  if (!value || typeof value !== "object") return false;
  const intake = value as Record<string, unknown>;
  return (
    typeof intake.careerGoal === "string" &&
    Array.isArray(intake.knownSkills) &&
    Array.isArray(intake.interests)
  );
}

/** Load the persisted roadmap snapshot for a user. Returns null when none exists. */
export async function loadAccountRoadmap(uid: string): Promise<StoredRoadmap | null> {
  if (!uid.trim()) throw new Error("Cannot load a roadmap without an authenticated Firebase UID.");
  const snap = await getDoc(roadmapRef(uid));
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<StoredRoadmap>;
  if (!validIntake(data.intake)) return null;
  return {
    intake: {
      year: String(data.intake.year ?? ""),
      semester: String(data.intake.semester ?? ""),
      branch: String(data.intake.branch ?? ""),
      skillLevel:
        data.intake.skillLevel === "intermediate" || data.intake.skillLevel === "advanced"
          ? data.intake.skillLevel
          : "beginner",
      knownSkills: data.intake.knownSkills.map(String),
      careerGoal: data.intake.careerGoal,
      interests: data.intake.interests.map(String),
      weeklyHours: String(data.intake.weeklyHours ?? "7"),
      targetRole: String(data.intake.targetRole ?? ""),
      timelineMonths: String(data.intake.timelineMonths ?? "6"),
    },
    generatedAt: typeof data.generatedAt === "number" ? data.generatedAt : Date.now(),
    sourceVersion: String(data.sourceVersion ?? "unknown"),
  };
}

/**
 * Persist the generated roadmap's input snapshot (the generator is
 * deterministic, so the roadmap is rebuilt from this on load). Merge-write
 * so first-time and repeat saves share one path.
 */
export async function saveAccountRoadmap(uid: string, stored: StoredRoadmap): Promise<void> {
  if (!uid.trim()) throw new Error("Cannot save a roadmap without an authenticated Firebase UID.");
  if (auth.currentUser?.uid !== uid) {
    throw new Error("The roadmap UID does not match the currently authenticated Firebase user.");
  }
  await setDoc(
    roadmapRef(uid),
    { ...stored, updatedAt: serverTimestamp() },
  );
}
