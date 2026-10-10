export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type CareerGoal =
  | "software-engineer"
  | "ai-ml-engineer"
  | "cybersecurity-engineer"
  | "cloud-engineer"
  | "full-stack-developer"
  | "data-analyst"
  | "data-engineer"
  | "devops-engineer"
  | "product-startup"
  | "other";

export type SkillLayer = "foundation" | "current" | "emerging";

export type ItemStatus = "not_started" | "learning" | "completed";

export type StudentIntake = {
  year: string;
  semester: string;
  branch: string;
  skillLevel: SkillLevel;
  knownSkills: string[];
  careerGoal: CareerGoal;
  interests: string[];
  weeklyHours: string;
  targetRole: string;
  /** User-declared target timeline in months ("3" | "6" | "12"). Defaults to "6". */
  timelineMonths: string;
};

export type Resource = {
  title: string;
  note: string;
};

export type SkillDef = {
  id: string;
  name: string;
  layer: SkillLayer;
  why: string;
  whatToLearn: string;
  beginner: string;
  intermediate: string;
  advanced: string;
  project: string;
  resources: Resource[];
  careerLink: string;
};

export type Certification = {
  name: string;
  usefulWhen: string;
  why: string;
};

export type CareerPlan = {
  id: CareerGoal;
  title: string;
  targetSummary: string;
  foundation: string[];
  core: string[];
  specialization: string[];
  emerging: string[];
  tools: string[];
  projects: { title: string; why: string; prompt: string }[];
  certifications: Certification[];
  internships: string[];
  interview: string[];
  portfolio: string[];
};

export type SkillView = SkillDef & {
  alreadyHave: boolean;
  status: ItemStatus;
};

export type RoadmapStageId =
  | "you-are-here"
  | "foundation"
  | "core"
  | "specialization"
  | "projects"
  | "internships"
  | "interview"
  | "target-role";

export type RoadmapStage = {
  id: RoadmapStageId;
  title: string;
  summary: string;
  skillIds: string[];
};

export type KnowledgeSource = {
  version: string;
  isLive: boolean;
  label: string;
};

export type GeneratedRoadmap = {
  source: KnowledgeSource;
  whereYouAre: string;
  targetCareer: string;
  alreadyHave: SkillView[];
  skillsNeeded: SkillView[];
  learnFirst: SkillView | null;
  learnNext: SkillView[];
  projects: CareerPlan["projects"];
  tools: string[];
  certifications: Certification[];
  internships: string[];
  interview: string[];
  portfolio: string[];
  next30: string[];
  next3Months: string[];
  next6Months: string[];
  longTerm: string[];
  stages: RoadmapStage[];
  nextAction: { title: string; why: string; skillId?: string; project?: string };
};

export type ProgressMap = Record<string, ItemStatus>;
