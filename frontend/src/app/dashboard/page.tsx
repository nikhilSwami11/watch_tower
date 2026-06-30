"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import WatchTowerLogo from "@/features/groups/components/WatchTowerLogo";
import MemberAvatar from "@/features/groups/components/MemberAvatar";
import { initials, AVATAR_PALETTE } from "@/features/groups/types";
import type { Group } from "@/features/groups/types";
import { api, getUser, isLoggedIn, clearToken } from "@/lib/api";

interface GroupWithCount extends Group {
  memberCount: number;
}

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

export default function DashboardPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [groups, setGroups] = useState<GroupWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const loadGroups = useCallback(async () => {
    const { groups: raw } = await api.get<{ groups: Group[] }>("/groups");
    const withCounts = await Promise.all(
      raw.map(async (g) => {
        try {
          const { members } = await api.get<{ members: unknown[] }>(`/groups/${g.id}/members`);
          return { ...g, memberCount: members.length };
        } catch {
          return { ...g, memberCount: 0 };
        }
      })
    );
    setGroups(withCounts);
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const stored = getUser();
    if (stored) setUser(stored);
    loadGroups().finally(() => setLoading(false));
  }, [router, loadGroups]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError("");
    setJoining(true);
    try {
      const { group } = await api.post<{ group: Group }>("/groups/join", { invite_code: joinCode.trim() });
      router.push(`/groups/${group.id}`);
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : "Failed to join");
      setJoining(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const group = await api.post<Group>("/groups", { name: newGroupName.trim() });
      router.push(`/groups/${group.id}`);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create");
      setCreating(false);
    }
  }

  function handleSignOut() {
    clearToken();
    router.push("/");
  }

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const totalMembers = groups.reduce((sum, g) => sum + g.memberCount, 0);

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
          <button
            onClick={handleSignOut}
            style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", background: "none", border: "none", cursor: "pointer", padding: "5px 8px" }}
          >
            Sign out
          </button>
          {user && (
            <MemberAvatar initials={initials(user.name)} bg={AVATAR_PALETTE[0].bg} fg={AVATAR_PALETTE[0].fg} size={30} />
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-dm-serif)", fontSize: 26, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
            Hey, {firstName}
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--text3)", margin: 0 }}>Here&apos;s what&apos;s happening with your crew.</p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 10, marginBottom: 36, flexWrap: "wrap" }}>
          <StatCard label="Crews" value={loading ? "–" : groups.length} sub="joined" />
          <StatCard label="Crew members" value={loading ? "–" : totalMembers} sub="total" color="var(--accent)" />
        </div>

        {/* ── Groups ── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "var(--font-dm-serif)", fontSize: 20, letterSpacing: "-0.01em", margin: 0 }}>Your crews</h2>
            <button
              onClick={() => { setShowCreate(v => !v); setShowJoin(false); setCreateError(""); }}
              style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
            >
              + New crew
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <form onSubmit={handleCreate} style={{ marginBottom: 12, display: "flex", gap: 8 }}>
              <input
                autoFocus
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="Crew name"
                style={{ flex: 1, fontFamily: "inherit", fontSize: 14, padding: "10px 13px", borderRadius: 11, border: "1.5px solid var(--accent)", background: "var(--surface2)", color: "var(--text)", outline: "none" }}
              />
              <button
                type="submit"
                disabled={creating || !newGroupName.trim()}
                style={{ height: 42, padding: "0 18px", borderRadius: 11, background: "var(--accent)", color: "var(--accent-text)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", opacity: creating ? 0.7 : 1 }}
              >
                {creating ? "Creating…" : "Create"}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ height: 42, padding: "0 14px", borderRadius: 11, background: "var(--surface)", color: "var(--text2)", fontFamily: "inherit", fontSize: 13, fontWeight: 600, border: "1.5px solid var(--border)", cursor: "pointer" }}>
                Cancel
              </button>
            </form>
          )}
          {createError && <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--rose)" }}>{createError}</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {loading ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text3)", fontSize: 14 }}>Loading…</div>
            ) : (
              <>
                {groups.length === 0 && !showCreate && (
                  <div style={{ padding: "32px 20px", textAlign: "center", border: "1.5px dashed var(--border)", borderRadius: 16, color: "var(--text3)", fontSize: 14 }}>
                    No crews yet — create one or join with an invite code.
                  </div>
                )}

                {groups.map(g => (
                  <Link
                    key={g.id}
                    href={`/groups/${g.id}`}
                    style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, boxShadow: "var(--shadow)", transition: "background .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--surface)")}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>
                        {g.memberCount} {g.memberCount === 1 ? "member" : "members"}
                      </div>
                    </div>
                    <span style={{ color: "var(--text3)", fontSize: 16, flexShrink: 0 }}>→</span>
                  </Link>
                ))}
              </>
            )}

            {/* Join a crew */}
            <button
              onClick={() => { setShowJoin(v => !v); setShowCreate(false); setJoinError(""); setJoinCode(""); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "14px 18px", border: "1.5px dashed var(--border)", borderRadius: 16, background: "transparent", color: "var(--text3)", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <span style={{ fontSize: 16 }}>+</span> Join a crew with a code
            </button>
          </div>

          {/* Join form */}
          {showJoin && (
            <form onSubmit={handleJoin} style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <input
                autoFocus
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                placeholder="Invite code"
                style={{ flex: 1, fontFamily: "var(--font-geist-mono)", fontSize: 14, padding: "10px 13px", borderRadius: 11, border: "1.5px solid var(--accent)", background: "var(--surface2)", color: "var(--text)", outline: "none" }}
              />
              <button
                type="submit"
                disabled={joining || !joinCode.trim()}
                style={{ height: 42, padding: "0 18px", borderRadius: 11, background: "var(--accent)", color: "var(--accent-text)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", opacity: joining ? 0.7 : 1 }}
              >
                {joining ? "Joining…" : "Join"}
              </button>
              <button type="button" onClick={() => setShowJoin(false)} style={{ height: 42, padding: "0 14px", borderRadius: 11, background: "var(--surface)", color: "var(--text2)", fontFamily: "inherit", fontSize: 13, fontWeight: 600, border: "1.5px solid var(--border)", cursor: "pointer" }}>
                Cancel
              </button>
            </form>
          )}
          {joinError && <p style={{ marginTop: 8, fontSize: 13, color: "var(--rose)" }}>{joinError}</p>}
        </section>

      </main>
    </div>
  );
}
