"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, setToken, setUser } from "@/lib/api";
import type { AuthResponse } from "@/features/auth/types";
import type { Group } from "@/features/groups/types";

export default function GoogleSignInButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !containerRef.current || !window.google) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        try {
          const res = await api.post<AuthResponse>("/auth/google", { credential });
          setToken(res.token);
          setUser(res.user);

          const pendingCode = sessionStorage.getItem("wt_pending_invite");
          if (pendingCode) {
            sessionStorage.removeItem("wt_pending_invite");
            try {
              const joined = await api.post<{ group: Group }>("/groups/join", { invite_code: pendingCode });
              router.push(`/groups/${joined.group.id}`);
              return;
            } catch {
              // invalid/expired code — fall through to dashboard
            }
          }

          router.push("/dashboard");
        } catch (err) {
          console.error("Google sign-in failed", err);
        }
      },
    });

    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      width: 350,
      text: "continue_with",
    });
  }, [router]);

  return <div ref={containerRef} />;
}
