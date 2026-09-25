import type { CSSProperties, Dispatch, SetStateAction } from "react";
import {
  BRANCH_EXAMPLES,
  CONNECT_INTERESTS,
  CONNECT_SKILLS,
  COUNTRIES,
  DEFAULT_COUNTRY,
  INDIAN_STATES,
  SENIOR_HELP_AREAS,
  YEARS,
} from "./constants";
import type { AppStudentProfile, ThemeColors } from "./types";

type Props = {
  profile: AppStudentProfile;
  setProfile: Dispatch<SetStateAction<AppStudentProfile>>;
  colors: ThemeColors;
  verifiedSenior?: boolean;
};

function Chip({
  label,
  active,
  onClick,
  colors,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  colors: ThemeColors;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${active ? colors.purple : colors.border}`,
        background: active ? "rgba(59,130,246,.15)" : colors.card2,
        color: active ? colors.purple2 : colors.muted,
        padding: "8px 11px",
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export default function ConnectProfileFields({
  profile,
  setProfile,
  colors,
  verifiedSenior,
}: Props) {
  const fieldLabel: CSSProperties = {
    display: "grid",
    gap: 8,
    color: colors.muted,
    fontSize: 13,
    fontWeight: 650,
    textAlign: "left",
  };
  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 9,
    border: `1px solid ${colors.inputBorder}`,
    background: colors.card2,
    color: colors.text,
    outline: "none",
    fontSize: 14,
  };

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  return (
    <div style={{ display: "grid", gap: 18, marginTop: 18, textAlign: "left" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        <label style={fieldLabel}>
          Country
          <select
            value={profile.country || DEFAULT_COUNTRY}
            onChange={(e) => setProfile({ ...profile, country: e.target.value })}
            style={inputStyle}
          >
            {COUNTRIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label style={fieldLabel}>
          State / UT
          <select
            value={profile.state}
            onChange={(e) => setProfile({ ...profile, state: e.target.value })}
            style={inputStyle}
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
        <label style={fieldLabel}>
          City (optional)
          <input
            value={profile.city}
            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            placeholder="Bengaluru"
            style={inputStyle}
          />
        </label>
        <label style={fieldLabel}>
          College
          <input
            value={profile.college}
            onChange={(e) => setProfile({ ...profile, college: e.target.value })}
            placeholder="Your college name"
            style={inputStyle}
          />
        </label>
        <label style={fieldLabel}>
          Branch
          <input
            value={profile.branch}
            onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
            placeholder="Example: ISE, CSE, ECE"
            list="gradivo-branches"
            style={inputStyle}
          />
          <datalist id="gradivo-branches">
            {BRANCH_EXAMPLES.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>
        <label style={fieldLabel}>
          Year
          <select
            value={profile.year}
            onChange={(e) => setProfile({ ...profile, year: e.target.value })}
            style={inputStyle}
          >
            <option value="">Select year</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label style={fieldLabel}>
        Short bio
        <textarea
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value.slice(0, 280) })}
          placeholder="What are you learning, building, or looking for?"
          rows={3}
          style={{ ...inputStyle, resize: "vertical", minHeight: 84 }}
        />
      </label>

      <div>
        <div style={fieldLabel}>Skills</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {CONNECT_SKILLS.map((skill) => (
            <Chip
              key={skill}
              label={skill}
              active={profile.skills.includes(skill)}
              colors={colors}
              onClick={() => setProfile({ ...profile, skills: toggle(profile.skills, skill) })}
            />
          ))}
        </div>
      </div>

      <div>
        <div style={fieldLabel}>Connect interests</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {CONNECT_INTERESTS.map((interest) => (
            <Chip
              key={interest}
              label={interest}
              active={profile.interests.includes(interest)}
              colors={colors}
              onClick={() =>
                setProfile({ ...profile, interests: toggle(profile.interests, interest) })
              }
            />
          ))}
        </div>
      </div>

      <label
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          color: colors.text,
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        <input
          type="checkbox"
          checked={profile.isSenior}
          onChange={(e) => setProfile({ ...profile, isSenior: e.target.checked })}
          style={{ marginTop: 4 }}
        />
        <span>
          I am open to helping juniors
          <div style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
            This lists you in Ask Seniors. A Verified Senior badge is only added after Gradivo
            reviews an account — you cannot self-verify.
          </div>
        </span>
      </label>

      {verifiedSenior ? (
        <div
          style={{
            border: "1px solid rgba(59,130,246,.35)",
            background: "rgba(59,130,246,.1)",
            color: colors.purple2,
            padding: "10px 12px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Verified Senior
        </div>
      ) : null}

      {profile.isSenior ? (
        <div>
          <div style={fieldLabel}>Areas you can help with</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {SENIOR_HELP_AREAS.map((area) => (
              <Chip
                key={area}
                label={area}
                active={profile.helpAreas.includes(area)}
                colors={colors}
                onClick={() =>
                  setProfile({ ...profile, helpAreas: toggle(profile.helpAreas, area) })
                }
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
