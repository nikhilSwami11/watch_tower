"use client";

interface Props {
  size?: number;
}

export default function WatchTowerLogo({ size = 30 }: Props) {
  const inset = Math.round(size * 0.27);
  const dotSize = Math.round(size * 0.17);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "1.5px solid var(--accent)",
          borderRadius: Math.round(size * 0.27),
          transform: "rotate(45deg)",
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: inset,
          border: "1.5px solid var(--accent)",
          borderRadius: Math.round(size * 0.1),
          transform: "rotate(45deg)",
        }}
      />
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: "var(--accent)",
        }}
      />
    </div>
  );
}
