import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import {
  ArrowLeft,
  BadgeCheck,
  MoreVertical,
  Search,
  Send,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { auth } from "../firebase/config";
import { useAuth } from "../auth/useAuth";
import ProfileAuth from "../components/ProfileAuth";
import ConnectGlobe from "./ConnectGlobe";
import {
  addGroupMembers,
  blockUser,
  createGroup,
  createProjectRequest,
  ensureDefaultGroups,
  ensureUserDocument,
  hideConversation,
  isSeniorAccount,
  joinGroup,
  leaveGroup,
  listenConversations,
  listenGroupMembers,
  listenGroupMessages,
  listenGroups,
  listenMessages,
  listenMyGroupIds,
  listenOutgoingBlocks,
  listenProjects,
  listenUser,
  listenUsers,
  markConversationRead,
  openConversation,
  removeGroupMember,
  reportUser,
  sendDirectMessage,
  sendGroupMessage,
  setUserPresence,
  unblockUser,
} from "./api";
import {
  BRANCH_EXAMPLES,
  COUNTRIES,
  DEFAULT_COUNTRY,
  INDIAN_STATES,
  REPORT_REASONS,
  SENIOR_HELP_AREAS,
  YEARS,
} from "./constants";
import type {
  AppStudentProfile,
  ChatMessage,
  ConnectGroup,
  ConnectTab,
  ConnectUser,
  Conversation,
  ProjectRequest,
  ThemeColors,
} from "./types";

type Props = {
  colors: ThemeColors;
  profile: AppStudentProfile;
  setProfile: Dispatch<SetStateAction<AppStudentProfile>>;
  onOpenProfile: () => void;
  profileReady: boolean;
  profileLoadError: string;
  initialTab?: ConnectTab;
};

function formatTime(ms: number | null) {
  if (!ms) return "";
  const date = new Date(ms);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function haystack(user: ConnectUser) {
  return [
    user.name,
    user.college,
    user.branch,
    user.year,
    user.state,
    user.city,
    user.country,
    user.bio,
    ...user.skills,
    ...user.interests,
    ...user.helpAreas,
  ]
    .join(" ")
    .toLowerCase();
}

function Avatar({
  user,
  size = 44,
}: {
  user: Pick<ConnectUser, "name" | "photoURL"> | null;
  size?: number;
}) {
  const letter = (user?.name || "G").slice(0, 1).toUpperCase();
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      className="connect-empty-state avatar-letter"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(59,130,246,.18)",
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}

function EmptyState({
  title,
  text,
  colors,
}: {
  title: string;
  text: string;
  colors: ThemeColors;
}) {
  return (
    <div
      style={{
        border: `1px dashed ${colors.border}`,
        background: "rgba(59,130,246,.06)",
        borderRadius: 18,
        padding: "36px 22px",
        textAlign: "center",
      }}
    >
      <div className="empty-state-icon" aria-hidden="true">
        {title.toLowerCase().includes("loading") ? <span className="gradivo-spinner" /> : <span>✦</span>}
      </div>
      <div style={{ fontWeight: 750, fontSize: 18, marginBottom: 8 }}>{title}</div>
      <div style={{ color: colors.muted, lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}

export default function ConnectPage({ colors, profile, setProfile, onOpenProfile, profileReady, profileLoadError, initialTab = "discover" }: Props) {
  const { user: firebaseUser } = useAuth();
  const [me, setMe] = useState<ConnectUser | null>(null);
  const [people, setPeople] = useState<ConnectUser[]>([]);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<ConnectTab>(initialTab);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [state, setState] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [skill, setSkill] = useState("");
  const [interest, setInterest] = useState("");
  const [helpArea, setHelpArea] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [groups, setGroups] = useState<ConnectGroup[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [groupDraft, setGroupDraft] = useState("");
  const [projects, setProjects] = useState<ProjectRequest[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [joining, setJoining] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportText, setReportText] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatQuery, setNewChatQuery] = useState("");
  const [projectOpen, setProjectOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupType, setGroupType] = useState<"public" | "private">("public");
  const [memberQuery, setMemberQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [addMemberQuery, setAddMemberQuery] = useState("");
  const [managingMembers, setManagingMembers] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width: 800px)").matches : false,
  );
  const [projectForm, setProjectForm] = useState({
    projectName: "",
    description: "",
    technologies: "",
    requiredSkills: "",
    teamSize: 2,
    college: profile.college,
    state: profile.state,
    deadline: "",
  });
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const onChange = () => setIsMobile(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setMe(null);
      setDataReady(false);
      return;
    }
    setDataReady(false);
    let stopPresence = false;
    ensureUserDocument(firebaseUser, profileRef.current)
      .then((user) => {
        if (!stopPresence) {
          setMe(user);
          setDataReady(true);
        }
      })
      .catch((err) => {
        if (!stopPresence) {
          setDataReady(true);
          setError(err instanceof Error ? err.message : "Could not load profile.");
        }
      });
    ensureDefaultGroups().catch(() => undefined);
    const unsub = listenUser(firebaseUser.uid, (user) => {
      if (user) {
        setMe(user);
        setProfile((current) => ({
          ...current,
          name: user.name || current.name,
          branch: user.branch || current.branch,
          year: user.year || current.year,
          interests: user.interests.length ? user.interests : current.interests,
          goal: user.goal || current.goal,
          college: user.college || current.college,
          country: user.country || current.country,
          state: user.state || current.state,
          city: user.city || current.city,
          skills: user.skills.length ? user.skills : current.skills,
          bio: user.bio || current.bio,
          isSenior: user.isSenior,
          helpAreas: user.helpAreas.length ? user.helpAreas : current.helpAreas,
        }));
      }
    });
    const ping = window.setInterval(() => {
      setUserPresence(firebaseUser.uid, true).catch(() => undefined);
    }, 45000);
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        setUserPresence(firebaseUser.uid, false).catch(() => undefined);
      } else {
        setUserPresence(firebaseUser.uid, true).catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      stopPresence = true;
      unsub();
      window.clearInterval(ping);
      document.removeEventListener("visibilitychange", onHide);
      setUserPresence(firebaseUser.uid, false).catch(() => undefined);
    };
  }, [firebaseUser, setProfile]);

  useEffect(() => {
    if (!firebaseUser) {
      setProjectsLoading(false);
      return;
    }
    setProjectsLoading(true);
    const unsubs = [
      listenUsers(setPeople),
      listenOutgoingBlocks(firebaseUser.uid, setBlocked),
      listenConversations(firebaseUser.uid, setConversations),
      listenGroups(setGroups),
      listenMyGroupIds(firebaseUser.uid, setJoined),
      listenProjects((items) => {
        setProjects(items);
        setProjectsLoading(false);
      }, (err) => {
        setProjectsLoading(false);
        setError(`Could not load project requests: ${err.message}`);
      }),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [firebaseUser]);

  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      return;
    }
    return listenMessages(activeConv, setMessages);
  }, [activeConv]);

  useEffect(() => {
    if (!activeConv || !firebaseUser || messages.length === 0) return;
    markConversationRead(activeConv, firebaseUser.uid, messages).catch(() => undefined);
  }, [activeConv, firebaseUser, messages]);

  useEffect(() => {
    if (!activeGroup) {
      setGroupMessages([]);
      setGroupMembers([]);
      return;
    }
    const a = listenGroupMessages(activeGroup, setGroupMessages);
    const b = listenGroupMembers(activeGroup, setGroupMembers);
    return () => {
      a();
      b();
    };
  }, [activeGroup]);

  const peopleMap = useMemo(() => {
    const map = new Map<string, ConnectUser>();
    people.forEach((user) => map.set(user.id, user));
    return map;
  }, [people]);

  const visiblePeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((user) => {
      if (!firebaseUser || user.id === firebaseUser.uid) return false;
      if (blocked.has(user.id)) return false;
      if (country && user.country && user.country !== country) return false;
      if (state && user.state !== state) return false;
      if (college && !user.college.toLowerCase().includes(college.toLowerCase())) return false;
      if (branch && user.branch.toLowerCase() !== branch.toLowerCase()) return false;
      if (year && user.year !== year) return false;
      if (skill && !user.skills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
        return false;
      }
      if (interest && !user.interests.some((item) => item.toLowerCase().includes(interest.toLowerCase()))) {
        return false;
      }
      if (q && !haystack(user).includes(q)) return false;
      return true;
    });
  }, [people, firebaseUser, blocked, country, state, college, branch, year, skill, interest, search]);

  const seniors = useMemo(
    () =>
      visiblePeople.filter(
        (user) =>
          isSeniorAccount(user) &&
          (!helpArea || user.helpAreas.includes(helpArea)),
      ),
    [visiblePeople, helpArea],
  );

  const myUid = firebaseUser?.uid ?? "";
  const isGroupMember = (group: ConnectGroup) =>
    Boolean(myUid) && (group.members.includes(myUid) || joined.has(group.id));

  const myGroups = useMemo(
    () => groups.filter((group) => isGroupMember(group)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups, joined, myUid],
  );

  const findGroups = useMemo(
    () =>
      groups.filter(
        (group) => group.type === "public" && !isGroupMember(group),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups, joined, myUid],
  );

  /** Registered users available to add (excludes self and blocked). */
  const memberCandidates = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    return people.filter((user) => {
      if (!firebaseUser || user.id === firebaseUser.uid) return false;
      if (blocked.has(user.id)) return false;
      if (selectedMembers.includes(user.id)) return false;
      if (q && !haystack(user).includes(q)) return false;
      return true;
    });
  }, [people, firebaseUser, blocked, memberQuery, selectedMembers]);

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 10,
    border: `1px solid ${colors.inputBorder}`,
    background: colors.card2,
    color: colors.text,
    outline: "none",
    fontSize: 14,
  };
  const card: CSSProperties = {
    background: colors.panel,
    border: `1px solid ${colors.border}`,
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 0 28px rgba(59,130,246,.08)",
    backdropFilter: "blur(12px)",
    textAlign: "left",
  };
  const primary: CSSProperties = {
    border: "none",
    background: colors.purple,
    color: "white",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 8px 30px rgba(59,130,246,.2)",
  };
  const ghost: CSSProperties = {
    border: `1px solid ${colors.border}`,
    background: colors.card2,
    color: colors.text,
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 650,
  };

  async function startChat(otherId: string, preset?: string) {
    if (!firebaseUser) return;
    try {
      const id = await openConversation(firebaseUser.uid, otherId);
      setActiveConv(id);
      setTab("messages");
      setNewChatOpen(false);
      if (preset) setDraft(preset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a conversation.");
    }
  }

  async function sendChat(event?: FormEvent) {
    event?.preventDefault();
    if (!firebaseUser || !activeConv || !draft.trim()) return;
    const other = activeConv.split("_").find((id) => id !== firebaseUser.uid);
    if (!other) return;
    const text = draft;
    setDraft("");
    try {
      await sendDirectMessage(activeConv, firebaseUser.uid, other, text);
    } catch (err) {
      setDraft(text);
      setError(err instanceof Error ? err.message : "Message failed.");
    }
  }

  async function sendGroup(event?: FormEvent) {
    event?.preventDefault();
    if (!firebaseUser || !activeGroup || !groupDraft.trim()) return;
    const text = groupDraft;
    setGroupDraft("");
    try {
      await sendGroupMessage(activeGroup, firebaseUser.uid, text);
    } catch (err) {
      setGroupDraft(text);
      setError(err instanceof Error ? err.message : "Could not send group message. Join the group first.");
    }
  }

  const otherId = activeConv && firebaseUser
    ? activeConv.split("_").find((id) => id !== firebaseUser.uid) ?? null
    : null;
  const otherUser = otherId ? peopleMap.get(otherId) ?? null : null;
  const activeGroupData = groups.find((item) => item.id === activeGroup) ?? null;
  const lastMine = [...messages].reverse().find((item) => item.senderId === firebaseUser?.uid);
  const seen = Boolean(lastMine && otherId && lastMine.readBy.includes(otherId));
  const amGroupAdmin = Boolean(
    activeGroupData &&
      firebaseUser &&
      (activeGroupData.admins.includes(firebaseUser.uid) ||
        activeGroupData.createdBy === firebaseUser.uid),
  );
  const amGroupMember = Boolean(activeGroupData && isGroupMember(activeGroupData));
  /** Members for the open group: members array first, subcollection ids as fallback. */
  const activeMemberIds =
    activeGroupData && activeGroupData.members.length
      ? activeGroupData.members
      : groupMembers;
  const activeCreator =
    (activeGroupData && peopleMap.get(activeGroupData.createdBy)) ?? null;
  const addableMembers = (activeGroupData
    ? people.filter((user) => {
        if (!firebaseUser || user.id === firebaseUser.uid) return false;
        if (blocked.has(user.id)) return false;
        if (activeMemberIds.includes(user.id)) return false;
        const q = addMemberQuery.trim().toLowerCase();
        if (q && !haystack(user).includes(q)) return false;
        return true;
      })
    : []
  ).slice(0, 20);

  async function handleCreateGroup(event?: FormEvent) {
    event?.preventDefault();
    if (!firebaseUser || creating) return;
    if (!groupName.trim()) {
      setError("Give your group a name.");
      setSuccess("");
      return;
    }
    if (
      groups.some(
        (group) => group.name.trim().toLowerCase() === groupName.trim().toLowerCase(),
      )
    ) {
      setError("A group with this name already exists. Please choose another name.");
      setSuccess("");
      return;
    }
    setCreating(true);
    try {
      const id = await createGroup(firebaseUser.uid, {
        name: groupName,
        description: groupDesc,
        type: groupType,
        memberIds: selectedMembers,
      });
      const createdName = groupName.trim();
      setCreateOpen(false);
      setGroupName("");
      setGroupDesc("");
      setGroupType("public");
      setMemberQuery("");
      setSelectedMembers([]);
      setActiveGroup(id);
      setError("");
      setSuccess(`"${createdName}" created successfully! You are its admin.`);
    } catch (err) {
      setSuccess("");
      setError(err instanceof Error ? err.message : "Could not create group.");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinGroup(groupId: string) {
    if (!firebaseUser || joining.has(groupId)) return;
    const group = groups.find((item) => item.id === groupId);
    if (group && isGroupMember(group)) {
      // Already a member: no duplicate write, just confirm the state.
      setError("");
      setSuccess(`You are already a member of "${group.name}".`);
      return;
    }
    setJoining((current) => new Set(current).add(groupId));
    try {
      await joinGroup(groupId, firebaseUser.uid);
      setError("");
      setSuccess(group ? `You joined "${group.name}"!` : "You joined the group!");
    } catch (err) {
      setSuccess("");
      setError(
        err instanceof Error
          ? `Could not join${group ? ` "${group.name}"` : ""}: ${err.message}`
          : "Could not join the group.",
      );
    } finally {
      setJoining((current) => {
        const next = new Set(current);
        next.delete(groupId);
        return next;
      });
    }
  }

  async function handleAddMembers(uids: string[]) {
    if (!firebaseUser || !activeGroupData || !uids.length) return;
    setManagingMembers(true);
    try {
      await addGroupMembers(activeGroupData.id, uids);
      setAddMemberQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add members.");
    } finally {
      setManagingMembers(false);
    }
  }

  async function handleRemoveMember(uid: string) {
    if (!firebaseUser || !activeGroupData) return;
    try {
      await removeGroupMember(activeGroupData.id, uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove member.");
    }
  }

  async function handleLeaveGroup() {
    if (!firebaseUser || !activeGroupData) return;
    try {
      await leaveGroup(activeGroupData.id, firebaseUser.uid);
      setActiveGroup(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not leave group.");
    }
  }

  const tabs: { id: ConnectTab; label: string }[] = [
    { id: "discover", label: "Discover" },
    { id: "seniors", label: "Ask Seniors" },
    { id: "groups", label: "Groups" },
    { id: "messages", label: "Messages" },
    { id: "projects", label: "Find Project Teammates" },
  ];

  function FilterGrid() {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
          gap: 10,
        }}
      >
        <select value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle}>
          {COUNTRIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={state} onChange={(e) => setState(e.target.value)} style={inputStyle}>
          <option value="">All states</option>
          {INDIAN_STATES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          placeholder="College"
          style={inputStyle}
        />
        <input
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="Branch"
          list="connect-branches"
          style={inputStyle}
        />
        <select value={year} onChange={(e) => setYear(e.target.value)} style={inputStyle}>
          <option value="">All years</option>
          {YEARS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="Skill"
          style={inputStyle}
        />
        <input
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          placeholder="Interest"
          style={inputStyle}
        />
      </div>
    );
  }

  function StudentCard({
    user,
    senior,
  }: {
    user: ConnectUser;
    senior?: boolean;
  }) {
    return (
      <article style={card}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ position: "relative" }}>
            <Avatar user={user} />
            <span
              title={user.online ? "Online" : "Offline"}
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: user.online ? "#34d399" : "#52525b",
                border: `2px solid ${colors.card}`,
              }}
            />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <strong>{user.name || "Student"}</strong>
              {user.isVerifiedSenior ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    color: colors.purple2,
                    border: "1px solid rgba(59,130,246,.4)",
                    padding: "3px 8px",
                    borderRadius: 999,
                  }}
                >
                  <BadgeCheck size={13} /> Verified Senior
                </span>
              ) : null}
            </div>
            <div style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
              {[user.college, user.branch, user.year].filter(Boolean).join(" · ") || "Profile in progress"}
            </div>
            <div style={{ color: colors.muted, fontSize: 13 }}>
              {[user.city, user.state, user.country].filter(Boolean).join(", ")}
            </div>
          </div>
        </div>
        {user.bio ? (
          <p style={{ color: colors.muted, fontSize: 13, lineHeight: 1.55, margin: "12px 0 0" }}>
            {user.bio}
          </p>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {user.skills.slice(0, 5).map((item) => (
            <span
              key={item}
              style={{
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 999,
                background: "rgba(59,130,246,.12)",
                color: colors.purple2,
              }}
            >
              {item}
            </span>
          ))}
          {user.interests.slice(0, 4).map((item) => (
            <span
              key={`i-${item}`}
              style={{
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 999,
                border: `1px solid ${colors.border}`,
                color: colors.muted,
              }}
            >
              {item}
            </span>
          ))}
        </div>
        {senior && user.helpAreas.length ? (
          <div style={{ color: colors.muted, fontSize: 13, marginTop: 10 }}>
            Can help with: {user.helpAreas.join(", ")}
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <button type="button" style={primary} onClick={() => startChat(user.id)}>
            Message
          </button>
          {senior ? (
            <button
              type="button"
              style={ghost}
              onClick={() =>
                startChat(
                  user.id,
                  `Hi ${user.name.split(" ")[0] || ""}, I would like to ask for guidance.`.trim(),
                )
              }
            >
              Ask for Guidance
            </button>
          ) : null}
        </div>
      </article>
    );
  }

  if (!firebaseUser) {
    return (
      <section className="connect-world-page connect-world-page-auth" style={{ padding: "70px 0" }}>
        <div className="connect-world-content" style={{ width: "100%", maxWidth: "none", margin: 0, padding: "0 clamp(20px, 4vw, 60px)", boxSizing: "border-box" }}>
          <div className="connect-globe-wrap-center">
            <ConnectGlobe />
          </div>
          <div style={{ ...card, maxWidth: 520, margin: "0 auto", padding: 28 }}>
            <div style={{ color: colors.purple2, fontWeight: 700, marginBottom: 8 }}>Connect</div>
            <h1 style={{ marginTop: 0, fontSize: 32, letterSpacing: "-0.8px", lineHeight: 1.2 }}>
              Log in to meet students across India
            </h1>
            <ProfileAuth colors={colors} studentName={profile.name} onSignupComplete={onOpenProfile} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="connect-world-page" style={{ padding: "70px 0 40px", overflowX: "hidden" }}>
      <div className="connect-world-content" style={{ width: "100%", maxWidth: "none", margin: 0, padding: "0 clamp(20px, 4vw, 60px)", boxSizing: "border-box" }}>
        <div
          className="connect-world-hero"
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 24,
            border: `1px solid ${colors.border}`,
            background:
              colors.glowCard,
            padding: "38px 28px",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              right: -60,
              top: -80,
              background: "rgba(59,130,246,.25)",
              filter: "blur(70px)",
              borderRadius: "50%",
            }}
          />
          <div className="connect-hero-grid">
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 12px",
                borderRadius: 999,
                border: "1px solid rgba(59,130,246,.35)",
                color: colors.purple2,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Users size={15} /> Student network
            </div>
            <h1
              style={{
                fontSize: "clamp(32px,6vw,56px)",
                letterSpacing: "-2px",
                margin: "16px 0 10px",
              }}
            >
              Connect. Ask. Learn. Grow.
            </h1>
            <p style={{ color: colors.muted, maxWidth: 640, lineHeight: 1.7, fontSize: 17 }}>
              Meet students and seniors from across India, get guidance, find teammates, and grow
              together.
            </p>
          </div>
          <ConnectGlobe />
          </div>
        </div>

        {error ? (
          <div
            className="connect-toast gradivo-notice-error"
            style={{
              ...card,
              marginBottom: 16,
              color: "#fca5a5",
              borderColor: "rgba(248,113,113,.4)",
            }}
          >
            {error}
            <button type="button" style={{ ...ghost, marginLeft: 12 }} onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        ) : null}

        {success ? (
          <div
            className="connect-toast gradivo-notice-success"
            style={{
              ...card,
              marginBottom: 16,
              color: "#6ee7b7",
              borderColor: "rgba(52,211,153,.4)",
            }}
          >
            {success}
            <button type="button" style={{ ...ghost, marginLeft: 12 }} onClick={() => setSuccess("")}>
              Dismiss
            </button>
          </div>
        ) : null}

        {profileReady && dataReady && !profileLoadError && firebaseUser && (!me?.name.trim() || !me?.college.trim() || !me?.state.trim()) ? (
          <div style={{ ...card, marginBottom: 16 }}>
            Complete your college and state in Profile so other students can find you.
            <button type="button" style={{ ...primary, marginLeft: 12 }} onClick={onOpenProfile}>
              Update profile
            </button>
          </div>
        ) : null}

        <div
          className="connect-tabs"
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 8,
            marginBottom: 18,
          }}
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              style={{
                ...ghost,
                whiteSpace: "nowrap",
                background: tab === item.id ? colors.purple : colors.card2,
                color: tab === item.id ? "white" : colors.muted,
                borderColor: tab === item.id ? colors.purple : colors.border,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {(tab === "discover" || tab === "seniors") && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                <Search
                  size={16}
                  style={{ position: "absolute", left: 12, top: 14, color: colors.muted }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students by name, college, skill, branch..."
                  style={{ ...inputStyle, paddingLeft: 36 }}
                />
              </div>
              <button type="button" className="connect-filter-btn" style={ghost} onClick={() => setShowFilters(true)}>
                <SlidersHorizontal size={16} /> Filters
              </button>
            </div>
            <div className="connect-filters-desktop" style={{ marginBottom: 18 }}>
              <FilterGrid />
              {tab === "seniors" ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {SENIOR_HELP_AREAS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setHelpArea(helpArea === item ? "" : item)}
                      style={{
                        ...ghost,
                        padding: "8px 11px",
                        background: helpArea === item ? "rgba(59,130,246,.15)" : colors.card2,
                        color: helpArea === item ? colors.purple2 : colors.muted,
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <datalist id="connect-branches">
              {BRANCH_EXAMPLES.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </>
        )}

        {tab === "discover" &&
          (visiblePeople.length ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                gap: 14,
              }}
            >
              {visiblePeople.map((user) => (
                <StudentCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <EmptyState
              colors={colors}
              title="No students found."
              text="Try changing your filters or search. Students appear here after they complete their Gradivo profile."
            />
          ))}

        {tab === "seniors" &&
          (seniors.length ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                gap: 14,
              }}
            >
              {seniors.map((user) => (
                <StudentCard key={user.id} user={user} senior />
              ))}
            </div>
          ) : (
            <EmptyState
              colors={colors}
              title="No seniors found."
              text="Try changing your filters."
            />
          ))}

        {tab === "groups" && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <button type="button" style={primary} onClick={() => setCreateOpen(true)}>
                + Create Group
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile || activeGroup ? "1fr" : "minmax(280px,1fr) minmax(0,1.4fr)",
                gap: 16,
              }}
            >
              {(!isMobile || !activeGroup) && (
                <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10 }}>
                      My Groups ({myGroups.length})
                    </div>
                    {myGroups.length === 0 ? (
                      <EmptyState
                        colors={colors}
                        title="You haven't joined any groups yet."
                        text="Create a group for your teammates or join a public group below."
                      />
                    ) : (
                      <div style={{ display: "grid", gap: 12 }}>
                        {myGroups.map((group) => (
                          <article key={group.id} style={card}>
                            <div style={{ fontWeight: 750 }}>{group.name}</div>
                            <div style={{ color: colors.muted, fontSize: 13, margin: "6px 0 10px" }}>
                              {group.description || "No description yet."}
                            </div>
                            <div style={{ color: colors.purple2, fontSize: 12, fontWeight: 700 }}>
                              {group.type === "private" ? "Private" : "Public"}
                              {` · ${group.members.length || group.memberCount} members`}
                              {isGroupMember(group) ? " · ✓ Joined" : ""}
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                              <button
                                type="button"
                                style={primary}
                                onClick={() => setActiveGroup(group.id)}
                              >
                                Open Chat
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10 }}>
                      Find Groups
                    </div>
                    {findGroups.length === 0 ? (
                      <EmptyState
                        colors={colors}
                        title="No public groups to join."
                        text="Create your own group to get started."
                      />
                    ) : (
                      <div style={{ display: "grid", gap: 12 }}>
                        {findGroups.map((group) => (
                          <article key={group.id} style={card}>
                            <div style={{ fontWeight: 750 }}>{group.name}</div>
                            <div style={{ color: colors.muted, fontSize: 13, margin: "6px 0 10px" }}>
                              {group.description || "No description yet."}
                            </div>
                            <div style={{ color: colors.purple2, fontSize: 12, fontWeight: 700 }}>
                              {group.category}
                              {group.state ? ` · ${group.state}` : ""} · {group.members.length || group.memberCount} members
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                              {isGroupMember(group) ? (
                                <button
                                  type="button"
                                  style={{ ...ghost, color: colors.purple2 }}
                                  disabled
                                >
                                  ✓ Joined
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  style={primary}
                                  disabled={joining.has(group.id)}
                                  onClick={() => handleJoinGroup(group.id)}
                                >
                                  {joining.has(group.id) ? "Joining…" : "Join"}
                                </button>
                              )}
                              <button
                                type="button"
                                style={ghost}
                                onClick={() => setActiveGroup(group.id)}
                              >
                                Preview
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeGroupData && (!isMobile || activeGroup) ? (
                <div style={{ ...card, minHeight: 420, display: "grid", gridTemplateRows: "auto auto 1fr auto", alignContent: "start", gap: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      {isMobile ? (
                        <button type="button" style={{ ...ghost, marginBottom: 10 }} onClick={() => setActiveGroup(null)}>
                          <ArrowLeft size={15} /> Back
                        </button>
                      ) : null}
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 800, fontSize: 20 }}>{activeGroupData.name}</div>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "3px 9px",
                            borderRadius: 999,
                            border: "1px solid rgba(59,130,246,.4)",
                            color: colors.purple2,
                            fontWeight: 700,
                          }}
                        >
                          {activeGroupData.type === "private" ? "Private" : "Public"}
                        </span>
                      </div>
                      <div style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>
                        {activeGroupData.description || "No description yet."}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: colors.muted, fontSize: 13, margin: "12px 0" }}>
                    Members: {activeGroupData.members.length || activeGroupData.memberCount || groupMembers.length}
                    {activeGroupData.category ? ` · ${activeGroupData.category}` : ""}
                    {activeCreator ? ` · Created by ${activeCreator.name || "a student"}` : null}
                  </div>

                  <div
                    style={{
                      border: `1px solid ${colors.border}`,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 12,
                      background: colors.card2,
                    }}
                  >
                    <div style={{ fontWeight: 750, fontSize: 14, marginBottom: 8 }}>
                      Members ({activeMemberIds.length})
                    </div>
                    <div style={{ display: "grid", gap: 8, maxHeight: 180, overflowY: "auto" }}>
                      {activeMemberIds.map((id) => {
                        const member = peopleMap.get(id);
                        const isAdmin =
                          activeGroupData.admins.includes(id) ||
                          activeGroupData.createdBy === id;
                        return (
                          <div key={id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Avatar user={member ?? { name: "Student", photoURL: "" }} size={30} />
                            <span style={{ flex: 1, fontSize: 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {member?.name || (id === firebaseUser.uid ? "You" : "Student")}
                              {id === activeGroupData.createdBy ? " · Creator" : null}
                            </span>
                            {isAdmin ? (
                              <span style={{ fontSize: 10, color: colors.purple2, fontWeight: 700, border: "1px solid rgba(59,130,246,.4)", padding: "2px 7px", borderRadius: 999 }}>
                                ADMIN
                              </span>
                            ) : null}
                            {amGroupAdmin && id !== firebaseUser.uid ? (
                              <button
                                type="button"
                                style={{ ...ghost, padding: "5px 9px", fontSize: 12 }}
                                onClick={() => handleRemoveMember(id)}
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                    {amGroupMember && !amGroupAdmin ? (
                      <button
                        type="button"
                        style={{ ...ghost, marginTop: 10 }}
                        onClick={handleLeaveGroup}
                      >
                        Leave group
                      </button>
                    ) : null}
                    {amGroupAdmin ? (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Add teammates</div>
                        <input
                          value={addMemberQuery}
                          onChange={(e) => setAddMemberQuery(e.target.value)}
                          placeholder="Search registered students..."
                          style={inputStyle}
                        />
                        {addMemberQuery.trim() ? (
                          <div style={{ display: "grid", gap: 6, marginTop: 8, maxHeight: 160, overflowY: "auto" }}>
                            {addableMembers.map((user) => (
                              <div key={user.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <Avatar user={user} size={28} />
                                <span style={{ flex: 1, fontSize: 13 }}>{user.name || "Student"}</span>
                                <button
                                  type="button"
                                  style={{ ...ghost, padding: "5px 9px", fontSize: 12 }}
                                  disabled={managingMembers}
                                  onClick={() => handleAddMembers([user.id])}
                                >
                                  Add
                                </button>
                              </div>
                            ))}
                            {addableMembers.length === 0 ? (
                              <div style={{ color: colors.muted, fontSize: 13 }}>No matching students.</div>
                            ) : null}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          style={{ ...ghost, marginTop: 10 }}
                          onClick={handleLeaveGroup}
                        >
                          Leave group
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div style={{ overflowY: "auto", display: "grid", gap: 8, alignContent: "start", maxHeight: 320 }}>
                    {groupMessages.map((item) => {
                      const mine = item.senderId === firebaseUser.uid;
                      const author = peopleMap.get(item.senderId);
                      return (
                        <div key={item.id} style={{ textAlign: mine ? "right" : "left" }}>
                          <div
                            style={{
                              display: "inline-block",
                              maxWidth: "85%",
                              padding: "9px 12px",
                              borderRadius: 14,
                              background: mine ? colors.purple : colors.card2,
                              color: mine ? "white" : colors.text,
                            }}
                          >
                            {!mine ? (
                              <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>
                                {author?.name || "Student"}
                              </div>
                            ) : null}
                            {item.text}
                            <div style={{ fontSize: 10, opacity: 0.75, marginTop: 4 }}>
                              {formatTime(item.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {groupMessages.length === 0 ? (
                      <div style={{ color: colors.muted, fontSize: 13 }}>
                        No messages yet. Say hello to your teammates.
                      </div>
                    ) : null}
                  </div>
                  {amGroupMember ? (
                    <form onSubmit={sendGroup} style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <input
                        value={groupDraft}
                        onChange={(e) => setGroupDraft(e.target.value)}
                        placeholder="Message the group"
                        style={inputStyle}
                      />
                      <button type="submit" style={primary}>
                        <Send size={16} />
                      </button>
                    </form>
                  ) : (
                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        style={primary}
                        disabled={joining.has(activeGroupData.id)}
                        onClick={() => handleJoinGroup(activeGroupData.id)}
                      >
                        {joining.has(activeGroupData.id) ? "Joining…" : "Join to chat"}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        )}

        {tab === "messages" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "minmax(260px,320px) minmax(0,1fr)",
              gap: 16,
              minHeight: 520,
            }}
          >
            {(!isMobile || !activeConv) && (
              <div style={card}>
                <button type="button" style={{ ...primary, width: "100%", marginBottom: 14 }} onClick={() => setNewChatOpen(true)}>
                  Start New Conversation
                </button>
                {conversations.length === 0 ? (
                  <EmptyState
                    colors={colors}
                    title="No conversations yet."
                    text="Find a student or senior to start your first conversation."
                  />
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {conversations.map((item) => {
                      const peerId = item.participants.find((id) => id !== firebaseUser.uid) ?? "";
                      const peer = peopleMap.get(peerId);
                      const unread = item.unread[firebaseUser.uid] || 0;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveConv(item.id)}
                          style={{
                            ...ghost,
                            display: "flex",
                            gap: 10,
                            textAlign: "left",
                            alignItems: "center",
                            background: activeConv === item.id ? "rgba(59,130,246,.12)" : colors.card2,
                          }}
                        >
                          <Avatar user={peer ?? { name: "Student", photoURL: "" }} size={40} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <strong style={{ fontSize: 14 }}>{peer?.name || "Student"}</strong>
                              <span style={{ color: colors.muted, fontSize: 11 }}>
                                {formatTime(item.lastMessageAt)}
                              </span>
                            </div>
                            <div
                              style={{
                                color: colors.muted,
                                fontSize: 12,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.lastMessage || "No messages yet"}
                            </div>
                          </div>
                          {unread > 0 ? (
                            <span
                              style={{
                                minWidth: 20,
                                height: 20,
                                borderRadius: 999,
                                background: colors.purple,
                                color: "white",
                                fontSize: 11,
                                display: "grid",
                                placeItems: "center",
                                padding: "0 6px",
                              }}
                            >
                              {unread}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
                {blocked.size > 0 ? (
                  <div style={{ marginTop: 18 }}>
                    <div style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>Blocked</div>
                    {[...blocked].map((id) => {
                      const user = peopleMap.get(id);
                      return (
                        <div key={id} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                          <span>{user?.name || "Student"}</span>
                          <button type="button" style={ghost} onClick={() => unblockUser(firebaseUser.uid, id)}>
                            Unblock
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}

            {(!isMobile || activeConv) && (
              <div style={{ ...card, display: "grid", gridTemplateRows: "auto 1fr auto", minHeight: 520 }}>
                {activeConv && otherId ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {isMobile ? (
                          <button type="button" style={ghost} onClick={() => setActiveConv(null)}>
                            <ArrowLeft size={16} />
                          </button>
                        ) : null}
                        <Avatar user={otherUser} size={40} />
                        <div>
                          <div style={{ fontWeight: 750 }}>{otherUser?.name || "Student"}</div>
                          <div style={{ color: colors.muted, fontSize: 12 }}>
                            {otherUser?.online ? "Online" : "Offline"}
                          </div>
                        </div>
                      </div>
                      <div style={{ position: "relative" }}>
                        <button type="button" style={ghost} onClick={() => setMenuOpen((v) => !v)} aria-label="Chat options">
                          <MoreVertical size={16} />
                        </button>
                        {menuOpen ? (
                          <div
                            style={{
                              position: "absolute",
                              right: 0,
                              top: 44,
                              width: 220,
                              ...card,
                              zIndex: 5,
                              padding: 8,
                            }}
                          >
                            <button type="button" style={{ ...ghost, width: "100%", marginBottom: 6 }} onClick={() => { setReportOpen(true); setMenuOpen(false); }}>
                              Report
                            </button>
                            {blocked.has(otherId) ? (
                              <button type="button" style={{ ...ghost, width: "100%", marginBottom: 6 }} onClick={() => { unblockUser(firebaseUser.uid, otherId); setMenuOpen(false); }}>
                                Unblock
                              </button>
                            ) : (
                              <button type="button" style={{ ...ghost, width: "100%", marginBottom: 6 }} onClick={() => { blockUser(firebaseUser.uid, otherId); setMenuOpen(false); }}>
                                Block
                              </button>
                            )}
                            <button
                              type="button"
                              style={{ ...ghost, width: "100%" }}
                              onClick={() => {
                                hideConversation(activeConv, firebaseUser.uid);
                                setActiveConv(null);
                                setMenuOpen(false);
                              }}
                            >
                              Delete conversation
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div style={{ overflowY: "auto", display: "grid", gap: 8, alignContent: "start", padding: "16px 0" }}>
                      {messages.map((item) => {
                        const mine = item.senderId === firebaseUser.uid;
                        return (
                          <div key={item.id} style={{ textAlign: mine ? "right" : "left" }}>
                            <div
                              style={{
                                display: "inline-block",
                                maxWidth: "80%",
                                padding: "10px 12px",
                                borderRadius: 16,
                                background: mine ? colors.purple : colors.card2,
                                color: mine ? "white" : colors.text,
                              }}
                            >
                              {item.text}
                              <div style={{ fontSize: 10, opacity: 0.75, marginTop: 4 }}>
                                {formatTime(item.createdAt)}
                                {mine ? ` · ${item.readBy.includes(otherId) ? "Seen" : "Sent"}` : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {seen ? (
                        <div style={{ textAlign: "right", color: colors.muted, fontSize: 11 }}>Seen</div>
                      ) : null}
                    </div>
                    <form onSubmit={sendChat} style={{ display: "flex", gap: 8 }}>
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={blocked.has(otherId) ? "Unblock to send messages" : "Write a message"}
                        disabled={blocked.has(otherId)}
                        style={inputStyle}
                      />
                      <button type="submit" style={primary} disabled={blocked.has(otherId)}>
                        <Send size={16} />
                      </button>
                    </form>
                  </>
                ) : (
                  <EmptyState
                    colors={colors}
                    title="No conversations yet."
                    text="Find a student or senior to start your first conversation."
                  />
                )}
              </div>
            )}
          </div>
        )}

        {tab === "projects" && (
          <div>
            <button type="button" style={{ ...primary, marginBottom: 16 }} onClick={() => setProjectOpen(true)}>
              Create project request
            </button>
            {projectsLoading ? (
              <EmptyState colors={colors} title="Loading project requests…" text="Fetching saved projects from Firebase." />
            ) : projects.length === 0 ? (
              <EmptyState colors={colors} title="No project requests found." text="Create one to find teammates for a hackathon or campus project." />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                  gap: 14,
                }}
              >
                {projects.map((item) => {
                  const creator = peopleMap.get(item.creatorId);
                  return (
                    <article key={item.id} style={card}>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{item.projectName}</div>
                      <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>{item.description}</p>
                      <div style={{ color: colors.muted, fontSize: 13 }}>
                        {[item.college, item.state, item.country].filter(Boolean).join(" · ")}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13 }}>
                        Looking for {item.teamSize} teammate{item.teamSize === 1 ? "" : "s"}
                        {item.deadline ? ` · Deadline ${item.deadline}` : ""}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                        {[...item.technologies, ...item.requiredSkills].map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: 11,
                              padding: "4px 8px",
                              borderRadius: 999,
                              background: "rgba(59,130,246,.12)",
                              color: colors.purple2,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {item.creatorId !== firebaseUser.uid ? (
                        <button
                          type="button"
                          style={{ ...primary, marginTop: 14 }}
                          onClick={() =>
                            startChat(
                              item.creatorId,
                              `Hi ${creator?.name.split(" ")[0] || ""}, I would like to join ${item.projectName}.`,
                            )
                          }
                        >
                          Apply / Message
                        </button>
                      ) : (
                        <div style={{ color: colors.muted, marginTop: 12, fontSize: 13 }}>Your request</div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showFilters ? (
        <div
          onClick={() => setShowFilters(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.65)",
            zIndex: 80,
            display: "grid",
            placeItems: "end center",
            padding: 16,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "min(560px,100%)" }}>
            <h3 style={{ marginTop: 0 }}>Filters</h3>
            <FilterGrid />
            <button type="button" style={{ ...primary, marginTop: 16 }} onClick={() => setShowFilters(false)}>
              Done
            </button>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div
          className="connect-modal-overlay"
          onClick={() => setCreateOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.65)",
            zIndex: 80,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <form
            className="connect-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateGroup}
            style={{ ...card, width: "min(520px,100%)", maxHeight: "85vh", overflowY: "auto", display: "grid", gap: 12 }}
          >
            <h3 style={{ margin: 0 }}>Create a group</h3>
            <label style={{ display: "grid", gap: 6, fontSize: 13, color: colors.muted }}>
              Group name
              <input
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Example: Hackathon Team 2026"
                style={inputStyle}
                maxLength={100}
              />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13, color: colors.muted }}>
              Group description
              <textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="What is this group for?"
                style={{ ...inputStyle, minHeight: 70 }}
                maxLength={500}
              />
            </label>
            <div style={{ display: "grid", gap: 6, fontSize: 13, color: colors.muted }}>
              Group type
              <div style={{ display: "flex", gap: 8 }}>
                {(["public", "private"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setGroupType(t)}
                    style={{
                      ...ghost,
                      flex: 1,
                      background: groupType === t ? "rgba(59,130,246,.15)" : colors.card2,
                      color: groupType === t ? colors.purple2 : colors.muted,
                      borderColor: groupType === t ? colors.purple : colors.border,
                    }}
                  >
                    {t === "public" ? "Public — anyone can find and join" : "Private — members only"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gap: 6, fontSize: 13, color: colors.muted }}>
              Add teammates
              <input
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Search registered students..."
                style={inputStyle}
              />
              {selectedMembers.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selectedMembers.map((id) => {
                    const user = peopleMap.get(id);
                    return (
                      <span
                        key={id}
                        style={{
                          fontSize: 12,
                          padding: "5px 6px 5px 10px",
                          borderRadius: 999,
                          background: "rgba(59,130,246,.15)",
                          color: colors.purple2,
                          display: "inline-flex",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        {user?.name || "Student"}
                        <button
                          type="button"
                          onClick={() => setSelectedMembers(selectedMembers.filter((x) => x !== id))}
                          style={{ border: "none", background: "transparent", color: "inherit", cursor: "pointer", fontSize: 13 }}
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : null}
              <div style={{ display: "grid", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                {memberCandidates.slice(0, 20).map((user) => (
                  <div key={user.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Avatar user={user} size={30} />
                    <span style={{ flex: 1, fontSize: 13, color: colors.text }}>
                      {user.name || "Student"}
                      <div style={{ color: colors.muted, fontSize: 11 }}>{user.college}</div>
                    </span>
                    <button
                      type="button"
                      style={{ ...ghost, padding: "6px 10px", fontSize: 12 }}
                      onClick={() => setSelectedMembers([...selectedMembers, user.id])}
                    >
                      Select
                    </button>
                  </div>
                ))}
                {memberCandidates.length === 0 ? (
                  <div style={{ fontSize: 13 }}>No more students found. Invite them to join Gradivo first.</div>
                ) : null}
              </div>
            </div>
            <button type="submit" style={primary} disabled={creating}>
              {creating ? "Creating…" : "Create Group"}
            </button>
          </form>
        </div>
      ) : null}

      {newChatOpen ? (
        <div
          onClick={() => setNewChatOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.65)",
            zIndex: 80,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "min(480px,100%)", maxHeight: "80vh", overflow: "auto" }}>
            <h3 style={{ marginTop: 0 }}>Start New Conversation</h3>
            <input
              value={newChatQuery}
              onChange={(e) => setNewChatQuery(e.target.value)}
              placeholder="Search students by name, college, skill..."
              style={inputStyle}
            />
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {visiblePeople
                .filter((user) => haystack(user).includes(newChatQuery.toLowerCase()))
                .slice(0, 20)
                .map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    style={{ ...ghost, display: "flex", gap: 10, alignItems: "center", textAlign: "left" }}
                    onClick={() => startChat(user.id)}
                  >
                    <Avatar user={user} size={36} />
                    <span>
                      {user.name}
                      <div style={{ color: colors.muted, fontSize: 12 }}>{user.college}</div>
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      ) : null}

      {reportOpen && otherId ? (
        <div
          onClick={() => setReportOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.65)",
            zIndex: 80,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <form
            className="connect-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            onSubmit={async (event) => {
              event.preventDefault();
              await reportUser({
                reportedBy: firebaseUser.uid,
                reportedUser: otherId,
                reason: reportReason,
                description: reportText,
              });
              setReportOpen(false);
              setReportText("");
            }}
            style={{ ...card, width: "min(440px,100%)" }}
          >
            <h3 style={{ marginTop: 0 }}>Report student</h3>
            <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} style={inputStyle}>
              {REPORT_REASONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Optional details"
              style={{ ...inputStyle, marginTop: 10, minHeight: 90 }}
            />
            <button type="submit" style={{ ...primary, marginTop: 12 }}>
              Submit report
            </button>
          </form>
        </div>
      ) : null}

      {projectOpen ? (
        <div
          className="connect-modal-overlay"
          onClick={() => setProjectOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.65)",
            zIndex: 80,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={async (event) => {
              event.preventDefault();
              if (creatingProject) return;
              if (!firebaseUser || auth.currentUser?.uid !== firebaseUser.uid) {
                setError("Please log in to continue.");
                setSuccess("");
                return;
              }
              setCreatingProject(true);
              setError("");
              try {
                await createProjectRequest(firebaseUser.uid, {
                  projectName: projectForm.projectName,
                  description: projectForm.description,
                  technologies: projectForm.technologies.split(",").map((item) => item.trim()).filter(Boolean),
                  requiredSkills: projectForm.requiredSkills.split(",").map((item) => item.trim()).filter(Boolean),
                  teamSize: Number(projectForm.teamSize),
                  college: projectForm.college || profile.college,
                  country: profile.country || DEFAULT_COUNTRY,
                  state: projectForm.state || profile.state,
                  deadline: projectForm.deadline,
                });
                setProjectOpen(false);
                setProjectForm((current) => ({ ...current, projectName: "", description: "", technologies: "", requiredSkills: "", deadline: "" }));
                setSuccess("Project request published successfully.");
              } catch (err) {
                const firebaseError = err as { code?: unknown; message?: unknown };
                const code = typeof firebaseError?.code === "string" ? ` (${firebaseError.code})` : "";
                const message = typeof firebaseError?.message === "string"
                  ? firebaseError.message
                  : "Could not publish the project request.";
                setError(`${message}${code}`);
                setSuccess("");
              } finally {
                setCreatingProject(false);
              }
            }}
            style={{ ...card, width: "min(520px,100%)", display: "grid", gap: 10 }}
          >
            <h3 style={{ margin: 0 }}>Find Project Teammates</h3>
            <input
              required
              maxLength={120}
              value={projectForm.projectName}
              onChange={(e) => setProjectForm({ ...projectForm, projectName: e.target.value })}
              placeholder="Project name"
              style={inputStyle}
            />
            <textarea
              required
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              placeholder="Project description"
              style={{ ...inputStyle, minHeight: 90 }}
            />
            <input
              value={projectForm.technologies}
              onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
              placeholder="Technology (comma separated)"
              style={inputStyle}
            />
            <input
              value={projectForm.requiredSkills}
              onChange={(e) => setProjectForm({ ...projectForm, requiredSkills: e.target.value })}
              placeholder="Required skills"
              style={inputStyle}
            />
            <input
              type="number"
              min={1}
              value={projectForm.teamSize}
              onChange={(e) => setProjectForm({ ...projectForm, teamSize: Number(e.target.value) })}
              placeholder="Teammates needed"
              style={inputStyle}
            />
            <input
              value={projectForm.college}
              onChange={(e) => setProjectForm({ ...projectForm, college: e.target.value })}
              placeholder="College"
              style={inputStyle}
            />
            <select
              value={projectForm.state}
              onChange={(e) => setProjectForm({ ...projectForm, state: e.target.value })}
              style={inputStyle}
            >
              <option value="">State</option>
              {INDIAN_STATES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={projectForm.deadline}
              onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
              style={inputStyle}
            />
            <button type="submit" style={primary} disabled={creatingProject || !firebaseUser}>
              {creatingProject ? "Publishing…" : "Publish request"}
            </button>
          </form>
        </div>
      ) : null}

      <style>{`
        .connect-tabs { scrollbar-width: none; }
        .connect-tabs::-webkit-scrollbar { display: none; }
        .connect-filter-btn { display: none; }
        @media (max-width: 800px) {
          .connect-filters-desktop { display: none; }
          .connect-filter-btn { display: inline-flex; align-items: center; gap: 8px; }
        }
      `}</style>
    </section>
  );
}
