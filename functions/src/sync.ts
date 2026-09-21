/**
 * Pure Greenhouse sync logic (no firebase-admin imports) so it can be
 * unit-tested in isolation. Mirrors the validation rules in
 * `src/services/opportunityService.ts`: genuine internships only, India or
 * explicit remote-India link required, real URLs only, nothing invented.
 */

export type NormalizedOpportunity = {
  id: string;
  type: "internship";
  title: string;
  organization: string;
  description: string;
  location: string;
  city: string;
  state: string;
  country: string;
  mode: "Online" | "Offline" | "Hybrid" | "Remote" | "On-site";
  skills: string[];
  eligibility: string;
  stipend: string;
  duration: string;
  startDate: string;
  registrationUrl: string;
  verifiedAt: string;
  latitude: number | null;
  longitude: number | null;
  deadline: string;
  eventDate: string;
  postedAt: string;
  sourceName: string;
  sourceUrl: string;
  applicationUrl: string;
  isActive: boolean;
  provider: "greenhouse";
  boardToken: string;
  externalId: string;
};

export type FetchImpl = (url: string) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

type GreenhouseJob = {
  id: number;
  title?: string;
  location?: { name?: string };
  absolute_url?: string;
  departments?: { name?: string }[];
  offices?: { name?: string; location?: string }[];
  content?: string;
};

const INTERN_WORD = /\bintern(ship|s)?\b/i;

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

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

const REMOTE_HINT = /remote|work\s*from\s*home|\bwfh\b|virtual|anywhere|distributed/i;
const INDIA_HINT = /\bindia\b/i;

function departmentNames(job: GreenhouseJob): string[] {
  return Array.isArray(job.departments)
    ? job.departments.map((dept) => dept?.name ?? "").filter(Boolean)
    : [];
}

export function isGenuineInternship(title: string, departments: string[]): boolean {
  return INTERN_WORD.test(`${title} ${departments.join(" ")}`);
}

function techRank(title: string, departments: string[]): number {
  const text = `${title} ${departments.join(" ")}`.toLowerCase();
  return TECH_TRACKS.some((re) => re.test(text)) ? 0 : 1;
}

function stripHtml(html: string): string {
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

function isHttpUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(value.trim());
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseLocation(locationName: string, officeNames: string[]): {
  city: string;
  state: string;
  mode: NormalizedOpportunity["mode"];
  remote: boolean;
  inIndia: boolean;
} {
  const combined = [locationName, ...officeNames].filter(Boolean).join(" | ");
  const remote = REMOTE_HINT.test(combined);
  let city = "";
  let state = "";
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
  const inIndia = INDIA_HINT.test(combined) || state !== "";
  return {
    city: remote && !city ? "Remote" : city,
    state,
    mode: remote ? "Remote" : /hybrid/i.test(combined) ? "Hybrid" : "On-site",
    remote,
    inIndia,
  };
}

export function normalizeJob(
  boardToken: string,
  companyName: string,
  job: GreenhouseJob,
  detail?: { deadline?: string; postedAt?: string },
  verifiedAt: string = todayISO(),
): NormalizedOpportunity | null {
  const title = (job.title ?? "").trim();
  const departments = departmentNames(job);
  if (!title || !isGenuineInternship(title, departments)) return null;
  const offices = Array.isArray(job.offices) ? job.offices : [];
  const parsed = parseLocation(
    job.location?.name ?? "",
    offices.map((office) =>
      [office.name ?? "", office.location ?? ""].filter(Boolean).join(", "),
    ),
  );
  const officeText = offices.map((office) => office.location ?? "").join(" | ");
  const indiaLinked =
    parsed.inIndia ||
    (parsed.remote && INDIA_HINT.test(`${job.location?.name ?? ""} | ${officeText}`));
  if (!indiaLinked) return null;
  if (typeof job.id !== "number" || !job.absolute_url || !isHttpUrl(job.absolute_url)) {
    return null;
  }
  return {
    id: `greenhouse:${boardToken}:${job.id}`,
    type: "internship",
    title,
    organization: companyName,
    description: job.content ? stripHtml(job.content).slice(0, 1500) : "",
    location: parsed.remote && !parsed.city ? "Remote" : job.location?.name ?? "",
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
    verifiedAt,
    latitude: null,
    longitude: null,
    deadline: detail?.deadline ?? "",
    eventDate: "",
    postedAt: detail?.postedAt ?? "",
    sourceName: `${companyName} Careers (Greenhouse)`,
    sourceUrl: job.absolute_url,
    applicationUrl: job.absolute_url,
    isActive: true,
    provider: "greenhouse",
    boardToken,
    externalId: String(job.id),
  };
}

async function getJson(fetchImpl: FetchImpl, url: string): Promise<unknown> {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Greenhouse request failed (${response.status}): ${url}`);
  return response.json();
}

export type BoardSyncResult = {
  token: string;
  company: string;
  records: NormalizedOpportunity[];
};

/**
 * Sync one board: published jobs → genuine internships → normalized
 * records (tech tracks first). Throws when the board itself is unreadable
 * so the caller can log it and continue with other boards.
 */
export async function syncBoard(
  token: string,
  fetchImpl: FetchImpl,
  verifiedAt: string = todayISO(),
): Promise<BoardSyncResult> {
  const safeToken = token.trim();
  const board = (await getJson(
    fetchImpl,
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(safeToken)}`,
  )) as { name?: unknown };
  const companyName = typeof board?.name === "string" ? board.name.trim() : "";
  if (!companyName) throw new Error(`Board has no company name: ${safeToken}`);
  const listing = (await getJson(
    fetchImpl,
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(safeToken)}/jobs?content=true`,
  )) as { jobs?: unknown };
  const jobs = Array.isArray(listing?.jobs) ? (listing.jobs as GreenhouseJob[]) : [];
  const internships = jobs
    .filter((job) => isGenuineInternship(job.title ?? "", departmentNames(job)))
    .sort((a, b) => techRank(a.title ?? "", departmentNames(a)) - techRank(b.title ?? "", departmentNames(b)));
  const records: NormalizedOpportunity[] = [];
  for (const job of internships) {
    let deadline = "";
    let postedAt = "";
    try {
      if (typeof job.id === "number") {
        const detail = (await getJson(
          fetchImpl,
          `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(safeToken)}/jobs/${job.id}`,
        )) as { application_deadline?: unknown; first_published?: unknown };
        if (typeof detail?.application_deadline === "string") {
          deadline = detail.application_deadline.slice(0, 10);
        }
        if (typeof detail?.first_published === "string") {
          postedAt = detail.first_published.slice(0, 10);
        }
      }
    } catch {
      // Detail lookup is best-effort; the listing itself stays usable.
    }
    const record = normalizeJob(safeToken, companyName, job, { deadline, postedAt }, verifiedAt);
    if (record) records.push(record);
  }
  return { token: safeToken, company: companyName, records };
}

/** IDs of previously synced records missing from a fresh run → deactivate. */
export function computeStaleIds(existingIds: string[], freshIds: string[]): string[] {
  const fresh = new Set(freshIds);
  return existingIds.filter((id) => !fresh.has(id));
}
