import { Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const QUICK_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/kanban", label: "Kanban" },
  { href: "/productos", label: "Productos" },
];

const LEGAL_LINKS = [
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/terminos", label: "Términos y condiciones" },
];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="font-display text-xs font-bold uppercase tracking-wider text-white">{title}</h2>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-slate-300 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-navy-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-xs text-sm">
            Centro de operaciones para e-commerce: ventas, pedidos y márgenes en tiempo real.
          </p>
        </div>
        <FooterColumn title="Accesos rápidos" links={QUICK_LINKS} />
        <FooterColumn title="Legal" links={LEGAL_LINKS} />
        <div>
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-white">Contacto</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              soporte@omnimarket.test
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              Morelos, México
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-800">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-400 md:px-8">
          © {new Date().getFullYear()} OmniMarket Operations Hub. Proyecto académico.
        </p>
      </div>
    </footer>
  );
}