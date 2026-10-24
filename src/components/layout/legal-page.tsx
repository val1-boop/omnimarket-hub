import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/layout/site-footer";

// Estructura de las páginas públicas de texto legal (privacidad y términos).
export function LegalPage({ title, updatedAt, children }: { title: string; updatedAt: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-4 md:px-8">
          <Logo href="/" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-700">Legal</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold uppercase text-navy-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: {updatedAt}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 [&_h2]:font-display [&_h2]:text-sm [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-navy-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}