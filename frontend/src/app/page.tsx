"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WatchTowerLogo from "@/features/groups/components/WatchTowerLogo";
import { isLoggedIn } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (isLoggedIn()) router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>

      {/* ── Nav ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <WatchTowerLogo size={26} />
          <span style={{ fontFamily: "var(--font-dm-serif)", fontSize: 16, letterSpacing: "-0.01em" }}>Watch Tower</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <button
            onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface2)", border: "1.5px solid var(--border)", cursor: "pointer", fontSize: 14, color: "var(--text2)", display: "grid", placeItems: "center" }}
            aria-label="Toggle theme"
          >
            {theme === "light" ? "☀" : "☾"}
          </button>
          <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", padding: "7px 15px", borderRadius: 999, border: "1.5px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow)" }}>
            Sign in
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "64px 24px 48px" }}>

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 13px", borderRadius: 999, border: "1.5px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow)", marginBottom: 32, fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>
          <span style={{ color: "var(--accent)", fontSize: 10 }}>●</span>
          Job hunting is better together
        </div>

        <h1 style={{ fontFamily: "var(--font-dm-serif)", fontSize: "clamp(52px, 10vw, 82px)", letterSpacing: "-0.035em", lineHeight: 0.97, margin: "0 0 24px", maxWidth: 680 }}>
          Apply with<br />friends.
        </h1>

        <p style={{ fontSize: 16, color: "var(--text2)", lineHeight: 1.65, maxWidth: 400, margin: "0 0 36px" }}>
          Share career pages, see who checked what, track applications together. Never let a good posting slip past your crew.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 48 }}>
          <Link
            href="/register"
            style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 46, padding: "0 26px", borderRadius: 999, background: "var(--accent)", color: "var(--accent-text)", fontSize: 14, fontWeight: 700, border: "1.5px solid var(--accent)", boxShadow: "0 2px 16px rgba(124,92,252,0.3)", fontFamily: "inherit" }}
          >
            Start a crew <span style={{ fontSize: 16 }}>→</span>
          </Link>
          <Link
            href="/login"
            style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 26px", borderRadius: 999, background: "var(--surface)", color: "var(--text)", fontSize: 14, fontWeight: 600, border: "1.5px solid var(--border)", boxShadow: "var(--shadow)", fontFamily: "inherit" }}
          >
            Join a crew
          </Link>
        </div>

        {/* Social proof */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 64 }}>
          <div style={{ display: "flex" }}>
            {[
              { bg: "#f9a8d4", fg: "#4a1733", i: "MC" },
              { bg: "#7dd3fc", fg: "#0c2a3a", i: "DP" },
              { bg: "#c4b5fd", fg: "#2a1a52", i: "AR" },
              { bg: "#6ee7b7", fg: "#0a3326", i: "SO" },
            ].map((av, idx) => (
              <div key={idx} style={{ width: 28, height: 28, borderRadius: "50%", background: av.bg, color: av.fg, display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, marginLeft: idx > 0 ? -7 : 0, border: "2px solid var(--bg)" }}>
                {av.i}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 13, color: "var(--text2)" }}>Crews are already hunting together</span>
        </div>

        {/* ── App preview card ── */}
        <div style={{ width: "100%", maxWidth: 580, border: "1.5px solid var(--border)", borderRadius: 20, background: "var(--surface)", boxShadow: "0 8px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden", textAlign: "left" }}>

          {/* Window chrome */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "var(--surface2)" }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div style={{ flex: 1, height: 22, borderRadius: 5, background: "var(--surface3)", display: "flex", alignItems: "center", paddingLeft: 10 }}>
              <span style={{ fontSize: 10.5, color: "var(--text3)", fontFamily: "var(--font-geist-mono)" }}>
                watchtower.app/groups/job-hunt-crew
              </span>
            </div>
          </div>

          {/* Group header */}
          <div style={{ padding: "16px 18px 13px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "var(--font-dm-serif)", fontSize: 19, letterSpacing: "-0.02em", marginBottom: 7 }}>
                  Job Hunt Crew
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {[
                    { bg: "#f9a8d4", fg: "#4a1733", init: "MC" },
                    { bg: "#7dd3fc", fg: "#0c2a3a", init: "DP" },
                    { bg: "#c4b5fd", fg: "#2a1a52", init: "AR" },
                    { bg: "#6ee7b7", fg: "#0a3326", init: "SO" },
                    { bg: "#fcd34d", fg: "#422f06", init: "JL" },
                  ].map((av, i) => (
                    <div key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: av.bg, color: av.fg, display: "grid", placeItems: "center", fontSize: 7, fontWeight: 700, marginLeft: i > 0 ? -6 : 0, border: "2px solid var(--surface)" }}>
                      {av.init}
                    </div>
                  ))}
                  <span style={{ fontSize: 11, color: "var(--text2)" }}>5 in the crew</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 11, background: "var(--surface2)", border: "1.5px solid var(--border)" }}>
                <span style={{ color: "var(--amber)", fontSize: 12 }}>★</span>
                <div>
                  <div style={{ fontFamily: "var(--font-dm-serif)", fontSize: 15, fontWeight: 700 }}>720</div>
                  <div style={{ fontSize: 9, color: "var(--text2)" }}>honor · Scout</div>
                </div>
              </div>
            </div>
          </div>

          {/* Career page rows */}
          <div style={{ padding: "10px 18px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { company: "Anthropic", seenBy: 3, appliedBy: 1, seenByMe: true, appliedByMe: true },
              { company: "Vercel",    seenBy: 2, appliedBy: 2, seenByMe: true, appliedByMe: true },
              { company: "Stripe",    seenBy: 2, appliedBy: 0, seenByMe: false, appliedByMe: false },
              { company: "Google",    seenBy: 0, appliedBy: 0, seenByMe: false, appliedByMe: false },
            ].map(item => (
              <div
                key={item.company}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", border: "1.5px solid var(--border)", borderRadius: 12, background: "var(--surface)" }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 700, color: item.seenByMe ? "var(--text2)" : "var(--text)" }}>
                  {item.company}
                  {item.appliedByMe && (
                    <span style={{ marginLeft: 8, fontSize: 10.5, color: "var(--mint)", fontWeight: 700 }}>Applied ✓</span>
                  )}
                </span>
                <div style={{ display: "flex", gap: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, border: "1.5px solid var(--border)", color: item.seenByMe ? "var(--text)" : "var(--text2)", background: item.seenByMe ? "var(--surface3)" : "transparent" }}>
                    ◎ {item.seenBy}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, border: `1.5px solid ${item.appliedByMe ? "var(--mint)" : "var(--border)"}`, color: item.appliedByMe ? "var(--mint)" : "var(--text2)", background: item.appliedByMe ? "var(--mint-bg)" : "transparent" }}>
                    ✓ {item.appliedBy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
