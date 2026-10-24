"use client";

import { LogOut, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/server/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/kanban", label: "Kanban" },
  { href: "/productos", label: "Productos" },
];

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
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-100 text-sm font-semibold text-sand-700">
      {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
    </div>
  );
}

export function AppShell({ user, children }: { user: AppShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 md:px-8">
          <Logo />

          {/* Navegación de escritorio */}
          <nav aria-label="Navegación principal" className="hidden items-center gap-8 md:flex">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "border-b-2 py-1 text-xs font-semibold uppercase tracking-widest transition-colors",
                  isActive(href)
                    ? "border-navy-900 text-navy-900"
                    : "border-transparent text-slate-500 hover:text-navy-900",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <UserAvatar user={user} />
            <div className="hidden max-w-40 lg:block">
              <p className="truncate text-sm font-medium text-navy-900">{user.name ?? "Usuario"}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Cerrar sesión" title="Cerrar sesión">
                <LogOut />
              </Button>
            </form>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Menú desplegable en móvil */}
        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
            <nav aria-label="Navegación móvil" className="flex flex-col py-2">
              {NAV_ITEMS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "border-l-2 px-3 py-3 text-xs font-semibold uppercase tracking-widest",
                    isActive(href) ? "border-navy-900 bg-sand-50 text-navy-900" : "border-transparent text-slate-500",
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
              <UserAvatar user={user} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy-900">{user.name ?? "Usuario"}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  <LogOut aria-hidden="true" />
                  Salir
                </Button>
              </form>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">{children}</main>

      <SiteFooter />
    </div>
  );
}