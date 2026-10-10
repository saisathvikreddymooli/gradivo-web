import type { GeneratedRoadmap, StudentIntake } from "./types";

export type MentorReply = {
  source: "local" | "api" | "local-fallback";
  answer: string;
};

function localAnswer(question: string, intake: StudentIntake, roadmap: GeneratedRoadmap): string {
  const q = question.toLowerCase();
  const next = roadmap.nextAction.title;
  const first = roadmap.learnFirst;

  if (q.includes("this week") || q.includes("learn next") || q.includes("what's next") || q.includes("whats next")) {
    if (intake.knownSkills.some((s) => s.toLowerCase().includes("python")) && first?.id === "python") {
      return `You already listed Python, so do not restart Python from zero. Next useful step: ${roadmap.learnNext[0]?.name ?? "Git/GitHub or a small project that uses Python"}. Spend this week on that, plus a README.`;
    }
    return `This week, do not add a new stack. Focus on: ${next}. ${roadmap.nextAction.why} If you have under ${intake.weeklyHours || "a few"} hours, finish a tiny slice you can show — not a full course.`;
  }

  if (q.includes("dsa") || q.includes("data structure")) {
    return "You need DSA because it trains you to pick a reasonable way to store and process information, and many software interviews use it to see how you think. It does not guarantee a job or a salary. If your target is more analysis or product, still learn arrays/maps at a basic level, then return to deeper DSA when you target software interviews.";
  }

  if (q.includes("python") && (q.includes("already") || q.includes("know") || q.includes("next"))) {
    const afterPython = roadmap.skillsNeeded.find((s) => s.id !== "python");
    return `If you already know Python, skip beginner syntax. Next useful thing: ${afterPython?.name ?? next}. Use Python to build ${roadmap.projects[0]?.title ?? "a small automation or data project"} so the language becomes evidence, not a course badge.`;
  }

  if (q.includes("project")) {
    const project = roadmap.projects[0];
    return project
      ? `Build this next: ${project.title}. Why: ${project.why} How: ${project.prompt} Keep it small enough to finish.`
      : `Improve one existing project until someone else can run it from the README.`;
  }

  if (q.includes("internship") || q.includes("ready")) {
    const completedish = roadmap.alreadyHave.length;
    if (completedish >= 5 && roadmap.projects.length) {
      return "You are closer when you can demo a project, explain a bug you fixed, and use Git. That still does not guarantee an internship. Apply to roles that match what you can already show, and keep building while you apply.";
    }
    return "Not quite “ready” in the sense of a finished story — and that is normal. Get one project on GitHub with a README, then apply to a few fitting internships. Use listings as a gap list, not as proof you must learn everything first.";
  }

  if (q.includes("relevant") || q.includes("job") || q.includes("market") || q.includes("currently")) {
    return `${roadmap.source.label} Skills currently in your Gradivo plan for ${roadmap.targetCareer}: ${roadmap.skillsNeeded
      .slice(0, 5)
      .map((s) => s.name)
      .join(", ")}. Foundation skills (programming, problem solving, Git, APIs) stay useful even when tools change. Emerging items are a watch list, not requirements.`;
  }

  if (q.includes("improve") && q.includes("roadmap")) {
    return "Improve it by being honest about what you already know, logging hours you actually have, and marking items Learning/Completed. Then Gradivo can point to the next gap instead of restarting. Do not add extra tools “just in case.”";
  }

  if (q.includes("why") && first) {
    return `${first.name}: ${first.why} What to learn: ${first.whatToLearn} How it connects: ${first.careerLink}`;
  }

  return `Next useful thing for you: ${next}. ${roadmap.nextAction.why} Ask something more specific (this week, a project, DSA, internships) if you want a tighter answer. Gradivo will not tell you to learn everything.`;
}

export async function askGradivoAI(
  question: string,
  intake: StudentIntake,
  roadmap: GeneratedRoadmap,
): Promise<MentorReply> {
  const endpoint = import.meta.env.VITE_GRADIVO_AI_URL as string | undefined;
  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          intake,
          roadmap: {
            target: roadmap.targetCareer,
            next: roadmap.nextAction,
            needed: roadmap.skillsNeeded.map((s) => s.id),
            source: roadmap.source,
          },
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as { answer?: string };
        if (data.answer) return { source: "api", answer: data.answer };
      }
    } catch {
      return {
        source: "local-fallback",
        answer: `${localAnswer(question, intake, roadmap)}\n\n(The AI service is not available, so this is Gradivo's built-in guidance.)`,
      };
    }
  }

  return { source: "local", answer: localAnswer(question, intake, roadmap) };
}
