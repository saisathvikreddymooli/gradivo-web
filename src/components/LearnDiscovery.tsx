import { useMemo, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Brain, Code2, Cpu, Lightbulb, Shield, Sparkles, Workflow, X } from "lucide-react";
import { CAREER_LABELS, SKILLS } from "../roadmap/catalog";
import { TOPIC_ROADMAPS } from "../roadmap/learnTopics";
import type { CareerGoal } from "../roadmap/types";

type Props = {
  onOpenTopic: (id: string) => void;
  onOpenRoadmap: (goal: CareerGoal) => void;
};

const nodes = [
  { label: "Generative AI", id: "llms", x: 50, y: 8, blurb: "Models that can generate language, images, code, and more." },
  { label: "Programming", id: "programming-fundamentals", x: 78, y: 16, blurb: "The logic and tools behind software and AI products." },
  { label: "Data", id: "pandas", x: 91, y: 43, blurb: "The examples and evidence that help systems learn and people decide." },
  { label: "Cybersecurity", id: "web-security", x: 82, y: 75, blurb: "How to understand risks and make digital systems safer." },
  { label: "Cloud", id: "cloud", x: 61, y: 91, blurb: "The infrastructure that runs services and stores information." },
  { label: "AI Agents", id: "ai-agents", x: 39, y: 91, blurb: "AI systems that can choose tools and work through bounded steps." },
  { label: "Creativity", id: "problem-solving", x: 17, y: 75, blurb: "Turning ideas into useful experiments, stories, and products." },
  { label: "Critical Thinking", id: "problem-solving", x: 8, y: 44, blurb: "Asking good questions and checking whether an answer holds up." },
  { label: "Automation", id: "automation", x: 21, y: 16, blurb: "Using code and tools to make repeatable tasks easier." },
  { label: "AI Safety", id: "ai-literacy", x: 34, y: 30, blurb: "Thinking about reliability, privacy, bias, and human oversight." },
  { label: "Robotics", id: "robotics-ai", x: 67, y: 30, blurb: "Software, sensors, and machines working together in the physical world." },
  { label: "Machine Learning", id: "ml-basics", x: 31, y: 65, blurb: "Methods that find patterns in data and make predictions." },
];

const exploreCards = [
  { icon: Brain, title: "Understand AI", description: "Understand what AI is and how it works.", topics: ["ml-basics", "llms", "ai-agents", "ai-literacy"] },
  { icon: Sparkles, title: "Work with AI", description: "Learn how to use AI intelligently.", topics: ["ai-literacy", "ai-coding-tools", "automation", "problem-solving"] },
  { icon: Code2, title: "Build with AI", description: "Turn ideas into real AI-powered products.", topics: ["apis", "ai-apps", "rag", "ai-agents", "cloud", "databases"] },
  { icon: Lightbulb, title: "Think + Create", description: "Build abilities for an AI-powered world.", topics: ["problem-solving", "communication", "product-sense"] },
  { icon: Shield, title: "New AI Problems", description: "Explore challenges that come with AI.", topics: ["web-security", "security-mindset", "ai-literacy"] },
  { icon: Cpu, title: "Technology Behind AI", description: "Understand the technology powering modern AI.", topics: ["linux", "networking", "cloud", "databases", "docker"] },
];

const changes = [
  { title: "AI Agents", id: "ai-agents", happening: "AI tools are being designed to use tools and complete a sequence of steps.", matters: "More autonomy makes clear limits and checks important.", explore: "Try a small assistant with one safe, read-only tool." },
  { title: "AI Coding", id: "ai-coding-tools", happening: "Coding assistants can explain, draft, and revise code.", matters: "Good results still depend on understanding and reviewing the code.", explore: "Ask a tool to explain a small function, then verify each claim." },
  { title: "Robotics + AI", id: "apis", happening: "Machine perception and planning are being combined with physical systems.", matters: "Software decisions can affect real environments.", explore: "Learn how sensors, control, and software fit together." },
  { title: "AI + Cybersecurity", id: "web-security", happening: "AI is used in security workflows and also creates new attack surfaces.", matters: "Defensive thinking and safe testing remain essential.", explore: "Start with web security fundamentals in a legal lab." },
  { title: "AI + Biology", id: "ml-basics", happening: "Researchers apply machine learning to biological data and questions.", matters: "Results need domain expertise and careful validation.", explore: "Explore a beginner-friendly public dataset." },
  { title: "AI + Education", id: "ai-literacy", happening: "Learning tools are adapting explanations and practice.", matters: "Students still need to check sources and do their own thinking.", explore: "Compare an AI explanation with a trusted source." },
  { title: "AI + Creativity", id: "product-sense", happening: "Generative tools add new ways to sketch and iterate on ideas.", matters: "Taste, intent, and responsible use shape the final work.", explore: "Make a small concept and describe your choices." },
  { title: "AI + Automation", id: "automation", happening: "AI is being combined with scripts and workflows for repeatable tasks.", matters: "Automated steps need review, error handling, and clear boundaries.", explore: "Automate one low-risk personal task." },
];

const discoveries = [
  { title: "AI Agents", id: "ai-agents", text: "AI systems are increasingly designed to work through multi-step tasks using selected tools, rather than only replying to one prompt." },
  { title: "Retrieval-Augmented Generation", id: "rag", text: "RAG gives a language model relevant source material to use when answering questions about a collection of documents." },
  { title: "Machine Learning", id: "ml-basics", text: "Machine learning uses examples to find patterns that can help with predictions, classification, and other tasks." },
  { title: "Cloud Computing", id: "cloud", text: "Cloud services let teams run software and store data on remote infrastructure that can be configured as needs change." },
];

const interestOptions = ["Building", "Creating", "Solving problems", "Protecting", "Analyzing", "Experimenting", "I'm not sure"];
const domainOptions = ["Technology", "AI", "Cybersecurity", "Data", "Design", "Business", "Science", "Not sure"];

function sectionHeading(label: string, title: string, subtitle?: string) {
  return <div className="learn-section-heading"><div className="learn-eyebrow">{label}</div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>;
}

export default function LearnDiscovery({ onOpenTopic, onOpenRoadmap }: Props) {
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [activeMap, setActiveMap] = useState<string | null>(null);
  const [discoveryIndex, setDiscoveryIndex] = useState(0);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [interest, setInterest] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const suggestions = useMemo(() => {
    if (!showResults) return [];
    const preferred = domain === "Cybersecurity" || interest === "Protecting"
      ? ["web-security", "linux", "networking"]
      : domain === "Data" || interest === "Analyzing"
        ? ["pandas", "ml-basics", "sql"]
        : domain === "Design" || interest === "Creating"
          ? ["product-sense", "ai-apps", "web"]
          : interest === "Building"
            ? ["programming-fundamentals", "python", "ai-apps"]
            : domain === "AI"
              ? ["ai-literacy", "llms", "ai-agents"]
              : ["programming-fundamentals", "ai-literacy", "problem-solving"];
    return [...new Set(preferred)].map((id) => SKILLS[id]).filter(Boolean);
  }, [domain, interest, showResults]);

  const activeDiscovery = discoveries[discoveryIndex];
  const node = activeNode === null ? null : nodes[activeNode];
  return (
    <div className="learn-discovery-page">
      <section className="learn-era-hero">
        <div className="learn-hero-lines" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="learn-hero-copy">
          <div className="learn-eyebrow"><Sparkles size={14} /> The AI Era</div>
          <h1>What Should I Learn<br /><span>In The AI Era?</span></h1>
          <p>AI is changing how we learn, create, work and build. Explore the technologies and skills shaping the world around you.</p>
          <div className="learn-hero-actions">
            <button className="learn-primary-action" onClick={() => document.getElementById("explore-ai-era")?.scrollIntoView({ behavior: "smooth" })}>Explore the AI Era <ArrowDown size={16} /></button>
            <button className="learn-secondary-action" onClick={() => { setQuestionOpen(true); setShowResults(false); }}>I don’t know yet</button>
          </div>
        </div>
        <div className="learn-orbit-wrap" aria-label="Interactive technology universe">
          <svg className="learn-orbit-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {nodes.map((item, index) => <line key={item.label} x1="50" y1="50" x2={item.x} y2={item.y} className={activeNode === index || (activeNode !== null && Math.abs(activeNode - index) <= 2) ? "is-lit" : ""} />)}
          </svg>
          <div className="learn-orbit-core">AI</div>
          {nodes.map((item, index) => <button
            key={item.label}
            className={`learn-orbit-node${activeNode === index ? " is-active" : ""}${activeNode !== null && Math.abs(activeNode - index) <= 2 ? " is-related" : ""}`}
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
            onMouseEnter={() => setActiveNode(index)}
            onMouseLeave={() => setActiveNode(null)}
            onFocus={() => setActiveNode(index)}
            onBlur={() => setActiveNode(null)}
            onClick={() => onOpenTopic(item.id)}
            aria-label={`Explore ${item.label}`}
          >{item.label}</button>)}
          {node && <div className="learn-orbit-description"><strong>{node.label}</strong><span>{node.blurb}</span><small>Open topic <ArrowUpRight size={12} /></small></div>}
        </div>
      </section>

      <section id="explore-ai-era" className="learn-discovery-section">
        {sectionHeading("Explore the AI Era", "Don’t know what to learn?", "Start by exploring what’s changing.")}
        <div className="learn-era-cards">{exploreCards.map(({ icon: Icon, title, description, topics }, index) => <article key={title} className="learn-era-card" style={{ "--card-index": index } as CSSProperties}>
          <div className="learn-era-card-top"><span className="learn-card-icon"><Icon size={21} /></span><ArrowUpRight size={17} /></div>
          <h3>{title}</h3><p>{description}</p>
          <div className="learn-card-topic-list">{topics.map((id) => SKILLS[id] && <button key={id} onClick={() => onOpenTopic(id)}>{SKILLS[id].name}<ArrowRight size={12} /></button>)}</div>
          <button className="learn-card-explore" onClick={() => onOpenTopic(topics.find((id) => SKILLS[id])!)}>Explore this area <ArrowRight size={15} /></button>
        </article>)}</div>
      </section>

      <section className="learn-discovery-section learn-map-section">
        {sectionHeading("The AI Era Map", "See how the ideas connect", "Choose a branch to reveal a few places to begin.")}
        <div className="learn-map-root"><Sparkles size={17} /> AI Era</div>
        <div className="learn-map-grid">{[
          ["Understand", "ml-basics", "llms", "deep-learning", "pandas"],
          ["Use", "ai-literacy", "ai-coding-tools", "automation", "problem-solving"],
          ["Build", "ai-apps", "ai-agents", "apis", "rag"],
          ["Think + Create", "problem-solving", "product-sense", "communication"],
          ["New Frontiers", "web-security", "cloud", "robotics-ai"],
        ].map(([label, ...topicIds]) => <div className={`learn-map-branch${activeMap === label ? " is-open" : ""}`} key={label}>
          <button className="learn-map-branch-button" onClick={() => setActiveMap(activeMap === label ? null : label)} aria-expanded={activeMap === label}><span>{label}</span><ArrowDown size={16} /></button>
          <div className="learn-map-topic-list">{topicIds.map((id) => <button type="button" key={id} onClick={() => onOpenTopic(id)}>{SKILLS[id]?.name}</button>)}</div>
        </div>)}</div>
        <div className="learn-map-bottom"><Workflow size={16} /> Explore a topic to see where it fits in a learning path.</div>
      </section>

      <section className="learn-discovery-section">
        {sectionHeading("What’s changing?", "New ideas are emerging everywhere", "A few shifts worth understanding — and exploring for yourself.")}
        <div className="learn-change-marquee"><div className="learn-change-track">{[...changes, ...changes].map((item, index) => <article className="learn-change-card" key={`${item.title}-${index}`} tabIndex={0}>
          <div className="learn-eyebrow">{item.title}</div><h3>{item.happening}</h3>
          <div className="learn-change-details"><p><strong>Why it matters</strong><br />{item.matters}</p><button onClick={() => onOpenTopic(item.id)}>What you can explore <ArrowRight size={14} /></button></div>
        </article>)}</div></div>
      </section>

      <section className="learn-discovery-section learn-discovery-daily">
        <div className="learn-daily-copy"><div className="learn-eyebrow"><Sparkles size={14} /> Today’s Discovery</div><h2 key={activeDiscovery.title}>{activeDiscovery.title}</h2><p key={`${activeDiscovery.title}-text`}>{activeDiscovery.text}</p><div className="learn-hero-actions"><button className="learn-primary-action" onClick={() => onOpenTopic(activeDiscovery.id)}>Learn about it <ArrowRight size={15} /></button><button className="learn-secondary-action" onClick={() => setDiscoveryIndex((index) => (index + 1) % discoveries.length)}>Next discovery <ArrowRight size={15} /></button></div></div>
        <div className="learn-daily-mark" aria-hidden="true"><Sparkles size={42} /></div>
      </section>

      <section className="learn-discovery-section learn-philosophy">
        {sectionHeading("How we learn", "Explore, understand, experiment", "Learning is a way to make sense of the world — not a race through courses.")}
        <div className="learn-philosophy-flow">{["Learn", "Understand", "Experiment", "Build", "Explore"].map((step, index) => <div className="learn-philosophy-step" key={step}><span>0{index + 1}</span><strong>{step}</strong>{index < 4 && <ArrowRight size={17} />}</div>)}</div>
      </section>

      <section className="learn-confused-cta"><div><div className="learn-eyebrow">You’re allowed to be curious first</div><h2>Still confused?</h2><p>That’s okay. You don’t need to know your path yet.</p></div><button className="learn-primary-action" onClick={() => { setQuestionOpen(true); setShowResults(false); }}>Help me explore <ArrowRight size={16} /></button></section>

      {questionOpen && <div className="learn-question-backdrop" role="presentation" onClick={() => setQuestionOpen(false)}><section className="learn-question-modal" role="dialog" aria-modal="true" aria-labelledby="learn-question-title" onClick={(event) => event.stopPropagation()}>
        <button className="learn-question-close" onClick={() => setQuestionOpen(false)} aria-label="Close"><X size={19} /></button>
        {!showResults ? <>
          <div className="learn-eyebrow">A small place to start</div><h2 id="learn-question-title">{!interest ? "What sounds interesting to you?" : "What do you want to explore?"}</h2>
          <div className="learn-question-options">{(!interest ? interestOptions : domainOptions).map((option) => <button className="learn-question-option" key={option} onClick={() => { if (!interest) setInterest(option); else { setDomain(option); setShowResults(true); } }}>{option}<ArrowRight size={14} /></button>)}</div>
          {interest && <button className="learn-secondary-action" onClick={() => setInterest(null)}>Back to first question</button>}
        </> : <>
          <div className="learn-eyebrow">A few starting points</div><h2 id="learn-question-title">Based on your answers, you might enjoy exploring…</h2><p className="learn-modal-note">This is a starting point for curiosity, not a career prediction.</p>
          <div className="learn-suggestion-list">{suggestions.map((item) => <button key={item.id} onClick={() => { setQuestionOpen(false); onOpenTopic(item.id); }}>{item.name}<ArrowRight size={15} /></button>)}</div>
          {suggestions.flatMap((item) => TOPIC_ROADMAPS[item.id] ?? []).filter((goal, index, all) => all.indexOf(goal) === index).slice(0, 4).map((goal) => <button className="learn-result-roadmap" key={goal} onClick={() => { setQuestionOpen(false); onOpenRoadmap(goal); }}>Explore {CAREER_LABELS[goal]} <ArrowUpRight size={13} /></button>)}
          <button className="learn-secondary-action" onClick={() => { setInterest(null); setDomain(null); setShowResults(false); }}>Start again</button>
        </>}
      </section></div>}
    </div>
  );
}
