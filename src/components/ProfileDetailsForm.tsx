import type { Dispatch, SetStateAction } from "react";
import { LogOut } from "lucide-react";
import type { AppStudentProfile, ThemeColors } from "../connect/types";
import ConnectProfileFields from "../connect/ConnectProfileFields";
import UserAvatar from "./UserAvatar";

export type ProfileAccountInfo = {
  photoURL: string;
  email: string;
  providers: string[];
  memberSince: number | null;
  onLogout: () => void;
  loggingOut: boolean;
};

type ProfileDetailsFormProps = {
  colors: ThemeColors;
  profile: AppStudentProfile;
  setProfile: Dispatch<SetStateAction<AppStudentProfile>>;
  phone: string;
  onPhoneChange: (value: string) => void;
  email: string;
  verifiedSenior: boolean;
  /** Shown above the fields on the Profile page. Omitted in the onboarding modal. */
  account?: ProfileAccountInfo | null;
};

const PROVIDER_LABELS: Record<string, string> = {
  password: "Email",
  "google.com": "Google",
  "oidc.linkedin": "LinkedIn",
  phone: "Phone",
};

function formatMemberSince(millis: number | null): string {
  if (!millis) return "—";
  return new Date(millis).toLocaleDateString([], { year: "numeric", month: "long" });
}

/**
 * The single profile-details form used by both the Profile page and the
 * onboarding modal. All editable profile fields live here and are saved to
 * users/{uid} in Firestore — there is no second form.
 */
export default function ProfileDetailsForm({
  colors,
  profile,
  setProfile,
  phone,
  onPhoneChange,
  email,
  verifiedSenior,
  account = null,
}: ProfileDetailsFormProps) {
  const fieldLabel = {
    display: "grid" as const,
    gap: 8,
    color: colors.labelText,
    fontSize: 13,
    fontWeight: 650,
  };
  const inputStyle = {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 9,
    border: `1px solid ${colors.inputBorder}`,
    background: colors.inputBg,
    color: colors.text,
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box" as const,
  };
  const initials = (profile.name || email || "G").slice(0, 1).toUpperCase();

  return (
    <div>
      {account ? (
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            flexWrap: "wrap",
            padding: "4px 0 20px",
          }}
        >
          <UserAvatar photoURL={account.photoURL} name={profile.name || email || initials} size={60} style={{ color: colors.purple2 }} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{profile.name || "Student"}</div>
            {account.email ? (
              <div style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>{account.email}</div>
            ) : null}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
              {account.providers.length > 0 ? (
                account.providers.map((id) => (
                  <span
                    key={id}
                    style={{
                      fontSize: 11,
                      padding: "4px 9px",
                      borderRadius: 999,
                      background: "rgba(59,130,246,.12)",
                      color: colors.purple2,
                    }}
                  >
                    {PROVIDER_LABELS[id] ?? id}
                  </span>
                ))
              ) : null}
              <span style={{ fontSize: 11, color: colors.muted }}>
                Member since {formatMemberSince(account.memberSince)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={account.onLogout}
            disabled={account.loggingOut}
            style={{
              border: `1px solid ${colors.border}`,
              background: colors.card2,
              color: colors.text,
              padding: "9px 13px",
              borderRadius: 9,
              cursor: account.loggingOut ? "wait" : "pointer",
              fontWeight: 650,
              fontSize: 13,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <LogOut size={16} />
            {account.loggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
          gap: 17,
        }}
      >
        <label style={fieldLabel}>
          Full name
          <input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Your name"
            style={inputStyle}
          />
        </label>

        <label style={fieldLabel}>
          Email
          <input value={email} readOnly placeholder="Log in to sync email" style={inputStyle} />
        </label>

        <label style={fieldLabel}>
          Phone (optional)
          <input
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+91 98765 43210"
            inputMode="tel"
            style={inputStyle}
          />
        </label>
      </div>

      <ConnectProfileFields
        profile={profile}
        setProfile={setProfile}
        colors={colors}
        verifiedSenior={verifiedSenior}
      />
    </div>
  );
}
