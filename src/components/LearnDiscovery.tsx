import { useEffect, useRef, useState } from "react";
import { ArrowRight, Braces, CheckCircle2, Code2, Database, FileCode2, Play, Terminal } from "lucide-react";
import {
  LEARN_CHECKLIST,
  LEARN_REQUIREMENTS,
  LEARN_ROLES,
  LEARN_STEP_TIMES,
  roleFromGoal,
  type LearnRoleId,
} from "../learn/learnContent";
import { loadLearnChecklist, saveLearnChecklist } from "../learn/learnProgress";
import { CSS_LANGUAGE_RESOURCES, HTML_LANGUAGE_RESOURCES, LEARNING_PLAYLISTS, SQL_LANGUAGE_RESOURCES, type LearningPlaylist, type ProgrammingLanguageId, type SpokenLanguage } from "../learn/playlists";
import { LEARN_VIDEO_CATALOG, type LearnVideoResource } from "../learn/videoCatalog";
import { useVideoProgress, type VideoProgressRecord } from "../learn/useVideoProgress";
import VideoPlayerModal from "../learn/VideoPlayerModal";
import type { CareerGoal } from "../roadmap/types";

type Props = {
  onOpenTopic: (id: string) => void;
  onOpenRoadmap: (goal: CareerGoal) => void;
  /** Saved profile goal ("Frontend Developer", …) — selects the default role tab. */
  profileGoal?: string;
  /** Signed-in uid, or null when logged out. */
  uid?: string | null;
  onNavigate?: (page: "roadmap" | "profile") => void;
  initialSelection?: { language: ProgrammingLanguageId; spoken: SpokenLanguage } | null;
  initialVideoId?: string | null;
  onInitialVideoHandled?: () => void;
};

type PlaylistResource = Omit<LearningPlaylist, "language" | "spoken">;

const LANGUAGE_SPECIFIC_RESOURCES: Partial<Record<ProgrammingLanguageId, Record<SpokenLanguage, PlaylistResource[]>>> = {
  css: CSS_LANGUAGE_RESOURCES,
  html: HTML_LANGUAGE_RESOURCES,
  sql: SQL_LANGUAGE_RESOURCES,
};

const STEP_FOUR = [
  "Share your code where it fits. Add a short README explaining the problem, how to run it, and what you learned.",
  "Test your work and practise explaining one design choice and one challenge you solved.",
  "Prepare a simple resume and explore internships, hackathons, or other practical experience when you have a project to show.",
];

const PROGRAMMING_LANGUAGES: { id: ProgrammingLanguageId; label: string; Icon: typeof Code2 }[] = [
  { id: "c", label: "C", Icon: Terminal },
  { id: "cpp", label: "C++", Icon: Braces },
  { id: "java", label: "Java", Icon: Code2 },
  { id: "python", label: "Python", Icon: Code2 },
  { id: "javascript", label: "JavaScript", Icon: FileCode2 },
  { id: "web", label: "Web Development", Icon: Code2 },
  { id: "sql", label: "SQL", Icon: Database },
  { id: "dsa", label: "DSA", Icon: Braces },
  { id: "css", label: "CSS", Icon: Code2 },
  { id: "html", label: "HTML", Icon: FileCode2 },
];

const SPOKEN_LANGUAGES: { id: SpokenLanguage; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
  { id: "te", label: "Telugu" },
  { id: "kn", label: "Kannada" },
];

function savedSpokenLanguage(): SpokenLanguage {
  try {
    const saved = window.localStorage.getItem("gradivo:learn:spoken-language");
    return saved !== "kn" && SPOKEN_LANGUAGES.some(({ id }) => id === saved) ? (saved as SpokenLanguage) : "en";
  } catch {
    return "en";
  }
}

function ProgressBadge({ progress }: { progress?: VideoProgressRecord }) {
  if (!progress || progress.percent <= 0) return null;
  return <span className={`learn-video-progress${progress.completed ? " is-complete" : ""}`} aria-label={`${progress.percent}% watched${progress.completed ? ", completed" : ""}`}>
    {progress.completed && <CheckCircle2 size={12} aria-hidden="true" />}{progress.percent}%{progress.completed && <span>Completed</span>}
  </span>;
}

function PlaylistCard({ playlist, video, progress, onOpen }: {
  playlist: PlaylistResource;
  video?: LearnVideoResource;
  progress?: VideoProgressRecord;
  onOpen: () => void;
}) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState(playlist.thumbnail ?? `https://i.ytimg.com/vi/${playlist.firstVideoId}/hqdefault.jpg`);
  const playlistUrl = playlist.url ?? `https://www.youtube.com/playlist?list=${playlist.playlistId}`;
  return (
    <a className="learn-playlist-card" href={playlistUrl} target={video ? undefined : "_blank"} rel={video ? undefined : "noopener noreferrer"} onClick={(event) => {
      if (!video) return;
      event.preventDefault();
      onOpen();
    }}
      aria-label={`Watch ${playlist.title} by ${playlist.channel} on YouTube`}>
      <div className={`learn-playlist-thumbnail${thumbnailLoaded ? " is-loaded" : " is-loading"}`}>
        {thumbnailFailed ? (
          <div className="learn-playlist-placeholder" aria-label="Playlist thumbnail unavailable"><Play size={28} fill="currentColor" /></div>
        ) : (
          <img src={thumbnailSrc}
            alt={`${playlist.title} thumbnail`} width="480" height="360" loading="lazy"
            onLoad={() => setThumbnailLoaded(true)}
            onError={() => {
              if (playlist.thumbnailFallback && thumbnailSrc !== playlist.thumbnailFallback) {
                setThumbnailSrc(playlist.thumbnailFallback);
                return;
              }
              setThumbnailFailed(true);
              setThumbnailLoaded(true);
            }} />
        )}
      </div>
      <div className="learn-playlist-copy">
        <div className="learn-playlist-title-row"><h3>{playlist.title}</h3><ProgressBadge progress={progress} /></div>
        <p>{playlist.channel}{playlist.videoCount ? ` · ${playlist.videoCount} videos` : ""}</p>
        <span className="learn-playlist-action">Watch {playlist.url ? "video" : "playlist"} <ArrowRight size={15} /></span>
      </div>
    </a>
  );
}

function Jargon({ children, tip }: { children: string; tip: string }) {
  return (
    <span className="learn-tip" tabIndex={0} data-tip={tip} aria-label={`${children}. ${tip}`}>
      {children}
    </span>
  );
}

/** Explains the word "prompting" inline the first time it appears in a sentence. */
function AiSkillText({ text }: { text: string }) {
  const word = "prompting";
  const index = text.toLowerCase().indexOf(word);
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <Jargon tip="Prompting means writing clear instructions so an AI tool gives a useful answer.">
        {text.slice(index, index + word.length)}
      </Jargon>
      {text.slice(index + word.length)}
    </>
  );
}

export default function LearnDiscovery({ onOpenRoadmap, profileGoal = "", uid = null, onNavigate, initialSelection = null, initialVideoId = null, onInitialVideoHandled }: Props) {
  const [roleId, setRoleId] = useState<LearnRoleId>(() => roleFromGoal(profileGoal));
  const [done, setDone] = useState<string[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [checklistError, setChecklistError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [programmingLanguage, setProgrammingLanguage] = useState<ProgrammingLanguageId>(initialSelection?.language ?? "java");
  const [spokenLanguage, setSpokenLanguage] = useState<SpokenLanguage>(initialSelection?.spoken ?? savedSpokenLanguage);
  const playlistResultsRef = useRef<HTMLDivElement>(null);
  const [activeVideo, setActiveVideo] = useState<LearnVideoResource | null>(null);
  const videoProgress = useVideoProgress(uid);
  const languageResources = LANGUAGE_SPECIFIC_RESOURCES[programmingLanguage];
  const playlists: PlaylistResource[] = (languageResources
    ? languageResources[spokenLanguage]
    : LEARNING_PLAYLISTS.filter((item) => item.language === programmingLanguage && item.spoken === spokenLanguage))
    .sort((a, b) => {
      const preferred: Partial<Record<SpokenLanguage, string>> = { en: "CodeWithHarry", hi: "Apna College", te: "Code With Swaroop", kn: "Engineering in Kannada" };
      return Number(b.channel === preferred[spokenLanguage]) - Number(a.channel === preferred[spokenLanguage]);
    });

  function chooseProgrammingLanguage(language: ProgrammingLanguageId) {
    setProgrammingLanguage(language);
    if (LANGUAGE_SPECIFIC_RESOURCES[language]) {
      const firstAvailable = SPOKEN_LANGUAGES.find(({ id }) => (LANGUAGE_SPECIFIC_RESOURCES[language]?.[id]?.length ?? 0) > 0)?.id;
      if (firstAvailable) chooseSpokenLanguage(firstAvailable);
      return;
    }
    if (language !== "python" && spokenLanguage === "kn") chooseSpokenLanguage("en");
  }

  function chooseSpokenLanguage(language: SpokenLanguage) {
    setSpokenLanguage(language);
    try {
      window.localStorage.setItem("gradivo:learn:spoken-language", language);
    } catch {
      // Keep the choice for this visit when browser storage is unavailable.
    }
  }

  useEffect(() => {
    setRoleId(roleFromGoal(profileGoal));
  }, [profileGoal]);

  useEffect(() => {
    if (!initialSelection) return;
    setProgrammingLanguage(initialSelection.language);
    setSpokenLanguage(initialSelection.spoken);
    window.requestAnimationFrame(() => playlistResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [initialSelection]);

  useEffect(() => {
    if (!initialVideoId || videoProgress.loading) return;
    const resource = LEARN_VIDEO_CATALOG.find((item) => item.videoId === initialVideoId);
    if (resource) {
      setProgrammingLanguage(resource.language);
      setSpokenLanguage(resource.spokenLanguage);
      setActiveVideo(resource);
      window.requestAnimationFrame(() => playlistResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    onInitialVideoHandled?.();
  }, [initialVideoId, onInitialVideoHandled, videoProgress.loading]);

  useEffect(() => {
    let active = true;
    setChecklistLoading(true);
    setChecklistError("");
    void loadLearnChecklist(uid)
      .then((ids) => {
        if (active) setDone(ids);
      })
      .catch(() => {
        if (active) setChecklistError("Could not load your checklist. Check your connection and try again.");
      })
      .finally(() => {
        if (active) setChecklistLoading(false);
      });
    return () => {
      active = false;
    };
  }, [uid, reloadToken]);

  const role = LEARN_ROLES.find((r) => r.id === roleId) ?? LEARN_ROLES[0];

  async function toggle(id: string) {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    setChecklistError("");
    try {
      await saveLearnChecklist(uid, next);
    } catch {
      setDone(done);
      setChecklistError("Could not save your checklist. Please sign in and try again.");
    }
  }

  const goRoadmap = () => {
    if (onNavigate) onNavigate("roadmap");
    else onOpenRoadmap("other");
  };
  const goProfile = () => {
    if (onNavigate) onNavigate("profile");
  };

  return (
    <div className="learn-page">
      {/* 1. Hero */}
      <section className="learn-hero">
        <p className="learn-eyebrow">Learn · Start here</p>
        <h1>Build Skills That Matter in the AI Era.</h1>
        <p className="learn-sub">
          Discover what to learn, build real projects, and prepare for the career you want.
        </p>
        <div className="learn-hero-actions">
          <button type="button" className="learn-btn-primary" onClick={goRoadmap}>
            Find my learning path <ArrowRight size={16} />
          </button>
          <button type="button" className="learn-btn-secondary" onClick={goProfile}>
            Complete my profile
          </button>
        </div>
      </section>

      {/* Curated programming-language playlists */}
      <section className="learn-language-section" aria-labelledby="learn-language-title">
        <div className="learn-language-heading">
          <p className="learn-eyebrow">Curated video courses</p>
          <h2 id="learn-language-title">Learn a programming language</h2>
          <p>Choose a topic and the language you prefer to learn in.</p>
        </div>
        <fieldset className="learn-language-picker">
          <legend>1. What do you want to learn?</legend>
          <div className="learn-language-grid">
            {PROGRAMMING_LANGUAGES.map(({ id, label, Icon }) => (
              <button key={id} type="button" className={`learn-language-option${programmingLanguage === id ? " is-active" : ""}`}
                aria-pressed={programmingLanguage === id} onClick={() => chooseProgrammingLanguage(id)}>
                <Icon size={19} aria-hidden="true" /><span>{label}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="learn-spoken-picker">
          <legend>2. In which language?</legend>
          <div className="learn-spoken-options" role="group" aria-label="Choose spoken language">
            {SPOKEN_LANGUAGES.filter(({ id }) => languageResources
              ? languageResources[id].length > 0
              : id !== "kn" || programmingLanguage === "python" || programmingLanguage === "c" || programmingLanguage === "dsa").map(({ id, label }) => (
              <button key={id} type="button" className={`learn-spoken-option${spokenLanguage === id ? " is-active" : ""}`}
                aria-pressed={spokenLanguage === id} onClick={() => chooseSpokenLanguage(id)}>{label}</button>
            ))}
          </div>
        </fieldset>
        <div className="learn-playlist-results" aria-live="polite" ref={playlistResultsRef}>
          <h3>3. Playlists</h3>
          {videoProgress.error && uid && <p className="learn-progress-error" role="alert">{videoProgress.error} Your videos can still play, but saved progress may be unavailable.</p>}
          {playlists.length ? (
            <div className="learn-playlist-grid">{playlists.map((playlist) => {
              const match = playlist.url?.match(/(?:youtu\.be\/|[?&]v=|\/live\/)([\w-]{11})/);
              const video = match ? {
                videoId: match[1], language: programmingLanguage, spokenLanguage, title: playlist.title,
                channel: playlist.channel, url: playlist.url!, thumbnail: playlist.thumbnail,
                thumbnailFallback: playlist.thumbnailFallback,
              } satisfies LearnVideoResource : undefined;
              return <PlaylistCard key={playlist.playlistId ?? playlist.url} playlist={playlist} video={video}
                progress={uid && video ? videoProgress.progressByVideo[video.videoId] : undefined}
                onOpen={() => { if (video) setActiveVideo(video); }} />;
            })}</div>
          ) : (
            <div className="learn-playlist-empty">
              <p>No verified playlist for this topic and language yet. Try Telugu for the verified Java course, or check back soon.</p>
              <button type="button" className="learn-spoken-option" onClick={() => { setProgrammingLanguage("java"); chooseSpokenLanguage("te"); }}>
                Show Java in Telugu
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. What companies want now */}
      <section aria-labelledby="learn-needs">
        <h2 id="learn-needs">What companies look for</h2>
        <p className="learn-section-sub">The essentials depend on the role, company, and experience level. No roadmap guarantees a job.</p>
        <div className="learn-cards">
          {LEARN_REQUIREMENTS.map(({ icon: Icon, title, sentence }) => (
            <article key={title} className="learn-card">
              <span className="learn-card-icon" aria-hidden="true">
                <Icon size={20} />
              </span>
              <h3>{title}</h3>
              <p>{sentence}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Your learning path */}
      <section aria-labelledby="learn-path">
        <h2 id="learn-path">What should I learn?</h2>
        <p className="learn-section-sub">Choose a path to see its skills. Start with the basics, practise, then build and share your work.</p>
        <div className="learn-roles" role="group" aria-label="Choose your role">
          {LEARN_ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`learn-chip${r.id === roleId ? " is-active" : ""}`}
              aria-pressed={r.id === roleId}
              onClick={() => setRoleId(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <ol className="learn-steps">
          <li className="learn-step">
            <div className="learn-step-num" aria-hidden="true">1</div>
            <div>
              <h3>Learn the basics <span className="learn-time">{LEARN_STEP_TIMES[0]}</span></h3>
              <ul>
                {role.foundation.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </li>
          <li className="learn-step">
            <div className="learn-step-num" aria-hidden="true">2</div>
            <div>
              <h3>Learn skills for {role.label} <span className="learn-time">{LEARN_STEP_TIMES[1]}</span></h3>
              <ul>
                {role.coreSkills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </li>
          <li className="learn-step">
            <div className="learn-step-num" aria-hidden="true">3</div>
            <div>
              <h3>Use AI with care <span className="learn-time">{LEARN_STEP_TIMES[2]}</span></h3>
              <ul>
                {role.aiSkills.map((s) => (
                  <li key={s}>
                    <AiSkillText text={s} />
                  </li>
                ))}
              </ul>
            </div>
          </li>
          <li className="learn-step">
            <div className="learn-step-num" aria-hidden="true">4</div>
            <div>
              <h3>Build and prepare <span className="learn-time">{LEARN_STEP_TIMES[3]}</span></h3>
              <ul>
                {[role.projectExample, ...STEP_FOUR].map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </li>
        </ol>
      </section>

      {/* 4. Checklist */}
      <section aria-labelledby="learn-checklist">
        <h2 id="learn-checklist">Track your preparation</h2>
        <p className="learn-section-sub">Mark useful steps as you complete them. You do not need every item for every role.</p>
        {checklistLoading ? (
          <p className="learn-muted" role="status">Loading your checklist…</p>
        ) : (
          <>
            <div
              className="learn-progress"
              role="progressbar"
              aria-valuenow={done.length}
              aria-valuemin={0}
              aria-valuemax={LEARN_CHECKLIST.length}
              aria-label={`${done.length} of ${LEARN_CHECKLIST.length} done`}
            >
              <div className="learn-progress-fill" style={{ width: `${(done.length / LEARN_CHECKLIST.length) * 100}%` }} />
            </div>
            <p className="learn-muted">{done.length} of {LEARN_CHECKLIST.length} done{uid ? "" : " · sign in to sync across devices"}</p>
            {checklistError ? (
              <div className="learn-error" role="alert">
                <p>{checklistError}</p>
                <button type="button" className="learn-btn-secondary" onClick={() => setReloadToken((t) => t + 1)}>
                  Try again
                </button>
              </div>
            ) : null}
            <ul className="learn-checklist">
              {LEARN_CHECKLIST.map((item) => {
                const checked = done.includes(item.id);
                return (
                  <li key={item.id}>
                    <label className={`learn-check${checked ? " is-done" : ""}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => void toggle(item.id)}
                        aria-label={item.label}
                      />
                      <CheckCircle2 size={18} aria-hidden="true" />
                      <span>{item.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {/* CTA */}
      <section className="learn-cta" aria-labelledby="learn-cta-title">
        <h2 id="learn-cta-title">Choose your next step</h2>
        <p className="learn-section-sub">Use your Roadmap to see the detailed order for your career goal, then practise with projects and opportunities.</p>
        <button type="button" className="learn-btn-primary" onClick={goRoadmap}>
          Open my Roadmap <ArrowRight size={16} />
        </button>
      </section>
      {activeVideo && <VideoPlayerModal key={activeVideo.videoId} video={activeVideo}
        progress={uid ? videoProgress.progressByVideo[activeVideo.videoId] : undefined}
        isTracking={Boolean(uid)} onProgress={videoProgress.updateProgress} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}
