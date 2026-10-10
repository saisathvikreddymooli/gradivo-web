import { useState, type CSSProperties } from "react";

type UserAvatarProps = {
  photoURL?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export default function UserAvatar({ photoURL, name, size = 44, className, style }: UserAvatarProps) {
  const [failedPhotoURL, setFailedPhotoURL] = useState<string | null>(null);
  const initials = (name?.trim() || "Student")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const commonStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    ...style,
  };

  if (photoURL && failedPhotoURL !== photoURL) {
    return (
      <img
        className={className}
        src={photoURL}
        alt=""
        onError={() => setFailedPhotoURL(photoURL)}
        style={{ ...commonStyle, objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      className={className}
      aria-label={`${name?.trim() || "Student"} profile avatar`}
      style={{
        ...commonStyle,
        background: "rgba(59,130,246,.18)",
        color: "#a5b4fc",
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
        fontSize: Math.max(12, Math.round(size * 0.38)),
      }}
    >
      {initials}
    </div>
  );
}
