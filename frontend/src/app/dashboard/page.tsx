"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import WatchTowerLogo from "@/features/groups/components/WatchTowerLogo";
import MemberAvatar from "@/features/groups/components/MemberAvatar";
import { honorTier, initials, AVATAR_PALETTE } from "@/features/groups/types";

// ─── Seed data (replace with API calls once backend is wired) ────────────────

const ME = { name: "Alex Rivera", honor: 720, streak: 6, interactions: 11, bg: "#c4b5fd", fg: "#2a1a52" };

const GROUPS = [
  {
    id: "g1",
    name: "Job Hunt Crew",
    members: [
      { name: "Maya Chen",   bg: "#f9a8d4", fg: "#4a1733" },
      { name: "Devin Park",  bg: "#7dd3fc", fg: "#0c2a3a" },
      { name: "Alex Rivera", bg: "#c4b5fd", fg: "#2a1a52" },
      { name: "Sam Okafor",  bg: "#6ee7b7", fg: "#0a3326" },
      { name: "Jordan Lee",  bg: "#fcd34d", fg: "#422f06" },
    ],
    pageCount: 7,
    myRank: 3,
  },
  {
    id: "g2",
    name: "YC Batch 2026",
    members: [
      { name: "Priya Shah",  bg: "#fca5a5", fg: "#4a1010" },
      { name: "Alex Rivera", bg: "#c4b5fd", fg: "#2a1a52" },
      { name: "Chris Lam",   bg: "#a5f3fc", fg: "#0c2a30" },
    ],
    pageCount: 4,
    myRank: 1,
  },
];

const MY_APPLICATIONS = [
  { id: "a1", company: "Anthropic",  group: "Job Hunt Crew", appliedAt: "2026-06-25", url: "anthropic.com/jobs" },
  { id: "a2", company: "Vercel",     group: "Job Hunt Crew", appliedAt: "2026-06-24", url: "vercel.com/careers" },
  { id: "a3", company: "Linear",     group: "YC Batch 2026", appliedAt: "2026-06-22", url: "linear.app/careers" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ flex: 1, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "16px 18px", boxShadow: "var(--shadow)", minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontFamily: "var(--font-dm-serif)", fontSize: 30, color: color ?? "var(--text)" }}>{value}</span>
        {sub && <span style={{ fontSize: 12, color: "var(--text2)" }}>{sub}</span>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const tier = honorTier(ME.honor);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Top nav ── */}
      <header style={{ borderBottom: "1px solid var(--border)", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <WatchTowerLogo size={24} />
          <span style={{ fontFamily: "var(--font-dm-serif)", fontSize: 16, letterSpacing: "-0.01em" }}>Watch Tower</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
            style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface2)", border: "1.5px solid var(--border)", cursor: "pointer", fontSize: 13, color: "var(--text3)", display: "grid", placeItems: "center" }}
            aria-label="Toggle theme"
          >
            {theme === "light" ? "☀" : "☾"}
          </button>
          <MemberAvatar initials={initials(ME.name)} bg={ME.bg} fg={ME.fg} size={30} />
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-dm-serif)", fontSize: 26, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
            Hey, {ME.name.split(" ")[0]} 👋
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--text3)", margin: 0 }}>Here&apos;s what&apos;s happening with your crew.</p>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 36, flexWrap: "wrap" }}>
          <StatCard label="🔥 Streak" value={ME.streak} sub="days" />
          <StatCard label="★ Honor" value={ME.honor.toLocaleString()} sub={tier} color="var(--accent)" />
          <StatCard label="✓ Applied" value={MY_APPLICATIONS.length} sub="total" color="var(--mint)" />
          <StatCard label="◎ Check-ins" value={ME.interactions} sub="this week" />
        </div>

        {/* ── Groups ── */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "var(--font-dm-serif)", fontSize: 20, letterSpacing: "-0.01em", margin: 0 }}>Your crews</h2>
            <button
              style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
              onClick={() => {}}
            >
              + New crew
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {GROUPS.map(g => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, boxShadow: "var(--shadow)", transition: "background .15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--surface)")}
              >
                {/* Name + members */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 7 }}>{g.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex" }}>
                      {g.members.slice(0, 4).map((m, i) => (
                        <MemberAvatar key={i} initials={initials(m.name)} bg={m.bg} fg={m.fg} size={20} overlap={i > 0} border="var(--surface)" />
                      ))}
                      {g.members.length > 4 && (
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--surface3)", color: "var(--text3)", display: "grid", placeItems: "center", fontSize: 8, fontWeight: 700, marginLeft: -5, border: "2px solid var(--surface)" }}>
                          +{g.members.length - 4}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>{g.members.length} members · {g.pageCount} pages</span>
                  </div>
                </div>

                {/* Rank badge */}
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 2 }}>Your rank</div>
                  <div style={{ fontFamily: "var(--font-dm-serif)", fontSize: 20, color: g.myRank === 1 ? "#e8b923" : g.myRank === 2 ? "#9ca3af" : "var(--text)" }}>
                    {["①","②","③","④","⑤"][g.myRank - 1] ?? `#${g.myRank}`}
                  </div>
                </div>

                <span style={{ color: "var(--text3)", fontSize: 16, flexShrink: 0 }}>→</span>
              </Link>
            ))}

            {/* Join a crew */}
            <button
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "14px 18px", border: "1.5px dashed var(--border)", borderRadius: 16, background: "transparent", color: "var(--text3)", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <span style={{ fontSize: 16 }}>+</span> Join a crew with a code
            </button>
          </div>
        </section>

        {/* ── My Applications ── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "var(--font-dm-serif)", fontSize: 20, letterSpacing: "-0.01em", margin: 0 }}>My applications</h2>
            <span style={{ fontSize: 12, color: "var(--text2)" }}>{MY_APPLICATIONS.length} total</span>
          </div>

          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow)" }}>
            {MY_APPLICATIONS.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text3)", fontSize: 14 }}>
                No applications yet. Mark pages as applied inside a crew.
              </div>
            ) : (
              MY_APPLICATIONS.map((app, i) => (
                <div
                  key={app.id}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < MY_APPLICATIONS.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  {/* Status dot */}
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mint)", flexShrink: 0 }} />

                  {/* Company + group */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{app.company}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{app.group}</div>
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: 12, color: "var(--text2)", flexShrink: 0 }}>{formatDate(app.appliedAt)}</div>

                  {/* Link */}
                  <a
                    href={`https://${app.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "var(--accent)", flexShrink: 0 }}
                  >
                    ↗
                  </a>
                </div>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
