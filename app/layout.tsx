import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://familydynasty.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Family Dynasty Fund Simulator — 150-Year Wealth Planner",
  description:
    "Interactive simulator for planning a multi-generational family trust. Model 3–6 generations of wealth transfer with adjustable returns, distribution rules, and family structure. Created by Jun Loayza.",
  keywords: [
    "dynasty trust",
    "generational wealth",
    "family fund",
    "4% rule",
    "financial planning",
    "wealth simulator",
    "trust planning",
    "generational finance",
  ],
  authors: [{ name: "Jun Loayza", url: "https://www.linkedin.com/in/junloayza/" }],
  creator: "Jun Loayza",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: "Family Dynasty Fund Simulator",
    description:
      "Plan your family's multi-generational wealth across 150 years. Interactive model with adjustable rules, returns, and family structure.",
    url: SITE_URL,
    siteName: "Family Dynasty Fund",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Family Dynasty Fund Simulator",
    description: "Plan your family's multi-generational wealth across 150 years.",
    creator: "@JunLoayza",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#070b12",
          color: "#e8dcc8",
          fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {children}
      </body>
    </html>
  );
}
