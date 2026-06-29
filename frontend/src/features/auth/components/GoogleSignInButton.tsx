"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import type { AuthResponse } from "@/features/auth/types";

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
      // Google calls this with a credential (ID token) once the user picks
      // their account. We forward it to our backend to verify and sign in.
      callback: async ({ credential }) => {
        try {
          const res = await api.post<AuthResponse>("/auth/google", { credential });
          setToken(res.token);
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
