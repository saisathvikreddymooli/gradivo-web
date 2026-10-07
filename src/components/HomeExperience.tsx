import { type FormEvent, type CSSProperties } from "react";
import { ArrowRight, BookOpen, Compass, Code2, Search, Sparkles, Rocket } from "lucide-react";
import HomeHeroArtwork from "./HomeHeroArtwork";

type HomePage = "roadmap" | "learn" | "community" | "opportunities";

type Props = {
  colors: { text: string };
  primaryStyle: CSSProperties;
  query: string;
  setQuery: (value: string) => void;
  notice: string;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  onFindPath: () => void;
  onNavigate: (page: HomePage) => void;
  onExplore: () => void;
  onStartExplore: () => void;
};

const cards = [
  { title: "Find your path", prompt: "Not sure what to learn?", icon: Compass, page: "roadmap" as const },
  { title: "Learn", prompt: "Explore what matters in the AI era.", icon: BookOpen, page: "learn" as const },
  { title: "Build", prompt: "Discover projects and start creating.", icon: Code2, page: "community" as const },
  { title: "Opportunities", prompt: "Find internships, hackathons and more.", icon: Rocket, page: "opportunities" as const },
];

export default function HomeExperience({
  colors,
  primaryStyle,
  query,
  setQuery,
  notice,
  onSearch,
  onFindPath,
  onNavigate,
  onExplore,
  onStartExplore,
}: Props) {
  return (
    <div className="home-experience" style={{ color: colors.text }}>
      <section className="home-hero home-hero-new home-hero-hands">
        <HomeHeroArtwork />
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <div className="home-eyebrow"><Sparkles size={14} /> Your next step starts here</div>
            <h1 className="home-title">CONFUSED ABOUT<br /><span>WHAT TO LEARN?</span></h1>
            <p className="home-subtitle">Gradivo shows you what to do next.</p>
            <div className="home-actions">
              <button type="button" className="home-action-primary" style={{ ...primaryStyle, background: "linear-gradient(110deg, #2563eb, #4f46e5)" }} onClick={onFindPath}>Find my path <ArrowRight size={17} /></button>
              <button type="button" className="home-action-secondary" onClick={onExplore}>Explore Gradivo <ArrowRight size={16} /></button>
            </div>
            <details className="home-search-details">
              <summary><Search size={14} /> Search Gradivo</summary>
              <form className="home-search-form" onSubmit={onSearch}>
                <input aria-label="Search skills, careers, roadmaps, or opportunities" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Skills, careers, roadmaps, opportunities…" />
                <button type="submit" aria-label="Search"><ArrowRight size={16} /></button>
              </form>
              {notice && <p className="home-search-notice">{notice}</p>}
            </details>
          </div>

        </div>
      </section>

      <section className="home-feature-section" id="home-explore">
        <div className="home-section-heading"><div className="home-eyebrow">A clearer next step</div></div>
        <div className="home-feature-grid">{cards.map(({ title, prompt, icon: Icon, page }, index) => <button
          type="button"
          key={title}
          className="home-feature-card"
          style={{ "--home-card-index": index } as CSSProperties}
          onClick={() => onNavigate(page)}
        >
          <span className="home-feature-icon"><Icon size={23} /></span>
          <span className="home-feature-title">{title}</span>
          <span className="home-feature-prompt">{prompt}</span>
          <span className="home-feature-arrow"><ArrowRight size={17} /></span>
        </button>)}</div>
      </section>

      <section className="home-final-cta">
        <div className="home-final-glow" aria-hidden="true" />
        <div className="home-eyebrow">No perfect plan required</div>
        <h2>YOU DON’T NEED TO KNOW EVERYTHING.</h2>
        <p>Just know what to explore next.</p>
        <button type="button" className="home-action-primary" style={{ ...primaryStyle, background: "linear-gradient(110deg, #2563eb, #4f46e5)" }} onClick={onStartExplore}>Start exploring <ArrowRight size={17} /></button>
      </section>
    </div>
  );
}
