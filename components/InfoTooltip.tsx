"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = { content: string };

export default function InfoTooltip({ content }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrapRef} style={{ position: "relative", display: "inline-block", marginLeft: 6 }}>
      <button
        type="button"
        aria-label="More information"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: "1px solid #3a4050",
          background: open ? "#c9a96e20" : "transparent",
          color: open ? "#c9a96e" : "#6a7080",
          fontSize: 9,
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
          fontFamily: "inherit",
        }}
      >
        i
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 10,
            maxWidth: 260,
            width: "max-content",
            background: "#0d1117",
            border: "1px solid #2d3340",
            borderRadius: 6,
            padding: 10,
            fontSize: 11,
            color: "#9aa0b0",
            lineHeight: 1.55,
            boxShadow: "0 6px 22px rgba(0,0,0,0.5)",
            fontFamily: "inherit",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
