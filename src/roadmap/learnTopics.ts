import type { CareerGoal } from "./types";

/** Shared topic ids point directly at SKILLS in catalog.ts. */
export const LEARN_TRACKS = [
  { title: "Programming Basics", level: "Beginner", icon: "code", topics: ["programming-fundamentals", "python", "problem-solving"] },
  { title: "Web Development", level: "Beginner → Intermediate", icon: "web", topics: ["web", "javascript", "react", "apis"] },
  { title: "Cybersecurity Basics", level: "Beginner", icon: "security", topics: ["linux", "networking", "web-security", "security-mindset"] },
  { title: "AI & Python", level: "Beginner → Intermediate", icon: "ai", topics: ["ai-literacy", "python", "pandas", "ml-basics", "deep-learning", "llms", "rag", "ai-agents"] },
] as const;

export const TOPIC_ROADMAPS: Record<string, CareerGoal[]> = {
  "programming-fundamentals": ["software-engineer", "ai-ml-engineer", "cybersecurity-engineer", "full-stack-developer"],
  python: ["ai-ml-engineer", "software-engineer", "data-analyst", "cybersecurity-engineer"],
  "problem-solving": ["software-engineer", "ai-ml-engineer", "cybersecurity-engineer"],
  git: ["software-engineer", "ai-ml-engineer", "full-stack-developer"],
  web: ["full-stack-developer", "software-engineer", "cybersecurity-engineer"],
  javascript: ["full-stack-developer", "software-engineer"],
  react: ["full-stack-developer", "software-engineer"],
  apis: ["software-engineer", "ai-ml-engineer", "cloud-engineer", "cybersecurity-engineer"],
  linux: ["cybersecurity-engineer", "cloud-engineer", "devops-engineer"],
  networking: ["cybersecurity-engineer", "cloud-engineer", "devops-engineer"],
  "web-security": ["cybersecurity-engineer", "full-stack-developer"],
  "security-mindset": ["cybersecurity-engineer"],
  cloud: ["cloud-engineer", "devops-engineer", "cybersecurity-engineer"],
  pandas: ["ai-ml-engineer", "data-analyst", "data-engineer"],
  "ml-basics": ["ai-ml-engineer", "data-analyst"],
  "deep-learning": ["ai-ml-engineer"],
  llms: ["ai-ml-engineer", "software-engineer"],
  rag: ["ai-ml-engineer", "software-engineer"],
  "ai-agents": ["ai-ml-engineer", "software-engineer"],
  "ai-apps": ["ai-ml-engineer", "software-engineer", "full-stack-developer"],
  "ai-literacy": ["ai-ml-engineer", "software-engineer", "cybersecurity-engineer"],
};

export const CAREER_TOPIC_PATHS: Partial<Record<CareerGoal, string[]>> = {
  "ai-ml-engineer": ["programming-fundamentals", "python", "git", "pandas", "ml-basics", "deep-learning", "llms", "rag", "ai-agents", "ai-apps"],
  "software-engineer": ["programming-fundamentals", "python", "git", "apis", "web", "javascript", "react", "ai-apps"],
  "cybersecurity-engineer": ["programming-fundamentals", "linux", "networking", "python", "security-mindset", "web-security", "cloud"],
  "cloud-engineer": ["programming-fundamentals", "linux", "networking", "apis", "cloud", "docker", "automation"],
  "full-stack-developer": ["programming-fundamentals", "git", "javascript", "web", "apis", "react", "databases"],
  "data-analyst": ["python", "sql", "pandas", "ml-basics"],
  "data-engineer": ["python", "sql", "databases", "pandas", "cloud"],
  "devops-engineer": ["linux", "networking", "git", "docker", "cloud", "automation"],
};
