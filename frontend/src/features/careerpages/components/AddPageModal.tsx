"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onAdd: (page: { url: string; company: string; label: string }) => void;
}

export default function AddPageModal({ onClose, onAdd }: Props) {
  const [url, setUrl] = useState("");
  const [company, setCompany] = useState("");
  const [label, setLabel] = useState("");

  const canSubmit = url.trim() && company.trim();

  function submit() {
    if (!canSubmit) return;
    onAdd({ url: url.trim(), company: company.trim(), label: label.trim() });
    onClose();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    fontFamily: "inherit",
    fontSize: 13,
    color: "var(--text)",
    background: "var(--surface2)",
    border: "1.5px solid var(--border)",
    borderRadius: 11,
    padding: "10px 12px",
    outline: "none",
  };

  return (
    <div
      onClick={onClose}
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
          maxWidth: 440,
          color: "var(--text)",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: 22,
          boxShadow: "0 24px 70px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "22px 22px 16px" }}>
          <h3
            style={{
              margin: "0 0 4px",
              fontFamily: "var(--font-dm-serif)",
              fontSize: 20,
              letterSpacing: "-0.01em",
            }}
          >
            Track a new page
          </h3>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--text3)" }}>
            A filtered search URL for the crew
          </p>
        </div>

        <div style={{ padding: "0 22px", display: "flex", flexDirection: "column", gap: 13 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>
              Search URL
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://company.com/careers?q=swe"
              style={{ ...inputStyle, fontFamily: "var(--font-geist-mono)", fontSize: 12.5 }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>
                Company
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Stripe"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>
                Label
              </label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Backend · Remote"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "18px 22px" }}>
          <button
            onClick={onClose}
            style={{
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text2)",
              background: "transparent",
              border: "1.5px solid var(--border)",
              padding: "9px 17px",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            style={{
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              padding: "9px 18px",
              borderRadius: 999,
              border: "1.5px solid",
              cursor: canSubmit ? "pointer" : "not-allowed",
              transition: "all .15s",
              color: canSubmit ? "var(--accent-text)" : "var(--text3)",
              background: canSubmit ? "var(--accent)" : "var(--surface3)",
              borderColor: canSubmit ? "var(--accent)" : "var(--border)",
            }}
          >
            Add page
          </button>
        </div>
      </div>
    </div>
  );
}
