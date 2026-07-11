"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Columns3,
  Home,
  Menu,
  Settings,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ReviewProvider } from "@/components/review-store";
import { cn } from "@/lib/utils";
import { SEED_INITIATIVE_ID, workspace } from "@/lib/mosaic-data";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const id = SEED_INITIATIVE_ID;

const primaryNav: NavItem[] = [
  { href: "/initiatives", label: "Initiatives", icon: Columns3 },
  { href: `/initiatives/${id}`, label: "Initiative", icon: Home },
  { href: `/initiatives/${id}/board`, label: "Board", icon: Columns3 },
  { href: `/initiatives/${id}/memory`, label: "Memory", icon: Brain },
  { href: `/initiatives/${id}/ask`, label: "Ask Luci", icon: Sparkles },
];

const isActivePath = (pathname: string, href: string): boolean => {
  if (href === `/initiatives/${id}`) {
    return (
      pathname === href ||
      pathname === `/initiatives/${id}/` ||
      (pathname.startsWith(`/initiatives/${id}/runs/`) && true)
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

const NavLink = ({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) => {
  const Icon = item.icon;
  const active =
    item.label === "Initiative"
      ? pathname === `/initiatives/${id}` ||
        pathname.startsWith(`/initiatives/${id}/runs/`)
      : isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-[6px] text-[13px] transition-colors focus-ring",
        active
          ? "bg-white/[0.06] text-foreground"
          : "text-muted hover:bg-white/[0.04] hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-3.5 shrink-0",
          active ? "text-foreground" : "text-muted-dim group-hover:text-muted",
        )}
      />
      {item.label}
    </Link>
  );
};

const Sidebar = ({
  pathname,
  onNavigate,
  onClose,
  showClose,
}: {
  pathname: string;
  onNavigate?: () => void;
  onClose?: () => void;
  showClose?: boolean;
}) => (
  <aside
    className="flex h-full w-[232px] flex-col border-r border-border bg-[#0c0c0d]"
    aria-label="Primary"
  >
    <div className="flex items-center justify-between px-3 py-3">
      <Link
        href={`/initiatives/${id}`}
        className="flex items-center gap-2 rounded-md px-1 py-0.5 focus-ring"
        onClick={onNavigate}
      >
        <span className="flex size-5 items-center justify-center rounded bg-accent text-[10px] font-bold text-white">
          M
        </span>
        <span className="text-[13px] font-medium tracking-[-0.01em] text-foreground">
          Mosaic
        </span>
      </Link>
      {showClose ? (
        <button
          type="button"
          className="rounded-md p-1 text-muted hover:bg-white/[0.04] focus-ring"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>

    <div className="px-3 pb-2">
      <p className="rounded-md border border-border bg-surface px-2.5 py-2 text-[11px] text-muted">
        <span className="font-medium text-foreground">Enterprise SSO</span>
        <br />
        {workspace.roleTitle}
      </p>
    </div>

    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3 scrollbar-thin">
      {primaryNav.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>

    <div className="space-y-1 border-t border-border p-2">
      <Link
        href="/settings"
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-md px-2 py-[6px] text-[13px] text-muted hover:bg-white/[0.04] hover:text-foreground focus-ring"
      >
        <Settings className="size-3.5" />
        Settings
      </Link>
      <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
        <div className="flex size-6 items-center justify-center rounded-full bg-accent/25 text-[10px] font-semibold text-[#c5caf5]">
          SN
        </div>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-foreground">
            {workspace.ownerName}
          </p>
          <p className="truncate text-[11px] text-muted-dim">
            {workspace.companyName}
          </p>
        </div>
      </div>
    </div>
  </aside>
);

export const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const title = (() => {
    if (pathname.includes("/ask")) return "Ask Luci";
    if (pathname.includes("/board")) return "Board";
    if (pathname.includes("/memory")) return "Memory";
    if (pathname.includes("/runs/")) return "Run";
    if (pathname.startsWith("/settings")) return "Settings";
    return "Initiative";
  })();

  return (
    <ReviewProvider>
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[232px]">
          <Sidebar pathname={pathname} />
        </div>

        {isOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/60"
              aria-label="Close overlay"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 shadow-2xl">
              <Sidebar
                pathname={pathname}
                onNavigate={() => setIsOpen(false)}
                onClose={() => setIsOpen(false)}
                showClose
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-h-screen flex-1 flex-col bg-background lg:pl-[232px]">
          <header className="sticky top-0 z-30 flex h-11 items-center justify-between gap-3 border-b border-border bg-[#0f0f10]/90 px-3 backdrop-blur-md sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="rounded-md p-1.5 text-muted hover:bg-white/[0.04] lg:hidden focus-ring"
                onClick={() => setIsOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="size-4" />
              </button>
              <p className="truncate text-[13px] font-medium text-foreground">
                {title}
              </p>
            </div>
            <Link href={`/initiatives/${id}/ask`}><Button variant="primary" size="sm" leftIcon={<Sparkles className="size-3.5" />}>New run</Button></Link>
          </header>

          <main className="page-enter flex-1 px-3 py-4 sm:px-5 sm:py-5">
            {children}
          </main>
        </div>
      </div>
    </ReviewProvider>
  );
};
