'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  Home,
  Archive,
  BookOpen,
  MessageCircle,
  HelpCircle,
  LogIn,
  Zap,
  Shield,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { label: "Start", href: "/", icon: Home },
  { label: "Vault", href: "/vault", icon: Archive },
  { label: "Templates", href: "/templates", icon: BookOpen },
  { label: "Testimonials", href: "/testimonials", icon: MessageCircle },
  { label: "Help", href: "/help", icon: HelpCircle },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const activePath = useMemo(() => pathname?.split("?")[0] ?? "/", [pathname]);

  return (
    <div className="flex min-h-screen w-full bg-base text-slate-100">
      <aside className="hidden lg:flex w-72 flex-col border-r border-white/5 bg-slate-950/80 px-6 py-8 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 text-lg font-black text-slate-950">
            CR
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Conflict
            </p>
            <p className="text-lg font-semibold text-white">Resolution Lab</p>
          </div>
        </div>
        <div className="mt-10 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? activePath === "/"
                : activePath?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white/5 text-white ring-1 ring-cyan-400/40"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-cyan-300" : "text-slate-500"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-auto space-y-4">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-5">
            <Badge variant="premium">Pro Tier</Badge>
            <p className="mt-3 text-sm text-slate-300">
              You have <span className="text-white font-semibold">32</span>{" "}
              premium credits remaining.
            </p>
            <Button asChild className="mt-4 w-full">
              <Link href="/unlock/credits">
                <Zap className="mr-2 h-4 w-4" />
                Add Credits
              </Link>
            </Button>
          </div>
          <Button
            asChild
            variant="secondary"
            className="w-full border border-white/15"
          >
            <Link href="/auth">
              <LogIn className="mr-2 h-4 w-4" /> Switch Account
            </Link>
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex flex-col gap-4 border-b border-white/5 bg-slate-950/60 px-4 py-4 backdrop-blur-lg sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
              Active Case
            </p>
            <p className="text-lg font-semibold text-white">
              Barrister Toolkit -- Workplace Harassment
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/cases/alpha">
                <Shield className="mr-2 h-4 w-4" />
                Resume War Room
              </Link>
            </Button>
            <Button asChild>
              <Link href="/demo">
                <Zap className="mr-2 h-4 w-4" />
                Launch Demo
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-transparent px-4 py-8 sm:px-8">
          <div className="mx-auto w-full max-w-6xl space-y-10">{children}</div>
        </main>

        <nav className="lg:hidden sticky bottom-0 mt-auto flex items-center justify-between border-t border-white/5 bg-slate-950/90 px-4 py-3 backdrop-blur-xl">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? activePath === "/"
                : activePath?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-semibold uppercase tracking-wide",
                  isActive ? "text-cyan-300" : "text-slate-500"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-cyan-300" : "text-slate-500"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
