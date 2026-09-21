/**
 * Canonical opportunity service for Gradivo.
 *
 * REAL DATA ONLY. This layer never invents internships, hackathons,
 * companies, deadlines, locations, or URLs.
 *
 * Pipeline:
 *   REAL SOURCES (scheduled GitHub Action → public/data/opportunities.json,
 *   Firestore `opportunities` collection, and/or an API URL)
 *     → validate (trustworthy source required)
 *     → remove expired
 *     → remove duplicates
 *     → location-aware ranking / filtering
 *     → Opportunities page + Home alert
 *
 * Going live:
 *  - Add verified documents to the Firestore `opportunities` collection
 *    (see field list on `Opportunity`). Reads are public; writes are
 *    admin-only (Firebase console or Admin SDK).
 *  - Optionally set VITE_GRADIVO_OPPORTUNITIES_URL to a JSON endpoint
 *    returning `{ items: Opportunity[] }`. API keys stay server-side —
 *    never put secrets in frontend code or commit them.
 */

import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../firebase/config";
import { INDIAN_STATES } from "../connect/constants";

export type OpportunityType = "internship" | "hackathon";

export type OpportunityMode =
  | "Online"
  | "Offline"
  | "Hybrid"
  | "Remote"
  | "On-site";

export type Opportunity = {
  id: string;
  type: OpportunityType;
  title: string;
  organization: string;
  description: string;
  /** Display location, e.g. "Bangalore, Karnataka" or "Remote". */
  location: string;
  /** City, e.g. "Bangalore". "Remote" for remote-only roles. */
  city: string;
  /** State, e.g. "Karnataka". Empty when not applicable. */
  state: string;
  mode: OpportunityMode;
  skills: string[];
  /** Only when the real source provides it. */
  eligibility: string;
  /** Only when the real source provides it. */
  stipend: string;
  /** Internship length, e.g. "3 months". Only when the source provides it. */
  duration: string;
  /** Country, e.g. "India". Only when the source provides it. */
  country: string;
  /** Internship start date (ISO). Only when the source provides it. */
  startDate: string;
  /** Registration URL for hackathons; falls back to applicationUrl. */
  registrationUrl: string;
  /** ISO date the entry was last verified against its source. */
  verifiedAt: string;
  /** Optional coordinates supplied by the source for radius matching. */
  latitude: number | null;
  longitude: number | null;
  /** ISO date (YYYY-MM-DD). Only when the real source provides it. */
  deadline: string;
  /** ISO date (YYYY-MM-DD). Hackathons only, when provided. */
  eventDate: string;
  /** ISO date (YYYY-MM-DD) the opportunity was posted. */
  postedAt: string;
  sourceName: string;
  sourceUrl: string;
  applicationUrl: string;
  isActive: boolean;
};

export type StudentLocale = {
  city: string;
  state: string;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(value.trim());
}

/**
 * Normalize well-known city name variants so "Bangalore" matches
 * "Bengaluru" (and Bombay/Mumbai, Madras/Chennai, etc.). Only applied to
 * established English-variant aliases — unrelated cities are never merged.
 */
const CITY_ALIASES: Record<string, string> = {
  bengaluru: "bangalore",
  bangalore: "bangalore",
  bombay: "mumbai",
  mumbai: "mumbai",
  madras: "chennai",
  chennai: "chennai",
  calcutta: "kolkata",
  kolkata: "kolkata",
  newdelhi: "delhi",
  delhi: "delhi",
  poona: "pune",
  pune: "pune",
  delhincr: "delhi",
  mysuru: "mysore",
  mysore: "mysore",
  cochin: "kochi",
  kochi: "kochi",
  trivandrum: "thiruvananthapuram",
  thiruvananthapuram: "thiruvananthapuram",
};

export function normalizeCity(name: string): string {
  const cleaned = name.trim().toLowerCase();
  if (!cleaned || cleaned === "remote") return "";
  // Office-code suffixes such as "Bengaluru-VTP": try each part so the
  // real city still matches instead of being lost.
  const parts = cleaned.split(/[-/]/).map((part) => part.replace(/[^a-z]/g, ""));
  for (const part of parts) {
    if (CITY_ALIASES[part]) return CITY_ALIASES[part];
  }
  const compact = cleaned.replace(/[^a-z]/g, "");
  if (CITY_ALIASES[compact]) return CITY_ALIASES[compact];
  return parts[0] || "";
}

function sameCity(a: string, b: string): boolean {
  const x = normalizeCity(a);
  const y = normalizeCity(b);
  return Boolean(x && y && x === y);
}

/** Approximate coordinates for major cities, for radius matching only. */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  bangalore: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  pune: { lat: 18.5204, lng: 73.8567 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.209 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  kochi: { lat: 9.9312, lng: 76.2673 },
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.sqrt(h));
}

/**
 * Genuinely nearby only: used exclusively when the source supplies
 * coordinates for the opportunity. Never guessed from names.
 */
export function isNearby(
  item: Pick<Opportunity, "latitude" | "longitude">,
  locale: StudentLocale,
  radiusKm = 120,
): boolean {
  if (item.latitude == null || item.longitude == null) return false;
  const home = CITY_COORDS[normalizeCity(locale.city)];
  if (!home) return false;
  return haversineKm(home.lat, home.lng, item.latitude, item.longitude) <= radiusKm;
}

function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * An opportunity is expired when its deadline passed. For hackathons the
 * event date ending also retires it. Missing dates never count as expired —
 * but unverifiable items are still rejected without a trustworthy source.
 */
export function isExpired(item: Pick<Opportunity, "type" | "deadline" | "eventDate">): boolean {
  const today = todayISO();
  if (item.deadline && item.deadline < today) return true;
  if (item.type === "hackathon" && item.eventDate && item.eventDate < today) {
    return true;
  }
  return false;
}

function isRemoteItem(item: Pick<Opportunity, "city" | "location" | "mode">): boolean {
  return (
    item.city === "Remote" ||
    item.location === "Remote" ||
    item.mode === "Remote" ||
    item.mode === "Online"
  );
}

/**
 * Strict validation. Returns null for anything that must not be displayed:
 * missing identity, missing trustworthy source links, inactive, or expired.
 * Optional fields (stipend, eligibility, deadline) stay empty when absent —
 * they are never invented.
 */
export function validateOpportunity(input: unknown): Opportunity | null {
  if (!input || typeof input !== "object") return null;
  const data = input as Record<string, unknown>;
  const type = asString(data.type);
  if (type !== "internship" && type !== "hackathon") return null;

  const mode = asString(data.mode);
  const validModes: OpportunityMode[] = ["Online", "Offline", "Hybrid", "Remote", "On-site"];

  const item: Opportunity = {
    id: String(data.id ?? ""),
    type,
    title: asString(data.title).trim(),
    organization: asString(data.organization ?? data.company).trim(),
    description: asString(data.description).trim(),
    location: asString(data.location).trim(),
    city: asString(data.city).trim(),
    state: asString(data.state ?? data.region).trim(),
    mode: (validModes as string[]).includes(mode) ? (mode as OpportunityMode) : "Online",
    skills: asStringArray(data.skills),
    eligibility: asString(data.eligibility).trim(),
    stipend: asString(data.stipend).trim(),
    duration: asString(data.duration).trim(),
    country: asString(data.country).trim(),
    startDate: asString(data.startDate).trim(),
    registrationUrl: asString(data.registrationUrl).trim(),
    verifiedAt: asString(data.verifiedAt).trim(),
    latitude:
      typeof data.latitude === "number" && Number.isFinite(data.latitude)
        ? data.latitude
        : typeof data.lat === "number" && Number.isFinite(data.lat)
          ? (data.lat as number)
          : null,
    longitude:
      typeof data.longitude === "number" && Number.isFinite(data.longitude)
        ? data.longitude
        : typeof data.lng === "number" && Number.isFinite(data.lng)
          ? (data.lng as number)
          : null,
    deadline: asString(data.deadline).trim(),
    eventDate: asString(data.eventDate).trim(),
    postedAt: asString(data.postedAt).trim(),
    sourceName: asString(data.sourceName).trim(),
    sourceUrl: asString(data.sourceUrl).trim(),
    applicationUrl: asString(
      data.applicationUrl || data.detailsUrl || data.registrationUrl,
    ).trim(),
    isActive: data.isActive !== false,
  };

  if (!item.id || !item.title || !item.organization) return null;
  // Every displayed opportunity must be verifiable. Never show one without
  // a real source and a real application/details URL.
  if (!item.sourceName || !isHttpUrl(item.sourceUrl) || !isHttpUrl(item.applicationUrl)) {
    return null;
  }
  if (!item.isActive) return null;
  if (isExpired(item)) return null;
  return item;
}

/** Remove duplicates by stable id, source URL, application URL,
 *  organization + title + source, and the full
 *  source + title + organizer + location + deadline combination. */
export function dedupeOpportunities(items: Opportunity[]): Opportunity[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const org = item.organization.trim().toLowerCase();
    const title = item.title.trim().toLowerCase();
    const loc = `${item.city.trim().toLowerCase()}|${item.state.trim().toLowerCase()}`;
    const keys = [
      `id:${item.id}`,
      `src:${item.sourceUrl.trim().toLowerCase()}`,
      `app:${item.applicationUrl.trim().toLowerCase()}`,
      `org:${org}|${title}|${item.sourceUrl.trim().toLowerCase()}`,
      `full:${item.sourceName.trim().toLowerCase()}|${title}|${org}|${loc}|${item.deadline}`,
    ];
    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

function sortByDeadline(items: Opportunity[]): Opportunity[] {
  return [...items].sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });
}

async function loadFromApi(): Promise<Opportunity[]> {
  const endpoint = import.meta.env.VITE_GRADIVO_OPPORTUNITIES_URL as string | undefined;
  if (!endpoint) return [];
  try {
    const response = await fetch(endpoint);
    if (!response.ok) return [];
    const data = (await response.json()) as { items?: unknown[] };
    if (!Array.isArray(data.items)) return [];
    return data.items
      .map(validateOpportunity)
      .filter((item): item is Opportunity => item !== null);
  } catch {
    return [];
  }
}

async function loadFromFirestore(): Promise<Opportunity[]> {
  try {
    const snap = await getDocs(query(collection(db, "opportunities"), limit(100)));
    const out: Opportunity[] = [];
    snap.forEach((docSnap) => {
      const valid = validateOpportunity({ id: docSnap.id, ...docSnap.data() });
      if (valid) out.push(valid);
    });
    return out;
  } catch {
    // Permission or network failure: show nothing rather than fake data.
    return [];
  }
}

/**
 * Load every active, verified, unexpired opportunity from all configured
 * real sources. Returns [] when nothing is configured or found — callers
 * must show an honest empty state, never fallback data.
 */
export async function loadOpportunities(): Promise<Opportunity[]> {
  const [jsonItems, greenhouseItems, apiItems, firestoreItems] = await Promise.all([
    loadFromJson(),
    loadGreenhouseOpportunities(),
    loadFromApi(),
    loadFromFirestore(),
  ]);
  return sortByDeadline(
    dedupeOpportunities([...jsonItems, ...greenhouseItems, ...apiItems, ...firestoreItems]),
  );
}

/**
 * Primary source on Spark hosting: the scheduled GitHub Action writes
 * public/data/opportunities.json (same origin, no CORS, no functions).
 */
async function loadFromJson(): Promise<Opportunity[]> {
  try {
    const base = import.meta.env.BASE_URL || "/";
    const response = await fetch(`${base}data/opportunities.json`, { cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as { opportunities?: unknown };
    if (!data || !Array.isArray(data.opportunities)) return [];
    return data.opportunities
      .map(validateOpportunity)
      .filter((item): item is Opportunity => item !== null);
  } catch {
    return [];
  }
}

/**
 * Rank without ever mislabeling: same city first (with variant
 * normalization), then coordinate-verified nearby, then same state, then
 * remote, then everything else. Locations shown always come from the
 * source data itself.
 */
export function rankByLocation(items: Opportunity[], locale: StudentLocale): Opportunity[] {
  const rankOf = (item: Opportunity): number => {
    if (sameCity(item.city, locale.city)) return 0;
    if (isNearby(item, locale)) return 1;
    if (
      locale.state.trim() &&
      item.state.trim().toLowerCase() === locale.state.trim().toLowerCase() &&
      item.city !== "Remote"
    ) {
      return 2;
    }
    if (isRemoteItem(item)) return 3;
    return 4;
  };
  return [...items].sort((a, b) => {
    const rank = rankOf(a) - rankOf(b);
    if (rank !== 0) return rank;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });
}

/**
 * Filter for an explicit city choice. "Remote" matches remote items only.
 * City matching uses variant normalization (Bangalore = Bengaluru) —
 * unrelated cities are never merged or guessed as nearby.
 */
export function filterByCity(items: Opportunity[], city: string): Opportunity[] {
  if (city === "Remote") return items.filter(isRemoteItem);
  return items.filter((item) => sameCity(item.city, city));
}

/**
 * Shared relevance check used by both the Home alert and the Opportunities
 * "My Location" view: same city, coordinate-verified nearby, same state,
 * or remote. One definition, so both surfaces always agree.
 */
export function isRelevantToLocale(item: Opportunity, locale: StudentLocale): boolean {
  if (!locale.city.trim() && !locale.state.trim()) return true;
  if (sameCity(item.city, locale.city)) return true;
  if (isNearby(item, locale)) return true;
  if (
    locale.state.trim() &&
    item.state.trim().toLowerCase() === locale.state.trim().toLowerCase() &&
    item.city !== "Remote"
  ) {
    return true;
  }
  return isRemoteItem(item);
}

export function matchesSearch(item: Opportunity, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    item.title,
    item.organization,
    item.location,
    item.city,
    item.state,
    item.mode,
    item.eligibility,
    item.description,
    ...item.skills,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function deadlineStatus(deadline: string): {
  label: string;
  tone: "closing" | "open" | "closed";
} {
  if (!deadline) return { label: "Deadline TBA", tone: "open" };
  const target = new Date(`${deadline}T23:59:59`);
  if (Number.isNaN(target.getTime())) return { label: "Deadline TBA", tone: "open" };
  const days = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Applications closed", tone: "closed" };
  if (days === 0) return { label: "Closes today", tone: "closing" };
  if (days <= 7) return { label: `Closes in ${days}d`, tone: "closing" };
  return { label: `${days} days left`, tone: "open" };
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ---------------- Greenhouse public Job Board API ----------------
 * Public GET endpoints — no API key, no account. Board tokens are public
 * identifiers taken from a company's Greenhouse-hosted careers page
 * (boards.greenhouse.io/<token>). Add tokens below to go live.
 * An empty list means no calls are made and nothing is shown.
 */

export const GREENHOUSE_BOARD_TOKENS: string[] = [
  "stripe",
  "project44",
  "graphcore-early-careers",
  "groww",
];

type GreenhouseOffice = {
  name?: string;
  location?: string;
};

type GreenhouseListJob = {
  id: number;
  title?: string;
  updated_at?: string;
  location?: { name?: string };
  absolute_url?: string;
  departments?: { name?: string }[];
  offices?: GreenhouseOffice[];
  content?: string;
};

/** Word-boundary match: "Software Engineering Intern" passes, "Internal Tools" does not. */
const INTERN_WORD = /\bintern(ship|s)?\b/i;

/** Priority technical tracks. Only used for ordering already-accepted internships. */
const TECH_TRACKS = [
  /software|\bsde\b|\bsdet\b/,
  /c\+\+/,
  /\bpython\b/,
  /cyber|security/,
  /\bai\b|machine learning|\bml\b|artificial intelligence/,
  /cloud|aws|azure|gcp/,
  /web|front.?end|back.?end|full.?stack|react|node|javascript/,
  /\bdata\b|data science|analy/,
];

/**
 * Accept ONLY listings the source clearly identifies as internships:
 * the word "intern" / "interns" / "internship" as a standalone word in the
 * title or department. Full-time, part-time, senior, and contract roles are
 * rejected unless the title explicitly identifies them as an internship.
 * Normal jobs are never converted into internships.
 */
export function isGenuineInternshipRole(title: string, departments: string[] = []): boolean {
  return INTERN_WORD.test(`${title} ${departments.join(" ")}`);
}

/** 0 for priority technical tracks, 1 for other genuine internships. */
export function internshipTechRank(title: string, departments: string[] = []): number {
  const text = `${title} ${departments.join(" ")}`.toLowerCase();
  return TECH_TRACKS.some((re) => re.test(text)) ? 0 : 1;
}

const REMOTE_HINT = /remote|work\s*from\s*home|\bwfh\b|virtual|anywhere|distributed/i;
const INDIA_HINT = /\bindia\b/i;

export type ParsedGreenhouseLocation = {
  city: string;
  state: string;
  location: string;
  mode: OpportunityMode;
  inIndia: boolean;
  remote: boolean;
};

/**
 * Parse Greenhouse free-text locations (job location + office names).
 * Never guesses: unknown segments stay as-is for display, and acceptance
 * requires an explicit India link or an explicit remote-India link.
 */
export function parseGreenhouseLocation(
  locationName: string,
  officeNames: string[],
): ParsedGreenhouseLocation {
  const combined = [locationName, ...officeNames].filter(Boolean).join(" | ");
  const remote = REMOTE_HINT.test(combined);
  // Multi-location postings ("Austin, USA; Bengaluru, India; ...") are split
  // first so an India-linked segment is preferred over the first segment.
  const locationParts = (locationName || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const preferredPart =
    locationParts.find((part) => INDIA_HINT.test(part)) ??
    locationParts.find((part) =>
      part
        .split(",")
        .some((segment) =>
          INDIAN_STATES.some(
            (indian) => indian.toLowerCase() === segment.trim().toLowerCase(),
          ),
        ),
    ) ??
    locationParts[0] ??
    "";
  let city = "";
  let state = "";
  const segments = preferredPart
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (segments.length > 0) {
    const first = segments[0];
    if (!/^(remote|india)$/i.test(first) && !REMOTE_HINT.test(first)) {
      city = first;
    }
    const stateMatch = segments.find((segment) =>
      INDIAN_STATES.some((indian) => indian.toLowerCase() === segment.toLowerCase()),
    );
    if (stateMatch) state = stateMatch;
  }
  const inIndia =
    INDIA_HINT.test(combined) ||
    state !== "" ||
    (city !== "" && normalizeCity(city) in CITY_COORDS);
  return {
    city: remote && !city ? "Remote" : city,
    state,
    location: locationName || (remote ? "Remote" : ""),
    mode: remote ? "Remote" : /hybrid/i.test(combined) ? "Hybrid" : "On-site",
    inIndia,
    remote,
  };
}

function stripGreenhouseHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function departmentNames(job: GreenhouseListJob): string[] {
  return Array.isArray(job.departments)
    ? job.departments.map((dept) => dept?.name ?? "").filter(Boolean)
    : [];
}

/**
 * Map one Greenhouse job to an Opportunity. Returns null unless it is a
 * genuine internship with an India link (or explicit remote-India link).
 */
export function mapGreenhouseJob(
  boardToken: string,
  companyName: string,
  job: GreenhouseListJob,
  extra?: { deadline?: string; postedAt?: string },
): Opportunity | null {
  const title = (job.title ?? "").trim();
  const departments = departmentNames(job);
  if (!title || !isGenuineInternshipRole(title, departments)) return null;
  const offices = Array.isArray(job.offices) ? job.offices : [];
  const parsed = parseGreenhouseLocation(
    job.location?.name ?? "",
    offices.map((office) => [office.name ?? "", office.location ?? ""].filter(Boolean).join(", ")),
  );
  const indiaLinked = parsed.inIndia || (parsed.remote && INDIA_HINT.test(
    [job.location?.name ?? "", ...offices.map((o) => o.location ?? "")].join(" | "),
  ));
  if (!indiaLinked) return null;
  if (typeof job.id !== "number" || !job.absolute_url) return null;

  const item: Opportunity = {
    id: `greenhouse:${boardToken}:${job.id}`,
    type: "internship",
    title,
    organization: companyName,
    description: job.content ? stripGreenhouseHtml(job.content).slice(0, 1500) : "",
    location: parsed.location,
    city: parsed.city,
    state: parsed.state,
    country: parsed.inIndia ? "India" : "",
    mode: parsed.mode,
    skills: [],
    eligibility: "",
    stipend: "",
    duration: "",
    startDate: "",
    registrationUrl: "",
    verifiedAt: todayISO(),
    latitude: null,
    longitude: null,
    deadline: extra?.deadline ?? "",
    eventDate: "",
    postedAt: extra?.postedAt ?? "",
    sourceName: `${companyName} Careers (Greenhouse)`,
    sourceUrl: job.absolute_url,
    applicationUrl: job.absolute_url,
    isActive: true,
  };
  return validateOpportunity(item);
}

async function fetchGreenhouseJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Greenhouse request failed: ${response.status}`);
  return response.json() as Promise<unknown>;
}

/**
 * Fetch genuine internships from the configured Greenhouse boards.
 * Tech-track internships come first; failures per board or per job
 * silently yield nothing — never fake data.
 */
export async function loadGreenhouseOpportunities(
  tokens: string[] = GREENHOUSE_BOARD_TOKENS,
): Promise<Opportunity[]> {
  const out: Opportunity[] = [];
  for (const token of tokens) {
    const safeToken = token.trim();
    if (!safeToken) continue;
    try {
      const board = (await fetchGreenhouseJson(
        `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(safeToken)}`,
      )) as { name?: unknown };
      const companyName = typeof board?.name === "string" ? board.name.trim() : "";
      if (!companyName) continue;
      const listing = (await fetchGreenhouseJson(
        `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(safeToken)}/jobs?content=true`,
      )) as { jobs?: unknown };
      if (!Array.isArray(listing?.jobs)) continue;
      const internships = (listing.jobs as GreenhouseListJob[])
        .filter((job) =>
          isGenuineInternshipRole(job.title ?? "", departmentNames(job)),
        )
        .sort(
          (a, b) =>
            internshipTechRank(a.title ?? "", departmentNames(a)) -
            internshipTechRank(b.title ?? "", departmentNames(b)),
        );
      for (const job of internships) {
        try {
          let deadline = "";
          let postedAt = "";
          if (typeof job.id === "number") {
            const detail = (await fetchGreenhouseJson(
              `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(safeToken)}/jobs/${job.id}`,
            )) as { application_deadline?: unknown; first_published?: unknown };
            if (typeof detail?.application_deadline === "string") {
              deadline = detail.application_deadline.slice(0, 10);
            }
            if (typeof detail?.first_published === "string") {
              postedAt = detail.first_published.slice(0, 10);
            }
          }
          const mapped = mapGreenhouseJob(safeToken, companyName, job, { deadline, postedAt });
          if (mapped) out.push(mapped);
        } catch {
          // A single unreadable job never blocks the rest of the board.
        }
      }
    } catch {
      // A dead board, network failure, or CORS block yields nothing.
    }
  }
  return out;
}
