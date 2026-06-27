export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  role: "admin" | "member";
  name?: string;
  initials?: string;
  bg?: string;
  fg?: string;
  honor?: number;
  interactions?: number;
}

export type Tier = "Recruit" | "Lookout" | "Scout" | "Sentinel";

export function honorTier(honor: number): Tier {
  if (honor >= 1000) return "Sentinel";
  if (honor >= 600) return "Scout";
  if (honor >= 300) return "Lookout";
  return "Recruit";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

// Fixed pastel palette for member avatars (cycled by index)
export const AVATAR_PALETTE: Array<{ bg: string; fg: string }> = [
  { bg: "#c4b5fd", fg: "#2a1a52" },
  { bg: "#f9a8d4", fg: "#4a1733" },
  { bg: "#7dd3fc", fg: "#0c2a3a" },
  { bg: "#6ee7b7", fg: "#0a3326" },
  { bg: "#fcd34d", fg: "#422f06" },
  { bg: "#fca5a5", fg: "#4a1010" },
  { bg: "#a5f3fc", fg: "#0c2a30" },
];
