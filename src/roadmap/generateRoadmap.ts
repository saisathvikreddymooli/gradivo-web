import { KNOWN_SKILL_ALIASES, SKILLS } from "./catalog";
import type {
  CareerPlan,
  GeneratedRoadmap,
  ItemStatus,
  KnowledgeSource,
  ProgressMap,
  SkillDef,
  SkillView,
  StudentIntake,
} from "./types";

function hours(intake: StudentIntake): number {
  const n = Number.parseInt(intake.weeklyHours, 10);
  return Number.isFinite(n) ? n : 7;
}

function isLaterYear(year: string): boolean {
  const t = year.toLowerCase();
  return t.includes("3") || t.includes("4") || t.includes("third") || t.includes("fourth");
}

function isEarlyYear(year: string): boolean {
  const t = year.toLowerCase();
  return t.includes("1") || t.includes("first") || t.includes("2") || t.includes("second");
}

export function normalizeKnownSkill(label: string): string | null {
  const key = label.trim().toLowerCase().replace(/\s+/g, " ");
  if (KNOWN_SKILL_ALIASES[key]) return KNOWN_SKILL_ALIASES[key];
  const compact = key.replace(/[^a-z0-9+]/g, "");
  for (const [alias, id] of Object.entries(KNOWN_SKILL_ALIASES)) {
    if (alias.replace(/[^a-z0-9+]/g, "") === compact) return id;
  }
  if (key.includes("git")) return "git";
  if (key.includes("html") || key.includes("css")) return "web";
  if (key.includes("c++") || key === "c / c++") return "programming-fundamentals";
  if (key.includes("machine")) return "ml-basics";
  if (SKILLS[key]) return key;
  return null;
}

export function knownSkillIds(intake: StudentIntake): Set<string> {
  const ids = new Set<string>();
  for (const label of intake.knownSkills) {
    const id = normalizeKnownSkill(label);
    if (id) ids.add(id);
  }
  if (ids.has("python") || ids.has("javascript")) ids.add("programming-fundamentals");
  if (ids.has("sql")) ids.add("databases");
  return ids;
}

function toView(skill: SkillDef, have: boolean, progress: ProgressMap): SkillView {
  const status: ItemStatus = progress[skill.id] ?? (have ? "completed" : "not_started");
  return { ...skill, alreadyHave: have, status };
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

function pickViews(ids: string[], have: Set<string>, progress: ProgressMap): SkillView[] {
  return uniqueIds(ids)
    .map((id) => SKILLS[id])
    .filter((skill): skill is SkillDef => Boolean(skill))
    .map((skill) => toView(skill, have.has(skill.id), progress));
}

function nextIncomplete(skills: SkillView[]): SkillView[] {
  return skills.filter((skill) => skill.status !== "completed" && !skill.alreadyHave);
}

export function generateRoadmap(
  intake: StudentIntake,
  plan: CareerPlan,
  source: KnowledgeSource,
  progress: ProgressMap,
): GeneratedRoadmap {
  const have = knownSkillIds(intake);
  const foundation = pickViews(plan.foundation, have, progress);
  const core = pickViews(plan.core, have, progress);
  const specialization = pickViews(plan.specialization, have, progress);
  const emerging = pickViews(plan.emerging, have, progress).map((skill) => ({
    ...skill,
    layer: "emerging" as const,
    why: `${skill.why} Treat this as worth monitoring — not a guaranteed requirement.`,
  }));

  const ordered = [...foundation, ...core, ...specialization];
  const alreadyHave = ordered.filter((skill) => skill.alreadyHave || skill.status === "completed");
  const skillsNeeded = nextIncomplete(ordered);
  const learnFirst = skillsNeeded[0] ?? null;
  const learnNext = skillsNeeded.slice(1, 3);

  const weekly = hours(intake);
  const beginner = intake.skillLevel === "beginner";
  const advanced = intake.skillLevel === "advanced";
  const later = isLaterYear(intake.year);
  const early = isEarlyYear(intake.year) && !later;

  const whereYouAre = [
    intake.year || "Year not set",
    intake.semester ? `semester ${intake.semester}` : null,
    intake.branch || "branch not set",
    `${intake.skillLevel} level`,
    `about ${weekly} hours/week`,
  ]
    .filter(Boolean)
    .join(" · ");

  const firstName = learnFirst?.name ?? "a small project that proves a skill you already have";
  const project = plan.projects[0];

  const next30 = beginner
    ? [
        `Start here: ${firstName} at the beginner level only.`,
        weekly < 6
          ? "Keep this month tiny: 3 short practice sessions and one mini-project file on GitHub."
          : "Practice 4–6 times this month and finish one small project you can demo.",
        "Write a README for whatever you build. That is part of the skill.",
      ]
    : [
        learnFirst
          ? `Continue ${learnFirst.name} from the ${intake.skillLevel} checkpoint, not from zero.`
          : "You already covered the first skills — improve a project and add tests or a writeup.",
        project ? `Build: ${project.title}.` : "Ship one improvement to an existing project.",
        later
          ? "Draft a one-page internship story: problem, what you did, what you learned."
          : "Put this month’s work on GitHub in a repo someone else could run.",
      ];

  const next3Months = [
    skillsNeeded[1]
      ? `Add ${skillsNeeded[1].name} after you can explain ${firstName} in your own words.`
      : "Deepen one core skill instead of adding a new tool.",
    `Complete this project: ${project?.title ?? "a portfolio piece with a README"}.`,
    early
      ? "Stay mostly on foundation and one core skill. You do not need a huge stack yet."
      : "Start looking at internship descriptions as checklists — not as a panic list to learn all at once.",
  ];

  const next6Months = [
    skillsNeeded[2]
      ? `Work toward ${skillsNeeded[2].name} if the earlier skills feel usable.`
      : "Build a second project that is harder than the first, not just a new tutorial.",
    advanced || later
      ? "Practice interview-style explanations of your projects weekly."
      : "Join one club, hackathon, or open-source issue for teamwork evidence.",
    "Review emerging topics as “watch list,” not as your main study plan.",
  ];

  const longTerm = [
    plan.targetSummary,
    "Keep foundation skills sharp while swapping current tools as the industry shifts.",
    "Aim for proof: projects, writeups, and internships — not a never-ending course list.",
  ];

  if (weekly < 5) {
    next30.push("With limited hours, one skill plus GitHub beats five unfinished tutorials.");
  }

  const nextAction = learnFirst
    ? {
        title: learnFirst.name,
        why: learnFirst.why,
        skillId: learnFirst.id,
      }
    : {
        title: project?.title ?? "Improve your strongest project",
        why: project?.why ?? "Proof of skill matters more than adding another topic.",
        project: project?.prompt,
      };

  return {
    source,
    whereYouAre,
    targetCareer: `${plan.title}${intake.targetRole ? ` · aiming for ${intake.targetRole}` : ""}`,
    alreadyHave,
    skillsNeeded,
    learnFirst,
    learnNext,
    projects: plan.projects,
    tools: plan.tools,
    certifications: plan.certifications,
    internships: plan.internships,
    interview: plan.interview,
    portfolio: plan.portfolio,
    next30,
    next3Months,
    next6Months,
    longTerm,
    stages: [
      {
        id: "you-are-here",
        title: "You are here",
        summary: whereYouAre,
        skillIds: alreadyHave.slice(0, 4).map((s) => s.id),
      },
      {
        id: "foundation",
        title: "Foundation",
        summary: "Skills that stay useful even when tools change.",
        skillIds: plan.foundation,
      },
      {
        id: "core",
        title: "Core skills",
        summary: "Current skills most relevant to this target.",
        skillIds: plan.core,
      },
      {
        id: "specialization",
        title: "Specialization",
        summary: "Go deeper after the core is usable.",
        skillIds: plan.specialization,
      },
      {
        id: "projects",
        title: "Projects",
        summary: "Proof you can use the skills.",
        skillIds: [],
      },
      {
        id: "internships",
        title: "Internships",
        summary: "Experience to target when you have evidence.",
        skillIds: [],
      },
      {
        id: "interview",
        title: "Interview prep",
        summary: "Explain your work; practice the skills the role actually uses.",
        skillIds: [],
      },
      {
        id: "target-role",
        title: "Target role",
        summary: plan.targetSummary,
        skillIds: emerging.map((s) => s.id),
      },
    ],
    nextAction,
  };
}
