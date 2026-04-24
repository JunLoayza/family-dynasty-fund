"use client";

import { useEffect, useState } from "react";
import { MODELS, type ClaudeModel } from "@/lib/claude";
import {
  clearKey,
  loadKey,
  looksLikeApiKey,
  saveKey,
  storageAvailable,
  type StorageMode,
} from "@/lib/keyStorage";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (key: string, model: ClaudeModel) => void;
  currentModel: ClaudeModel;
};

export default function AIAnalysisModal({ open, onClose, onSaved, currentModel }: Props) {
  const [key, setKey] = useState("");
  const [model, setModel] = useState<ClaudeModel>(currentModel);
  const [mode, setMode] = useState<StorageMode>("local");
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [avail, setAvail] = useState<{ local: boolean; session: boolean }>({ local: true, session: true });

  useEffect(() => {
    if (!open) return;
    setAvail(storageAvailable());
    const saved = loadKey();
    setHasSavedKey(Boolean(saved.key));
    setMode(saved.mode);
    if (saved.model) setModel(saved.model as ClaudeModel);
    else setModel(currentModel);
    setKey("");
    setErr(null);
  }, [open, currentModel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed) {
      setErr("Please paste your API key.");
      return;
    }
    if (!looksLikeApiKey(trimmed)) {
      setErr("That doesn't look like an Anthropic API key. It should start with sk-ant-api.");
      return;
    }
    const canUse = mode === "local" ? avail.local : avail.session;
    if (!canUse) {
      setErr(
        mode === "local"
          ? "localStorage is blocked in this browser. Switch to session storage."
          : "sessionStorage is blocked in this browser.",
      );
      return;
    }
    saveKey(trimmed, model, mode);
    onSaved(trimmed, model);
    onClose();
  };

  const handleRemove = () => {
    clearKey();
    setHasSavedKey(false);
    setKey("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(3,5,10,0.72)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0a0e1a",
          border: "1px solid #2a2f3e",
          borderRadius: 10,
          maxWidth: 560,
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "24px 24px 20px",
          fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif",
          color: "#e8dcc8",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#c9a96e", textTransform: "uppercase" }}>
              Optional Feature
            </div>
            <h2 id="ai-modal-title" style={{ fontSize: 20, fontWeight: 400, margin: "4px 0 2px", color: "#f5efe0" }}>
              Unlock AI Deep Analysis
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: "#6a7080",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
              padding: 0,
              marginTop: -4,
            }}
          >
            ×
          </button>
        </div>

        <p style={{ fontSize: 13, color: "#9aa0b0", lineHeight: 1.7, margin: "14px 0 12px" }}>
          Templates give you the basics. AI gives you the narrative. With your Anthropic API key, Claude analyzes your
          specific configuration and writes personalized insights for:
        </p>
        <ul style={{ fontSize: 12, color: "#9aa0b0", lineHeight: 1.75, paddingLeft: 18, margin: "0 0 14px" }}>
          <li>
            <strong style={{ color: "#e8dcc8" }}>Critical Analysis</strong> — tailored risk assessment for your exact
            variables.
          </li>
          <li>
            <strong style={{ color: "#e8dcc8" }}>Recommended Refinements</strong> — actionable tweaks ranked by impact.
          </li>
          <li>
            <strong style={{ color: "#e8dcc8" }}>Verdict</strong> — plain-English summary of what works and what to
            change first.
          </li>
        </ul>
        <div
          style={{
            fontSize: 11,
            color: "#6a7080",
            background: "#090d15",
            border: "1px solid #1a1f2e",
            borderRadius: 6,
            padding: "10px 12px",
            marginBottom: 18,
            lineHeight: 1.65,
          }}
        >
          Typical cost per analysis: <strong style={{ color: "#c9a96e" }}>$0.01–$0.03</strong> (Sonnet) or{" "}
          <strong style={{ color: "#c9a96e" }}>$0.05–$0.15</strong> (Opus). Your key is stored only on this device and
          sent directly to Anthropic — it never touches our servers.
        </div>

        <div style={{ fontSize: 10, letterSpacing: 2, color: "#c9a96e", textTransform: "uppercase", marginBottom: 8 }}>
          How to get an API key
        </div>
        <ol style={{ fontSize: 12, color: "#9aa0b0", lineHeight: 1.75, paddingLeft: 20, margin: "0 0 18px" }}>
          <li>
            Visit{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#c9a96e" }}
            >
              console.anthropic.com/settings/keys
            </a>
          </li>
          <li>Sign in and click &quot;Create Key&quot;.</li>
          <li>
            Copy the key (starts with <code style={{ color: "#c9a96e" }}>sk-ant-api03-</code>) and paste below.
          </li>
        </ol>

        <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: "#c9a96e", textTransform: "uppercase", marginBottom: 6 }}>
          Model
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as ClaudeModel)}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "#0d1117",
            border: "1px solid #2a2f3e",
            color: "#e8dcc8",
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 4,
            fontFamily: "inherit",
          }}
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} — {m.blurb}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 10, color: "#4a5060", marginBottom: 16 }}>
          You can switch models anytime. Pricing varies per Anthropic&apos;s rates.
        </div>

        <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: "#c9a96e", textTransform: "uppercase", marginBottom: 6 }}>
          API Key
        </label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={hasSavedKey ? "A key is already saved — paste a new one to replace" : "sk-ant-api03-..."}
          autoComplete="off"
          spellCheck={false}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "#0d1117",
            border: "1px solid #2a2f3e",
            color: "#e8dcc8",
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 12,
            fontFamily: "monospace",
          }}
        />

        <div style={{ fontSize: 10, letterSpacing: 2, color: "#c9a96e", textTransform: "uppercase", marginBottom: 8 }}>
          Storage
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          <label style={{ display: "flex", gap: 10, fontSize: 12, color: "#9aa0b0", alignItems: "flex-start", cursor: "pointer" }}>
            <input
              type="radio"
              name="mode"
              checked={mode === "local"}
              onChange={() => setMode("local")}
              style={{ marginTop: 3 }}
            />
            <span>
              <strong style={{ color: "#e8dcc8" }}>Remember on this device</strong> (localStorage) — key persists across
              browser sessions until you remove it.
              {!avail.local && <span style={{ color: "#f87171", display: "block" }}>Blocked in this browser.</span>}
            </span>
          </label>
          <label style={{ display: "flex", gap: 10, fontSize: 12, color: "#9aa0b0", alignItems: "flex-start", cursor: "pointer" }}>
            <input
              type="radio"
              name="mode"
              checked={mode === "session"}
              onChange={() => setMode("session")}
              style={{ marginTop: 3 }}
            />
            <span>
              <strong style={{ color: "#e8dcc8" }}>This session only</strong> (sessionStorage) — key clears when you
              close the tab. Better for shared machines.
              {!avail.session && <span style={{ color: "#f87171", display: "block" }}>Blocked in this browser.</span>}
            </span>
          </label>
        </div>

        {err && (
          <div
            style={{
              background: "#1a0b0d",
              border: "1px solid #3a1f1f",
              borderRadius: 6,
              color: "#f87171",
              fontSize: 12,
              padding: "8px 10px",
              marginBottom: 12,
            }}
          >
            {err}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 6 }}>
          {hasSavedKey && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                background: "transparent",
                border: "1px solid #3a1f1f",
                color: "#f87171",
                padding: "10px 14px",
                borderRadius: 6,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Remove my key
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid #2a2f3e",
              color: "#9aa0b0",
              padding: "10px 14px",
              borderRadius: 6,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              background: "#c9a96e",
              border: "1px solid #c9a96e",
              color: "#0a0e1a",
              padding: "10px 16px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Save &amp; Enable AI
          </button>
        </div>
      </div>
    </div>
  );
}
