import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { BackLink } from "@/components/back-link";
import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "No encontramos esta página · OmniMarket" };

// Se muestra cuando alguien abre una dirección que no existe en la app.
export default async function NotFound() {
  // Si ya iniciaste sesión, la flecha te regresa al inicio; si no, al login.
  const session = await auth();
  const back = session?.user
    ? { href: "/dashboard", label: "Volver al inicio" }
    : { href: "/login", label: "Volver a iniciar sesión" };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-4 md:px-8">
          <Logo href={back.href} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-8">
        <BackLink href={back.href}>{back.label}</BackLink>
        <div className="rounded-2xl bg-lilac-50 p-10 text-center">
          <p className="text-gradient font-display text-3xl font-extrabold">¡Ups!</p>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink-900">Esta página no existe</h1>
          <p className="mt-3 text-sm text-slate-600">
            Puede que la dirección esté mal escrita o que la página ya no esté. Regresa y sigue desde ahí.
          </p>
          <Link href={back.href} className={buttonVariants({ className: "mt-8" })}>
            {back.label}
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
