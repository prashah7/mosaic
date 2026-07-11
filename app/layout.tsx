import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { RootChrome } from "@/components/root-chrome";
import "./globals.css";

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Mosaic · Luci coordination",
  description:
    "Initiative workspace for product managers. Ask Luci before and after meetings, remember decisions, approve follow-ups.",
  icons: {
    icon: "/mosaic-logo.jpg",
    apple: "/mosaic-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${body.variable} ${mono.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <RootChrome>{children}</RootChrome>
      </body>
    </html>
  );
}
