import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Map,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { CAREER_LABELS, CAREER_PLANS, SKILL_OPTIONS, SKILLS } from "../roadmap/catalog";
import { generateRoadmap } from "../roadmap/generateRoadmap";
import { askGradivoAI } from "../roadmap/mentor";
import { loadIntake, saveIntake, setItemStatus } from "../roadmap/progress";
import { loadKnowledgeSource } from "../roadmap/roadmapSource";
import type {
  CareerGoal,
  GeneratedRoadmap,
  ItemStatus,
  KnowledgeSource,
  ProgressMap,
  SkillLevel,
  SkillView,
  StudentIntake,
} from "../roadmap/types";

type Colors = {
  bg: string;
  card: string;
  card2: string;
  border: string;
  inputBorder: string;
  purple: string;
  purple2: string;
  text: string;
  muted: string;
  labelText: string;
  inputBg: string;
  navBg: string;
  panel: string;
  glowCard: string;
};

type ProfileBits = {
  name: string;
  branch: string;
  year: string;
  interests: string[];
  goal: string;
};

const emptyIntake: StudentIntake = {
  year: "",
  semester: "",
  branch: "",
  skillLevel: "beginner",
  knownSkills: [],
  careerGoal: "software-engineer",
  interests: [],
  weeklyHours: "7",
  targetRole: "",
};

const suggestedQuestions = [
  "What should I learn this week?",
  "Why do I need DSA?",
  "I already know Python. What's next?",
  "What project should I build?",
  "Am I ready for an internship?",
  "What skills are currently relevant to my target role?",
  "How can I improve my roadmap?",
];

function guessCareer(goal: string): CareerGoal {
  const g = goal.toLowerCase();
  if (g.includes("cyber")) return "cybersecurity-engineer";
  if (g.includes("ml") || g.includes("machine") || g.includes("ai")) return "ai-ml-engineer";
  if (g.includes("cloud")) return "cloud-engineer";
  if (g.includes("full")) return "full-stack-developer";
  if (g.includes("devops")) return "devops-engineer";
  if (g.includes("data engineer")) return "data-engineer";
  if (g.includes("data") || g.includes("analyst")) return "data-analyst";
  if (g.includes("startup") || g.includes("product")) return "product-startup";
  if (g.includes("software")) return "software-engineer";
  return "other";
}

function statusLabel(status: ItemStatus) {
  if (status === "completed") return "Completed";
  if (status === "learning") return "Learning";
  return "Not started";
}

export default function StudentRoadmap({
  profile,
  colors,
  onBack,
  onOpenProfile,
  classicSteps,
  initialCareerGoal,
  progress,
  onProgressChange,
  onLearnTopic,
}: {
  profile: ProfileBits;
  colors: Colors;
  onBack: () => void;
  onOpenProfile: () => void;
  classicSteps: { title: string; time: string; items: string[]; icon: ReactNode }[];
  initialCareerGoal: CareerGoal | null;
  progress: ProgressMap;
  onProgressChange: (progress: ProgressMap) => void;
  onLearnTopic: (topicId: string, goal: CareerGoal) => void;
}) {
  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 9,
    border: `1px solid ${colors.inputBorder}`,
    background: colors.inputBg,
    color: colors.text,
    outline: "none",
    fontSize: 14,
  };
  const fieldLabel: CSSProperties = {
    display: "grid",
    gap: 8,
    color: colors.labelText,
    fontSize: 13,
    fontWeight: 650,
  };
  const card: CSSProperties = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 18,
    padding: 24,
  };
  const primary: CSSProperties = {
    border: "none",
    background: colors.purple,
    color: "white",
    padding: "12px 18px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 8px 30px rgba(59,130,246,.2)",
  };
  const secondary: CSSProperties = {
    border: `1px solid ${colors.border}`,
    background: colors.card2,
    color: colors.text,
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 650,
    fontSize: 13,
  };
  const badge: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 12px",
    borderRadius: 999,
    border: "1px solid rgba(59,130,246,.35)",
    background: "rgba(59,130,246,.1)",
    color: colors.purple2,
    fontSize: 13,
    fontWeight: 600,
  };

  const [intake, setIntake] = useState<StudentIntake>(() => {
    const saved = loadIntake();
    if (saved) return saved;
    return {
      ...emptyIntake,
      year: profile.year,
      branch: profile.branch,
      interests: profile.interests,
      targetRole: profile.goal,
      careerGoal: guessCareer(profile.goal),
    };
  });
  const [source, setSource] = useState<KnowledgeSource | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(null);
  const [openStage, setOpenStage] = useState<string>("you-are-here");
  const [whySkill, setWhySkill] = useState<string | null>(null);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [mentorQ, setMentorQ] = useState("");
  const [mentorA, setMentorA] = useState("");
  const [mentorBusy, setMentorBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadKnowledgeSource().then((loaded) => setSource(loaded.source));
  }, []);

  useEffect(() => {
    if (!initialCareerGoal) return;
    const nextIntake = {
      ...intake,
      careerGoal: initialCareerGoal,
      targetRole: CAREER_LABELS[initialCareerGoal],
    };
    build(nextIntake);
  }, [initialCareerGoal, source]);

  function build(nextIntake = intake, nextProgress = progress) {
    const plan = CAREER_PLANS[nextIntake.careerGoal];
    const knowledge =
      source ??
      ({
        version: "local",
        isLive: false,
        label:
          "This roadmap is based on Gradivo’s current guidance catalog. It is not live job-market data.",
      } satisfies KnowledgeSource);
    const generated = generateRoadmap(nextIntake, plan, knowledge, nextProgress);
    setRoadmap(generated);
    setShowForm(false);
    saveIntake(nextIntake);
    setOpenStage("you-are-here");
  }

  function updateStatus(id: string, status: ItemStatus) {
    const next = setItemStatus(progress, id, status);
    onProgressChange(next);
    if (!roadmap) return;
    const plan = CAREER_PLANS[intake.careerGoal];
    const knowledge = source ?? roadmap.source;
    const generated = generateRoadmap(intake, plan, knowledge, next);
    setRoadmap(generated);
    if (status === "completed" && generated.learnFirst) {
      setNotice(`Nice. Next useful step: ${generated.learnFirst.name}.`);
    } else {
      setNotice("");
    }
  }

  async function ask(question: string) {
    if (!roadmap) return;
    setMentorBusy(true);
    setMentorQ(question);
    const reply = await askGradivoAI(question, intake, roadmap);
    setMentorA(reply.answer);
    setMentorBusy(false);
    setMentorOpen(true);
  }

  const completion = useMemo(() => {
    if (!roadmap) return 0;
    const ids = [...new Set(roadmap.stages.flatMap((s) => s.skillIds))];
    if (!ids.length) return 0;
    const done = ids.filter((id) => progress[id] === "completed").length;
    return Math.round((done / ids.length) * 100);
  }, [roadmap, progress]);

  function skillBtn(skillId: string, extra?: CSSProperties) {
    const skill = SKILLS[skillId];
    if (!skill) return null;
    const status = progress[skillId] ?? "not_started";
    return (
      <div
        key={skillId}
        className="roadmap-skill-card"
        style={{
          border: `1px solid ${colors.border}`,
          background: colors.card2,
          borderRadius: 12,
          padding: 14,
          ...extra,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <strong>{skill.name}</strong>
          <span style={{ color: colors.purple2, fontSize: 12 }}>{skill.layer}</span>
        </div>
        <p style={{ color: colors.muted, fontSize: 13, lineHeight: 1.6, margin: "8px 0" }}>
          {skill.whatToLearn}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" style={secondary} onClick={() => setWhySkill(skill.id)}>
            Why this?
          </button>
          <button type="button" style={{ ...secondary, borderColor: "rgba(59,130,246,.42)" }} onClick={() => onLearnTopic(skill.id, intake.careerGoal)}>
            Learn this <ArrowRight size={14} />
          </button>
          {(["not_started", "learning", "completed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateStatus(skill.id, s)}
              style={{
                ...secondary,
                borderColor: status === s ? colors.purple : colors.border,
                color: status === s ? colors.purple2 : colors.muted,
              }}
            >
              {statusLabel(s)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section style={{ padding: "90px 0" }}>
      <div style={{ width: "100%", maxWidth: "none", margin: 0, padding: "0 clamp(20px, 4vw, 60px)", boxSizing: "border-box" }}>
        <button
          onClick={onBack}
          style={{
            border: "none",
            background: "transparent",
            color: colors.muted,
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ marginTop: 35, maxWidth: 760 }}>
          <div style={badge}>
            <Map size={15} />
            Student Roadmap
          </div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 55px)", letterSpacing: "-2px", margin: "18px 0 12px" }}>
            Your journey, simplified.
          </h1>
          <p style={{ color: colors.muted, fontSize: 18, lineHeight: 1.7 }}>
            Tell Gradivo where you are and where you want to go. Gradivo tells you the next useful
            thing to learn — not everything at once.
          </p>
        </div>

        {showForm || !roadmap ? (
          <div style={{ ...card, marginTop: 40, maxWidth: 760 }}>
            <h2 style={{ marginTop: 0 }}>Where are you now?</h2>
            <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>
              Use your profile details if you already filled them in. You can still edit here.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: 16,
                marginTop: 22,
              }}
            >
              <label style={fieldLabel}>
                Year
                <select
                  value={intake.year}
                  onChange={(e) => setIntake({ ...intake, year: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select year</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
              </label>
              <label style={fieldLabel}>
                Semester
                <input
                  value={intake.semester}
                  onChange={(e) => setIntake({ ...intake, semester: e.target.value })}
                  placeholder="Example: 3"
                  style={inputStyle}
                />
              </label>
              <label style={fieldLabel}>
                Branch
                <input
                  value={intake.branch}
                  onChange={(e) => setIntake({ ...intake, branch: e.target.value })}
                  placeholder="Example: ISE"
                  style={inputStyle}
                />
              </label>
              <label style={fieldLabel}>
                Current skill level
                <select
                  value={intake.skillLevel}
                  onChange={(e) =>
                    setIntake({ ...intake, skillLevel: e.target.value as SkillLevel })
                  }
                  style={inputStyle}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <label style={fieldLabel}>
                Career goal
                <select
                  value={intake.careerGoal}
                  onChange={(e) =>
                    setIntake({ ...intake, careerGoal: e.target.value as CareerGoal })
                  }
                  style={inputStyle}
                >
                  {(Object.keys(CAREER_LABELS) as CareerGoal[]).map((id) => (
                    <option key={id} value={id}>
                      {CAREER_LABELS[id]}
                    </option>
                  ))}
                </select>
              </label>
              <label style={fieldLabel}>
                Target role
                <input
                  value={intake.targetRole}
                  onChange={(e) => setIntake({ ...intake, targetRole: e.target.value })}
                  placeholder="Example: Junior SOC analyst"
                  style={inputStyle}
                />
              </label>
              <label style={fieldLabel}>
                Weekly hours
                <select
                  value={intake.weeklyHours}
                  onChange={(e) => setIntake({ ...intake, weeklyHours: e.target.value })}
                  style={inputStyle}
                >
                  <option value="3">About 3</option>
                  <option value="5">About 5</option>
                  <option value="7">About 7</option>
                  <option value="10">About 10</option>
                  <option value="15">About 15</option>
                  <option value="20">20+</option>
                </select>
              </label>
            </div>

            <div style={{ marginTop: 22 }}>
              <div style={fieldLabel}>Skills you already know</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {SKILL_OPTIONS.map((skill) => {
                  const active = intake.knownSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() =>
                        setIntake({
                          ...intake,
                          knownSkills: active
                            ? intake.knownSkills.filter((x) => x !== skill)
                            : [...intake.knownSkills, skill],
                        })
                      }
                      style={{
                        border: `1px solid ${active ? colors.purple : colors.border}`,
                        background: active ? "rgba(59,130,246,.15)" : colors.card2,
                        color: active ? colors.purple2 : colors.muted,
                        padding: "8px 11px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 22 }}>
              <div style={fieldLabel}>Areas of interest</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {["Coding", "Cybersecurity", "AI", "Cloud", "Web Development", "Data", "Startups"].map(
                  (interest) => {
                    const active = intake.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() =>
                          setIntake({
                            ...intake,
                            interests: active
                              ? intake.interests.filter((x) => x !== interest)
                              : [...intake.interests, interest],
                          })
                        }
                        style={{
                          border: `1px solid ${active ? colors.purple : colors.border}`,
                          background: active ? "rgba(59,130,246,.15)" : colors.card2,
                          color: active ? colors.purple2 : colors.muted,
                          padding: "8px 11px",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        {interest}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
              <button type="button" style={primary} onClick={() => build()}>
                Build my roadmap <ArrowRight size={17} />
              </button>
              <button type="button" style={secondary} onClick={onOpenProfile}>
                Edit profile
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                ...card,
                marginTop: 32,
                background: colors.glowCard,
              }}
            >
              <div style={{ fontSize: 12, color: colors.purple2, fontWeight: 700 }}>
                {roadmap.source.isLive ? "CATALOG CONNECTED" : "NOT LIVE JOB-MARKET DATA"}
              </div>
              <p style={{ margin: "8px 0 0", color: colors.muted, fontSize: 13, lineHeight: 1.6 }}>
                {roadmap.source.label}
              </p>
              <div
                style={{
                  height: 8,
                  borderRadius: 99,
                  background: colors.card2,
                  marginTop: 16,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${completion}%`,
                    height: "100%",
                    background: colors.purple,
                  }}
                />
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: colors.muted }}>
                {completion}% of planned skills marked completed
              </div>
              {notice ? (
                <p style={{ margin: "12px 0 0", color: colors.purple2, fontSize: 14 }}>{notice}</p>
              ) : null}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                <button
                  type="button"
                  style={primary}
                  onClick={() => roadmap.learnFirst && setWhySkill(roadmap.learnFirst.id)}
                >
                  Start here
                </button>
                <button
                  type="button"
                  style={secondary}
                  onClick={() =>
                    ask("What should I learn this week?")
                  }
                >
                  Continue learning
                </button>
                <button
                  type="button"
                  style={secondary}
                  onClick={() => ask("What project should I build?")}
                >
                  Build this project
                </button>
                <button
                  type="button"
                  style={secondary}
                  onClick={() => ask("What should I learn next?")}
                >
                  What should I learn next?
                </button>
                <button type="button" style={secondary} onClick={() => setMentorOpen(true)}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <MessageCircle size={14} /> Ask AI
                  </span>
                </button>
                <button type="button" style={secondary} onClick={() => setShowForm(true)}>
                  Update inputs
                </button>
              </div>
            </div>

            <Section title="1. Where you are now" colors={colors} card={card}>
              <p style={{ margin: 0, lineHeight: 1.7 }}>{roadmap.whereYouAre}</p>
              {profile.name ? (
                <p style={{ color: colors.muted, margin: "8px 0 0" }}>Student: {profile.name}</p>
              ) : null}
            </Section>

            <Section title="2. Your target career" colors={colors} card={card}>
              <p style={{ margin: 0, lineHeight: 1.7 }}>{roadmap.targetCareer}</p>
              <p style={{ color: colors.muted, margin: "10px 0 0", lineHeight: 1.7 }}>
                {CAREER_PLANS[intake.careerGoal].targetSummary}
              </p>
            </Section>

            <Section title="3. Skills you already have" colors={colors} card={card}>
              {roadmap.alreadyHave.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {roadmap.alreadyHave.map((s) => (
                    <div key={s.id} style={{ display: "flex", gap: 8, color: colors.muted }}>
                      <CheckCircle2 size={16} color={colors.purple2} /> {s.name}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: colors.muted }}>
                  None marked yet. That is fine — we will start with the first gap.
                </p>
              )}
            </Section>

            <Section title="4. Skills you need" colors={colors} card={card}>
              <p style={{ color: colors.muted, marginTop: 0 }}>
                Only the next relevant skills — not a dump of every technology.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                {roadmap.skillsNeeded.slice(0, 6).map((s) => skillBtn(s.id))}
              </div>
            </Section>

            <Section title="5. What to learn first" colors={colors} card={card}>
              {roadmap.learnFirst ? skillBtn(roadmap.learnFirst.id) : <p>Foundation looks covered. Build a project next.</p>}
            </Section>

            <Section title="6. What to learn next" colors={colors} card={card}>
              <div style={{ display: "grid", gap: 12 }}>
                {roadmap.learnNext.length
                  ? roadmap.learnNext.map((s) => skillBtn(s.id))
                  : "After the first skill is usable, deepen it with a project rather than adding tools."}
              </div>
            </Section>

            <div style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 22 }}>Your path</h2>
              <p style={{ color: colors.muted }}>
                YOU ARE HERE → FOUNDATION → CORE → SPECIALIZATION → PROJECTS → INTERNSHIPS →
                INTERVIEW PREP → TARGET ROLE
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                {roadmap.stages.map((stage, index) => {
                  const open = openStage === stage.id;
                  return (
                    <div key={stage.id} style={card}>
                      <button
                        type="button"
                        onClick={() => setOpenStage(open ? "" : stage.id)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: colors.text,
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          textAlign: "left",
                          gap: 12,
                          padding: 0,
                        }}
                      >
                        <span>
                          <span style={{ color: colors.purple2, fontSize: 12, fontWeight: 700 }}>
                            {index === 0 ? "YOU ARE HERE" : stage.title.toUpperCase()}
                          </span>
                          <div style={{ marginTop: 6, fontWeight: 700 }}>{stage.title}</div>
                          <div style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                            {stage.summary}
                          </div>
                        </span>
                        {open ? <ChevronDown /> : <ChevronRight />}
                      </button>
                      {open ? (
                        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                          {stage.skillIds.length
                            ? stage.skillIds.map((id) => skillBtn(id))
                            : null}
                          {stage.id === "projects"
                            ? roadmap.projects.map((p) => (
                                <div key={p.title} style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>
                                  <strong style={{ color: colors.text }}>{p.title}</strong>
                                  <div>{p.why}</div>
                                  <div>{p.prompt}</div>
                                </div>
                              ))
                            : null}
                          {stage.id === "internships"
                            ? roadmap.internships.map((x) => <Bullet key={x} colors={colors} text={x} />)
                            : null}
                          {stage.id === "interview"
                            ? roadmap.interview.map((x) => <Bullet key={x} colors={colors} text={x} />)
                            : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <Section title="7. Projects to build" colors={colors} card={card}>
              {roadmap.projects.map((p) => (
                <div key={p.title} style={{ marginBottom: 14 }}>
                  <strong>{p.title}</strong>
                  <p style={{ color: colors.muted, margin: "6px 0" }}>{p.why}</p>
                  <p style={{ margin: 0 }}>{p.prompt}</p>
                </div>
              ))}
            </Section>

            <Section title="8. Tools / technologies to practice" colors={colors} card={card}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {roadmap.tools.map((t) => (
                  <span
                    key={t}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "rgba(59,130,246,.1)",
                      color: colors.purple2,
                      fontSize: 13,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="9. Certifications (only if useful)" colors={colors} card={card}>
              {roadmap.certifications.length ? (
                roadmap.certifications.map((c) => (
                  <div key={c.name} style={{ marginBottom: 12 }}>
                    <strong>{c.name}</strong>
                    <p style={{ color: colors.muted, margin: "6px 0 0" }}>
                      When: {c.usefulWhen} Why: {c.why}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, color: colors.muted }}>
                  No certification is required for this path right now. Projects and GitHub evidence
                  matter more.
                </p>
              )}
            </Section>

            <Section title="10. Internships and opportunities" colors={colors} card={card}>
              {roadmap.internships.map((x) => (
                <Bullet key={x} colors={colors} text={x} />
              ))}
            </Section>

            <Section title="11. Interview preparation" colors={colors} card={card}>
              {roadmap.interview.map((x) => (
                <Bullet key={x} colors={colors} text={x} />
              ))}
            </Section>

            <Section title="12. Portfolio / GitHub" colors={colors} card={card}>
              {roadmap.portfolio.map((x) => (
                <Bullet key={x} colors={colors} text={x} />
              ))}
            </Section>

            <Section title="13. Next 30 days" colors={colors} card={card}>
              {roadmap.next30.map((x) => (
                <Bullet key={x} colors={colors} text={x} />
              ))}
            </Section>
            <Section title="14. Next 3 months" colors={colors} card={card}>
              {roadmap.next3Months.map((x) => (
                <Bullet key={x} colors={colors} text={x} />
              ))}
            </Section>
            <Section title="15. Next 6 months" colors={colors} card={card}>
              {roadmap.next6Months.map((x) => (
                <Bullet key={x} colors={colors} text={x} />
              ))}
            </Section>
            <Section title="16. Long-term" colors={colors} card={card}>
              {roadmap.longTerm.map((x) => (
                <Bullet key={x} colors={colors} text={x} />
              ))}
            </Section>

            <div style={{ ...card, marginTop: 28 }}>
              <h2 style={{ marginTop: 0 }}>Simple overview</h2>
              <p style={{ color: colors.muted }}>
                The original Gradivo stages, still here as a high-level reminder.
              </p>
              <div style={{ display: "grid", gap: 14 }}>
                {classicSteps.map((step, index) => (
                  <div key={step.title} style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 14 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(59,130,246,.12)",
                        color: colors.purple2,
                      }}
                    >
                      {step.icon}
                    </div>
                    <div>
                      <div style={{ color: colors.purple2, fontSize: 13, fontWeight: 700 }}>
                        STEP {index + 1} · {step.time}
                      </div>
                      <h3 style={{ margin: "6px 0 8px" }}>{step.title}</h3>
                      {step.items.map((item) => (
                        <div key={item} style={{ color: colors.muted, fontSize: 14, display: "flex", gap: 8 }}>
                          <CheckCircle2 size={15} color={colors.purple2} /> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {whySkill && SKILLS[whySkill] ? (
        <Modal colors={colors} onClose={() => setWhySkill(null)}>
          <WhyPanel skill={SKILLS[whySkill]} colors={colors} />
        </Modal>
      ) : null}

      {mentorOpen ? (
        <Modal colors={colors} onClose={() => setMentorOpen(false)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={18} color={colors.purple2} />
            <h2 style={{ margin: 0 }}>Ask Gradivo AI</h2>
          </div>
          <p style={{ color: colors.muted, fontSize: 13, lineHeight: 1.6 }}>
            Answers use your current roadmap. Unless an AI API is configured, this is Gradivo’s
            built-in mentor — not a live internet search.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {suggestedQuestions.map((q) => (
              <button key={q} type="button" style={secondary} onClick={() => ask(q)}>
                {q}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <input
              value={mentorQ}
              onChange={(e) => setMentorQ(e.target.value)}
              placeholder="Ask what to do next…"
              style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            />
            <button type="button" style={primary} disabled={mentorBusy || !mentorQ.trim()} onClick={() => ask(mentorQ)}>
              Ask
            </button>
          </div>
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 12,
              background: colors.card2,
              border: `1px solid ${colors.border}`,
              minHeight: 80,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {mentorBusy ? "Thinking…" : mentorA || "Pick a question to get a simple next step."}
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

function Section({
  title,
  children,
  colors,
  card,
}: {
  title: string;
  children: ReactNode;
  colors: Colors;
  card: CSSProperties;
}) {
  return (
    <div style={{ ...card, marginTop: 18 }}>
      <h2 style={{ marginTop: 0, fontSize: 20, color: colors.text }}>{title}</h2>
      {children}
    </div>
  );
}

function Bullet({ text, colors }: { text: string; colors: Colors }) {
  return (
    <div style={{ display: "flex", gap: 8, color: colors.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
      <CheckCircle2 size={16} color={colors.purple2} style={{ flexShrink: 0, marginTop: 2 }} />
      {text}
    </div>
  );
}

function Modal({
  children,
  onClose,
  colors,
}: {
  children: ReactNode;
  onClose: () => void;
  colors: Colors;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(0,0,0,.7)",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: 18,
          padding: 24,
          width: "min(640px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {children}
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 16,
            border: `1px solid ${colors.border}`,
            background: colors.card2,
            color: colors.text,
            padding: "8px 12px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function WhyPanel({ skill, colors }: { skill: SkillView | (typeof SKILLS)[string]; colors: Colors }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <HelpCircle size={18} color={colors.purple2} />
        <h2 style={{ margin: 0 }}>{skill.name}</h2>
      </div>
      <p style={{ color: colors.purple2, fontSize: 12, fontWeight: 700 }}>
        {skill.layer.toUpperCase()} SKILL
      </p>
      <Block label="Why you need it" text={skill.why} colors={colors} />
      <Block label="What exactly to learn" text={skill.whatToLearn} colors={colors} />
      <Block label="Beginner" text={skill.beginner} colors={colors} />
      <Block label="Intermediate" text={skill.intermediate} colors={colors} />
      <Block label="Advanced" text={skill.advanced} colors={colors} />
      <Block label="A small project to prove it" text={skill.project} colors={colors} />
      <Block label="How this connects to the target career" text={skill.careerLink} colors={colors} />
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Recommended resources</div>
        {skill.resources.map((r) => (
          <p key={r.title} style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>
            <strong style={{ color: colors.text }}>{r.title}.</strong> {r.note}
          </p>
        ))}
      </div>
    </div>
  );
}

function Block({ label, text, colors }: { label: string; text: string; colors: Colors }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
      <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.65, margin: "6px 0 0" }}>{text}</p>
    </div>
  );
}
