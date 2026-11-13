import type { Metadata, Viewport } from "next";
import { Source_Sans_3 } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { NavProgress } from "@/components/layout/NavProgress";
import { SITE } from "@/lib/site";

const sans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700", "800", "900"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | Recipes, How-Tos, Videos and More`, template: `%s | ${SITE.name}` },
  description: "Find and share everyday cooking inspiration on Simmerly. Discover recipes, cooks, videos and how-tos based on the food you love.",
  openGraph: { siteName: SITE.name, type: "website" },
  icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = { themeColor: "#ce4620", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={sans.variable}><body className="font-sans"><Suspense><NavProgress /></Suspense>{children}</body></html>;
}
