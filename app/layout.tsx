import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const deploymentHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL ??
  "zero-product-concept.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${deploymentHost}`),
  title: "ZERO — Real Taste. Zero Sugar.",
  description:
    "A kinetic fictional product experience for a cola-zero drink built with Next.js and Three.js.",
  applicationName: "ZERO",
  openGraph: {
    type: "website",
    title: "ZERO — Real Taste. Zero Sugar.",
    description:
      "A kinetic fictional product experience for a cola-zero drink built with Next.js and Three.js.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZERO — Real Taste. Zero Sugar.",
    description: "The black can that gives up nothing.",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
