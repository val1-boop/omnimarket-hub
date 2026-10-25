"use client";

import { LogOut, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { SiteFooter } from "@/components/layout/site-footer";
import { StoreBar, type ActiveStore } from "@/components/layout/store-bar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/server/actions/auth";

type AppShellUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function UserAvatar({ user }: { user: AppShellUser }) {
  if (user.image) {
    return <Image src={user.image} alt="" width={36} height={36} priority className="h-9 w-9 rounded-full" />;
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lilac-100 text-sm font-semibold text-lilac-700">
      {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
    </div>
  );
}

type AppShellProps = { user: AppShellUser; store: ActiveStore; children: ReactNode };

export function AppShell({ user, store, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-3 px-4 md:gap-6 md:px-8">
          <Logo />

          {/* Navegación de escritorio */}
          <nav aria-label="Navegación principal" className="hidden items-center gap-1 rounded-full bg-lilac-50 p-1 md:flex">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  isActive(href) ? "bg-ink-900 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-ink-900",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <UserAvatar user={user} />
            <div className="hidden max-w-40 lg:block">
              <p className="truncate text-sm font-medium text-ink-900">{user.name ?? "Tu cuenta"}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut aria-hidden="true" />
                Cerrar sesión
              </Button>
            </form>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Menú desplegable en móvil */}
        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
            <nav aria-label="Navegación móvil" className="flex flex-col gap-1 py-3">
              {NAV_ITEMS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm font-semibold",
                    isActive(href) ? "bg-ink-900 text-white" : "text-slate-600",
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
              <UserAvatar user={user} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{user.name ?? "Tu cuenta"}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  <LogOut aria-hidden="true" />
                  Cerrar sesión
                </Button>
              </form>
            </div>
          </div>
        )}
      </header>

      <StoreBar store={store} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">{children}</main>

      <SiteFooter />
    </div>
  );
}