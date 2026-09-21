/**
 * Gradivo opportunity sync (runs in GitHub Actions, zero npm dependencies).
 *
 * Run:  node --experimental-strip-types scripts/sync-opportunities.mjs
 * Env:  GREENHOUSE_TOKENS="stripe,project44" (defaults to the 4 boards below)
 *
 * Pipeline: legitimate public sources → validate → drop expired →
 * dedupe → sort → public/data/opportunities.json.
 *
 * NEVER invents data. Failures are logged and skipped; when a run yields
 * nothing usable, the previous valid file is kept instead of wiped.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { syncBoard } from "../functions/src/sync.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "public", "data", "opportunities.json");
const CURATED_DIR = join(ROOT, "scripts", "curated");

const DEFAULT_TOKENS = ["stripe", "project44", "graphcore-early-careers", "groww"];

const VALID_TYPES = ["internship", "hackathon"];

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\/.+/i.test(value.trim());
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

function asStringArray(value) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

/**
 * Strict record check mirroring the frontend validator. Missing optional
 * fields stay empty (""/null) — never invented. Returns the normalized
 * record or null.
 */
export function isValidRecord(input) {
  if (!input || typeof input !== "object") return null;
  if (!VALID_TYPES.includes(input.type)) return null;
  const record = {
    id: String(input.id ?? ""),
    type: input.type,
    title: asString(input.title).trim(),
    organization: asString(input.organization ?? input.company ?? input.organizer).trim(),
    description: asString(input.description).trim(),
    location: asString(input.location).trim(),
    city: asString(input.city).trim(),
    state: asString(input.state ?? input.region).trim(),
    country: asString(input.country).trim(),
    mode: asString(input.mode).trim() || "On-site",
    skills: asStringArray(input.skills),
    eligibility: asString(input.eligibility).trim(),
    stipend: input.stipend ?? null,
    duration: asString(input.duration).trim(),
    startDate: asString(input.startDate).trim(),
    registrationUrl: asString(input.registrationUrl).trim(),
    verifiedAt: asString(input.verifiedAt).trim() || todayISO(),
    latitude: typeof input.latitude === "number" ? input.latitude : null,
    longitude: typeof input.longitude === "number" ? input.longitude : null,
    deadline: input.deadline ?? null,
    eventDate: asString(input.eventDate).trim(),
    postedAt: asString(input.postedAt).trim(),
    sourceName: asString(input.sourceName).trim(),
    sourceUrl: asString(input.sourceUrl).trim(),
    applicationUrl: asString(input.applicationUrl ?? input.detailsUrl ?? input.registrationUrl).trim(),
    isActive: input.isActive !== false,
  };
  if (!record.id || !record.title || !record.organization) return null;
  if (!record.sourceName || !isHttpUrl(record.sourceUrl) || !isHttpUrl(record.applicationUrl)) {
    return null;
  }
  if (record.deadline != null && record.deadline !== "" && typeof record.deadline !== "string") {
    return null;
  }
  return record;
}

/** Drop expired: deadline passed, hackathon event ended, or inactive flag. */
export function filterExpiredRecords(records, today = todayISO()) {
  return records.filter((item) => {
    if (item.isActive === false) return false;
    if (typeof item.deadline === "string" && item.deadline && item.deadline < today) return false;
    if (item.type === "hackathon" && item.eventDate && item.eventDate < today) return false;
    return true;
  });
}

/** Dedupe by id → sourceUrl → applicationUrl → composite key. */
export function dedupeRecords(records) {
  const seen = new Set();
  return records.filter((item) => {
    const keys = [
      `id:${item.id}`,
      `src:${String(item.sourceUrl).trim().toLowerCase()}`,
      `app:${String(item.applicationUrl).trim().toLowerCase()}`,
      `full:${String(item.sourceName).trim().toLowerCase()}|${String(item.title).trim().toLowerCase()}|${String(item.organization).trim().toLowerCase()}|${String(item.location).trim().toLowerCase()}|${item.deadline ?? ""}`,
    ];
    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

/** Sort by deadline asc (missing last), then title. Stable and consistent. */
export function sortRecords(records) {
  return [...records].sort((a, b) => {
    const da = typeof a.deadline === "string" && a.deadline ? a.deadline : "9999";
    const db = typeof b.deadline === "string" && b.deadline ? b.deadline : "9999";
    const byDeadline = da.localeCompare(db);
    if (byDeadline !== 0) return byDeadline;
    return String(a.title).localeCompare(String(b.title));
  });
}

/** Hand-verified entries an admin commits under scripts/curated/*.json. */
export function loadCuratedRecords() {
  const out = [];
  if (!existsSync(CURATED_DIR)) return out;
  for (const file of readdirSync(CURATED_DIR)) {
    if (!file.endsWith(".json")) continue;
    try {
      const parsed = JSON.parse(readFileSync(join(CURATED_DIR, file), "utf8"));
      const list = Array.isArray(parsed) ? parsed : parsed.opportunities;
      if (!Array.isArray(list)) continue;
      for (const entry of list) {
        const valid = isValidRecord(entry);
        if (valid) out.push(valid);
        else console.warn(`sync: dropping invalid curated entry in ${file}`);
      }
    } catch (error) {
      console.warn(`sync: cannot read curated file ${file}: ${error.message}`);
    }
  }
  return out;
}

export function readPreviousRecords() {
  try {
    const parsed = JSON.parse(readFileSync(OUT_FILE, "utf8"));
    if (Array.isArray(parsed?.opportunities)) return parsed.opportunities;
  } catch {
    // Missing or corrupt file: start empty, never fake.
  }
  return [];
}

async function main() {
  const tokens = (process.env.GREENHOUSE_TOKENS ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  const boards = tokens.length > 0 ? tokens : DEFAULT_TOKENS;
  const collected = [];
  let failures = 0;
  for (const token of boards) {
    try {
      const result = await syncBoard(token, fetch, todayISO());
      console.log(`sync: board ${token} (${result.company}) → ${result.records.length} internships`);
      collected.push(...result.records);
    } catch (error) {
      failures++;
      console.warn(`sync: board ${token} failed, skipped: ${error.message}`);
    }
  }
  const curated = loadCuratedRecords();
  console.log(`sync: curated files → ${curated.length} records`);
  const fresh = sortRecords(
    dedupeRecords(filterExpiredRecords([...collected, ...curated].map(isValidRecord).filter(Boolean))),
  );
  if (fresh.length === 0) {
    const previous = readPreviousRecords();
    if (previous.length > 0) {
      console.warn("sync: no fresh records; keeping previous valid file.");
      return;
    }
  }
  mkdirSync(dirname(OUT_FILE), { recursive: true });
  const envelope = {
    updatedAt: new Date().toISOString(),
    source: "Gradivo Opportunity Sync",
    opportunities: fresh,
  };
  writeFileSync(OUT_FILE, JSON.stringify(envelope, null, 2) + "\n");
  // Prove the file is valid JSON before finishing.
  JSON.parse(readFileSync(OUT_FILE, "utf8"));
  console.log(`sync: wrote ${fresh.length} opportunities (${failures} source failures).`);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(`sync: fatal error: ${error.message}`);
    process.exit(1);
  });
}
