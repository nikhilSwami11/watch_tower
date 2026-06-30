"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import WatchTowerLogo from "@/features/groups/components/WatchTowerLogo";
import MemberAvatar from "@/features/groups/components/MemberAvatar";
import CareerPageRow, { PageRowData } from "@/features/careerpages/components/CareerPageRow";
import AddPageModal from "@/features/careerpages/components/AddPageModal";
import Leaderboard from "@/features/careerpages/components/Leaderboard";
import { GroupMember, honorTier, initials, AVATAR_PALETTE } from "@/features/groups/types";
import type { Group } from "@/features/groups/types";
import type { CareerPage } from "@/features/careerpages/types";
import { api, getUser, isLoggedIn, clearToken } from "@/lib/api";

interface ApiMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  role: "admin" | "member";
  name: string;
  email: string;
}

type Tab = "pages" | "board";

function toPageRowData(p: CareerPage): PageRowData {
  return {
    id: p.id,
    company: p.company,
    url: p.url,
    seenBy: p.viewed_by ?? [],
    appliedBy: p.applied_by ?? [],
  };
}

function withStats(members: GroupMember[], pages: PageRowData[]): GroupMember[] {
  return members.map((m) => {
    const viewed = pages.filter((p) => p.seenBy.includes(m.user_id)).length;
    const applied = pages.filter((p) => p.appliedBy.includes(m.user_id)).length;
    return { ...m, honor: viewed * 5 + applied * 15, interactions: viewed + applied };
  });
}

export default function GroupPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params?.groupId ?? "";
  const router = useRouter();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tab, setTab] = useState<Tab>("pages");
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pages, setPages] = useState<PageRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUser = getUser();
  const myId = currentUser?.id ?? "";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const load = useCallback(async () => {
    const [{ groups: allGroups }, { members: rawMembers }, { career_pages: rawPages }] = await Promise.all([
      api.get<{ groups: Group[] }>("/groups"),
      api.get<{ members: ApiMember[] }>(`/groups/${groupId}/members`),
      api.get<{ career_pages: CareerPage[] }>(`/groups/${groupId}/career-pages`),
    ]);

    setGroup(allGroups.find((g) => g.id === groupId) ?? null);
    setMembers(
      rawMembers.map((m, i) => ({
        id: m.id,
        group_id: m.group_id,
        user_id: m.user_id,
        joined_at: m.joined_at,
        role: m.role,
        name: m.name,
        ...AVATAR_PALETTE[i % AVATAR_PALETTE.length],
      }))
    );
    setPages(rawPages.map(toPageRowData));
  }, [groupId]);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    load()
      .catch(() => setLoadError("Failed to load group data"))
      .finally(() => setLoading(false));
  }, [router, load]);

  async function handleSeen(pageId: string) {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== pageId || p.seenBy.includes(myId)) return p;
        return { ...p, seenBy: [...p.seenBy, myId] };
      })
    );
    try { await api.post(`/groups/${groupId}/career-pages/${pageId}/viewed`, {}); } catch {}
  }

  async function handleApplied(pageId: string) {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== pageId || p.appliedBy.includes(myId)) return p;
        const seenBy = p.seenBy.includes(myId) ? p.seenBy : [...p.seenBy, myId];
        return { ...p, appliedBy: [...p.appliedBy, myId], seenBy };
      })
    );
    try { await api.post(`/groups/${groupId}/career-pages/${pageId}/applied`, {}); } catch {}
  }

  async function handleAdd(data: { url: string; company: string; label: string }) {
    try {
      const cp = await api.post<CareerPage>(`/groups/${groupId}/career-pages`, {
        url: data.url,
        label: data.label || data.company,
        company: data.company,
      });
      setPages((prev) => [toPageRowData(cp), ...prev]);
    } catch {}
  }

  function copyCode() {
    if (!group) return;
    try { navigator.clipboard.writeText(group.invite_code); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleSignOut() {
    clearToken();
    router.push("/");
  }

  const membersWithStats = withStats(members, pages);
  const me = membersWithStats.find((m) => m.user_id === myId);
  const myHonor = me?.honor ?? 0;
  const myAppliedCount = pages.filter((p) => p.appliedBy.includes(myId)).length;

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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", placeItems: "center" }}>
        <span style={{ color: "var(--text3)", fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  if (loadError || !group) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--rose)", fontSize: 14, marginBottom: 12 }}>{loadError || "Group not found"}</p>
          <Link href="/dashboard" style={{ fontSize: 13, color: "var(--accent)" }}>← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", paddingBottom: 90, background: "var(--bg)", transition: "background .3s" }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 660, margin: "0 auto", padding: "0 22px", color: "var(--text)" }}>

        {/* ── Header ── */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0 20px" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", color: "inherit" }}>
            <WatchTowerLogo size={30} />
            <span style={{ fontFamily: "var(--font-dm-serif)", fontSize: 17, letterSpacing: "-0.01em" }}>Watch Tower</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              style={{ display: "flex", alignItems: "center", gap: 7, height: 34, padding: "0 5px 0 12px", borderRadius: 999, background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text2)", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 500, boxShadow: "var(--shadow)" }}
            >
              <span>{theme === "light" ? "Light" : "Dark"}</span>
              <span style={{ display: "grid", placeItems: "center", width: 22, height: 22, borderRadius: "50%", background: "var(--accent-soft)", fontSize: 12 }}>
                {theme === "light" ? "☀" : "☾"}
              </span>
            </button>
            <button
              onClick={handleSignOut}
              style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", background: "none", border: "none", cursor: "pointer", padding: "5px 8px" }}
            >
              Sign out
            </button>
            {me && (
              <MemberAvatar
                initials={initials(me.name ?? currentUser?.name ?? "?")}
                bg={me.bg ?? AVATAR_PALETTE[0].bg}
                fg={me.fg ?? AVATAR_PALETTE[0].fg}
                size={32}
              />
            )}
          </div>
        </header>

        {/* ── Group bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: "0 0 8px", fontFamily: "var(--font-dm-serif)", fontSize: 28, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {group.name}
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
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 13, background: "var(--surface)", border: "1.5px solid var(--border)", boxShadow: "var(--shadow)", flexShrink: 0 }}>
            <span style={{ color: "var(--amber)", fontSize: 13 }}>★</span>
            <div style={{ lineHeight: 1.05 }}>
              <div style={{ fontFamily: "var(--font-dm-serif)", fontSize: 15, fontWeight: 700 }}>{myHonor.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>honor · {honorTier(myHonor)}</div>
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
          <div style={{ display: "inline-flex", padding: 3, gap: 2, background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 999 }}>
            <button onClick={() => setTab("pages")} style={tabBtnStyle(tab === "pages")}>Pages</button>
            <button onClick={() => setTab("board")} style={tabBtnStyle(tab === "board")}>Leaderboard</button>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            style={{ height: 36, padding: "0 15px", borderRadius: 999, background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer", boxShadow: "var(--shadow)" }}
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
                myId={myId}
                members={members}
                onSeen={() => handleSeen(page.id)}
                onApplied={() => handleApplied(page.id)}
              />
            ))}
            {pages.length === 0 && (
              <div style={{ padding: "32px 20px", textAlign: "center", border: "1.5px dashed var(--border)", borderRadius: 16, color: "var(--text3)", fontSize: 14 }}>
                No pages yet — track the first one!
              </div>
            )}
            <button
              onClick={() => setAddOpen(true)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 16px", border: "1.5px dashed var(--border)", borderRadius: 14, background: "transparent", color: "var(--text3)", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <span style={{ fontSize: 15, lineHeight: "0" }}>+</span> Track a new page
            </button>
          </div>
        )}

        {/* ── Leaderboard tab ── */}
        {tab === "board" && (
          <Leaderboard members={membersWithStats} myId={myId} myAppliedCount={myAppliedCount} />
        )}
      </div>

      {/* ── Modals ── */}
      {addOpen && <AddPageModal onClose={() => setAddOpen(false)} onAdd={handleAdd} />}

      {inviteOpen && (
        <div
          onClick={() => setInviteOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(10,10,12,0.45)", backdropFilter: "blur(7px)", display: "grid", placeItems: "center", padding: 22 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 360, color: "var(--text)", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 22, boxShadow: "0 24px 70px rgba(0,0,0,0.22)", overflow: "hidden" }}
          >
            <div style={{ padding: "22px 22px 0" }}>
              <h3 style={{ margin: "0 0 4px", fontFamily: "var(--font-dm-serif)", fontSize: 20, letterSpacing: "-0.01em" }}>Invite to the crew</h3>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--text3)" }}>Anyone with this code can join</p>
            </div>
            <div style={{ padding: "16px 22px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface2)", border: "1.5px dashed var(--border)", borderRadius: 13, padding: "13px 15px" }}>
                <span style={{ flex: 1, fontFamily: "var(--font-geist-mono)", fontSize: 18, fontWeight: 600, letterSpacing: "0.13em" }}>
                  {group.invite_code}
                </span>
                <button
                  onClick={copyCode}
                  style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "7px 13px", borderRadius: 999, cursor: "pointer", transition: "all .15s", color: copied ? "var(--mint)" : "var(--accent-text)", background: copied ? "var(--mint-bg)" : "var(--accent)", border: `1.5px solid ${copied ? "var(--mint)" : "var(--accent)"}` }}
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
