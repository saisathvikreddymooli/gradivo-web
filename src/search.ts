import type { ConnectTab } from "./connect/types";

/**
 * Centralized homepage-search routing.
 *
 * Every query is normalized (trimmed, lowercased, whitespace-collapsed) and
 * matched against intentional whole-word keywords — never broad substring
 * chains — so "community" can only ever reach Community, "projects" only
 * the projects feature, and so on.
 *
 * Returns the existing destination page (plus an optional Connect tab), or
 * null when nothing in Gradivo matches. There is deliberately NO fallback
 * page: unknown queries keep the user where they are with a message.
 */

export type SearchDestination =
  | { page: "home" | "profile" | "roadmap" | "learn" | "careers" | "opportunities" | "community" }
  | { page: "connect"; tab?: ConnectTab };

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function wordsOf(query: string): Set<string> {
  return new Set(
    query
      .split(/[^a-z0-9+#/]+/)
      .map((word) => word.trim())
      .filter(Boolean),
  );
}

type Rule = {
  page: SearchDestination;
  phrases?: string[];
  words?: string[];
};

/**
 * Ordered by priority: exact page/category matches first, then specific
 * multi-word phrases, then single whole-word keywords.
 */
const RULES: Rule[] = [
  // Exact page names win over everything.
  { page: { page: "home" }, phrases: ["home", "homepage", "main page"], words: ["home", "homepage", "main"] },
  { page: { page: "roadmap" }, phrases: ["roadmap", "roadmaps"] },
  { page: { page: "learn" }, phrases: ["learn", "learning"] },
  { page: { page: "careers" }, phrases: ["career", "careers"] },
  { page: { page: "opportunities" }, phrases: ["opportunity", "opportunities"] },
  { page: { page: "community" }, phrases: ["community", "communities"] },
  { page: { page: "connect" }, phrases: ["connect"] },
  { page: { page: "profile" }, phrases: ["profile", "account"] },

  // Specific multi-word phrases before single keywords.
  { page: { page: "roadmap" }, phrases: ["learning path", "career path", "my path", "career roadmap", "career roadmaps"] },
  { page: { page: "careers" }, phrases: ["career options", "career paths", "software engineer", "software engineering", "cybersecurity career", "ai career", "cloud career"] },
  { page: { page: "opportunities" }, phrases: ["jobs/opportunities", "jobs / opportunities"] },
  {
    page: { page: "community" },
    phrases: ["student community", "student communities", "student group", "student groups", "study group", "study groups"],
  },
  { page: { page: "connect", tab: "projects" }, phrases: ["student projects", "project ideas", "build projects", "portfolio projects", "find teammates", "find a team"] },
  { page: { page: "learn" }, phrases: ["data structures", "web development", "artificial intelligence", "machine learning"] },

  // Single whole-word keywords.
  { page: { page: "roadmap" }, words: ["roadmap", "roadmaps", "path"] },
  {
    page: { page: "learn" },
    words: ["learn", "learning", "course", "courses", "skill", "skills", "tutorial", "tutorials", "coding", "programming", "c", "python", "java", "dsa", "cybersecurity", "ai", "cloud", "development", "ml"],
  },
  {
    page: { page: "careers" },
    words: ["career", "careers", "job", "jobs", "developer", "developers", "engineer", "engineering"],
  },
  {
    page: { page: "opportunities" },
    words: ["opportunity", "opportunities", "internship", "internships", "hackathon", "hackathons", "competition", "competitions", "event", "events", "placement", "placements"],
  },
  {
    page: { page: "community" },
    words: ["community", "communities", "group", "groups"],
  },
  {
    page: { page: "connect" },
    words: ["connect", "connections", "discussion", "discussions", "students", "network", "networking", "chat", "message", "messages"],
  },
  { page: { page: "connect", tab: "projects" }, words: ["project", "projects", "portfolio", "teammates"] },
];

export function getSearchDestination(raw: string): SearchDestination | null {
  const query = normalizeSearchQuery(raw);
  if (!query) return null;
  // Pass 1: exact phrase match, in priority order. Equality only — so
  // "learning path" can never be stolen by the bare "learning" keyword.
  for (const rule of RULES) {
    if (rule.phrases && rule.phrases.some((phrase) => query === phrase)) {
      return rule.page;
    }
  }
  // Pass 2: whole-word keyword match, in priority order.
  const words = wordsOf(query);
  for (const rule of RULES) {
    if (rule.words && rule.words.some((word) => words.has(word))) {
      return rule.page;
    }
  }
  return null;
}

export function destinationLabel(dest: SearchDestination): string {
  if (dest.page === "connect" && dest.tab === "projects") return "Projects";
  const labels: Record<string, string> = {
    home: "Home",
    profile: "Profile",
    roadmap: "Roadmap",
    learn: "Learn",
    careers: "Careers",
    opportunities: "Opportunities",
    community: "Community",
    connect: "Connect",
  };
  return labels[dest.page] ?? dest.page;
}
