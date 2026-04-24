import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Family Dynasty Simulator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg,#0a0e1a 0%,#0e1420 55%,#12101a 100%)",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#e8dcc8",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 8,
            color: "#c9a96e",
            textTransform: "uppercase",
          }}
        >
          Multi-Generational Wealth Planning
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 128,
              color: "#f5efe0",
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            Family Dynasty
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#9aa0b0",
              lineHeight: 1.35,
              maxWidth: 980,
            }}
          >
            Plan your family&apos;s multi-generational wealth across 6 generations. Interactive models with
            adjustable rules, returns, and family structure.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 26,
              color: "#c9a96e",
              letterSpacing: 3,
              textTransform: "uppercase",
              fontSize: 18,
            }}
          >
            <span>Adjustable Rules</span>
            <span style={{ color: "#3a4050" }}>·</span>
            <span>Returns</span>
            <span style={{ color: "#3a4050" }}>·</span>
            <span>Family Structure</span>
          </div>
          <div style={{ color: "#6a7080" }}>by Jun Loayza</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
