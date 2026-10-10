import { useCallback, useEffect, useRef, useState } from "react";
import { collection, doc, getDocs, serverTimestamp, setDoc, type Timestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import type { ProgrammingLanguageId, SpokenLanguage } from "./playlists";
import type { LearnVideoResource } from "./videoCatalog";

export type VideoProgressRecord = {
  videoId: string;
  language: ProgrammingLanguageId;
  spokenLanguage: SpokenLanguage;
  title: string;
  percent: number;
  lastPosition: number;
  duration: number;
  completed: boolean;
  updatedAt: Date;
};

export type VideoProgressWrite = Omit<VideoProgressRecord, "updatedAt">;
export type VideoProgressMap = Record<string, VideoProgressRecord>;

function asDate(value: unknown): Date {
  if (value && typeof (value as Timestamp).toDate === "function") return (value as Timestamp).toDate();
  return value instanceof Date ? value : new Date(0);
}

function validProgress(data: Record<string, unknown>, videoId: string): VideoProgressRecord | null {
  if (data.videoId !== videoId || typeof data.language !== "string" || typeof data.spokenLanguage !== "string"
    || typeof data.title !== "string" || typeof data.percent !== "number" || typeof data.lastPosition !== "number"
    || typeof data.duration !== "number" || typeof data.completed !== "boolean") return null;
  return {
    videoId,
    language: data.language as ProgrammingLanguageId,
    spokenLanguage: data.spokenLanguage as SpokenLanguage,
    title: data.title,
    percent: Math.max(0, Math.min(100, Math.round(data.percent))),
    lastPosition: Math.max(0, data.lastPosition),
    duration: Math.max(0, data.duration),
    completed: data.completed,
    updatedAt: asDate(data.updatedAt),
  };
}

/** The single collection read for video progress on the Learn page. */
export async function loadVideoProgress(uid: string): Promise<VideoProgressMap> {
  if (auth.currentUser?.uid !== uid) throw new Error("Sign in again to load your video progress.");
  const snapshot = await getDocs(collection(db, "users", uid, "videoProgress"));
  const records: VideoProgressMap = {};
  snapshot.docs.forEach((item) => {
    const record = validProgress(item.data(), item.id);
    if (record) records[item.id] = record;
  });
  return records;
}

export function useVideoProgress(uid: string | null) {
  const [progressByVideo, setProgressByVideo] = useState<VideoProgressMap>({});
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState("");
  const stateRef = useRef<VideoProgressMap>({});
  const savedPercentRef = useRef(new Map<string, number>());
  const lastWriteAtRef = useRef(new Map<string, number>());
  const pendingRef = useRef(new Map<string, Promise<void>>());
  const queuedRef = useRef(new Map<string, { record: VideoProgressWrite; force: boolean }>());

  useEffect(() => {
    let active = true;
    stateRef.current = {};
    savedPercentRef.current.clear();
    lastWriteAtRef.current.clear();
    if (!uid) {
      setProgressByVideo({});
      setLoading(false);
      setError("");
      return () => { active = false; };
    }
    setLoading(true);
    setError("");
    void loadVideoProgress(uid).then((records) => {
      if (!active) return;
      stateRef.current = records;
      Object.values(records).forEach((record) => {
        savedPercentRef.current.set(record.videoId, record.percent);
        if (record.updatedAt.getTime() > 0) lastWriteAtRef.current.set(record.videoId, record.updatedAt.getTime());
      });
      setProgressByVideo(records);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load saved video progress.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [uid]);

  const persist = useCallback(async (record: VideoProgressWrite, force = false): Promise<void> => {
    if (!uid || auth.currentUser?.uid !== uid) return;
    const now = Date.now();
    const savedPercent = savedPercentRef.current.get(record.videoId);
    if (savedPercent === record.percent) return;
    const pending = pendingRef.current.get(record.videoId);
    if (pending) {
      queuedRef.current.set(record.videoId, { record, force });
      await pending;
      return;
    }
    const lastWrite = lastWriteAtRef.current.get(record.videoId) ?? 0;
    if (!force && now - lastWrite < 15000) return;
    lastWriteAtRef.current.set(record.videoId, now);
    const task = setDoc(doc(db, "users", uid, "videoProgress", record.videoId), {
      ...record,
      updatedAt: serverTimestamp(),
    }).then(() => {
      savedPercentRef.current.set(record.videoId, record.percent);
      setError("");
    }).catch((reason: unknown) => {
      if (import.meta.env.DEV) {
        const code = (reason as { code?: unknown }).code;
        console.error("[Learn] Could not save video progress", {
          documentPath: `users/${uid}/videoProgress/${record.videoId}`,
          uid,
          code: typeof code === "string" ? code : "unknown",
          reason,
        });
      }
      setError("Your progress could not be saved. Check your connection and database permissions.");
    }).finally(() => {
      pendingRef.current.delete(record.videoId);
      const queued = queuedRef.current.get(record.videoId);
      queuedRef.current.delete(record.videoId);
      if (queued && queued.record.percent !== savedPercentRef.current.get(record.videoId)
        && (queued.force || Date.now() - (lastWriteAtRef.current.get(record.videoId) ?? 0) >= 15000)) {
        void persist(queued.record, queued.force);
      }
    });
    pendingRef.current.set(record.videoId, task);
    await task;
  }, [uid]);

  const updateProgress = useCallback((
    video: LearnVideoResource,
    furthestPoint: number,
    duration: number,
    forceSave = false,
  ): Promise<void> => {
    if (!uid || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(furthestPoint)) return Promise.resolve();
    const previous = stateRef.current[video.videoId];
    const lastPosition = Math.max(previous?.lastPosition ?? 0, furthestPoint);
    const percent = Math.min(100, Math.max(0, Math.round((lastPosition / duration) * 100)));
    const record: VideoProgressRecord = {
      videoId: video.videoId,
      language: video.language,
      spokenLanguage: video.spokenLanguage,
      title: video.title,
      percent,
      lastPosition,
      duration,
      completed: percent >= 90,
      updatedAt: new Date(),
    };
    const next = { ...stateRef.current, [video.videoId]: record };
    stateRef.current = next;
    setProgressByVideo(next);
    return persist(record, forceSave);
  }, [persist, uid]);

  return { progressByVideo, loading, error, updateProgress };
}
