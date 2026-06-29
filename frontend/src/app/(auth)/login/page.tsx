"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import WatchTowerLogo from "@/features/groups/components/WatchTowerLogo";
import GoogleSignInButton from "@/features/auth/components/GoogleSignInButton";
import { api, setToken } from "@/lib/api";
import type { AuthResponse } from "@/features/auth/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>("/auth/login", { email, password });
      setToken(res.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    fontFamily: "inherit",
    fontSize: 14,
    color: "var(--text)",
    background: "var(--surface2)",
    border: "1.5px solid var(--border)",
    borderRadius: 11,
    padding: "11px 14px",
    outline: "none",
    transition: "border-color .15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>

      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 36, width: "fit-content" }}>
          <WatchTowerLogo size={26} />
          <span style={{ fontFamily: "var(--font-dm-serif)", fontSize: 16, letterSpacing: "-0.01em", color: "var(--text)" }}>Watch Tower</span>
        </Link>

        <h1 style={{ fontFamily: "var(--font-dm-serif)", fontSize: 28, letterSpacing: "-0.02em", margin: "0 0 6px" }}>Welcome back</h1>
        <p style={{ fontSize: 13.5, color: "var(--text3)", margin: "0 0 28px" }}>Sign in to your crew account</p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: "var(--rose)", padding: "10px 14px", background: "rgba(192,20,60,0.08)", border: "1.5px solid var(--rose)", borderRadius: 9 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 6, height: 46, borderRadius: 999, background: "var(--accent)", color: "var(--accent-text)", fontFamily: "inherit", fontSize: 14, fontWeight: 700, border: "1.5px solid var(--accent)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 2px 12px rgba(124,92,252,0.25)", transition: "opacity .15s" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--text3)", whiteSpace: "nowrap" }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Google renders its own button into this component */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleSignInButton />
        </div>

        <p style={{ marginTop: 22, fontSize: 13, color: "var(--text3)", textAlign: "center" }}>
          No account?{" "}
          <Link href="/register" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
