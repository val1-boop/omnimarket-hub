import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export function SiteFooter() {
  return (
    <footer className="bg-navy-900 text-slate-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start md:justify-between md:px-8">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-sm text-sm">
            Aquí sigues cada pedido de OmniMarket: desde que entra hasta que llega a la puerta de tu cliente.
          </p>
        </div>
        <nav aria-label="Secciones">
          <ul className="flex flex-wrap gap-x-8 gap-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-slate-300 transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-navy-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-5 text-xs text-slate-400 md:flex-row md:justify-between md:px-8">
          <p>
            © {new Date().getFullYear()} OmniMarket · Proyecto escolar ·{" "}
            <Link href="/privacidad" className="underline hover:text-white">
              Aviso de privacidad
            </Link>
          </p>
          <p>Lo que registras en “Mi tienda” es solo tuyo. La tienda de demostración tiene datos de ejemplo.</p>
        </div>
      </div>
    </footer>
  );
}