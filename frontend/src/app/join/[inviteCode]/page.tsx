"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import WatchTowerLogo from "@/features/groups/components/WatchTowerLogo";
import { api, isLoggedIn } from "@/lib/api";
import type { Group } from "@/features/groups/types";

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const inviteCode = params.inviteCode as string;
  const [error, setError] = useState("");

  useEffect(() => {
    if (!inviteCode) return;

    if (!isLoggedIn()) {
      sessionStorage.setItem("wt_pending_invite", inviteCode);
      router.replace("/login");
      return;
    }

    api.post<{ group: Group }>("/groups/join", { invite_code: inviteCode })
      .then(({ group }) => router.replace(`/groups/${group.id}`))
      .catch((err: Error) => {
        if (err.message.includes("already a member")) {
          // We don't know the group id here without another call, fall back to dashboard
          router.replace("/dashboard");
        } else {
          setError(err.message || "Invalid invite link.");
        }
      });
  }, [inviteCode, router]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
      <WatchTowerLogo size={38} />
      {error ? (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--rose)", marginBottom: 16 }}>{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
          >
            Go to dashboard →
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: "var(--text2)" }}>Joining the crew…</p>
      )}
    </div>
  );
}
