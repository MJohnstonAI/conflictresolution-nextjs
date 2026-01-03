import type { ReactNode } from "react";
import Link from "next/link";

type PublicNavKey = "home" | "library" | "about" | "login" | null;

const navLinkClass = (key: PublicNavKey, active: PublicNavKey) =>
  key && key === active ? "font-semibold text-slate-900" : "hover:text-slate-900";

export default function PublicSiteLayout({
  children,
  activeNav = null,
}: {
  children: ReactNode;
  activeNav?: PublicNavKey;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
              CR
            </div>
            <span className="text-sm font-semibold text-slate-900">Conflict Resolution</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <Link className={navLinkClass("home", activeNav)} href="/">
              Home
            </Link>
            <Link className={navLinkClass("library", activeNav)} href="/resources">
              Library
            </Link>
            <Link className={navLinkClass("about", activeNav)} href="/about">
              About
            </Link>
            <Link className={navLinkClass("login", activeNav)} href="/auth?stay=1">
              Login
            </Link>
          </nav>
          <Link
            href="/"
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Start a Case
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
