import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Briefcase,
  CalendarDays,
  ChevronDown,
  Clock,
  ExternalLink,
  MapPin,
  Rocket,
  Search,
} from "lucide-react";
import type { ThemeColors } from "../connect/types";
import {
  deadlineStatus,
  filterByCity,
  formatDate,
  isRelevantToLocale,
  loadOpportunities,
  matchesSearch,
  rankByLocation,
  type Opportunity,
} from "../services/opportunityService";

type Category = "all" | "internship" | "hackathon";

const LOCATION_OPTIONS = [
  "My Location",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Mumbai",
  "Delhi",
  "Remote",
];

const MODE_OPTIONS = [
  "All Modes",
  "Online",
  "Offline",
  "Hybrid",
  "Remote",
  "On-site",
] as const;

type Props = {
  colors: ThemeColors;
  profileCity: string;
  profileState: string;
  initialSearch?: string;
};

function locationLabel(item: Opportunity) {
  if (item.location) {
    return item.location === "Remote" ? "🌐 Remote" : `📍 ${item.location}`;
  }
  if (item.city) {
    const labelled = item.city === "Remote" ? "🌐 Remote" : `📍 ${item.city}`;
    return item.state ? `${labelled}, ${item.state}` : labelled;
  }
  return "📍 Location TBA";
}

export default function NoticesPage({ colors, profileCity, profileState, initialSearch = "" }: Props) {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState(initialSearch);
  const [location, setLocation] = useState<string>("My Location");
  const [mode, setMode] = useState<string>("All Modes");
  const [sortAsc, setSortAsc] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadOpportunities().then((loaded) => {
      if (!cancelled) {
        setItems(loaded);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const card: CSSProperties = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 18,
    padding: 22,
  };
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
  const primary: CSSProperties = {
    border: "none",
    background: colors.purple,
    color: "white",
    padding: "10px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    textDecoration: "none",
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
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
  };
  const badge: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 11px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  };

  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      if (category !== "all" && item.type !== category) return false;
      if (mode !== "All Modes" && item.mode !== mode) return false;
      if (!matchesSearch(item, search)) return false;
      return true;
    });
    if (location === "My Location") {
      const locale = { city: profileCity, state: profileState };
      list = rankByLocation(list, locale).filter(
        (item) => isRelevantToLocale(item, locale),
      );
    } else {
      list = filterByCity(list, location);
    }
    return [...list].sort((a, b) =>
      sortAsc
        ? (a.deadline || "9999").localeCompare(b.deadline || "9999")
        : (b.deadline || "").localeCompare(a.deadline || ""),
    );
  }, [items, category, location, mode, search, sortAsc, profileCity, profileState]);

  const counts = useMemo(
    () => ({
      all: items.length,
      hackathon: items.filter((i) => i.type === "hackathon").length,
      internship: items.filter((i) => i.type === "internship").length,
    }),
    [items],
  );

  const scopedEmpty = location === "My Location" || location !== "All Locations";

  return (
    <section style={{ padding: "90px 0" }}>
      <div
        style={{
          width: "100%",
          maxWidth: "none",
          margin: 0,
          padding: "0 clamp(20px, 4vw, 60px)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div
            style={{
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
            }}
          >
            <Briefcase size={15} />
            Opportunity Center
          </div>
          <h1
            style={{
              fontSize: "clamp(36px, 6vw, 55px)",
              letterSpacing: "-2px",
              margin: "18px 0 12px",
            }}
          >
            Opportunities
          </h1>
          <p style={{ color: colors.muted, fontSize: 18, lineHeight: 1.7 }}>
            Discover real internships and hackathons relevant to you.
          </p>
          <p style={{ color: colors.muted, fontSize: 13, marginTop: 10 }}>
            Only verified opportunities with a real source are listed here.
            Always confirm details on the official page before applying.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 32 }}>
          {(
            [
              ["all", `All (${counts.all})`],
              ["internship", `Internships (${counts.internship})`],
              ["hackathon", `Hackathons (${counts.hackathon})`],
            ] as [Category, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              style={{
                ...ghost,
                background: category === value ? colors.purple : colors.card2,
                color: category === value ? "white" : colors.muted,
                borderColor: category === value ? colors.purple : colors.border,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          style={{
            ...card,
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          <div style={{ position: "relative", gridColumn: "1 / -1" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: 12, top: 14, color: colors.muted }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role, company, hackathon, organizer, skill, or location…"
              style={{ ...inputStyle, paddingLeft: 36 }}
            />
          </div>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={inputStyle}
            aria-label="Filter by location"
          >
            {LOCATION_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item === "My Location"
                  ? profileCity
                    ? `My Location (${profileCity})`
                    : "My Location"
                  : item}
              </option>
            ))}
          </select>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={inputStyle}
            aria-label="Filter by mode"
          >
            {MODE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item === "All Modes" ? "Online / Offline / Hybrid" : item}
              </option>
            ))}
          </select>
          <select
            value={sortAsc ? "asc" : "desc"}
            onChange={(e) => setSortAsc(e.target.value === "asc")}
            style={inputStyle}
            aria-label="Sort by deadline"
          >
            <option value="asc">Sort: deadline (soonest)</option>
            <option value="desc">Sort: deadline (latest)</option>
          </select>
        </div>

        {loading ? (
          <div style={{ color: colors.muted, marginTop: 28 }}>
            Loading opportunities…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ ...card, marginTop: 20, textAlign: "center", color: colors.muted }}>
            {scopedEmpty
              ? "No nearby opportunities available right now."
              : "No opportunities available right now."}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
              gap: 16,
              marginTop: 20,
            }}
          >
            {filtered.map((item) => {
              const status = deadlineStatus(item.deadline);
              const open = expanded === item.id;
              const isInternship = item.type === "internship";
              return (
                <article
                  key={item.id}
                  style={{ ...card, transition: "transform .2s, border-color .2s" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = colors.purple;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = colors.border;
                  }}
                >
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    <span style={{ ...badge, background: "rgba(59,130,246,.12)", color: colors.purple2 }}>
                      {isInternship ? <Briefcase size={12} /> : <Rocket size={12} />}
                      {isInternship ? "💼 Internship" : "🏆 Hackathon"}
                    </span>
                    <span style={{ ...badge, border: `1px solid ${colors.border}`, color: colors.muted }}>
                      <MapPin size={12} />
                      {locationLabel(item)}
                    </span>
                    <span style={{ ...badge, border: `1px solid ${colors.border}`, color: colors.muted }}>
                      {item.mode}
                    </span>
                    <span
                      style={{
                        ...badge,
                        background:
                          status.tone === "closed"
                            ? "rgba(113,113,122,.15)"
                            : status.tone === "closing"
                              ? "rgba(239,68,68,.12)"
                              : "rgba(52,211,153,.1)",
                        color:
                          status.tone === "closed"
                            ? colors.muted
                            : status.tone === "closing"
                              ? "#fca5a5"
                              : "#6ee7b7",
                      }}
                    >
                      <Clock size={12} />
                      {status.label}
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 4px", fontSize: 20 }}>{item.title}</h3>
                  <div style={{ color: colors.purple2, fontWeight: 700, fontSize: 14 }}>
                    {item.organization}
                  </div>

                  <div style={{ display: "grid", gap: 6, marginTop: 12, fontSize: 13, color: colors.muted }}>
                    {item.deadline ? (
                      <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                        <CalendarDays size={14} color={colors.purple2} />
                        {isInternship ? "Application" : "Registration"} deadline:{" "}
                        {formatDate(item.deadline)}
                        {item.eventDate ? ` · Event: ${formatDate(item.eventDate)}` : null}
                      </div>
                    ) : null}
                    {item.duration ? <div>Duration: {item.duration}</div> : null}
                    {item.stipend ? <div>Stipend: {item.stipend}</div> : null}
                    {item.eligibility ? <div>Eligibility: {item.eligibility}</div> : null}
                    <div>
                      Source:{" "}
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: colors.purple2 }}
                      >
                        {item.sourceName}
                      </a>
                    </div>
                  </div>

                  {item.skills.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                      {item.skills.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            fontSize: 11,
                            padding: "4px 9px",
                            borderRadius: 999,
                            background: "rgba(59,130,246,.12)",
                            color: colors.purple2,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {open && item.description ? (
                    <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.65, marginTop: 12 }}>
                      {item.description}
                    </p>
                  ) : null}

                  <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                    <button type="button" style={ghost} onClick={() => setExpanded(open ? null : item.id)}>
                      View Details
                      <ChevronDown
                        size={15}
                        style={{
                          transform: open ? "rotate(180deg)" : "rotate(0)",
                          transition: "transform .2s",
                        }}
                      />
                    </button>
                    <a href={item.applicationUrl} target="_blank" rel="noreferrer" style={primary}>
                      {isInternship ? "Apply Now" : "Register Now"}
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
