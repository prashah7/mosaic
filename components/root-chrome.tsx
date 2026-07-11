"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { MosaicBrand } from "@/components/mosaic-logo";
import {
  OnboardingProvider,
  useOnboarding,
} from "@/components/onboarding-provider";
import { SEED_INITIATIVE_ID } from "@/lib/mosaic-data";

const bareRoutes = [
  "/welcome",
  "/signup",
  "/login",
  "/workspace",
  "/onboarding",
  "/demo",
];

const isSetupPath = (pathname: string): boolean =>
  pathname === "/signup" ||
  pathname.startsWith("/signup/") ||
  pathname === "/workspace" ||
  pathname.startsWith("/workspace/") ||
  pathname === "/onboarding" ||
  pathname.startsWith("/onboarding/") ||
  pathname === "/welcome" ||
  pathname === "/login" ||
  pathname === "/demo" ||
  pathname.startsWith("/demo/");

const BareChrome = ({ children }: { children: ReactNode }) => {
  const { complete, markProgress } = useOnboarding();

  const handleSkip = () => {
    complete();
    markProgress("entered");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <MosaicBrand href="/signup" size="md" showLuci priority />
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="text-muted transition hover:text-foreground focus-ring rounded"
            >
              Sign in
            </Link>
            <Link
              href={`/initiatives/${SEED_INITIATIVE_ID}`}
              onClick={handleSkip}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-border-strong hover:text-foreground pressable focus-ring"
            >
              Skip onboarding
            </Link>
          </div>
        </div>
      </header>
      <main className="page-enter">{children}</main>
    </div>
  );
};

const ReloadToOnboarding = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type !== "reload") return;
    const path = window.location.pathname;
    if (isSetupPath(path)) return;
    router.replace("/signup");
  }, [router]);

  return children;
};

export const RootChrome = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const isBare = bareRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  return (
    <OnboardingProvider>
      <ReloadToOnboarding>
        {isBare ? (
          <BareChrome>{children}</BareChrome>
        ) : (
          <AppShell>{children}</AppShell>
        )}
      </ReloadToOnboarding>
    </OnboardingProvider>
  );
};
