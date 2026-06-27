"use client";

interface Props {
  initials: string;
  bg: string;
  fg: string;
  size?: number;
  overlap?: boolean;
  border?: string;
}

export default function MemberAvatar({
  initials,
  bg,
  fg,
  size = 22,
  overlap = false,
  border = "var(--bg)",
}: Props) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: fg,
        display: "grid",
        placeItems: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        flexShrink: 0,
        ...(overlap
          ? { marginLeft: -Math.round(size * 0.27), border: `2px solid ${border}` }
          : {}),
      }}
    >
      {initials}
    </div>
  );
}
