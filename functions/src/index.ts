/**
 * Scheduled Greenhouse internship sync.
 *
 * Schedule: once per day. Reads board tokens from the Firestore document
 * `config/opportunitySources` ({ greenhouseTokens: string[] }) so tokens
 * can be managed without redeploying. Empty/missing config → honest no-op.
 *
 * Writes normalized records to `opportunities/{greenhouse:<token>:<id>}`
 * and marks previously synced records that vanished from the boards as
 * inactive. No secrets required for Greenhouse (public GET endpoints).
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { computeStaleIds, syncBoard } from "./sync";

initializeApp();

function readTokens(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const raw = (data as Record<string, unknown>).greenhouseTokens;
  if (!Array.isArray(raw)) return [];
  return raw.map(String).map((token) => token.trim()).filter(Boolean);
}

export const syncOpportunities = onSchedule("every 24 hours", async () => {
  const db = getFirestore();
  const configSnap = await db.doc("config/opportunitySources").get();
  const tokens = readTokens(configSnap.data());
  if (tokens.length === 0) {
    console.log("syncOpportunities: no Greenhouse board tokens configured; nothing to sync.");
    return;
  }

  const freshById = new Map<string, Record<string, unknown>>();
  for (const token of tokens) {
    try {
      const result = await syncBoard(token, fetch);
      for (const record of result.records) {
        freshById.set(record.id, { ...record });
      }
      console.log(
        `syncOpportunities: board ${token} (${result.company}) → ${result.records.length} internships.`,
      );
    } catch (error) {
      console.error(`syncOpportunities: board ${token} failed:`, error);
    }
  }

  const batch = db.batch();
  const today = new Date().toISOString().slice(0, 10);
  for (const [id, record] of freshById) {
    batch.set(
      db.doc(`opportunities/${id}`),
      { ...record, isActive: true, verifiedAt: today, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }
  const existing = await db.collection("opportunities").where("provider", "==", "greenhouse").get();
  const staleIds = computeStaleIds(
    existing.docs.map((docSnap) => docSnap.id),
    [...freshById.keys()],
  );
  for (const id of staleIds) {
    batch.set(
      db.doc(`opportunities/${id}`),
      { isActive: false, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }
  await batch.commit();
  console.log(
    `syncOpportunities: wrote ${freshById.size} active, deactivated ${staleIds.length} stale.`,
  );
});
