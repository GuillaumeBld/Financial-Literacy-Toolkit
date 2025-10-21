"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

const authenticatedRoutes: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reports", label: "Reports" },
  { href: "/resources", label: "Resources" }
];

export default function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const { data: session, status } = useSession();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold text-slate-900">
          FinLit Toolkit
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          {status === "authenticated" && (
            <>
              {authenticatedRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={
                    isActive(route.href)
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-800"
                  }
                >
                  {route.label}
                </Link>
              ))}
              {session?.user?.name && (
                <span className="hidden text-slate-500 sm:inline" aria-live="polite">
                  {session.user.name}
                </span>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/start" })}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white shadow-sm hover:bg-slate-700"
              >
                Sign out
              </button>
            </>
          )}
          {status !== "authenticated" && (
            <button
              type="button"
              onClick={() => signIn("lms-sso", { callbackUrl: "/dashboard" })}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-white shadow-sm hover:bg-emerald-700"
            >
              Launch assessment
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
