import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Family Dynasty Fund Simulator";
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
          Dynasty Wealth Planning
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontSize: 110,
              color: "#f5efe0",
              lineHeight: 1.02,
              letterSpacing: -1,
            }}
          >
            Family Dynasty Fund
          </div>
          <div
            style={{
              fontSize: 34,
              color: "#9aa0b0",
              lineHeight: 1.35,
              maxWidth: 960,
            }}
          >
            150-year simulator for multi-generational wealth planning
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 26,
          }}
        >
          <div style={{ color: "#c9a96e" }}>$10M Base · 6 Generations · Interactive</div>
          <div style={{ color: "#6a7080", fontSize: 22 }}>by Jun Loayza</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
