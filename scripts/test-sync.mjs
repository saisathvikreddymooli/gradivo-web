/**
 * Dependency-free tests for the sync pipeline.
 * Run: node --experimental-strip-types scripts/test-sync.mjs
 */
import {
  dedupeRecords,
  filterExpiredRecords,
  isValidRecord,
  sortRecords,
} from "./sync-opportunities.mjs";
import { isGenuineInternship } from "../functions/src/sync.ts";

const real = {
  id: "greenhouse:acme:1",
  type: "internship",
  title: "Software Engineering Intern",
  organization: "Acme",
  location: "Bangalore, Karnataka",
  city: "Bangalore",
  state: "Karnataka",
  mode: "Remote",
  skills: ["Python"],
  sourceName: "Acme Careers (Greenhouse)",
  sourceUrl: "https://acme.example/careers",
  applicationUrl: "https://acme.example/apply",
  verifiedAt: "2026-09-21",
  isActive: true,
  deadline: "2099-01-01",
};

const checks = [
  ["expired-removed", filterExpiredRecords([{ ...real, deadline: "2020-01-01" }], "2026-09-21").length === 0],
  ["future-kept", filterExpiredRecords([real], "2026-09-21").length === 1],
  ["hackathon-event-ended", filterExpiredRecords([{ ...real, type: "hackathon", deadline: "", eventDate: "2020-05-01" }], "2026-09-21").length === 0],
  ["inactive-removed", filterExpiredRecords([{ ...real, isActive: false }], "2026-09-21").length === 0],
  ["duplicate-id-removed", dedupeRecords([real, { ...real }]).length === 1],
  ["duplicate-composite-removed", dedupeRecords([real, { ...real, id: "x", applicationUrl: "https://acme.example/apply2" }]).length === 1],
  ["distinct-kept", dedupeRecords([real, { ...real, id: "y", title: "Data Intern", sourceUrl: "https://x.example/", applicationUrl: "https://x.example/a" }]).length === 2],
  ["invalid-url-removed", isValidRecord({ ...real, id: "z", applicationUrl: "notaurl" }) === null],
  ["missing-source-removed", isValidRecord({ ...real, id: "z", sourceName: "" }) === null],
  ["wrong-type-removed", isValidRecord({ ...real, id: "z", type: "course" }) === null],
  ["internship-accepted", isGenuineInternship("Python Intern", []) === true],
  ["internal-rejected", isGenuineInternship("Internal Tools Engineer", []) === false],
  ["fulltime-rejected", isGenuineInternship("Senior Software Engineer", []) === false],
  ["hackathon-accepted", isValidRecord({ ...real, id: "h", type: "hackathon" })?.type === "hackathon"],
  ["remote-preserved", isValidRecord({ ...real, id: "r", city: "Remote", mode: "Remote" })?.city === "Remote"],
  ["bangalore-variant", isValidRecord({ ...real, id: "b", city: "Bengaluru" })?.city === "Bengaluru"],
  ["missing-deadline-null-ok", (() => { const v = isValidRecord({ ...real, id: "d", deadline: null }); return v !== null && v.deadline === null; })()],
  ["missing-stipend-null-ok", (() => { const v = isValidRecord({ ...real, id: "s", stipend: null }); return v !== null && v.stipend === null; })()],
  ["no-fake-fallback", JSON.stringify(sortRecords([])) === "[]"],
  ["sort-dateless-last", (() => { const a = { ...real, id: "1", deadline: null }; const b = { ...real, id: "2", deadline: "2099-01-01" }; return sortRecords([a, b])[0].id === "2"; })()],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS " : "FAIL "}${name}`);
  if (!ok) failed = 1;
}
process.exit(failed);
