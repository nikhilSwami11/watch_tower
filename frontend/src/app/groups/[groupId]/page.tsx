"use client";

import { useState, useEffect } from "react";
import WatchTowerLogo from "@/features/groups/components/WatchTowerLogo";
import MemberAvatar from "@/features/groups/components/MemberAvatar";
import CareerPageRow, { PageRowData } from "@/features/careerpages/components/CareerPageRow";
import AddPageModal from "@/features/careerpages/components/AddPageModal";
import Leaderboard from "@/features/careerpages/components/Leaderboard";
import { GroupMember, honorTier, initials, AVATAR_PALETTE } from "@/features/groups/types";

// ─── Seed data mirroring the design prototype ───────────────────────────────

const SEED_MEMBERS: GroupMember[] = [
  { id: "m1", user_id: "m_maya",   group_id: "g1", joined_at: "", role: "admin",  name: "Maya Chen",   honor: 1240, interactions: 18, bg: "#f9a8d4", fg: "#4a1733" },
  { id: "m2", user_id: "m_devin",  group_id: "g1", joined_at: "", role: "member", name: "Devin Park",  honor: 980,  interactions: 15, bg: "#7dd3fc", fg: "#0c2a3a" },
  { id: "m3", user_id: "me",       group_id: "g1", joined_at: "", role: "member", name: "Alex Rivera", honor: 720,  interactions: 11, bg: "#c4b5fd", fg: "#2a1a52" },
  { id: "m4", user_id: "m_sam",    group_id: "g1", joined_at: "", role: "member", name: "Sam Okafor",  honor: 540,  interactions: 8,  bg: "#6ee7b7", fg: "#0a3326" },
  { id: "m5", user_id: "m_jordan", group_id: "g1", joined_at: "", role: "member", name: "Jordan Lee",  honor: 210,  interactions: 3,  bg: "#fcd34d", fg: "#422f06" },
];

const SEED_PAGES: PageRowData[] = [
  { id: "p1", company: "Anthropic", url: "anthropic.com/jobs?team=eng&loc=sf",       seenBy: ["m_maya","m_devin","me"], appliedBy: ["me"] },
  { id: "p2", company: "Amazon",    url: "amazon.jobs/search?q=sde+ii&loc=seattle",  seenBy: ["m_maya"],               appliedBy: [] },
  { id: "p3", company: "Vercel",    url: "vercel.com/careers?q=fullstack&remote=1",  seenBy: ["m_devin","me"],          appliedBy: ["me","m_sam"] },
  { id: "p4", company: "Google",    url: "google.com/about/careers?q=swe+iii",       seenBy: [],                       appliedBy: [] },
  { id: "p5", company: "Datadog",   url: "careers.datadoghq.com?role=senior-swe",    seenBy: ["m_jordan"],             appliedBy: [] },
  { id: "p6", company: "Stripe",    url: "stripe.com/jobs/search?q=backend",         seenBy: ["m_maya","m_sam"],       appliedBy: [] },
  { id: "p7", company: "Figma",     url: "figma.com/careers?team=product-eng",       seenBy: [],                       appliedBy: [] },
];

const MY_ID = "me";
const GROUP_NAME = "Job Hunt Crew";
const INVITE_CODE = "WTWR-7Q2X";

type Tab = "pages" | "board";

export default function GroupPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tab, setTab] = useState<Tab>("pages");
  const [members, setMembers] = useState<GroupMember[]>(SEED_MEMBERS);
  const [pages, setPages] = useState<PageRowData[]>(SEED_PAGES);
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync theme to html element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const me = members.find((m) => m.user_id === MY_ID)!;
  const myHonor = me?.honor ?? 0;
  const myTier = honorTier(myHonor);
  const myAppliedCount = pages.filter((p) => p.appliedBy.includes(MY_ID)).length;

  function bumpHonor(delta: number) {
    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === MY_ID
          ? { ...m, honor: (m.honor ?? 0) + delta, interactions: (m.interactions ?? 0) + 1 }
          : m
      )
    );
  }

  function handleSeen(id: string) {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const wasSeen = p.seenBy.includes(MY_ID);
        const seenBy = wasSeen ? p.seenBy.filter((x) => x !== MY_ID) : [...p.seenBy, MY_ID];
        if (!wasSeen) bumpHonor(5);
        return { ...p, seenBy };
      })
    );
  }

  function handleApplied(id: string) {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const wasApplied = p.appliedBy.includes(MY_ID);
        const appliedBy = wasApplied ? p.appliedBy.filter((x) => x !== MY_ID) : [...p.appliedBy, MY_ID];
        const seenBy = p.seenBy.includes(MY_ID) ? p.seenBy : [...p.seenBy, MY_ID];
        if (!wasApplied) bumpHonor(15);
        return { ...p, appliedBy, seenBy };
      })
    );
  }

  function handleAdd(data: { url: string; company: string; label: string }) {
    const newPage: PageRowData = {
      id: `p_${Date.now()}`,
      company: data.company,
      url: data.url.replace(/^https?:\/\//, ""),
      seenBy: [],
      appliedBy: [],
    };
    setPages((prev) => [newPage, ...prev]);
  }

  function copyCode() {
    try { navigator.clipboard.writeText(INVITE_CODE); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 600,
    padding: "7px 17px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    transition: "all .18s",
    background: active ? "var(--surface)" : "transparent",
    color: active ? "var(--text)" : "var(--text2)",
    boxShadow: active ? "var(--shadow)" : "none",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        paddingBottom: 90,
        background: "var(--bg)",
        transition: "background .3s",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 660,
          margin: "0 auto",
          padding: "0 22px",
          color: "var(--text)",
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 0 20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <WatchTowerLogo size={30} />
            <span
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontSize: 17,
                letterSpacing: "-0.01em",
              }}
            >
              Watch Tower
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                height: 34,
                padding: "0 5px 0 12px",
                borderRadius: 999,
                background: "var(--surface)",
                border: "1.5px solid var(--border)",
                color: "var(--text2)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 500,
                boxShadow: "var(--shadow)",
              }}
            >
              <span>{theme === "light" ? "Light" : "Dark"}</span>
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "var(--accent-soft)",
                  fontSize: 12,
                }}
              >
                {theme === "light" ? "☀" : "☾"}
              </span>
            </button>

            <MemberAvatar
              initials={initials(me?.name ?? "AR")}
              bg={me?.bg ?? AVATAR_PALETTE[2].bg}
              fg={me?.fg ?? AVATAR_PALETTE[2].fg}
              size={32}
            />
          </div>
        </header>

        {/* ── Group bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 22,
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 8px",
                fontFamily: "var(--font-dm-serif)",
                fontSize: 28,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              {GROUP_NAME}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {members.map((m, i) => (
                  <MemberAvatar
                    key={m.id}
                    initials={initials(m.name ?? "?")}
                    bg={m.bg ?? AVATAR_PALETTE[i % AVATAR_PALETTE.length].bg}
                    fg={m.fg ?? AVATAR_PALETTE[i % AVATAR_PALETTE.length].fg}
                    size={22}
                    overlap={i > 0}
                  />
                ))}
              </div>
              <span style={{ fontSize: 12.5, color: "var(--text3)" }}>{members.length} in the crew</span>
            </div>
          </div>

          {/* Honor widget */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 12px",
              borderRadius: 13,
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              boxShadow: "var(--shadow)",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "var(--amber)", fontSize: 13 }}>★</span>
            <div style={{ lineHeight: 1.05 }}>
              <div style={{ fontFamily: "var(--font-dm-serif)", fontSize: 15, fontWeight: 700 }}>
                {myHonor.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>honor · {myTier}</div>
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: 3,
              gap: 2,
              background: "var(--surface2)",
              border: "1.5px solid var(--border)",
              borderRadius: 999,
            }}
          >
            <button onClick={() => setTab("pages")} style={tabBtnStyle(tab === "pages")}>
              Pages
            </button>
            <button onClick={() => setTab("board")} style={tabBtnStyle(tab === "board")}>
              Leaderboard
            </button>
          </div>

          <button
            onClick={() => setInviteOpen(true)}
            style={{
              height: 36,
              padding: "0 15px",
              borderRadius: 999,
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              color: "var(--text2)",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "var(--shadow)",
            }}
          >
            Invite
          </button>
        </div>

        {/* ── Pages tab ── */}
        {tab === "pages" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {pages.map((page) => (
              <CareerPageRow
                key={page.id}
                page={page}
                myId={MY_ID}
                members={members}
                onSeen={() => handleSeen(page.id)}
                onApplied={() => handleApplied(page.id)}
              />
            ))}

            <button
              onClick={() => setAddOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: "12px 16px",
                border: "1.5px dashed var(--border)",
                borderRadius: 14,
                background: "transparent",
                color: "var(--text3)",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget;
                b.style.color = "var(--accent)";
                b.style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget;
                b.style.color = "var(--text3)";
                b.style.borderColor = "var(--border)";
              }}
            >
              <span style={{ fontSize: 15, lineHeight: "0" }}>+</span> Track a new page
            </button>
          </div>
        )}

        {/* ── Leaderboard tab ── */}
        {tab === "board" && (
          <Leaderboard members={members} myId={MY_ID} myAppliedCount={myAppliedCount} />
        )}
      </div>

      {/* ── Modals ── */}
      {addOpen && (
        <AddPageModal onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      )}

      {inviteOpen && (
        <div
          onClick={() => setInviteOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(10,10,12,0.45)",
            backdropFilter: "blur(7px)",
            display: "grid",
            placeItems: "center",
            padding: 22,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 360,
              color: "var(--text)",
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              borderRadius: 22,
              boxShadow: "0 24px 70px rgba(0,0,0,0.22)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "22px 22px 0" }}>
              <h3
                style={{
                  margin: "0 0 4px",
                  fontFamily: "var(--font-dm-serif)",
                  fontSize: 20,
                  letterSpacing: "-0.01em",
                }}
              >
                Invite to the crew
              </h3>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--text3)" }}>
                Anyone with this code can join
              </p>
            </div>
            <div style={{ padding: "16px 22px 22px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--surface2)",
                  border: "1.5px dashed var(--border)",
                  borderRadius: 13,
                  padding: "13px 15px",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 18,
                    fontWeight: 600,
                    letterSpacing: "0.13em",
                  }}
                >
                  {INVITE_CODE}
                </span>
                <button
                  onClick={copyCode}
                  style={{
                    fontFamily: "inherit",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "7px 13px",
                    borderRadius: 999,
                    cursor: "pointer",
                    transition: "all .15s",
                    color: copied ? "var(--mint)" : "var(--accent-text)",
                    background: copied ? "var(--mint-bg)" : "var(--accent)",
                    border: `1.5px solid ${copied ? "var(--mint)" : "var(--accent)"}`,
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
