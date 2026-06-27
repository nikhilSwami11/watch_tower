"use client";

import MemberAvatar from "@/features/groups/components/MemberAvatar";
import { AVATAR_PALETTE, GroupMember, initials } from "@/features/groups/types";

export interface PageRowData {
  id: string;
  company: string;
  url: string;
  seenBy: string[];
  appliedBy: string[];
}

interface Props {
  page: PageRowData;
  myId: string;
  members: GroupMember[];
  onSeen: () => void;
  onApplied: () => void;
}

function getMember(members: GroupMember[], id: string, idx: number): GroupMember {
  const m = members.find((m) => m.user_id === id);
  const palette = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
  return m ?? { id, user_id: id, group_id: "", joined_at: "", role: "member", ...palette };
}

function avatarsFor(ids: string[], members: GroupMember[]) {
  return ids.slice(0, 3).map((id, i) => {
    const m = getMember(members, id, i);
    return { initials: initials(m.name ?? "?"), bg: m.bg ?? "#ccc", fg: m.fg ?? "#000" };
  });
}

export default function CareerPageRow({ page, myId, members, onSeen, onApplied }: Props) {
  const seenByMe = page.seenBy.includes(myId);
  const appliedByMe = page.appliedBy.includes(myId);
  const seenAvatars = avatarsFor(page.seenBy, members);
  const appliedAvatars = avatarsFor(page.appliedBy, members);

  const btnBase: React.CSSProperties = {
    fontFamily: "inherit",
    fontSize: 11.5,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    padding: "4px 9px",
    borderRadius: 999,
    cursor: "pointer",
    border: "1.5px solid",
    transition: "all .15s",
  };

  const seenStyle: React.CSSProperties = seenByMe
    ? { ...btnBase, color: "var(--text2)", background: "var(--surface3)", borderColor: "var(--border)" }
    : { ...btnBase, color: "var(--text3)", background: "transparent", borderColor: "var(--border)" };

  const appliedStyle: React.CSSProperties = appliedByMe
    ? { ...btnBase, color: "var(--mint)", background: "var(--mint-bg)", borderColor: "var(--mint)" }
    : { ...btnBase, color: "var(--text3)", background: "transparent", borderColor: "var(--border)" };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "13px 15px",
        border: "1.5px solid var(--border)",
        borderRadius: 14,
        background: "var(--surface)",
        transition: "background .15s",
        cursor: "default",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "var(--surface2)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "var(--surface)")}
    >
      {/* Company name + link */}
      <a
        href={`https://${page.url}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: seenByMe ? "var(--text3)" : "var(--text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            transition: "color .2s",
          }}
        >
          {page.company}
        </span>
        <span style={{ flexShrink: 0, fontSize: 11, color: "var(--accent)", opacity: 0.8 }}>↗</span>
        {appliedByMe && (
          <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: "var(--mint)", whiteSpace: "nowrap" }}>
            Applied ✓
          </span>
        )}
      </a>

      {/* Interactions */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, flexShrink: 0 }}>
        {/* Seen */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {seenAvatars.map((av, i) => (
              <MemberAvatar key={i} initials={av.initials} bg={av.bg} fg={av.fg} size={16} overlap={i > 0} border="var(--surface)" />
            ))}
          </div>
          <button onClick={onSeen} style={seenStyle}>
            ◎ {page.seenBy.length}
          </button>
        </div>

        {/* Applied */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {appliedAvatars.map((av, i) => (
              <MemberAvatar key={i} initials={av.initials} bg={av.bg} fg={av.fg} size={16} overlap={i > 0} border="var(--surface)" />
            ))}
          </div>
          <button onClick={onApplied} style={appliedStyle}>
            ✓ {page.appliedBy.length}
          </button>
        </div>
      </div>
    </div>
  );
}
