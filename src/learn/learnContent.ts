import {
  Award,
  Bot,
  Code2,
  MessagesSquare,
  Rocket,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type LearnRoleId =
  | "software-development"
  | "web-development"
  | "data-ai"
  | "cloud-devops"
  | "app-development"
  | "cybersecurity"
  | "ui-ux";

export type Requirement = {
  icon: LucideIcon;
  title: string;
  sentence: string;
};

export type LearnRole = {
  id: LearnRoleId;
  label: string;
  /** Starting skills shown in Step 1. */
  foundation: string[];
  /** Skills and practical checks shown in Step 2. */
  coreSkills: string[];
  /** AI guidance shown in Step 3. */
  aiSkills: string[];
  /** Example project for Step 4. */
  projectExample: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
};

export const LEARN_REQUIREMENTS: Requirement[] = [
  {
    icon: Code2,
    title: "Technical foundations",
    sentence: "Essential: understand the basics of your field and break problems into steps. You should be able to explain your solution without relying on AI.",
  },
  {
    icon: Rocket,
    title: "Real projects",
    sentence: "Build a small project that solves a clear problem. Be ready to show how it works and explain the choices you made.",
  },
  {
    icon: Bot,
    title: "AI fluency",
    sentence: "Ask AI for explanations, ideas, or debugging help. Check its answers, test its code, and understand changes before using them.",
  },
  {
    icon: TrendingUp,
    title: "Git and GitHub",
    sentence: "Learn the basics of saving and sharing code. A public portfolio helps in many development roles; expectations differ by role.",
  },
  {
    icon: MessagesSquare,
    title: "Communication and teamwork",
    sentence: "Explain your ideas, listen to feedback, and work with others to finish a task.",
  },
  {
    icon: Award,
    title: "Practical experience",
    sentence: "Practise role-related interview questions and explaining your choices. Internships, hackathons, and open-source work are useful, but not required for every role.",
  },
];

export const LEARN_ROLES: LearnRole[] = [
  {
    id: "software-development",
    label: "Software Development",
    foundation: [
      "Start with Python, Java, or C++. Learn variables, choices, loops, and functions.",
      "Practise five small problems, such as adding a shopping list; these basics help you understand code and AI suggestions.",
      "Move on when you can write and explain a small program without copying a solution.",
    ],
    coreSkills: [
      "Choose Python, Java, or C++; learn functions, lists, and basic data structures.",
      "Practise arrays, strings, searching, and sorting with small problems.",
      "Use Git to track changes. Move on when you can write and explain a small program yourself.",
    ],
    aiSkills: [
      "Use clear prompting (instructions for AI) to ask for an explanation or another way to solve a problem.",
      "Run tests and check the code line by line before using an AI suggestion.",
      "Optional: add an AI feature after your basic program works without it.",
    ],
    projectExample: "Project idea: make a small study planner or expense tracker, then add a few tests.",
  },
  {
    id: "web-development",
    label: "Web Development",
    foundation: [
      "Start with HTML for page content, CSS for layout, and JavaScript for interactions.",
      "Practise by making a page with a heading, image, and button that responds to a click.",
      "Move on when you can make a small page and explain how its parts work.",
    ],
    coreSkills: [
      "Learn HTML for page content, CSS for layout, and JavaScript for interactions.",
      "Build a small page, then learn React to split it into reusable parts.",
      "Use an API to show real data. Move on when you can build and explain a working page.",
    ],
    aiSkills: [
      "Ask AI to explain unfamiliar code or suggest a first draft from clear instructions.",
      "Check accessibility, security, and browser behavior; test every suggested change.",
      "Optional: add a small AI feature, such as a help chat, only after the site works well.",
    ],
    projectExample: "Project idea: build a student event page that reads events from an API (a service that shares data).",
  },
  {
    id: "data-ai",
    label: "AI, Machine Learning & Data Analytics",
    foundation: [
      "Start with Python and simple maths such as averages, fractions, and percentages.",
      "Practise by sorting a small table and calculating its totals; check your answer by hand.",
      "Move on when you can explain where the data came from and what your result means.",
    ],
    coreSkills: [
      "Learn Python basics, then use pandas to sort and summarize a small dataset.",
      "Use SQL to find rows and totals in a database; learn basic averages and percentages.",
      "Make a chart and explain what it shows. Move on when you can check your data and results.",
    ],
    aiSkills: [
      "Ask AI to explain a chart or help draft analysis code, then check the result against the data.",
      "Learn how a machine-learning model finds patterns and why its answer can be wrong.",
      "Optional: try a small prediction or AI API project and document its limits.",
    ],
    projectExample: "Project idea: use a public dataset to answer one question, then show the result in a chart.",
  },
  {
    id: "cloud-devops",
    label: "Cloud Computing & DevOps",
    foundation: [
      "Start with how files, folders, and programs work; then learn basic Linux commands.",
      "Practise by finding files and running a simple program from the command line.",
      "Move on when you can explain where an app runs and how it reaches the internet.",
    ],
    coreSkills: [
      "Learn command-line and Linux basics, plus how computers send data over a network.",
      "Deploy a simple app to one cloud service; learn what servers, storage, and permissions do.",
      "Learn Git and basic automated checks. Move on when you can deploy and update your app safely.",
    ],
    aiSkills: [
      "Ask AI to explain commands and cloud errors; never paste passwords, keys, or private data.",
      "Check commands before running them and verify changes in a test environment.",
      "Optional: use AI to draft a deployment checklist, then verify every step yourself.",
    ],
    projectExample: "Project idea: put a simple website online and write down how you deployed and updated it.",
  },
  {
    id: "app-development",
    label: "App Development",
    foundation: [
      "Choose Flutter with Dart or Kotlin. Start with variables, choices, loops, and functions.",
      "Practise by making a screen with a title, a text field, and a button.",
      "Move on when you can explain how a user moves through your small app.",
    ],
    coreSkills: [
      "Choose Flutter with Dart or learn Kotlin; start with variables, functions, and simple screens.",
      "Build screen navigation and forms, then save data on the phone or through an API.",
      "Test on a phone or emulator. Move on when someone else can use your app without help.",
    ],
    aiSkills: [
      "Ask AI to explain a screen or help find a bug; keep the design and code understandable.",
      "Test AI-suggested changes on different screen sizes and check for data or privacy issues.",
      "Optional: add one smart feature after the main app flow works reliably.",
    ],
    projectExample: "Project idea: make a simple habit tracker that saves a user's daily progress.",
  },
  {
    id: "cybersecurity",
    label: "Cybersecurity",
    foundation: [
      "Start with basic computer parts, files, and Linux commands; then learn how devices connect.",
      "Practise by tracing a simple web request or completing a beginner task in a legal training lab.",
      "Move on when you can describe a basic risk and one safe way to reduce it.",
    ],
    coreSkills: [
      "Learn Linux commands and networking basics, including how devices communicate.",
      "Understand web requests, accounts, and common security weaknesses.",
      "Practise only in legal training labs. Move on when you can explain a risk and a safe fix.",
    ],
    aiSkills: [
      "Ask AI to explain a log or security term, then confirm it with trusted documentation.",
      "Never paste passwords, private records, or security keys into an AI tool.",
      "Use AI only as a helper in legal practice labs; verify every suggested command.",
    ],
    projectExample: "Project idea: complete a beginner security lab and write a report explaining the issue and safe fix.",
  },
  {
    id: "ui-ux",
    label: "UI / UX",
    foundation: [
      "Start with layout, readable text, colour contrast, and how people use a screen. You do not need to code first.",
      "Practise by sketching one screen for a real task, such as finding a campus event.",
      "Move on when someone can try your design and tell you what is clear or confusing.",
    ],
    coreSkills: [
      "Learn layout, readable text, colour contrast, and how people move through a screen.",
      "Use Figma to sketch a screen and make a clickable prototype.",
      "Ask a few people to try it and improve confusing parts. Coding is not required to begin.",
    ],
    aiSkills: [
      "Ask AI for design ideas or draft text, then compare them with what users need.",
      "Check that generated text is accurate, clear, accessible, and not misleading.",
      "Use AI for a first draft only; test the finished design with people.",
    ],
    projectExample: "Project idea: make a clickable prototype for a student task and improve it after feedback.",
  },
];

export const LEARN_STEP_TIMES = [
  "Start here",
  "Choose your role",
  "Use as a helper",
  "Show what you can do",
] as const;

export const LEARN_CHECKLIST: ChecklistItem[] = [
  { id: "two-projects", label: "Built projects I can explain" },
  { id: "portfolio-live", label: "Shared a portfolio or project demo" },
  { id: "github-active", label: "Saved and shared code with GitHub" },
  { id: "resume-ready", label: "Prepared a clear, current resume" },
  { id: "interviews-practised", label: "Practised role-related interview questions" },
  { id: "one-ai-tool", label: "Used an AI tool and checked its answers" },
  { id: "explain-work", label: "Explained a project and what I learned" },
];

/** Match a saved profile goal ("Frontend Developer", …) to a role tab. */
export function roleFromGoal(goal: string): LearnRoleId {
  const g = goal.toLowerCase();
  if (g.includes("data") || g.includes("ai") || g.includes("ml") || g.includes("machine"))
    return "data-ai";
  if (g.includes("app") || g.includes("mobile") || g.includes("flutter") || g.includes("android"))
    return "app-development";
  if (g.includes("cloud") || g.includes("devops") || g.includes("infrastructure"))
    return "cloud-devops";
  if (g.includes("cyber") || g.includes("secur")) return "cybersecurity";
  if (g.includes("ui") || g.includes("ux") || g.includes("design")) return "ui-ux";
  if (g.includes("software") || g.includes("backend") || g.includes("computer science"))
    return "software-development";
  return "web-development";
}
