"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { initiatives, workspace } from "@/lib/mosaic-data";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const mainNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
];

const buildNav: NavItem[] = [
  { href: "/initiatives/init_sso", label: "Initiatives", icon: FolderKanban },
  {
    href: "/initiatives/init_sso/runs/run_sso_1",
    label: "Luci runs",
    icon: Sparkles,
  },
];

const observeNav: NavItem[] = [
  { href: "#", label: "Standards", icon: ShieldCheck },
  { href: "#", label: "Documentation", icon: BookOpen },
  { href: "#", label: "Settings", icon: Settings },
];

const isActivePath = (pathname: string, href: string): boolean => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};

const NavSection = ({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) => (
  <div className="space-y-1">
    <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
      {title}
    </p>
    {items.map((item) => {
      const Icon = item.icon;
      const active = item.href !== "#" && isActivePath(pathname, item.href);
      const className = cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors focus-ring",
        active
          ? "bg-gradient-to-r from-purple/25 via-purple/10 to-transparent text-white shadow-[inset_0_0_0_1px_rgba(155,124,255,0.25)]"
          : "text-muted hover:bg-white/5 hover:text-foreground",
      );
      if (item.href === "#") {
        return (
          <span key={item.label} className={cn(className, "opacity-60")}>
            <Icon className="size-4 shrink-0" />
            {item.label}
          </span>
        );
      }
      return (
        <Link
          key={item.label}
          href={item.href}
          className={className}
          onClick={onNavigate}
        >
          <Icon className="size-4 shrink-0" />
          {item.label}
        </Link>
      );
    })}
  </div>
);

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
    className="flex h-full w-[248px] flex-col border-r border-border bg-[#0b0b0d]"
    aria-label="Primary"
  >
    <div className="flex items-center justify-between px-4 py-4">
      <Link href="/" className="focus-ring rounded-md" onClick={onNavigate}>
        <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-white">
          Mosaic
        </span>
        <span className="ml-2 align-middle text-[10px] font-medium uppercase tracking-[0.16em] text-lime">
          Luci
        </span>
      </Link>
      {showClose ? (
        <button
          type="button"
          className="rounded-md p-1 text-muted hover:text-foreground focus-ring"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X className="size-5" />
        </button>
      ) : null}
    </div>

    <div className="px-3 pb-3">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs text-muted transition hover:border-border-strong focus-ring"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="flex-1">Quick search…</span>
        <kbd className="rounded border border-border bg-surface-overlay px-1.5 py-0.5 font-mono text-[10px] text-muted-dim">
          ⌘K
        </kbd>
      </button>
    </div>

    <nav className="flex-1 space-y-5 overflow-y-auto px-2 pb-4 scrollbar-thin">
      <NavSection
        title="Main"
        items={mainNav}
        pathname={pathname}
        onNavigate={onNavigate}
      />
      <NavSection
        title="Coordinate"
        items={buildNav}
        pathname={pathname}
        onNavigate={onNavigate}
      />
      <div className="space-y-1">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
          Initiatives
        </p>
        {initiatives.slice(0, 4).map((initiative) => (
          <Link
            key={initiative.id}
            href={`/initiatives/${initiative.id}`}
            onClick={onNavigate}
            className={cn(
              "block truncate rounded-lg px-3 py-1.5 text-xs transition focus-ring",
              pathname.includes(initiative.id)
                ? "bg-white/5 text-foreground"
                : "text-muted hover:bg-white/5 hover:text-foreground",
            )}
          >
            {initiative.name}
          </Link>
        ))}
      </div>
      <NavSection
        title="Observe"
        items={observeNav}
        pathname={pathname}
        onNavigate={onNavigate}
      />
    </nav>

    <div className="space-y-2 border-t border-border p-3">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-foreground focus-ring"
      >
        <KeyRound className="size-4" />
        Get API key
      </button>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
        <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-purple to-lime/60 text-xs font-bold text-black">
          SN
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {workspace.ownerName}
          </p>
          <p className="truncate text-[11px] text-muted">{workspace.ownerEmail}</p>
        </div>
      </div>
    </div>
  </aside>
);

export const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const crumbs = (() => {
    if (pathname === "/") return ["Dashboard"];
    if (pathname.includes("/runs/")) return ["Initiatives", "Run detail"];
    if (pathname.includes("/initiatives/")) {
      return ["Initiatives", "Command center"];
    }
    return ["Mosaic"];
  })();

  const handleNavigate = () => setIsOpen(false);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[248px]">
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
              onNavigate={handleNavigate}
              onClose={() => setIsOpen(false)}
              showClose
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col bg-background lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-[#070708]/85 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-md p-1.5 text-muted hover:bg-white/5 hover:text-foreground lg:hidden focus-ring"
              onClick={() => setIsOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-purple" />
                {workspace.name}
              </span>
              {crumbs.map((crumb) => (
                <span key={crumb} className="inline-flex items-center gap-1.5">
                  <span className="text-muted-dim">/</span>
                  <span className="truncate text-foreground/90">{crumb}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="neutral" className="hidden sm:inline-flex">
              DEMO STATE
            </Badge>
            <button
              type="button"
              className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-foreground focus-ring"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
            </button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="size-3.5" />}
              className="hidden sm:inline-flex"
            >
              New run
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-[11px] text-muted-dim sm:px-6">
          <span>© 2026 Mosaic · recommendations require human approval</span>
          <div className="flex gap-4">
            <span>Docs</span>
            <span>Status</span>
            <span>Evidence-first</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
