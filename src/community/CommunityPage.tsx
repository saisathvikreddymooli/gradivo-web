import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  Brain,
  Check,
  Cloud,
  Code2,
  FolderKanban,
  Plus,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Terminal,
  Users,
  X,
} from "lucide-react";
import { auth } from "../firebase/config";
import ProfileAuth from "../components/ProfileAuth";
import {
  createGroup,
  ensureDefaultGroups,
  joinGroup,
  leaveGroup,
  listenGroups,
  listenMyGroupIds,
  listenUsers,
} from "../connect/api";
import type { ConnectGroup, ConnectUser, ThemeColors } from "../connect/types";

const CATEGORIES = [
  "All",
  "AI",
  "Machine Learning",
  "Cybersecurity",
  "Cloud",
  "Web Development",
  "Programming",
  "Projects",
  "Hackathons",
  "Other",
] as const;

type CategoryFilter = (typeof CATEGORIES)[number];

const CREATE_CATEGORIES = CATEGORIES.filter(
  (item): item is Exclude<CategoryFilter, "All"> => item !== "All",
);

function bucketOf(group: ConnectGroup): Exclude<CategoryFilter, "All"> {
  return (CATEGORIES as readonly string[]).includes(group.category)
    && group.category !== "All"
    ? (group.category as Exclude<CategoryFilter, "All">)
    : "Other";
}

function CategoryIcon({ category, size = 22 }: { category: string; size?: number }) {
  switch (category) {
    case "AI":
      return <Sparkles size={size} />;
    case "Machine Learning":
      return <Brain size={size} />;
    case "Cybersecurity":
      return <Shield size={size} />;
    case "Cloud":
      return <Cloud size={size} />;
    case "Web Development":
      return <Code2 size={size} />;
    case "Programming":
      return <Terminal size={size} />;
    case "Projects":
      return <FolderKanban size={size} />;
    case "Hackathons":
      return <Rocket size={size} />;
    default:
      return <Users size={size} />;
  }
}

function formatDate(millis: number | null): string {
  if (!millis) return "";
  return new Date(millis).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CommunityPage({ colors }: { colors: ThemeColors }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [groups, setGroups] = useState<ConnectGroup[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [people, setPeople] = useState<ConnectUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newCategory, setNewCategory] = useState<string>("AI");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<Set<string>>(new Set());
  const [leaving, setLeaving] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<ConnectGroup | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setFirebaseUser(user));
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    ensureDefaultGroups().catch(() => undefined);
    let firstSnapshot = true;
    const unsubs = [
      listenGroups((items) => {
        setGroups(items);
        if (firstSnapshot) {
          firstSnapshot = false;
          setLoading(false);
        }
      }),
      listenMyGroupIds(firebaseUser.uid, setJoined),
      listenUsers(setPeople),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [firebaseUser]);

  const peopleMap = useMemo(() => {
    const map = new Map<string, ConnectUser>();
    people.forEach((user) => map.set(user.id, user));
    return map;
  }, [people]);

  const myUid = firebaseUser?.uid ?? "";
  const isMember = (group: ConnectGroup) =>
    Boolean(myUid) && (group.members.includes(myUid) || joined.has(group.id));

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter((group) => {
      if (category !== "All" && bucketOf(group) !== category) return false;
      if (q) {
        const haystack = `${group.name} ${group.category} ${group.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [groups, category, search]);

  const selected = selectedId ? groups.find((item) => item.id === selectedId) ?? null : null;

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 10,
    border: `1px solid ${colors.inputBorder}`,
    background: colors.inputBg,
    color: colors.text,
    outline: "none",
    fontSize: 14,
  };
  const card: CSSProperties = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 18,
    padding: 20,
    textAlign: "left",
  };
  const primary: CSSProperties = {
    border: "none",
    background: colors.purple,
    color: "white",
    padding: "10px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "0 8px 30px rgba(59,130,246,.2)",
  };
  const ghost: CSSProperties = {
    border: `1px solid ${colors.border}`,
    background: colors.card2,
    color: colors.text,
    padding: "10px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 650,
    fontSize: 14,
  };

  function creatorName(group: ConnectGroup): string {
    if (group.createdBy === "system") return "Gradivo";
    return peopleMap.get(group.createdBy)?.name || "A student";
  }

  function memberCount(group: ConnectGroup): number {
    return group.members.length || group.memberCount;
  }

  async function handleJoin(group: ConnectGroup) {
    if (!firebaseUser) {
      setError("Please log in to join a community.");
      setSuccess("");
      return;
    }
    if (joining.has(group.id)) return;
    if (isMember(group)) {
      setError("");
      setSuccess(`You are already a member of "${group.name}".`);
      return;
    }
    setJoining((current) => new Set(current).add(group.id));
    try {
      await joinGroup(group.id, firebaseUser.uid);
      setError("");
      setSuccess("You joined this community.");
    } catch (err) {
      console.error(`Community join failed for "${group.name}":`, err);
      setSuccess("");
      setError("Unable to join this community. Please try again.");
    } finally {
      setJoining((current) => {
        const next = new Set(current);
        next.delete(group.id);
        return next;
      });
    }
  }

  async function handleLeave(group: ConnectGroup) {
    if (!firebaseUser || leaving) return;
    setLeaving(true);
    try {
      await leaveGroup(group.id, firebaseUser.uid);
      setError("");
      setSuccess("You left this community.");
      setLeaveTarget(null);
    } catch (err) {
      console.error(`Community leave failed for "${group.name}":`, err);
      setSuccess("");
      setError("Unable to leave this community. Please try again.");
      setLeaveTarget(null);
    } finally {
      setLeaving(false);
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!firebaseUser || creating) return;
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    if (!trimmedName) {
      setError("Community name is required.");
      setSuccess("");
      return;
    }
    if (!trimmedDesc) {
      setError("Community description is required.");
      setSuccess("");
      return;
    }
    if (!newCategory) {
      setError("Please choose a category.");
      setSuccess("");
      return;
    }
    if (groups.some((group) => group.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      setError("A community with this name already exists.");
      setSuccess("");
      return;
    }
    setCreating(true);
    try {
      const id = await createGroup(firebaseUser.uid, {
        name: trimmedName,
        description: trimmedDesc,
        type: "public",
        memberIds: [],
        category: newCategory,
      });
      setName("");
      setDescription("");
      setNewCategory("AI");
      setCreateOpen(false);
      setSelectedId(id);
      setError("");
      setSuccess(`"${trimmedName}" created successfully! You are its admin.`);
    } catch (err) {
      console.error(`Community creation failed for "${trimmedName}":`, err);
      setSuccess("");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function renderJoinButton(group: ConnectGroup) {
    const member = isMember(group);
    const busy = joining.has(group.id);
    if (member) {
      return (
        <button
          type="button"
          style={{ ...ghost, color: colors.purple2 }}
          onClick={(e) => {
            e.stopPropagation();
            setLeaveTarget(group);
          }}
        >
          <Check size={15} /> Joined
        </button>
      );
    }
    return (
      <button
        type="button"
        style={primary}
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          handleJoin(group);
        }}
      >
        {busy ? "Joining…" : "Join"}
      </button>
    );
  }

  if (!firebaseUser) {
    return (
      <section style={{ padding: "70px 0" }}>
        <div style={{ width: "100%", maxWidth: "none", margin: 0, padding: "0 clamp(20px, 4vw, 60px)", boxSizing: "border-box" }}>
          <div style={{ ...card, maxWidth: 520, margin: "0 auto", padding: 28 }}>
            <div style={{ color: colors.purple2, fontWeight: 700, marginBottom: 8 }}>Community</div>
            <h1 style={{ marginTop: 0, fontSize: 32, letterSpacing: "-0.8px", lineHeight: 1.2 }}>
              Log in to join student communities
            </h1>
            <ProfileAuth colors={colors} studentName="" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: "70px 0 40px" }}>
      <div style={{ width: "100%", maxWidth: "none", margin: 0, padding: "0 clamp(20px, 4vw, 60px)", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 760 }}>
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
              background: "rgba(59,130,246,.1)",
            }}
          >
            <Users size={15} /> Student Community
          </div>
          <h1 style={{ fontSize: "clamp(32px,6vw,56px)", letterSpacing: "-2px", margin: "16px 0 10px" }}>
            Student Community
          </h1>
          <p style={{ color: colors.muted, maxWidth: 640, lineHeight: 1.7, fontSize: 17 }}>
            Connect with students who share your interests. Learn together, build together, and grow together.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, margin: "20px 0", flexWrap: "wrap" }}>
          <button type="button" style={primary} onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Create Community
          </button>
        </div>

        {error ? (
          <div style={{ ...card, marginBottom: 16, color: "#fca5a5", borderColor: "rgba(248,113,113,.4)" }}>
            {error}
            <button type="button" style={{ ...ghost, marginLeft: 12 }} onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        ) : null}
        {success ? (
          <div style={{ ...card, marginBottom: 16, color: "#6ee7b7", borderColor: "rgba(52,211,153,.4)" }}>
            {success}
            <button type="button" style={{ ...ghost, marginLeft: 12 }} onClick={() => setSuccess("")}>
              Dismiss
            </button>
          </div>
        ) : null}

        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 14, color: colors.muted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities..."
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              style={{
                ...ghost,
                background: category === item ? colors.purple : colors.card2,
                color: category === item ? "white" : colors.muted,
                borderColor: category === item ? colors.purple : colors.border,
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: colors.muted, padding: "20px 0" }}>Loading communities...</div>
        ) : groups.length === 0 ? (
          <div style={{ ...card, textAlign: "center", color: colors.muted }}>
            No communities found.
          </div>
        ) : visible.length === 0 ? (
          <div style={{ ...card, textAlign: "center", color: colors.muted }}>
            No communities match your search.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
            {visible.map((group) => (
              <article
                key={group.id}
                style={{ ...card, cursor: "pointer", transition: "transform .2s, border-color .2s" }}
                onClick={() => setSelectedId(group.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = colors.purple;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 14,
                    background: "rgba(59,130,246,.12)",
                    color: colors.purple2,
                    marginBottom: 14,
                  }}
                >
                  <CategoryIcon category={bucketOf(group)} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{group.name}</div>
                <div style={{ color: colors.muted, fontSize: 13, margin: "6px 0 10px", lineHeight: 1.55 }}>
                  {group.description || "No description yet."}
                </div>
                <div style={{ color: colors.purple2, fontSize: 12, fontWeight: 700 }}>
                  {bucketOf(group)} · {memberCount(group)} Members
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  {renderJoinButton(group)}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <div
          onClick={() => setSelectedId(null)}
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
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "min(520px,100%)", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 14,
                    background: "rgba(59,130,246,.12)",
                    color: colors.purple2,
                    flexShrink: 0,
                  }}
                >
                  <CategoryIcon category={bucketOf(selected)} size={24} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 22 }}>{selected.name}</div>
                  <div style={{ color: colors.purple2, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                    {bucketOf(selected)} · {memberCount(selected)} Members
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Close"
                style={{ ...ghost, padding: 8, lineHeight: 0 }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.65, marginTop: 14 }}>
              {selected.description || "No description yet."}
            </p>
            <div style={{ display: "grid", gap: 6, fontSize: 13, color: colors.muted, marginTop: 8 }}>
              <div>Creator: <span style={{ color: colors.text }}>{creatorName(selected)}</span></div>
              {selected.createdAt ? <div>Created: {formatDate(selected.createdAt)}</div> : null}
              <div>Visibility: {selected.type === "private" ? "Private" : "Public"}</div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
              {renderJoinButton(selected)}
              {isMember(selected) ? (
                <button
                  type="button"
                  style={ghost}
                  onClick={() => setLeaveTarget(selected)}
                >
                  Leave Community
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {leaveTarget ? (
        <div
          onClick={() => {
            if (!leaving) setLeaveTarget(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.65)",
            zIndex: 90,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ ...card, width: "min(400px,100%)", textAlign: "center" }}
          >
            <h3 style={{ margin: "0 0 8px" }}>Leave this community?</h3>
            <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
              You will no longer be a member of "{leaveTarget.name}". You can
              rejoin anytime.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                style={ghost}
                disabled={leaving}
                onClick={() => setLeaveTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  ...primary,
                  background: "#dc2626",
                  boxShadow: "0 8px 30px rgba(220,38,38,.25)",
                  opacity: leaving ? 0.7 : 1,
                }}
                disabled={leaving}
                onClick={() => handleLeave(leaveTarget)}
              >
                {leaving ? "Leaving…" : "Leave Community"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div
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
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreate}
            style={{ ...card, width: "min(520px,100%)", maxHeight: "85vh", overflowY: "auto", display: "grid", gap: 12 }}
          >
            <h3 style={{ margin: 0 }}>Create a community</h3>
            <label style={{ display: "grid", gap: 6, fontSize: 13, color: colors.labelText }}>
              Community Name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Example: Cybersecurity Beginners"
                style={inputStyle}
                maxLength={100}
              />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13, color: colors.labelText }}>
              Description
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A community for students starting their cybersecurity journey."
                style={{ ...inputStyle, minHeight: 80 }}
                maxLength={500}
              />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13, color: colors.labelText }}>
              Category
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={inputStyle}>
                {CREATE_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" style={primary} disabled={creating}>
              {creating ? "Creating…" : "Create Community"}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
