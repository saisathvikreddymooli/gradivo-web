import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useScroll } from "motion/react";
import { updateProfile } from "firebase/auth";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  ChevronRight,
  Code2,
  Compass,
  Menu,
  Monitor,
  Moon,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Sun,
  Target,
  User,
  X,
  Zap,
} from "lucide-react";
import ProfileAuth from "./components/ProfileAuth";
import AuthPage from "./auth/AuthPage";
import type { AuthMode } from "./auth/AuthScreen";
import { useAuth } from "./auth/useAuth";
import StudentRoadmap from "./components/StudentRoadmap";
import ConnectPage from "./connect/ConnectPage";
import NoticesPage from "./notices/NoticesPage";
import CommunityPage from "./community/CommunityPage";
import LiveBackground from "./components/LiveBackground";
import IntroAnimation from "./components/IntroAnimation";
import LearnDiscovery from "./components/LearnDiscovery";
import HomeExperience from "./components/HomeExperience";
import ConnectProfileFields from "./connect/ConnectProfileFields";
import { DEFAULT_COUNTRY } from "./connect/constants";
import { ensureUserDocument, profileFromUser, saveConnectProfile } from "./connect/api";
import type { AppStudentProfile } from "./connect/types";
import { auth } from "./firebase/config";
import { useTheme, type ThemeMode } from "./theme";
import { getSearchDestination } from "./search";
import type { ConnectTab } from "./connect/types";
import { CAREER_LABELS, SKILLS } from "./roadmap/catalog";
import { CAREER_TOPIC_PATHS, LEARN_TRACKS, TOPIC_ROADMAPS } from "./roadmap/learnTopics";
import { loadAccountProgress, loadIntake, loadProgress, setItemStatus } from "./roadmap/progress";
import type { CareerGoal, ItemStatus, ProgressMap } from "./roadmap/types";


type Page =
  | "home"
  | "profile"
  | "roadmap"
  | "learn"
  | "careers"
  | "opportunities"
  | "community"
  | "connect"
  | "login"
  | "signup";

const pagePaths: Record<Page, string> = {
  home: "/",
  profile: "/profile",
  roadmap: "/roadmap",
  learn: "/learn",
  careers: "/careers",
  opportunities: "/opportunities",
  community: "/community",
  connect: "/connect",
  login: "/login",
  signup: "/signup",
};

function pageFromPath(pathname: string): Page {
  const normalizedPath = pathname.replace(/\/+$/, "").toLowerCase();
  if (!normalizedPath || normalizedPath === "/index.html") return "home";
  return Object.entries(pagePaths).find(([, path]) => path === normalizedPath)?.[0] as Page ?? "home";
}

const initialProfile: AppStudentProfile = {
  name: "",
  branch: "",
  year: "",
  interests: [],
  goal: "",
  college: "",
  country: DEFAULT_COUNTRY,
  state: "",
  city: "",
  skills: [],
  bio: "",
  isSenior: false,
  helpAreas: [],
};

function isCompleteProfile(profile: Pick<AppStudentProfile, "name" | "college" | "state">): boolean {
  return Boolean(profile.name.trim() && profile.college.trim() && profile.state.trim());
}




const roadmapSteps = [
  {
    title: "Build Your Foundation",
    time: "Month 1–2",
    icon: <BookOpen size={24} />,
    items: [
      "Learn programming fundamentals",
      "Understand Git and GitHub",
      "Learn basic Linux",
      "Improve problem-solving",
    ],
  },
  {
    title: "Choose Your Direction",
    time: "Month 2–3",
    icon: <Compass size={24} />,
    items: [
      "Explore different technology careers",
      "Choose a primary skill",
      "Understand required technologies",
      "Create a personal learning plan",
    ],
  },
  {
    title: "Build Real Projects",
    time: "Month 3–6",
    icon: <Code2 size={24} />,
    items: [
      "Build beginner projects",
      "Upload projects to GitHub",
      "Create one strong portfolio project",
      "Document what you build",
    ],
  },
  {
    title: "Gain Experience",
    time: "Month 6–9",
    icon: <Rocket size={24} />,
    items: [
      "Join hackathons",
      "Apply for internships",
      "Contribute to open source",
      "Connect with other developers",
    ],
  },
  {
    title: "Prepare for Opportunities",
    time: "Month 9+",
    icon: <Target size={24} />,
    items: [
      "Build your resume",
      "Improve LinkedIn profile",
      "Practice coding problems",
      "Prepare for interviews",
    ],
  },
];

const careers = [
  {
    title: "Software Engineering",
    icon: <Code2 size={28} />,
    description:
      "Build websites, applications, APIs and software systems.",
    skills: ["C / C++", "Python", "JavaScript", "DSA", "Git"],
  },
  {
    title: "Cybersecurity",
    icon: <Shield size={28} />,
    description:
      "Learn how systems are protected and how security problems are discovered.",
    skills: ["Linux", "Networking", "Python", "Security Basics", "Web Security"],
  },
  {
    title: "AI & Machine Learning",
    icon: <Sparkles size={28} />,
    description:
      "Work with data, machine learning models and intelligent applications.",
    skills: ["Python", "Math", "NumPy", "Pandas", "ML"],
  },
  {
    title: "Cloud Computing",
    icon: <Zap size={28} />,
    description:
      "Learn how applications and infrastructure run on cloud platforms.",
    skills: ["Linux", "Networking", "Cloud", "Docker", "Git"],
  },
  {
    title: "Data & Analytics",
    icon: <Search size={28} />,
    description:
      "Use data to discover patterns, create insights and support decisions.",
    skills: ["Python", "SQL", "Excel", "Statistics", "Visualization"],
  },
];

function App() {
  const { theme, setTheme, isDark, colors } = useTheme();
  const { user, ready: authReady } = useAuth();
  const { scrollYProgress } = useScroll();


  const [page, setPage] = useState<Page>(() => pageFromPath(window.location.pathname));
  const [selectedLearnTopic, setSelectedLearnTopic] = useState<string | null>(null);
  const [learnPathGoal, setLearnPathGoal] = useState<CareerGoal | null>(null);
  const [roadmapGoal, setRoadmapGoal] = useState<CareerGoal | null>(null);
  const [learningProgress, setLearningProgress] = useState<ProgressMap>(() => loadProgress());
  const [heroQuery, setHeroQuery] = useState("");
  const [heroNotice, setHeroNotice] = useState("");
  const [oppSearch, setOppSearch] = useState("");
  const [connectTab, setConnectTab] = useState<ConnectTab>("discover");
  const heroSearchPending = useRef(false);
  const connectSearchPending = useRef(false);
  const consumeHeroSearch = () => {
    const pending = heroSearchPending.current;
    heroSearchPending.current = false;
    return pending;
  };
  const consumeConnectSearch = () => {
    const pending = connectSearchPending.current;
    connectSearchPending.current = false;
    return pending;
  };

  const [mobileMenu, setMobileMenu] = useState(false);
  const [themeMenu, setThemeMenu] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [profile, setProfile] = useState<AppStudentProfile>(initialProfile);
  const [verifiedSenior, setVerifiedSenior] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeCareer, setActiveCareer] = useState<number | null>(null);
  /** True once the Firestore profile check has resolved for the current auth state. */
  const [profileReady, setProfileReady] = useState(false);
  /** True when users/{uid} exists with a saved name. */
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState("");
  /** Modal mode: edit the form, or view saved info. */
  const [editing, setEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const handleIntroComplete = useCallback(() => setIntroVisible(false), []);

  useEffect(() => {
    const main = document.querySelector(".gradivo-main");
    if (!main) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = new Set<Element>();
    const collect = (node: ParentNode, target: Set<Element>) => {
      if (node instanceof Element && node.matches("section, article, [data-scroll-reveal]")) target.add(node);
      node.querySelectorAll("section, article, [data-scroll-reveal]").forEach((item) => target.add(item));
    };
    collect(main, targets);
    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((item) => item.classList.add("scroll-revealed"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("scroll-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -36px 0px" });
    targets.forEach((item) => {
      item.classList.add("scroll-reveal");
      observer.observe(item);
    });
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        const added = new Set<Element>();
        collect(node, added);
        added.forEach((item) => {
          if (targets.has(item)) return;
          targets.add(item);
          item.classList.add("scroll-reveal");
          observer.observe(item);
        });
      }));
    });
    mutations.observe(main, { childList: true, subtree: true });
    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, [page]);

  useEffect(() => {
    const syncPageFromUrl = () => {
      const nextPage = pageFromPath(window.location.pathname);
      setPage(nextPage);
      setMobileMenu(false);
      setThemeMenu(false);
      if (nextPage !== "roadmap") setRoadmapGoal(null);
      if (nextPage === "opportunities") setOppSearch("");
      if (nextPage === "connect") setConnectTab("discover");
    };
    window.addEventListener("popstate", syncPageFromUrl);
    return () => window.removeEventListener("popstate", syncPageFromUrl);
  }, []);

  const openProfile = () => {
    if (authReady && !user) {
      navigate("login");
      return;
    }
    setEditing(!hasSavedProfile);
    setSaveError("");
    setSaveSuccess(false);
    setSaving(false);
    setShowProfile(true);
  };

  const navigate = (newPage: Page) => {
    const nextPath = pagePaths[newPage];
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ page: newPage }, "", nextPath);
    }
    if (newPage !== "roadmap") setRoadmapGoal(null);
    setPage(newPage);
    setMobileMenu(false);
    setThemeMenu(false);
    if (newPage === "opportunities" && !consumeHeroSearch()) {
      setOppSearch("");
    }
    if (newPage === "connect" && !consumeConnectSearch()) {
      setConnectTab("discover");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openLearnTopic = (topicId: string, goal?: CareerGoal) => {
    setSelectedLearnTopic(topicId);
    setLearnPathGoal(goal ?? null);
    navigate("learn");
  };

  const openCareerRoadmap = (goal: CareerGoal) => {
    setRoadmapGoal(goal);
    navigate("roadmap");
  };

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun size={15} /> },
    { value: "dark", label: "Dark", icon: <Moon size={15} /> },
    { value: "system", label: "System", icon: <Monitor size={15} /> },
  ];

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  useEffect(() => {
    let active = true;
    setProfileReady(false);
    setProfileLoadError("");
    if (!authReady) return;
    if (!user) {
      setProfile(initialProfile);
      setVerifiedSenior(false);
      setHasSavedProfile(false);
      setProfileReady(true);
      setLearningProgress(loadProgress());
      return;
    }

    void loadAccountProgress(user.uid).then((progress) => {
      if (active && auth.currentUser?.uid === user.uid) setLearningProgress(progress);
    });
    setProfile(initialProfile);
    void (async () => {
      let remote = null;
      try {
        remote = await ensureUserDocument(user);
      } catch (err) {
        console.error("Could not load profile:", err);
        if (active) setProfileLoadError("Could not load your saved profile. Check your connection and refresh to try again.");
      }
      if (!active || auth.currentUser?.uid !== user.uid) return;
      if (!remote) {
        setHasSavedProfile(false);
        setProfile((current) => ({
          ...initialProfile,
          name: current.name || user.displayName || "",
          goal: current.goal,
        }));
        setProfileReady(true);
        return;
      }
      setVerifiedSenior(remote.isVerifiedSenior);
      setHasSavedProfile(isCompleteProfile(remote));
      const next = profileFromUser(remote, "");
      setProfile({ ...next, name: next.name || user.displayName || "" });
      setProfileReady(true);
    })();
    return () => {
      active = false;
    };
  }, [authReady, user]);

  const persistProfile = async (): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) {
      throw new Error("Please log in first (Google or phone), then save your profile.");
    }
    try {
      await saveConnectProfile(
        currentUser.uid,
        profile,
        currentUser.photoURL || "",
        currentUser.email || "",
        currentUser.phoneNumber || "",
      );
    } catch (error) {
      const firebaseError = error as { code?: unknown; message?: unknown };
      console.error("[Profile] Save failed", {
        operation: "save profile to Firestore",
        code: typeof firebaseError?.code === "string" ? firebaseError.code : "unknown",
        message: typeof firebaseError?.message === "string" ? firebaseError.message : String(error),
        uid: currentUser.uid,
        documentPath: `users/${currentUser.uid}`,
        error,
      });
      throw error;
    }
    setHasSavedProfile(isCompleteProfile(profile));
    try {
      await saveProfileNameToAccount();
    } catch (error) {
      // Firestore is the source of truth; an Auth display-name update must
      // not turn a successful profile save into a reported failure.
      console.warn("[Firebase] Profile saved, but Auth displayName update failed", error);
    }
  };

  const validateProfile = (): string => {
    if (!profile.name.trim()) return "Please enter your name.";
    if (!profile.college.trim()) return "Please enter your college to complete your profile.";
    if (!profile.state.trim()) return "Please select your state to complete your profile.";
    return "";
  };

  const handleSaveProfile = async (): Promise<boolean> => {
    const validationError = validateProfile();
    if (validationError) {
      setSaveError(validationError);
      setSaveSuccess(false);
      return false;
    }
    if (!auth.currentUser) {
      setSaveError("Please log in first (Google or phone), then save your profile.");
      setSaveSuccess(false);
      return false;
    }
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await persistProfile();
      setSaveSuccess(true);
      return true;
    } catch (error) {
      const firebaseError = error as { code?: unknown; message?: unknown };
      const code = typeof firebaseError?.code === "string" ? ` (${firebaseError.code})` : "";
      const message = typeof firebaseError?.message === "string"
        ? firebaseError.message
        : "An unexpected Firebase error occurred.";
      setSaveError(`Could not save your profile${code}: ${message}`);
      setSaveSuccess(false);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleContinueToRoadmap = () => {
    setShowProfile(false);
    navigate("roadmap");
  };

  const saveProfileNameToAccount = async () => {
    const currentUser = auth.currentUser;
    const name = profile.name.trim();
    if (currentUser && name) {
      await updateProfile(currentUser, { displayName: name });
    }
  };

  const fieldLabel: React.CSSProperties = {
    display: "grid",
    gap: 8,
    color: colors.labelText,
    fontSize: 13,
    fontWeight: 650,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 9,
    border: `1px solid ${colors.inputBorder}`,
    background: colors.inputBg,
    color: colors.text,
    outline: "none",
    fontSize: 14,
  };

  const pageTitle = {
    home: "Your path starts here.",
    profile: "Your Student Profile",
    roadmap: "Your Roadmap",
    learn: "What should you learn?",
    careers: "Explore Career Paths",
    opportunities: "Opportunities",
    community: "Student Community",
    connect: "Connect. Ask. Learn. Grow.",
    login: "Log in to Gradivo",
    signup: "Create your Gradivo account",
  }[page];

  const styles = {
    app: {
      width: "100%",
      minHeight: "100vh",
      background: colors.bg,
      color: colors.text,
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    } as React.CSSProperties,

    nav: {
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: colors.navBg,
      backdropFilter: "blur(18px)",
      borderBottom: `1px solid ${colors.border}`,
    } as React.CSSProperties,

    navInner: {
      width: "100%",
      maxWidth: 1180,
      margin: "0 auto",
      padding: "14px 20px",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    } as React.CSSProperties,

    logo: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      cursor: "pointer",
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: "-0.5px",
    } as React.CSSProperties,

    logoMark: {
      width: 34,
      height: 34,
      borderRadius: 10,
      background: `linear-gradient(135deg, ${colors.purple}, #1E40AF)`,
      display: "grid",
      placeItems: "center",
      boxShadow: "0 0 25px rgba(59,130,246,.3)",
    } as React.CSSProperties,

    navLinks: {
      display: "flex",
      alignItems: "center",
      gap: 8,
    } as React.CSSProperties,

    navButton: {
      border: "none",
      background: "transparent",
      color: colors.muted,
      padding: "10px 13px",
      borderRadius: 9,
      cursor: "pointer",
      fontSize: 14,
    } as React.CSSProperties,

    primary: {
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
    } as React.CSSProperties,

    container: {
      width: "100%",
      maxWidth: "none",
      margin: 0,
      padding: "0 clamp(20px, 4vw, 60px)",
      boxSizing: "border-box",
    } as React.CSSProperties,

    section: {
      padding: "90px 0",
    } as React.CSSProperties,

    card: {
      background: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: 18,
      padding: 24,
    } as React.CSSProperties,

    muted: {
      color: colors.muted,
    } as React.CSSProperties,

    badge: {
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
    } as React.CSSProperties,
  };

  const renderNavbar = () => (
    <nav className="gradivo-nav" style={page === "home" ? { ...styles.nav, position: "absolute", top: 0, left: 0, width: "100%", boxSizing: "border-box" } : styles.nav}>
      <div className="gradivo-nav-inner" style={styles.navInner}>
        <div style={styles.logo} onClick={() => navigate("home")}>
         <div style={styles.logoMark}>
  <img
    src="/gradivo-logo.png"
    alt="Gradivo"
    style={{ width: "100%", height: "100%", objectFit: "contain" }}
  />
</div>
          
        </div>

        <div style={styles.navLinks}>
          <div className="desktop-nav">
            {(
              [
                ["Home", "home"],
                ["Roadmap", "roadmap"],
                ["Learn", "learn"],
                ["Careers", "careers"],
                ["Opportunities", "opportunities"],
                ["Connect", "connect"],
                ["Community", "community"],
              ] as const
            ).map(([label, value]) => (
              <button
                key={value}
                className={`menu-item${page === value ? " is-active" : ""}`}
                aria-current={page === value ? "page" : undefined}
                onClick={() => navigate(value)}
                style={{
                  ...styles.navButton,
                color: page === value ? (isDark ? "white" : colors.purple2) : colors.muted,
                  background: page === value ? "rgba(59,130,246,.18)" : "transparent",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            style={{
              ...styles.primary,
              padding: "10px 14px",
            }}
            onClick={openProfile}
          >
            <User size={17} />
            Profile
          </button>

          <div style={{ position: "relative" }}>
            <button
              aria-label="Change theme"
              title={`Theme: ${theme}`}
              onClick={() => setThemeMenu(!themeMenu)}
              style={{
                border: `1px solid ${colors.border}`,
                background: colors.card,
                color: colors.text,
                padding: 10,
                borderRadius: 9,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              <ThemeIcon size={19} />
            </button>

            {themeMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 48,
                  width: 190,
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 14,
                  padding: 6,
                  zIndex: 60,
                  boxShadow: "0 12px 40px rgba(0,0,0,.35)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: colors.muted,
                    padding: "8px 10px 4px",
                    letterSpacing: "0.5px",
                  }}
                >
                  THEME
                </div>
                {themeOptions.map((option) => {
                  const selected = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTheme(option.value);
                        setThemeMenu(false);
                      }}
                      style={{
                        border: "none",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: selected ? "rgba(59,130,246,.15)" : "transparent",
                        color: selected ? colors.purple2 : colors.muted,
                        padding: "10px",
                        borderRadius: 9,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: selected ? 700 : 500,
                      }}
                    >
                      {option.icon}
                      {option.label}
                      <span style={{ marginLeft: "auto", fontSize: 13 }}>
                        {selected ? "●" : "○"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            className="mobile-menu-button"
            style={{
              border: `1px solid ${colors.border}`,
              background: colors.card,
              color: colors.text,
              padding: 10,
              borderRadius: 9,
              cursor: "pointer",
            }}
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div
          style={{
            ...styles.container,
            paddingBottom: 18,
            display: "grid",
            gap: 8,
          }}
        >
          {[
            ["Home", "home"],
            ["Roadmap", "roadmap"],
            ["Learn", "learn"],
            ["Careers", "careers"],
            ["Opportunities", "opportunities"],
            ["Connect", "connect"],
            ["Community", "community"],
          ].map(([label, value]) => (
            <button
  className={`menu-item${page === value ? " is-active" : ""}`}
  aria-current={page === value ? "page" : undefined}
  key={value}
  onClick={() => navigate(value as Page)}
  onMouseEnter={() => setHoveredMenu(value)}
  onMouseLeave={() => setHoveredMenu(null)}
  style={{
    ...styles.navButton,
    textAlign: "left",
    background:
      hoveredMenu === value ? "#2563EB" : colors.card,
    color:
      hoveredMenu === value ? "white" : colors.muted,
    boxShadow:
      hoveredMenu === value
        ? "0 0 18px rgba(59, 130, 246, 0.7)"
        : "none",
    transform:
      hoveredMenu === value ? "translateX(4px)" : "translateX(0)",
    transition: "all 0.2s ease",
  }}
>
  {label}
</button>
          ))}

          <div
            style={{
              borderTop: `1px solid ${colors.border}`,
              marginTop: 6,
              paddingTop: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: colors.muted,
                padding: "0 13px 6px",
                letterSpacing: "0.5px",
              }}
            >
              THEME
            </div>
            {themeOptions.map((option) => {
              const selected = theme === option.value;
              return (
                <button
                  className="menu-item"
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  style={{
                    ...styles.navButton,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    textAlign: "left",
                    background: selected ? "rgba(59,130,246,.15)" : "transparent",
                    color: selected ? colors.purple2 : colors.muted,
                    transition: "all 0.2s ease",
                  }}
                >
                  {option.icon}
                  {option.label}
                  <span style={{ marginLeft: "auto", fontSize: 13 }}>
                    {selected ? "●" : "○"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );

  const renderHome = () => (
    <HomeExperience
      colors={colors}
      primaryStyle={styles.primary}
      query={heroQuery}
      setQuery={setHeroQuery}
      notice={heroNotice}
      onFindPath={openProfile}
      onNavigate={(destination) => navigate(destination)}
      onExplore={() => document.getElementById("home-explore")?.scrollIntoView({ behavior: "smooth" })}
      onStartExplore={() => navigate("learn")}
      onSearch={(e) => {
        e.preventDefault();
        const dest = getSearchDestination(heroQuery);
        if (!dest) {
          setHeroNotice("No matching result found.");
          return;
        }
        setHeroNotice("");
        if (dest.page === "opportunities") {
          heroSearchPending.current = true;
          setOppSearch(heroQuery.trim());
        } else if (dest.page === "connect") {
          connectSearchPending.current = true;
          setConnectTab(dest.tab ?? "discover");
        }
        navigate(dest.page);
      }}
    />
  );

  const renderRoadmap = () => (
    <StudentRoadmap
      profile={profile}
      colors={colors}
      onBack={() => navigate("home")}
      onOpenProfile={openProfile}
      initialCareerGoal={roadmapGoal}
      progress={learningProgress}
      onProgressChange={setLearningProgress}
      onLearnTopic={(topicId, goal) => {
        const next = setItemStatus(learningProgress, topicId, "learning");
        setLearningProgress(next);
        openLearnTopic(topicId, goal);
      }}
      classicSteps={roadmapSteps}
    />
  );

  const renderLearn = () => {
    if (!selectedLearnTopic || !SKILLS[selectedLearnTopic]) {
      return <LearnDiscovery onOpenTopic={(id) => openLearnTopic(id)} onOpenRoadmap={openCareerRoadmap} />;
    }
    return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.badge}>
          <BookOpen size={15} />
          {selectedLearnTopic ? "Learn this topic" : "Explore learning topics"}
        </div>

        {selectedLearnTopic && SKILLS[selectedLearnTopic] ? (() => {
          const skill = SKILLS[selectedLearnTopic];
          const status = learningProgress[selectedLearnTopic] ?? "not_started";
          const candidateGoals = TOPIC_ROADMAPS[skill.id] ?? [];
          const goal = learnPathGoal && candidateGoals.includes(learnPathGoal)
            ? learnPathGoal
            : candidateGoals[0];
          const path = goal ? CAREER_TOPIC_PATHS[goal] ?? [] : [];
          const pathIndex = path.indexOf(skill.id);
          const previous = pathIndex > 0 ? SKILLS[path[pathIndex - 1]] : undefined;
          const nextId = pathIndex >= 0 ? path[pathIndex + 1] : undefined;
          const next = nextId ? SKILLS[nextId] : undefined;
          const setStatus = (nextStatus: ItemStatus) =>
            setLearningProgress((current) => setItemStatus(current, skill.id, nextStatus));
          return (
            <div style={{ marginTop: 30, display: "grid", gap: 20 }}>
              <button type="button" onClick={() => setSelectedLearnTopic(null)} style={{ ...styles.navButton, paddingLeft: 0, width: "fit-content" }}>
                <ArrowRight size={15} style={{ transform: "rotate(180deg)" }} /> All topics
              </button>
              {learningProgress[skill.id] === "learning" && (
                <div style={{ ...styles.card, background: colors.glowCard, padding: 20 }}>
                  <div style={{ color: colors.purple2, fontSize: 12, fontWeight: 800, letterSpacing: ".1em" }}>CONTINUE YOUR PATH</div>
                  <strong style={{ display: "block", marginTop: 8 }}>{goal ? CAREER_LABELS[goal] : "Your learning path"}</strong>
                  <p style={{ ...styles.muted, margin: "5px 0 14px" }}>Current step: {skill.name}</p>
                  <button type="button" style={styles.primary} onClick={() => document.getElementById("learn-topic-detail")?.scrollIntoView({ behavior: "smooth" })}>Continue learning <ArrowRight size={16} /></button>
                </div>
              )}
              <article id="learn-topic-detail" style={{ ...styles.card, padding: "clamp(22px,4vw,38px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: "clamp(32px,5vw,48px)", margin: 0, letterSpacing: "-1.5px" }}>{skill.name}</h1>
                  <span style={styles.badge}>{status === "completed" ? "✓ Completed" : status === "learning" ? "● Current" : "Ready to explore"}</span>
                </div>
                <div style={{ display: "grid", gap: 22, marginTop: 28 }}>
                  <div><h2 style={{ fontSize: 17 }}>Why this matters</h2><p style={styles.muted}>{skill.why}</p></div>
                  <div><h2 style={{ fontSize: 17 }}>What you’ll learn</h2><p style={styles.muted}>{skill.whatToLearn}</p></div>
                  <div><h2 style={{ fontSize: 17 }}>Learning resources</h2><ul style={{ color: colors.muted, paddingLeft: 20 }}>{skill.resources.map((resource) => <li key={resource.title}><strong style={{ color: colors.text }}>{resource.title}</strong> — {resource.note}</li>)}</ul></div>
                  <div><h2 style={{ fontSize: 17 }}>Practice</h2><p style={styles.muted}>{skill.beginner}</p></div>
                  <div><h2 style={{ fontSize: 17 }}>Mini project</h2><p style={styles.muted}>{skill.project}</p></div>
                  <div><h2 style={{ fontSize: 17 }}>Where this fits</h2><p style={styles.muted}>{goal ? CAREER_LABELS[goal] : "Choose a roadmap to see this topic in a structured path."}</p><p style={{ color: colors.purple2, fontWeight: 650 }}>{previous?.name ? `${previous.name}  →  ` : ""}{skill.name} ← YOU ARE HERE{next ? `  →  ${next.name}` : ""}</p>{goal && <button type="button" style={styles.navButton} onClick={() => openCareerRoadmap(goal)}>View full roadmap <ArrowRight size={16} /></button>}</div>
                  {next && <div><h2 style={{ fontSize: 17 }}>Next step</h2><p style={styles.muted}>{next.name}</p><button type="button" style={styles.navButton} onClick={() => openLearnTopic(next.id, goal)}>Learn next <ArrowRight size={16} /></button></div>}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
                  <button type="button" style={styles.primary} onClick={() => setStatus(status === "completed" ? "not_started" : "completed")}>{status === "completed" ? "Completed ✓" : "Mark topic complete"}</button>
                  {next && <button type="button" style={styles.navButton} onClick={() => openLearnTopic(next.id, goal)}>Learn next <ArrowRight size={16} /></button>}
                </div>
                {status === "completed" && <div style={{ marginTop: 22, ...styles.badge }}>✓ Topic completed — {next ? `Next: ${next.name}` : "You reached the end of this path."}</div>}
              </article>
              <div style={{ ...styles.card, padding: 24 }}><h2 style={{ marginTop: 0 }}>Where can this take you?</h2><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{candidateGoals.map((roadmapId) => <button type="button" key={roadmapId} style={styles.navButton} onClick={() => openCareerRoadmap(roadmapId)}>{CAREER_LABELS[roadmapId]} <ArrowRight size={14} /></button>)}</div></div>
              <div style={{ ...styles.card, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}><div><strong>Interested in going deeper?</strong><p style={{ ...styles.muted, margin: "6px 0 0" }}>Explore without choosing a career, or open a related structured path.</p></div><button type="button" style={styles.primary} onClick={() => goal ? openCareerRoadmap(goal) : setSelectedLearnTopic(null)}>Find a roadmap <ArrowRight size={16} /></button></div>
            </div>
          );
        })() : (
          <>
            <h1 style={{ fontSize: 52, letterSpacing: "-2px", margin: "18px 0 12px" }}>What should you learn?</h1>
            <p style={{ ...styles.muted, fontSize: 18, maxWidth: 700, lineHeight: 1.7 }}>Explore topics on their own, then follow a roadmap when you want a structured path.</p>
            {Object.values(learningProgress).some((status) => status === "learning") && (() => {
              const currentId = Object.entries(learningProgress).find(([, status]) => status === "learning")?.[0];
              const current = currentId ? SKILLS[currentId] : undefined;
              const intake = loadIntake();
              const goal = intake?.careerGoal ?? (current ? TOPIC_ROADMAPS[current.id]?.[0] : undefined);
              return current ? <div style={{ ...styles.card, background: colors.glowCard, marginTop: 25, padding: 22 }}><div style={{ color: colors.purple2, fontWeight: 800, fontSize: 12, letterSpacing: ".1em" }}>CONTINUE YOUR PATH</div><h2 style={{ margin: "8px 0" }}>{goal ? CAREER_LABELS[goal] : "Your learning path"}</h2><p style={{ ...styles.muted, marginTop: 0 }}>Current step: {current.name}</p><button type="button" style={styles.primary} onClick={() => openLearnTopic(current.id, goal)}>Continue learning <ArrowRight size={16} /></button></div> : null;
            })()}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 18, marginTop: 35 }}>
              {LEARN_TRACKS.map((track) => <div key={track.title} style={{ ...styles.card, padding: 22 }}><div style={{ color: colors.purple2 }}>{track.icon === "code" ? <Code2 size={24} /> : track.icon === "web" ? <Briefcase size={24} /> : track.icon === "security" ? <Shield size={24} /> : <Sparkles size={24} />}</div><h2 style={{ fontSize: 20, margin: "14px 0 4px" }}>{track.title}</h2><div style={{ color: colors.purple2, fontSize: 13, marginBottom: 14 }}>{track.level}</div><div style={{ display: "grid", gap: 8 }}>{track.topics.map((id) => { const topic = SKILLS[id]; return topic ? <button type="button" key={id} onClick={() => openLearnTopic(id)} className="learn-topic-link">{topic.name}<ArrowRight size={14} /></button> : null; })}</div></div>)}
            </div>
            <div style={{ ...styles.card, marginTop: 24, padding: 24 }}><h2 style={{ marginTop: 0 }}>Explore a structured path</h2><p style={styles.muted}>Choose a direction to see how its topics connect.</p><div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>{(["ai-ml-engineer", "software-engineer", "cybersecurity-engineer", "cloud-engineer"] as CareerGoal[]).map((goal) => <button key={goal} type="button" style={styles.navButton} onClick={() => openCareerRoadmap(goal)}>{CAREER_LABELS[goal]} <ArrowRight size={14} /></button>)}</div></div>
            <div style={{ ...styles.card, marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}><div><h3 style={{ margin: "0 0 7px" }}>Connect learning to a career direction.</h3><p style={{ margin: 0, ...styles.muted }}>Explore possibilities before choosing a path.</p></div><button style={styles.primary} onClick={() => navigate("careers")}>Explore Careers <ArrowRight size={17} /></button></div>
          </>
        )}
      </div>
    </section>
    );
  };

  const renderCareers = () => (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.badge}>
          <Compass size={15} />
          Career Explorer
        </div>

        <h1 style={{ fontSize: 52, letterSpacing: "-2px", margin: "18px 0 12px" }}>
          Explore your possibilities.
        </h1>

        <p style={{ ...styles.muted, fontSize: 18, maxWidth: 720, lineHeight: 1.7 }}>
          Different careers require different combinations of skills. Explore
          them before deciding what to focus on.
        </p>

        <div style={{ display: "grid", gap: 15, marginTop: 45 }}>
          {careers.map((career, index) => (
            <div
              key={career.title}
              style={{
                ...styles.card,
                cursor: "pointer",
              }}
              onClick={() =>
                setActiveCareer(activeCareer === index ? null : index)
              }
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                  }}
                >
                  <div style={{ color: colors.purple2 }}>{career.icon}</div>

                  <div>
                    <h3 style={{ margin: 0, fontSize: 20 }}>{career.title}</h3>
                    <p style={{ margin: "6px 0 0", ...styles.muted }}>
                      {career.description}
                    </p>
                  </div>
                </div>

                <ChevronRight
                  size={20}
                  style={{
                    transform:
                      activeCareer === index ? "rotate(90deg)" : "rotate(0)",
                    transition: "transform .2s",
                  }}
                />
              </div>

              {activeCareer === index && (
                <div
                  style={{
                    marginTop: 24,
                    paddingTop: 20,
                    borderTop: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      color: colors.muted,
                      fontSize: 13,
                      marginBottom: 12,
                    }}
                  >
                    SKILLS TO EXPLORE
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {career.skills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "rgba(59,130,246,.1)",
                          color: colors.purple2,
                          fontSize: 13,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderOpportunities = () => (
    <NoticesPage
      colors={colors}
      profileCity={profile.city}
      profileState={profile.state}
      initialSearch={oppSearch}
    />
  );

  const renderProfile = () => (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.badge}>
          <User size={15} />
          Student Profile
        </div>

        <h1 style={{ fontSize: 52, letterSpacing: "-2px", margin: "18px 0 12px" }}>
          Your starting point.
        </h1>

        <p style={{ ...styles.muted, fontSize: 18, maxWidth: 700 }}>
          Tell Gradivo a little about yourself so your learning journey has
          context.
        </p>

        <div style={{ ...styles.card, maxWidth: 760, marginTop: 45 }}>
          <ProfileAuth
            colors={colors}
            studentName={profile.name}
            onAuthName={(name) =>
              setProfile((current) =>
                current.name ? current : { ...current, name },
              )
            }
          >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 18,
            }}
          >
            <label style={fieldLabel}>
              Name
              <input
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                placeholder="Your name"
                style={inputStyle}
              />
            </label>

            <label style={fieldLabel}>
              Branch / Course
              <input
                value={profile.branch}
                onChange={(e) =>
                  setProfile({ ...profile, branch: e.target.value })
                }
                placeholder="Example: ISE"
                style={inputStyle}
              />
            </label>

            <label style={fieldLabel}>
              Year
              <select
                value={profile.year}
                onChange={(e) =>
                  setProfile({ ...profile, year: e.target.value })
                }
                style={inputStyle}
              >
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </label>

            <label style={fieldLabel}>
              Career Goal
              <input
                value={profile.goal}
                onChange={(e) =>
                  setProfile({ ...profile, goal: e.target.value })
                }
                placeholder="Example: Cybersecurity"
                style={inputStyle}
              />
            </label>
          </div>

          <div style={{ marginTop: 25 }}>
            <div style={fieldLabel}>Interests</div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 9,
                marginTop: 10,
              }}
            >
              {[
                "Coding",
                "Cybersecurity",
                "AI",
                "Cloud",
                "Web Development",
                "Design",
                "Data",
              ].map((interest) => {
                const active = profile.interests.includes(interest);

                return (
                  <button
                    key={interest}
                    onClick={() =>
                      setProfile({
                        ...profile,
                        interests: active
                          ? profile.interests.filter((x) => x !== interest)
                          : [...profile.interests, interest],
                      })
                    }
                    style={{
                      border: `1px solid ${
                        active ? colors.purple : colors.border
                      }`,
                      background: active
                        ? "rgba(59,130,246,.15)"
                        : colors.card2,
                      color: active ? colors.purple2 : colors.muted,
                      padding: "9px 12px",
                      borderRadius: 9,
                      cursor: "pointer",
                    }}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          <ConnectProfileFields
            profile={profile}
            setProfile={setProfile}
            colors={colors}
            verifiedSenior={verifiedSenior}
          />

          <button
            type="button"
            style={{ ...styles.primary, marginTop: 30 }}
            onClick={async () => {
              const ok = await handleSaveProfile();
              if (ok) {
                setShowProfile(false);
                navigate("roadmap");
              }
            }}
          >
            Save & Start Roadmap
            <ArrowRight size={17} />
          </button>
          </ProfileAuth>
        </div>
      </div>
    </section>
  );

  const renderPage = () => {
    switch (page) {
      case "home":
        return renderHome();
      case "profile":
        return renderProfile();
      case "login":
      case "signup": {
        const mode: AuthMode = page;
        const openAuthMode = (nextMode: AuthMode) => navigate(nextMode);
        const continueToProfile = () => navigate("profile");
        return <AuthPage mode={mode} colors={colors} onModeChange={openAuthMode} onSuccess={continueToProfile} onAuthenticated={continueToProfile} />;
      }
      case "roadmap":
        return renderRoadmap();
      case "learn":
        return renderLearn();
      case "careers":
        return renderCareers();
      case "opportunities":
        return renderOpportunities();
      case "community":
        return <CommunityPage colors={colors} onOpenProfile={openProfile} />;
      case "connect":
        return (
          <ConnectPage
            colors={colors}
            profile={profile}
            setProfile={setProfile}
            onOpenProfile={openProfile}
            profileReady={profileReady}
            profileLoadError={profileLoadError}
            initialTab={connectTab}
          />
        );
      default:
        return renderHome();
    }
  };

  return (
    <div className={`gradivo-app${introVisible ? " intro-active" : ""}`} style={styles.app}>
      <motion.div
        className="scroll-progress-indicator"
        aria-hidden="true"
        style={{ scaleX: scrollYProgress }}
      />
      {!authReady && <div className="auth-session-loading" role="status">
        <span className="auth-session-spinner" aria-hidden="true" />
        <span>Restoring your Gradivo session…</span>
      </div>}
      <LiveBackground />
      {renderNavbar()}

      <main className="gradivo-main" aria-label={pageTitle}>
        <div key={page} className={`page-transition page-${page}`}>
          {renderPage()}
        </div>
      </main>

      <section
        aria-label="Contact Gradivo"
        style={{
          ...styles.container,
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        <div
          style={{
            ...styles.card,
            textAlign: "center",
            padding: "34px 24px",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.3px" }}>
            Have a question or suggestion?
          </div>
          <div style={{ ...styles.muted, fontSize: 14, marginTop: 8 }}>
            For any queries, contact us at
          </div>
          <a
            href="mailto:gradivoweb@gmail.com"
            className="gradivo-contact-email"
            style={{
              display: "inline-block",
              marginTop: 12,
              fontSize: 16,
              fontWeight: 700,
              color: colors.purple2,
              textDecoration: "none",
              border: "1px solid rgba(59,130,246,.35)",
              background: "rgba(59,130,246,.1)",
              padding: "10px 18px",
              borderRadius: 10,
              transition: "box-shadow 0.2s ease, background 0.2s ease",
            }}
          >
            gradivoweb@gmail.com
          </a>
        </div>
      </section>

    <footer
  style={{
    borderTop: `1px solid ${colors.border}`,
    padding: "35px 0",
    marginTop: 40,
  }}
>
  <div
    style={{
      ...styles.container,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 20,
      flexWrap: "wrap",
    }}
  >
    <div>
      <div style={{ fontWeight: 800, fontSize: 19 }}>
        Gradivo
      </div>

      <div
        style={{
          ...styles.muted,
          fontSize: 13,
          marginTop: 5,
        }}
      >
        Your student journey, simplified.
      </div>
    </div>

    <div
      style={{
        ...styles.muted,
        fontSize: 12,
      }}
    >
      © 2026 Gradivo. All rights reserved.
    </div>
  </div>
  <div className="footer-giant" aria-hidden="true">
    GRADIVO
  </div>
</footer>

     
      {showProfile && (
        <div
          className="profile-overlay"
          onClick={() => setShowProfile(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,.7)",
            backdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            className="profile-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              ...styles.card,
              width: "min(760px,100%)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={styles.badge}>
                  <User size={14} />
                  Profile
                </div>
              </div>

                <button
                onClick={() => setShowProfile(false)}
                style={{
                  border: `1px solid ${colors.border}`,
                  background: colors.card2,
                  color: colors.text,
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <ProfileAuth
              colors={colors}
              studentName={profile.name}
              onAuthName={(name) =>
                setProfile((current) =>
                  current.name ? current : { ...current, name },
                )
              }
            >
            {hasSavedProfile && !editing ? (
              <>
                <h2 style={{ margin: "8px 0 18px", fontSize: 30 }}>
                  Your profile
                </h2>
                <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                  {(
                    [
                      ["Name", profile.name],
                      ["Branch", profile.branch],
                      ["Year", profile.year],
                      ["Career Goal", profile.goal],
                      ["College", profile.college],
                      ["Location", [profile.city, profile.state, profile.country].filter(Boolean).join(", ")],
                      ["Interests", profile.interests.join(", ")],
                      ["Skills", profile.skills.join(", ")],
                      ["Bio", profile.bio],
                      ["Role", profile.isSenior ? "Senior" : "Junior"],
                    ] as [string, string][]
                  )
                    .filter(([, value]) => Boolean(value))
                    .map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "140px 1fr",
                          gap: 10,
                          fontSize: 14,
                        }}
                      >
                        <div style={{ color: colors.muted }}>{label}</div>
                        <div style={{ color: colors.text }}>{value}</div>
                      </div>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 26, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={{
                      ...styles.primary,
                      background: colors.card2,
                      border: `1px solid ${colors.border}`,
                      boxShadow: "none",
                    }}
                    onClick={() => {
                      setEditing(true);
                      setSaveSuccess(false);
                      setSaveError("");
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    style={styles.primary}
                    onClick={handleContinueToRoadmap}
                  >
                    Continue to Roadmap
                    <ArrowRight size={17} />
                  </button>
                </div>
              </>
            ) : (
              <>
            <h2 style={{ margin: "8px 0 18px", fontSize: 30 }}>
              {!profileReady
                ? "Loading your profile…"
                : hasSavedProfile
                  ? "Edit Profile"
                  : "Complete Your Profile"}
            </h2>
            {profileLoadError ? (
              <div role="alert" style={{ color: "#fca5a5", marginBottom: 14 }}>
                {profileLoadError}
              </div>
            ) : null}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
                gap: 17,
                marginTop: 8,
              }}
            >
              <label style={fieldLabel}>
                Name
                <input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  placeholder="Your name"
                  style={inputStyle}
                />
              </label>

              <label style={fieldLabel}>
                Branch
                <input
                  value={profile.branch}
                  onChange={(e) =>
                    setProfile({ ...profile, branch: e.target.value })
                  }
                  placeholder="Example: ISE"
                  style={inputStyle}
                />
              </label>

              <label style={fieldLabel}>
                Year
                <select
                  value={profile.year}
                  onChange={(e) =>
                    setProfile({ ...profile, year: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </label>

              <label style={fieldLabel}>
                Goal
                <input
                  value={profile.goal}
                  onChange={(e) =>
                    setProfile({ ...profile, goal: e.target.value })
                  }
                  placeholder="Your career goal"
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={{ marginTop: 22 }}>
              <div style={fieldLabel}>Interests</div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                {[
                  "Coding",
                  "Cybersecurity",
                  "AI",
                  "Cloud",
                  "Web Development",
                  "Data",
                ].map((interest) => {
                  const active = profile.interests.includes(interest);

                  return (
                    <button
                      key={interest}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          interests: active
                            ? profile.interests.filter((x) => x !== interest)
                            : [...profile.interests, interest],
                        })
                      }
                      style={{
                        border: `1px solid ${
                          active ? colors.purple : colors.border
                        }`,
                        background: active
                          ? "rgba(59,130,246,.15)"
                          : colors.card2,
                        color: active ? colors.purple2 : colors.muted,
                        padding: "8px 11px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <ConnectProfileFields
              profile={profile}
              setProfile={setProfile}
              colors={colors}
              verifiedSenior={verifiedSenior}
            />

            {saveError ? (
              <div
                className="gradivo-notice gradivo-notice-error"
                role="alert"
                style={{
                  marginTop: 18,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(239,68,68,.12)",
                  border: "1px solid rgba(239,68,68,.35)",
                  color: "#fca5a5",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {saveError}
              </div>
            ) : null}
            {saveSuccess ? (
              <div
                className="gradivo-notice gradivo-notice-success"
                style={{
                  marginTop: 18,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(52,211,153,.1)",
                  border: "1px solid rgba(52,211,153,.3)",
                  color: "#6ee7b7",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                Profile saved successfully!
              </div>
            ) : null}

            <button
              type="button"
              style={{ ...styles.primary, marginTop: 22, opacity: saving ? 0.7 : 1 }}
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>

            {saveSuccess ? (
              <button
                type="button"
                style={{
                  ...styles.primary,
                  marginTop: 12,
                  background: colors.card2,
                  border: `1px solid ${colors.purple}`,
                  boxShadow: "none",
                  color: colors.purple2,
                }}
                onClick={handleContinueToRoadmap}
              >
                Continue to Roadmap
                <ArrowRight size={17} />
              </button>
            ) : null}
              </>
            )}
            </ProfileAuth>
          </div>
        </div>
      )}

      {introVisible && <IntroAnimation onComplete={handleIntroComplete} />}

      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: ${colors.bg};
        }

        button,
        input,
        select {
          font-family: inherit;
        }

        button:hover {
          opacity: .94;
        }

        .gradivo-contact-email:hover {
          background: rgba(59, 130, 246, 0.18);
          box-shadow: 0 0 18px rgba(59, 130, 246, 0.45);
          opacity: 1;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .mobile-menu-button {
          display: none;
        }

        @media (max-width: 800px) {
          .desktop-nav {
            display: none;
          }

          .mobile-menu-button {
            display: block;
          }

          h1 {
            letter-spacing: -2px !important;
          }
        }

        @media (max-width: 600px) {
          .gradivo-container {
            padding-left: 18px;
            padding-right: 18px;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
