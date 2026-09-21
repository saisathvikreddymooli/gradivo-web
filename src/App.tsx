import { useEffect, useState } from "react";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Code2,
  Compass,
  Lightbulb,
  Menu,
  Map,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Target,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import gradivoLogo from "./assets/gradivoweb-logo.png";
import ProfileAuth from "./components/ProfileAuth";
import StudentRoadmap from "./components/StudentRoadmap";
import ConnectPage from "./connect/ConnectPage";
import NoticesPage from "./notices/NoticesPage";
import OpportunityAlert from "./notices/OpportunityAlert";
import ConnectProfileFields from "./connect/ConnectProfileFields";
import { DEFAULT_COUNTRY } from "./connect/constants";
import { loadUser, profileFromUser, saveConnectProfile } from "./connect/api";
import type { AppStudentProfile } from "./connect/types";
import { auth } from "./firebase/config";


type Page =
  | "home"
  | "profile"
  | "roadmap"
  | "learn"
  | "careers"
  | "opportunities"
  | "connect";

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

const learningTracks = [
  {
    title: "Programming Basics",
    icon: <Code2 size={24} />,
    level: "Beginner",
    topics: ["Variables", "Conditions", "Loops", "Functions", "Arrays"],
  },
  {
    title: "Web Development",
    icon: <Briefcase size={24} />,
    level: "Beginner → Intermediate",
    topics: ["HTML", "CSS", "JavaScript", "React", "APIs"],
  },
  {
    title: "Cybersecurity Basics",
    icon: <Shield size={24} />,
    level: "Beginner",
    topics: ["Linux", "Networking", "Web Security", "OWASP", "Security Tools"],
  },
  {
    title: "AI & Python",
    icon: <Sparkles size={24} />,
    level: "Beginner → Intermediate",
    topics: ["Python", "NumPy", "Pandas", "ML Basics", "AI Projects"],
  },
];

function App() {
  const [theme] = useState<"light" | "dark" | "system">("system");

const isDark =
  theme === "dark" ||
  (theme === "system" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches);
const colors = {
  bg: isDark ? "#070706" : "#f8f7ff",
  card: isDark ? "#101016" : "#ffffff",
  card2: isDark ? "#15151d" : "#f1efff",
  border: isDark ? "#272733" : "#ddd6fe",
  purple: "#8b5cf6",
  purple2: "#a78bfa",
  text: isDark ? "#f5f3ff" : "#18181b",
  muted: isDark ? "#a1a1aa" : "#71717a",
};


  const [page, setPage] = useState<Page>("home");
  
  const [mobileMenu, setMobileMenu] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [profile, setProfile] = useState<AppStudentProfile>(initialProfile);
  const [verifiedSenior, setVerifiedSenior] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeCareer, setActiveCareer] = useState<number | null>(null);
  /** True once the Firestore profile check has resolved for the current auth state. */
  const [profileReady, setProfileReady] = useState(false);
  /** True when users/{uid} exists with a saved name. */
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  /** Modal mode: edit the form, or view saved info. */
  const [editing, setEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  /** Opening intro: shown only on initial website load, never on page changes. */
  const [introVisible, setIntroVisible] = useState(true);
  const [introFading, setIntroFading] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const fadeTimer = window.setTimeout(() => setIntroFading(true), 1700);
    const hideTimer = window.setTimeout(() => {
      setIntroVisible(false);
      document.body.style.overflow = previousOverflow;
    }, 2100);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const openProfile = () => {
    setEditing(!hasSavedProfile);
    setSaveError("");
    setSaveSuccess(false);
    setSaving(false);
    setShowProfile(true);
  };

  const navigate = (newPage: Page) => {
    setPage(newPage);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Logged out: clear any previous user's profile so the next login
        // starts clean and always loads from Firestore.
        setProfile(initialProfile);
        setVerifiedSenior(false);
        setHasSavedProfile(false);
        setProfileReady(true);
        return;
      }
      setProfileReady(false);
      let remote = null;
      try {
        remote = await loadUser(user.uid);
      } catch (err) {
        console.error("Could not load profile:", err);
      }
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
      setHasSavedProfile(Boolean(remote.name));
      const next = profileFromUser(remote, "");
      setProfile({
        ...next,
        name: next.name || user.displayName || "",
      });
      setProfileReady(true);
    });
  }, []);

  const persistProfile = async (): Promise<boolean> => {
    try {
      await saveProfileNameToAccount();
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      await saveConnectProfile(
        currentUser.uid,
        profile,
        currentUser.photoURL || "",
        currentUser.email || "",
        currentUser.phoneNumber || "",
      );
      setHasSavedProfile(Boolean(profile.name.trim()));
      return true;
    } catch (err) {
      console.error("Could not save profile:", err);
      return false;
    }
  };

  const validateProfile = (): string => {
    if (!profile.name.trim()) return "Please enter your name.";
    return "";
  };

  const handleSaveProfile = async () => {
    const validationError = validateProfile();
    if (validationError) {
      setSaveError(validationError);
      setSaveSuccess(false);
      return;
    }
    if (!auth.currentUser) {
      setSaveError("Please log in first (Google or phone), then save your profile.");
      setSaveSuccess(false);
      return;
    }
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    const ok = await persistProfile();
    setSaving(false);
    if (ok) {
      setSaveSuccess(true);
    } else {
      setSaveError("Could not save your profile. Check your connection and try again.");
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
    connect: "Connect. Ask. Learn. Grow.",
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
      background: "rgba(7,7,11,0.88)",
      backdropFilter: "blur(18px)",
      borderBottom: `1px solid ${colors.border}`,
    } as React.CSSProperties,

    navInner: {
      width: "100%",
      maxWidth: "none",
      margin: 0,
      padding: "18px clamp(20px, 4vw, 60px)",
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
      background: `linear-gradient(135deg, ${colors.purple}, #5b21b6)`,
      display: "grid",
      placeItems: "center",
      boxShadow: "0 0 25px rgba(139,92,246,.3)",
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
      boxShadow: "0 8px 30px rgba(139,92,246,.2)",
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
      border: "1px solid rgba(139,92,246,.35)",
      background: "rgba(139,92,246,.1)",
      color: colors.purple2,
      fontSize: 13,
      fontWeight: 600,
    } as React.CSSProperties,
  };

  const renderNavbar = () => (
    <nav style={styles.nav}>
      <div style={styles.navInner}>
        <div style={styles.logo} onClick={() => navigate("home")}>
         <div style={styles.logoMark}>
  <img
    src={gradivoLogo}
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
                ["Connect", "connect"],
                ["Roadmap", "roadmap"],
                ["Learn", "learn"],
                ["Careers", "careers"],
                ["Opportunities", "opportunities"],
              ] as const
            ).map(([label, value]) => (
              <button
                key={value}
                className="menu-item"
                onClick={() => navigate(value)}
                style={{
                  ...styles.navButton,
                  color: page === value ? "white" : colors.muted,
                  background: page === value ? "rgba(139,92,246,.18)" : "transparent",
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

          <button
            className="mobile-menu-button"
            style={{
              border: `1px solid ${colors.border}`,
              background: colors.card,
              color: "white",
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
            ["Connect", "connect"],
            ["Roadmap", "roadmap"],
            ["Learn", "learn"],
            ["Careers", "careers"],
            ["Opportunities", "opportunities"],
          ].map(([label, value]) => (
            <button
  className="menu-item"
  key={value}
  onClick={() => navigate(value as Page)}
  onMouseEnter={() => setHoveredMenu(value)}
  onMouseLeave={() => setHoveredMenu(null)}
  style={{
    ...styles.navButton,
    textAlign: "left",
    background:
      hoveredMenu === value ? "#8b5cf6" : colors.card,
    color:
      hoveredMenu === value ? "white" : colors.muted,
    boxShadow:
      hoveredMenu === value
        ? "0 0 18px rgba(139, 92, 246, 0.7)"
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
    <>
    
      <section
        style={{
          minHeight: "calc(100vh - 75px)",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            background: "rgba(124,58,237,.16)",
            filter: "blur(120px)",
            borderRadius: "50%",
            top: -180,
            right: -120,
          }}
        />

        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            background: "rgba(139,92,246,.08)",
            filter: "blur(100px)",
            borderRadius: "50%",
            bottom: -200,
            left: -150,
          }}
        />

        <div
          style={{
            ...styles.container,
            width: "100%",
            display: "flex",
            gap: 28,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: "1 1 560px", minWidth: 0, maxWidth: 850 }}>
            <div style={styles.badge}>
              <Sparkles size={15} />
              Student Guidance Platform
            </div>

            <h1
              style={{
                fontSize: "clamp(48px, 8vw, 88px)",
                lineHeight: 0.98,
                letterSpacing: "-4px",
                margin: "24px 0",
                fontWeight: 850,
              }}
            >
              Stop wondering.
              <br />
              <span
                style={{
                  background: `linear-gradient(90deg, ${colors.purple2}, #c4b5fd)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Start building.
              </span>
            </h1>

            <p
              style={{
                fontSize: 20,
                lineHeight: 1.7,
                color: colors.muted,
                maxWidth: "100%",
              }}
            >
              Gradivo helps students understand what to learn, which career
              paths exist, what skills they need, and what they can do next.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 32,
                flexWrap: "wrap",
              }}
            >
              <button style={styles.primary} onClick={() => navigate("roadmap")}>
                Build My Roadmap
                <ArrowRight size={18} />
              </button>

              <button
                style={{
                  ...styles.navButton,
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: "white",
                  padding: "12px 18px",
                }}
                onClick={() => navigate("careers")}
              >
                Explore Careers
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: 30,
                marginTop: 55,
                flexWrap: "wrap",
              }}
            >
              {[
                ["01", "Know yourself"],
                ["02", "Choose a direction"],
                ["03", "Build skills"],
                ["04", "Find opportunities"],
              ].map(([num, text]) => (
                <div key={num}>
                  <div
                    style={{
                      color: colors.purple2,
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    {num}
                  </div>
                  <div style={{ marginTop: 5, fontSize: 14 }}>{text}</div>
                </div>
              ))}
            </div>
          </div>

          <OpportunityAlert
            colors={colors}
            city={profile.city}
            state={profile.state}
            onView={() => navigate("opportunities")}
          />
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.container}>
          <div style={{ textAlign: "center", maxWidth: "100%", margin: "0 auto 55px" }}>
            <div style={styles.badge}>Everything in one place</div>
            <h2
              style={{
                fontSize: "clamp(32px,5vw,54px)",
                margin: "18px 0 12px",
                letterSpacing: "-2px",
              }}
            >
              What do you need help with?
            </h2>
            <p style={{ ...styles.muted, lineHeight: 1.7 }}>
              Choose where you are stuck and Gradivo gives you a clear next
              step.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
              gap: 16,
            }}
          >
            {[
              {
                title: "Connect",
                text: "Meet students and seniors across India.",
                icon: <Users />,
                page: "connect" as Page,
              },
              {
                title: "What to Learn",
                text: "Discover skills and learning tracks.",
                icon: <Lightbulb />,
                page: "learn" as Page,
              },
              {
                title: "Career Paths",
                text: "Explore technology career directions.",
                icon: <Compass />,
                page: "careers" as Page,
              },
              {
                title: "My Roadmap",
                text: "Turn your goals into steps.",
                icon: <Map />,
                page: "roadmap" as Page,
              },
              {
                title: "Opportunities",
                text: "Find real internships and hackathons relevant to you.",
                icon: <Rocket />,
                page: "opportunities" as Page,
              },
            ].map((item) => (
              <button
                key={item.title}
                onClick={() => navigate(item.page)}
                style={{
                  ...styles.card,
                  cursor: "pointer",
                  textAlign: "left",
                  color: "white",
                  transition: "transform .2s,border .2s",
                  minHeight: 190,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.borderColor = colors.purple;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 15,
                    background: "rgba(139,92,246,.12)",
                    color: colors.purple2,
                    marginBottom: 28,
                  }}
                >
                  {item.icon}
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 750,
                    marginBottom: 8,
                  }}
                >
                  {item.title}
                </div>

                <div style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>
                  {item.text}
                </div>

                <div
                  style={{
                    marginTop: 20,
                    color: colors.purple2,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  Explore <ChevronRight size={15} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.container}>
          <div
            style={{
              ...styles.card,
              padding: "45px 35px",
              background:
                "linear-gradient(135deg, rgba(139,92,246,.14), rgba(16,16,22,.9))",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) auto",
                gap: 30,
                alignItems: "center",
              }}
            >
              <div>
                <div style={styles.badge}>Personalized journey</div>
                <h2 style={{ fontSize: 36, margin: "18px 0 10px" }}>
                  Not sure where to start?
                </h2>
                <p style={{ ...styles.muted, lineHeight: 1.7 }}>
                  Create your student profile and use it to understand your
                  current level, interests, goals and next steps.
                </p>
              </div>

              <button
                style={styles.primary}
                onClick={openProfile}
              >
                Create Profile
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>
      
    </>
  );

  const renderRoadmap = () => (
    <StudentRoadmap
      profile={profile}
      colors={colors}
      onBack={() => navigate("home")}
      onOpenProfile={openProfile}
      classicSteps={roadmapSteps}
    />
  );

  const renderLearn = () => (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.badge}>
          <BookOpen size={15} />
          Learning Tracks
        </div>

        <h1 style={{ fontSize: 52, letterSpacing: "-2px", margin: "18px 0 12px" }}>
          What should you learn?
        </h1>

        <p style={{ ...styles.muted, fontSize: 18, maxWidth: 700, lineHeight: 1.7 }}>
          Start with fundamentals, then choose skills based on the direction
          you want to explore.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
            gap: 18,
            marginTop: 45,
          }}
        >
          {learningTracks.map((track) => (
            <div key={track.title} style={styles.card}>
              <div style={{ color: colors.purple2 }}>{track.icon}</div>

              <h3 style={{ fontSize: 20, margin: "20px 0 8px" }}>
                {track.title}
              </h3>

              <div
                style={{
                  color: colors.purple2,
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 20,
                }}
              >
                {track.level}
              </div>

              <div style={{ display: "grid", gap: 11 }}>
                {track.topics.map((topic) => (
                  <div
                    key={topic}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      color: colors.muted,
                      fontSize: 14,
                    }}
                  >
                    <CheckCircle2 size={15} color={colors.purple2} />
                    {topic}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            ...styles.card,
            marginTop: 25,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 7px" }}>Don't learn randomly.</h3>
            <p style={{ margin: 0, ...styles.muted }}>
              Connect what you learn to a project and a career direction.
            </p>
          </div>

          <button style={styles.primary} onClick={() => navigate("careers")}>
            Explore Careers <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>

  );

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
                          background: "rgba(139,92,246,.1)",
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
    <NoticesPage colors={colors} profileCity={profile.city} profileState={profile.state} />
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
                        ? "rgba(139,92,246,.15)"
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
              setShowProfile(false);
              const ok = await persistProfile();
              if (ok) navigate("roadmap");
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
      case "roadmap":
        return renderRoadmap();
      case "learn":
        return renderLearn();
      case "careers":
        return renderCareers();
      case "opportunities":
        return renderOpportunities();
      case "connect":
        return (
          <ConnectPage
            colors={colors}
            profile={profile}
            setProfile={setProfile}
            onOpenProfile={openProfile}
          />
        );
      default:
        return renderHome();
    }
  };

  return (
    <div style={styles.app}>
      {renderNavbar()}

      <main aria-label={pageTitle}>{renderPage()}</main>

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
              border: "1px solid rgba(139,92,246,.35)",
              background: "rgba(139,92,246,.1)",
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
</footer>

     
      {showProfile && (
        <div
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
                  color: "white",
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
                          ? "rgba(139,92,246,.15)"
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

      {introVisible && (
        <div
          aria-hidden="true"
          className="gradivo-intro"
          style={{ opacity: introFading ? 0 : 1 }}
        >
          <div className="gradivo-intro-inner">
            <img
              src={gradivoLogo}
              alt=""
              className="gradivo-intro-logo"
              draggable={false}
            />
            <div className="gradivo-intro-word">
              {"GRADIVO".split("").map((letter, index) => (
                <span key={index} className="gradivo-intro-mask">
                  <span
                    className="gradivo-intro-letter"
                    style={{ animationDelay: `${0.6 + index * 0.07}s` }}
                  >
                    {letter}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

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
          background: rgba(139, 92, 246, 0.18);
          box-shadow: 0 0 18px rgba(139, 92, 246, 0.45);
          opacity: 1;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .gradivo-intro {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          z-index: 200;
          background: #000;
          display: grid;
          place-items: center;
          transition: opacity 0.4s ease;
        }

        .gradivo-intro-inner {
          display: flex;
          align-items: center;
          gap: clamp(10px, 2vw, 18px);
        }

        .gradivo-intro-logo {
          display: block;
          width: clamp(72px, 10vw, 110px);
          height: auto;
          border: none;
          mix-blend-mode: screen;
          opacity: 0;
          transform: scale(0.94);
          animation: gradivo-intro-logo-in 0.8s ease forwards;
          animation-delay: 0.1s;
        }

        @keyframes gradivo-intro-logo-in {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .gradivo-intro-word {
          display: flex;
          align-items: center;
          font-weight: 800;
          font-size: clamp(30px, 5vw, 54px);
          letter-spacing: clamp(2px, 0.5vw, 6px);
          line-height: 1;
          color: #f5f3ff;
        }

        .gradivo-intro-mask {
          display: inline-block;
          overflow: hidden;
          padding-bottom: 0.08em;
          margin-bottom: -0.08em;
        }

        .gradivo-intro-letter {
          display: inline-block;
          transform: translateY(115%);
          opacity: 0;
          animation: gradivo-intro-letter-up 0.5s cubic-bezier(0.22, 0.8, 0.3, 1) forwards;
        }

        @keyframes gradivo-intro-letter-up {
          0% {
            transform: translateY(115%);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .gradivo-intro {
            transition: none;
          }
          .gradivo-intro-logo,
          .gradivo-intro-letter {
            animation: none;
            opacity: 1;
            transform: none;
          }
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

const fieldLabel: React.CSSProperties = {
  display: "grid",
  gap: 8,
  color: "#d4d4d8",
  fontSize: 13,
  fontWeight: 650,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 13px",
  borderRadius: 9,
  border: "1px solid #272733",
  background: "#0b0b10",
  color: "#f5f3ff",
  outline: "none",
  fontSize: 14,
};

export default App;