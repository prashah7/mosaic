import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Mosaic — Project memory for Product Managers",
  description: "Luci prepares meetings, synthesizes decisions, and keeps complex initiatives moving.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Mosaic — Luci remembers the initiative",
    description: "Project memory for Product Managers",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Mosaic — Luci remembers the initiative" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mosaic — Luci remembers the initiative",
    description: "Project memory for Product Managers",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
