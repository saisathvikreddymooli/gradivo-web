import { useCallback, useEffect, useState } from "react";
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
  Search,
  Shield,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import ProfileAuth from "./components/ProfileAuth";
import AuthPage from "./auth/AuthPage";
import ProfileDetailsForm from "./components/ProfileDetailsForm";
import UserAvatar from "./components/UserAvatar";
import StudentRoadmap from "./components/StudentRoadmap";
import type { AuthMode } from "./auth/AuthScreen";
import { useAuth } from "./auth/useAuth";
import ConnectPage from "./connect/ConnectPage";
import NoticesPage from "./notices/NoticesPage";
import CommunityPage from "./community/CommunityPage";
import LiveBackground from "./components/LiveBackground";
import IntroAnimation from "./components/IntroAnimation";
import LearnDiscovery from "./components/LearnDiscovery";
import HomeExperience from "./components/HomeExperience";
import { DEFAULT_COUNTRY } from "./connect/constants";
import { loadUser, profileFromUser, saveConnectProfile } from "./connect/api";
import type { AppStudentProfile } from "./connect/types";
import { auth } from "./firebase/config";
import { useTheme } from "./theme";
import { BRAND_NAME, BRAND_NAME_UPPER } from "./config/brand";
import { getSearchDestination } from "./search";
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
  skillLevel: "beginner",
  weeklyHours: "7",
  timelineMonths: "6",
};

function isCompleteProfile(profile: Pick<AppStudentProfile, "name" | "college" | "state">): boolean {
  return Boolean(profile.name.trim() && profile.college.trim() && profile.state.trim());
}




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
  const { colors } = useTheme();
  const { user, ready: authReady, logOut } = useAuth();
  const { scrollYProgress } = useScroll();


  const [page, setPage] = useState<Page>(() => pageFromPath(window.location.pathname));
  const [selectedLearnTopic, setSelectedLearnTopic] = useState<string | null>(null);
  const [learnPathGoal, setLearnPathGoal] = useState<CareerGoal | null>(null);
  const [learningProgress, setLearningProgress] = useState<ProgressMap>(() => loadProgress());
  const [heroQuery, setHeroQuery] = useState("");
  const [heroNotice, setHeroNotice] = useState("");

  const [mobileMenu, setMobileMenu] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  /** Where to return after login. Defaults to Profile. */
  const [postLoginPage, setPostLoginPage] = useState<Page>("profile");
  const [profile, setProfile] = useState<AppStudentProfile>(initialProfile);
  const [profilePhone, setProfilePhone] = useState("");
  const [memberSince, setMemberSince] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [verifiedSenior, setVerifiedSenior] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeCareer, setActiveCareer] = useState<number | null>(null);
  /** True once the Firestore profile check has resolved for the current auth state. */
  const [profileReady, setProfileReady] = useState(false);
  /** Bump to re-run the profile load without a full page refresh. */
  const [profileReloadToken, setProfileReloadToken] = useState(0);
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
    };
    window.addEventListener("popstate", syncPageFromUrl);
    return () => window.removeEventListener("popstate", syncPageFromUrl);
  }, []);

  const openProfile = () => {
    if (authReady && !user) {
      setPostLoginPage("profile");
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
    setPage(newPage);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!authReady || user) return;
    if (page === "profile") {
      setPostLoginPage(page);
      window.history.replaceState({ page: "login" }, "", pagePaths.login);
      setPage("login");
    }
  }, [authReady, page, user]);

  const openLearnTopic = (topicId: string, goal?: CareerGoal) => {
    setSelectedLearnTopic(topicId);
    setLearnPathGoal(goal ?? null);
    navigate("learn");
  };

  const openCareerRoadmap = (_goal?: CareerGoal) => {
    navigate("roadmap");
  };

  useEffect(() => {
    let active = true;
    setProfileReady(false);
    setProfileLoadError("");
    if (!authReady) return;
    if (!user) {
      setProfile(initialProfile);
      setProfilePhone("");
      setMemberSince(null);
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
        remote = await loadUser(user.uid);
      } catch (err) {
        const code =
          typeof (err as { code?: unknown })?.code === "string"
            ? ((err as { code?: string }).code as string)
            : "";
        if (import.meta.env.DEV) {
          console.error("[Profile] Load failed", { code: code || "unknown", error: err });
        }
        if (!active || auth.currentUser?.uid !== user.uid) return;
        if (code === "permission-denied") {
          setProfileLoadError(
            "We couldn't access your profile. Please sign in again. If it keeps happening, the database rules need updating.",
          );
        } else if (code === "unavailable" || code === "auth/network-request-failed") {
          setProfileLoadError("You appear to be offline. Check your connection and try again.");
        } else if (code === "failed-precondition" || code === "not-found") {
          setProfileLoadError("The database isn't set up yet. Please contact the site owner.");
        } else if (code === "unauthenticated" || code === "auth/no-current-user") {
          setProfileLoadError("Please sign in to view your profile.");
        } else {
          setProfileLoadError("Could not load your saved profile. Check your connection and try again.");
        }
        setProfileReady(true);
        return;
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
      setMemberSince(remote.createdAt ?? null);
      setProfilePhone(remote.phone || user.phoneNumber || "");
      const next = profileFromUser(remote, "");
      setProfile({ ...next, name: next.name || user.displayName || "" });
      setProfileReady(true);
    })();
    return () => {
      active = false;
    };
  }, [authReady, user, profileReloadToken]);

  const persistProfile = async (): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) {
      throw new Error("Please log in first (Google or phone), then save your profile.");
    }
    await saveConnectProfile(
      currentUser.uid,
      profile,
      currentUser.photoURL || "",
      currentUser.email || "",
      profilePhone.trim() || currentUser.phoneNumber || "",
    );
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
    if (profilePhone.trim() && !/^\+?[0-9\s-]{7,17}$/.test(profilePhone.trim())) {
      return "Please enter a valid phone number, e.g. +91 98765 43210.";
    }
    const verifiedPhone = auth.currentUser?.phoneNumber || "";
    if (profilePhone.trim() && profilePhone.trim() !== verifiedPhone) {
      return "This phone number can't be saved because it isn't verified on your account. Leave the phone field blank, or sign in with that phone number first.";
    }
    return "";
  };

  const handleLogout = async (): Promise<void> => {
    setLoggingOut(true);
    try {
      await logOut();
    } catch {
      setSaveError("Could not sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
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
      const code =
        typeof (error as { code?: unknown })?.code === "string"
          ? ((error as { code?: string }).code as string)
          : "";
      if (import.meta.env.DEV) {
        console.error("[Profile] Save failed", {
          code: code || "unknown",
          message: error instanceof Error ? error.message : String(error),
          error,
        });
      }
      if (code === "permission-denied") {
        setSaveError(
          "Your account doesn't have permission to save this. Please sign in again; if it keeps happening, the database rules need updating.",
        );
      } else if (code === "unavailable") {
        setSaveError("The database is temporarily unavailable. Check your connection and try again.");
      } else if (code === "unauthenticated" || code === "auth/no-current-user") {
        setSaveError("Please log in first (Google or phone), then save your profile.");
      } else if (code === "not-found") {
        setSaveError("Your profile document was not found. Please refresh and try again.");
      } else {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "An unexpected Firebase error occurred.";
        setSaveError(`Could not save your profile${code ? ` (${code})` : ""}: ${message}`);
      }
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
    <nav
      className="gradivo-nav"
      style={{
        ...styles.nav,
        ...(page === "home" ? { position: "absolute", top: 0, left: 0, width: "100%", boxSizing: "border-box" } : {}),
        ...(introVisible && authReady ? { zIndex: 2001, opacity: 1, pointerEvents: "auto", transform: "none" } : {}),
      }}
    >
      <div className="gradivo-nav-inner" style={styles.navInner}>
        <div className="gradivo-brand" style={styles.logo} onClick={() => navigate("home")}>
         <div style={styles.logoMark}>
  <img
    src="/gradivo-logo.png"
    alt=""
    style={{ width: "100%", height: "100%", objectFit: "contain" }}
  />
</div>
          <span className="gradivo-brand-name">Gradivo</span>
        </div>

        <div style={styles.navLinks}>
          <div className="desktop-nav">
            {(
              [
                ["Home", "home"],
                ["Learn", "learn"],
                ["Roadmaps", "roadmap"],
                ["Opportunities", "opportunities"],
                ["Projects", "community"],
                ["Connect", "connect"],
              ] as const
            ).map(([label, value]) => (
              <button
                key={value}
                className={`menu-item${page === value ? " is-active" : ""}`}
                aria-current={page === value ? "page" : undefined}
                onClick={() => navigate(value)}
                style={{
                  ...styles.navButton,
                  color: page === value ? "white" : colors.muted,
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
            {authReady && user ? (
              <UserAvatar photoURL={user.photoURL} name={user.displayName || user.email} size={26} />
            ) : (
              <User size={17} />
            )}
            {authReady && user ? "Profile" : "Log in"}
          </button>

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
            ["Learn", "learn"],
            ["Roadmaps", "roadmap"],
            ["Opportunities", "opportunities"],
            ["Projects", "community"],
            ["Connect", "connect"],
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
        navigate(dest.page);
      }}
    />
  );

  const renderLearn = () => {
    if (!selectedLearnTopic || !SKILLS[selectedLearnTopic]) {
      return (
        <LearnDiscovery
          onOpenTopic={(id) => openLearnTopic(id)}
          onOpenRoadmap={openCareerRoadmap}
          profileGoal={profile.goal}
          uid={user?.uid ?? null}
          onNavigate={(dest) => navigate(dest)}
        />
      );
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

  const renderOpportunities = () => <NoticesPage />;

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

        {!authReady || !profileReady ? (
          <div style={{ ...styles.card, maxWidth: 760, marginTop: 32 }} role="status">
            <div style={{ color: colors.muted, fontSize: 14 }}>Loading your profile…</div>
          </div>
        ) : !user ? (
          <div style={{ ...styles.card, maxWidth: 760, marginTop: 32 }}>
            <div style={{ fontWeight: 750, fontSize: 18, marginBottom: 8 }}>Profile</div>
            <p style={{ color: colors.muted, fontSize: 14, margin: "0 0 14px" }}>
              Log in to view and edit your Gradivo profile.
            </p>
            <button type="button" style={styles.primary} onClick={() => navigate("login")}>
              Go to login
            </button>
          </div>
        ) : (
          <div style={{ ...styles.card, maxWidth: 760, marginTop: 32 }}>
            <ProfileDetailsForm
              colors={colors}
              profile={profile}
              setProfile={setProfile}
              phone={profilePhone}
              onPhoneChange={setProfilePhone}
              email={user.email || ""}
              verifiedSenior={verifiedSenior}
              account={{
                photoURL: user.photoURL || "",
                email: user.email || "",
                providers: user.providerData.map((info) => info.providerId).filter(Boolean),
                memberSince,
                onLogout: handleLogout,
                loggingOut,
              }}
            />
            {profileLoadError ? (
              <div role="alert" style={{ color: "#fca5a5", marginTop: 14, fontSize: 13 }}>
                <div>{profileLoadError}</div>
                <button
                  type="button"
                  onClick={() => setProfileReloadToken((token) => token + 1)}
                  style={{
                    ...styles.primary,
                    marginTop: 10,
                    padding: "9px 14px",
                    fontSize: 13,
                  }}
                >
                  Try again
                </button>
              </div>
            ) : null}
            {saveError ? (
              <div role="alert" style={{ color: "#fca5a5", marginTop: 14, fontSize: 13 }}>
                {saveError}
              </div>
            ) : null}
            {saveSuccess ? (
              <div role="status" style={{ color: "#6ee7b7", marginTop: 14, fontSize: 13 }}>
                Profile saved successfully!
              </div>
            ) : null}
            <button
              type="button"
              style={{ ...styles.primary, marginTop: 22, opacity: saving ? 0.7 : 1 }}
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}
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
        const continueAfterAuth = () => navigate(postLoginPage);
        return <AuthPage mode={mode} colors={colors} onModeChange={openAuthMode} onSuccess={continueAfterAuth} onAuthenticated={continueAfterAuth} />;
      }
      case "roadmap":
        return <StudentRoadmap />;
      case "learn":
        return renderLearn();
      case "careers":
        return renderCareers();
      case "opportunities":
        return renderOpportunities();
      case "community":
        return <CommunityPage />;
      case "connect":
        return <ConnectPage />;
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
        {BRAND_NAME}
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
      © 2026 {BRAND_NAME}. All rights reserved.
    </div>
  </div>
  <div className="footer-giant" aria-hidden="true">
    {BRAND_NAME_UPPER}
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
                <div>{profileLoadError}</div>
                <button
                  type="button"
                  onClick={() => setProfileReloadToken((token) => token + 1)}
                  style={{
                    ...styles.primary,
                    marginTop: 10,
                    padding: "9px 14px",
                    fontSize: 13,
                  }}
                >
                  Try again
                </button>
              </div>
            ) : null}
            <ProfileDetailsForm
              colors={colors}
              profile={profile}
              setProfile={setProfile}
              phone={profilePhone}
              onPhoneChange={setProfilePhone}
              email={user?.email || ""}
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
