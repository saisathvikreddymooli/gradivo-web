import { useEffect, useState } from "react";
import { ArrowRight, Bell } from "lucide-react";
import type { ThemeColors } from "../connect/types";
import {
  formatDate,
  isRelevantToLocale,
  loadOpportunities,
  rankByLocation,
  type Opportunity,
} from "../services/opportunityService";

type Props = {
  colors: ThemeColors;
  city: string;
  state: string;
  onView: () => void;
};

/**
 * Small Home-page alert showing the single most location-relevant active
 * opportunity. Renders nothing when no relevant opportunity exists —
 * never an empty box, never filler.
 */
export default function OpportunityAlert({ colors, city, state, onView }: Props) {
  const [item, setItem] = useState<Opportunity | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadOpportunities().then((loaded) => {
      if (cancelled) return;
      const ranked = rankByLocation(loaded, { city, state });
      const relevant = ranked.filter((entry) => isRelevantToLocale(entry, { city, state }));
      setItem(relevant[0] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [city, state]);

  if (!item) return null;
  const isInternship = item.type === "internship";

  return (
    <aside
      aria-label="New opportunity"
      role="link"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView();
        }
      }}
      style={{
        flex: "0 1 320px",
        minWidth: 280,
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        padding: 22,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "6px 11px",
          borderRadius: 999,
          border: "1px solid rgba(59,130,246,.35)",
          background: "rgba(59,130,246,.1)",
          color: colors.purple2,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        <Bell size={13} />
        New Opportunity
      </div>

      <div style={{ fontWeight: 700, fontSize: 13, marginTop: 12, color: colors.purple2 }}>
        {isInternship ? "💼 Internship" : "🏆 Hackathon"}
      </div>
      <div style={{ fontWeight: 800, fontSize: 18, marginTop: 4 }}>
        {item.title}
      </div>
      <div style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
        {item.organization}
      </div>
      <div style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>
        📍 {item.location || item.city || "Location TBA"}
      </div>
      {item.deadline ? (
        <div style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
          {isInternship ? "Apply by: " : "Registration: "}
          {formatDate(item.deadline)}
        </div>
      ) : null}

      <span
        style={{
          color: colors.purple2,
          padding: "12px 0 0",
          fontWeight: 700,
          fontSize: 14,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        View Opportunity <ArrowRight size={15} />
      </span>
    </aside>
  );
}
