"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { MosaicLogo } from "@/components/mosaic-logo";
import { OnboardingProvider } from "@/components/onboarding-provider";

const bareRoutes = ["/welcome", "/signup", "/login", "/onboarding", "/demo"];

export const RootChrome = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const isBare = bareRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  return (
    <OnboardingProvider>
      {isBare ? (
        <div className="min-h-screen bg-background text-foreground">
          <header className="border-b border-border/80">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
              <Link
                href="/welcome"
                className="flex items-center gap-2.5 rounded-md transition hover:opacity-90 focus-ring"
              >
                <MosaicLogo size="md" priority />
                <span className="text-[18px] font-semibold tracking-[-0.03em] text-foreground">
                  Mosaic
                  <span className="ml-2 align-middle text-[10px] font-medium uppercase tracking-[0.16em] text-accent">
                    Luci
                  </span>
                </span>
              </Link>
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href="/login"
                  className="text-muted transition hover:text-foreground focus-ring rounded"
                >
                  Sign in
                </Link>
                <Link
                  href="/demo"
                  className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-hover pressable focus-ring"
                >
                  Enter demo
                </Link>
              </div>
            </div>
          </header>
          <main className="page-enter">{children}</main>
        </div>
      ) : (
        <AppShell>{children}</AppShell>
      )}
    </OnboardingProvider>
  );
};
