"use client";

import { GroupMember, honorTier, initials, AVATAR_PALETTE, Tier } from "@/features/groups/types";

interface Props {
  members: GroupMember[];
  myId: string;
  myAppliedCount: number;
}

const MEDALS: Record<number, string> = { 1: "①", 2: "②", 3: "③" };
const MEDAL_COLORS: Record<number, string> = { 1: "#e8b923", 2: "#9ca3af", 3: "#c87f4a" };

const TIER_STYLES: Record<Tier, { color: string; bg: string }> = {
  Sentinel: { color: "var(--accent)", bg: "var(--accent-soft)" },
  Scout:    { color: "var(--mint)",   bg: "var(--mint-bg)" },
  Lookout:  { color: "var(--amber)",  bg: "rgba(177,112,10,0.12)" },
  Recruit:  { color: "var(--text)",   bg: "var(--track)" },
};

export default function Leaderboard({ members, myId, myAppliedCount }: Props) {
  const maxHonor = Math.max(...members.map((m) => m.honor ?? 0), 1);
  const sorted = [...members].sort((a, b) => (b.honor ?? 0) - (a.honor ?? 0));

  const myStreakDays = 6; // static demo value

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 11px" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>Ranked by honor</span>
        <span style={{ fontSize: 12, color: "var(--text2)" }}>resets in 3d</span>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "var(--shadow)",
        }}
      >
        {sorted.map((m, i) => {
          const rank = i + 1;
          const tier = honorTier(m.honor ?? 0);
          const tc = TIER_STYLES[tier];
          const honor = m.honor ?? 0;
          const pct = Math.round((honor / maxHonor) * 100);
          const isMe = m.user_id === myId;
          const barColor = MEDAL_COLORS[rank] ?? "var(--accent)";
          const palette = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
          const bg = m.bg ?? palette.bg;
          const fg = m.fg ?? palette.fg;
          const name = m.name ?? "Member";

          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderBottom: "1px solid var(--border)",
                background: isMe ? "var(--accent-soft)" : "transparent",
              }}
            >
              {/* Rank */}
              <div
                style={{
                  flexShrink: 0,
                  width: 24,
                  textAlign: "center",
                  fontFamily: "var(--font-dm-serif)",
                  fontSize: 15,
                  color: MEDAL_COLORS[rank] ?? "var(--text3)",
                }}
              >
                {MEDALS[rank] ?? String(rank)}
              </div>

              {/* Avatar */}
              <div
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: bg,
                  color: fg,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {initials(name)}
              </div>

              {/* Name + bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{isMe ? "You" : name}</span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: tc.color,
                      background: tc.bg,
                      padding: "2px 7px",
                      borderRadius: 999,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {tier}
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 3, background: "var(--track)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      borderRadius: 3,
                      background: barColor,
                      transition: "width .5s",
                    }}
                  />
                </div>
              </div>

              {/* Honor */}
              <div style={{ flexShrink: 0, textAlign: "right", lineHeight: 1.1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                  <span style={{ color: "var(--amber)", fontSize: 11 }}>★</span>
                  <span style={{ fontFamily: "var(--font-dm-serif)", fontSize: 17 }}>
                    {honor.toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 2 }}>
                  {m.interactions ?? 0} interactions
                </div>
              </div>
            </div>
          );
        })}

        <div style={{ padding: "11px 16px", textAlign: "center", fontSize: 12, color: "var(--text2)" }}>
          You&apos;re{" "}
          <span style={{ color: "var(--accent)", fontWeight: 700 }}>
            {sorted.findIndex((m) => m.user_id === myId) + 1}
            {["st", "nd", "rd"][sorted.findIndex((m) => m.user_id === myId)] ?? "th"}
          </span>{" "}
          — keep checking in to climb
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <div
          style={{
            flex: 1,
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: 16,
            padding: "14px 15px",
            boxShadow: "var(--shadow)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600, marginBottom: 6 }}>
            🔥 Your streak
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontFamily: "var(--font-dm-serif)", fontSize: 24 }}>{myStreakDays}</span>
            <span style={{ fontSize: 11.5, color: "var(--text2)" }}>days</span>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: 16,
            padding: "14px 15px",
            boxShadow: "var(--shadow)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600, marginBottom: 6 }}>
            ✓ Applied this week
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontFamily: "var(--font-dm-serif)", fontSize: 24, color: "var(--mint)" }}>
              {myAppliedCount}
            </span>
            <span style={{ fontSize: 11.5, color: "var(--text2)" }}>jobs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
