import Link from "next/link";
import type { ReactNode } from "react";
import Footer from "./Footer";

type Props = {
  title: string;
  subtitle: string;
  updated: string;
  children: ReactNode;
};

export default function LegalPage({ title, subtitle, updated, children }: Props) {
  return (
    <div
      style={{
        background: "#070b12",
        color: "#e8dcc8",
        minHeight: "100vh",
        fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg,#0a0e1a,#0e1420,#12101a)",
          borderBottom: "1px solid #1a1f2e",
          padding: "28px 20px 22px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 9,
            letterSpacing: 5,
            color: "#c9a96e",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          {subtitle}
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: "#f5efe0",
            margin: "0 0 6px",
            letterSpacing: 0.5,
          }}
        >
          {title}
        </h1>
        <p style={{ color: "#6a7080", fontSize: 12, margin: 0 }}>Last updated {updated}</p>
      </div>

      <div
        style={{
          padding: "28px 20px 8px",
          maxWidth: 720,
          margin: "0 auto",
          fontSize: 14,
          color: "#c8c4b8",
          lineHeight: 1.75,
        }}
      >
        {children}
        <div
          style={{
            marginTop: 28,
            paddingTop: 14,
            borderTop: "1px solid #1a1f2e",
            fontSize: 12,
            color: "#6a7080",
          }}
        >
          <Link href="/" style={{ color: "#c9a96e", textDecoration: "none" }}>
            ← Back to simulator
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
