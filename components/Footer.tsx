import Link from "next/link";

const linkStyle: React.CSSProperties = {
  color: "#c9a96e",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  padding: "8px 14px",
  border: "1px solid #1a1f2e",
  borderRadius: 6,
  background: "#0d1117",
};

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid #1a1f2e",
        marginTop: 12,
        padding: "28px 20px 40px",
        maxWidth: 780,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: 3,
          color: "#c9a96e",
          textTransform: "uppercase",
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Learn More About Jun
      </div>
      <p
        style={{
          color: "#6a7080",
          fontSize: 13,
          lineHeight: 1.75,
          textAlign: "center",
          maxWidth: 560,
          margin: "0 auto 18px",
        }}
      >
        Jun Loayza works across multiple ventures including The Octalysis Group, Chou Force, and an
        Influencer Incubator. He built this simulator to explore multi-generational wealth strategies.
      </p>
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <a
          href="https://www.linkedin.com/in/junloayza/"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.024-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455v6.288zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          LinkedIn
        </a>
        <a
          href="https://x.com/JunLoayza"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X (Twitter)
        </a>
      </div>
      <div
        style={{
          display: "flex",
          gap: 20,
          justifyContent: "center",
          flexWrap: "wrap",
          fontSize: 11,
          color: "#4a5060",
        }}
      >
        <Link href="/privacy" style={{ color: "#6a7080", textDecoration: "none" }}>
          Privacy Policy
        </Link>
        <Link href="/terms" style={{ color: "#6a7080", textDecoration: "none" }}>
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}
